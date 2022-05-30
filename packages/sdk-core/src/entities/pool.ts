import JSBI from 'jsbi';
import invariant from 'tiny-invariant';
import { MINIMUM_LIQUIDITY, ONE, ZERO, _1000, _997 } from './constants';
import { InsufficientInputAmountError, InsufficientReservesError } from './errors';
import { MultiPath } from './multiRoute';
import { Price } from './price';
import { Token } from './token';
import { TokenAmount } from './tokenAmount';
import { sqrt } from './utils';
export class StandardPool {
  public readonly liquidityAmount: TokenAmount;

  private readonly tokenAmounts: [TokenAmount, TokenAmount]

  public constructor (
    liquidityAmount: TokenAmount,
    tokenAAmount: TokenAmount,
    tokenBAmount: TokenAmount
  ) {
    const tokenAmounts = tokenAAmount.token.sortsBefore(tokenBAmount.token)
      ? [tokenAAmount, tokenBAmount]
      : [tokenBAmount, tokenAAmount];

    this.liquidityAmount = liquidityAmount;
    this.tokenAmounts = tokenAmounts as [TokenAmount, TokenAmount];
  }

  public involvesToken (token: Token): boolean {
    return token.equals(this.token0) || token.equals(this.token1);
  }

  // the ratio of reserve1 to reserve0
  public get token0Price (): Price {
    return new Price(this.token0, this.token1, this.tokenAmounts[0].raw, this.tokenAmounts[1].raw);
  }

  // the ratio of reserve0 to reserve1
  public get token1Price (): Price {
    return new Price(this.token1, this.token0, this.tokenAmounts[1].raw, this.tokenAmounts[0].raw);
  }

  public priceOf (token: Token): Price {
    invariant(this.involvesToken(token), 'TOKEN');

    return token.equals(this.token0) ? this.token0Price : this.token1Price;
  }

  public get chainId (): number {
    return this.liquidityAmount.token.chainId;
  }

  public get liquidityToken (): Token {
    return this.liquidityAmount.token;
  }

  public get token0 (): Token {
    return this.tokenAmounts[0].token;
  }

  public get token1 (): Token {
    return this.tokenAmounts[1].token;
  }

  public get reserve0 (): TokenAmount {
    return this.tokenAmounts[0];
  }

  public get reserve1 (): TokenAmount {
    return this.tokenAmounts[1];
  }

  public pathOf (token: Token): MultiPath {
    invariant(this.involvesToken(token), 'TOKEN');

    return {
      stable: false,
      input: token,
      output: token.equals(this.token0) ? this.token1 : this.token0,
      pair: this
    };
  }

  public reserveOf (token: Token): TokenAmount {
    invariant(this.involvesToken(token), 'TOKEN');

    return token.equals(this.token0) ? this.reserve0 : this.reserve1;
  }

  public getOutputAmount (inputAmount: TokenAmount): [TokenAmount, StandardPool] {
    invariant(this.involvesToken(inputAmount.token), 'TOKEN');

    if (JSBI.equal(this.reserve0.raw, ZERO) || JSBI.equal(this.reserve1.raw, ZERO)) {
      throw new InsufficientReservesError();
    }

    const inputReserve = this.reserveOf(inputAmount.token);
    const outputReserve = this.reserveOf(inputAmount.token.equals(this.token0) ? this.token1 : this.token0);
    const inputAmountWithFee = JSBI.multiply(inputAmount.raw, _997);
    const numerator = JSBI.multiply(inputAmountWithFee, outputReserve.raw);
    const denominator = JSBI.add(JSBI.multiply(inputReserve.raw, _1000), inputAmountWithFee);
    const outputAmount = new TokenAmount(
      inputAmount.token.equals(this.token0) ? this.token1 : this.token0,
      JSBI.divide(numerator, denominator)
    );

    if (JSBI.equal(outputAmount.raw, ZERO)) {
      throw new InsufficientInputAmountError();
    }

    return [
      outputAmount,
      new StandardPool(this.liquidityAmount, inputReserve.add(inputAmount), outputReserve.subtract(outputAmount))
    ];
  }

  public getInputAmount (outputAmount: TokenAmount): [TokenAmount, StandardPool] {
    invariant(this.involvesToken(outputAmount.token), 'TOKEN');

    if (
      JSBI.equal(this.reserve0.raw, ZERO) ||
      JSBI.equal(this.reserve1.raw, ZERO) ||
      JSBI.greaterThanOrEqual(outputAmount.raw, this.reserveOf(outputAmount.token).raw)
    ) {
      throw new InsufficientReservesError();
    }

    const outputReserve = this.reserveOf(outputAmount.token);
    const inputReserve = this.reserveOf(outputAmount.token.equals(this.token0) ? this.token1 : this.token0);
    const numerator = JSBI.multiply(JSBI.multiply(inputReserve.raw, outputAmount.raw), _1000);
    const denominator = JSBI.multiply(JSBI.subtract(outputReserve.raw, outputAmount.raw), _997);
    const inputToken = outputAmount.token.equals(this.token0) ? this.token1 : this.token0;

    const inputAmount = JSBI.greaterThanOrEqual(outputAmount.raw, this.reserveOf(outputAmount.token).raw)
      ? new TokenAmount(inputToken, 0)
      : new TokenAmount(inputToken, JSBI.add(JSBI.divide(numerator, denominator), ONE));

    return [
      inputAmount,
      new StandardPool(this.liquidityAmount, inputReserve.add(inputAmount), outputReserve.subtract(outputAmount))
    ];
  }

  public getLiquidityMinted (
    totalSupply: TokenAmount,
    tokenAAmount: TokenAmount,
    tokenBAmount: TokenAmount
  ): TokenAmount {
    invariant(totalSupply.token.equals(this.liquidityToken), 'LIQUIDITY');
    const tokenAmounts = tokenAAmount.token.sortsBefore(tokenBAmount.token)
      ? [tokenAAmount, tokenBAmount]
      : [tokenBAmount, tokenAAmount];

    invariant(tokenAmounts[0].token.equals(this.token0) && tokenAmounts[1].token.equals(this.token1), 'TOKEN');

    let liquidity: JSBI;

    if (JSBI.equal(totalSupply.raw, ZERO)) {
      liquidity = JSBI.subtract(sqrt(JSBI.multiply(tokenAmounts[0].raw, tokenAmounts[1].raw)), MINIMUM_LIQUIDITY);
    } else {
      const amount0 = JSBI.divide(JSBI.multiply(tokenAmounts[0].raw, totalSupply.raw), this.reserve0.raw);
      const amount1 = JSBI.divide(JSBI.multiply(tokenAmounts[1].raw, totalSupply.raw), this.reserve1.raw);

      liquidity = JSBI.lessThanOrEqual(amount0, amount1) ? amount0 : amount1;
    }

    if (!JSBI.greaterThan(liquidity, ZERO)) {
      throw new InsufficientInputAmountError();
    }

    return new TokenAmount(this.liquidityToken, liquidity);
  }

  // get tokenDeposited
  public getLiquidityAmount (
    token: Token,
    totalSupply: TokenAmount,
    liquidity: TokenAmount
  ): TokenAmount {
    const totalSupplyAdjusted: TokenAmount = totalSupply;

    if (JSBI.equal(totalSupply.raw, ZERO)) return new TokenAmount(token, ZERO);

    return new TokenAmount(
      token,
      JSBI.divide(JSBI.multiply(liquidity.raw, this.reserveOf(token).raw), totalSupplyAdjusted.raw)
    );
  }
}

export type AbstractPool = Pick<StandardPool, 'token0' | 'token1' | 'reserve0' | 'reserve1' | 'getOutputAmount' | 'pathOf'>
export { AbstractPool as AbstractPair };
