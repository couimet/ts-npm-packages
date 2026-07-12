import { type ExpectedDetailedError, toBeDetailedError } from '../index';

import { createMockMatcherContext } from './mockMatcherContext';

import { DetailedError } from '@couimet/detailed-error';

const makeExpected = (overrides?: Partial<ExpectedDetailedError>): ExpectedDetailedError => ({
  message: 'msg',
  functionName: 'fn',
  ...overrides,
});

const ctx = createMockMatcherContext();

describe('toBeDetailedError', () => {
  it('passes when error matches expected code and fields', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn' });

    const result = toBeDetailedError.call(ctx, err, 'ERR', makeExpected());

    expect(result.pass).toBe(true);
  });

  it('fails when error does not match', () => {
    const err = new DetailedError({ code: 'WRONG', message: 'msg', functionName: 'fn' });

    const result = toBeDetailedError.call(ctx, err, 'ERR', makeExpected());

    expect(result.pass).toBe(false);
  });

  it('fails when received is not a DetailedError', () => {
    const result = toBeDetailedError.call(ctx, 'not an error', 'ERR', makeExpected());

    expect(result.pass).toBe(false);
  });

  it('pass message uses matcherHint with negation format when isNot', () => {
    const ctxNot = createMockMatcherContext({ isNot: true });
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn' });

    const result = toBeDetailedError.call(ctxNot, err, 'ERR', makeExpected());

    expect(result.pass).toBe(true);
    expect(result.message()).toContain('.not');
  });
});
