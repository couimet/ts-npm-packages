import { getEnumValues, getRandomBoolean, getRandomEnumValue, getRandomInt } from '../index';

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
    expect(() => getRandomEnumValue(StringEnum, StringEnum.Alpha, StringEnum.Beta, StringEnum.Gamma, StringEnum.Delta)).toThrowDetailedError(
      'NO_ENUM_VALUES_AVAILABLE',
      {
        message: 'No enum values available after exclusion',
        functionName: 'getRandomEnumValue',
      },
    );
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

  it('throws when trueProbability is less than 0', () => {
    expect(() => getRandomBoolean(-0.1)).toThrowDetailedError('TRUE_PROBABILITY_OUT_OF_RANGE', {
      message: 'trueProbability must be a finite number between 0 and 1',
      functionName: 'getRandomBoolean',
      details: { received: -0.1 },
    });
  });

  it('throws when trueProbability is greater than 1', () => {
    expect(() => getRandomBoolean(1.1)).toThrowDetailedError('TRUE_PROBABILITY_OUT_OF_RANGE', {
      message: 'trueProbability must be a finite number between 0 and 1',
      functionName: 'getRandomBoolean',
      details: { received: 1.1 },
    });
  });

  it('throws when trueProbability is NaN', () => {
    expect(() => getRandomBoolean(NaN)).toThrowDetailedError('TRUE_PROBABILITY_OUT_OF_RANGE', {
      message: 'trueProbability must be a finite number between 0 and 1',
      functionName: 'getRandomBoolean',
      details: { received: NaN },
    });
  });

  it('throws when trueProbability is Infinity', () => {
    expect(() => getRandomBoolean(Infinity)).toThrowDetailedError('TRUE_PROBABILITY_OUT_OF_RANGE', {
      message: 'trueProbability must be a finite number between 0 and 1',
      functionName: 'getRandomBoolean',
      details: { received: Infinity },
    });
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

  it('throws when min is greater than max', () => {
    expect(() => getRandomInt(10, 5)).toThrowDetailedError('MIN_EXCEEDS_MAX', {
      message: 'min must not be greater than max',
      functionName: 'getRandomInt',
      details: { min: 10, max: 5 },
    });
  });

  it('throws when min is not an integer', () => {
    expect(() => getRandomInt(1.5, 10)).toThrowDetailedError('MIN_NOT_FINITE_INTEGER', {
      message: 'min must be a finite integer',
      functionName: 'getRandomInt',
      details: { received: 1.5 },
    });
  });

  it('throws when max is not an integer', () => {
    expect(() => getRandomInt(1, 3.5)).toThrowDetailedError('MAX_NOT_FINITE_INTEGER', {
      message: 'max must be a finite integer',
      functionName: 'getRandomInt',
      details: { received: 3.5 },
    });
  });

  it('throws when min is NaN', () => {
    expect(() => getRandomInt(NaN, 10)).toThrowDetailedError('MIN_NOT_FINITE_INTEGER', {
      message: 'min must be a finite integer',
      functionName: 'getRandomInt',
      details: { received: NaN },
    });
  });

  it('throws when max is Infinity', () => {
    expect(() => getRandomInt(1, Infinity)).toThrowDetailedError('MAX_NOT_FINITE_INTEGER', {
      message: 'max must be a finite integer',
      functionName: 'getRandomInt',
      details: { received: Infinity },
    });
  });

  it('throws when min is -Infinity', () => {
    expect(() => getRandomInt(-Infinity, 10)).toThrowDetailedError('MIN_NOT_FINITE_INTEGER', {
      message: 'min must be a finite integer',
      functionName: 'getRandomInt',
      details: { received: -Infinity },
    });
  });

  it('never returns a value ending in zero by default', () => {
    for (let i = 0; i < 5_000; i++) {
      const value = getRandomInt(1, 999);
      expect(value % 10).not.toBe(0);
    }
  });

  it('can return values ending in zero when allowTrailingZero is true', () => {
    const results = new Set(Array.from({ length: 500 }, () => getRandomInt(1, 50, { allowTrailingZero: true })));
    expect([...results].some((v) => v % 10 === 0)).toBe(true);
  });

  it('throws NO_VALID_VALUES_IN_RANGE when every value ends in zero', () => {
    expect(() => getRandomInt(10, 10)).toThrowDetailedError('NO_VALID_VALUES_IN_RANGE', {
      message: 'No valid values in range: every integer ends with zero',
      functionName: 'getRandomInt',
      details: { min: 10, max: 10 },
    });
  });

  it('throws SINGLE_VALID_VALUE when only one value does not end in zero', () => {
    expect(() => getRandomInt(10, 11)).toThrowDetailedError('SINGLE_VALID_VALUE', {
      message: 'Only one valid value in range: result would be deterministic',
      functionName: 'getRandomInt',
      details: { min: 10, max: 11, onlyValid: 11 },
    });
  });
});
