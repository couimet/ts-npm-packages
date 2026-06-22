import { assertDetailedError } from './internal/assertDetailedError';
import type { ExpectedDetailedError } from './ExpectedDetailedError';

export const toBeDetailedError = (received: unknown, expectedCode: string, expected: ExpectedDetailedError): jest.CustomMatcherResult => {
  return assertDetailedError(received, expectedCode, expected);
};
