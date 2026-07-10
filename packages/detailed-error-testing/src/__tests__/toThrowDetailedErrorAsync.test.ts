import { type ExpectedDetailedError, toThrowDetailedErrorAsync } from '../index';

import { createMockMatcherContext } from './mockMatcherContext';

import { DetailedError } from '@couimet/detailed-error';

const makeExpected = (overrides?: Partial<ExpectedDetailedError>): ExpectedDetailedError => ({
  message: 'msg',
  functionName: 'fn',
  ...overrides,
});

const ctx = createMockMatcherContext();

describe('toThrowDetailedErrorAsync', () => {
  it('passes when async function throws a matching DetailedError', async () => {
    const fn = async () => {
      await Promise.resolve();
      throw new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn' });
    };

    const result = await toThrowDetailedErrorAsync.call(ctx, fn, 'ERR', makeExpected());

    expect(result.pass).toBe(true);
  });

  it('fails when async function does not throw', async () => {
    const fn = async () => {
      await Promise.resolve();
    };

    const result = await toThrowDetailedErrorAsync.call(ctx, fn, 'ERR', makeExpected());

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('did not throw');
  });

  it('fails when async function throws a non-matching DetailedError', async () => {
    const fn = async () => {
      await Promise.resolve();
      throw new DetailedError({ code: 'WRONG', message: 'msg', functionName: 'fn' });
    };

    const result = await toThrowDetailedErrorAsync.call(ctx, fn, 'ERR', makeExpected());

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Code:');
    expect(result.message()).toContain('"ERR"');
  });

  it('fails when async function throws a non-DetailedError', async () => {
    const fn = async () => {
      await Promise.resolve();
      throw new Error('plain error');
    };

    const result = await toThrowDetailedErrorAsync.call(ctx, fn, 'ERR', makeExpected());

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Expected value to be an instance of DetailedError');
  });

  it('pass message uses matcherHint with negation format when negated', async () => {
    const ctxNot = createMockMatcherContext({ isNot: true });
    const fn = async () => {
      await Promise.resolve();
      throw new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn' });
    };

    const result = await toThrowDetailedErrorAsync.call(ctxNot, fn, 'ERR', makeExpected());

    expect(result.pass).toBe(true);
    expect(result.message()).toContain('.not');
  });

  it('detects throw undefined as a thrown value (not "nothing thrown")', async () => {
    const fn = async () => {
      await Promise.resolve();
      throw undefined;
    };

    const result = await toThrowDetailedErrorAsync.call(ctx, fn, 'ERR', makeExpected());

    expect(result.pass).toBe(false);
    expect(result.message()).not.toContain('did not throw');
  });

  it('detects throw null as a thrown value (not "nothing thrown")', async () => {
    const fn = async () => {
      await Promise.resolve();
      throw null;
    };

    const result = await toThrowDetailedErrorAsync.call(ctx, fn, 'ERR', makeExpected());

    expect(result.pass).toBe(false);
    expect(result.message()).not.toContain('did not throw');
  });
});
