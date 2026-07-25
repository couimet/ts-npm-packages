import { toBeFailure } from '../index';

import { createMockMatcherContext } from './mockMatcherContext';

import { DetailedResult } from '@couimet/detailed-result';

const ctx = createMockMatcherContext();

describe('toBeFailure', () => {
  it('passes when result is a failure with matching expected error', () => {
    const error = new Error('expected error');
    const result = DetailedResult.failure(error);

    const matcherResult = toBeFailure.call(ctx, result, error);

    expect(matcherResult.pass).toBe(true);
  });

  it('fails when result is a success', () => {
    const result = DetailedResult.success('ok');

    const matcherResult = toBeFailure.call(ctx, result, 'ok');

    expect(matcherResult.pass).toBe(false);
    expect(matcherResult.message()).toBe(
      'expect(received).toBeFailure(expected)\n' + '\n' + 'Result discriminator:\n' + '  Expected: success to be false\n' + '  Received: success is true',
    );
  });

  it('fails when received is not a DetailedResult', () => {
    const matcherResult = toBeFailure.call(ctx, 'not a result', 'irrelevant');

    expect(matcherResult.pass).toBe(false);
  });

  it('fails when failure error does not match expected', () => {
    const result = DetailedResult.failure(new Error('actual error'));

    const matcherResult = toBeFailure.call(ctx, result, new Error('expected error'));

    expect(matcherResult.pass).toBe(false);
    expect(matcherResult.message()).toBe(
      'expect(received).toBeFailure(expected)\n' + '\n' + 'Error:\n' + '  Expected: [Error: expected error]\n' + '  Received: [Error: actual error]',
    );
  });

  it('pass message uses matcherHint with negation format when isNot', () => {
    const error = new Error('boom');
    const ctxNot = createMockMatcherContext({ isNot: true });
    const result = DetailedResult.failure(error);

    const matcherResult = toBeFailure.call(ctxNot, result, error);

    expect(matcherResult.pass).toBe(true);
    expect(matcherResult.message()).toContain('.not');
  });

  it('includes matcherName in failure output', () => {
    const result = DetailedResult.success('ok');

    const matcherResult = toBeFailure.call(ctx, result, 'ok');

    expect(matcherResult.pass).toBe(false);
    expect(matcherResult.message()).toBe(
      'expect(received).toBeFailure(expected)\n' + '\n' + 'Result discriminator:\n' + '  Expected: success to be false\n' + '  Received: success is true',
    );
  });
});
