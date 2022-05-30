/* eslint-disable sort-keys */
import JSBI from 'jsbi';
import { TradeType, StandardPool, Percent, Price, Token, TokenAmount } from '@zenlink-dex/sdk-core';
import { Route } from './route';
import { Trade } from './trade';

describe('Trade', () => {
  const token0 = new Token({
    networkId: 100,
    chainId: 200,
    assetType: 2,
    assetIndex: 1,
    symbol: 'ZLK',
    decimals: 12,
    name: 'Zenlink',
    address: ''
  });
  const token1 = new Token({
    networkId: 100,
    chainId: 200,
    assetType: 2,
    assetIndex: 2,
    symbol: 'PCX',
    decimals: 12,
    name: 'ChainX',
    address: ''
  });
  const token2 = new Token({
    networkId: 100,
    chainId: 200,
    assetType: 2,
    assetIndex: 3,
    symbol: 'BSC',
    decimals: 12,
    name: 'Bifrost',
    address: ''
  });
  const token3 = new Token({
    networkId: 100,
    chainId: 200,
    assetType: 2,
    assetIndex: 4,
    symbol: 'PHA',
    decimals: 12,
    name: 'Phala',
    address: ''
  });

  const pair_0_1 = new StandardPool(
    new TokenAmount(new Token({
      networkId: 100,
      chainId: 200,
      assetType: 9,
      assetIndex: 0,
      symbol: 'PHA',
      decimals: 12,
      name: 'Phala',
      address: ''
    }), 100),
    new TokenAmount(token0, JSBI.BigInt(1000)),
    new TokenAmount(token1, JSBI.BigInt(1000))
  );
  const pair_0_2 = new StandardPool(
    new TokenAmount(new Token({
      networkId: 100,
      chainId: 200,
      assetType: 9,
      assetIndex: 1,
      symbol: 'PHA',
      decimals: 12,
      name: 'Phala',
      address: ''
    }), 1000),
    new TokenAmount(token0, JSBI.BigInt(1000)),
    new TokenAmount(token2, JSBI.BigInt(1100))
  );
  const pair_0_3 = new StandardPool(
    new TokenAmount(new Token({
      networkId: 100,
      chainId: 200,
      assetType: 9,
      assetIndex: 2,
      symbol: 'PHA',
      decimals: 12,
      name: 'Phala',
      address: ''
    }), 1000),
    new TokenAmount(token0, JSBI.BigInt(1000)),
    new TokenAmount(token3, JSBI.BigInt(900))
  );
  const pair_1_2 = new StandardPool(
    new TokenAmount(new Token({
      networkId: 100,
      chainId: 200,
      assetType: 9,
      assetIndex: 3,
      symbol: 'PHA',
      decimals: 12,
      name: 'Phala',
      address: ''
    }), 1000),
    new TokenAmount(token1, JSBI.BigInt(1200)),
    new TokenAmount(token2, JSBI.BigInt(1000))
  );
  const pair_1_3 = new StandardPool(
    new TokenAmount(new Token({
      networkId: 100,
      chainId: 200,
      assetType: 9,
      assetIndex: 4,
      symbol: 'PHA',
      decimals: 12,
      name: 'Phala',
      address: ''
    }), 1000),
    new TokenAmount(token1, JSBI.BigInt(1200)),
    new TokenAmount(token3, JSBI.BigInt(1300))
  );

  const empty_pair_0_1 = new StandardPool(
    new TokenAmount(new Token({
      networkId: 100,
      chainId: 200,
      assetType: 9,
      assetIndex: 5,
      symbol: 'PHA',
      decimals: 12,
      name: 'Phala',
      address: ''
    }), 1000),
    new TokenAmount(token0, JSBI.BigInt(0)),
    new TokenAmount(token1, JSBI.BigInt(0))
  );

  describe('#bestTradeExactIn', () => {
    it('throws with empty pairs', () => {
      expect(() => Trade.bestTradeExactIn(200, [], new TokenAmount(token0, JSBI.BigInt(100)), token2)).toThrow('PAIRS');
    });

    it('throws with max hops of 0', () => {
      expect(() =>
        Trade.bestTradeExactIn(200, [pair_0_2], new TokenAmount(token0, JSBI.BigInt(100)), token2, { maxHops: 0 })
      ).toThrow('MAX_HOPS');
    });

    it('provides best route', () => {
      const result = Trade.bestTradeExactIn(
        200,
        [pair_0_1, pair_0_2, pair_1_2],
        new TokenAmount(token0, JSBI.BigInt(100)),
        token2
      );

      expect(result).toHaveLength(2);
      expect(result[0].route.pairs).toHaveLength(1);
      expect(result[0].route.routePath).toEqual([token0, token2]);
      expect(result[0].inputAmount).toEqual(new TokenAmount(token0, JSBI.BigInt(100)));
      expect(result[0].outputAmount).toEqual(new TokenAmount(token2, JSBI.BigInt(99)));
      expect(result[1].route.pairs).toHaveLength(2);
      expect(result[1].route.routePath).toEqual([token0, token1, token2]);
      expect(result[1].inputAmount).toEqual(new TokenAmount(token0, JSBI.BigInt(100)));
      expect(result[1].outputAmount).toEqual(new TokenAmount(token2, JSBI.BigInt(69)));
    });

    it('doesnt throw for zero liquidity pairs', () => {
      expect(
        Trade.bestTradeExactIn(200, [empty_pair_0_1], new TokenAmount(token0, JSBI.BigInt(100)), token1)
      ).toHaveLength(0);
    });

    it('respects maxHops', () => {
      const result = Trade.bestTradeExactIn(
        200,
        [pair_0_1, pair_0_2, pair_1_2],
        new TokenAmount(token0, JSBI.BigInt(10)),
        token2,
        { maxHops: 1 }
      );

      expect(result).toHaveLength(1);
      expect(result[0].route.pairs).toHaveLength(1);
      expect(result[0].route.routePath).toEqual([token0, token2]);
    });

    it('insufficient input for one pair', () => {
      const result = Trade.bestTradeExactIn(
        200,
        [pair_0_1, pair_0_2, pair_1_2],
        new TokenAmount(token0, JSBI.BigInt(1)),
        token2
      );

      expect(result).toHaveLength(1);
      expect(result[0].route.pairs).toHaveLength(1);
      expect(result[0].route.routePath).toEqual([token0, token2]);
      expect(result[0].outputAmount).toEqual(new TokenAmount(token2, JSBI.BigInt(1)));
    });

    it('respects n', () => {
      const result = Trade.bestTradeExactIn(
        200,
        [pair_0_1, pair_0_2, pair_1_2],
        new TokenAmount(token0, JSBI.BigInt(10)),
        token2,
        { maxNumResults: 1 }
      );

      expect(result).toHaveLength(1);
    });

    it('no path', () => {
      const result = Trade.bestTradeExactIn(
        200,
        [pair_0_1, pair_0_3, pair_1_3],
        new TokenAmount(token0, JSBI.BigInt(10)),
        token2
      );

      expect(result).toHaveLength(0);
    });
  });

  describe('#maximumAmountIn', () => {
    describe('tradeType = EXACT_INPUT', () => {
      const exactIn = new Trade(
        200,
        new Route(200, [pair_0_1, pair_1_2], token0),
        new TokenAmount(token0, JSBI.BigInt(100)),
        TradeType.EXACT_INPUT
      );

      it('throws if less than 0', () => {
        expect(() => exactIn.maximumAmountIn(new Percent(JSBI.BigInt(-1), JSBI.BigInt(100)))).toThrow(
          'SLIPPAGE_TOLERANCE'
        );
      });
      it('returns exact if 0', () => {
        expect(exactIn.maximumAmountIn(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(exactIn.inputAmount);
      });
      it('returns exact if nonzero', () => {
        expect(exactIn.maximumAmountIn(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(
          new TokenAmount(token0, JSBI.BigInt(100))
        );
        expect(exactIn.maximumAmountIn(new Percent(JSBI.BigInt(5), JSBI.BigInt(100)))).toEqual(
          new TokenAmount(token0, JSBI.BigInt(100))
        );
        expect(exactIn.maximumAmountIn(new Percent(JSBI.BigInt(200), JSBI.BigInt(100)))).toEqual(
          new TokenAmount(token0, JSBI.BigInt(100))
        );
      });
    });

    describe('tradeType = EXACT_OUTPUT', () => {
      const exactOut = new Trade(
        200,
        new Route(200, [pair_0_1, pair_1_2], token0),
        new TokenAmount(token2, JSBI.BigInt(100)),
        TradeType.EXACT_OUTPUT
      );

      it('throws if less than 0', () => {
        expect(() => exactOut.maximumAmountIn(new Percent(JSBI.BigInt(-1), JSBI.BigInt(100)))).toThrow(
          'SLIPPAGE_TOLERANCE'
        );
      });
      it('returns exact if 0', () => {
        expect(exactOut.maximumAmountIn(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(exactOut.inputAmount);
      });
      it('returns slippage amount if nonzero', () => {
        expect(exactOut.maximumAmountIn(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(
          new TokenAmount(token0, JSBI.BigInt(156))
        );
        expect(exactOut.maximumAmountIn(new Percent(JSBI.BigInt(5), JSBI.BigInt(100)))).toEqual(
          new TokenAmount(token0, JSBI.BigInt(163))
        );
        expect(exactOut.maximumAmountIn(new Percent(JSBI.BigInt(200), JSBI.BigInt(100)))).toEqual(
          new TokenAmount(token0, JSBI.BigInt(468))
        );
      });
    });
  });

  describe('#minimumAmountOut', () => {
    describe('tradeType = EXACT_INPUT', () => {
      const exactIn = new Trade(
        200,
        new Route(200, [pair_0_1, pair_1_2], token0),
        new TokenAmount(token0, JSBI.BigInt(100)),
        TradeType.EXACT_INPUT
      );

      it('throws if less than 0', () => {
        expect(() => exactIn.minimumAmountOut(new Percent(JSBI.BigInt(-1), JSBI.BigInt(100)))).toThrow(
          'SLIPPAGE_TOLERANCE'
        );
      });
      it('returns exact if 0', () => {
        expect(exactIn.minimumAmountOut(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(exactIn.outputAmount);
      });
      it('returns exact if nonzero', () => {
        expect(exactIn.minimumAmountOut(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(
          new TokenAmount(token2, JSBI.BigInt(69))
        );
        expect(exactIn.minimumAmountOut(new Percent(JSBI.BigInt(5), JSBI.BigInt(100)))).toEqual(
          new TokenAmount(token2, JSBI.BigInt(65))
        );
        expect(exactIn.minimumAmountOut(new Percent(JSBI.BigInt(200), JSBI.BigInt(100)))).toEqual(
          new TokenAmount(token2, JSBI.BigInt(23))
        );
      });
    });
    describe('tradeType = EXACT_OUTPUT', () => {
      const exactOut = new Trade(
        200,
        new Route(200, [pair_0_1, pair_1_2], token0),
        new TokenAmount(token2, JSBI.BigInt(100)),
        TradeType.EXACT_OUTPUT
      );

      it('throws if less than 0', () => {
        expect(() => exactOut.minimumAmountOut(new Percent(JSBI.BigInt(-1), JSBI.BigInt(100)))).toThrow(
          'SLIPPAGE_TOLERANCE'
        );
      });
      it('returns exact if 0', () => {
        expect(exactOut.minimumAmountOut(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(exactOut.outputAmount);
      });
      it('returns slippage amount if nonzero', () => {
        expect(exactOut.minimumAmountOut(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(
          new TokenAmount(token2, JSBI.BigInt(100))
        );
        expect(exactOut.minimumAmountOut(new Percent(JSBI.BigInt(5), JSBI.BigInt(100)))).toEqual(
          new TokenAmount(token2, JSBI.BigInt(100))
        );
        expect(exactOut.minimumAmountOut(new Percent(JSBI.BigInt(200), JSBI.BigInt(100)))).toEqual(
          new TokenAmount(token2, JSBI.BigInt(100))
        );
      });
    });
  });

  describe('#worstExecutionPrice', () => {
    describe('tradeType = EXACT_INPUT', () => {
      const exactIn = new Trade(
        200,
        new Route(200, [pair_0_1, pair_1_2], token0),
        new TokenAmount(token0, 100),
        TradeType.EXACT_INPUT
      );

      it('throws if less than 0', () => {
        expect(() => exactIn.minimumAmountOut(new Percent(-1, 100))).toThrow('SLIPPAGE_TOLERANCE');
      });
      it('returns exact if 0', () => {
        expect(exactIn.worstExecutionPrice(new Percent(0, 100))).toEqual(exactIn.executionPrice);
      });
      it('returns exact if nonzero', () => {
        expect(exactIn.worstExecutionPrice(new Percent(0, 100))).toEqual(new Price(token0, token2, 100, 69));
        expect(exactIn.worstExecutionPrice(new Percent(5, 100))).toEqual(new Price(token0, token2, 100, 65));
        expect(exactIn.worstExecutionPrice(new Percent(200, 100))).toEqual(new Price(token0, token2, 100, 23));
      });
    });
    describe('tradeType = EXACT_OUTPUT', () => {
      const exactOut = new Trade(
        200,
        new Route(200, [pair_0_1, pair_1_2], token0),
        new TokenAmount(token2, 100),
        TradeType.EXACT_OUTPUT
      );

      it('throws if less than 0', () => {
        expect(() => exactOut.worstExecutionPrice(new Percent(-1, 100))).toThrow('SLIPPAGE_TOLERANCE');
      });
      it('returns exact if 0', () => {
        expect(exactOut.worstExecutionPrice(new Percent(0, 100))).toEqual(exactOut.executionPrice);
      });
      it('returns slippage amount if nonzero', () => {
        expect(exactOut.worstExecutionPrice(new Percent(0, 100))).toEqual(new Price(token0, token2, 156, 100));
        expect(exactOut.worstExecutionPrice(new Percent(5, 100))).toEqual(new Price(token0, token2, 163, 100));
        expect(exactOut.worstExecutionPrice(new Percent(200, 100))).toEqual(new Price(token0, token2, 468, 100));
      });
    });
  });

  describe('#bestTradeExactOut', () => {
    it('throws with empty pairs', () => {
      expect(() => Trade.bestTradeExactOut(200, [], token0, new TokenAmount(token2, JSBI.BigInt(100)))).toThrow('PAIRS');
    });
    it('throws with max hops of 0', () => {
      expect(() =>
        Trade.bestTradeExactOut(200, [pair_0_2], token0, new TokenAmount(token2, JSBI.BigInt(100)), { maxHops: 0 })
      ).toThrow('MAX_HOPS');
    });

    it('provides best route', () => {
      const result = Trade.bestTradeExactOut(
        200,
        [pair_0_1, pair_0_2, pair_1_2],
        token0,
        new TokenAmount(token2, JSBI.BigInt(100))
      );

      expect(result).toHaveLength(2);
      expect(result[0].route.pairs).toHaveLength(1);
      expect(result[0].route.routePath).toEqual([token0, token2]);
      expect(result[0].inputAmount).toEqual(new TokenAmount(token0, JSBI.BigInt(101)));
      expect(result[0].outputAmount).toEqual(new TokenAmount(token2, JSBI.BigInt(100)));
      expect(result[1].route.pairs).toHaveLength(2);
      expect(result[1].route.routePath).toEqual([token0, token1, token2]);
      expect(result[1].inputAmount).toEqual(new TokenAmount(token0, JSBI.BigInt(156)));
      expect(result[1].outputAmount).toEqual(new TokenAmount(token2, JSBI.BigInt(100)));
    });

    it('doesnt throw for zero liquidity pairs', () => {
      expect(
        Trade.bestTradeExactOut(200, [empty_pair_0_1], token1, new TokenAmount(token1, JSBI.BigInt(100)))
      ).toHaveLength(0);
    });

    it('respects maxHops', () => {
      const result = Trade.bestTradeExactOut(
        200,
        [pair_0_1, pair_0_2, pair_1_2],
        token0,
        new TokenAmount(token2, JSBI.BigInt(10)),
        { maxHops: 1 }
      );

      expect(result).toHaveLength(1);
      expect(result[0].route.pairs).toHaveLength(1);
      expect(result[0].route.routePath).toEqual([token0, token2]);
    });

    it('insufficient liquidity', () => {
      const result = Trade.bestTradeExactOut(
        200,
        [pair_0_1, pair_0_2, pair_1_2],
        token0,
        new TokenAmount(token2, JSBI.BigInt(1200))
      );

      expect(result).toHaveLength(0);
    });

    it('insufficient liquidity in one pair but not the other', () => {
      const result = Trade.bestTradeExactOut(
        200,
        [pair_0_1, pair_0_2, pair_1_2],
        token0,
        new TokenAmount(token2, JSBI.BigInt(1050))
      );

      expect(result).toHaveLength(1);
    });

    it('respects n', () => {
      const result = Trade.bestTradeExactOut(
        200,
        [pair_0_1, pair_0_2, pair_1_2],
        token0,
        new TokenAmount(token2, JSBI.BigInt(10)),
        { maxNumResults: 1 }
      );

      expect(result).toHaveLength(1);
    });

    it('no path', () => {
      const result = Trade.bestTradeExactOut(
        200,
        [pair_0_1, pair_0_3, pair_1_3],
        token0,
        new TokenAmount(token2, JSBI.BigInt(10))
      );

      expect(result).toHaveLength(0);
    });
  });
});
