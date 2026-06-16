import { COUNTER_START } from './counterStart';

let GLOBAL_COUNTER = COUNTER_START;
const MODULE_LOAD_TIME = Date.now();
/** Separates consecutive timestamps by 1 minute. Starts at 1 to avoid zero. */
let TIMESTAMP_COUNTER = 1;

/** Returns a unique integer from the counter. Each call increments the shared counter. */
export const getUniqueInt = (): number => GLOBAL_COUNTER++;

const MAX_PRECISION = 30;

const nextUniqueDecimal = (precision: number): { value: number; fixed: string } => {
  if (!Number.isInteger(precision) || precision <= 0) {
    throw new Error('Precision must be a positive integer');
  }
  if (precision > MAX_PRECISION) {
    throw new Error(`Precision must not exceed ${MAX_PRECISION}`);
  }

  const integer = GLOBAL_COUNTER++;

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
export const getUniqueTimestamp = (): number => MODULE_LOAD_TIME + TIMESTAMP_COUNTER++ * 60 * 1000;

/** Convenience wrapping `getUniqueTimestamp()` via `new Date(timestamp)`. */
export const getUniqueDate = (): Date => new Date(getUniqueTimestamp());

// ── Internal testing utilities ───────────────────────────────────────────────
// NOT part of the public API. Exported only for @couimet/dynamic-testing's own
// unit tests. Do NOT import these from consumer test suites — behaviour may
// change without notice.

/** @internal Reset the counter and timestamp offset. */
export const _reset = (value?: number): void => {
  const start = value ?? COUNTER_START;
  GLOBAL_COUNTER = start === 0 ? 1 : Math.min(start, 1_000_000);
  TIMESTAMP_COUNTER = 1;
};

/** @internal Snapshot the current counter value. */
export const _getCounter = (): number => GLOBAL_COUNTER;
