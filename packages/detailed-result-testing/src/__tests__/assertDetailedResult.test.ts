import { assertDetailedResult } from '../internal/assertDetailedResult';

import { createMockMatcherContext } from './mockMatcherContext';

import { DetailedResult } from '@couimet/detailed-result';

const ctx = createMockMatcherContext();

describe('assertDetailedResult', () => {
  // --- received is not a DetailedResult ---

  it('fails when received is a string', () => {
    const result = assertDetailedResult.call(ctx, 'not a result', true, 'toBeSuccess', 'irrelevant');

    expect(result.pass).toBe(false);
    const msg = result.message();
    expect(msg).toContain('not a result');
    expect(msg).not.toBe('');
  });

  it('fails when received is a number', () => {
    const result = assertDetailedResult.call(ctx, 42, true, 'toBeSuccess', 42);

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('42');
  });

  it('fails when received is a boolean', () => {
    const result = assertDetailedResult.call(ctx, false, true, 'toBeSuccess', 'irrelevant');

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('false');
  });

  it('fails when received is undefined', () => {
    const result = assertDetailedResult.call(ctx, undefined, true, 'toBeSuccess', 'irrelevant');

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('undefined');
  });

  it('fails when received is an object (not DetailedResult)', () => {
    const result = assertDetailedResult.call(ctx, { foo: 'bar' }, true, 'toBeSuccess', { foo: 'bar' });

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Expected value to be an instance of DetailedResult');
  });

  it('fails when received is null', () => {
    const result = assertDetailedResult.call(ctx, null, true, 'toBeSuccess', null);

    expect(result.pass).toBe(false);
    const msg = result.message();
    expect(msg).toContain('Expected value to be an instance of DetailedResult');
    expect(msg).toContain('object');
  });

  it('uses the matcherName parameter in failure output', () => {
    const result = assertDetailedResult.call(ctx, 'not a result', true, 'toBeFailure', 'irrelevant');

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('toBeFailure');
  });

  // --- wrong discriminator ---

  it('fails when success result has expectedSuccess=false', () => {
    const success = DetailedResult.success(42);
    const result = assertDetailedResult.call(ctx, success, false, 'toBeFailure', 42);

    expect(result.pass).toBe(false);
    const msg = result.message();
    expect(msg).toContain('Result discriminator');
    expect(msg).toContain('false');
    expect(msg).toContain('true');
  });

  it('fails when failure result has expectedSuccess=true', () => {
    const failure = DetailedResult.failure(new Error('boom'));
    const result = assertDetailedResult.call(ctx, failure, true, 'toBeSuccess', new Error('boom'));

    expect(result.pass).toBe(false);
    const msg = result.message();
    expect(msg).toContain('Result discriminator');
    expect(msg).toContain('true');
    expect(msg).toContain('false');
  });

  // --- value/error mismatch ---

  it('fails when success result has wrong expected value', () => {
    const success = DetailedResult.success('actual');
    const result = assertDetailedResult.call(ctx, success, true, 'toBeSuccess', 'expected');

    expect(result.pass).toBe(false);
    const msg = result.message();
    expect(msg).toContain('Value:');
    expect(msg).toContain('"expected"');
    expect(msg).toContain('"actual"');
  });

  it('fails when failure result has wrong expected error', () => {
    const error = new Error('actual error');
    const failure = DetailedResult.failure(error);
    const result = assertDetailedResult.call(ctx, failure, false, 'toBeFailure', new Error('expected error'));

    expect(result.pass).toBe(false);
    expect(result.message()).toBe(
      'expect(received).toBeFailure(expected)\n' + '\n' + 'Error:\n' + '  Expected: [Error: expected error]\n' + '  Received: [Error: actual error]',
    );
  });

  // --- nested object diff ---

  it('shows nested diff when success value is a complex object', () => {
    const success = DetailedResult.success({
      name: 'test',
      config: { host: 'localhost', port: 8080, nested: { key: 'value' } },
    });
    const expected = {
      name: 'test',
      config: { host: 'localhost', port: 3000, nested: { key: 'different' } },
    };
    const result = assertDetailedResult.call(ctx, success, true, 'toBeSuccess', expected);

    expect(result.pass).toBe(false);
    expect(result.message()).toBe(
      'expect(received).toBeSuccess(expected)\n' +
        '\n' +
        'Value:\n' +
        '  Expected: {"config": {"host": "localhost", "nested": {"key": "different"}, "port": 3000}, "name": "test"}\n' +
        '  Received: {"config": {"host": "localhost", "nested": {"key": "value"}, "port": 8080}, "name": "test"}',
    );
  });

  // --- value/error match ---

  it('passes when success result matches expected value', () => {
    const success = DetailedResult.success('match');
    const result = assertDetailedResult.call(ctx, success, true, 'toBeSuccess', 'match');

    expect(result.pass).toBe(true);
  });

  it('passes when failure result matches expected error', () => {
    const error = new Error('match');
    const failure = DetailedResult.failure(error);
    const result = assertDetailedResult.call(ctx, failure, false, 'toBeFailure', error);

    expect(result.pass).toBe(true);
  });

  // --- asymmetric matchers ---

  it('passes when success value matches expect.objectContaining', () => {
    const success = DetailedResult.success({ key: 'value', extra: true });
    const result = assertDetailedResult.call(ctx, success, true, 'toBeSuccess', expect.objectContaining({ key: 'value' }));

    expect(result.pass).toBe(true);
  });

  it('passes when success value matches expect.any(Number)', () => {
    const success = DetailedResult.success(42);
    const result = assertDetailedResult.call(ctx, success, true, 'toBeSuccess', expect.any(Number));

    expect(result.pass).toBe(true);
  });

  it('passes when failure error matches expect.any(Error)', () => {
    const failure = DetailedResult.failure(new Error('boom'));
    const result = assertDetailedResult.call(ctx, failure, false, 'toBeFailure', expect.any(Error));

    expect(result.pass).toBe(true);
  });

  it('fails when asymmetric matcher does not match success value', () => {
    const success = DetailedResult.success({ key: 'value' });
    const result = assertDetailedResult.call(ctx, success, true, 'toBeSuccess', expect.objectContaining({ missing: 'prop' }));

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('Value:');
  });

  it('fails when asymmetric matcher does not match failure error', () => {
    const failure = DetailedResult.failure(new Error('boom'));
    const result = assertDetailedResult.call(ctx, failure, false, 'toBeFailure', expect.any(Number));

    expect(result.pass).toBe(false);
    expect(result.message()).toBe('expect(received).toBeFailure(expected)\n' + '\n' + 'Error:\n' + '  Expected: Any<Number>\n' + '  Received: [Error: boom]');
  });

  // --- negation ---

  it('pass message uses matcherHint with .not when negated for success', () => {
    const success = DetailedResult.success(42);
    const ctxNot = createMockMatcherContext({ isNot: true });
    const result = assertDetailedResult.call(ctxNot, success, true, 'toBeSuccess', 42);

    expect(result.pass).toBe(true);
    const msg = result.message();
    expect(msg).toContain('.not');
    expect(msg).toContain('Expected: not');
    expect(msg).toContain('true');
  });

  it('pass message uses matcherHint with .not when negated for failure', () => {
    const error = new Error('boom');
    const failure = DetailedResult.failure(error);
    const ctxNot = createMockMatcherContext({ isNot: true });
    const result = assertDetailedResult.call(ctxNot, failure, false, 'toBeFailure', error);

    expect(result.pass).toBe(true);
    const msg = result.message();
    expect(msg).toContain('.not');
    expect(msg).toContain('Expected: not');
    expect(msg).toContain('false');
  });

  it('negation failure message includes .not when failing discriminator', () => {
    const success = DetailedResult.success(42);
    const ctxNot = createMockMatcherContext({ isNot: true });
    const result = assertDetailedResult.call(ctxNot, success, false, 'toBeFailure', 'irrelevant');

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('.not');
  });

  // --- matcherName in output ---

  it('includes matcherName in discriminator failure message', () => {
    const success = DetailedResult.success(42);
    const result = assertDetailedResult.call(ctx, success, false, 'toBeFailure', 'irrelevant');

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('toBeFailure');
  });

  it('includes matcherName in value mismatch message', () => {
    const success = DetailedResult.success('actual');
    const result = assertDetailedResult.call(ctx, success, true, 'toBeSuccess', 'expected');

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('toBeSuccess');
  });

  it('includes matcherName in error mismatch message', () => {
    const failure = DetailedResult.failure(new Error('actual'));
    const result = assertDetailedResult.call(ctx, failure, false, 'toBeFailure', new Error('expected'));

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('toBeFailure');
  });
});
