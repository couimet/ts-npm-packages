import { type ExpectedDetailedError, toThrowDetailedError } from '../index';

import { createMockMatcherContext } from './mockMatcherContext';

import { DetailedError } from '@couimet/detailed-error';

const makeExpected = (overrides?: Partial<ExpectedDetailedError>): ExpectedDetailedError => ({
  message: 'msg',
  functionName: 'fn',
  ...overrides,
});

const ctx = createMockMatcherContext();

describe('toThrowDetailedError', () => {
  it('passes when function throws a matching DetailedError', () => {
    const fn = () => {
      throw new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn' });
    };

    const result = toThrowDetailedError.call(ctx, fn, 'ERR', makeExpected());

    expect(result.pass).toBe(true);
  });

  it('fails when function does not throw', () => {
    const fn = () => {
      /* no throw */
    };

    const result = toThrowDetailedError.call(ctx, fn, 'ERR', makeExpected());

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('did not throw');
  });

  it('fails when function throws a non-matching DetailedError', () => {
    const fn = () => {
      throw new DetailedError({ code: 'WRONG', message: 'msg', functionName: 'fn' });
    };

    const result = toThrowDetailedError.call(ctx, fn, 'ERR', makeExpected());

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Code:');
    expect(result.message()).toContain('"ERR"');
  });

  it('fails when function throws a non-DetailedError', () => {
    const fn = () => {
      throw new Error('plain error');
    };

    const result = toThrowDetailedError.call(ctx, fn, 'ERR', makeExpected());

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Expected value to be an instance of DetailedError');
  });

  it('pass message uses matcherHint with negation format when negated', () => {
    const ctxNot = createMockMatcherContext({ isNot: true });
    const fn = () => {
      throw new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn' });
    };

    const result = toThrowDetailedError.call(ctxNot, fn, 'ERR', makeExpected());

    expect(result.pass).toBe(true);
    expect(result.message()).toContain('.not');
  });

  it('detects throw undefined as a thrown value (not "nothing thrown")', () => {
    const fn = () => {
      throw undefined;
    };

    const result = toThrowDetailedError.call(ctx, fn, 'ERR', makeExpected());

    expect(result.pass).toBe(false);
    expect(result.message()).not.toContain('did not throw');
  });

  it('detects throw null as a thrown value (not "nothing thrown")', () => {
    const fn = () => {
      throw null;
    };

    const result = toThrowDetailedError.call(ctx, fn, 'ERR', makeExpected());

    expect(result.pass).toBe(false);
    expect(result.message()).not.toContain('did not throw');
  });
});
