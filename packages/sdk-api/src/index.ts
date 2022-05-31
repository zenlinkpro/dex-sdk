import { Token, TokenAmount, StandardPool, StandardPair, MultiPath, StableSwap as StablePool, StablePair, TradeType } from '@zenlink-dex/sdk-core';
import { Observable } from 'rxjs';

export interface SwapOverrideOptions {
  deadline?: number;
}

export type SwapParamCall = (
  path: Token[],
  amount: TokenAmount,
  limitAmount: TokenAmount,
  tradeType: TradeType,
  recipient: string,
  deadline: number | string
) => any | undefined;

export type SwapTokensForTokensCall = (
  path: MultiPath[],
  amount: TokenAmount,
  limitAmount: TokenAmount,
  recipient: string,
  deadline: number | string
) => any;

export interface DexApi {
  balanceOfTokens(tokens: Token[], account: string): Observable<TokenAmount[]>;

  standardPairOfTokens(tokens:Token[]): Observable<StandardPair[]>;
  balanceOfStandardPairs(pairs: StandardPair[], account: string): Observable<TokenAmount[]>;
  standardPoolOfPairs(pairs: StandardPair[]): Observable<StandardPool[]>;

  stablePairOf(address: string[]): Observable<StablePair[]>;
  stablePoolOfPairs(pairs: StablePair[]): Observable<StablePool[]>;
  // swap: SwapParamCall;
  swapExactTokensForTokens?: SwapTokensForTokensCall
  swapTokensForExactTokens?: SwapTokensForTokensCall

}

export * from './ModuleBApi';
export * from './EvmApi';

export * from './chain';
