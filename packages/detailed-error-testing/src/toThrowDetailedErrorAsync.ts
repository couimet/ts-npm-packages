import type { ExpectedDetailedError } from './DetailedErrorMatcher';
import { assertDetailedError } from './DetailedErrorMatcher';

export const toThrowDetailedErrorAsync = async (
  received: () => Promise<void>,
  expectedCode: string,
  expected: ExpectedDetailedError,
): Promise<jest.CustomMatcherResult> => {
  let caughtError: unknown;

  try {
    await received();
  } catch (error) {
    caughtError = error;
  }

  if (caughtError === undefined) {
    return {
      pass: false,
      message: () => `Expected async function to throw DetailedError with code "${expectedCode}", but nothing was thrown`,
    };
  }

  return assertDetailedError(caughtError, expectedCode, expected);
};
