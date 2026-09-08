import { firstHeaderValue } from '../index';

describe('firstHeaderValue', () => {
  it('returns the value when it is a single string', () => {
    expect(firstHeaderValue('abc-123')).toBe('abc-123');
  });

  it('returns the first value when the header repeats', () => {
    expect(firstHeaderValue(['abc-123', 'def-456'])).toBe('abc-123');
  });

  it('returns undefined when the header is absent', () => {
    expect(firstHeaderValue(undefined)).toBeUndefined();
  });

  it('returns undefined when the array is empty', () => {
    expect(firstHeaderValue([])).toBeUndefined();
  });
});
