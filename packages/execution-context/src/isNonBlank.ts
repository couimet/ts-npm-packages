import { ExecutionContextErrorCodes } from './executionContextErrorCodes';

import { DetailedError } from '@couimet/detailed-error';

export const isNonBlank = (value: string | undefined): value is string => {
  if (value === undefined) {
    return false;
  }

  if (typeof value !== 'string') {
    throw new DetailedError({
      code: ExecutionContextErrorCodes.INVALID_STRING_TYPE,
      message: 'expected a primitive string or undefined',
      functionName: 'isNonBlank',
      details: {},
    });
  }

  return value.trim() !== '';
};
