import type { ExpectedDetailedError } from '../ExpectedDetailedError';
import { assertDetailedError } from '../internal/assertDetailedError';

import { DetailedError } from '@couimet/detailed-error';

const makeExpected = (overrides?: Partial<ExpectedDetailedError>): ExpectedDetailedError => ({
  message: 'Something went wrong',
  functionName: 'doStuff',
  ...overrides,
});

describe('assertDetailedError', () => {
  // --- received is not a DetailedError ---

  it('fails when received is a string', () => {
    const result = assertDetailedError('not an error', 'ERR', makeExpected());

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('string: "not an error"');
  });

  it('fails when received is a number', () => {
    const result = assertDetailedError(42, 'ERR', makeExpected());

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('number: 42');
  });

  it('fails when received is a boolean', () => {
    const result = assertDetailedError(false, 'ERR', makeExpected());

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('boolean: false');
  });

  it('fails when received is undefined', () => {
    const result = assertDetailedError(undefined, 'ERR', makeExpected());

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('undefined: undefined');
  });

  it('fails when received is an object (not DetailedError)', () => {
    const result = assertDetailedError(new Error('plain'), 'ERR', makeExpected());

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Expected value to be an instance of DetailedError, but received: Error');
  });

  // --- field mismatches ---

  it('fails when code does not match', () => {
    const err = new DetailedError({ code: 'ACTUAL', message: 'msg', functionName: 'fn' });
    const result = assertDetailedError(err, 'EXPECTED', makeExpected({ message: 'msg', functionName: 'fn' }));

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Code: expected "EXPECTED", received "ACTUAL"');
  });

  it('fails when message does not match', () => {
    const err = new DetailedError({ code: 'ERR', message: 'actual msg', functionName: 'fn' });
    const result = assertDetailedError(err, 'ERR', makeExpected({ message: 'expected msg', functionName: 'fn' }));

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Message:');
  });

  it('fails when functionName does not match', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'actualFn' });
    const result = assertDetailedError(err, 'ERR', makeExpected({ message: 'msg', functionName: 'expectedFn' }));

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Function name: expected "expectedFn", received "actualFn"');
  });

  it('fails when functionName is undefined on error but expected has a value', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg' });
    const result = assertDetailedError(err, 'ERR', makeExpected({ message: 'msg', functionName: 'expectedFn' }));

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Function name: expected "expectedFn", received "undefined"');
  });

  it('fails when expected functionName is undefined but error has one', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'actualFn' });
    const result = assertDetailedError(err, 'ERR', makeExpected({ message: 'msg', functionName: undefined }));

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Function name: expected undefined, received "actualFn"');
  });

  it('fails when details do not match via toStrictEqual', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn', details: { key: 'actual' } });
    const result = assertDetailedError(err, 'ERR', makeExpected({ message: 'msg', functionName: 'fn', details: { key: 'expected' } }));

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Details (toStrictEqual)');
  });

  it('fails when details have extra undefined property that toStrictEqual catches', () => {
    // toEqual would pass here (it ignores undefined properties); toStrictEqual correctly fails
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn', details: { key: 'value', extra: undefined } });
    const result = assertDetailedError(err, 'ERR', makeExpected({ message: 'msg', functionName: 'fn', details: { key: 'value' } }));

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Details (toStrictEqual)');
  });

  it('fails when nested details have extra undefined property that toStrictEqual catches', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn', details: { nested: { key: 'value', extra: undefined } } });
    const result = assertDetailedError(err, 'ERR', makeExpected({ message: 'msg', functionName: 'fn', details: { nested: { key: 'value' } } }));

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Details (toStrictEqual)');
  });

  it('passes when both details have the same undefined property', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn', details: { key: 'value', extra: undefined } });
    const result = assertDetailedError(err, 'ERR', makeExpected({ message: 'msg', functionName: 'fn', details: { key: 'value', extra: undefined } }));

    expect(result.pass).toBe(true);
  });

  it('fails when expected details is undefined but error has details', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn', details: { key: 'value' } });
    const result = assertDetailedError(err, 'ERR', makeExpected({ message: 'msg', functionName: 'fn' }));

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Details: expected undefined');
  });

  it('fails when cause does not match (Error instance)', () => {
    const expectedCause = new Error('expected cause');
    const actualCause = new Error('actual cause');
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn', cause: actualCause });
    const result = assertDetailedError(err, 'ERR', makeExpected({ message: 'msg', functionName: 'fn', cause: expectedCause }));

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Cause: expected expected cause, received actual cause');
  });

  it('fails when expected cause is undefined but error has an Error cause', () => {
    const cause = new Error('root');
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn', cause });
    const result = assertDetailedError(err, 'ERR', makeExpected({ message: 'msg', functionName: 'fn' }));

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Cause: expected undefined');
  });

  it('fails when expected cause is undefined but error has a non-Error cause', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn', cause: 'string cause' });
    const result = assertDetailedError(err, 'ERR', makeExpected({ message: 'msg', functionName: 'fn' }));

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Cause: expected undefined');
  });

  it('fails when cause does not match (non-Error cause)', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn', cause: 'string cause' });
    const result = assertDetailedError(err, 'ERR', makeExpected({ message: 'msg', functionName: 'fn', cause: 'different' }));

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Cause: expected different, received string cause');
  });

  it('fails when expected cause is a non-Error and actual cause is a non-Error', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn', cause: 'actual' });
    const result = assertDetailedError(err, 'ERR', makeExpected({ message: 'msg', functionName: 'fn', cause: 'expected' }));

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Cause: expected expected, received actual');
  });

  // --- all match ---

  it('passes when all fields match', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn' });
    const result = assertDetailedError(err, 'ERR', makeExpected({ message: 'msg', functionName: 'fn' }));

    expect(result.pass).toBe(true);
  });

  it('passes when all fields including details and cause match', () => {
    const cause = new Error('root');
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn', details: { a: 1 }, cause });
    const result = assertDetailedError(err, 'ERR', makeExpected({ message: 'msg', functionName: 'fn', details: { a: 1 }, cause }));

    expect(result.pass).toBe(true);
  });

  it('pass message describes negation', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn' });
    const result = assertDetailedError(err, 'ERR', makeExpected({ message: 'msg', functionName: 'fn' }));

    expect(result.pass).toBe(true);
    expect(result.message()).toContain('NOT to match');
  });

  it('passes when details match deeply via toStrictEqual', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn', details: { nested: { key: 'value' } } });
    const result = assertDetailedError(err, 'ERR', makeExpected({ message: 'msg', functionName: 'fn', details: { nested: { key: 'value' } } }));

    expect(result.pass).toBe(true);
  });

  it('passes when details is undefined on both error and expected', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn' });
    const result = assertDetailedError(err, 'ERR', makeExpected({ message: 'msg', functionName: 'fn' }));

    expect(result.pass).toBe(true);
  });

  it('passes when cause is undefined on both error and expected', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn' });
    const result = assertDetailedError(err, 'ERR', makeExpected({ message: 'msg', functionName: 'fn' }));

    expect(result.pass).toBe(true);
  });

  it('passes when functionName is undefined on both error and expected', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg' });
    const result = assertDetailedError(err, 'ERR', makeExpected({ message: 'msg', functionName: undefined }));

    expect(result.pass).toBe(true);
  });

  it('does not throw when details contain circular references', () => {
    const circular: Record<string, unknown> = { key: 'value' };
    circular.self = circular;
    const err = new DetailedError({ code: 'ERR', message: 'msg', details: circular });
    const result = assertDetailedError(err, 'ERR', makeExpected({ message: 'msg', details: { key: 'different' } }));

    expect(result.pass).toBe(false);
    expect(() => result.message()).not.toThrow();
  });
});
