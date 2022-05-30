/* eslint-disable sort-keys */
import JSBI from 'jsbi';

export type BigintIsh = JSBI | string | number

export enum Rounding {
  ROUND_DOWN,
  ROUND_HALF_UP,
  ROUND_UP
}

export enum TradeType {
  EXACT_INPUT = 'EXACT_INPUT',
  EXACT_OUTPUT = 'EXACT_OUTPUT'
}

export enum PlusMinusType {
  PLUS,
  MINUS
}

export const MINIMUM_LIQUIDITY = JSBI.BigInt(1000);

export const ZERO = JSBI.BigInt(0);
export const ONE = JSBI.BigInt(1);
export const TWO = JSBI.BigInt(2);
export const THREE = JSBI.BigInt(3);
export const FOUR = JSBI.BigInt(4);
export const FIVE = JSBI.BigInt(5);
export const EIGHT = JSBI.BigInt(8);
export const NINE = JSBI.BigInt(9);
export const TEN = JSBI.BigInt(10);
export const ONE_HUNDRED = JSBI.BigInt(100);
export const _997 = JSBI.BigInt(997);
export const _1000 = JSBI.BigInt(1000);
export const _10000 = JSBI.BigInt(10000);

export const MaxUint32 = JSBI.BigInt('0xffffffff');
export const MaxUint256 = JSBI.BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
