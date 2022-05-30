import { StandardPool, AssetType, Token, Percent, TokenAmount, TradeType, currencyEquals, sortedInsert } from '@zenlink-dex/sdk-core';
import { BestTradeOptions, Trade, tradeComparator } from './entities/trade';
import { ZERO_PERCENT, ONE_HUNDRED_PERCENT, BETTER_TRADE_LESS_HOPS_THRESHOLD } from './constants';

export interface SwapTrade {
  isNative: boolean;
  method?: string;
  trade?: Trade;
}

export function isTradeBetter (
  tradeA: Trade | undefined | null,
  tradeB: Trade | undefined | null,
  minimumDelta: Percent = ZERO_PERCENT
): boolean | undefined {
  if (tradeA && !tradeB) return false;
  if (tradeB && !tradeA) return true;
  if (!tradeA || !tradeB) return undefined;

  if (
    tradeA.tradeType !== tradeB.tradeType ||
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

export class SmartRouterV1 {
  public static allBestV1Trade (
    tradeType: TradeType.EXACT_INPUT | TradeType.EXACT_OUTPUT,
    _amountSpecified: TokenAmount,
    _otherCurrency: Token,
    allowedPairs: StandardPool[],
    { maxHops = 3, maxNumResults = 3 }: BestTradeOptions = {}
  ): Trade[] {
    const bestTrades: Trade[] = [];

    const [amountSpecified, otherCurrency] = [
      _amountSpecified && new TokenAmount(_amountSpecified.token.wrapped, _amountSpecified.quotient),
      _otherCurrency && _otherCurrency.wrapperToken
    ];

    if (!allowedPairs || allowedPairs.length === 0 || !amountSpecified || !otherCurrency) return bestTrades;

    let bestTradeSoFar: Trade | null = null;

    for (let j = 1; j <= maxHops; j++) {
      let currentTrade: Trade | null;

      if (tradeType === TradeType.EXACT_INPUT) {
        currentTrade = Trade.bestTradeExactIn(
          Number(amountSpecified.token.chainId),
          allowedPairs,
          amountSpecified,
          otherCurrency,
          { maxHops: j, maxNumResults: 1 }
        )[0] ?? null;
      } else {
        currentTrade = Trade.bestTradeExactOut(
          Number(amountSpecified.token.chainId),
          allowedPairs,
          otherCurrency,
          amountSpecified,
          { maxHops: j, maxNumResults: 1 }
        )[0] ?? null;
      }

      if (isTradeBetter(bestTradeSoFar, currentTrade, BETTER_TRADE_LESS_HOPS_THRESHOLD)) {
        bestTradeSoFar = currentTrade;
      }
    }

    if (bestTradeSoFar) {
      sortedInsert(bestTrades, bestTradeSoFar, maxNumResults, tradeComparator);
    }

    return bestTrades;
  }

  public static swapExactTokensForTokens (
    currencyAmountIn: TokenAmount,
    currencyOut: Token,
    pairs: StandardPool[],
    { maxHops = 3, maxNumResults = 3 }: BestTradeOptions = {}
  ): SwapTrade {
    const allBestTrade = SmartRouterV1.allBestV1Trade(
      TradeType.EXACT_INPUT,
      currencyAmountIn,
      currencyOut,
      pairs,
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
    currencyAmountOut: TokenAmount,
    currencyIn: Token,
    pairs: StandardPool[],
    { maxHops = 3, maxNumResults = 3 }: BestTradeOptions = {}
  ): SwapTrade {
    const allBestTrade = SmartRouterV1.allBestV1Trade(
      TradeType.EXACT_OUTPUT,
      currencyAmountOut,
      currencyIn,
      pairs,
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
