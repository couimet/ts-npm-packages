import { toBeFailure } from './toBeFailure';
import { toBeSuccess } from './toBeSuccess';

import { toBeDetailedError } from '@couimet/detailed-error-testing';
import { DetailedResult } from '@couimet/detailed-result';
import type {} from '@jest/expect';

/**
 * Type augmentation for Jest 30+ consumers using `import { expect } from '@jest/globals'`.
 * In Jest 30, `Matchers` is defined in `@jest/expect` (re-exported from `expect`),
 * so augmenting the global `jest` namespace has no effect on the `expect` type.
 */
declare module '@jest/expect' {
  // eslint-disable-next-line
  interface Matchers<R extends void | Promise<void>, T = unknown> {
    toBeSuccess(expected: unknown): R;
    toBeFailure(expected: unknown): R;
    toHaveDetailedError(expectedCode: string, expected: unknown): R;
  }
}

expect.extend({
  toBeSuccess,
  toBeFailure,
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
