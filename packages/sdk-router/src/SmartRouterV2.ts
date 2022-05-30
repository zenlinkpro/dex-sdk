import { AbstractPair, AssetType, Token, StandardPool, Percent, TokenAmount, StableSwap, currencyEquals, sortedInsert, TradeType } from '@zenlink-dex/sdk-core';

import { BestTradeOptions } from './entities/trade';
import { TradeV2, tradeV2Comparator } from './entities/tradeV2';
import { ZERO_PERCENT, ONE_HUNDRED_PERCENT, BETTER_TRADE_LESS_HOPS_THRESHOLD } from './constants';
export interface SwapTradeV2 {
  isNative: boolean;
  trade?: TradeV2;
}

export function isTradeV2Better (
  tradeA: TradeV2 | undefined | null,
  tradeB: TradeV2 | undefined | null,
  minimumDelta: Percent = ZERO_PERCENT
): boolean | undefined {
  if (tradeA && !tradeB) return false;
  if (tradeB && !tradeA) return true;
  if (!tradeA || !tradeB) return undefined;

  if (
    !currencyEquals(tradeA.inputAmount.currency, tradeB.inputAmount.currency) ||
    !currencyEquals(tradeB.outputAmount.currency, tradeB.outputAmount.currency)
  ) {
    throw new Error('Comparing incomparable trades');
  }

  if (minimumDelta.equal(ZERO_PERCENT)) {
    return tradeA.executionPrice.lessThan(tradeB.executionPrice);
  } else {
    return tradeA.executionPrice.raw
      .multiply(minimumDelta.add(ONE_HUNDRED_PERCENT))
      .lessThan(tradeB.executionPrice);
  }
}

export class SmartRouterV2 {
  public static allBestV2Trade (
    tradeType: TradeType,
    limitAmout: TokenAmount,
    otherToken: Token,
    allowedPairs: AbstractPair[],
    stableSwaps: StableSwap[] = [],
    { maxHops = 3, maxNumResults = 3 }: BestTradeOptions = {}
  ): TradeV2[] {
    const bestTrades: TradeV2[] = [];

    const [amountSpecified, otherCurrency] = [
      limitAmout && new TokenAmount(limitAmout.token.wrapped, limitAmout.quotient),
      otherToken && otherToken.wrapperToken
    ];

    if (!allowedPairs || allowedPairs.length === 0 || !amountSpecified || !otherCurrency) return bestTrades;

    let bestTradeSoFar: TradeV2 | null = null;

    for (let i = 1; i <= maxHops; i++) {
      let currentTrade: TradeV2 | null;
      if (tradeType === TradeType.EXACT_INPUT) {
        currentTrade = TradeV2.bestTradeExactIn(
          Number(amountSpecified.token.chainId),
          allowedPairs,
          stableSwaps,
          amountSpecified,
          otherCurrency,
          { maxHops: maxHops }
        )[0] ?? null;
      } else {
        currentTrade = TradeV2.bestTradeExactOut(
          Number(amountSpecified.token.chainId),
          allowedPairs as StandardPool[],
          otherCurrency,
          amountSpecified,
          { maxHops: maxHops }
        )[0] ?? null;
      }

      if (isTradeV2Better(bestTradeSoFar, currentTrade, BETTER_TRADE_LESS_HOPS_THRESHOLD)) {
        bestTradeSoFar = currentTrade;
      }
    }

    if (bestTradeSoFar) {
      sortedInsert(bestTrades, bestTradeSoFar, maxNumResults, tradeV2Comparator);
    }

    return bestTrades;
  }

  public static swapExactTokensForTokens (
    currencyAmountIn: TokenAmount,
    currencyOut: Token,
    pairs: StandardPool[] = [],
    stableSwaps: StableSwap[] = [],
    { maxHops = 3, maxNumResults = 3 }: BestTradeOptions = {}
  ): SwapTradeV2 {
    const allBestTrade = SmartRouterV2.allBestV2Trade(
      TradeType.EXACT_INPUT,
      currencyAmountIn,
      currencyOut,
      pairs,
      stableSwaps,
      {
        maxHops,
        maxNumResults
      }
    );

    return {
      isNative: currencyAmountIn.token.assetType === AssetType.NATIVE_TOKEN,
      trade: allBestTrade[0]
    };
  }

  public static swapTokensForExactTokens (
    currencyIn: Token,
    currencyAmountOut: TokenAmount,
    pairs: StandardPool[] = [],
    { maxHops = 3, maxNumResults = 3 }: BestTradeOptions = {}
  ): SwapTradeV2 {
    const allBestTrade = SmartRouterV2.allBestV2Trade(
      TradeType.EXACT_OUTPUT,
      currencyAmountOut,
      currencyIn,
      pairs,
      [],
      {
        maxHops,
        maxNumResults
      }
    );

    return {
      isNative: currencyIn.assetType === AssetType.NATIVE_TOKEN,
      trade: allBestTrade[0]
    };
  }
}
