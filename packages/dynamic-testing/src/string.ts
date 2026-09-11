import { DynamicTestingErrorCodes } from './internal/DynamicTestingErrorCodes';
import { isNonNegativeInteger, isPositiveInteger } from './internal/validation';
import { getRandomInt } from './random';
import { getUniqueInt } from './unique';

import { DetailedError } from '@couimet/detailed-error';

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = UPPER.toLowerCase();
const ALPHA = UPPER + LOWER;
const NUMERIC = '0123456789';

const CHARSETS = {
  alpha: ALPHA,
  numeric: NUMERIC,
  alphanumeric: ALPHA + NUMERIC,
  hex: `${NUMERIC}abcdef`,
} as const;

export type Charset = keyof typeof CHARSETS | (string & {});

interface StringOptionsBase {
  /** Character set to pick from (default 'alphanumeric'). */
  charset?: Charset;
  /** Prepended to the result without consuming length budget. */
  prefix?: string;
}

export interface StringOptions extends StringOptionsBase {
  /** Fixed length of the random portion (default 8). */
  length?: number;
}

export interface UniqueStringOptions extends StringOptionsBase {
  /** Maximum total length. When set too short to fit the counter, uniqueness is not guaranteed. */
  maxLength?: number;
}

/** Resolves a charset name to its character set, or returns the string as-is for custom charsets. */
const resolveCharset = (charset: Charset): string => {
  if (Object.hasOwn(CHARSETS, charset)) {
    return CHARSETS[charset as keyof typeof CHARSETS];
  }
  return charset;
};

const DEFAULTS = { length: 8, charset: 'alphanumeric' as const, prefix: '' };

/** Returns a random string built from the given options. */
export const getRandomString = (options: StringOptions = {}): string => {
  const { length = DEFAULTS.length, charset = DEFAULTS.charset, prefix = DEFAULTS.prefix } = options;
  if (!isNonNegativeInteger(length)) {
    throw new DetailedError({
      code: DynamicTestingErrorCodes.LENGTH_NOT_NON_NEGATIVE_INTEGER,
      message: 'length must be a non-negative integer',
      functionName: 'getRandomString',
      details: { received: length },
    });
  }
  const chars = resolveCharset(charset);
  let result = prefix;
  for (let i = 0; i < length; i++) {
    result += chars[getRandomInt(0, chars.length - 1, { allowTrailingZero: true })];
  }
  return result;
};

export const getRandomAlphaString = (length?: number): string => getRandomString({ length, charset: 'alpha' });

export const getRandomNumericString = (length?: number): string => getRandomString({ length, charset: 'numeric' });

export const getRandomHexString = (length?: number): string => getRandomString({ length, charset: 'hex' });

/**
 * Returns a string guaranteed to be unique by appending the counter.
 *
 * Default behaviour (no `maxLength`): `randomPrefix-42` — always unique. The counter
 * suffix (`-` + digits) is appended regardless of the requested charset: with
 * `charset: 'alpha'` the result is `aBcDeF-42`, not purely alphabetic. When
 * `maxLength` is set the random prefix is truncated to make room for the counter.
 * If `maxLength` is too short even for the counter alone, the result is purely random
 * and uniqueness is **not** guaranteed.
 */
export const getUniqueString = (options: UniqueStringOptions = {}): string => {
  const { maxLength, charset = 'alphanumeric', prefix = '' } = options;
  if (maxLength !== undefined && !isNonNegativeInteger(maxLength)) {
    throw new DetailedError({
      code: DynamicTestingErrorCodes.MAX_LENGTH_NOT_NON_NEGATIVE_INTEGER,
      message: 'maxLength must be a non-negative integer',
      functionName: 'getUniqueString',
      details: { received: maxLength },
    });
  }
  const counter = getUniqueInt();
  const suffix = `-${counter}`;

  if (maxLength === undefined) {
    const randomPart = getRandomString({ charset, prefix });
    return `${randomPart}${suffix}`;
  }

  const budget = maxLength - prefix.length;

  if (budget <= 0) {
    return prefix.slice(0, maxLength);
  }
  if (budget < suffix.length) {
    return `${prefix}${getRandomString({ length: budget, charset })}`;
  }

  const prefixLen = budget - suffix.length;
  return `${prefix}${getRandomString({ length: prefixLen, charset })}${suffix}`;
};

/**
 * Returns an array of `count` unique strings. Each value comes from a separate
 * call to `getUniqueString()`, so the shared counter keeps them distinct.
 */
export const getUniqueStrings = (count: number): string[] => {
  if (!isPositiveInteger(count)) {
    throw new DetailedError({
      code: DynamicTestingErrorCodes.COUNT_NOT_POSITIVE_INTEGER,
      message: 'count must be a positive integer',
      functionName: 'getUniqueStrings',
      details: { received: count },
    });
  }
  return Array.from({ length: count }, () => getUniqueString());
};

/** Returns an object mapping each key to a unique string from the shared counter. */
export const getUniqueStringsNamed = <K extends string>(keys: readonly K[]): Record<K, string> => {
  if (keys.length === 0) {
    throw new DetailedError({
      code: DynamicTestingErrorCodes.KEYS_ARRAY_EMPTY,
      message: 'keys must not be empty',
      functionName: 'getUniqueStringsNamed',
    });
  }
  return Object.fromEntries(keys.map((k) => [k, getUniqueString()])) as Record<K, string>;
};
