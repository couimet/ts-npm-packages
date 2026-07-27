import type { MatcherThis } from './internal/MatcherThis';

import { DetailedResult } from '@couimet/detailed-result';

export function toBeFailureWith(this: MatcherThis, received: unknown, assertError: (error: unknown) => void): jest.CustomMatcherResult {
  if (!(received instanceof DetailedResult)) {
    return {
      pass: false,
      message: () => `Expected value to be a DetailedResult, but received: ${received?.constructor?.name ?? typeof received}`,
    };
  }

  if (received.success) {
    return {
      pass: false,
      message: () => `Result was expected to be an error, but it is successful.\n\nValue:\n  ${this.utils.printReceived(received.value)}`,
    };
  }

  try {
    assertError(received.error);
    return { pass: true, message: () => 'Result is an error and error assertions passed' };
  } catch (error) {
    return {
      pass: false,
      message: () => (error instanceof Error ? error.message : String(error)),
    };
  }
}
