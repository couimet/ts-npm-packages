import { type ExpectedDetailedError } from '../ExpectedDetailedError';
import { toBeDetailedError } from '../toBeDetailedError';

import { DetailedError } from '@couimet/detailed-error';

const makeExpected = (overrides?: Partial<ExpectedDetailedError>): ExpectedDetailedError => ({
  message: 'msg',
  functionName: 'fn',
  ...overrides,
});

describe('toBeDetailedError', () => {
  it('passes when error matches expected code and fields', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn' });

    const result = toBeDetailedError(err, 'ERR', makeExpected());

    expect(result.pass).toBe(true);
  });

  it('fails when error does not match', () => {
    const err = new DetailedError({ code: 'WRONG', message: 'msg', functionName: 'fn' });

    const result = toBeDetailedError(err, 'ERR', makeExpected());

    expect(result.pass).toBe(false);
  });

  it('fails when received is not a DetailedError', () => {
    const result = toBeDetailedError('not an error', 'ERR', makeExpected());

    expect(result.pass).toBe(false);
  });

  it('pass message describes negation when passing', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn' });

    const result = toBeDetailedError(err, 'ERR', makeExpected());

    expect(result.pass).toBe(true);
    expect(result.message()).toContain('NOT to match');
  });
});
