export const isFiniteInteger = (value: number): boolean => Number.isInteger(value) && Number.isFinite(value);

export const isPositiveInteger = (value: number): boolean => isFiniteInteger(value) && value > 0;

export const isNonNegativeInteger = (value: number): boolean => isFiniteInteger(value) && value >= 0;
