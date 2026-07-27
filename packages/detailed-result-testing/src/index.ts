import type { DetailedResult } from '@couimet/detailed-result';
import type {} from '@jest/expect';

/**
 * Type augmentation for Jest 30+ consumers who import `toBeSuccess` (or anything else)
 * from this package. In Jest 30, `Matchers` is defined in `@jest/expect`, so augmenting the
 * global `jest` namespace has no effect on the `expect` type imported from `@jest/globals`.
 *
 * This block lets `expect(result).toBeSuccess(...)` typecheck without a separate setup import.
 * Consumers who don't import anything from the package should use the setup entry point instead
 * (`import '@couimet/detailed-result-testing/setup'`).
 */
declare module '@jest/expect' {
  interface Matchers<R extends void | Promise<void>, T = unknown> {
    toBeSuccess(expected: unknown): R;
    toBeFailure(expected: unknown): R;
    toBeSuccessWith(assertValue: (value: T extends DetailedResult<infer V, any> ? V : unknown) => void): R;
    toBeFailureWith(assertError: (error: T extends DetailedResult<any, infer E> ? E : unknown) => void): R;
    toHaveDetailedError(expectedCode: string, expected: unknown): R;
  }
}

export * from './toBeFailure';
export * from './toBeFailureWith';
export * from './toBeSuccess';
export * from './toBeSuccessWith';
