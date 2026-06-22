import { assertDetailedError } from './internal/assertDetailedError';
import type { ExpectedDetailedError } from './ExpectedDetailedError';

export const toThrowDetailedError = (received: () => void, expectedCode: string, expected: ExpectedDetailedError): jest.CustomMatcherResult => {
  let caughtError: unknown;
  let wasThrown = false;

  try {
    received();
  } catch (error) {
    caughtError = error;
    wasThrown = true;
  }

  if (!wasThrown) {
    return {
      pass: false,
      message: () => `Expected function to throw DetailedError with code "${expectedCode}", but nothing was thrown`,
    };
  }

  return assertDetailedError(caughtError, expectedCode, expected);
};
