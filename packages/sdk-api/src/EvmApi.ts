import { ethers, Signer } from 'ethers';

import { BalanceModule } from './balance';
import { EvmMultiCallBalance } from './balance/EvmAssetBalance';
import { StandardPoolModule } from './pool/standard-pool';
import { StablePoolModule } from './pool/stable-pool';
import { EvmStablePool } from './pool/stable-pool/EvmStablePool';

import { MultiPath, StablePair, StableSwap, StandardPair, StandardPool, Token, TokenAmount, TradeType } from '@zenlink-dex/sdk-core';
import { isEqual } from 'lodash';

import { EvmStandardPool } from './pool/standard-pool/EvmStandardPool';

import { Observable } from 'rxjs';
import { DexApi } from '.';
import { EvmSwapParam } from './transaction/swap/EvmSwap';
import { EvmTransactionExtrinsic } from './transaction';
import invariant from 'tiny-invariant';
import { EvmChainOption } from './chain/index';

export interface EvmOptions {
  multicall2: string;
  factory: string;
  initCodeHash: string;
  routerAddress: string;
  routerV1Address?: string;

}

export class EvmApi implements DexApi {
  public readonly provider: ethers.providers.Provider;
  public readonly singer: any;
  public readonly options: EvmChainOption;
  private readonly balanceModule?: BalanceModule;
  private readonly standardPoolModule?: StandardPoolModule;
  private readonly stablePoolModule?: StablePoolModule;

  private readonly swapParamModule?: EvmSwapParam;

  public constructor (signerOrProvider: Signer | ethers.providers.Provider, options: EvmChainOption) {
    if (Signer.isSigner(signerOrProvider)) {
      this.singer = signerOrProvider;
      if (!signerOrProvider.provider) throw new Error('invalid provider');
      this.provider = signerOrProvider.provider;
    } else if (ethers.providers.Provider.isProvider(signerOrProvider)) {
      this.provider = signerOrProvider;
    } else {
      throw new Error('invalid provider');
    }
    this.options = options;
    this.balanceModule = new EvmMultiCallBalance(this.provider, options);
    this.standardPoolModule = new EvmStandardPool(this.provider, options);
    this.stablePoolModule = new EvmStablePool(this.provider, options);

    this.swapParamModule = new EvmSwapParam(options);
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
    invariant(this.provider, 'Balance module is not support');
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
            const tokenAmountMap: Record<string, TokenAmount> = { };

            amounts.forEach((item) => {
              tokenAmountMap[item.token.assetId] = item;
              _newCacheAmount[item.token.assetId] = item.quotient.toString();
            });

            if (!isEqual(_cacheAmount, _newCacheAmount)) {
              subscriber.next(amounts);
              _cacheAmount = _newCacheAmount;
            }
          });
      };

      handleBalanceOfTokensCallback();

      this.provider.addListener('block', handleBalanceOfTokensCallback);

      return () => {
        this.provider.removeListener('block', handleBalanceOfTokensCallback);
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
            subscriber.next(pairs);

            _cache = _newCache;

            if (!isEqual(_cache, _newCache)) {
              subscriber.next(pairs);
              _cache = _newCache;
            }
          });
      };

      handlePairsOfTokensCallback();

      this.provider.addListener('block', handlePairsOfTokensCallback);

      return () => {
        this.provider.removeListener('block', handlePairsOfTokensCallback);
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
      const tokenList = pairs.map((pair) => pair.lpToken);

      const handleBalanceOfPairsCallback = (block?: number) => {
        this.balanceModule?.balanceOfTokenList(tokenList, account)
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

      this.provider.addListener('block', handleBalanceOfPairsCallback);

      return () => {
        this.provider.removeListener('block', handleBalanceOfPairsCallback);
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

      const handleReserveCallback = (block?: number) => {
        this.standardPoolModule?.reserveOfPairList(pairs)
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
      this.provider.addListener('block', handleReserveCallback);

      return () => {
        this.provider.removeListener('block', handleReserveCallback);
      };
    });
  }

  stablePairOf (
    address: string[] = []
  ): Observable<StablePair[]> {
    invariant(this.standardPoolModule, 'stablePoolModule is not support');
    invariant(this.provider, 'stablePoolModule is not support');

    return new Observable((subscriber) => {
      const handlePairsOfContractCallback = () => {
        this.stablePoolModule?.stablePairsOf(address)
          .then((pairs = []) => {
            subscriber.next(pairs);
          });
      };

      handlePairsOfContractCallback();
    });
  }

  stablePoolOfPairs (
    stablePairs: StablePair[] = []
  ): Observable<StableSwap[]> {
    invariant(this.stablePoolModule, 'stablePoolModule is not support');

    return new Observable((subscriber) => {
      let _cache: Record<string, any> = {};

      if (!this.stablePoolModule) {
        subscriber.next([]);
      }

      const pairsList = stablePairs;

      const handleCallback = () => {
        this.stablePoolModule?.stablePoolsOf(pairsList)
          .then((pools = []) => {
            const _newCache: Record<string, any> = {};

            pools.forEach((item) => {
              _newCache[item.lpToken.assetId] = {
                amounts: item.balances.map((item) => item.quotient.toString())
              };
            });

            if (!isEqual(_cache, _newCache)) {
              subscriber.next(pools);
              _cache = _newCache;
            }
          });
      };

      handleCallback();

      this.provider.addListener('block', handleCallback);

      return () => {
        this.provider.removeListener('block', handleCallback);
      };
    });
  }

  public swap (
    path: Token[],
    amount: TokenAmount,
    limitAmount: TokenAmount,
    tradeType: TradeType,
    recipient: string,
    deadline: number | string
  ) {
    if (!this.swapParamModule || !this.provider) {
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

    return new EvmTransactionExtrinsic(swapParams, { signer: this.singer });
  }

  public swapV1 (
    path: MultiPath[],
    amount: TokenAmount,
    limitAmount: TokenAmount,
    tradeType: TradeType,
    recipient: string,
    deadline: number | string
  ) {
    if (!this.swapParamModule || !this.provider) {
      throw new Error('SwapParamModule is not support');
    }

    const swapParams = this.swapParamModule.swapV1Params(
      path as any,
      amount,
      limitAmount,
      tradeType,
      recipient,
      deadline
    );

    if (!swapParams) return undefined;

    return new EvmTransactionExtrinsic(swapParams, { signer: this.singer });
  }

  public swapExactTokensForTokens (
    path: MultiPath[],
    amount: TokenAmount,
    otherlimitAmount: TokenAmount,
    recipient: string,
    deadline: number | string
  ) {
    invariant(this.swapParamModule, 'swapParamModule is not support');
    invariant(this.provider, 'swapParamModule is not support');

    const swapParams = this.swapParamModule.swapV1Params(
      path,
      amount,
      otherlimitAmount,
      TradeType.EXACT_INPUT,
      recipient,
      deadline
    );
    invariant(swapParams, 'invaild params');

    return new EvmTransactionExtrinsic(swapParams, { signer: this.singer });
  }

  public swapTokensForExactTokens (
    path: MultiPath[],
    amount: TokenAmount,
    otherlimitAmount: TokenAmount,
    recipient: string,
    deadline: number | string
  ) {
    invariant(this.swapParamModule, 'swapParamModule is not support');
    invariant(this.provider, 'swapParamModule is not support');
    const swapParams = this.swapParamModule.swapV1Params(
      path as any,
      amount,
      otherlimitAmount,
      TradeType.EXACT_OUTPUT,
      recipient,
      deadline
    );

    invariant(swapParams, 'invaild params');

    return new EvmTransactionExtrinsic(swapParams, { signer: this.singer });
  }
}
