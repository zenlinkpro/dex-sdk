/* eslint-disable sort-keys */
import { Contract } from 'ethers';
import { AssetType, Token, TokenAmount, computePairAddress, StandardPair as RegularPair, StandardPool } from '@zenlink-dex/sdk-core';
import { StandardPoolModule } from './index';
import * as PairContractJson from '../../abi/PairAbi';
import { encodeEvmCallData, decodeEvmCallResult } from '../../abi/util/transactionCall';
import { getMulticallResult } from '../../abi/util/multicall';
import { EvmChainOption } from '../../chain';
export interface EvmMultiCallBalanceOptions {
  multicall2: string;
  factory: string;
  initCodeHash: string;
}

export interface PairContractOptions {
  factory: string;
  initCodeHash: string;
}

export const computePairOfTokens = (tokens: Token[], options: PairContractOptions): RegularPair[] => {
  const regularPair = tokens.reduce((total, tokenA, index) => {
    const restTokens = tokens.slice(index);

    restTokens.reduce((restTotal, tokenB) => {
      if (
        (tokenA.chainId !== tokenB.chainId) ||
        (tokenA.assetType !== AssetType.EVM_TOKEN) ||
        (tokenB.assetType !== AssetType.EVM_TOKEN) ||
        tokenA.assetId === tokenB.assetId
      ) {
        return restTotal;
      }

      const address = computePairAddress({
        factoryAddress: options.factory,
        initCodeHash: options.initCodeHash,
        tokenA: tokenA,
        tokenB: tokenB
      });

      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA];

      const tokenMeta = tokenA.assetMeta;

      const lpToken = new Token({
        ...tokenMeta,
        address,
        decimals: 18, // lp token decimal is 18
        name: `${token0.symbol}-${token1.symbol}-LP`,
        symbol: `${token0.symbol}-${token1.symbol}-LP`
      });

      restTotal.push({
        lpToken: lpToken,
        token0: token0,
        token1: token1
      });

      return restTotal;
    }, total);

    return total;
  }, [] as RegularPair[]);

  return regularPair;
};

export class EvmStandardPool implements StandardPoolModule {
  public readonly provider: any;
  public readonly options: EvmChainOption;
  public constructor (provider: any, options: EvmChainOption) {
    this.provider = provider;
    this.options = options;
  }

  public pairsOfTokens (
    tokens: Token[]
  ) {
    const pairs = computePairOfTokens(tokens, {
      factory: this.options.factoryAddress,
      initCodeHash: this.options.initCodeHash
    });

    return Promise.resolve(pairs);
  }

  public async reserveOfPair (
    pair: RegularPair
  ) {
    const { lpToken, token0, token1 } = pair;
    const pairContractInstance = new Contract(lpToken.meta.address, PairContractJson.abi, this.provider);

    if (!pairContractInstance) return undefined;
    let totalLiquidity = '0';
    let reserve0 = '0';
    let reserve1 = '0';

    try {
      const [
        reservesResult,
        totalSupplyResult
      ] = await Promise.all([
        pairContractInstance.getReserves(),
        pairContractInstance.totalSupply()
      ]);

      totalLiquidity = totalSupplyResult.toHexString();
      reserve0 = reservesResult[0].toHexString();
      reserve1 = reservesResult[1].toHexString();
    } catch {
      return undefined;
    }

    const totalLiquidityAmount = new TokenAmount(token0, totalLiquidity);

    const token0Amount = new TokenAmount(token0, reserve0);
    const token1Amount = new TokenAmount(token1, reserve1);

    return new StandardPool(totalLiquidityAmount, token0Amount, token1Amount);
  }

  public async reserveOfPairList (
    pairList: RegularPair[]
  ) {
    try {
      const basicCalls = [
        { method: 'getReserves', params: [] },
        { method: 'totalSupply', params: [] }
      ];

      const contractAbi = PairContractJson.abi;
      const calls = pairList.map((pair) => {
        return {
          contract: pair.lpToken.meta.address,
          calls: basicCalls.map(({ method, params }) => ({
            method,
            callData: encodeEvmCallData(contractAbi, method, params)
          })),
          pair
        };
      });
      const callResults = await getMulticallResult(this.options.multicall2, this.provider, calls);

      if (!callResults) return [];
      const decodeResults = callResults.map((result, index) => {
        try {
          const regularPair = calls[index].pair;
          const [
            reserves,
            totalSupply
          ] = result.map((r: any, i: any) => {
            if (r.returnData && r.returnData !== '0x') {
              return decodeEvmCallResult(contractAbi, basicCalls[i].method, r.returnData);
            }

            return undefined;
          });

          if (!reserves || !totalSupply) return undefined;

          const totalLiquidity = totalSupply?.[0]?.toHexString() ?? '0';

          const reserve0 = reserves?.[0]?.toHexString() ?? '0';
          const reserve1 = reserves?.[1]?.toHexString() ?? '0';

          const totalLiquidityAmount = new TokenAmount(regularPair.lpToken, totalLiquidity);

          const token0Amount = new TokenAmount(regularPair.token0, reserve0);
          const token1Amount = new TokenAmount(regularPair.token1, reserve1);

          return new StandardPool(
            totalLiquidityAmount,
            token0Amount,
            token1Amount
          );
        } catch (error) {
          return undefined;
        }
      });
      const result = decodeResults.filter((item) => !!item);

      return result as StandardPool[];
    } catch (error) {
      return [];
    }
  }
}
