import { toBeFailure } from './toBeFailure';
import { toBeFailureWith } from './toBeFailureWith';
import { toBeSuccess } from './toBeSuccess';
import { toBeSuccessWith } from './toBeSuccessWith';

import { toBeDetailedError } from '@couimet/detailed-error-testing';
import { DetailedResult } from '@couimet/detailed-result';

/**
 * Type augmentation for Jest <30 and `@types/jest` consumers.
 * In these environments, `Matchers` exists in the global `jest` namespace.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeSuccess(expected: unknown): R;
      toBeFailure(expected: unknown): R;
      toBeSuccessWith(assertValue: (value: unknown) => void): R;
      toBeFailureWith(assertError: (error: unknown) => void): R;
      toHaveDetailedError(expectedCode: string, expected: unknown): R;
    }
  }
}

expect.extend({
  toBeSuccess,
  toBeFailure,
  toBeSuccessWith,
  toBeFailureWith,
  toHaveDetailedError: function (this: jest.MatcherContext, received: unknown, expectedCode: string, expected: unknown) {
    if (received instanceof DetailedResult) {
      if (received.success === false) {
        return toBeDetailedError.call(this, received.error, expectedCode, expected as never);
      }
      return {
        pass: false,
        message: () => {
          const hint = this.utils.matcherHint('toHaveDetailedError', undefined, undefined, { isNot: this.isNot });
          return `${hint}\n\nExpected result to be an error, but it succeeded`;
        },
      };
    }
    return toBeDetailedError.call(this, received, expectedCode, expected as never);
  },
});

export {};
