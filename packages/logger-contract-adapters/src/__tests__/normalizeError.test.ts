import { normalizeError } from '../index';

import { getUniqueInt, getUniqueString } from '@couimet/dynamic-testing';

describe('normalizeError', () => {
  it('should extract name, message, and stack from a plain Error', () => {
    const message = getUniqueString();
    const error = new Error(message);

    expect(normalizeError(error)).toStrictEqual({ name: 'Error', message, stack: error.stack });
  });

  it('should extract custom enumerable properties from an Error', () => {
    const message = getUniqueString();
    const code = getUniqueString();
    const statusCode = getUniqueInt();
    const tags = [getUniqueString(), getUniqueString()];
    const meta = { [getUniqueString()]: getUniqueString(), [getUniqueString()]: getUniqueInt() };

    const error = new Error(message);
    Object.assign(error, { code, statusCode, tags, meta });

    expect(normalizeError(error)).toStrictEqual({ name: 'Error', message, stack: error.stack, code, statusCode, tags, meta });
  });

  it('should pass non-Error values through unchanged', () => {
    const str = getUniqueString();
    const num = getUniqueInt();
    const obj = { [getUniqueString()]: getUniqueString() };

    expect(normalizeError(str)).toBe(str);
    expect(normalizeError(num)).toBe(num);
    expect(normalizeError(null)).toBeNull();
    expect(normalizeError(undefined)).toBeUndefined();
    expect(normalizeError(true)).toBe(true);
    const sym = Symbol('sym');
    expect(normalizeError(sym)).toBe(sym);
    expect(normalizeError(obj)).toBe(obj);
  });

  it('should handle Error subclass instances (TypeError, RangeError, etc.)', () => {
    const typeMsg = getUniqueString();
    const rangeMsg = getUniqueString();

    const typeErr = new TypeError(typeMsg);
    const rangeErr = new RangeError(rangeMsg);

    expect(normalizeError(typeErr)).toStrictEqual({ name: 'TypeError', message: typeMsg, stack: typeErr.stack });
    expect(normalizeError(rangeErr)).toStrictEqual({ name: 'RangeError', message: rangeMsg, stack: rangeErr.stack });
  });

  it('should not overwrite top-level Error keys with custom enumerable properties with the same name', () => {
    const message = getUniqueString();
    const customName = getUniqueString();
    const code = getUniqueString();

    const error = new Error(message);
    // Object.assign creates own enumerable properties on the error.
    // 'name' becomes an own property shadowing Error.prototype.name.
    // 'code' is a genuine custom property.
    Object.assign(error, { name: customName, code });

    // The built-in keys are read directly, so own property 'name' wins;
    // custom property 'code' is added because it's not one of the built-in keys;
    // built-in 'message' is unaffected (no own property shadowing it).
    expect(normalizeError(error)).toStrictEqual({ name: customName, message, stack: error.stack, code });
  });

  it('should return a plain object (not an Error instance)', () => {
    const message = getUniqueString();
    const error = new Error(message);
    const result = normalizeError(error);

    expect(result).not.toBeInstanceOf(Error);
    expect(result).toStrictEqual({ name: 'Error', message, stack: error.stack });
  });
});
