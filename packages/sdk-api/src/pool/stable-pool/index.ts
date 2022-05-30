import { StablePair, StableSwap } from '@zenlink-dex/sdk-core';

export type StablePoolsOfStablePairsCall = (pairs: StablePair[]) => Promise<StableSwap[] | undefined>;
export type StablePairsOfCall = (contracts: string[]) => Promise<StablePair[]>;

export interface StablePoolModule {
  stablePairsOf: StablePairsOfCall;
  stablePoolsOf: StablePoolsOfStablePairsCall;
}
