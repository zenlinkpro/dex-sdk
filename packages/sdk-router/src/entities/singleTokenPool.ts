/* eslint-disable sort-keys */
import JSBI from 'jsbi';
import invariant from 'tiny-invariant';
import { Percent, TWO, StandardPool, Token, TokenAmount, abs } from '@zenlink-dex/sdk-core';
import { BestTradeOptions, Trade } from './trade';

function calculateSinglePool (
  chainId: number,
  pairs: StandardPool[],
  basePair: StandardPool,
  currencyAmountIn: TokenAmount,
  currentAmountIn: TokenAmount,
  currencyOut: Token,
  { maxHops, maxNumResults }: BestTradeOptions
): [Trade, TokenAmount, TokenAmount, TokenAmount, StandardPool] {
  const _currentTrade = Trade.bestTradeExactIn(
    chainId,
    pairs,
    currentAmountIn,
    currencyOut,
    { maxHops, maxNumResults }
  )[0];
  const _currentAmountOutFromTrade = _currentTrade.outputAmount;
  const _leftAmountIn = currencyAmountIn.subtract(currentAmountIn);

  let _estimatedAmountOut: TokenAmount, _nextPair: StandardPool;

  if (_currentTrade.route.pairs.length === 1) {
    const _pair = _currentTrade.nextPairs[0];

    _nextPair = _pair;
    _estimatedAmountOut = _pair.priceOf(currencyAmountIn.token).quote(_leftAmountIn);
  } else {
    _estimatedAmountOut = basePair.priceOf(currencyAmountIn.token).quote(_leftAmountIn);
    _nextPair = basePair;
  }

  return [
    _currentTrade,
    _currentAmountOutFromTrade,
    _leftAmountIn,
    _estimatedAmountOut,
    _nextPair
  ];
}

export class SingleTokenPool {
  public static bestSingleTokenPool (
    chainId: number,
    pairs: StandardPool[],
    currencyAmountInTemp: TokenAmount,
    currencyOutTemp: Token,
    { maxHops = 3, maxNumResults = 1 }: BestTradeOptions = {}
  ): {
      currentAmountIn: TokenAmount;
      currentTrade: Trade;
      currentAmountOutFromTrade: TokenAmount;
      estimatedAmountOut: TokenAmount;
      leftAmountIn: TokenAmount;
      priceImpact?: Percent;
      routePath: Token [];
      nextPair: StandardPool;
    } {
    const currencyAmountIn = new TokenAmount(currencyAmountInTemp.token.wrapperToken, currencyAmountInTemp.quotient);
    const currencyOut = currencyOutTemp.wrapperToken;
    const _basePair = pairs.find(
      (pair) => pair.involvesToken(currencyAmountIn.token) && pair.involvesToken(currencyOut)
    );

    invariant(_basePair !== undefined, 'PAIR');
    let deltaValue = JSBI.divide(currencyAmountIn.raw, TWO);

    let _currentAmountIn = new TokenAmount(currencyAmountIn.token, deltaValue);

    let [
      _currentTrade,
      _currentAmountOutFromTrade,
      _leftAmountIn,
      _estimatedAmountOut,
      nextPair
    ] = calculateSinglePool(
      chainId,
      pairs,
      _basePair,
      currencyAmountIn,
      _currentAmountIn,
      currencyOut,
      { maxHops, maxNumResults }
    );

    deltaValue = JSBI.divide(deltaValue, TWO);

    while (
      JSBI.greaterThanOrEqual(
        abs(JSBI.subtract(_currentAmountOutFromTrade.raw, _estimatedAmountOut.raw)), TWO
      ) &&
      JSBI.greaterThanOrEqual(deltaValue, TWO)
    ) {
      _currentAmountIn = new TokenAmount(
        _currentAmountIn.token,
        _currentAmountOutFromTrade.greaterThan(_estimatedAmountOut)
          ? JSBI.subtract(_currentAmountIn.raw, deltaValue)
          : JSBI.add(_currentAmountIn.raw, deltaValue)
      );

      [
        _currentTrade,
        _currentAmountOutFromTrade,
        _leftAmountIn,
        _estimatedAmountOut,
        nextPair
      ] = calculateSinglePool(
        chainId,
        pairs,
        _basePair,
        currencyAmountIn,
        _currentAmountIn,
        currencyOut,
        { maxHops, maxNumResults }
      );

      deltaValue = JSBI.divide(deltaValue, TWO);
    }

    return {
      currentAmountIn: _currentAmountIn,
      currentTrade: _currentTrade,
      leftAmountIn: _leftAmountIn,
      nextPair,
      priceImpact: _currentTrade?.priceImpact,
      routePath: _currentTrade.route.routePath,
      currentAmountOutFromTrade: _currentAmountOutFromTrade,
      estimatedAmountOut: _estimatedAmountOut
    };
  }
}
