/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable sort-keys */

import BigNumber from 'bignumber.js';
import JSBI from 'jsbi';
import invariant from 'tiny-invariant';
import { ZERO, TWO, ONE } from './constants';
import { Currency } from './fractions/currency';
import { Token } from './token';

export const MAX_SAFE_INTEGER = JSBI.BigInt(Number.MAX_SAFE_INTEGER);

export function currencyEquals (currencyA: Currency | Token, currnecyB: Currency | Token): boolean {
  if (!currencyA || !currnecyB) return false;
  if (currencyA === currnecyB) return true;

  currencyA as Token; currnecyB as Token;

  if ((currencyA as Token).equals && (currnecyB as Token).equals) {
    return (currencyA as Token).equals(currnecyB as Token);
  }
  return false;
}

export function sqrt (value: JSBI): JSBI {
  invariant(JSBI.greaterThanOrEqual(value, ZERO), 'NEGATIVE');

  if (JSBI.lessThan(value, MAX_SAFE_INTEGER)) {
    return JSBI.BigInt(Math.floor(Math.sqrt(JSBI.toNumber(value))));
  }

  let z: JSBI;
  let x: JSBI;

  z = value;
  x = JSBI.add(JSBI.divide(value, TWO), ONE);

  while (JSBI.lessThan(x, z)) {
    z = x;
    x = JSBI.divide(JSBI.add(JSBI.divide(value, x), x), TWO);
  }

  return z;
}

export function abs (value: JSBI): JSBI {
  if (JSBI.greaterThanOrEqual(value, ZERO)) {
    return value;
  }

  return JSBI.subtract(ZERO, value);
}

export function sortedInsert<T> (items: T[], add: T, maxSize: number, comparator: (a: T, b: T) => number): T | null {
  if (maxSize <= 0) throw new Error('MAX_SIZE_ZERO');
  if (items.length > maxSize) throw new Error('ITEMS_SIZE');

  if (items.length === 0) {
    items.push(add);

    return null;
  } else {
    const isFull = items.length === maxSize;

    if (isFull && comparator(items[items.length - 1], add) <= 0) {
      return add;
    }

    let lo = 0;
    let hi = items.length;

    while (lo < hi) {
      const mid = (lo + hi) >>> 1;

      if (comparator(items[mid], add) <= 0) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }

    items.splice(lo, 0, add);

    return isFull ? items.pop()! : null;
  }
}

export function calculateGasMargin (value: string): string {
  return new BigNumber(value).multipliedBy(1.2).toFixed(0, 1);
}
