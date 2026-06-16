import { getUniqueBigDecimal } from './unique';

// Minimal interface covering the Decimal.js API surface consumers need.
// Avoids a hard compile-time dependency on decimal.js for consumers who don't use getUniqueDecimal().
interface DecimalInstance {
  plus(n: number | string | DecimalInstance): DecimalInstance;
  minus(n: number | string | DecimalInstance): DecimalInstance;
  times(n: number | string | DecimalInstance): DecimalInstance;
  dividedBy(n: number | string | DecimalInstance): DecimalInstance;
  equals(n: number | string | DecimalInstance): boolean;
  greaterThan(n: number | string | DecimalInstance): boolean;
  lessThan(n: number | string | DecimalInstance): boolean;
  greaterThanOrEqualTo(n: number | string | DecimalInstance): boolean;
  lessThanOrEqualTo(n: number | string | DecimalInstance): boolean;
  toFixed(dp?: number): string;
  toString(): string;
  toNumber(): number;
}

type DecimalConstructor = new (value: string | number) => DecimalInstance;

let _Decimal: DecimalConstructor | null = null;
let _loaded = false;

const getDecimalConstructor = (): DecimalConstructor => {
  if (!_loaded) {
    _loaded = true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      _Decimal = require('decimal.js');
    } catch {
      throw new Error('Install decimal.js to use getUniqueDecimal()');
    }
  }
  return _Decimal!;
};

/**
 * Returns a unique Decimal.js instance derived from the counter.
 * Requires `decimal.js` to be installed as an optional peer dependency.
 * Throws if `decimal.js` is missing.
 */
export const getUniqueDecimal = (scale = 2): DecimalInstance => {
  const Decimal = getDecimalConstructor();
  return new Decimal(getUniqueBigDecimal(scale));
};
