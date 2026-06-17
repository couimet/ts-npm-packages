import { pkgError } from './internal/errors';

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
    throw pkgError('No enum values available after exclusion');
  }
  return values[getRandomInt(0, values.length - 1)]!;
};

/** Returns a random boolean. `trueProbability` defaults to 0.5. Throws if not a finite number in [0, 1]. */
export const getRandomBoolean = (trueProbability = 0.5): boolean => {
  if (!Number.isFinite(trueProbability) || trueProbability < 0 || trueProbability > 1) {
    throw pkgError(`trueProbability must be a finite number between 0 and 1, got ${trueProbability}`);
  }
  return Math.random() < trueProbability;
};

/** Returns a random integer in [min, max] (inclusive on both boundaries). Throws if min > max. */
export const getRandomInt = (min: number, max: number): number => {
  if (min > max) {
    throw pkgError(`min (${min}) must not be greater than max (${max})`);
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
