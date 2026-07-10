import { type COUNTER_START as CounterStartType, COUNTER_START_ENV_VAR } from '../counterStart';

describe('COUNTER_START (resolveCounterStart)', () => {
  const originalEnv = { ...process.env };

  const loadCounterStart = (envValue: string | undefined): typeof CounterStartType => {
    jest.resetModules();
    if (envValue === undefined) {
      delete process.env[COUNTER_START_ENV_VAR];
    } else {
      process.env[COUNTER_START_ENV_VAR] = envValue;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('../counterStart').COUNTER_START;
  };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('defaults to 1 when DYNAMIC_TESTING_COUNTER_START is not set', () => {
    expect(loadCounterStart(undefined)).toBe(1);
  });

  it('uses the env var when a valid positive integer', () => {
    expect(loadCounterStart('42')).toBe(42);
  });

  it('throws when the env var is zero', () => {
    expect(() => loadCounterStart('0')).toThrow('Environment variable value is not a valid positive integer');
  });

  it('throws when the env var is a negative integer', () => {
    expect(() => loadCounterStart('-5')).toThrow('Environment variable value is not a valid positive integer');
  });

  it('throws when the env var is a non-integer string', () => {
    expect(() => loadCounterStart('hello')).toThrow('Environment variable value is not a valid positive integer');
  });

  it('throws when the env var exceeds the cap', () => {
    expect(() => loadCounterStart('2000000')).toThrow('Environment variable value exceeds cap');
  });
});
