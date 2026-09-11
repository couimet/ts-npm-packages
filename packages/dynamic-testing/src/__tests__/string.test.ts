import {
  getRandomAlphaString,
  getRandomHexString,
  getRandomNumericString,
  getRandomString,
  getUniqueString,
  getUniqueStrings,
  getUniqueStringsNamed,
} from '../index';
import { _reset } from '../internal/uniqueTestUtils';

describe('getRandomString', () => {
  it('returns a string of the default length', () => {
    expect(getRandomString()).toHaveLength(8);
  });

  it('returns a string of the specified length', () => {
    expect(getRandomString({ length: 12 })).toHaveLength(12);
  });

  it('prepends the prefix without consuming length', () => {
    const result = getRandomString({ length: 5, prefix: 'user-' });
    expect(result).toMatch(/^user-.{5}$/);
  });

  it('uses only alphanumeric characters by default', () => {
    const result = getRandomString({ length: 200 });
    expect(result).toMatch(/^[A-Za-z0-9]+$/);
  });

  it('respects charset: alpha', () => {
    const result = getRandomString({ length: 200, charset: 'alpha' });
    expect(result).toMatch(/^[A-Za-z]+$/);
  });

  it('respects charset: numeric', () => {
    const result = getRandomString({ length: 200, charset: 'numeric' });
    expect(result).toMatch(/^[0-9]+$/);
  });

  it('respects charset: hex', () => {
    const result = getRandomString({ length: 200, charset: 'hex' });
    expect(result).toMatch(/^[0-9a-f]+$/);
  });

  it('respects a custom charset string', () => {
    const result = getRandomString({ length: 50, charset: 'XY' });
    expect(result).toMatch(/^[XY]+$/);
  });

  it('throws when length is negative', () => {
    expect(() => getRandomString({ length: -1 })).toThrowDetailedError('LENGTH_NOT_NON_NEGATIVE_INTEGER', {
      message: 'length must be a non-negative integer',
      functionName: 'getRandomString',
      details: { received: -1 },
    });
  });

  it('throws when length is NaN', () => {
    expect(() => getRandomString({ length: NaN })).toThrowDetailedError('LENGTH_NOT_NON_NEGATIVE_INTEGER', {
      message: 'length must be a non-negative integer',
      functionName: 'getRandomString',
      details: { received: NaN },
    });
  });

  it('throws when length is a non-integer', () => {
    expect(() => getRandomString({ length: 1.5 })).toThrowDetailedError('LENGTH_NOT_NON_NEGATIVE_INTEGER', {
      message: 'length must be a non-negative integer',
      functionName: 'getRandomString',
      details: { received: 1.5 },
    });
  });

  it('throws when length is Infinity', () => {
    expect(() => getRandomString({ length: Infinity })).toThrowDetailedError('LENGTH_NOT_NON_NEGATIVE_INTEGER', {
      message: 'length must be a non-negative integer',
      functionName: 'getRandomString',
      details: { received: Infinity },
    });
  });
});

describe('convenience wrappers', () => {
  it('getRandomAlphaString returns only alpha characters', () => {
    const result = getRandomAlphaString(100);
    expect(result).toMatch(/^[A-Za-z]+$/);
  });

  it('getRandomNumericString returns only numeric characters', () => {
    const result = getRandomNumericString(100);
    expect(result).toMatch(/^[0-9]+$/);
  });

  it('getRandomHexString returns only hex characters', () => {
    const result = getRandomHexString(100);
    expect(result).toMatch(/^[0-9a-f]+$/);
  });

  it('wrappers use default length 8', () => {
    expect(getRandomAlphaString()).toHaveLength(8);
    expect(getRandomNumericString()).toHaveLength(8);
    expect(getRandomHexString()).toHaveLength(8);
  });
});

describe('getUniqueString', () => {
  beforeEach(() => _reset(1));

  it('returns a string ending with the counter', () => {
    const result = getUniqueString();
    expect(result).toMatch(/-1$/);
  });

  it('returns unique values on subsequent calls', () => {
    _reset(100);
    const a = getUniqueString();
    const b = getUniqueString();
    expect(a).not.toBe(b);
    expect(a).toMatch(/-100$/);
    expect(b).toMatch(/-101$/);
  });

  it('respects the prefix option', () => {
    const result = getUniqueString({ prefix: 'user-' });
    expect(result).toMatch(/^user-.+-1$/);
  });

  it('truncates the random part to respect maxLength', () => {
    const result = getUniqueString({ maxLength: 10 });
    expect(result.length).toBeLessThanOrEqual(10);
    expect(result).toMatch(/-1$/);
  });

  it('falls back to non-unique when maxLength is too short for the counter', () => {
    const result = getUniqueString({ maxLength: 2, prefix: 'x' });
    expect(result.length).toBeLessThanOrEqual(2);
    expect(result).toMatch(/^x/);
    // Counter can't fit into 1 char (2 minus 'x') so uniqueness not guaranteed
    expect(result).not.toMatch(/-1$/);
  });

  it('respects charset option for the random prefix', () => {
    const result = getUniqueString({ charset: 'alpha' });
    const randomPart = result.replace(/-1$/, '');
    expect(randomPart).toMatch(/^[A-Za-z]+$/);
  });

  it('truncates prefix when it exceeds maxLength', () => {
    const result = getUniqueString({ maxLength: 4, prefix: 'toolong' });
    expect(result.length).toBeLessThanOrEqual(4);
    expect(result).toBe('tool');
  });

  it('counter suffix is appended outside the requested charset', () => {
    _reset(1);
    const result = getUniqueString({ charset: 'alpha' });
    // The random prefix respects 'alpha', but the delimiter and counter do not
    expect(result).toMatch(/^[A-Za-z]+-1$/);
  });

  it('throws when maxLength is negative', () => {
    expect(() => getUniqueString({ maxLength: -1 })).toThrowDetailedError('MAX_LENGTH_NOT_NON_NEGATIVE_INTEGER', {
      message: 'maxLength must be a non-negative integer',
      functionName: 'getUniqueString',
      details: { received: -1 },
    });
  });

  it('throws when maxLength is a non-integer', () => {
    expect(() => getUniqueString({ maxLength: 1.5 })).toThrowDetailedError('MAX_LENGTH_NOT_NON_NEGATIVE_INTEGER', {
      message: 'maxLength must be a non-negative integer',
      functionName: 'getUniqueString',
      details: { received: 1.5 },
    });
  });

  it('throws when maxLength is NaN', () => {
    expect(() => getUniqueString({ maxLength: NaN })).toThrowDetailedError('MAX_LENGTH_NOT_NON_NEGATIVE_INTEGER', {
      message: 'maxLength must be a non-negative integer',
      functionName: 'getUniqueString',
      details: { received: NaN },
    });
  });
});

describe('getUniqueStrings', () => {
  beforeEach(() => _reset(1));

  it('returns an array of the requested length', () => {
    const count = 3;
    expect(getUniqueStrings(count)).toHaveLength(count);
  });

  it('returns values carrying sequential counter suffixes from the reset value', () => {
    const result = getUniqueStrings(3);
    expect(result[0]).toMatch(/-1$/);
    expect(result[1]).toMatch(/-2$/);
    expect(result[2]).toMatch(/-3$/);
  });

  it('returns unique values', () => {
    const count = 10;
    const result = getUniqueStrings(count);
    expect(new Set(result).size).toBe(count);
  });

  it('throws on non-positive-integer count', () => {
    expect(() => getUniqueStrings(0)).toThrowDetailedError('COUNT_NOT_POSITIVE_INTEGER', {
      message: 'count must be a positive integer',
      functionName: 'getUniqueStrings',
      details: { received: 0 },
    });
    expect(() => getUniqueStrings(-2)).toThrowDetailedError('COUNT_NOT_POSITIVE_INTEGER', {
      message: 'count must be a positive integer',
      functionName: 'getUniqueStrings',
      details: { received: -2 },
    });
    expect(() => getUniqueStrings(1.5)).toThrowDetailedError('COUNT_NOT_POSITIVE_INTEGER', {
      message: 'count must be a positive integer',
      functionName: 'getUniqueStrings',
      details: { received: 1.5 },
    });
  });
});

describe('getUniqueStringsNamed', () => {
  beforeEach(() => _reset(1));

  it('returns an object with the given keys mapped to strings', () => {
    const keys = ['alpha', 'beta', 'gamma'] as const;
    const result = getUniqueStringsNamed(keys);
    expect(Object.keys(result)).toStrictEqual(keys);
    for (const key of keys) {
      expect(typeof result[key]).toBe('string');
    }
  });

  it('maps each key to a unique string', () => {
    const keys = ['alpha', 'beta', 'gamma'] as const;
    const result = getUniqueStringsNamed(keys);
    const values = Object.values(result);
    expect(new Set(values).size).toBe(keys.length);
  });

  it('throws on an empty keys array', () => {
    expect(() => getUniqueStringsNamed([])).toThrowDetailedError('KEYS_ARRAY_EMPTY', {
      message: 'keys must not be empty',
      functionName: 'getUniqueStringsNamed',
    });
  });
});
