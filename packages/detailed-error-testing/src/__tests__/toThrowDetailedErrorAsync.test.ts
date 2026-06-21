import { type ExpectedDetailedError } from '../DetailedErrorMatcher';
import { toThrowDetailedErrorAsync } from '../toThrowDetailedErrorAsync';

import { DetailedError } from '@couimet/detailed-error';

const makeExpected = (overrides?: Partial<ExpectedDetailedError>): ExpectedDetailedError => ({
  message: 'msg',
  functionName: 'fn',
  ...overrides,
});

describe('toThrowDetailedErrorAsync', () => {
  it('passes when async function throws a matching DetailedError', async () => {
    const fn = async () => {
      await Promise.resolve();
      throw new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn' });
    };

    const result = await toThrowDetailedErrorAsync(fn, 'ERR', makeExpected());

    expect(result.pass).toBe(true);
  });

  it('fails when async function does not throw', async () => {
    const fn = async () => {
      await Promise.resolve();
    };

    const result = await toThrowDetailedErrorAsync(fn, 'ERR', makeExpected());

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('nothing was thrown');
  });

  it('fails when async function throws a non-matching DetailedError', async () => {
    const fn = async () => {
      await Promise.resolve();
      throw new DetailedError({ code: 'WRONG', message: 'msg', functionName: 'fn' });
    };

    const result = await toThrowDetailedErrorAsync(fn, 'ERR', makeExpected());

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Code: expected "ERR"');
  });

  it('fails when async function throws a non-DetailedError', async () => {
    const fn = async () => {
      await Promise.resolve();
      throw new Error('plain error');
    };

    const result = await toThrowDetailedErrorAsync(fn, 'ERR', makeExpected());

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Expected value to be an instance of DetailedError');
  });

  it('pass message describes negation when passing', async () => {
    const fn = async () => {
      await Promise.resolve();
      throw new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn' });
    };

    const result = await toThrowDetailedErrorAsync(fn, 'ERR', makeExpected());

    expect(result.pass).toBe(true);
    expect(result.message()).toContain('NOT to match');
  });
});
