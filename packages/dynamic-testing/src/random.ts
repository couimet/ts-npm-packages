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
    throw new Error('No enum values available after exclusion');
  }
  return values[getRandomInt(0, values.length - 1)]!;
};

/** Returns a random boolean. `trueProbability` defaults to 0.5. */
export const getRandomBoolean = (trueProbability = 0.5): boolean => Math.random() < trueProbability;

/** Returns a random integer in [min, max] (inclusive on both boundaries). */
export const getRandomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
