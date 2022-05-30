import invariant from 'tiny-invariant';
import { ONE, ZERO, Fraction, Percent, Price, StableSwap, Token, TokenAmount, MultiPath, MultiRoute, AbstractPair, sortedInsert, getStableSwapOutputAmount, currencyEquals, TradeType, StandardPool } from '@zenlink-dex/sdk-core';
import { BestTradeOptions, computePriceImpact, inputOutputComparator } from './trade';

function generateOutputFunction (pathOf: (token: Token) => MultiPath) {
  return (inputAmount: TokenAmount): [TokenAmount, any] =>
    [getStableSwapOutputAmount(pathOf(inputAmount.token), inputAmount), undefined];
}

function convertPoolToAbstractPair (swap: StableSwap, token0: Token, token1: Token): AbstractPair {
  invariant(swap.involvesToken(token0) && swap.involvesToken(token1), 'TOKEN');

  const pathOf = (token: Token): MultiPath => ({
    stable: true,
    input: token,
    output: token.equals(token0) ? token1 : token0,
    pool: swap
  });

  return {
    token0,
    token1,
    reserve0: swap.balances[swap.getTokenIndex(token0)],
    reserve1: swap.balances[swap.getTokenIndex(token1)],
    getOutputAmount: generateOutputFunction(pathOf),
    pathOf
  };
}

function convertPoolAndBaseToAbstractPair (
  baseSwap: StableSwap,
  swap: StableSwap,
  token0: Token,
  token1: Token
): AbstractPair {
  invariant(baseSwap.involvesToken(token0) && swap.involvesToken(token1), 'TOKEN');

  const pathOf = (token: Token): MultiPath => ({
    stable: true,
    input: token,
    output: token.equals(token0) ? token1 : token0,
    pool: swap,
    basePool: baseSwap,
    fromBase: !!token.equals(token0)
  });

  return {
    token0,
    token1,
    reserve0: baseSwap.balances[baseSwap.getTokenIndex(token0)],
    reserve1: swap.balances[swap.getTokenIndex(token1)],
    getOutputAmount: generateOutputFunction(pathOf),
    pathOf
  };
}

export function convertStableSwapsToAbstractPairs (swaps: StableSwap[]): AbstractPair[] {
  const pairs: AbstractPair[] = [];

  for (let i = 0; i < swaps.length; i++) {
    const swap = swaps[i];
    const relatedSwaps = swaps.filter((otherSwap) => otherSwap.involvesToken(swap.lpToken));

    for (let j = 0; j < swap.pooledTokens.length; j++) {
      for (let k = j + 1; k < swap.pooledTokens.length; k++) {
        const token0 = swap.pooledTokens[j];
        const token1 = swap.pooledTokens[k];

        pairs.push(convertPoolToAbstractPair(swap, token0, token1));
      }

      if (!relatedSwaps.length) continue;

      for (const otherSwap of relatedSwaps) {
        for (const token of otherSwap.pooledTokens) {
          if (token.equals(swap.lpToken)) continue;

          const token0 = swap.pooledTokens[j];
          const token1 = token;

          pairs.push(convertPoolAndBaseToAbstractPair(swap, otherSwap, token0, token1));
        }
      }
    }
  }

  return pairs;
}

export function tradeV2Comparator (a: TradeV2, b: TradeV2): number {
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

export class TradeV2 {
  public readonly chainId: number;
  public readonly route: MultiRoute;
  public readonly inputAmount: TokenAmount;
  public readonly outputAmount: TokenAmount;
  public readonly executionPrice: Price;
  public readonly priceImpact: Percent;
  public readonly tradeType: TradeType;

  public constructor (
    chainId: number,
    route: MultiRoute,
    amount: TokenAmount,
    tradeType = TradeType.EXACT_INPUT
  ) {
    const amounts: TokenAmount[] = new Array(route.tokenPath.length);

    if (tradeType === TradeType.EXACT_INPUT) {
      invariant(amount.token.equals(route.input), 'INPUT');
      amounts[0] = amount;

      for (let i = 0; i < route.tokenPath.length - 1; i++) {
        const currentPath = route.routePath[i];
        let outputAmount: TokenAmount;

        if (currentPath.stable) {
          outputAmount = getStableSwapOutputAmount(currentPath, amounts[i]);
        } else {
          invariant(typeof currentPath.pair !== 'undefined', 'PAIR');
          [outputAmount] = currentPath.pair.getOutputAmount(amounts[i]);
        }

        amounts[i + 1] = outputAmount;
      }
    } else {
      invariant(amount.token.equals(route.output), 'OUTPUT');
      amounts[amounts.length - 1] = amount;

      for (let i = route.tokenPath.length - 1; i > 0; i--) {
        const currentPath = route.routePath[i - 1];
        invariant(!currentPath.stable, 'NOT SUPPORT STABLE');
        invariant(typeof currentPath.pair !== 'undefined', 'PAIR');
        const [inputAmount] = (currentPath.pair as StandardPool).getInputAmount(amounts[i]);

        amounts[i - 1] = inputAmount;
      }
    }

    this.chainId = chainId;
    this.tradeType = tradeType;
    this.route = route;
    // this.inputAmount = amount;
    // this.outputAmount = amounts[amounts.length - 1];
    this.inputAmount = tradeType === TradeType.EXACT_INPUT ? amount : amounts[0];
    this.outputAmount = tradeType === TradeType.EXACT_OUTPUT ? amount : amounts[amounts.length - 1];
    this.executionPrice = new Price(
      this.inputAmount.token,
      this.outputAmount.token,
      this.inputAmount.raw,
      this.outputAmount.raw
    );
    this.priceImpact = computePriceImpact(route.midPrice, this.inputAmount, this.outputAmount);
  }

  public minimumAmountOut (slippageTolerance: Percent): TokenAmount {
    invariant(!slippageTolerance.lessThan(ZERO), 'SLIPPAGE_TOLERANCE');

    if (this.tradeType === TradeType.EXACT_OUTPUT) return this.outputAmount;

    const slippageAdjustedAmountOut = new Fraction(ONE)
      .add(slippageTolerance)
      .invert()
      .multiply(this.outputAmount.raw).quotient;

    return new TokenAmount(this.outputAmount.token, slippageAdjustedAmountOut);
  }

  public maximumAmountIn (slippageTolerance: Percent): TokenAmount {
    invariant(!slippageTolerance.lessThan(ZERO), 'SLIPPAGE_TOLERANCE');

    if (this.tradeType === TradeType.EXACT_INPUT) return this.inputAmount;

    const slippageAdjustedAmountIn = new Fraction(ONE)
      .add(slippageTolerance)
      .multiply(this.inputAmount.raw).quotient;

    return new TokenAmount(this.inputAmount.token, slippageAdjustedAmountIn);
  }

  public static bestTradeExactIn (
    chainId: number,
    pairs: AbstractPair[],
    stableSwaps: StableSwap[],
    currencyAmountIn: TokenAmount,
    currencyOut: Token,
    { maxHops = 3, maxNumResults = 3 }: BestTradeOptions = {},
    currentPaths: MultiPath[] = [],
    originalAmountIn: TokenAmount = currencyAmountIn,
    bestTrades: TradeV2[] = []
  ): TradeV2[] {
    invariant(pairs.length > 0 || stableSwaps.length > 0, 'PAIRS_OR_STABLESWAPS');
    invariant(maxHops > 0, 'MAX_HOPS');
    invariant(originalAmountIn === currencyAmountIn || currentPaths.length > 0, 'INVALID_RECURSION');

    const amountIn = currencyAmountIn;
    const tokenOut = currencyOut;

    if (stableSwaps.length) {
      pairs = [...pairs, ...convertStableSwapsToAbstractPairs(stableSwaps)];
      stableSwaps = [];
    }

    for (let i = 0; i < pairs.length; i++) {
      let amountOut: TokenAmount;
      const pair = pairs[i];

      if (!currencyEquals(pair.token0, amountIn.token) && !currencyEquals(pair.token1, amountIn.token)) continue;
      if (pair.reserve0.equal(ZERO) || pair.reserve1.equal(ZERO)) continue;

      try {
        [amountOut] = pair.getOutputAmount(amountIn);
      } catch (error: any) {
        if (error.isInsufficientInputAmountError || error.isCalculationError) continue;
        throw error;
      }

      if (currencyEquals(amountOut.token, tokenOut)) {
        sortedInsert(
          bestTrades,
          new TradeV2(
            chainId,
            new MultiRoute(chainId, [...currentPaths, pair.pathOf(amountIn.token)], originalAmountIn, currencyOut),
            originalAmountIn
          ),
          maxNumResults,
          tradeV2Comparator
        );
      } else if (maxHops > 1 && pairs.length > 1) {
        const pairsExcludingThisPair = pairs.slice(0, i).concat(pairs.slice(i + 1, pairs.length));

        TradeV2.bestTradeExactIn(
          chainId,
          pairsExcludingThisPair,
          stableSwaps,
          amountOut,
          currencyOut,
          {
            maxNumResults,
            maxHops: maxHops - 1
          },
          [...currentPaths, pair.pathOf(amountIn.token)],
          originalAmountIn,
          bestTrades
        );
      }
    }

    return bestTrades;
  }

  public static bestTradeExactOut (
    chainId: number,
    pairs: StandardPool[],
    currencyIn: Token,
    currencyAmountOut: TokenAmount,
    { maxHops = 3, maxNumResults = 3 }: BestTradeOptions = {},
    currentPaths: MultiPath[] = [],
    originalAmountOut: TokenAmount = currencyAmountOut,
    bestTrades: TradeV2[] = []
  ): TradeV2[] {
    invariant(pairs.length > 0, 'PAIRS');
    invariant(maxHops > 0, 'MAX_HOPS');
    invariant(originalAmountOut === currencyAmountOut || currentPaths.length > 0, 'INVALID_RECURSION');

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
          new TradeV2(
            chainId,
            new MultiRoute(chainId, [pair.pathOf(amountIn.token), ...currentPaths], amountIn, originalAmountOut.token),
            originalAmountOut,
            TradeType.EXACT_OUTPUT
          ),
          maxNumResults,
          tradeV2Comparator
        );
      } else if (maxHops > 1 && pairs.length > 1) {
        const pairsExcludingThisPair = pairs.slice(0, i).concat(pairs.slice(i + 1, pairs.length));

        // otherwise, consider all the other paths that arrive at this token as long as we have not exceeded maxHops
        TradeV2.bestTradeExactOut(
          chainId,
          pairsExcludingThisPair,
          currencyIn,
          amountIn,
          {
            maxNumResults,
            maxHops: maxHops - 1
          },
          [pair.pathOf(amountIn.token), ...currentPaths],
          originalAmountOut,
          bestTrades
        );
      }
    }

    return bestTrades;
  }
}
