import { getUniqueBigDecimal, getUniqueDate, getUniqueFloat, getUniqueInt, getUniqueTimestamp } from '../index';
import { _getCounter } from '../internal/state';
import { _reset } from '../internal/uniqueTestUtils';

describe('getUniqueInt', () => {
  beforeEach(() => _reset(1));

  it('returns a positive value', () => {
    expect(getUniqueInt()).toBeGreaterThan(0);
  });

  it('increments on subsequent calls', () => {
    const a = getUniqueInt();
    const b = getUniqueInt();
    expect(b).toBeGreaterThan(a);
  });

  it('starts from the value set by _reset', () => {
    _reset(42);
    expect(getUniqueInt()).toBe(42);
    expect(getUniqueInt()).toBe(43);
  });
});

describe('getUniqueFloat', () => {
  beforeEach(() => _reset(1));

  it('returns a number with the integer part from the counter', () => {
    const a = getUniqueFloat();
    expect(Math.floor(a)).toBe(1);
    const b = getUniqueFloat();
    expect(Math.floor(b)).toBe(2);
  });

  it('uses the counter value set by _reset', () => {
    _reset(99);
    const value = getUniqueFloat();
    expect(Math.floor(value)).toBe(99);
  });

  it('returns different fractional parts for the same counter', () => {
    jest.spyOn(Math, 'random').mockReturnValueOnce(0.1).mockReturnValueOnce(0.9);
    _reset(1);
    const a = getUniqueFloat();
    _reset(1);
    const b = getUniqueFloat();
    // Same integer part (counter=1) but different decimal parts
    expect(Math.floor(a)).toBe(Math.floor(b));
    expect(a).not.toBe(b);
  });

  it('respects the precision parameter', () => {
    _reset(1);
    const value = getUniqueFloat(4);
    const decimals = value.toString().split('.')[1] ?? '';
    expect(decimals.length).toBeLessThanOrEqual(4);
  });

  it('throws on invalid precision', () => {
    expect(() => getUniqueFloat(0)).toThrowDetailedError('PRECISION_NOT_POSITIVE_INTEGER', {
      message: 'Precision must be a positive integer',
      functionName: 'nextUniqueDecimal',
      details: { received: 0 },
    });
    expect(() => getUniqueFloat(-1)).toThrowDetailedError('PRECISION_NOT_POSITIVE_INTEGER', {
      message: 'Precision must be a positive integer',
      functionName: 'nextUniqueDecimal',
      details: { received: -1 },
    });
    expect(() => getUniqueFloat(1.5)).toThrowDetailedError('PRECISION_NOT_POSITIVE_INTEGER', {
      message: 'Precision must be a positive integer',
      functionName: 'nextUniqueDecimal',
      details: { received: 1.5 },
    });
    expect(() => getUniqueFloat(31)).toThrowDetailedError('PRECISION_EXCEEDS_MAXIMUM', {
      message: 'Precision must not exceed maximum',
      details: { max: 30, received: 31 },
      functionName: 'nextUniqueDecimal',
    });
  });
});

describe('getUniqueBigDecimal', () => {
  beforeEach(() => _reset(1));

  it('returns a string with the integer part from the counter', () => {
    const a = getUniqueBigDecimal();
    expect(a).toMatch(/^1\.\d+$/);
    const b = getUniqueBigDecimal();
    expect(b).toMatch(/^2\.\d+$/);
  });

  it('uses the counter value set by _reset', () => {
    _reset(99);
    expect(getUniqueBigDecimal()).toMatch(/^99\.\d+$/);
  });

  it('has the requested number of decimal places', () => {
    _reset(1);
    const value = getUniqueBigDecimal(4);
    const decimals = value.split('.')[1] ?? '';
    expect(decimals.length).toBe(4);
  });

  it('never ends with zero', () => {
    for (let i = 0; i < 5_000; i++) {
      expect(getUniqueBigDecimal()).not.toMatch(/0$/);
    }
  });

  it('throws on invalid precision', () => {
    expect(() => getUniqueBigDecimal(0)).toThrowDetailedError('PRECISION_NOT_POSITIVE_INTEGER', {
      message: 'Precision must be a positive integer',
      functionName: 'nextUniqueDecimal',
      details: { received: 0 },
    });
    expect(() => getUniqueBigDecimal(31)).toThrowDetailedError('PRECISION_EXCEEDS_MAXIMUM', {
      message: 'Precision must not exceed maximum',
      details: { max: 30, received: 31 },
      functionName: 'nextUniqueDecimal',
    });
  });
});

describe('getUniqueTimestamp', () => {
  beforeEach(() => _reset(1));

  it('returns a timestamp near test runtime', () => {
    const ts = getUniqueTimestamp();
    const now = Date.now();
    expect(ts).toBeGreaterThan(now - 120_000);
    expect(ts).toBeLessThan(now + 120_000);
  });

  it('increments by 1 minute per call', () => {
    const a = getUniqueTimestamp();
    const b = getUniqueTimestamp();
    expect(b - a).toBe(60_000);
  });
});

describe('getUniqueDate', () => {
  beforeEach(() => _reset(1));

  it('returns a Date instance', () => {
    expect(getUniqueDate()).toBeInstanceOf(Date);
  });

  it('returns dates 1 minute apart', () => {
    const a = getUniqueDate();
    const b = getUniqueDate();
    expect(b.getTime() - a.getTime()).toBe(60_000);
  });
});

describe('_reset', () => {
  it('resets the counter to the specified value', () => {
    getUniqueInt();
    getUniqueInt();
    _reset(1);
    expect(getUniqueInt()).toBe(1);
  });

  it('resets timestamp offset', () => {
    getUniqueTimestamp();
    getUniqueTimestamp();
    _reset(1);
    const a = getUniqueTimestamp();
    const b = getUniqueTimestamp();
    expect(b - a).toBe(60_000);
  });

  it('uses DYNAMIC_TESTING_COUNTER_START when called with no argument', () => {
    getUniqueInt();
    getUniqueInt();
    _reset();
    expect(getUniqueInt()).toBeGreaterThan(0);
  });

  it('throws when seeded above the 1,000,000 cap', () => {
    expect(() => _reset(5_000_000)).toThrowDetailedError('RESET_COUNTER_EXCEEDS_CAP', {
      message: '_resetCounter value exceeds cap',
      functionName: '_resetCounter',
      details: { received: 5_000_000, cap: 1_000_000 },
    });
  });

  it('throws when seeded with zero', () => {
    expect(() => _reset(0)).toThrowDetailedError('RESET_COUNTER_NOT_POSITIVE_INTEGER', {
      message: '_resetCounter requires a positive integer',
      functionName: '_resetCounter',
      details: { received: 0 },
    });
  });

  it('throws when seeded with a negative value', () => {
    expect(() => _reset(-5)).toThrowDetailedError('RESET_COUNTER_NOT_POSITIVE_INTEGER', {
      message: '_resetCounter requires a positive integer',
      functionName: '_resetCounter',
      details: { received: -5 },
    });
  });

  it('throws when seeded with NaN', () => {
    expect(() => _reset(NaN)).toThrowDetailedError('RESET_COUNTER_NOT_POSITIVE_INTEGER', {
      message: '_resetCounter requires a positive integer',
      functionName: '_resetCounter',
      details: { received: NaN },
    });
  });

  it('throws when seeded with a non-integer', () => {
    expect(() => _reset(1.5)).toThrowDetailedError('RESET_COUNTER_NOT_POSITIVE_INTEGER', {
      message: '_resetCounter requires a positive integer',
      functionName: '_resetCounter',
      details: { received: 1.5 },
    });
  });
});

describe('_getCounter', () => {
  it('returns the current counter value', () => {
    _reset(5);
    expect(_getCounter()).toBe(5);
    getUniqueInt();
    expect(_getCounter()).toBe(6);
  });
});
