import type { MatcherThis } from './internal/MatcherThis';

import { DetailedResult } from '@couimet/detailed-result';

export function toBeSuccessWith<T = unknown>(this: MatcherThis, received: unknown, assertValue: (value: T) => void): jest.CustomMatcherResult {
  if (!(received instanceof DetailedResult)) {
    return {
      pass: false,
      message: () => `Expected value to be a DetailedResult, but received: ${received?.constructor?.name ?? typeof received}`,
    };
  }

  if (!received.success) {
    return {
      pass: false,
      message: () => `Result was expected to be successful, but it is an error.\n\nError:\n  ${this.utils.printReceived(received.error)}`,
    };
  }

  try {
    assertValue(received.value);

    if (this.isNot) {
      const hint = this.utils.matcherHint('toBeSuccessWith', undefined, undefined, { isNot: true });
      return {
        pass: true,
        message: () => `${hint}\n\nResult is successful and the value callback did not throw, but .not was used so this is treated as a failure.`,
      };
    }

    return { pass: true, message: () => 'Result is successful and value assertions passed' };
  } catch (error) {
    return {
      pass: false,
      message: () => (error instanceof Error ? error.message : String(error)),
    };
  }
}
