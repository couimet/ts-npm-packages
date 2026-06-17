import { pkgError } from './internal/errors';
import { isPositiveInteger } from './internal/validation';

export const MAX_COUNTER_START = 1_000_000;
export const COUNTER_START_ENV_VAR = 'DYNAMIC_TESTING_COUNTER_START';

const resolveCounterStart = (): number => {
  const env = process.env[COUNTER_START_ENV_VAR];
  if (env === undefined) {
    return 1;
  }
  const raw = Number(env);
  if (!isPositiveInteger(raw)) {
    throw pkgError(`${COUNTER_START_ENV_VAR}=${env} is not a valid positive integer`);
  }
  if (raw > MAX_COUNTER_START) {
    throw pkgError(`${COUNTER_START_ENV_VAR}=${raw} exceeds cap (${MAX_COUNTER_START})`);
  }
  return raw;
};

export const COUNTER_START = resolveCounterStart();
