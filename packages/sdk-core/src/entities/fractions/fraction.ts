/* eslint-disable sort-keys */
import { BigintIsh, ONE, Rounding, ZERO } from '../constants';
import _Decimal from 'decimal.js-light';
import toFormat from 'toformat';
import invariant from 'tiny-invariant';
import _Big from 'big.js';
import JSBI from 'jsbi';

const Decimal = toFormat(_Decimal);
const Big = toFormat(_Big);

const toPrecisionRounding = {
  [Rounding.ROUND_DOWN]: Decimal.ROUND_DOWN,
  [Rounding.ROUND_HALF_UP]: Decimal.ROUND_HALF_UP,
  [Rounding.ROUND_UP]: Decimal.ROUND_UP
};

const toFixedRounding = {
  [Rounding.ROUND_DOWN]: 0,
  [Rounding.ROUND_HALF_UP]: 1,
  [Rounding.ROUND_UP]: 3
};

export class Fraction {
  public readonly numerator: JSBI
  public readonly denominator: JSBI

  public constructor (numerator: BigintIsh, denominator: BigintIsh = ONE) {
    this.numerator = JSBI.BigInt(numerator);
    this.denominator = JSBI.BigInt(denominator);
  }

  private static tryParseFraction (fractionish: BigintIsh | Fraction): Fraction {
    if (
      fractionish instanceof JSBI ||
      typeof fractionish === 'number' ||
      typeof fractionish === 'string'
    ) return new Fraction(fractionish);

    if ('numerator' in fractionish && 'denominator' in fractionish) return fractionish;
    throw new Error('Could not parse fraction');
  }

  // performs floor division
  public get quotient (): JSBI {
    return JSBI.divide(this.numerator, this.denominator);
  }

  // remainder after floor division
  public get remainder (): Fraction {
    return new Fraction(JSBI.remainder(this.numerator, this.denominator), this.denominator);
  }

  public invert (): Fraction {
    return new Fraction(this.denominator, this.numerator);
  }

  public add (other: Fraction | BigintIsh): Fraction {
    const otherParsed = Fraction.tryParseFraction(other);

    if (JSBI.equal(this.denominator, otherParsed.denominator)) {
      return new Fraction(JSBI.add(this.numerator, otherParsed.numerator), this.denominator);
    }

    return new Fraction(
      JSBI.add(
        JSBI.multiply(this.numerator, otherParsed.denominator),
        JSBI.multiply(otherParsed.numerator, this.denominator)
      ),
      JSBI.multiply(this.denominator, otherParsed.denominator)
    );
  }

  public subtract (other: Fraction | BigintIsh): Fraction {
    const otherParsed = Fraction.tryParseFraction(other);

    if (JSBI.equal(this.denominator, otherParsed.denominator)) {
      return new Fraction(JSBI.subtract(this.numerator, otherParsed.numerator), this.denominator);
    }

    return new Fraction(
      JSBI.subtract(
        JSBI.multiply(this.numerator, otherParsed.denominator),
        JSBI.multiply(otherParsed.numerator, this.denominator)
      ),
      JSBI.multiply(this.denominator, otherParsed.denominator)
    );
  }

  public lessThan (other: Fraction | BigintIsh): boolean {
    const otherParsed = Fraction.tryParseFraction(other);

    return JSBI.lessThan(
      JSBI.multiply(this.numerator, otherParsed.denominator),
      JSBI.multiply(otherParsed.numerator, this.denominator)
    );
  }

  public equal (other: Fraction | BigintIsh): boolean {
    const otherParsed = Fraction.tryParseFraction(other);

    return JSBI.equal(
      JSBI.multiply(this.numerator, otherParsed.denominator),
      JSBI.multiply(otherParsed.numerator, this.denominator)
    );
  }

  public greaterThan (other: Fraction | BigintIsh): boolean {
    const otherParsed = Fraction.tryParseFraction(other);

    return JSBI.greaterThan(
      JSBI.multiply(this.numerator, otherParsed.denominator),
      JSBI.multiply(otherParsed.numerator, this.denominator)
    );
  }

  public multiply (other: Fraction | BigintIsh): Fraction {
    const otherParsed = Fraction.tryParseFraction(other);

    return new Fraction(
      JSBI.multiply(this.numerator, otherParsed.numerator),
      JSBI.multiply(this.denominator, otherParsed.denominator)
    );
  }

  public divide (other: Fraction | BigintIsh): Fraction {
    const otherParsed = Fraction.tryParseFraction(other);

    return new Fraction(
      JSBI.multiply(this.numerator, otherParsed.denominator),
      JSBI.multiply(this.denominator, otherParsed.numerator)
    );
  }

  public toPrecision (significantDigits: number, rounding: Rounding = Rounding.ROUND_HALF_UP): string {
    invariant(Number.isInteger(significantDigits), `${significantDigits} is not an integer.`);
    invariant(significantDigits > 0, `${significantDigits} is not positive.`);

    Decimal.set({ precision: significantDigits, rounding: toPrecisionRounding[rounding] });
    let quotient = new Decimal(this.numerator.toString())
      .div(this.denominator.toString());
    const integerLength = quotient.toFixed(0).toString().length;

    if (integerLength > significantDigits) {
      significantDigits = integerLength;
      Decimal.set({ precision: significantDigits, rounding: toPrecisionRounding[rounding] });
      quotient = new Decimal(this.numerator.toString())
        .div(this.denominator.toString());
    }

    return quotient.toSignificantDigits(significantDigits)
      .toFormat(quotient.decimalPlaces(), { groupSeparator: '' });
  }

  public toFixed (significantDigits: number, rounding: Rounding = Rounding.ROUND_HALF_UP): string {
    invariant(Number.isInteger(significantDigits), `${significantDigits} is not an integer.`);
    invariant(significantDigits >= 0, `${significantDigits} is not positive.`);

    Big.DP = significantDigits;
    Big.RM = toFixedRounding[rounding];

    if (JSBI.equal(this.denominator, ZERO)) return ZERO.toString();

    return new Big(this.numerator.toString())
      .div(this.denominator.toString())
      .toFormat(significantDigits, { groupSeparator: '' });
  }
}
