import type { ExpectedDetailedError } from '../ExpectedDetailedError';

import type { MatcherThis } from './MatcherThis';

import { DetailedError } from '@couimet/detailed-error';

export function assertDetailedError(
  this: MatcherThis,
  received: unknown,
  expectedCode: string,
  expected: ExpectedDetailedError,
  matcherName: string,
): jest.CustomMatcherResult {
  if (!(received instanceof DetailedError)) {
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
          `Expected value to be an instance of DetailedError, but received: ${receivedTypeName}`
        );
      },
    };
  }

  const error = received as DetailedError<string>;
  const failures: string[] = [];

  if (error.code !== expectedCode) {
    failures.push(`Code:\n  Expected: ${this.utils.printExpected(expectedCode)}\n  Received: ${this.utils.printReceived(error.code)}`);
  }

  if (error.message !== expected.message) {
    failures.push(`Message:\n  Expected: ${this.utils.printExpected(expected.message)}\n  Received: ${this.utils.printReceived(error.message)}`);
  }

  if (expected.functionName !== undefined) {
    if (error.functionName !== expected.functionName) {
      failures.push(
        `Function name:\n  Expected: ${this.utils.printExpected(expected.functionName)}\n  Received: ${this.utils.printReceived(error.functionName)}`,
      );
    }
  } else if (error.functionName !== undefined) {
    failures.push(`Function name: expected undefined\n  Received: ${this.utils.printReceived(error.functionName)}`);
  }

  if (expected.details !== undefined) {
    if (!this.equals(error.details, expected.details, undefined, true)) {
      failures.push(
        `Details (toStrictEqual):\n  Expected: ${this.utils.printExpected(expected.details)}\n  Received: ${this.utils.printReceived(error.details)}`,
      );
    }
  } else if (error.details !== undefined) {
    failures.push(`Details: expected undefined\n  Received: ${this.utils.printReceived(error.details)}`);
  }

  if (expected.cause !== undefined) {
    if (error.cause !== expected.cause) {
      const expectedCauseMsg = expected.cause instanceof Error ? expected.cause.message : String(expected.cause);
      const receivedCauseMsg = error.cause instanceof Error ? (error.cause as Error).message : String(error.cause);
      failures.push(`Cause:\n  Expected: ${this.utils.printExpected(expectedCauseMsg)}\n  Received: ${this.utils.printReceived(receivedCauseMsg)}`);
    }
  } else if (error.cause !== undefined) {
    const causeMsg = error.cause instanceof Error ? (error.cause as Error).message : String(error.cause);
    failures.push(`Cause: expected undefined\n  Received: ${this.utils.printReceived(`error with message "${causeMsg}"`)}`);
  }

  const pass = failures.length === 0;

  return {
    pass,
    message: () => {
      const hint = this.utils.matcherHint(matcherName, undefined, undefined, { isNot: this.isNot });

      if (pass) {
        return [
          hint,
          '',
          `Expected: not ${this.utils.printExpected(expectedCode)}`,
          `Received: ${this.utils.printReceived(error.code)}`,
          '',
          `Message:\n  Expected: not ${this.utils.printExpected(expected.message)}`,
          `  Received: ${this.utils.printReceived(error.message)}`,
        ].join('\n');
      }

      return `${hint}\n\n${failures.join('\n\n')}`;
    },
  };
}
