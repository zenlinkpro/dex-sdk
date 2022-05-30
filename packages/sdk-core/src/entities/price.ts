import JSBI from 'jsbi';
import invariant from 'tiny-invariant';
import { BigintIsh, Rounding, TEN } from './constants';
import { Fraction } from './fractions/fraction';
import { Token } from './token';
import { TokenAmount } from './tokenAmount';
import { currencyEquals } from './utils';

export class Price extends Fraction {
  public readonly baseToken: Token
  public readonly quoteToken: Token
  public readonly scalar: Fraction

  public constructor (baseToken: Token, quoteToken: Token, denominator: BigintIsh, numerator: BigintIsh) {
    super(numerator, denominator);

    this.baseToken = baseToken;
    this.quoteToken = quoteToken;
    this.scalar = new Fraction(
      JSBI.exponentiate(TEN, JSBI.BigInt(baseToken.decimals)),
      JSBI.exponentiate(TEN, JSBI.BigInt(quoteToken.decimals))
    );
  }

  public get raw (): Fraction {
    return new Fraction(this.numerator, this.denominator);
  }

  public get adjusted (): Fraction {
    return super.multiply(this.scalar);
  }

  public override invert (): Price {
    return new Price(this.quoteToken, this.baseToken, this.numerator, this.denominator);
  }

  public override multiply (other: Price): Price {
    invariant(currencyEquals(this.quoteToken, other.baseToken), 'TOKEN');

    const fraction = super.multiply(other);

    return new Price(this.baseToken, other.quoteToken, fraction.denominator, fraction.numerator);
  }

  public quote (tokenAmount: TokenAmount): TokenAmount {
    invariant(currencyEquals(tokenAmount.token, this.baseToken), 'TOKEN');

    return new TokenAmount(this.quoteToken, super.multiply(tokenAmount).quotient);
  }

  public override toPrecision (significantDigits = 6, rounding?: Rounding): string {
    return this.adjusted.toPrecision(significantDigits, rounding);
  }

  public override toFixed (significantDigits = 4, rounding?: Rounding): string {
    return this.adjusted.toFixed(significantDigits, rounding);
  }
}
