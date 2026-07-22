import { normalizeContext } from '../normalizeContext';

import { getUniqueInt, getUniqueString } from '@couimet/dynamic-testing';

describe('normalizeContext', () => {
  it('should apply normalizeError to all values in the record', () => {
    const fn = getUniqueString();
    const message = getUniqueString();
    const userId = getUniqueInt();
    const label = getUniqueString();
    const code = getUniqueString();
    const tags = [getUniqueString()];
    const err = new Error(message);
    (err as any).code = code;
    (err as any).tags = tags;

    const ctx = { fn, err, userId, label };
    const result = normalizeContext(ctx);

    expect(result).toStrictEqual({
      fn,
      err: { name: 'Error', message, stack: err.stack, code, tags },
      userId,
      label,
    });
  });

  it('should handle a context with no Error values', () => {
    const fn = getUniqueString();
    const count = getUniqueInt();

    const ctx = { fn, count, active: true };
    const result = normalizeContext(ctx);

    expect(result).toEqual({ fn, count, active: true });
  });

  it('should handle a context with multiple Error values', () => {
    const fn = getUniqueString();
    const firstMsg = getUniqueString();
    const secondMsg = getUniqueString();
    const safe = getUniqueString();
    const code = getUniqueString();
    const tags = [getUniqueString(), getUniqueString()];
    const first = new TypeError(firstMsg);
    (first as any).code = code;
    const second = new RangeError(secondMsg);
    (second as any).tags = tags;

    const ctx = { fn, first, second, safe };
    const result = normalizeContext(ctx);

    expect(result).toStrictEqual({
      fn,
      first: { name: 'TypeError', message: firstMsg, stack: first.stack, code },
      second: { name: 'RangeError', message: secondMsg, stack: second.stack, tags },
      safe,
    });
  });

  it('should return a new object, not the original', () => {
    const ctx = { fn: getUniqueString() };
    const result = normalizeContext(ctx);

    expect(result).not.toBe(ctx);
  });
});
