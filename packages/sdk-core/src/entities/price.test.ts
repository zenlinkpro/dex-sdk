/* eslint-disable sort-keys */
import JSBI from 'jsbi';
import { Price } from './price';
import { Token } from './token';

describe('Price Trade', () => {
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

  const price1 = new Price(token0, token2, JSBI.BigInt(1000), JSBI.BigInt(1240));
  const price2 = new Price(token0, token2, JSBI.BigInt(10000000), JSBI.BigInt(1240));

  it('testFormat', () => {
    expect(price1.toPrecision(6)).toEqual('1.24');
    expect(price2.toPrecision(6)).toEqual('0.000124');
  });
});
