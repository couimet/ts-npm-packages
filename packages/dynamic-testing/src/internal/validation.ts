export const isPositiveInteger = (value: number): boolean => Number.isInteger(value) && value > 0;

export const isNonNegativeInteger = (value: number): boolean => Number.isInteger(value) && value >= 0;
