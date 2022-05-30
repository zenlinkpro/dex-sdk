import { Token, TokenAmount, AssetType, JSBI, StandardPair as RegularPair } from '@zenlink-dex/sdk-core';
import { BalanceModule } from './index';
import { ApiPromise } from '@polkadot/api';

export const currencyKeyMap: Record<number, string> = {
  0: 'Native',
  1: 'VToken',
  2: 'Token',
  3: 'Stable',
  4: 'VSToken',
  5: 'VSBond'
};

export const currencyTokenSymbolMap: Record<number, string> = {
  0: 'ASG',
  1: 'BNC',
  2: 'KUSD',
  3: 'DOT',
  4: 'KSM',
  5: 'ETH',
  6: 'KAR',
  7: 'ZLK',
  8: 'PHA',
  9: 'RMRK'
};

export function parseTokenAssetU8 (assetIndex: number): number {
  const assetU8 = ((assetIndex & 0x0000_0000_0000_ff00) >> 8);

  return assetU8;
}

export function parseTokenType (assetIndex: number): string {
  const assetU8 = ((assetIndex & 0x0000_0000_0000_ff00) >> 8);

  return currencyKeyMap[assetU8];
}

export function parseTokenSymbol (assetIndex: number): string {
  const assetSymbolIndex = ((assetIndex & 0x0000_0000_0000_000ff));

  return currencyTokenSymbolMap[assetSymbolIndex];
}

export class ModuleBBalance implements BalanceModule {
  // public readonly provider: ApiPromise;
  public readonly api: ApiPromise;
  public constructor (api: ApiPromise) {
    this.api = api;
  }

  public async balanceOfToken (token: Token, account: string) {
    if (token.assetType === AssetType.NATIVE_TOKEN) {
      const callResult = await this.api.derive.balances.all(account);
      const amount = callResult ? callResult.availableBalance.toString() : '0';

      return new TokenAmount(token, amount);
    }

    if (token.assetType === AssetType.NORMAL_TOKEN) {
      const callResult: any = await this.api.query.tokens.accounts(account, {
        [parseTokenType(token.meta.assetIndex)]: parseTokenSymbol(token.assetMeta.assetIndex)
      });

      let amount = '0';

      if (callResult) {
        const freeAmount = callResult?.free.toString() ?? '0';
        const frozenAmount = callResult?.frozen.toString() ?? '0';

        amount = JSBI.subtract(JSBI.BigInt(freeAmount), JSBI.BigInt(frozenAmount)).toString();
      }

      return new TokenAmount(token, amount);
    }
    return undefined;
  }

  public async balanceOfTokenList (tokens: Token[], account: string) {
    try {
      const promiseList = tokens.map(async (item) => {
        return this.balanceOfToken(item, account);
      });

      const result = await Promise.all(promiseList);

      return result.filter((item) => !!item) as TokenAmount[];
    } catch (error) {
      return [];
    }
  }

  public async balanceOfPair (pair: RegularPair, account: string) {
    const { lpToken, token0: asset0, token1: asset1 } = pair;

    if (!asset0 || !asset1) return;
    const asset0U8 = parseTokenAssetU8(asset0.meta.assetIndex);
    const asset1U8 = parseTokenAssetU8(asset1.meta.assetIndex);

    const LPTokenParam = [parseTokenSymbol(asset0.meta.assetIndex), asset0U8, parseTokenSymbol(asset1.meta.assetIndex), asset1U8];

    const callResult: any = await this.api.query.tokens.accounts(account, {
      LPToken: LPTokenParam
    });

    let amount = '0';

    if (callResult) {
      const freeAmount = callResult?.free.toString() ?? '0';
      const frozenAmount = callResult?.frozen.toString() ?? '0';

      amount = JSBI.subtract(JSBI.BigInt(freeAmount), JSBI.BigInt(frozenAmount)).toString();
    }

    return new TokenAmount(lpToken, amount);
  }

  public async balanceOfPairList (pairs: RegularPair[], account: string) {
    try {
      const promiseList = pairs.map(async (pair) => {
        return this.balanceOfPair(pair, account);
      });

      const result = await Promise.all(promiseList);

      return result.filter((item) => !!item) as TokenAmount[];
    } catch (error) {
      return [];
    }
  }
}
