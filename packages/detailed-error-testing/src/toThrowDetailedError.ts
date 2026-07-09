import { assertDetailedError } from './internal/assertDetailedError';
import type { MatcherThis } from './internal/MatcherThis';
import type { ExpectedDetailedError } from './ExpectedDetailedError';

export function toThrowDetailedError(this: MatcherThis, received: () => void, expectedCode: string, expected: ExpectedDetailedError): jest.CustomMatcherResult {
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
      message: () =>
        `${this.utils.matcherHint('toThrowDetailedError', undefined, undefined, { isNot: this.isNot })}\n\n` +
        `Expected function to throw, but it did not throw.`,
    };
  }

  return assertDetailedError.call(this, caughtError, expectedCode, expected);
}
