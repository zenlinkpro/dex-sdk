import { BigintIsh, MaxUint256, Rounding, TEN } from '../constants';
import { Currency } from './currency';
import { Fraction } from './fraction';
import { currencyEquals } from '../utils';
import invariant from 'tiny-invariant';
import _Big from 'big.js';
import toFormat from 'toformat';
import JSBI from 'jsbi';

const Big = toFormat(_Big);

export class CurrencyAmount extends Fraction {
  public readonly currency: Currency
  public readonly decimalScale: JSBI

  /**
   * Construct a currency amount with a denominator that is not equal to 1
   * @param currency the currency
   * @param numerator the numerator of the fractional token amount
   * @param denominator the denominator of the fractional token amount
   */
  public static fromFractionalAmount (
    currency: Currency,
    numerator: BigintIsh,
    denominator: BigintIsh
  ): CurrencyAmount {
    return new CurrencyAmount(currency, numerator, denominator);
  }

  protected constructor (currency: Currency, numerator: BigintIsh, denominator?: BigintIsh) {
    super(numerator, denominator);
    invariant(JSBI.lessThanOrEqual(this.quotient, MaxUint256), 'AMOUNT');
    this.currency = currency;
    this.decimalScale = JSBI.exponentiate(TEN, JSBI.BigInt(currency.decimals));
  }

  public get raw (): JSBI {
    return this.numerator;
  }

  public override add (other: CurrencyAmount): CurrencyAmount {
    invariant(currencyEquals(this.currency, other.currency), 'CURRENCY');

    const plused = super.add(other);

    return CurrencyAmount.fromFractionalAmount(this.currency, plused.numerator, plused.denominator);
  }

  public override subtract (other: CurrencyAmount): CurrencyAmount {
    invariant(currencyEquals(this.currency, other.currency), 'CURRENCY');

    const minused = super.subtract(other);

    return CurrencyAmount.fromFractionalAmount(this.currency, minused.numerator, minused.denominator);
  }

  public override multiply (other: Fraction | BigintIsh): CurrencyAmount {
    const multiplied = super.multiply(other);

    return CurrencyAmount.fromFractionalAmount(this.currency, multiplied.numerator, multiplied.denominator);
  }

  public override divide (other: Fraction | BigintIsh): CurrencyAmount {
    const divided = super.divide(other);

    return CurrencyAmount.fromFractionalAmount(this.currency, divided.numerator, divided.denominator);
  }

  public override toPrecision (significantDigits = 6, rounding: Rounding = Rounding.ROUND_DOWN): string {
    return super.divide(this.decimalScale).toPrecision(significantDigits, rounding);
  }

  public override toFixed (decimalPlaces: number = this.currency.decimals, rounding: Rounding = Rounding.ROUND_DOWN): string {
    invariant(decimalPlaces <= this.currency.decimals, 'DECIMALS');

    return super.divide(this.decimalScale).toFixed(decimalPlaces, rounding);
  }

  public toFormat (format = { decimalSeparator: '.', groupSeparator: '' }): string {
    Big.DP = this.currency.decimals;

    return new Big(this.quotient.toString()).div(this.decimalScale.toString()).toFormat(format);
  }
}
