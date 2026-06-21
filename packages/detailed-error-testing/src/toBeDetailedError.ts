import type { ExpectedDetailedError } from './DetailedErrorMatcher';
import { assertDetailedError } from './DetailedErrorMatcher';

export const toBeDetailedError = (received: unknown, expectedCode: string, expected: ExpectedDetailedError): jest.CustomMatcherResult => {
  return assertDetailedError(received, expectedCode, expected);
};
