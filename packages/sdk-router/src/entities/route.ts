import invariant from 'tiny-invariant';
import { StandardPool, Price, Token } from '@zenlink-dex/sdk-core';

export class Route {
  public readonly chainId: number;
  public readonly pairs: StandardPool[];
  public readonly routePath: Token[];
  public readonly input: Token;
  public readonly output: Token;

  public get midPrice (): Price {
    const prices: Price[] = [];

    for (const [i, pair] of this.pairs.entries()) {
      prices.push(
        this.routePath[i].equals(pair.token0)
          ? new Price(pair.reserve0.token, pair.reserve1.token, pair.reserve0.raw, pair.reserve1.raw)
          : new Price(pair.reserve1.token, pair.reserve0.token, pair.reserve1.raw, pair.reserve0.raw)
      );
    }

    return prices.slice(1).reduce((accumulator, currentValue) => accumulator.multiply(currentValue), prices[0]);
  }

  public constructor (chainId: number, pairs: StandardPool[], input: Token, output?: Token) {
    invariant(pairs.length > 0, 'PAIRS');
    invariant(pairs[0].involvesToken(input), 'INPUT');
    invariant(typeof output === 'undefined' || pairs[pairs.length - 1].involvesToken(output), 'OUTPUT');

    const path: Token[] = [input];

    for (const [i, pair] of pairs.entries()) {
      const currentInput = path[i];

      invariant(currentInput.equals(pair.token0) || currentInput.equals(pair.token1), 'PATH');
      const output = currentInput.equals(pair.token0) ? pair.token1 : pair.token0;

      path.push(output);
    }

    this.chainId = chainId;
    this.pairs = pairs;
    this.routePath = path;
    this.input = input;
    this.output = output ?? path[path.length - 1];
  }
}
