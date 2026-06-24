import type { ExpectedDetailedError } from './ExpectedDetailedError';

import type {} from '@jest/expect';

/**
 * Type augmentation for Jest 30+ consumers who import `ExpectedDetailedError` (or anything else)
 * from this package. In Jest 30, `Matchers` is defined in `@jest/expect`, so augmenting the
 * global `jest` namespace has no effect on the `expect` type imported from `@jest/globals`.
 *
 * This block lets `expect(fn).toThrowDetailedError(...)` typecheck without a separate setup import.
 * Consumers who don't import anything from the package should use the setup entry point instead
 * (`import '@couimet/detailed-error-testing/setup'`).
 */
declare module '@jest/expect' {
  // eslint-disable-next-line
  interface Matchers<R extends void | Promise<void>, T = unknown> {
    toBeDetailedError(expectedCode: string, expected: ExpectedDetailedError): R;
    toThrowDetailedError(expectedCode: string, expected: ExpectedDetailedError): R;
    toThrowDetailedErrorAsync(expectedCode: string, expected: ExpectedDetailedError): Promise<R>;
  }
}

export * from './ExpectedDetailedError';
export * from './toBeDetailedError';
export * from './toThrowDetailedError';
export * from './toThrowDetailedErrorAsync';
