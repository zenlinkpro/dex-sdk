/* eslint-disable sort-keys */
import { JSBI, Token, TokenAmount } from '.';
import { MultiRoute } from './multiRoute';
import { StableSwap } from './stableSwap';
import { StandardPool } from './pool';

describe('MultiRoute', () => {
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
    }), '1000'),
    new TokenAmount(token2, JSBI.BigInt('1000000000000000000')),
    new TokenAmount(token3, JSBI.BigInt('2000000000000000000'))
  );

  const token0Amount = new TokenAmount(token0, JSBI.BigInt('100000000'));
  const token1Amount = new TokenAmount(token1, JSBI.BigInt('100000000'));
  const token2Amount = new TokenAmount(token2, JSBI.BigInt('99000000000000000000'));
  const totalSupply = new TokenAmount(lpToken, JSBI.BigInt('298999996651297474640'));
  const vituralPrice = JSBI.BigInt('1000000000000000000');
  const fee = JSBI.BigInt('5000000');
  const adminFee = JSBI.BigInt('5000000000');
  const A = JSBI.BigInt('1000');

  const stableSwap = new StableSwap(
    2001,
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

  it('amm and stable', () => {
    const multiRoute = new MultiRoute(
      2023,
      [
        {
          stable: true,
          input: token0,
          output: token2,
          pool: stableSwap
        },
        {
          stable: false,
          input: token2,
          output: token3,
          pair: pair_2_3
        }
      ],
      new TokenAmount(token0, JSBI.BigInt('1000000')),
      token3
    );

    expect(multiRoute.tokenPath).toEqual([token0, token2, token3]);
    expect(multiRoute.midPrice.toPrecision(6)).toEqual('2');
    expect(multiRoute.input).toEqual(token0);
    expect(multiRoute.output).toEqual(token3);
  });

  it('only stable', () => {
    const multiRoute = new MultiRoute(
      2023,
      [
        {
          stable: true,
          input: token0,
          output: token2,
          pool: stableSwap
        }
      ],
      new TokenAmount(token0, JSBI.BigInt('1000000')),
      token2
    );

    expect(multiRoute.tokenPath).toEqual([token0, token2]);
    expect(multiRoute.midPrice.toPrecision(6)).toEqual('1');
    expect(multiRoute.input).toEqual(token0);
    expect(multiRoute.output).toEqual(token2);
  });

  it('only amm', () => {
    const multiRoute = new MultiRoute(
      2023,
      [
        {
          stable: false,
          input: token2,
          output: token3,
          pair: pair_2_3
        }
      ],
      new TokenAmount(token2, JSBI.BigInt('1000000')),
      token3
    );

    expect(multiRoute.tokenPath).toEqual([token2, token3]);
    expect(multiRoute.midPrice.toPrecision(6)).toEqual('2');
    expect(multiRoute.input).toEqual(token2);
    expect(multiRoute.output).toEqual(token3);
  });
});
