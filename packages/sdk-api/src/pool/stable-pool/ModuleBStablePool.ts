
import { StablePoolModule } from './index';
import { AssetType, StablePair, StableSwap, Token, TokenAmount } from '@zenlink-dex/sdk-core';
import JSBI from 'jsbi';
import { ApiPromise } from '@polkadot/api';

export const STABLE_LP_TOKEN = 12;

export enum BifrostKusamaTokenType {
  Native = 0,
  VToken = 1,
  Token = 2,
  Stable = 3,
  VSToken = 4,
  VSBond = 5,
  LPToken = 6,
  StableLpToken = 12,
}

export enum BifrostKusamaTokenSymbol {
  ASG = 0,
  BNC = 1,
  KUSD = 2,
  DOT = 3,
  KSM = 4,
  ETH = 5,
  KAR = 6,
  ZLK = 7,
  PHA = 8,
  RMRK = 9,
  MOVR = 10
}

export function parseToTokenIndex (type: number, symbol: number): number {
  if (type === 0) return 0;

  return (type << 8) + symbol;
}

export const formatBifrostKusamaTokenToThreeTuple = (ormlToken: Record<string, string>) => {
  if (!ormlToken) return undefined;
  const entities = Object.entries(ormlToken);

  if (entities.length !== 1) return undefined;
  const [tokenType, tokenSymbol] = entities[0];
  const type = (typeof tokenType === 'number') ? tokenType : BifrostKusamaTokenType[tokenType];
  const symbol = (typeof tokenSymbol === 'number') ? tokenSymbol : BifrostKusamaTokenSymbol[tokenSymbol]; // stableLpToken is number

  if (type === undefined || symbol === undefined) return undefined;
  const index = parseToTokenIndex(type, symbol);

  return {
    assetType: type === 0 ? 0 : 2,
    assetIndex: index
  };
};
export class ModuleBStablePool implements StablePoolModule {
  public readonly provider: any;
  public readonly api: ApiPromise;

  public readonly options: any;
  public constructor (api: any, options: any) {
    this.api = api;
    this.options = options;
  }

  public async stablePairsOf (poolIds: any[]) {
    const { networkId, chainId } = this.options ?? {};
    const result = (await this.api.query.zenlinkStableAMM.pools.entries()).map(([, value]) => value)
      .filter((item: any) => item.isSome);
    const stablesInfo = result;
    const info: any[] = stablesInfo.map((item: any) => {
      const itemValue = item?.value;
      let basic: any;

      if (itemValue.type === 'Base') {
        basic = itemValue.value;
      } else if (itemValue.isMeta) {
        basic = itemValue?.asMeta?.info;
      } else {
        return [];
      }
      const pooledTokens = basic.currencyIds.toHuman();
      const lpToken = basic.lpCurrencyId.toHuman();
      const lpName = basic.lpCurrencySymbol.toHuman();
      const lpSymbol = basic.lpCurrencySymbol.toHuman();
      const balances = basic.balances;
      const fee = basic.fee.toString();
      const adminFee = basic.adminFee.toString();

      return {
        chainId: this.options?.chainId,
        pooledTokens: pooledTokens,
        lpToken: lpToken,
        lpName: lpName,
        lpSymbol: lpSymbol,
        balances: balances.map((balance) => JSBI.BigInt(balance.toString())),
        fee,
        adminFee
      };
    }).filter((item) => !!item);

    const lpTokens = info.map((item) => item?.lpToken);
    const totalIssuance = await this.api.query.tokens.totalIssuance.multi(lpTokens);
    const totalIssuanceSupply = totalIssuance.map((item) => item.toString());

    const virtualPrices = await Promise.all(info.map((item) => {
      const stableLpTokenIndex = item.lpToken.stableLpToken;

      return (this.api?.rpc as any).zenlinkStableAmm.getVirtualPrice(stableLpTokenIndex);
    }));

    const allA = await Promise.all(info.map((item) => {
      const stableLpTokenIndex = item.lpToken.stableLpToken;

      return (this.api?.rpc as any).zenlinkStableAmm.getA(stableLpTokenIndex);
    }));

    const tokenResInfo = await this.api.query.assetRegistry.currencyMetadatas.entries();
    const tokenInfoMap = tokenResInfo.map((item) => {
      // return (item as any).toHuman();
      return [item[0].toHuman() as any, item[1].toHuman()];
    }).map(([
      token,
      value
    ]) => {
      const asset = formatBifrostKusamaTokenToThreeTuple(token[0]);
      return [JSON.stringify(token[0]), value, asset];
    }).reduce((total, cur) => {
      total[cur[0]] = {
        asset: cur[2],
        info: cur[1]
      };
      return total;
    }, {});

    const stableSwapInfos = info.map((item, i) => {
      const pooledTokens = item.pooledTokens.map((token) => {
        const tokenInfo = tokenInfoMap[JSON.stringify(token)];
        const asset = tokenInfo.asset;
        const info = tokenInfo.info;
        return new Token({
          networkId,
          chainId,
          address: asset.assetIndex.toString(),
          assetType: asset.assetType,
          assetIndex: asset.assetIndex,
          decimals: Number(info.decimals),
          symbol: info.symbol,
          name: info.name
        });
      });

      const stableLpId = item.lpToken.StableLpToken;

      const lpAssetIndex = parseToTokenIndex(STABLE_LP_TOKEN, Number(stableLpId));

      const lpToken = new Token({
        networkId,
        chainId,
        address: lpAssetIndex.toString(),
        assetType: 2,
        assetIndex: lpAssetIndex,
        decimals: 18,
        symbol: item.lpSymbol,
        name: item.lpName
      });

      return {
        ...item,
        address: stableLpId.toString(),
        lpToken,
        pooledTokens,
        A: JSBI.BigInt(allA[i].toString()),
        virtualPrice: JSBI.BigInt(virtualPrices[i].toString()),
        totalSupply: JSBI.BigInt(totalIssuanceSupply[i])
      };
    });

    return stableSwapInfos as any[];
  }

  public async stablePoolsOf (pairs: StablePair[]) {
    const poolsInfo = await this.stablePairsOf(pairs?.map((item) => item.lpToken.assetIndex));
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
