import { Token, StandardPool, StandardPair } from '@zenlink-dex/sdk-core';

export type StandardPairReservCall = (pair: StandardPair) => Promise<StandardPool | undefined>;
export type StandardPairListReserveCall = (tokens: StandardPair[]) => Promise<StandardPool[] | undefined>;
export type StandardPairsOfTokensCall = (tokens: Token[]) => Promise<StandardPair[] | undefined>;

export interface StandardPoolModule {
  pairsOfTokens: StandardPairsOfTokensCall;
  reserveOfPair: StandardPairReservCall;
  reserveOfPairList: StandardPairListReserveCall;
}
