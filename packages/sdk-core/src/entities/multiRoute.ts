import invariant from 'tiny-invariant';
import { JSBI, ONE, Price, Token, TokenAmount } from '.';
import { AbstractPair } from './pool';

import { StableSwap } from './stableSwap';
import { getStableSwapOutputAmount } from '../utils';

export interface MultiPath {
  stable: boolean;
  input: Token;
  output: Token;
  pair?: AbstractPair;
  pool?: StableSwap;
  basePool?: StableSwap;
  fromBase?: boolean;
}

export class MultiRoute {
  public readonly chainId: number;
  public readonly input: Token;
  public readonly inputAmount: TokenAmount;
  public readonly output: Token;
  public readonly routePath: MultiPath[];
  public readonly tokenPath: Token[];

  public get midPrice (): Price {
    const prices: Price[] = [];
    let currentAmount = this.inputAmount;

    for (const [i, path] of this.routePath.entries()) {
      let price: Price;

      if (path.stable) {
        const outputAmount = getStableSwapOutputAmount(path, currentAmount);

        price = new Price(
          path.input,
          path.output,
          JSBI.multiply(ONE, currentAmount.decimalScale),
          JSBI.multiply(ONE, outputAmount.decimalScale)
        );
        currentAmount = outputAmount;
      } else {
        invariant(typeof path.pair !== 'undefined', 'PAIR');
        const pair = path.pair;

        price = this.tokenPath[i].equals(pair.token0)
          ? new Price(pair.reserve0.token, pair.reserve1.token, pair.reserve0.raw, pair.reserve1.raw)
          : new Price(pair.reserve1.token, pair.reserve0.token, pair.reserve1.raw, pair.reserve0.raw);
        currentAmount = this.tokenPath[i].equals(pair.token0)
          ? new TokenAmount(pair.token1, currentAmount.multiply(price).raw)
          : new TokenAmount(pair.token0, currentAmount.multiply(price).raw);
      }

      prices.push(price);
    }

    return prices.slice(1).reduce((accumulator, currentValue) => accumulator.multiply(currentValue), prices[0]);
  }

  public constructor (chainId: number, paths: MultiPath[], inputAmount: TokenAmount, output?: Token) {
    invariant(paths.length > 0, 'POOLS');
    invariant(paths[0].input.equals(inputAmount.token), 'INPUT');
    invariant(typeof output === 'undefined' || paths[paths.length - 1].output.equals(output), 'OUTPUT');

    const tokenPath: Token[] = [inputAmount.token];

    for (const [i, path] of paths.entries()) {
      const currentInput = tokenPath[i];

      invariant(path.input.equals(currentInput), 'TOKENPATH');
      tokenPath.push(path.output);
    }

    this.chainId = chainId;
    this.routePath = paths;
    this.tokenPath = tokenPath;
    this.input = inputAmount.token;
    this.inputAmount = inputAmount;
    this.output = output ?? paths[paths.length - 1].output;
  }
}
