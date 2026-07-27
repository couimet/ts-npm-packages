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
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- must match @types/jest Matchers<R, T = {}>
    interface Matchers<R, T = {}> {
      toBeSuccess(expected: unknown): R;
      toBeFailure(expected: unknown): R;
      toBeSuccessWith(assertValue: (value: T extends DetailedResult<infer V, unknown> ? V : unknown) => void): R;
      toBeFailureWith(assertError: (error: T extends DetailedResult<unknown, infer E> ? E : unknown) => void): R;
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
