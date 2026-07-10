import { assertDetailedError } from './internal/assertDetailedError';
import type { MatcherThis } from './internal/MatcherThis';
import type { ExpectedDetailedError } from './ExpectedDetailedError';

export async function toThrowDetailedErrorAsync(
  this: MatcherThis,
  received: () => Promise<unknown>,
  expectedCode: string,
  expected: ExpectedDetailedError,
): Promise<jest.CustomMatcherResult> {
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
      message: () =>
        `${this.utils.matcherHint('toThrowDetailedErrorAsync', undefined, undefined, { isNot: this.isNot })}\n\n` +
        `Expected async function to throw, but it did not throw.`,
    };
  }

  return assertDetailedError.call(this, caughtError, expectedCode, expected, 'toThrowDetailedErrorAsync');
}
