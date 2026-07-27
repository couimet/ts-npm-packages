import type { MatcherThis } from './internal/MatcherThis';

import { DetailedResult } from '@couimet/detailed-result';

export function toBeSuccessWith(this: MatcherThis, received: unknown, assertValue: (value: unknown) => void): jest.CustomMatcherResult {
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
    return { pass: true, message: () => 'Result is successful and value assertions passed' };
  } catch (error) {
    return {
      pass: false,
      message: () => (error instanceof Error ? error.message : String(error)),
    };
  }
}
