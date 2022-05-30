/* eslint-disable sort-keys */
import { Price, Token, TokenAmount, AssetType } from '.';
import { StandardPool } from './pool';
import { computePairAddress } from './pair';

describe('StandardPool', () => {
  const evmToken0 = new Token({
    address: '0x639a647fbe20b6c8ac19e48e2de44ea792c62c5c',
    networkId: 100,
    chainId: 2023,
    assetType: AssetType.EVM_TOKEN,
    assetIndex: 0,
    symbol: 'ETH',
    decimals: 18,
    name: 'Ethereum'
  });

  const evmToken1 = new Token({
    address: '0xe3f5a90f9cb311505cd691a46596599aa1a0ad7d',
    networkId: 100,
    chainId: 2023,
    assetType: AssetType.EVM_TOKEN,
    assetIndex: 0,
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin'
  });

  const factoryAddress = '0xf36AE63d89983E3aeA8AaaD1086C3280eb01438D';
  const initCodeHash = '0x6278f87a17986c7b82be214d6e4cf48101d7a40fe979fa914ed6337de05c76b8';

  const token0 = new Token({
    networkId: 100,
    chainId: 200,
    assetType: AssetType.NORMAL_TOKEN,
    assetIndex: 1,
    symbol: 'ZLK',
    decimals: 12,
    name: 'Zenlink',
    address: ''
  });
  const token1 = new Token({
    networkId: 100,
    chainId: 200,
    assetType: AssetType.NORMAL_TOKEN,
    assetIndex: 2,
    symbol: 'PCX',
    decimals: 12,
    name: 'ChainX',
    address: ''
  });
  const token2 = new Token({
    networkId: 100,
    chainId: 200,
    assetType: AssetType.NORMAL_TOKEN,
    assetIndex: 3,
    symbol: 'BSC',
    decimals: 12,
    name: 'Bifrost',
    address: ''
  });

  const token0Amount = new TokenAmount(token0, 100);
  const token1Amount = new TokenAmount(token1, 100);

  describe('#computePairAddress', () => {
    it('computePairAddress', () => {
      const pairAddress = computePairAddress({
        factoryAddress,
        initCodeHash: initCodeHash,
        tokenA: evmToken0,
        tokenB: evmToken1
      });

      expect(pairAddress.toLocaleLowerCase()).toEqual('0x23fa9fa6ea199efec986cf90d3740c01a6033ac9');
    });
  });

  describe('#token0', () => {
    it('always is the token that sorts before', () => {
      expect(
        new StandardPool(new TokenAmount(new Token({
          networkId: 100,
          chainId: 200,
          assetType: AssetType.NORMAL_TOKEN,
          assetIndex: 0,
          symbol: 'PHA',
          decimals: 12,
          name: 'Phala',
          address: ''
        }), 1000), token0Amount, token1Amount).token0
      ).toEqual(token0);
      expect(
        new StandardPool(new TokenAmount(new Token({
          networkId: 100,
          chainId: 200,
          assetType: AssetType.NORMAL_TOKEN,
          assetIndex: 0,
          symbol: 'PHA',
          decimals: 12,
          name: 'Phala',
          address: ''
        }), 1000), token1Amount, token0Amount).token0
      ).toEqual(token0);
    });
  });

  describe('#token1', () => {
    it('always is the token that sorts after', () => {
      expect(
        new StandardPool(new TokenAmount(new Token({
          networkId: 100,
          chainId: 200,
          assetType: AssetType.NORMAL_TOKEN,
          assetIndex: 0,
          symbol: 'PHA',
          decimals: 12,
          name: 'Phala',
          address: ''
        }), 1000), token0Amount, token1Amount).token1
      ).toEqual(token1);
      expect(
        new StandardPool(new TokenAmount(new Token({
          networkId: 100,
          chainId: 200,
          assetType: AssetType.NORMAL_TOKEN,
          assetIndex: 0,
          symbol: 'PHA',
          decimals: 12,
          name: 'Phala',
          address: ''
        }), 1000), token1Amount, token0Amount).token1
      ).toEqual(token1);
    });
  });

  describe('#reserve0', () => {
    it('always comes from the token that sorts before', () => {
      expect(
        new StandardPool(new TokenAmount(new Token({
          networkId: 100,
          chainId: 200,
          assetType: AssetType.NORMAL_TOKEN,
          assetIndex: 0,
          symbol: 'PHA',
          decimals: 12,
          name: 'Phala',
          address: ''
        }), 1000), new TokenAmount(token0, 100), new TokenAmount(token1, 101)).reserve0
      ).toEqual(new TokenAmount(token0, 100));
      expect(
        new StandardPool(new TokenAmount(new Token({
          networkId: 100,
          chainId: 200,
          assetType: AssetType.NORMAL_TOKEN,
          assetIndex: 0,
          symbol: 'PHA',
          decimals: 12,
          name: 'Phala',
          address: ''
        }), 1000), new TokenAmount(token1, 101), new TokenAmount(token0, 100)).reserve0
      ).toEqual(new TokenAmount(token0, 100));
    });
  });

  describe('#reserve1', () => {
    it('always comes from the token that sorts after', () => {
      expect(
        new StandardPool(new TokenAmount(new Token({
          networkId: 100,
          chainId: 200,
          assetType: AssetType.NORMAL_TOKEN,
          assetIndex: 0,
          symbol: 'PHA',
          decimals: 12,
          name: 'Phala',
          address: ''
        }), 1000), new TokenAmount(token0, 100), new TokenAmount(token1, 101)).reserve1
      ).toEqual(new TokenAmount(token1, 101));
      expect(
        new StandardPool(new TokenAmount(new Token({
          networkId: 100,
          chainId: 200,
          assetType: AssetType.NORMAL_TOKEN,
          assetIndex: 0,
          symbol: 'PHA',
          decimals: 12,
          name: 'Phala',
          address: ''
        }), 1000), new TokenAmount(token1, 101), new TokenAmount(token0, 100)).reserve1
      ).toEqual(new TokenAmount(token1, 101));
    });
  });

  describe('#token0Price', () => {
    it('returns price of token0 in terms of token1', () => {
      expect(
        new StandardPool(new TokenAmount(new Token({
          networkId: 100,
          chainId: 200,
          assetType: AssetType.NORMAL_TOKEN,
          assetIndex: 0,
          symbol: 'PHA',
          decimals: 12,
          name: 'Phala',
          address: ''
        }), 1000), new TokenAmount(token0, 101), new TokenAmount(token1, 100)).token0Price
      ).toEqual(new Price(token0, token1, '101', '100'));
      expect(
        new StandardPool(new TokenAmount(new Token({
          networkId: 100,
          chainId: 200,
          assetType: AssetType.NORMAL_TOKEN,
          assetIndex: 0,
          symbol: 'PHA',
          decimals: 12,
          name: 'Phala',
          address: ''
        }), 1000), new TokenAmount(token1, 100), new TokenAmount(token0, 101)).token0Price
      ).toEqual(new Price(token0, token1, '101', '100'));
    });
  });

  describe('#token1Price', () => {
    it('returns price of token1 in terms of token0', () => {
      expect(
        new StandardPool(new TokenAmount(new Token({
          networkId: 100,
          chainId: 200,
          assetType: AssetType.NORMAL_TOKEN,
          assetIndex: 0,
          symbol: 'PHA',
          decimals: 12,
          name: 'Phala',
          address: ''
        }), 1000), new TokenAmount(token0, 101), new TokenAmount(token1, 100)).token1Price
      ).toEqual(new Price(token1, token0, '100', '101'));
      expect(
        new StandardPool(new TokenAmount(new Token({
          networkId: 100,
          chainId: 200,
          assetType: AssetType.NORMAL_TOKEN,
          assetIndex: 0,
          symbol: 'PHA',
          decimals: 12,
          name: 'Phala',
          address: ''
        }), 1000), new TokenAmount(token1, 100), new TokenAmount(token0, 101)).token1Price
      ).toEqual(new Price(token1, token0, '100', '101'));
    });
  });

  describe('#priceOf', () => {
    const pair = new StandardPool(new TokenAmount(new Token({
      networkId: 100,
      chainId: 200,
      assetType: AssetType.NORMAL_TOKEN,
      assetIndex: 0,
      symbol: 'PHA',
      decimals: 12,
      name: 'Phala',
      address: ''
    }), 1000), new TokenAmount(token0, 101), new TokenAmount(token1, 100));

    it('returns price of token in terms of other token', () => {
      expect(pair.priceOf(token0)).toEqual(pair.token0Price);
      expect(pair.priceOf(token1)).toEqual(pair.token1Price);
    });
  });

  describe('#reserveOf', () => {
    it('returns reserves of the given token', () => {
      expect(
        new StandardPool(new TokenAmount(new Token({
          networkId: 100,
          chainId: 200,
          assetType: AssetType.NORMAL_TOKEN,
          assetIndex: 0,
          symbol: 'PHA',
          decimals: 12,
          name: 'Phala',
          address: ''
        }), 1000), new TokenAmount(token0, 101), new TokenAmount(token1, 100)).reserveOf(token0)
      ).toEqual(new TokenAmount(token0, 101));
      expect(
        new StandardPool(new TokenAmount(new Token({
          networkId: 100,
          chainId: 200,
          assetType: AssetType.NORMAL_TOKEN,
          assetIndex: 0,
          symbol: 'PHA',
          decimals: 12,
          name: 'Phala',
          address: ''
        }), 1000), new TokenAmount(token0, 101), new TokenAmount(token1, 100)).reserveOf(token1)
      ).toEqual(new TokenAmount(token1, 100));
    });
  });

  describe('#involvesToken', () => {
    expect(
      new StandardPool(new TokenAmount(new Token({
        networkId: 100,
        chainId: 200,
        assetType: AssetType.NORMAL_TOKEN,
        assetIndex: 0,
        symbol: 'PHA',
        decimals: 12,
        name: 'Phala',
        address: ''
      }), 1000), new TokenAmount(token0, 100), new TokenAmount(token1, 100)).involvesToken(token0)
    ).toEqual(true);
    expect(
      new StandardPool(new TokenAmount(new Token({
        networkId: 100,
        chainId: 200,
        assetType: AssetType.NORMAL_TOKEN,
        assetIndex: 0,
        symbol: 'PHA',
        decimals: 12,
        name: 'Phala',
        address: ''
      }), 1000), new TokenAmount(token0, 100), new TokenAmount(token1, 100)).involvesToken(token1)
    ).toEqual(true);
    expect(
      new StandardPool(new TokenAmount(new Token({
        networkId: 100,
        chainId: 200,
        assetType: AssetType.NORMAL_TOKEN,
        assetIndex: 0,
        symbol: 'PHA',
        decimals: 12,
        name: 'Phala',
        address: ''
      }), 1000), new TokenAmount(token0, 100), new TokenAmount(token1, 100)).involvesToken(token2)
    ).toEqual(false);
  });

  describe('miscellaneous', () => {
    it('getLiquidityMinted:!0', () => {
      const token0 = new Token({
        networkId: 100,
        chainId: 200,
        assetType: AssetType.NORMAL_TOKEN,
        assetIndex: 1,
        symbol: 'ZLK',
        decimals: 12,
        name: 'Zenlink',
        address: ''
      });
      const token1 = new Token({
        networkId: 100,
        chainId: 200,
        assetType: AssetType.NORMAL_TOKEN,
        assetIndex: 2,
        symbol: 'PCX',
        decimals: 12,
        name: 'ChainX',
        address: ''
      });
      const pair = new StandardPool(new TokenAmount(new Token({
        networkId: 100,
        chainId: 200,
        assetType: AssetType.NORMAL_TOKEN,
        assetIndex: 0,
        symbol: 'PHA',
        decimals: 12,
        name: 'Phala',
        address: ''
      }), 1000), new TokenAmount(token0, '10000'), new TokenAmount(token1, '10000'));

      expect(
        pair
          .getLiquidityMinted(
            new TokenAmount(pair.liquidityToken, '10000'),
            new TokenAmount(token0, '2000'),
            new TokenAmount(token1, '2000')
          )
          .raw.toString()
      ).toEqual('2000');
    });
  });
});
