import { MultiPath, Token, TokenAmount, TradeType } from '@zenlink-dex/sdk-core';
import { TxCallParam } from '../types';

export interface SwapOverrideOptions {
  deadline?: number | string;
}

export type SwapParamCall = (
  path: Token[],
  amount: TokenAmount,
  limitAmount: TokenAmount,
  tradeType: TradeType,
  recipient: string,
  deadline: number | string
) => TxCallParam | undefined;

export type SwapV1ParamCall = (
  path: MultiPath[],
  amount: TokenAmount,
  limitAmount: TokenAmount,
  tradeType: TradeType,
  recipient: string,
  deadline: number | string
) => TxCallParam | undefined;

export interface SwapParamModule {
  swapParams: SwapParamCall;
  swapV1Params: SwapV1ParamCall;
}
