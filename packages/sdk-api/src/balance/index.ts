import { StandardPair as RegularPair, Token, TokenAmount } from '@zenlink-dex/sdk-core';

export type BalanceOfTokenCall = (token: Token, account: string) => Promise<TokenAmount | undefined>;
export type BalanceOfTokenListCall = (token: Token[], account: string) => Promise<TokenAmount[] | undefined>;
export type BalanceOfPairListCall = (token: RegularPair[], account: string) => Promise<TokenAmount[] | undefined>;

export interface BalanceModule {
  balanceOfToken: BalanceOfTokenCall;
  balanceOfTokenList: BalanceOfTokenListCall;
  balanceOfPairList: BalanceOfPairListCall;
}
