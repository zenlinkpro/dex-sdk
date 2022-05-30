import { Token, TokenAmount, StandardPool, ONE_HUNDRED } from '@zenlink-dex/sdk-core';
import { SingleTokenPool } from './singleTokenPool';
import JSBI from 'jsbi';

describe('SingleTokenPool', () => {
  const token0 = new Token({
    networkId: 100,
    chainId: 200,
    assetType: 2,
    assetIndex: 1,
    symbol: 'vKsm',
    decimals: 18,
    name: 'vKsm',
    address: ''
  });
  const token1 = new Token({
    networkId: 100,
    chainId: 200,
    assetType: 2,
    assetIndex: 2,
    symbol: 'vDot',
    decimals: 18,
    name: 'vDot',
    address: ''
  });
  const token2 = new Token({
    networkId: 100,
    chainId: 200,
    assetType: 2,
    assetIndex: 3,
    symbol: 'vbtc',
    decimals: 18,
    name: 'vbtc',
    address: ''
  });

  const pair_0_1 = new StandardPool(
    new TokenAmount(new Token({
      networkId: 100,
      chainId: 200,
      assetType: 9,
      assetIndex: 0,
      symbol: 'LP_vKsm_vDot',
      decimals: 18,
      name: 'LP_vKsm_vDot',
      address: ''
    }), 10000),
    new TokenAmount(token0, JSBI.BigInt('0x000000000000000000000000000000000000000000007404a28bae1ef6a4c6a4')),
    new TokenAmount(token1, JSBI.BigInt('0x0000000000000000000000000000000000000000000055bee7a94abfa4eee905'))
  );
  const pair_0_2 = new StandardPool(
    new TokenAmount(new Token({
      networkId: 100,
      chainId: 200,
      assetType: 9,
      assetIndex: 2,
      symbol: 'LP_vKsm_vBtc',
      decimals: 18,
      name: 'LP_vKsm_vBtc',
      address: ''
    }), 10000),
    new TokenAmount(token0, JSBI.BigInt('0x00000000000000000000000000000000000000000000003a510008f1eca70ccd')),
    new TokenAmount(token2, JSBI.BigInt('0x00000000000000000000000000000000000000000000000d65e53e01d10f0296'))
  );
  const pair_1_2 = new StandardPool(
    new TokenAmount(new Token({
      networkId: 1000,
      chainId: 200,
      assetType: 9,
      assetIndex: 3,
      symbol: 'LP_vDot_vBtc',
      decimals: 18,
      name: 'LP_vDot_vBtc',
      address: ''
    }), 10000),
    new TokenAmount(token1, JSBI.BigInt('0x0000000000000000000000000000000000000000000000001628b043ccc34a1c')),
    new TokenAmount(token2, JSBI.BigInt('0x00000000000000000000000000000000000000000000000022dcac1f51ce23e3'))
  );

  it('constructs a single token pool', () => {
    const {
      currentAmountOutFromTrade,
      estimatedAmountOut
    } = SingleTokenPool.bestSingleTokenPool(
      200,
      [pair_0_1, pair_1_2, pair_0_2],
      new TokenAmount(token1, JSBI.BigInt('50000000000000000000')),
      token0
    );

    expect(currentAmountOutFromTrade.subtract(estimatedAmountOut).lessThan(ONE_HUNDRED));
  });
});
