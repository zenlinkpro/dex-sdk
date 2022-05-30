import { AssetType, StandardPool, Token, TokenAmount, StandardPair as RegularPair } from '@zenlink-dex/sdk-core';

import { StandardPoolModule } from './index';
import { parseTokenSymbol, parseTokenType } from '../../balance/ModuleBAssetBalance';
import { ApiPromise } from '@polkadot/api';

function formatBootstrapInfoJson (sourceJson: any = {}) {
  return {
    accumulatedSupply: sourceJson.accumulated_supply ?? sourceJson.accumulatedSupply ?? [],
    capacitySupply: sourceJson.capacity_supply ?? sourceJson.capacitySupply ?? [],
    targetSupply: sourceJson.target_supply ?? sourceJson.targetSupply ?? [],
    totalSupply: sourceJson.total_supply ?? sourceJson.totalSupply,
    endBlockNumber: sourceJson.end_block_number ?? sourceJson.endBlockNumber
  };
}

const computeModulePairOfTokens = (tokens: Token[]): RegularPair[] => {
  const regularPair = tokens.reduce((total, tokenA, index) => {
    const restTokens = tokens.slice(index);

    restTokens.reduce((restTotal, tokenB) => {
      if (
        (tokenA.chainId !== tokenB.chainId) ||
        (tokenA.assetType !== AssetType.NATIVE_TOKEN && tokenA.assetType !== AssetType.NORMAL_TOKEN) ||
        (tokenB.assetType !== AssetType.NATIVE_TOKEN && tokenB.assetType !== AssetType.NORMAL_TOKEN) ||
        tokenA.assetId === tokenB.assetId
      ) {
        return restTotal;
      }

      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA];

      const tokenMeta = tokenA.assetMeta;

      const lpToken = new Token({
        ...tokenMeta,
        address: '',
        assetType: 255,
        decimals: 12, // module lp token decimal is 12
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

export class ModuleBStandardPool implements StandardPoolModule {
  public readonly provider: any;
  public readonly api: any;

  public readonly options: any;
  public constructor (api: ApiPromise) {
    this.api = api;
  }

  public async pairsOfTokens (
    tokens: Token[]
  ) {
    const regularPair = computeModulePairOfTokens(tokens);
    const result = await Promise.all(regularPair.map(async (pair) => {
      const asset0 = {
        chainId: pair.token0.chainId,
        assetType: pair.token0.assetType,
        assetIndex: pair.token0.meta.assetIndex
      };

      const asset1 = {
        chainId: pair.token1.chainId,
        assetType: pair.token1.assetType,
        assetIndex: pair.token1.meta.assetIndex
      };
      const pairStatus = await this.api.query.zenlinkProtocol.pairStatuses([
        asset0,
        asset1
      ]);

      if (pairStatus.isTrading) {
        const pairAccount = pairStatus.value.pairAccount.toString();

        return {
          lpToken: new Token({
            ...pair.lpToken.meta,
            address: pairAccount
          }),
          token0: pair.token0,
          token1: pair.token1
        };
      }
      return undefined;
    }));

    const regularPairs = result.filter((item) => !!item) as RegularPair[];

    return Promise.resolve(regularPairs);
  }

  public async reserveOfPair (
    pair: RegularPair
  ) {
    const { lpToken: token, token0: asset0, token1: asset1 } = pair;

    if (!asset0 || !asset1) return;
    let asset0Reserve;
    let asset1Reserve;

    switch (asset0.assetType) {
      case AssetType.NATIVE_TOKEN:
        asset0Reserve = this.api.query.system.account(token.meta.address).then((res: any) => res.data);
        break;

      case AssetType.NORMAL_TOKEN:
        asset0Reserve = this.api.query.tokens.accounts(token.meta.address, {
          [parseTokenType(asset0.meta.assetIndex)]: parseTokenSymbol(asset0.meta.assetIndex)
        });
        break;

      default:
        break;
    }

    switch (asset1.assetType) {
      case AssetType.NATIVE_TOKEN:
        asset0Reserve = this.api.query.system.account(token.meta.address).then((res: any) => res.data);
        break;

      case AssetType.NORMAL_TOKEN:
        asset1Reserve = this.api.query.tokens.accounts(token.meta.address, {
          [parseTokenType(asset1.meta.assetIndex)]: parseTokenSymbol(asset1.meta.assetIndex)
        });
        break;

      default:
        break;
    }

    if (!asset0Reserve || !asset1Reserve) return;

    const [
      totalLiquidityResult,
      reserve0Result,
      reserve1Result
    ]: any[] = await Promise.all([
      this.api.query.zenlinkProtocol.pairStatuses(
        [
          {
            chainId: asset0.chainId,
            assetType: asset0.assetType,
            assetIndex: asset0.meta.assetIndex
          },
          {
            chainId: asset1.chainId,
            assetType: asset1.assetType,
            assetIndex: asset1.meta.assetIndex
          }
        ]
      ),
      asset0Reserve,
      asset1Reserve
    ]);

    let totalLiquidity = '0';
    let reserve0 = '0';
    let reserve1 = '0';

    if (!totalLiquidityResult.isTrading) return;
    const totalLiquidityResultJson = formatBootstrapInfoJson(totalLiquidityResult.asTrading);

    totalLiquidity = totalLiquidityResultJson.totalSupply?.toHex() ?? '0';
    reserve0 = reserve0Result?.free.toHex();
    reserve1 = reserve1Result?.free.toHex();

    const lpTokenAmount = new TokenAmount(token, totalLiquidity);

    const token0Amount = new TokenAmount(asset0, reserve0);
    const token1Amount = new TokenAmount(asset1, reserve1);

    return new StandardPool(lpTokenAmount, token0Amount, token1Amount);
  }

  public async reserveOfPairList (
    pairList: RegularPair[]
  ) {
    try {
      const promiseList = pairList.map((item) => {
        return this.reserveOfPair(item);
      });

      const result = await Promise.all(promiseList);

      return result.filter((item) => !!item) as StandardPool[];
    } catch (error) {
      return [];
    }
  }
}
