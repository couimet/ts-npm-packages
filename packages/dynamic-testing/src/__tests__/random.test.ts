import { getEnumValues, getRandomBoolean, getRandomEnumValue, getRandomInt } from '../random';

enum StringEnum {
  Alpha = 'A',
  Beta = 'B',
  Gamma = 'C',
  Delta = 'D',
}

enum NumericEnum {
  Zero,
  One,
  Two,
  Three,
  Four,
}

describe('getEnumValues', () => {
  it('returns all values from a string enum', () => {
    const values = getEnumValues(StringEnum);
    expect(values.sort()).toEqual(['A', 'B', 'C', 'D']);
  });

  it('returns all values from a numeric enum', () => {
    const values = getEnumValues(NumericEnum);
    expect(values.sort()).toEqual([0, 1, 2, 3, 4]);
  });

  it('excludes specified values via varargs', () => {
    const values = getEnumValues(StringEnum, StringEnum.Beta, StringEnum.Delta);
    expect(values.sort()).toEqual(['A', 'C']);
  });

  it('excludes numeric enum values', () => {
    const values = getEnumValues(NumericEnum, 0, 4);
    expect(values.sort()).toEqual([1, 2, 3]);
  });

  it('returns empty array when all values excluded', () => {
    const values = getEnumValues(StringEnum, StringEnum.Alpha, StringEnum.Beta, StringEnum.Gamma, StringEnum.Delta);
    expect(values).toEqual([]);
  });
});

describe('getRandomEnumValue', () => {
  it('returns a value from the enum', () => {
    const value = getRandomEnumValue(StringEnum);
    expect(Object.values(StringEnum)).toContain(value);
  });

  it('never returns an excluded value', () => {
    for (let i = 0; i < 20; i++) {
      const value = getRandomEnumValue(StringEnum, StringEnum.Alpha, StringEnum.Beta, StringEnum.Delta);
      expect(value).toBe(StringEnum.Gamma);
    }
  });

  it('throws when exclusion leaves no values', () => {
    expect(() => getRandomEnumValue(StringEnum, StringEnum.Alpha, StringEnum.Beta, StringEnum.Gamma, StringEnum.Delta)).toThrow('No enum values available');
  });
});

describe('getRandomBoolean', () => {
  it('returns a boolean', () => {
    expect(typeof getRandomBoolean()).toBe('boolean');
  });

  it('always returns true when probability is 1', () => {
    for (let i = 0; i < 50; i++) {
      expect(getRandomBoolean(1)).toBe(true);
    }
  });

  it('always returns false when probability is 0', () => {
    for (let i = 0; i < 50; i++) {
      expect(getRandomBoolean(0)).toBe(false);
    }
  });
});

describe('getRandomInt', () => {
  it('returns a value within the inclusive range', () => {
    for (let i = 0; i < 100; i++) {
      const value = getRandomInt(1, 10);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(10);
    }
  });

  it('can return the min boundary', () => {
    const results = new Set(Array.from({ length: 200 }, () => getRandomInt(1, 3)));
    expect(results.has(1)).toBe(true);
  });

  it('can return the max boundary', () => {
    const results = new Set(Array.from({ length: 200 }, () => getRandomInt(1, 3)));
    expect(results.has(3)).toBe(true);
  });

  it('returns the same value when min equals max', () => {
    for (let i = 0; i < 10; i++) {
      expect(getRandomInt(5, 5)).toBe(5);
    }
  });
});
