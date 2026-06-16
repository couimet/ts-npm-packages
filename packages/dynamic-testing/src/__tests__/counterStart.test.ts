import type { COUNTER_START as CounterStartType } from '../counterStart';

describe('COUNTER_START (resolveCounterStart)', () => {
  const originalEnv = process.env;
  let warnSpy: jest.SpyInstance;

  const loadCounterStart = (envValue: string | undefined): typeof CounterStartType => {
    jest.resetModules();
    if (envValue === undefined) {
      delete process.env.DYNAMIC_TESTING_COUNTER_START;
    } else {
      process.env.DYNAMIC_TESTING_COUNTER_START = envValue;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('../counterStart').COUNTER_START;
  };

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    warnSpy.mockRestore();
  });

  it('defaults to 1 when DYNAMIC_TESTING_COUNTER_START is not set', () => {
    const start = loadCounterStart(undefined);
    expect(start).toBe(1);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('uses the env var when a valid positive integer', () => {
    const start = loadCounterStart('42');
    expect(start).toBe(42);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('ignores zero and defaults to 1', () => {
    const start = loadCounterStart('0');
    expect(start).toBe(1);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('not a valid positive integer'));
  });

  it('ignores negative integers and defaults to 1', () => {
    const start = loadCounterStart('-5');
    expect(start).toBe(1);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('not a valid positive integer'));
  });

  it('ignores non-integer strings and defaults to 1', () => {
    const start = loadCounterStart('hello');
    expect(start).toBe(1);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('not a valid positive integer'));
  });

  it('caps the start at 1,000,000', () => {
    const start = loadCounterStart('2000000');
    expect(start).toBe(1_000_000);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('exceeds cap'));
  });
});
