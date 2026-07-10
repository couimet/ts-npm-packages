import { DynamicTestingErrorCodes } from './internal/DynamicTestingErrorCodes';
import { isPositiveInteger } from './internal/validation';

import { DetailedError } from '@couimet/detailed-error';

export const MAX_COUNTER_START = 1_000_000;
export const COUNTER_START_ENV_VAR = 'DYNAMIC_TESTING_COUNTER_START';

const resolveCounterStart = (): number => {
  const env = process.env[COUNTER_START_ENV_VAR];
  if (env === undefined) {
    return 1;
  }
  const raw = Number(env);
  if (!isPositiveInteger(raw)) {
    throw new DetailedError({
      code: DynamicTestingErrorCodes.ENV_VAR_NOT_POSITIVE_INTEGER,
      message: 'Environment variable value is not a valid positive integer',
      functionName: 'resolveCounterStart',
      details: { envVar: COUNTER_START_ENV_VAR, received: env },
    });
  }
  if (raw > MAX_COUNTER_START) {
    throw new DetailedError({
      code: DynamicTestingErrorCodes.ENV_VAR_EXCEEDS_CAP,
      message: 'Environment variable value exceeds cap',
      functionName: 'resolveCounterStart',
      details: { envVar: COUNTER_START_ENV_VAR, received: raw, cap: MAX_COUNTER_START },
    });
  }
  return raw;
};

export const COUNTER_START = resolveCounterStart();
