import { DetailedResult } from '@couimet/detailed-result';

export function runSetupTests(entrypointName: string): void {
  describe(entrypointName, () => {
    it('registers toBeSuccess on expect', () => {
      const result = DetailedResult.success('value');

      expect(result).toBeSuccess('value');
    });

    it('registers toBeFailure on expect', () => {
      const error = new Error('boom');
      const result = DetailedResult.failure(error);

      expect(result).toBeFailure(error);
    });

    it('.not.toBeSuccess() negation works', () => {
      const result = DetailedResult.success('value');

      expect(result).not.toBeSuccess('other');
    });

    it('.not.toBeFailure() negation works', () => {
      const error = new Error('boom');
      const result = DetailedResult.failure(error);

      expect(result).not.toBeFailure(new Error('different'));
    });

    // toHaveDetailedError wrapper branches:
    //   received is DetailedResult + failure with matching code      → pass
    //   received is DetailedResult + failure with non-matching code  → fail
    //   received is DetailedResult + success                         → fail with specific message
    //   received is not DetailedResult (bare DetailedError)          → delegate to toBeDetailedError

    it('toHaveDetailedError passes when received is a DetailedResult failure with matching code and fields', () => {
      const { DetailedError } = jest.requireActual('@couimet/detailed-error');
      const errorResult = DetailedResult.failure(new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn' }));

      expect(errorResult).toHaveDetailedError('ERR', { message: 'msg', functionName: 'fn' });
    });

    it('toHaveDetailedError fails when received is a DetailedResult failure with non-matching code', () => {
      const { DetailedError } = jest.requireActual('@couimet/detailed-error');
      const errorResult = DetailedResult.failure(new DetailedError({ code: 'WRONG', message: 'msg', functionName: 'fn' }));

      expect(() => expect(errorResult).toHaveDetailedError('ERR', { message: 'msg', functionName: 'fn' })).toThrow();
    });

    it('toHaveDetailedError returns pass:false when received is a DetailedResult success', () => {
      const result = DetailedResult.success('value');

      expect(() => expect(result).toHaveDetailedError('ERR', { message: 'msg', functionName: 'fn' })).toThrow(/Expected result to be an error/);
    });

    it('toHaveDetailedError delegates to toBeDetailedError when received is a bare DetailedError', () => {
      const { DetailedError } = jest.requireActual('@couimet/detailed-error');
      const error = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn' });

      expect(error).toHaveDetailedError('ERR', { message: 'msg', functionName: 'fn' });
    });
  });
}
