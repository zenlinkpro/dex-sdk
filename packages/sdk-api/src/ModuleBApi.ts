import { BalanceModule } from './/balance';
import { ModuleBBalance } from './balance/ModuleBAssetBalance';

import { StandardPoolModule } from './pool/standard-pool';
import { ModuleBStandardPool } from './pool/standard-pool/ModuleBStandardPool';

import { MultiPath, StablePair, StableSwap, StandardPair, StandardPool, Token, TokenAmount, TradeType } from '@zenlink-dex/sdk-core';
import { WsProvider, ApiPromise } from '@polkadot/api';
import { ProviderInterface } from '@polkadot/rpc-provider/types';

import { DexApi, ModuleBChainOption } from './index';
import { Observable } from 'rxjs';
import { isEqual } from 'lodash';
import { u32 } from '@polkadot/types';
import { SwapParamModule } from './transaction/swap';
import { ModuleBSwapParam } from './transaction/swap/ModuleBSwap';
import invariant from 'tiny-invariant';
import { StablePoolModule } from './pool/stable-pool';
import { ModuleBStablePool } from './pool/stable-pool/ModuleBStablePool';
import { types, typesAlias, typesBundle, rpc } from '@bifrost-finance/type-definitions';

export const zenlinkStableAmm = {
  getVirtualPrice: {
    description: 'getVirtualPrice',
    params: [
      {
        name: 'pid',
        type: 'PoolId'
      },
      {
        name: 'at',
        type: 'Hash',
        isOptional: true
      }
    ],
    type: 'Balance',
    isSubscription: false,
    jsonrpc: 'zenlinkStableAmm_getVirtualPrice',
    method: 'getVirtualPrice',
    section: 'zenlinkStableAmm'
  },
  getA: {
    description: 'getA',
    params: [
      {
        name: 'pid',
        type: 'PoolId'
      },
      {
        name: 'at',
        type: 'Hash',
        isOptional: true
      }
    ],
    type: 'Balance',
    isSubscription: false,
    jsonrpc: 'zenlinkStableAmm_getA',
    method: 'getA',
    section: 'zenlinkStableAmm'
  }
};

export class ModuleBApi implements DexApi {
  public readonly provider: ProviderInterface;
  public api?: ApiPromise;
  private balanceModule?: BalanceModule;
  private standardPoolModule?: StandardPoolModule;
  private swapParamModule?: SwapParamModule;
  private stablePoolModule?: StablePoolModule;
  private options?: ModuleBChainOption;

  public constructor (provider: ProviderInterface, options?: ModuleBChainOption) {
    this.provider = provider;
    this.options = options;
    this.swapParamModule = new ModuleBSwapParam();
  }

  public async initApi () {
    const api = await ApiPromise.create({
      provider: this.provider,
      rpc: {
        zenlinkStableAmm,
        ...rpc
      },
      typesBundle,
      types,
      typesAlias
    });

    this.api = api;
    this.balanceModule = new ModuleBBalance(api);
    this.standardPoolModule = new ModuleBStandardPool(api);
    this.stablePoolModule = new ModuleBStablePool(api, this.options);
  }

  public async balanceOfToken (token: Token, account: string) {
    if (!account) return undefined;

    if (!this.balanceModule) {
      throw new Error('Balance module is not support');
    }

    const tokenBalance = await this.balanceModule.balanceOfToken(token, account);

    return tokenBalance;
  }

  balanceOfTokens (
    tokens: Token[] = [],
    account: string
  ): Observable<TokenAmount[]> {
    invariant(this.balanceModule, 'Balance module is not support');
    invariant(this.api, 'Balance module is not support');

    return new Observable((subscriber) => {
      let _cacheAmount: Record<string, string> = {};

      if (!this.balanceModule || !account) {
        subscriber.next([]);
      }

      const tokenList = tokens;

      const handleBalanceOfTokensCallback = (block?: number) => {
        this.balanceModule?.balanceOfTokenList(tokenList, account)
          .then((amounts = []) => {
            const _newCacheAmount: Record<string, string> = {};

            amounts.forEach((item, index) => {
              _newCacheAmount[item.token.assetId] = item.quotient.toString();
            });

            if (!isEqual(_cacheAmount, _newCacheAmount)) {
              subscriber.next(amounts);
              _cacheAmount = _newCacheAmount;
            }
          });
      };

      let handlePromise: any;

      if (this.api) {
        handlePromise = this.api.query.system.number(handleBalanceOfTokensCallback);
      }

      return () => {
        if (handlePromise) {
          handlePromise.then((handle: any) => {
            handle();
          });
        }
      };
    });
  }

  standardPairOfTokens (
    tokens:Token[] = []
  ): Observable<StandardPair[]> {
    invariant(this.standardPoolModule, 'standardPoolModule is not support');
    invariant(this.provider, 'standardPoolModule is not support');

    return new Observable((subscriber) => {
      let _cache: Record<string, boolean> = {};

      const tokenList = tokens;

      const handlePairsOfTokensCallback = (block?: number) => {
        if (block && (block % 500 !== 0)) {
          return;
        }

        this.standardPoolModule?.pairsOfTokens(tokenList)
          .then((pairs = []) => {
            const _newCache: Record<string, boolean> = {};
            const pairMap: Record<string, StandardPair> = { };

            pairs.forEach((item, index) => {
              pairMap[item.lpToken.assetId] = item;
              _newCache[item.lpToken.assetId] = true;
            });

            if (!isEqual(_cache, _newCache)) {
              subscriber.next(pairs);
              _cache = _newCache;
            }
          });
      };

      handlePairsOfTokensCallback();

      let handlePromise: any;

      if (this.api) {
        handlePromise = this.api.query.system.number(handlePairsOfTokensCallback);
      }

      return () => {
        if (handlePromise) {
          handlePromise.then((handle: any) => {
            handle();
          });
        }
      };
    });
  }

  balanceOfStandardPairs (
    pairs: StandardPair[] = [],
    account: string
  ): Observable<TokenAmount[]> {
    invariant(this.balanceModule, 'Balance module is not support');
    invariant(this.provider, 'Balance module is not support');

    return new Observable((subscriber) => {
      let _cacheAmount: Record<string, string> = {};

      const pairsList = pairs;

      const handleBalanceOfPairsCallback = (block?: number) => {
        this.balanceModule?.balanceOfPairList(pairsList, account)
          .then((amounts = []) => {
            const _newCacheAmount: Record<string, string> = {};

            amounts.forEach((item) => {
              _newCacheAmount[item.token.assetId] = item.quotient.toString();
            });

            if (!isEqual(_cacheAmount, _newCacheAmount)) {
              subscriber.next(amounts);
              _cacheAmount = _newCacheAmount;
            }
          });
      };

      handleBalanceOfPairsCallback();

      let handlePromise: any;

      if (this.api) {
        handlePromise = this.api.query.system.number(handleBalanceOfPairsCallback);
      }

      return () => {
        if (handlePromise) {
          handlePromise.then((handle: any) => {
            handle();
          });
        }
      };
    });
  }

  standardPoolOfPairs (
    pairs: StandardPair[] = []
  ): Observable<StandardPool []> {
    invariant(this.standardPoolModule, 'standardPoolModule is not support');
    invariant(this.provider, 'standardPoolModule is not support');

    return new Observable((subscriber) => {
      let _cache: Record<string, any> = {};

      const pairList = pairs;

      const handleReserveCallback = (block?: u32) => {
        this.standardPoolModule?.reserveOfPairList(pairList)
          .then((pools = []) => {
            const _newCache: Record<string, any> = {};
            pools.forEach((item) => {
              _newCache[item.liquidityToken.assetId] = {
                reserve0: item.reserve0.quotient.toString(),
                reserve1: item.reserve1.quotient.toString(),
                symbol: item.liquidityToken.symbol
              };
            });

            if (!isEqual(_cache, _newCache)) {
              subscriber.next(pools);
              _cache = _newCache;
            }
          });
      };

      handleReserveCallback();

      let handlePromise: any;

      if (this.api) {
        handlePromise = this.api.query.system.number(handleReserveCallback);
      }

      return () => {
        if (handlePromise) {
          handlePromise.then((handle: any) => {
            handle();
          });
        }
      };
    });
  }

  stablePairOf (
    address: string[] = []
  ): Observable<StablePair[]> {
    return new Observable((subscriber) => {
      const handleReserveCallback = (block?: u32) => {
        this.stablePoolModule?.stablePairsOf(address)
          .then((pairs = []) => {
            subscriber.next(pairs);
          });
      };

      handleReserveCallback();

      let handlePromise: any;

      if (this.api) {
        handlePromise = this.api.query.system.number(handleReserveCallback);
      }

      return () => {
        if (handlePromise) {
          handlePromise.then((handle: any) => {
            handle();
          });
        }
      };
    });
  }

  stablePoolOfPairs (
    pairs: StablePair[] = []
  ): Observable<StableSwap[]> {
    invariant(this.stablePoolModule, 'stablePoolModule is not support');

    return new Observable((subscriber) => {
      const handleReserveCallback = (block?: u32) => {
        this.stablePoolModule?.stablePoolsOf(pairs)
          .then((pairs = []) => {
            subscriber.next(pairs);
          });
      };

      handleReserveCallback();

      let handlePromise: any;

      if (this.api) {
        handlePromise = this.api.query.system.number(handleReserveCallback);
      }

      return () => {
        if (handlePromise) {
          handlePromise.then((handle: any) => {
            handle();
          });
        }
      };
    });
  }

  public swap (
    path: Token[],
    amount: TokenAmount,
    limitAmount: TokenAmount,
    tradeType: TradeType,
    recipient: string,
    deadline: string | number
  ) {
    if (!this.swapParamModule || !this.api) {
      throw new Error('SwapParamModule is not support');
    }

    const swapParams = this.swapParamModule.swapParams(
      path,
      amount,
      limitAmount,
      tradeType,
      recipient,
      deadline
    );

    if (!swapParams) return undefined;

    return this.api.tx[swapParams.mod][swapParams.method](...swapParams.params) as any;
  }

  public swapExactTokensForTokens (
    path: MultiPath[],
    amount: TokenAmount,
    otherlimitAmount: TokenAmount,
    recipient: string,
    deadline: number | string
  ) {
    invariant(this.swapParamModule && this.api, 'SwapParamModule is not support');

    const swapParams = this.swapParamModule!.swapV1Params(
      path,
      amount,
      otherlimitAmount,
      TradeType.EXACT_INPUT,
      recipient,
      deadline
    );

    invariant(swapParams, 'invaild');
    return this.api.tx[swapParams!.mod][swapParams!.method](...swapParams!.params) as any;
  }

  public swapTokensForExactTokens (
    path: MultiPath[],
    amount: TokenAmount,
    otherlimitAmount: TokenAmount,
    recipient: string,
    deadline: number | string
  ) {
    invariant(this.swapParamModule && this.api, 'SwapParamModule is not support');
    const swapParams = this.swapParamModule!.swapV1Params(
      path,
      amount,
      otherlimitAmount,
      TradeType.EXACT_OUTPUT,
      recipient,
      deadline
    );
    invariant(swapParams, 'invaild');

    return this.api.tx[swapParams!.mod][swapParams!.method](...swapParams!.params) as any;
  }
}
