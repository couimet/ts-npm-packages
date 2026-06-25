import { type ExpectedDetailedError } from './ExpectedDetailedError';
import { toBeDetailedError } from './toBeDetailedError';
import { toThrowDetailedError } from './toThrowDetailedError';
import { toThrowDetailedErrorAsync } from './toThrowDetailedErrorAsync';

import type {} from '@jest/expect';

/**
 * Type augmentation for Jest 30+ consumers using `import { expect } from '@jest/globals'`.
 * In Jest 30, `Matchers` is defined in `@jest/expect` (re-exported from `expect`),
 * so augmenting the global `jest` namespace has no effect on the `expect` type.
 */
declare module '@jest/expect' {
  // eslint-disable-next-line
  interface Matchers<R extends void | Promise<void>, T = unknown> {
    toBeDetailedError(expectedCode: string, expected: ExpectedDetailedError): R;
    toThrowDetailedError(expectedCode: string, expected: ExpectedDetailedError): R;
    toThrowDetailedErrorAsync(expectedCode: string, expected: ExpectedDetailedError): Promise<R>;
  }
}

expect.extend({
  toBeDetailedError,
  toThrowDetailedError,
  toThrowDetailedErrorAsync,
});

export {};
