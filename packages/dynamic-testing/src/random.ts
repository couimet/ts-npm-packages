import { DynamicTestingErrorCodes } from './internal/DynamicTestingErrorCodes';
import { isFiniteInteger } from './internal/validation';

import { DetailedError } from '@couimet/detailed-error';

/**
 * Returns every value from a TypeScript enum, excluding any values passed as varargs.
 * Handles both numeric and string enums correctly.
 */
export const getEnumValues = <T extends Record<string | number, string | number>>(enumClass: T, ...excluded: T[keyof T][]): T[keyof T][] => {
  const values = Object.keys(enumClass)
    .filter((key) => isNaN(Number(key)))
    .map((key) => enumClass[key as keyof T] as T[keyof T]);
  return values.filter((v) => !excluded.includes(v));
};

/** Returns a random value from a TypeScript enum, with optional exclusions via varargs. */
export const getRandomEnumValue = <T extends Record<string | number, string | number>>(enumClass: T, ...excluded: T[keyof T][]): T[keyof T] => {
  const values = getEnumValues(enumClass, ...excluded);
  if (values.length === 0) {
    throw new DetailedError({
      code: DynamicTestingErrorCodes.NO_ENUM_VALUES_AVAILABLE,
      message: 'No enum values available after exclusion',
      functionName: 'getRandomEnumValue',
    });
  }
  return values[getRandomInt(0, values.length - 1, { allowTrailingZero: true })]!;
};

/** Returns a random boolean. `trueProbability` defaults to 0.5. Throws if not a finite number in [0, 1]. */
export const getRandomBoolean = (trueProbability = 0.5): boolean => {
  if (!Number.isFinite(trueProbability) || trueProbability < 0 || trueProbability > 1) {
    throw new DetailedError({
      code: DynamicTestingErrorCodes.TRUE_PROBABILITY_OUT_OF_RANGE,
      message: 'trueProbability must be a finite number between 0 and 1',
      functionName: 'getRandomBoolean',
      details: { received: trueProbability },
    });
  }
  return Math.random() < trueProbability;
};

/**
 * Returns a random integer in [min, max] (inclusive on both boundaries).
 *
 * By default, the result never ends with a trailing zero (`allowTrailingZero`
 * defaults to `false`).  Pass `{ allowTrailingZero: true }` to lift the
 * restriction.  When the trailing-zero exclusion leaves zero or exactly one
 * valid value in the range the function throws rather than looping forever or
 * returning a deterministic result.
 *
 * Throws if either bound is not a finite integer, or if min > max.
 */
export const getRandomInt = (min: number, max: number, opts?: { allowTrailingZero?: boolean }): number => {
  if (!isFiniteInteger(min)) {
    throw new DetailedError({
      code: DynamicTestingErrorCodes.MIN_NOT_FINITE_INTEGER,
      message: 'min must be a finite integer',
      functionName: 'getRandomInt',
      details: { received: min },
    });
  }
  if (!isFiniteInteger(max)) {
    throw new DetailedError({
      code: DynamicTestingErrorCodes.MAX_NOT_FINITE_INTEGER,
      message: 'max must be a finite integer',
      functionName: 'getRandomInt',
      details: { received: max },
    });
  }
  if (min > max) {
    throw new DetailedError({
      code: DynamicTestingErrorCodes.MIN_EXCEEDS_MAX,
      message: 'min must not be greater than max',
      functionName: 'getRandomInt',
      details: { min, max },
    });
  }

  const allowTrailingZero = opts?.allowTrailingZero ?? false;

  if (!allowTrailingZero) {
    const totalCount = max - min + 1;
    const zeroEndingCount = Math.floor(max / 10) - Math.floor((min - 1) / 10);
    const validCount = totalCount - zeroEndingCount;

    if (validCount === 0) {
      throw new DetailedError({
        code: DynamicTestingErrorCodes.NO_VALID_VALUES_IN_RANGE,
        message: 'No valid values in range: every integer ends with zero',
        functionName: 'getRandomInt',
        details: { min, max },
      });
    }

    if (validCount === 1 && totalCount > 1) {
      // The range is tiny — find the single non-zero-ending value to include in the error.
      let onlyValid = 0;
      for (let i = min; i <= max; i++) {
        if (i % 10 !== 0) {
          onlyValid = i;
          break;
        }
      }
      throw new DetailedError({
        code: DynamicTestingErrorCodes.SINGLE_VALID_VALUE,
        message: 'Only one valid value in range: result would be deterministic',
        functionName: 'getRandomInt',
        details: { min, max, onlyValid },
      });
    }

    let result: number;
    do {
      result = Math.floor(Math.random() * (max - min + 1)) + min;
    } while (result % 10 === 0);
    return result;
  }

  return Math.floor(Math.random() * (max - min + 1)) + min;
};
