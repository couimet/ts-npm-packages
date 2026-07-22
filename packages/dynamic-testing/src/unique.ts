import { DynamicTestingErrorCodes } from './internal/DynamicTestingErrorCodes';
import { incCounter, incTimestampOffset, MODULE_LOAD_TIME } from './internal/state';
import { isPositiveInteger } from './internal/validation';
import { getRandomInt } from './';

import { DetailedError } from '@couimet/detailed-error';

const MAX_PRECISION = 30;

/** Returns a unique integer from the counter. Each call increments the shared counter. */
export const getUniqueInt = (): number => incCounter();

const nextUniqueDecimal = (precision: number): { value: number; fixed: string } => {
  if (!isPositiveInteger(precision)) {
    throw new DetailedError({
      code: DynamicTestingErrorCodes.PRECISION_NOT_POSITIVE_INTEGER,
      message: 'Precision must be a positive integer',
      functionName: 'nextUniqueDecimal',
      details: { received: precision },
    });
  }
  if (precision > MAX_PRECISION) {
    throw new DetailedError({
      code: DynamicTestingErrorCodes.PRECISION_EXCEEDS_MAXIMUM,
      message: 'Precision must not exceed maximum',
      functionName: 'nextUniqueDecimal',
      details: { max: MAX_PRECISION, received: precision },
    });
  }

  const integer = getUniqueInt();

  // The decimal part is randomised in [0.1, 1.0) so the counter is the
  // dominant unique component but fractional digits are non-deterministic.
  // We re-roll when the formatted result ends with zero to avoid
  // parseFloat stripping meaningful precision digits.
  let value: number;
  let fixed: string;
  do {
    const decimal = Math.random() * 0.9 + 0.1;
    value = integer + decimal;
    fixed = value.toFixed(precision);
  } while (fixed.endsWith('0'));

  return { value, fixed };
};

/** Returns a unique float: counter integer + random decimal with no trailing zeros. `precision` (default 2) controls decimal places. */
export const getUniqueFloat = (precision = 2): number => parseFloat(nextUniqueDecimal(precision).fixed);

/** Returns a unique decimal string: counter integer + random decimal with no trailing zeros. `precision` (default 2) controls decimal places. */
export const getUniqueBigDecimal = (precision = 2): string => nextUniqueDecimal(precision).fixed;

/**
 * Returns a unique timestamp (epoch ms) anchored to test runtime.
 * Increments by 1 minute (60,000 ms) per call so human-readable diffs are obvious.
 */
// Strip MODULE_LOAD_TIME's own ms so the random component below is the sole source of millisecond digits.
export const getUniqueTimestamp = (): number => MODULE_LOAD_TIME - (MODULE_LOAD_TIME % 1000) + incTimestampOffset() * 60 * 1000 + getRandomInt(1, 999);

/** Convenience wrapping `getUniqueTimestamp()` via `new Date(timestamp)`. */
export const getUniqueDate = (): Date => new Date(getUniqueTimestamp());

/**
 * Returns an array of `count` unique integers. Each value is drawn from the
 * shared counter so integers increment by 1 within the batch.
 */
export const getUniqueInts = (count: number): number[] => {
  if (!isPositiveInteger(count)) {
    throw new DetailedError({
      code: DynamicTestingErrorCodes.COUNT_NOT_POSITIVE_INTEGER,
      message: 'count must be a positive integer',
      functionName: 'getUniqueInts',
      details: { received: count },
    });
  }
  return Array.from({ length: count }, () => getUniqueInt());
};

/** Returns an object mapping each key to a unique integer from the shared counter. */
export const getUniqueIntsNamed = <K extends string>(keys: readonly K[]): Record<K, number> => {
  if (keys.length === 0) {
    throw new DetailedError({
      code: DynamicTestingErrorCodes.KEYS_ARRAY_EMPTY,
      message: 'keys must not be empty',
      functionName: 'getUniqueIntsNamed',
    });
  }
  return Object.fromEntries(keys.map((k) => [k, getUniqueInt()])) as Record<K, number>;
};

/**
 * Returns an array of `count` unique Date objects. Each call to `getUniqueDate()`
 * advances the timestamp offset by 1 minute, so dates within the batch are 1 minute apart.
 */
export const getUniqueDates = (count: number): Date[] => {
  if (!isPositiveInteger(count)) {
    throw new DetailedError({
      code: DynamicTestingErrorCodes.COUNT_NOT_POSITIVE_INTEGER,
      message: 'count must be a positive integer',
      functionName: 'getUniqueDates',
      details: { received: count },
    });
  }
  return Array.from({ length: count }, () => getUniqueDate());
};

/** Returns an object mapping each key to a unique Date (1 minute apart per key). */
export const getUniqueDatesNamed = <K extends string>(keys: readonly K[]): Record<K, Date> => {
  if (keys.length === 0) {
    throw new DetailedError({
      code: DynamicTestingErrorCodes.KEYS_ARRAY_EMPTY,
      message: 'keys must not be empty',
      functionName: 'getUniqueDatesNamed',
    });
  }
  return Object.fromEntries(keys.map((k) => [k, getUniqueDate()])) as Record<K, Date>;
};
