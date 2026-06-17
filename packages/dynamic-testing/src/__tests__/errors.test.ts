import { pkgError } from '../internal/errors';

describe('pkgError', () => {
  it('returns an Error with the [dynamic-testing] prefix', () => {
    const err = pkgError('something went wrong');
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('[dynamic-testing] something went wrong');
  });
});
