import { assertDetailedError } from './internal/assertDetailedError';
import type { ExpectedDetailedError } from './ExpectedDetailedError';

export const toThrowDetailedErrorAsync = async (
  received: () => Promise<unknown>,
  expectedCode: string,
  expected: ExpectedDetailedError,
): Promise<jest.CustomMatcherResult> => {
  let caughtError: unknown;
  let wasThrown = false;

  try {
    await received();
  } catch (error) {
    caughtError = error;
    wasThrown = true;
  }

  if (!wasThrown) {
    return {
      pass: false,
      message: () => `Expected async function to throw DetailedError with code "${expectedCode}", but nothing was thrown`,
    };
  }

  return assertDetailedError(caughtError, expectedCode, expected);
};
