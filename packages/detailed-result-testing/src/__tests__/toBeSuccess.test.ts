import { toBeSuccess } from '../index';

import { createMockMatcherContext } from './mockMatcherContext';

import { DetailedResult } from '@couimet/detailed-result';

const ctx = createMockMatcherContext();

describe('toBeSuccess', () => {
  it('passes when result is a success with matching expected value', () => {
    const result = DetailedResult.success('hello');

    const matcherResult = toBeSuccess.call(ctx, result, 'hello');

    expect(matcherResult.pass).toBe(true);
  });

  it('passes when success value matches expect.objectContaining', () => {
    const result = DetailedResult.success({ id: 1, name: 'Alice', extra: true });

    const matcherResult = toBeSuccess.call(ctx, result, expect.objectContaining({ name: 'Alice' }));

    expect(matcherResult.pass).toBe(true);
  });

  it('fails when result is a failure', () => {
    const result = DetailedResult.failure(new Error('boom'));

    const matcherResult = toBeSuccess.call(ctx, result, new Error('boom'));

    expect(matcherResult.pass).toBe(false);
    expect(matcherResult.message()).toBe(
      'expect(received).toBeSuccess(expected)\n' + '\n' + 'Result discriminator:\n' + '  Expected: success to be true\n' + '  Received: success is false',
    );
  });

  it('fails when received is not a DetailedResult', () => {
    const matcherResult = toBeSuccess.call(ctx, 'not a result', 'irrelevant');

    expect(matcherResult.pass).toBe(false);
  });

  it('fails when success value does not match expected', () => {
    const result = DetailedResult.success('actual');

    const matcherResult = toBeSuccess.call(ctx, result, 'expected');

    expect(matcherResult.pass).toBe(false);
    expect(matcherResult.message()).toBe('expect(received).toBeSuccess(expected)\n' + '\n' + 'Value:\n' + '  Expected: "expected"\n' + '  Received: "actual"');
  });

  it('pass message uses matcherHint with negation format when isNot', () => {
    const ctxNot = createMockMatcherContext({ isNot: true });
    const result = DetailedResult.success(42);

    const matcherResult = toBeSuccess.call(ctxNot, result, 42);

    expect(matcherResult.pass).toBe(true);
    expect(matcherResult.message()).toContain('.not');
  });

  it('includes matcherName in failure output', () => {
    const result = DetailedResult.failure(new Error('boom'));

    const matcherResult = toBeSuccess.call(ctx, result, new Error('boom'));

    expect(matcherResult.pass).toBe(false);
    expect(matcherResult.message()).toBe(
      'expect(received).toBeSuccess(expected)\n' + '\n' + 'Result discriminator:\n' + '  Expected: success to be true\n' + '  Received: success is false',
    );
  });
});
