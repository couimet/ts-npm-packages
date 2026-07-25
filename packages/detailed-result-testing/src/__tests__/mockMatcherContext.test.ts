import { createMockMatcherContext } from './mockMatcherContext';

describe('createMockMatcherContext', () => {
  it('returns a default context when overrides is undefined', () => {
    const ctx = createMockMatcherContext();

    expect(ctx.isNot).toBe(false);
    expect(typeof ctx.equals).toBe('function');
    expect(typeof ctx.utils.matcherHint).toBe('function');
  });

  it('accepts a valid overrides object', () => {
    const ctx = createMockMatcherContext({ isNot: true });

    expect(ctx.isNot).toBe(true);
  });

  it('throws TypeError when overrides is null', () => {
    expect(() => createMockMatcherContext(null as never)).toThrow(TypeError('overrides must be an object when provided'));
  });

  it('throws TypeError when overrides is a string', () => {
    expect(() => createMockMatcherContext('invalid' as never)).toThrow(TypeError('overrides must be an object when provided'));
  });

  it('throws TypeError when overrides is a number', () => {
    expect(() => createMockMatcherContext(42 as never)).toThrow(TypeError('overrides must be an object when provided'));
  });
});
