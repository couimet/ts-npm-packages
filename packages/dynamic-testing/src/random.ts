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
  return values[getRandomInt(0, values.length - 1)]!;
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

/** Returns a random integer in [min, max] (inclusive on both boundaries). Throws if either bound is not a finite integer, or if min > max. */
export const getRandomInt = (min: number, max: number): number => {
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
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
