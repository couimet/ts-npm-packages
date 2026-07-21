import type { ExpectedDetailedError } from '../index';
import { assertDetailedError } from '../internal/assertDetailedError';

import { createMockMatcherContext } from './mockMatcherContext';

import { DetailedError } from '@couimet/detailed-error';

const makeExpected = (overrides?: Partial<ExpectedDetailedError>): ExpectedDetailedError => ({
  message: 'Something went wrong',
  functionName: 'doStuff',
  ...overrides,
});

const ctx = createMockMatcherContext();

describe('assertDetailedError', () => {
  // --- received is not a DetailedError ---

  it('fails when received is a string', () => {
    const result = assertDetailedError.call(ctx, 'not an error', 'ERR', makeExpected(), 'toBeDetailedError');

    expect(result.pass).toBe(false);
    const msg = result.message();
    expect(msg).toContain('not an error');
    expect(msg).not.toBe('');
  });

  it('fails when received is a number', () => {
    const result = assertDetailedError.call(ctx, 42, 'ERR', makeExpected(), 'toBeDetailedError');

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('42');
  });

  it('fails when received is a boolean', () => {
    const result = assertDetailedError.call(ctx, false, 'ERR', makeExpected(), 'toBeDetailedError');

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('false');
  });

  it('fails when received is undefined', () => {
    const result = assertDetailedError.call(ctx, undefined, 'ERR', makeExpected(), 'toBeDetailedError');

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('undefined');
  });

  it('fails when received is an object (not DetailedError)', () => {
    const result = assertDetailedError.call(ctx, new Error('plain'), 'ERR', makeExpected(), 'toBeDetailedError');

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Expected value to be an instance of DetailedError');
  });

  it('uses the matcherName parameter in failure output', () => {
    const result = assertDetailedError.call(ctx, 'not an error', 'ERR', makeExpected(), 'toThrowDetailedError');

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('toThrowDetailedError');
  });

  // --- field mismatches ---

  it('fails when code does not match', () => {
    const err = new DetailedError({ code: 'ACTUAL', message: 'msg', functionName: 'fn' });
    const result = assertDetailedError.call(ctx, err, 'EXPECTED', makeExpected({ message: 'msg', functionName: 'fn' }), 'toBeDetailedError');

    expect(result.pass).toBe(false);
    const msg = result.message();
    expect(msg).toContain('Code:');
    expect(msg).toContain('"EXPECTED"');
    expect(msg).toContain('"ACTUAL"');
  });

  it('fails when message does not match', () => {
    const err = new DetailedError({ code: 'ERR', message: 'actual msg', functionName: 'fn' });
    const result = assertDetailedError.call(ctx, err, 'ERR', makeExpected({ message: 'expected msg', functionName: 'fn' }), 'toBeDetailedError');

    expect(result.pass).toBe(false);
    const msg = result.message();
    expect(msg).toContain('Message:');
    expect(msg).toContain('"expected msg"');
    expect(msg).toContain('"actual msg"');
  });

  it('fails when functionName does not match', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'actualFn' });
    const result = assertDetailedError.call(ctx, err, 'ERR', makeExpected({ message: 'msg', functionName: 'expectedFn' }), 'toBeDetailedError');

    expect(result.pass).toBe(false);
    const msg = result.message();
    expect(msg).toContain('Function name:');
    expect(msg).toContain('"expectedFn"');
    expect(msg).toContain('"actualFn"');
  });

  it('fails when functionName is undefined on error but expected has a value', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg' });
    const result = assertDetailedError.call(ctx, err, 'ERR', makeExpected({ message: 'msg', functionName: 'expectedFn' }), 'toBeDetailedError');

    expect(result.pass).toBe(false);
    const msg = result.message();
    expect(msg).toContain('Function name:');
    expect(msg).toContain('"expectedFn"');
    expect(msg).toContain('undefined');
  });

  it('fails when expected functionName is undefined but error has one', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'actualFn' });
    const result = assertDetailedError.call(ctx, err, 'ERR', makeExpected({ message: 'msg', functionName: undefined }), 'toBeDetailedError');

    expect(result.pass).toBe(false);
    const msg = result.message();
    expect(msg).toContain('Function name: expected undefined');
    expect(msg).toContain('"actualFn"');
  });

  it('fails when details do not match via toStrictEqual', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn', details: { key: 'actual' } });
    const result = assertDetailedError.call(
      ctx,
      err,
      'ERR',
      makeExpected({ message: 'msg', functionName: 'fn', details: { key: 'expected' } }),
      'toBeDetailedError',
    );

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Details (toStrictEqual)');
  });

  it('fails when details have extra undefined property that toStrictEqual catches', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn', details: { key: 'value', extra: undefined } });
    const result = assertDetailedError.call(
      ctx,
      err,
      'ERR',
      makeExpected({ message: 'msg', functionName: 'fn', details: { key: 'value' } }),
      'toBeDetailedError',
    );

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Details (toStrictEqual)');
  });

  it('fails when nested details have extra undefined property that toStrictEqual catches', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn', details: { nested: { key: 'value', extra: undefined } } });
    const result = assertDetailedError.call(
      ctx,
      err,
      'ERR',
      makeExpected({ message: 'msg', functionName: 'fn', details: { nested: { key: 'value' } } }),
      'toBeDetailedError',
    );

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Details (toStrictEqual)');
  });

  it('passes when both details have the same undefined property', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn', details: { key: 'value', extra: undefined } });
    const result = assertDetailedError.call(
      ctx,
      err,
      'ERR',
      makeExpected({ message: 'msg', functionName: 'fn', details: { key: 'value', extra: undefined } }),
      'toBeDetailedError',
    );

    expect(result.pass).toBe(true);
  });

  it('fails when expected details is undefined but error has details', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn', details: { key: 'value' } });
    const result = assertDetailedError.call(ctx, err, 'ERR', makeExpected({ message: 'msg', functionName: 'fn' }), 'toBeDetailedError');

    expect(result.pass).toBe(false);
    const msg = result.message();
    expect(msg).toContain('Details: expected undefined');
    expect(msg).toContain('"key"');
  });

  it('fails when cause does not match (Error instance)', () => {
    const expectedCause = new Error('expected cause');
    const actualCause = new Error('actual cause');
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn', cause: actualCause });
    const result = assertDetailedError.call(ctx, err, 'ERR', makeExpected({ message: 'msg', functionName: 'fn', cause: expectedCause }), 'toBeDetailedError');

    expect(result.pass).toBe(false);
    const msg = result.message();
    expect(msg).toContain('Cause:');
    expect(msg).toContain('expected cause');
    expect(msg).toContain('actual cause');
  });

  it('fails when expected cause is undefined but error has an Error cause', () => {
    const cause = new Error('root');
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn', cause });
    const result = assertDetailedError.call(ctx, err, 'ERR', makeExpected({ message: 'msg', functionName: 'fn' }), 'toBeDetailedError');

    expect(result.pass).toBe(false);
    const msg = result.message();
    expect(msg).toContain('Cause: expected undefined');
    expect(msg).toContain('root');
  });

  it('fails when expected cause is undefined but error has a non-Error cause', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn', cause: 'string cause' });
    const result = assertDetailedError.call(ctx, err, 'ERR', makeExpected({ message: 'msg', functionName: 'fn' }), 'toBeDetailedError');

    expect(result.pass).toBe(false);
    const msg = result.message();
    expect(msg).toContain('Cause: expected undefined');
    expect(msg).toContain('string cause');
  });

  it('fails when cause does not match (non-Error cause)', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn', cause: 'string cause' });
    const result = assertDetailedError.call(ctx, err, 'ERR', makeExpected({ message: 'msg', functionName: 'fn', cause: 'different' }), 'toBeDetailedError');

    expect(result.pass).toBe(false);
    const msg = result.message();
    expect(msg).toContain('Cause:');
    expect(msg).toContain('different');
    expect(msg).toContain('string cause');
  });

  it('fails when expected cause is a non-Error and actual cause is a non-Error', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn', cause: 'actual' });
    const result = assertDetailedError.call(ctx, err, 'ERR', makeExpected({ message: 'msg', functionName: 'fn', cause: 'expected' }), 'toBeDetailedError');

    expect(result.pass).toBe(false);
    const msg = result.message();
    expect(msg).toContain('Cause:');
    expect(msg).toContain('expected');
    expect(msg).toContain('actual');
  });

  // --- cause with asymmetric matchers ---

  it('passes when cause matches via expect.any(Error) asymmetric matcher', () => {
    const cause = new Error('root');
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn', cause });
    const result = assertDetailedError.call(
      ctx,
      err,
      'ERR',
      makeExpected({ message: 'msg', functionName: 'fn', cause: expect.any(Error) }),
      'toBeDetailedError',
    );

    expect(result.pass).toBe(true);
  });

  it('passes when cause matches via expect.anything() asymmetric matcher', () => {
    const cause = new Error('root');
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn', cause });
    const result = assertDetailedError.call(
      ctx,
      err,
      'ERR',
      makeExpected({ message: 'msg', functionName: 'fn', cause: expect.anything() }),
      'toBeDetailedError',
    );

    expect(result.pass).toBe(true);
  });

  it('handles cause message formatting when expected cause is expect.stringContaining("expected")', () => {
    const cause = new Error('actual cause');
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn', cause });
    const result = assertDetailedError.call(
      ctx,
      err,
      'ERR',
      makeExpected({ message: 'msg', functionName: 'fn', cause: expect.stringContaining('expected') }),
      'toBeDetailedError',
    );

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Cause:');
  });

  // --- all match ---

  it('passes when all fields match', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn' });
    const result = assertDetailedError.call(ctx, err, 'ERR', makeExpected({ message: 'msg', functionName: 'fn' }), 'toBeDetailedError');

    expect(result.pass).toBe(true);
  });

  it('passes when all fields including details and cause match', () => {
    const cause = new Error('root');
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn', details: { a: 1 }, cause });
    const result = assertDetailedError.call(
      ctx,
      err,
      'ERR',
      makeExpected({ message: 'msg', functionName: 'fn', details: { a: 1 }, cause }),
      'toBeDetailedError',
    );

    expect(result.pass).toBe(true);
  });

  it('pass message uses matcherHint with isNot when negated', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn' });
    const ctxNot = createMockMatcherContext({ isNot: true });
    const result = assertDetailedError.call(ctxNot, err, 'ERR', makeExpected({ message: 'msg', functionName: 'fn' }), 'toBeDetailedError');

    expect(result.pass).toBe(true);
    const msg = result.message();
    expect(msg).toContain('.not');
    expect(msg).toContain('Expected: not');
  });

  it('passes when details match deeply via toStrictEqual', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn', details: { nested: { key: 'value' } } });
    const result = assertDetailedError.call(
      ctx,
      err,
      'ERR',
      makeExpected({ message: 'msg', functionName: 'fn', details: { nested: { key: 'value' } } }),
      'toBeDetailedError',
    );

    expect(result.pass).toBe(true);
  });

  it('passes when details is undefined on both error and expected', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn' });
    const result = assertDetailedError.call(ctx, err, 'ERR', makeExpected({ message: 'msg', functionName: 'fn' }), 'toBeDetailedError');

    expect(result.pass).toBe(true);
  });

  it('passes when cause is undefined on both error and expected', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn' });
    const result = assertDetailedError.call(ctx, err, 'ERR', makeExpected({ message: 'msg', functionName: 'fn' }), 'toBeDetailedError');

    expect(result.pass).toBe(true);
  });

  it('passes when functionName is undefined on both error and expected', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg' });
    const result = assertDetailedError.call(ctx, err, 'ERR', makeExpected({ message: 'msg', functionName: undefined }), 'toBeDetailedError');

    expect(result.pass).toBe(true);
  });

  it('does not throw when details contain circular references', () => {
    const circular: Record<string, unknown> = { key: 'value' };
    circular.self = circular;
    const err = new DetailedError({ code: 'ERR', message: 'msg', details: circular });
    const result = assertDetailedError.call(ctx, err, 'ERR', makeExpected({ message: 'msg', details: { key: 'different' } }), 'toBeDetailedError');

    expect(result.pass).toBe(false);
    expect(() => result.message()).not.toThrow();
  });
});
