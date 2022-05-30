/* eslint-disable sort-keys */
import { Token, TokenAmount, JSBI } from '.';
import { StableSwap } from './stableSwap';

describe('StableSwap', () => {
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

  describe('#APrecise', () => {
    expect(stableSwap.APrecise.toString()).toEqual('100000');
  });

  describe('#virtualPrice', () => {
    expect(stableSwap.virtualPrice.toPrecision(2)).toEqual('1');
  });

  describe('#calculateTokenAmount', () => {
    it('deposit: true', () => {
      expect(stableSwap.calculateTokenAmount(
        [
          new TokenAmount(token0, JSBI.BigInt('15000000')),
          new TokenAmount(token1, JSBI.BigInt('5000000')),
          new TokenAmount(token2, JSBI.BigInt('10000000000000000000'))
        ],
        true
      ).raw.toString()).toEqual('29999773474016621114');
    });

    it('deposit: false', () => {
      expect(stableSwap.calculateTokenAmount(
        [
          new TokenAmount(token0, JSBI.BigInt('15000000')),
          new TokenAmount(token1, JSBI.BigInt('5000000')),
          new TokenAmount(token2, JSBI.BigInt('10000000000000000000'))
        ],
        false
      ).raw.toString()).toEqual('30000277713217741697');
    });
  });

  describe('#calculateSwap', () => {
    it('swap: token0 -> token1', () => {
      expect(stableSwap.calculateSwap(
        0,
        1,
        new TokenAmount(token0, JSBI.BigInt('2000000'))
      ).raw.toString()).toEqual('1998961');
    });

    it('swap: token0 -> token2', () => {
      expect(stableSwap.calculateSwap(
        0,
        2,
        new TokenAmount(token0, JSBI.BigInt('3000000'))
      ).raw.toString()).toEqual('2998379227266023170');
    });

    it('swap: token1 -> token2', () => {
      expect(stableSwap.calculateSwap(
        1,
        2,
        new TokenAmount(token1, JSBI.BigInt('4000000'))
      ).raw.toString()).toEqual('3997798551496830925');
    });

    it('swap: token1 -> token0', () => {
      expect(stableSwap.calculateSwap(
        1,
        0,
        new TokenAmount(token1, JSBI.BigInt('4000000'))
      ).raw.toString()).toEqual('3997841');
    });

    it('swap: token2 -> token0', () => {
      expect(stableSwap.calculateSwap(
        2,
        0,
        new TokenAmount(token2, JSBI.BigInt('5000000000000000000'))
      ).raw.toString()).toEqual('4997299');
    });

    it('swap: token2 -> token1', () => {
      expect(stableSwap.calculateSwap(
        2,
        1,
        new TokenAmount(token2, JSBI.BigInt('6000000000000000000'))
      ).raw.toString()).toEqual('5996698');
    });
  });

  describe('#calculateRemoveLiquidity', () => {
    expect(stableSwap.calculateRemoveLiquidity(
      new TokenAmount(lpToken, JSBI.BigInt('255000000000000000000'))
    )).toEqual([
      new TokenAmount(token0, JSBI.BigInt('85284281')),
      new TokenAmount(token1, JSBI.BigInt('85284281')),
      new TokenAmount(token2, JSBI.BigInt('84431439072694893787'))
    ]);
  });

  describe('#calculateRemoveLiquidityOneToken', () => {
    it('index: 0', () => {
      expect(stableSwap.calculateRemoveLiquidityOneToken(
        new TokenAmount(lpToken, JSBI.BigInt('255000000000000000000')),
        0
      )[0].raw.toString()).toEqual('99997210');
    });

    it('index: 1', () => {
      expect(stableSwap.calculateRemoveLiquidityOneToken(
        new TokenAmount(lpToken, JSBI.BigInt('265000000000000000000')),
        1
      )[0].raw.toString()).toEqual('99997857');
    });

    it('index: 2', () => {
      expect(stableSwap.calculateRemoveLiquidityOneToken(
        new TokenAmount(lpToken, JSBI.BigInt('275000000000000000000')),
        2
      )[0].raw.toString()).toEqual('98998507705647676355');
    });
  });
});
