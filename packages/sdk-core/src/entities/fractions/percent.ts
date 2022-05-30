/* eslint-disable @typescript-eslint/no-use-before-define */
import { BigintIsh, ONE_HUNDRED, Rounding } from '../constants';
import { Fraction } from './fraction';

const ONE_HUNDRED_PERCENT = new Fraction(ONE_HUNDRED);

/**
 * Converts a fraction to a percent
 * @param fraction the fraction to convert
 */
function toPercent (fraction: Fraction): Percent {
  return new Percent(fraction.numerator, fraction.denominator);
}

export class Percent extends Fraction {
  public readonly isPercent: true = true;

  override add (other: Fraction | BigintIsh): Percent {
    return toPercent(super.add(other));
  }

  override subtract (other: Fraction | BigintIsh): Percent {
    return toPercent(super.subtract(other));
  }

  override multiply (other: Fraction | BigintIsh): Percent {
    return toPercent(super.multiply(other));
  }

  override divide (other: Fraction | BigintIsh): Percent {
    return toPercent(super.divide(other));
  }

  public override toPrecision (significantDigits = 5, rounding?: Rounding): string {
    return super.multiply(ONE_HUNDRED_PERCENT).toPrecision(significantDigits, rounding);
  }

  public override toFixed (decimalPlaces = 2, rounding?: Rounding): string {
    return super.multiply(ONE_HUNDRED_PERCENT).toFixed(decimalPlaces, rounding);
  }
}
