import { isFiniteInteger, isNonNegativeInteger, isPositiveInteger } from '../internal/validation';

describe('isPositiveInteger', () => {
  it('returns true for positive integers', () => {
    expect(isPositiveInteger(1)).toBe(true);
    expect(isPositiveInteger(42)).toBe(true);
  });

  it('returns false for zero', () => {
    expect(isPositiveInteger(0)).toBe(false);
  });

  it('returns false for negative integers', () => {
    expect(isPositiveInteger(-1)).toBe(false);
    expect(isPositiveInteger(-100)).toBe(false);
  });

  it('returns false for non-integers', () => {
    expect(isPositiveInteger(1.5)).toBe(false);
    expect(isPositiveInteger(0.1)).toBe(false);
  });

  it('returns false for NaN and Infinity', () => {
    expect(isPositiveInteger(NaN)).toBe(false);
    expect(isPositiveInteger(Infinity)).toBe(false);
    expect(isPositiveInteger(-Infinity)).toBe(false);
  });
});

describe('isNonNegativeInteger', () => {
  it('returns true for zero', () => {
    expect(isNonNegativeInteger(0)).toBe(true);
  });

  it('returns true for positive integers', () => {
    expect(isNonNegativeInteger(1)).toBe(true);
    expect(isNonNegativeInteger(99)).toBe(true);
  });

  it('returns false for negative integers', () => {
    expect(isNonNegativeInteger(-1)).toBe(false);
  });

  it('returns false for non-integers', () => {
    expect(isNonNegativeInteger(1.5)).toBe(false);
  });

  it('returns false for NaN and Infinity', () => {
    expect(isNonNegativeInteger(NaN)).toBe(false);
    expect(isNonNegativeInteger(Infinity)).toBe(false);
  });
});

describe('isFiniteInteger', () => {
  it('returns true for finite integers', () => {
    expect(isFiniteInteger(0)).toBe(true);
    expect(isFiniteInteger(1)).toBe(true);
    expect(isFiniteInteger(-5)).toBe(true);
    expect(isFiniteInteger(100)).toBe(true);
  });

  it('returns false for non-integers', () => {
    expect(isFiniteInteger(1.5)).toBe(false);
    expect(isFiniteInteger(0.1)).toBe(false);
  });

  it('returns false for NaN and Infinity', () => {
    expect(isFiniteInteger(NaN)).toBe(false);
    expect(isFiniteInteger(Infinity)).toBe(false);
    expect(isFiniteInteger(-Infinity)).toBe(false);
  });
});
