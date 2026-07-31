import { toBeFailureWith } from '../index';

import { createMockMatcherContext } from './mockMatcherContext';

import { DetailedResult } from '@couimet/detailed-result';

const ctx = createMockMatcherContext();

describe('toBeFailureWith', () => {
  it('passes when result is a failure and callback assertions pass', () => {
    const error = new Error('invalid');
    const result = DetailedResult.failure(error);

    const matcherResult = toBeFailureWith.call(ctx, result, (err) => {
      expect(err).toBe(error);
    });

    expect(matcherResult.pass).toBe(true);
    expect(matcherResult.message()).toBe('Result is an error and error assertions passed');
  });

  it('passes callback the result error', () => {
    const error = new Error('boom');
    const result = DetailedResult.failure(error);
    let captured: unknown;

    toBeFailureWith.call(ctx, result, (err) => {
      captured = err;
    });

    expect(captured).toBe(error);
  });

  it('fails when result is a success', () => {
    const result = DetailedResult.success('ok');

    const matcherResult = toBeFailureWith.call(ctx, result, () => {
      // Should not be called
    });

    expect(matcherResult.pass).toBe(false);
    expect(matcherResult.message()).toBe('Result was expected to be an error, but it is successful.\n\nValue:\n  "ok"');
  });

  it('fails when received is not a DetailedResult', () => {
    const matcherResult = toBeFailureWith.call(ctx, 'not a result', () => {
      // Should not be called
    });

    expect(matcherResult.pass).toBe(false);
    expect(matcherResult.message()).toBe('Expected value to be a DetailedResult, but received: String');
  });

  it('fails when received is null', () => {
    const matcherResult = toBeFailureWith.call(ctx, null, () => {
      // Should not be called
    });

    expect(matcherResult.pass).toBe(false);
    expect(matcherResult.message()).toBe('Expected value to be a DetailedResult, but received: object');
  });

  it('fails when callback throws a Jest assertion error', () => {
    const error = new Error('validation failed');
    const result = DetailedResult.failure(error);

    const matcherResult = toBeFailureWith.call(ctx, result, () => {
      throw new Error('expect(received).toBe(expected)\n\nExpected: 2\nReceived: 1');
    });

    expect(matcherResult.pass).toBe(false);
    expect(matcherResult.message()).toBe('expect(received).toBe(expected)\n\nExpected: 2\nReceived: 1');
  });

  it('fails when callback throws a non-Error', () => {
    const error = new Error('boom');
    const result = DetailedResult.failure(error);

    const matcherResult = toBeFailureWith.call(ctx, result, () => {
      throw 'something went wrong';
    });

    expect(matcherResult.pass).toBe(false);
    expect(matcherResult.message()).toBe('something went wrong');
  });

  it('pass message uses matcherHint with negation format when isNot', () => {
    const error = new Error('boom');
    const ctxNot = createMockMatcherContext({ isNot: true });
    const result = DetailedResult.failure(error);

    const matcherResult = toBeFailureWith.call(ctxNot, result, () => {
      // Callback passes
    });

    expect(matcherResult.pass).toBe(true);
    expect(matcherResult.message()).toBe(
      'expect(received).not.toBeFailureWith(expected)\n\nResult is an error and the error callback did not throw, but .not was used so this is treated as a failure.',
    );
  });
});
