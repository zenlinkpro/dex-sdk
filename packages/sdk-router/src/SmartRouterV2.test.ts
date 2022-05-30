import { JSBI, Percent, Token, TokenAmount, StableSwap, StandardPool } from '@zenlink-dex/sdk-core';
import { SmartRouterV2 } from './SmartRouterV2';

describe('SmartRouterV2', () => {
  const token0 = new Token({
    networkId: 100,
    chainId: 2023,
    assetType: 255,
    assetIndex: 0,
    symbol: 'USDC',
    decimals: 6,
    name: 'USDC',
    address: '0x7CfECCc9b2C5930022D81a6C282b0cb82895b504'
  });

  const token1 = new Token({
    networkId: 100,
    chainId: 2023,
    assetType: 255,
    assetIndex: 0,
    symbol: 'USDT',
    decimals: 6,
    name: 'USDT',
    address: '0x6a4a1917921C7C6979fB5D7CABBb4493ba8E6080'
  });

  const token2 = new Token({
    networkId: 100,
    chainId: 2023,
    assetType: 255,
    assetIndex: 0,
    symbol: 'DAI',
    decimals: 18,
    name: 'DAI',
    address: '0x2621e1dCD4a7Cf9e8B49C1f881e42827221AFAbF'
  });

  const token3 = new Token({
    networkId: 100,
    chainId: 2023,
    assetType: 255,
    assetIndex: 0,
    symbol: 'anyETH',
    decimals: 18,
    name: 'Ethereum',
    address: '0xfa9343c3897324496a05fc75abed6bac29f8a40f'
  });

  const token4 = new Token({
    networkId: 100,
    chainId: 2023,
    assetType: 255,
    assetIndex: 0,
    symbol: 'FRAX',
    decimals: 18,
    name: 'FRAX',
    address: '0x322e86852e492a7ee17f28a78c663da38fb33bfb'
  });

  const pair_0_2 = new StandardPool(
    new TokenAmount(new Token({
      networkId: 100,
      chainId: 2023,
      assetType: 255,
      assetIndex: 0,
      symbol: 'PHA',
      decimals: 18,
      name: 'Phala',
      address: ''
    }), 1000),
    new TokenAmount(token0, JSBI.BigInt('10000000')),
    new TokenAmount(token2, JSBI.BigInt('10500000000000000000'))
  );

  const pair_2_3 = new StandardPool(
    new TokenAmount(new Token({
      networkId: 100,
      chainId: 2023,
      assetType: 255,
      assetIndex: 0,
      symbol: 'PHA',
      decimals: 18,
      name: 'Phala',
      address: ''
    }), 10000),
    new TokenAmount(token2, JSBI.BigInt('100000000000000000000')),
    new TokenAmount(token3, JSBI.BigInt('110000000000000000000'))
  );

  const pair_2_4 = new StandardPool(
    new TokenAmount(new Token({
      networkId: 100,
      chainId: 2023,
      assetType: 255,
      assetIndex: 0,
      symbol: 'PHA',
      decimals: 18,
      name: 'Phala',
      address: ''
    }), 100000),
    new TokenAmount(token2, JSBI.BigInt('100000000000000000000')),
    new TokenAmount(token4, JSBI.BigInt('80000000000000000000'))
  );

  const pair_3_4 = new StandardPool(
    new TokenAmount(new Token({
      networkId: 100,
      chainId: 2023,
      assetType: 255,
      assetIndex: 0,
      symbol: 'PHA',
      decimals: 18,
      name: 'Phala',
      address: ''
    }), 10000),
    new TokenAmount(token3, JSBI.BigInt('100000000000000000000')),
    new TokenAmount(token4, JSBI.BigInt('100000000000000000000'))
  );

  const lpToken = new Token({
    networkId: 100,
    chainId: 2023,
    assetType: 255,
    assetIndex: 0,
    symbol: '3Pool',
    decimals: 18,
    name: '3Pool',
    address: '0x168719Cf84fe1Df11675EFdCdD79E1Ee2180FB3e'
  });

  const lpToken2 = new Token({
    networkId: 100,
    chainId: 2023,
    assetType: 255,
    assetIndex: 0,
    symbol: '3Pool2',
    decimals: 18,
    name: '3Pool2',
    address: '0x52a61e887c0edb41f98b8a6e82c115272e376e3f'
  });

  const token0Amount = new TokenAmount(token0, JSBI.BigInt('100000000'));
  const token1Amount = new TokenAmount(token1, JSBI.BigInt('100000000'));
  const token2Amount = new TokenAmount(token2, JSBI.BigInt('99000000000000000000'));
  const token4Amount = new TokenAmount(token2, JSBI.BigInt('102000000000000000000'));
  const totalSupply = new TokenAmount(lpToken, JSBI.BigInt('298999996651297474640'));
  const totalSupply2 = new TokenAmount(lpToken2, JSBI.BigInt('298999996651297474640'));
  const vituralPrice = JSBI.BigInt('1000000000000000000');
  const fee = JSBI.BigInt('5000000');
  const adminFee = JSBI.BigInt('5000000000');
  const A = JSBI.BigInt('1000');

  const stableSwap0 = new StableSwap(
    2023,
    '',
    [token0, token1, token2],
    lpToken,
    totalSupply,
    [token0Amount, token1Amount, token2Amount],
    fee,
    adminFee,
    A,
    vituralPrice
  );

  const stableSwap1 = new StableSwap(
    2023,
    '',
    [lpToken, token4],
    lpToken2,
    totalSupply2,
    [new TokenAmount(lpToken, JSBI.BigInt('100000000000000000000')), token4Amount],
    fee,
    adminFee,
    A,
    vituralPrice
  );

  describe('#swapExactTokensForTokens', () => {
    it('throws with empty pairs', () => {
      expect(
        SmartRouterV2.swapExactTokensForTokens(
          new TokenAmount(token4, '1000000000000000000'),
          token1,
          [],
          []
        ).trade
      ).toBeUndefined();
    });

    it('throws with max hops of 0', () => {
      expect(
        SmartRouterV2.swapExactTokensForTokens(
          new TokenAmount(token4, '1000000000000000000'),
          token1,
          [pair_0_2, pair_2_3, pair_2_4, pair_3_4],
          [stableSwap0, stableSwap1],
          { maxHops: 0 }
        ).trade
      ).toBeUndefined();
    });

    it('provides best route', () => {
      const result = SmartRouterV2.swapExactTokensForTokens(
        new TokenAmount(token4, '1000000000000000000'),
        token1,
        [pair_0_2, pair_2_3, pair_2_4, pair_3_4],
        [stableSwap0, stableSwap1]
      ).trade;

      expect(result).not.toBeUndefined();
      expect(result?.route.routePath).toHaveLength(2);
      expect(result?.route.tokenPath).toEqual([token4, token2, token1]);
      expect(result?.inputAmount).toEqual(new TokenAmount(token4, '1000000000000000000'));
      expect(result?.outputAmount).toEqual(new TokenAmount(token1, '1230291'));
    });

    it('respects maxHops', () => {
      const result = SmartRouterV2.swapExactTokensForTokens(
        new TokenAmount(token4, '1000000000000000000'),
        token1,
        [pair_0_2, pair_2_3, pair_2_4, pair_3_4],
        [stableSwap0, stableSwap1],
        { maxHops: 1 }
      ).trade;

      expect(result).not.toBeUndefined();
      expect(result?.route.routePath).toHaveLength(1);
      expect(result?.route.tokenPath).toEqual([token4, token1]);
    });

    it('respects n', () => {
      const result = SmartRouterV2.swapExactTokensForTokens(
        new TokenAmount(token4, '1000000000000000000'),
        token1,
        [pair_0_2, pair_2_3, pair_2_4, pair_3_4],
        [stableSwap0, stableSwap1],
        { maxNumResults: 1 }
      ).trade;

      expect(result).not.toBeUndefined();
      expect(result?.route.routePath).toHaveLength(2);
      expect(result?.route.tokenPath).toEqual([token4, token2, token1]);
      expect(result?.inputAmount).toEqual(new TokenAmount(token4, '1000000000000000000'));
      expect(result?.outputAmount).toEqual(new TokenAmount(token1, '1230291'));
    });

    it('no path', () => {
      const result = SmartRouterV2.swapExactTokensForTokens(
        new TokenAmount(token4, '1000000000000000000'),
        token3,
        [pair_0_2, pair_2_4],
        [stableSwap0, stableSwap1]
      ).trade;

      expect(result).toBeUndefined();
    });
  });

  describe('#minimumAmountOut', () => {
    const exactIn = SmartRouterV2.swapExactTokensForTokens(
      new TokenAmount(token4, '1000000000000000000'),
      token1,
      [pair_0_2, pair_2_3, pair_2_4, pair_3_4],
      [stableSwap0, stableSwap1],
      { maxNumResults: 1 }
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
        new TokenAmount(token1, JSBI.BigInt('1230291'))
      );
      expect(exactIn?.minimumAmountOut(new Percent(JSBI.BigInt(5), JSBI.BigInt(100)))).toEqual(
        new TokenAmount(token1, JSBI.BigInt('1171705'))
      );
      expect(exactIn?.minimumAmountOut(new Percent(JSBI.BigInt(200), JSBI.BigInt(100)))).toEqual(
        new TokenAmount(token1, JSBI.BigInt('410097'))
      );
    });
  });
});
