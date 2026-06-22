import { type ExpectedDetailedError } from './ExpectedDetailedError';
import { toBeDetailedError } from './toBeDetailedError';
import { toThrowDetailedError } from './toThrowDetailedError';
import { toThrowDetailedErrorAsync } from './toThrowDetailedErrorAsync';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeDetailedError(expectedCode: string, expected: ExpectedDetailedError): R;
      toThrowDetailedError(expectedCode: string, expected: ExpectedDetailedError): R;
      toThrowDetailedErrorAsync(expectedCode: string, expected: ExpectedDetailedError): Promise<R>;
    }
  }
}

expect.extend({
  toBeDetailedError,
  toThrowDetailedError,
  toThrowDetailedErrorAsync,
});

export {};
