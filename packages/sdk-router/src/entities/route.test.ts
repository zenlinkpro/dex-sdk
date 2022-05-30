/* eslint-disable sort-keys */
import { Route } from '.';
import JSBI from 'jsbi';
import { StandardPool, Token, TokenAmount } from '@zenlink-dex/sdk-core';

describe('Route', () => {
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
    }), 10000),
    new TokenAmount(token0, JSBI.BigInt(1000)),
    new TokenAmount(token1, JSBI.BigInt(1000))
  );
  const pair_0_2 = new StandardPool(
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
    new TokenAmount(token2, JSBI.BigInt(1100))
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
    }), 10000),
    new TokenAmount(token1, JSBI.BigInt(1200)),
    new TokenAmount(token2, JSBI.BigInt(1000))
  );

  it('constructs a path from the tokens', () => {
    const route = new Route(200, [pair_0_1], token0, token1);

    expect(route.pairs).toEqual([pair_0_1]);
    expect(route.routePath).toEqual([token0, token1]);
    expect(route.input).toEqual(token0);
    expect(route.output).toEqual(token1);
    expect(route.chainId).toEqual(200);
  });

  it('can have a token as both input and output', () => {
    const route = new Route(200, [pair_0_1, pair_0_2, pair_1_2], token1, token1);

    expect(route.pairs).toEqual([pair_0_1, pair_0_2, pair_1_2]);
    expect(route.input).toEqual(token1);
    expect(route.output).toEqual(token1);
  });
});
