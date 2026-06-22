import type { ExpectedDetailedError } from '../ExpectedDetailedError';

import { DetailedError } from '@couimet/detailed-error';
import { inspect } from 'node:util';

export const assertDetailedError = (received: unknown, expectedCode: string, expected: ExpectedDetailedError): jest.CustomMatcherResult => {
  const failures: string[] = [];

  if (!(received instanceof DetailedError)) {
    return {
      pass: false,
      message: () => {
        const receivedTypeName = received?.constructor?.name ?? typeof received;
        const typeofStr = typeof received;
        if (typeofStr === 'string' || typeofStr === 'number' || typeofStr === 'boolean' || typeofStr === 'undefined') {
          return `Expected value to be an instance of DetailedError, but received ${typeofStr}: ${JSON.stringify(received)}`;
        }
        return `Expected value to be an instance of DetailedError, but received: ${receivedTypeName}`;
      },
    };
  }

  const error = received as DetailedError<string>;

  if (error.code !== expectedCode) {
    failures.push(`  Code: expected "${expectedCode}", received "${error.code}"`);
  }

  if (error.message !== expected.message) {
    failures.push(`  Message:\n    expected: "${expected.message}"\n    received: "${error.message}"`);
  }

  if (expected.functionName !== undefined) {
    if (error.functionName !== expected.functionName) {
      failures.push(`  Function name: expected "${expected.functionName}", received "${error.functionName || 'undefined'}"`);
    }
  } else if (error.functionName !== undefined) {
    failures.push(`  Function name: expected undefined, received "${error.functionName}"`);
  }

  if (expected.details !== undefined) {
    try {
      expect(error.details).toEqual(expected.details);
    } catch {
      failures.push(
        `  Details (toStrictEqual):\n    expected: ${inspect(expected.details, { depth: null })}\n    received: ${inspect(error.details, { depth: null })}`,
      );
    }
  } else if (error.details !== undefined) {
    failures.push(`  Details: expected undefined, received ${inspect(error.details, { depth: null })}`);
  }

  if (expected.cause !== undefined) {
    if (error.cause !== expected.cause) {
      const expectedCauseMsg = expected.cause instanceof Error ? expected.cause.message : 'undefined';
      const receivedCauseMsg = error.cause instanceof Error ? (error.cause as Error).message : 'undefined';
      failures.push(`  Cause: expected ${expectedCauseMsg}, received ${receivedCauseMsg}`);
    }
  } else if (error.cause !== undefined) {
    const causeMsg = error.cause instanceof Error ? (error.cause as Error).message : String(error.cause);
    failures.push(`  Cause: expected undefined, received error with message "${causeMsg}"`);
  }

  const pass = failures.length === 0;

  return {
    pass,
    message: () =>
      pass ? `Expected error NOT to match DetailedError("${expectedCode}")` : `Expected DetailedError("${expectedCode}") to match:\n${failures.join('\n')}`,
  };
};
