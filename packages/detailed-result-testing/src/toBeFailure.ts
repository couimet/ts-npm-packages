import { assertDetailedResult } from './internal/assertDetailedResult';
import type { MatcherThis } from './internal/MatcherThis';

export function toBeFailure(this: MatcherThis, received: unknown, expected: unknown): jest.CustomMatcherResult {
  return assertDetailedResult.call(this, received, false, 'toBeFailure', expected);
}
