import type { ExpectedDetailedError } from './DetailedErrorMatcher';
import { assertDetailedError } from './DetailedErrorMatcher';

export const toThrowDetailedError = (received: () => void, expectedCode: string, expected: ExpectedDetailedError): jest.CustomMatcherResult => {
  let caughtError: unknown;

  try {
    received();
  } catch (error) {
    caughtError = error;
  }

  if (caughtError === undefined) {
    return {
      pass: false,
      message: () => `Expected function to throw DetailedError with code "${expectedCode}", but nothing was thrown`,
    };
  }

  return assertDetailedError(caughtError, expectedCode, expected);
};
