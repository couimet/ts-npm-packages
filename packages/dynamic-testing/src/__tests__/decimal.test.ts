import { getUniqueDecimal } from '../decimal';
import { _reset } from '../unique';

describe('getUniqueDecimal', () => {
  beforeEach(() => _reset(1));

  it('returns a Decimal instance with the integer part from the counter', () => {
    const d = getUniqueDecimal();
    expect(Math.floor(d.toNumber())).toBe(1);
  });

  it('derives values from the counter', () => {
    const a = getUniqueDecimal();
    const b = getUniqueDecimal();
    expect(Math.floor(a.toNumber())).toBe(1);
    expect(Math.floor(b.toNumber())).toBe(2);
  });

  it('respects the precision parameter', () => {
    _reset(1);
    const d = getUniqueDecimal(4);
    expect(d.toString()).toMatch(/^1\.\d{4}$/);
  });

  it('supports arithmetic operations', () => {
    const a = getUniqueDecimal();
    const b = getUniqueDecimal();
    const sum = a.plus(b);
    expect(sum.toNumber()).toBeGreaterThan(2);
  });

  it('never ends with zero', () => {
    for (let i = 0; i < 5_000; i++) {
      expect(getUniqueDecimal().toString()).not.toMatch(/0$/);
    }
  });

  it('supports comparison operations', () => {
    const a = getUniqueDecimal();
    const b = getUniqueDecimal();
    expect(a.lessThan(b)).toBe(true);
    expect(b.greaterThan(a)).toBe(true);
  });
});

describe('getUniqueDecimal when decimal.js is missing', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('throws an explanatory error', () => {
    jest.doMock('decimal.js', () => {
      throw new Error('Cannot find module');
    });

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('../decimal');
    expect(() => mod.getUniqueDecimal()).toThrow('Install decimal.js to use getUniqueDecimal()');
  });
});
