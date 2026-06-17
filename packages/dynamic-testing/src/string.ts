import { getRandomInt } from './random';
import { getUniqueInt } from './unique';

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
  if (charset in CHARSETS) {
    return CHARSETS[charset as keyof typeof CHARSETS];
  }
  return charset;
};

const DEFAULTS = { length: 8, charset: 'alphanumeric' as const, prefix: '' };

/** Returns a random string built from the given options. */
export const getRandomString = (options: StringOptions = {}): string => {
  const { length = DEFAULTS.length, charset = DEFAULTS.charset, prefix = DEFAULTS.prefix } = options;
  const chars = resolveCharset(charset);
  let result = prefix;
  for (let i = 0; i < length; i++) {
    result += chars[getRandomInt(0, chars.length - 1)];
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
