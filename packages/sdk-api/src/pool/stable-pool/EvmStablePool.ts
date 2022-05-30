
import { decodeEvmCallResult, encodeEvmCallData } from '../../abi/util/transactionCall';
import { StablePoolModule } from './index';
import { abi as swapAbi } from '../../abi/StableSwapAbi';
import { abi as erc20Abi } from '../../abi/ERC20Abi';
import JSBI from 'jsbi';

import { getMulticallResult } from '../../abi/util/multicall';
import { AssetType, StablePair, StableSwap, Token, TokenAmount } from '@zenlink-dex/sdk-core';
import { EvmChainOption } from '../../chain';

export class EvmStablePool implements StablePoolModule {
  public readonly provider: any;
  public readonly options: EvmChainOption;
  public constructor (provider: any, options: EvmChainOption) {
    this.provider = provider;
    this.options = options;
  }

  public async stablePairsOf (contracts: string[] = []) {
    try {
      const basicSwapCalls = [
        { method: 'getTokens', params: [] },
        { method: 'getLpToken', params: [] },
        { method: 'getTokenBalances', params: [] },
        { method: 'swapStorage', params: [] },
        { method: 'getA', params: [] },
        { method: 'getVirtualPrice', params: [] }
      ];

      const swapCalls = contracts.map((contract) => ({
        contract,
        calls: basicSwapCalls.map(({ method, params }) => ({
          method,
          callData: encodeEvmCallData(swapAbi, method, params)
        }))
      }));

      const swapCallResults = await getMulticallResult(this.options.multicall2, this.provider, swapCalls);
      if (!swapCallResults) return [];
      const decodedSwapResults = swapCallResults.map((results) => {
        const [
          pooledTokens,
          lpToken,
          balances,
          storage,
          A,
          virtualPrice
        ] = results.map((r: any, i: number) => decodeEvmCallResult(swapAbi, basicSwapCalls[i].method, r.returnData));

        return { pooledTokens, lpToken, balances, storage, A, virtualPrice };
      });

      const basicLpInfoCalls = [
        { method: 'name', params: [] },
        { method: 'symbol', params: [] },
        { method: 'totalSupply', params: [] }
      ];

      const lpInfoCalls = decodedSwapResults.map(({ lpToken }) => ({
        contract: lpToken[0],
        calls: basicLpInfoCalls.map(({ method, params }) => ({
          method,
          callData: encodeEvmCallData(erc20Abi, method, params)
        }))
      }));

      const lpInfoCallResults = await getMulticallResult(this.options.multicall2, this.provider, lpInfoCalls);

      if (!lpInfoCallResults) return [];
      const decodedLpInfoResults = lpInfoCallResults.map((results) => {
        const [name, symbol, totalSupply] =
          results.map((r: any, i: number) => decodeEvmCallResult(erc20Abi, basicLpInfoCalls[i].method, r.returnData));

        return { name, symbol, totalSupply };
      });

      const swapInfo = decodedSwapResults.map(({ A, balances, lpToken, pooledTokens, storage, virtualPrice }, i) => ({
        contract: contracts[i],
        pooledTokens: pooledTokens[0],
        lpToken: lpToken[0],
        lpName: decodedLpInfoResults[i].name[0],
        lpSymbol: decodedLpInfoResults[i].symbol[0],
        balances: balances[0].map((balance: any) => balance.toString()),
        totalSupply: decodedLpInfoResults[i].totalSupply[0].toString(),
        fee: storage.fee.toString(),
        adminFee: storage.adminFee.toString(),
        A: A[0].toString(),
        virtualPrice: virtualPrice[0].toString()
      }));

      const allTokens = swapInfo.reduce((total, cur) => {
        total.add((cur.lpToken.toLowerCase()));

        cur.pooledTokens.reduce((p: Set<string>, c: string) => {
          p.add(c.toLowerCase());
          return p;
        }, total);

        return total;
      }, new Set<string>());

      const baseErc20InfoCalls = [
        { method: 'name', params: [] },
        { method: 'symbol', params: [] },
        { method: 'totalSupply', params: [] },
        { method: 'decimals', params: [] }
      ];

      const tokensAddress = Array.from(allTokens);

      const erc20InfoCalls = tokensAddress.map((contract) => ({
        contract,
        calls: baseErc20InfoCalls.map(({ method, params }) => ({
          method,
          callData: encodeEvmCallData(erc20Abi, method, params)
        }))
      }));
      const erc20InfoCallResults = await getMulticallResult(this.options.multicall2, this.provider, erc20InfoCalls);

      if (!erc20InfoCallResults) return [];
      const decodeErc20InfoResults = erc20InfoCallResults.map((results) => {
        const [name, symbol, totalSupply, decimals] =
          results.map((r: any, i: number) => decodeEvmCallResult(erc20Abi, baseErc20InfoCalls[i].method, r.returnData));

        return { decimals: decimals?.[0], name: name?.[0], symbol: symbol?.[0], totalSupply: totalSupply?.[0].toString() };
      });

      const tokens = decodeErc20InfoResults.map((item, i) => {
        const { decimals, name, symbol } = item;

        const { networkId, chainId } = this.options;

        return new Token({
          assetType: AssetType.EVM_TOKEN,
          assetIndex: 0,
          chainId: chainId,
          networkId: networkId,
          address: tokensAddress[i].toLowerCase(),
          name,
          symbol,
          decimals
        });
      });

      const tokensMap: Record<string, Token> = tokens.reduce((total, cur) => {
        total[cur.assetId] = cur;
        return total;
      }, {} as Record<string, Token>);

      const stablePairs = swapInfo.map((item) => {
        const { networkId, chainId } = this.options;
        return {
          ...item,
          address: item.contract,
          lpToken: tokensMap[`${networkId}-${chainId}-${AssetType.EVM_TOKEN}-${item.lpToken}`.toLowerCase()],
          pooledTokens: item.pooledTokens.map((t: any) => {
            return tokensMap[`${networkId}-${chainId}-${AssetType.EVM_TOKEN}-${t}`.toLowerCase()];
          })
        };
      });

      return stablePairs;
    } catch (error) {
      return [];
    }
  }

  public async stablePoolsOf (pairs: StablePair[]) {
    const poolsInfo = await this.stablePairsOf(pairs.map((item) => item.address));

    const pools = poolsInfo.map((item) => {
      const lpToken = item.lpToken;
      const totalSupply = new TokenAmount(lpToken, item.totalSupply);
      const pooledTokens = item.pooledTokens as Token[];
      const pooledBalances = item.balances;

      const balances = pooledTokens.map((token: Token, index) => {
        return new TokenAmount(token, pooledBalances[index]);
      });

      return new StableSwap(
        item.lpToken.chainId,
        item.address,
        item.pooledTokens,
        item.lpToken,
        totalSupply,
        balances,
        JSBI.BigInt(item.fee),
        JSBI.BigInt(item.adminFee),
        JSBI.BigInt(item.A),
        JSBI.BigInt(item.virtualPrice)
      );
    });
    return pools as any;
  }
}
