import { assertDetailedError } from './internal/assertDetailedError';
import type { MatcherThis } from './internal/MatcherThis';
import type { ExpectedDetailedError } from './ExpectedDetailedError';

export function toBeDetailedError(this: MatcherThis, received: unknown, expectedCode: string, expected: ExpectedDetailedError): jest.CustomMatcherResult {
  return assertDetailedError.call(this, received, expectedCode, expected);
}
