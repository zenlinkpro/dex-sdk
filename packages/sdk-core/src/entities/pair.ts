
import { Token } from './token';
import { pack, keccak256 } from '@ethersproject/solidity';
import { getCreate2Address } from '@ethersproject/address';

export const computePairAddress = ({
  factoryAddress,
  initCodeHash,
  tokenA,
  tokenB
}: {
  factoryAddress: string;
  tokenA: Token;
  tokenB: Token;
  initCodeHash: string;
}): string => {
  const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA];

  return getCreate2Address(
    factoryAddress.toLowerCase(),
    keccak256(['bytes'], [pack(['address', 'address'], [token0.meta.address, token1.meta.address])]),
    initCodeHash
  ).toLowerCase();
};

export class StandardPair {
  public readonly lpToken: Token;
  public readonly token0: Token;
  public readonly token1: Token;
  public constructor (lpToken: Token, tokenA: Token, tokenB: Token) {
    const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA];

    this.lpToken = lpToken;
    this.token0 = token0;
    this.token1 = token1;
  }
}

export class StablePair {
  public readonly address: string;
  public readonly lpToken: Token;
  public readonly pooledTokens: Token[]
  public constructor (lpToken: Token, pooledTokens: Token[], address = '') {
    this.address = address;
    this.lpToken = lpToken;
    this.pooledTokens = pooledTokens;
  }
}
