import JSBI from 'jsbi';
import { StandardPool, Percent, Price, Token, TokenAmount } from '@zenlink-dex/sdk-core';
import { SmartRouterV1 } from './SmartRouterV1';

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
    it('with empty pairs', () => {
      expect(
        SmartRouterV1.swapExactTokensForTokens(new TokenAmount(token0, JSBI.BigInt(100)), token2, [])
          .trade
      ).toBeUndefined();
    });

    it('with max hops of 0', () => {
      expect(
        SmartRouterV1.swapExactTokensForTokens(new TokenAmount(token0, JSBI.BigInt(100)), token2, [pair_0_2], { maxHops: 0 })
          .trade
      ).toBeUndefined();
    });

    it('provides best route', () => {
      const result = SmartRouterV1.swapExactTokensForTokens(new TokenAmount(token0, JSBI.BigInt(100)), token2, [pair_0_2])
        .trade;

      expect(result).not.toBeUndefined();
      expect(result?.route.pairs).toHaveLength(1);
      expect(result?.route.routePath).toEqual([token0, token2]);
      expect(result?.inputAmount).toEqual(new TokenAmount(token0, JSBI.BigInt(100)));
      expect(result?.outputAmount).toEqual(new TokenAmount(token2, JSBI.BigInt(99)));
    });

    it('doesnt throw for zero liquidity pairs', () => {
      expect(
        SmartRouterV1.swapExactTokensForTokens(new TokenAmount(token0, JSBI.BigInt(100)), token1, [empty_pair_0_1])
          .trade
      ).toBeUndefined();
    });

    it('respects maxHops', () => {
      const result = SmartRouterV1.swapExactTokensForTokens(
        new TokenAmount(token0, JSBI.BigInt(10)),
        token2,
        [pair_0_1, pair_0_2, pair_1_2],
        { maxHops: 1 }
      ).trade;

      expect(result).not.toBeUndefined();
      expect(result?.route.pairs).toHaveLength(1);
      expect(result?.route.routePath).toEqual([token0, token2]);
    });

    it('insufficient input for one pair', () => {
      const result = SmartRouterV1.swapExactTokensForTokens(
        new TokenAmount(token0, JSBI.BigInt(1)),
        token2,
        [pair_0_1, pair_0_2, pair_1_2]
      ).trade;

      expect(result).not.toBeUndefined();
      expect(result?.route.pairs).toHaveLength(1);
      expect(result?.route.routePath).toEqual([token0, token2]);
      expect(result?.outputAmount).toEqual(new TokenAmount(token2, JSBI.BigInt(1)));
    });

    it('respects n', () => {
      const result = SmartRouterV1.swapExactTokensForTokens(
        new TokenAmount(token0, JSBI.BigInt(10)),
        token2,
        [pair_0_1, pair_0_2, pair_1_2],
        { maxNumResults: 1 }
      ).trade;

      expect(result).not.toBeUndefined();
    });

    it('no path', () => {
      const result = SmartRouterV1.swapExactTokensForTokens(
        new TokenAmount(token0, JSBI.BigInt(10)),
        token2,
        [pair_0_1, pair_0_3, pair_1_3],
        { maxNumResults: 1 }
      ).trade;

      expect(result).toBeUndefined();
    });
  });

  describe('#maximumAmountIn', () => {
    describe('tradeType = EXACT_INPUT', () => {
      const exactIn = SmartRouterV1.swapExactTokensForTokens(
        new TokenAmount(token0, JSBI.BigInt(100)),
        token2,
        [pair_0_1, pair_1_2]
      ).trade;

      it('throws if less than 0', () => {
        expect(() => exactIn?.maximumAmountIn(new Percent(JSBI.BigInt(-1), JSBI.BigInt(100)))).toThrow(
          'SLIPPAGE_TOLERANCE'
        );
      });
      it('returns exact if 0', () => {
        expect(exactIn?.maximumAmountIn(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(exactIn?.inputAmount);
      });
      it('returns exact if nonzero', () => {
        expect(exactIn?.maximumAmountIn(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(
          new TokenAmount(token0, JSBI.BigInt(100))
        );
        expect(exactIn?.maximumAmountIn(new Percent(JSBI.BigInt(5), JSBI.BigInt(100)))).toEqual(
          new TokenAmount(token0, JSBI.BigInt(100))
        );
        expect(exactIn?.maximumAmountIn(new Percent(JSBI.BigInt(200), JSBI.BigInt(100)))).toEqual(
          new TokenAmount(token0, JSBI.BigInt(100))
        );
      });
    });

    describe('tradeType = EXACT_OUTPUT', () => {
      const exactOut = SmartRouterV1.swapTokensForExactTokens(
        new TokenAmount(token2, JSBI.BigInt(100)),
        token0,
        [pair_0_1, pair_1_2]
      ).trade;

      it('throws if less than 0', () => {
        expect(() => exactOut?.maximumAmountIn(new Percent(JSBI.BigInt(-1), JSBI.BigInt(100)))).toThrow(
          'SLIPPAGE_TOLERANCE'
        );
      });
      it('returns exact if 0', () => {
        expect(exactOut?.maximumAmountIn(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(exactOut?.inputAmount);
      });
      it('returns slippage amount if nonzero', () => {
        expect(exactOut?.maximumAmountIn(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(
          new TokenAmount(token0, JSBI.BigInt(156))
        );
        expect(exactOut?.maximumAmountIn(new Percent(JSBI.BigInt(5), JSBI.BigInt(100)))).toEqual(
          new TokenAmount(token0, JSBI.BigInt(163))
        );
        expect(exactOut?.maximumAmountIn(new Percent(JSBI.BigInt(200), JSBI.BigInt(100)))).toEqual(
          new TokenAmount(token0, JSBI.BigInt(468))
        );
      });
    });
  });

  describe('#minimumAmountOut', () => {
    describe('tradeType = EXACT_INPUT', () => {
      const exactIn = SmartRouterV1.swapExactTokensForTokens(
        new TokenAmount(token0, JSBI.BigInt(100)),
        token2,
        [pair_0_1, pair_1_2]
      ).trade;

      it('throws if less than 0', () => {
        expect(() => exactIn?.minimumAmountOut(new Percent(JSBI.BigInt(-1), JSBI.BigInt(100)))).toThrow(
          'SLIPPAGE_TOLERANCE'
        );
      });
      it('returns exact if 0', () => {
        expect(exactIn?.minimumAmountOut(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(exactIn?.outputAmount);
      });
      it('returns exact if nonzero', () => {
        expect(exactIn?.minimumAmountOut(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(
          new TokenAmount(token2, JSBI.BigInt(69))
        );
        expect(exactIn?.minimumAmountOut(new Percent(JSBI.BigInt(5), JSBI.BigInt(100)))).toEqual(
          new TokenAmount(token2, JSBI.BigInt(65))
        );
        expect(exactIn?.minimumAmountOut(new Percent(JSBI.BigInt(200), JSBI.BigInt(100)))).toEqual(
          new TokenAmount(token2, JSBI.BigInt(23))
        );
      });
    });
    describe('tradeType = EXACT_OUTPUT', () => {
      const exactOut = SmartRouterV1.swapTokensForExactTokens(
        new TokenAmount(token2, JSBI.BigInt(100)),
        token0,
        [pair_0_1, pair_1_2]
      ).trade;

      it('throws if less than 0', () => {
        expect(() => exactOut?.minimumAmountOut(new Percent(JSBI.BigInt(-1), JSBI.BigInt(100)))).toThrow(
          'SLIPPAGE_TOLERANCE'
        );
      });
      it('returns exact if 0', () => {
        expect(exactOut?.minimumAmountOut(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(exactOut?.outputAmount);
      });
      it('returns slippage amount if nonzero', () => {
        expect(exactOut?.minimumAmountOut(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(
          new TokenAmount(token2, JSBI.BigInt(100))
        );
        expect(exactOut?.minimumAmountOut(new Percent(JSBI.BigInt(5), JSBI.BigInt(100)))).toEqual(
          new TokenAmount(token2, JSBI.BigInt(100))
        );
        expect(exactOut?.minimumAmountOut(new Percent(JSBI.BigInt(200), JSBI.BigInt(100)))).toEqual(
          new TokenAmount(token2, JSBI.BigInt(100))
        );
      });
    });
  });

  describe('#worstExecutionPrice', () => {
    describe('tradeType = EXACT_INPUT', () => {
      const exactIn = SmartRouterV1.swapExactTokensForTokens(
        new TokenAmount(token0, JSBI.BigInt(100)),
        token2,
        [pair_0_1, pair_1_2]
      ).trade;

      it('throws if less than 0', () => {
        expect(() => exactIn?.minimumAmountOut(new Percent(-1, 100))).toThrow('SLIPPAGE_TOLERANCE');
      });
      it('returns exact if 0', () => {
        expect(exactIn?.worstExecutionPrice(new Percent(0, 100))).toEqual(exactIn?.executionPrice);
      });
      it('returns exact if nonzero', () => {
        expect(exactIn?.worstExecutionPrice(new Percent(0, 100))).toEqual(new Price(token0, token2, 100, 69));
        expect(exactIn?.worstExecutionPrice(new Percent(5, 100))).toEqual(new Price(token0, token2, 100, 65));
        expect(exactIn?.worstExecutionPrice(new Percent(200, 100))).toEqual(new Price(token0, token2, 100, 23));
      });
    });
    describe('tradeType = EXACT_OUTPUT', () => {
      const exactOut = SmartRouterV1.swapTokensForExactTokens(
        new TokenAmount(token2, JSBI.BigInt(100)),
        token0,
        [pair_0_1, pair_1_2]
      ).trade;

      it('throws if less than 0', () => {
        expect(() => exactOut?.worstExecutionPrice(new Percent(-1, 100))).toThrow('SLIPPAGE_TOLERANCE');
      });
      it('returns exact if 0', () => {
        expect(exactOut?.worstExecutionPrice(new Percent(0, 100))).toEqual(exactOut?.executionPrice);
      });
      it('returns slippage amount if nonzero', () => {
        expect(exactOut?.worstExecutionPrice(new Percent(0, 100))).toEqual(new Price(token0, token2, 156, 100));
        expect(exactOut?.worstExecutionPrice(new Percent(5, 100))).toEqual(new Price(token0, token2, 163, 100));
        expect(exactOut?.worstExecutionPrice(new Percent(200, 100))).toEqual(new Price(token0, token2, 468, 100));
      });
    });
  });

  describe('#bestTradeExactOut', () => {
    it('throws with empty pairs', () => {
      expect(
        SmartRouterV1.swapTokensForExactTokens(
          new TokenAmount(token2, JSBI.BigInt(100)),
          token0,
          []
        ).trade
      ).toBeUndefined();
    });
    it('throws with max hops of 0', () => {
      expect(
        SmartRouterV1.swapTokensForExactTokens(
          new TokenAmount(token2, JSBI.BigInt(100)),
          token0,
          [pair_0_2],
          { maxHops: 0 }
        ).trade
      ).toBeUndefined();
    });

    it('provides best route', () => {
      // const result = Trade.bestTradeExactOut(
      //   200,
      //   [pair_0_1, pair_0_2, pair_1_2],
      //   token0,
      //   new TokenAmount(token2, JSBI.BigInt(100))
      // );

      const result = SmartRouterV1.swapTokensForExactTokens(
        new TokenAmount(token2, JSBI.BigInt(100)),
        token0,
        [pair_0_1, pair_0_2, pair_1_2]
      ).trade;

      expect(result).not.toBeUndefined();
      expect(result?.route.pairs).toHaveLength(1);
      expect(result?.route.routePath).toEqual([token0, token2]);
      expect(result?.inputAmount).toEqual(new TokenAmount(token0, JSBI.BigInt(101)));
      expect(result?.outputAmount).toEqual(new TokenAmount(token2, JSBI.BigInt(100)));
    });

    it('doesnt throw for zero liquidity pairs', () => {
      expect(
        SmartRouterV1.swapTokensForExactTokens(
          new TokenAmount(token1, JSBI.BigInt(100)),
          token0,
          [empty_pair_0_1]
        ).trade
      ).toBeUndefined();
    });

    it('respects maxHops', () => {
      const result = SmartRouterV1.swapTokensForExactTokens(
        new TokenAmount(token2, JSBI.BigInt(100)),
        token0,
        [pair_0_1, pair_0_2, pair_1_2],
        { maxHops: 1 }
      ).trade;

      expect(result).not.toBeUndefined();
      expect(result?.route.pairs).toHaveLength(1);
      expect(result?.route.routePath).toEqual([token0, token2]);
    });

    it('insufficient liquidity', () => {
      const result = SmartRouterV1.swapTokensForExactTokens(
        new TokenAmount(token2, JSBI.BigInt(1200)),
        token0,
        [pair_0_1, pair_0_2, pair_1_2]
      ).trade;

      expect(result).toBeUndefined();
    });

    it('insufficient liquidity in one pair but not the other', () => {
      const result = SmartRouterV1.swapTokensForExactTokens(
        new TokenAmount(token2, JSBI.BigInt(1050)),
        token0,
        [pair_0_1, pair_0_2, pair_1_2]
      ).trade;

      expect(result).not.toBeUndefined();
    });

    it('respects n', () => {
      const result = SmartRouterV1.swapTokensForExactTokens(
        new TokenAmount(token2, JSBI.BigInt(10)),
        token0,
        [pair_0_1, pair_0_2, pair_1_2],
        { maxNumResults: 1 }
      ).trade;

      expect(result).not.toBeUndefined();
    });

    it('no path', () => {
      const result = SmartRouterV1.swapTokensForExactTokens(
        new TokenAmount(token2, JSBI.BigInt(10)),
        token0,
        [pair_0_1, pair_0_3, pair_1_3]
      ).trade;

      expect(result).toBeUndefined();
    });
  });
});
