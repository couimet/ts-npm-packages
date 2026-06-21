import { type ExpectedDetailedError } from '../DetailedErrorMatcher';
import { toThrowDetailedError } from '../toThrowDetailedError';

import { DetailedError } from '@couimet/detailed-error';

const makeExpected = (overrides?: Partial<ExpectedDetailedError>): ExpectedDetailedError => ({
  message: 'msg',
  functionName: 'fn',
  ...overrides,
});

describe('toThrowDetailedError', () => {
  it('passes when function throws a matching DetailedError', () => {
    const fn = () => {
      throw new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn' });
    };

    const result = toThrowDetailedError(fn, 'ERR', makeExpected());

    expect(result.pass).toBe(true);
  });

  it('fails when function does not throw', () => {
    const fn = () => {
      /* no throw */
    };

    const result = toThrowDetailedError(fn, 'ERR', makeExpected());

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('nothing was thrown');
  });

  it('fails when function throws a non-matching DetailedError', () => {
    const fn = () => {
      throw new DetailedError({ code: 'WRONG', message: 'msg', functionName: 'fn' });
    };

    const result = toThrowDetailedError(fn, 'ERR', makeExpected());

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Code: expected "ERR"');
  });

  it('fails when function throws a non-DetailedError', () => {
    const fn = () => {
      throw new Error('plain error');
    };

    const result = toThrowDetailedError(fn, 'ERR', makeExpected());

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Expected value to be an instance of DetailedError');
  });

  it('pass message describes negation when passing', () => {
    const fn = () => {
      throw new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn' });
    };

    const result = toThrowDetailedError(fn, 'ERR', makeExpected());

    expect(result.pass).toBe(true);
    expect(result.message()).toContain('NOT to match');
  });
});
