import type { MatcherThis } from './internal/MatcherThis';

import { DetailedResult } from '@couimet/detailed-result';

export function toBeFailureWith<E = unknown>(this: MatcherThis, received: unknown, assertError: (error: E) => void): jest.CustomMatcherResult {
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

    if (this.isNot) {
      const hint = this.utils.matcherHint('toBeFailureWith', undefined, undefined, { isNot: true });
      return {
        pass: true,
        message: () => `${hint}\n\nResult is an error and the error callback did not throw, but .not was used so this is treated as a failure.`,
      };
    }

    return { pass: true, message: () => 'Result is an error and error assertions passed' };
  } catch (error) {
    return {
      pass: false,
      message: () => (error instanceof Error ? error.message : String(error)),
    };
  }
}
