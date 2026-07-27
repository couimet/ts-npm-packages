import { toBeSuccessWith } from '../index';

import { createMockMatcherContext } from './mockMatcherContext';

import { DetailedResult } from '@couimet/detailed-result';

const ctx = createMockMatcherContext();

describe('toBeSuccessWith', () => {
  it('passes when result is a success and callback assertions pass', () => {
    const result = DetailedResult.success({ id: 1, name: 'Alice' });

    const matcherResult = toBeSuccessWith.call(ctx, result, (value) => {
      expect(value).toEqual({ id: 1, name: 'Alice' });
    });

    expect(matcherResult.pass).toBe(true);
    expect(matcherResult.message()).toBe('Result is successful and value assertions passed');
  });

  it('passes callback the result value', () => {
    const result = DetailedResult.success(42);
    let captured: unknown;

    toBeSuccessWith.call(ctx, result, (value) => {
      captured = value;
    });

    expect(captured).toBe(42);
  });

  it('fails when result is an error', () => {
    const result = DetailedResult.failure(new Error('boom'));

    const matcherResult = toBeSuccessWith.call(ctx, result, () => {
      // Should not be called
    });

    expect(matcherResult.pass).toBe(false);
    expect(matcherResult.message()).toBe('Result was expected to be successful, but it is an error.\n\nError:\n  [Error: boom]');
  });

  it('fails when received is not a DetailedResult', () => {
    const matcherResult = toBeSuccessWith.call(ctx, 'not a result', () => {
      // Should not be called
    });

    expect(matcherResult.pass).toBe(false);
    expect(matcherResult.message()).toBe('Expected value to be a DetailedResult, but received: String');
  });

  it('fails when received is null', () => {
    const matcherResult = toBeSuccessWith.call(ctx, null, () => {
      // Should not be called
    });

    expect(matcherResult.pass).toBe(false);
    expect(matcherResult.message()).toBe('Expected value to be a DetailedResult, but received: object');
  });

  it('fails when callback throws a Jest assertion error', () => {
    const result = DetailedResult.success({ id: 1 });

    const matcherResult = toBeSuccessWith.call(ctx, result, (_value) => {
      // Use a raw Error to simulate a Jest assertion failure without depending on expect's internals
      throw new Error('expect(received).toBe(expected)\n\nExpected: 2\nReceived: 1');
    });

    expect(matcherResult.pass).toBe(false);
    expect(matcherResult.message()).toBe('expect(received).toBe(expected)\n\nExpected: 2\nReceived: 1');
  });

  it('fails when callback throws a non-Error', () => {
    const result = DetailedResult.success('ok');

    const matcherResult = toBeSuccessWith.call(ctx, result, () => {
      throw 'something went wrong';
    });

    expect(matcherResult.pass).toBe(false);
    expect(matcherResult.message()).toBe('something went wrong');
  });

  it('pass message uses matcherHint with negation format when isNot', () => {
    const ctxNot = createMockMatcherContext({ isNot: true });
    const result = DetailedResult.success(42);

    const matcherResult = toBeSuccessWith.call(ctxNot, result, () => {
      // Callback passes
    });

    expect(matcherResult.pass).toBe(true);
    expect(matcherResult.message()).toBe(
      'expect(received).not.toBeSuccessWith(expected)\n\nResult is successful and the value callback did not throw, but .not was used so this is treated as a failure.',
    );
  });
});
