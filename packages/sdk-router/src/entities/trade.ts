/* eslint-disable sort-keys */
import invariant from 'tiny-invariant';
import { ONE, TradeType, ZERO, Fraction, StandardPool, Percent, Price, Token, TokenAmount, currencyEquals, sortedInsert } from '@zenlink-dex/sdk-core';
import { Route } from './route';

export function computePriceImpact (midPrice: Price, inputAmount: TokenAmount, outputAmount: TokenAmount): Percent {
  const exactQuote = midPrice.raw.multiply(inputAmount.raw);
  // calculate slippage := (exactQuote - outputAmount) / exactQuote
  const slippage = exactQuote.subtract(outputAmount.raw).divide(exactQuote);

  return new Percent(slippage.numerator, slippage.denominator);
}

interface InputOutput {
  readonly inputAmount: TokenAmount;
  readonly outputAmount: TokenAmount;
}

// comparator function that allows sorting trades by their output amounts, in decreasing order, and then input amounts
// in increasing order. i.e. the best trades have the most outputs for the least inputs and are sorted first
export function inputOutputComparator (a: InputOutput, b: InputOutput): number {
  // must have same input and output token for comparison
  invariant(a.inputAmount.token.equals(b.inputAmount.token), 'INPUT_CURRENCY');
  invariant(a.outputAmount.token.equals(b.outputAmount.token), 'OUTPUT_CURRENCY');

  if (a.outputAmount.equal(b.outputAmount)) {
    if (a.inputAmount.equal(b.inputAmount)) {
      return 0;
    }

    // trade A requires less input than trade B, so A should come first
    if (a.inputAmount.lessThan(b.inputAmount)) {
      return -1;
    } else {
      return 1;
    }
  } else {
    // tradeA has less output than trade B, so should come second
    if (a.outputAmount.lessThan(b.outputAmount)) {
      return 1;
    } else {
      return -1;
    }
  }
}

// extension of the input output comparator that also considers other dimensions of the trade in ranking them
export function tradeComparator (a: Trade, b: Trade): number {
  const ioComp = inputOutputComparator(a, b);

  if (ioComp !== 0) {
    return ioComp;
  }

  // consider lowest slippage next, since these are less likely to fail
  if (a.priceImpact.lessThan(b.priceImpact)) {
    return -1;
  } else if (a.priceImpact.greaterThan(b.priceImpact)) {
    return 1;
  }

  return a.route.routePath.length - b.route.routePath.length;
}

export interface BestTradeOptions {
  maxNumResults?: number;
  maxHops?: number;
}

export class Trade {
  public readonly chainId: number;
  public readonly route: Route;
  public readonly tradeType: TradeType;
  public readonly inputAmount: TokenAmount;
  public readonly outputAmount: TokenAmount;
  public readonly executionPrice: Price;
  public readonly nextMidPrice: Price;
  public readonly priceImpact: Percent;
  public readonly nextPairs: StandardPool[]

  public constructor (chainId: number, route: Route, amount: TokenAmount, tradeType: TradeType) {
    const amounts: TokenAmount[] = new Array(route.routePath.length);
    const nextPairs: StandardPool[] = new Array(route.pairs.length);

    if (tradeType === TradeType.EXACT_INPUT) {
      invariant(amount.token.equals(route.input), 'INPUT');
      amounts[0] = amount;

      for (let i = 0; i < route.routePath.length - 1; i++) {
        const pair = route.pairs[i];
        const [outputAmount, nextPair] = pair.getOutputAmount(amounts[i]);

        amounts[i + 1] = outputAmount;
        nextPairs[i] = nextPair;
      }
    } else {
      invariant(amount.token.equals(route.output), 'OUTPUT');
      amounts[amounts.length - 1] = amount;

      for (let i = route.routePath.length - 1; i > 0; i--) {
        const pair = route.pairs[i - 1];
        const [inputAmount, nextPair] = pair.getInputAmount(amounts[i]);

        amounts[i - 1] = inputAmount;
        nextPairs[i - 1] = nextPair;
      }
    }

    this.chainId = chainId;
    this.route = route;
    this.tradeType = tradeType;
    this.inputAmount = tradeType === TradeType.EXACT_INPUT ? amount : amounts[0];
    this.outputAmount = tradeType === TradeType.EXACT_OUTPUT ? amount : amounts[amounts.length - 1];
    this.executionPrice = new Price(
      this.inputAmount.token,
      this.outputAmount.token,
      this.inputAmount.raw,
      this.outputAmount.raw
    );
    this.nextPairs = nextPairs;
    this.nextMidPrice = new Route(chainId, nextPairs, route.input).midPrice;
    this.priceImpact = computePriceImpact(route.midPrice, this.inputAmount, this.outputAmount);
  }

  public minimumAmountOut (slippageTolerance: Percent): TokenAmount {
    invariant(!slippageTolerance.lessThan(ZERO), 'SLIPPAGE_TOLERANCE');

    if (this.tradeType === TradeType.EXACT_OUTPUT) {
      return this.outputAmount;
    } else {
      const slippageAdjustedAmountOut = new Fraction(ONE)
        .add(slippageTolerance)
        .invert()
        .multiply(this.outputAmount.raw).quotient;

      return new TokenAmount(this.outputAmount.token, slippageAdjustedAmountOut);
    }
  }

  public maximumAmountIn (slippageTolerance: Percent): TokenAmount {
    invariant(!slippageTolerance.lessThan(ZERO), 'SLIPPAGE_TOLERANCE');

    if (this.tradeType === TradeType.EXACT_INPUT) {
      return this.inputAmount;
    } else {
      const slippageAdjustedAmountIn = new Fraction(ONE)
        .add(slippageTolerance)
        .multiply(this.inputAmount.raw).quotient;

      return new TokenAmount(this.inputAmount.token, slippageAdjustedAmountIn);
    }
  }

  /**
   * Given a list of pairs, and a fixed amount in, returns the top `maxNumResults` trades that go from an input token
   * amount to an output token, making at most `maxHops` hops.
   * Note this does not consider aggregation, as routes are linear. It's possible a better route exists by splitting
   * the amount in among multiple routes.
   * @param chainId the chain Id of this trade
   * @param pairs the pairs to consider in finding the best trade
   * @param currencyAmountIn exact amount of input currency to spend
   * @param currencyOut the desired currency out
   * @param maxNumResults maximum number of results to return
   * @param maxHops maximum number of hops a returned trade can make, e.g. 1 hop goes through a single pair
   * @param currentPairs used in recursion; the current list of pairs
   * @param originalAmountIn used in recursion; the original value of the currencyAmountIn parameter
   * @param bestTrades used in recursion; the current list of best trades
   */
  public static bestTradeExactIn (
    chainId: number,
    pairs: StandardPool[],
    currencyAmountIn: TokenAmount,
    currencyOut: Token,
    { maxHops = 3, maxNumResults = 3 }: BestTradeOptions = {},
    currentPairs: StandardPool[] = [],
    originalAmountIn: TokenAmount = currencyAmountIn,
    bestTrades: Trade[] = []
  ): Trade[] {
    invariant(pairs.length > 0, 'PAIRS');
    invariant(maxHops > 0, 'MAX_HOPS');
    invariant(originalAmountIn === currencyAmountIn || currentPairs.length > 0, 'INVALID_RECURSION');

    const amountIn = currencyAmountIn;
    const tokenOut = currencyOut;

    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];

      if (!currencyEquals(pair.token0, amountIn.token) && !currencyEquals(pair.token1, amountIn.token)) continue;
      if (pair.reserve0.equal(ZERO) || pair.reserve1.equal(ZERO)) continue;

      let amountOut: TokenAmount;

      try {
        [amountOut] = pair.getOutputAmount(amountIn);
      } catch (error: any) {
        if (error.isInsufficientInputAmountError) continue;
        throw error;
      }

      if (currencyEquals(amountOut.token, tokenOut)) {
        sortedInsert(
          bestTrades,
          new Trade(
            chainId,
            new Route(chainId, [...currentPairs, pair], originalAmountIn.token, currencyOut),
            originalAmountIn,
            TradeType.EXACT_INPUT
          ),
          maxNumResults,
          tradeComparator
        );
      } else if (maxHops > 1 && pairs.length > 1) {
        const pairsExcludingThisPair = pairs.slice(0, i).concat(pairs.slice(i + 1, pairs.length));

        // otherwise, consider all the other paths that lead from this token as long as we have not exceeded maxHops
        Trade.bestTradeExactIn(
          chainId,
          pairsExcludingThisPair,
          amountOut,
          currencyOut,
          {
            maxNumResults,
            maxHops: maxHops - 1
          },
          [...currentPairs, pair],
          originalAmountIn,
          bestTrades
        );
      }
    }

    return bestTrades;
  }

  /**
   * Return the execution price after accounting for slippage tolerance
   * @param slippageTolerance the allowed tolerated slippage
   */
  public worstExecutionPrice (slippageTolerance: Percent): Price {
    return new Price(
      this.inputAmount.token,
      this.outputAmount.token,
      this.maximumAmountIn(slippageTolerance).raw,
      this.minimumAmountOut(slippageTolerance).raw
    );
  }

  /**
   * similar to the above method but instead targets a fixed output amount
   * given a list of pairs, and a fixed amount out, returns the top `maxNumResults` trades that go from an input token
   * to an output token amount, making at most `maxHops` hops
   * note this does not consider aggregation, as routes are linear. it's possible a better route exists by splitting
   * the amount in among multiple routes.
   * @param chainId the chain Id of this trade
   * @param pairs the pairs to consider in finding the best trade
   * @param currencyIn the currency to spend
   * @param currencyAmountOut the exact amount of currency out
   * @param maxNumResults maximum number of results to return
   * @param maxHops maximum number of hops a returned trade can make, e.g. 1 hop goes through a single pair
   * @param currentPairs used in recursion; the current list of pairs
   * @param originalAmountOut used in recursion; the original value of the currencyAmountOut parameter
   * @param bestTrades used in recursion; the current list of best trades
   */
  public static bestTradeExactOut (
    chainId: number,
    pairs: StandardPool[],
    currencyIn: Token,
    currencyAmountOut: TokenAmount,
    { maxHops = 3, maxNumResults = 3 }: BestTradeOptions = {},
    currentPairs: StandardPool[] = [],
    originalAmountOut: TokenAmount = currencyAmountOut,
    bestTrades: Trade[] = []
  ): Trade[] {
    invariant(pairs.length > 0, 'PAIRS');
    invariant(maxHops > 0, 'MAX_HOPS');
    invariant(originalAmountOut === currencyAmountOut || currentPairs.length > 0, 'INVALID_RECURSION');

    const amountOut = currencyAmountOut;
    const tokenIn = currencyIn;

    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];

      if (!currencyEquals(pair.token0, amountOut.token) && !currencyEquals(pair.token1, amountOut.token)) continue;
      if (pair.reserve0.equal(ZERO) || pair.reserve1.equal(ZERO)) continue;

      let amountIn: TokenAmount;

      try {
        [amountIn] = pair.getInputAmount(amountOut);
      } catch (error: any) {
        // not enough liquidity in this pair
        if (error.isInsufficientReservesError) {
          continue;
        }

        throw error;
      }

      // we have arrived at the input token, so this is the first trade of one of the paths
      if (currencyEquals(amountIn.token, tokenIn)) {
        sortedInsert(
          bestTrades,
          new Trade(
            chainId,
            new Route(chainId, [pair, ...currentPairs], currencyIn, originalAmountOut.token),
            originalAmountOut,
            TradeType.EXACT_OUTPUT
          ),
          maxNumResults,
          tradeComparator
        );
      } else if (maxHops > 1 && pairs.length > 1) {
        const pairsExcludingThisPair = pairs.slice(0, i).concat(pairs.slice(i + 1, pairs.length));

        // otherwise, consider all the other paths that arrive at this token as long as we have not exceeded maxHops
        Trade.bestTradeExactOut(
          chainId,
          pairsExcludingThisPair,
          currencyIn,
          amountIn,
          {
            maxNumResults,
            maxHops: maxHops - 1
          },
          [pair, ...currentPairs],
          originalAmountOut,
          bestTrades
        );
      }
    }

    return bestTrades;
  }
}
