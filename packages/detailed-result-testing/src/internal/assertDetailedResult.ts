import type { MatcherThis } from './MatcherThis';

import { DetailedResult } from '@couimet/detailed-result';

export function assertDetailedResult(
  this: MatcherThis,
  received: unknown,
  expectedSuccess: boolean,
  matcherName: string,
  expected: unknown,
): jest.CustomMatcherResult {
  if (!(received instanceof DetailedResult)) {
    return {
      pass: false,
      message: () => {
        const receivedTypeName = received?.constructor?.name ?? typeof received;
        const typeofStr = typeof received;
        if (typeofStr === 'string' || typeofStr === 'number' || typeofStr === 'boolean' || typeofStr === 'undefined') {
          return (
            `${this.utils.matcherHint(matcherName, undefined, undefined, { isNot: this.isNot })}\n\n` +
            `${this.utils.printWithType('Received', received, this.utils.printReceived)}`
          );
        }
        return (
          `${this.utils.matcherHint(matcherName, undefined, undefined, { isNot: this.isNot })}\n\n` +
          `Expected value to be an instance of DetailedResult, but received: ${receivedTypeName}`
        );
      },
    };
  }

  const result = received as DetailedResult<unknown, unknown>;
  const failures: string[] = [];

  if (result.success !== expectedSuccess) {
    failures.push(
      `Result discriminator:\n` +
        `  Expected: success to be ${this.utils.printExpected(expectedSuccess)}\n` +
        `  Received: success is ${this.utils.printReceived(result.success)}`,
    );
  } else if (expectedSuccess) {
    if (!this.equals(expected, result.value)) {
      failures.push(`Value:\n  Expected: ${this.utils.printExpected(expected)}\n  Received: ${this.utils.printReceived(result.value)}`);
    }
  } else {
    if (!this.equals(expected, result.error)) {
      failures.push(`Error:\n  Expected: ${this.utils.printExpected(expected)}\n  Received: ${this.utils.printReceived(result.error)}`);
    }
  }

  const pass = failures.length === 0;

  return {
    pass,
    message: () => {
      const hint = this.utils.matcherHint(matcherName, undefined, undefined, { isNot: this.isNot });

      if (pass) {
        const discriminatorStr = expectedSuccess ? 'true' : 'false';
        return [
          hint,
          '',
          `Expected: not success to be ${this.utils.printExpected(discriminatorStr)}`,
          `Received: success is ${this.utils.printReceived(result.success)}`,
        ].join('\n');
      }

      return `${hint}\n\n${failures.join('\n\n')}`;
    },
  };
}
