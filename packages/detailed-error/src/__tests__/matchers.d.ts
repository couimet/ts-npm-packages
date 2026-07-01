import type { ExpectedDetailedError } from '@couimet/detailed-error-testing';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeDetailedError(expectedCode: string, expected: ExpectedDetailedError): R;
    }
  }
}
