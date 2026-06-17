import { pkgError } from './internal/errors';
import { incCounter, incTimestampOffset, MODULE_LOAD_TIME } from './internal/state';
import { isPositiveInteger } from './internal/validation';

const MAX_PRECISION = 30;

/** Returns a unique integer from the counter. Each call increments the shared counter. */
export const getUniqueInt = (): number => incCounter();

const nextUniqueDecimal = (precision: number): { value: number; fixed: string } => {
  if (!isPositiveInteger(precision)) {
    throw pkgError('Precision must be a positive integer');
  }
  if (precision > MAX_PRECISION) {
    throw pkgError(`Precision must not exceed ${MAX_PRECISION}`);
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
export const getUniqueTimestamp = (): number => MODULE_LOAD_TIME + incTimestampOffset() * 60 * 1000;

/** Convenience wrapping `getUniqueTimestamp()` via `new Date(timestamp)`. */
export const getUniqueDate = (): Date => new Date(getUniqueTimestamp());
