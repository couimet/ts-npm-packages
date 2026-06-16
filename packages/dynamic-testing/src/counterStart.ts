const MAX_COUNTER_START = 1_000_000;

const resolveCounterStart = (): number => {
  const env = process.env.DYNAMIC_TESTING_COUNTER_START;
  if (env !== undefined) {
    const raw = Number(env);
    if (Number.isInteger(raw) && raw > 0) {
      if (raw > MAX_COUNTER_START) {
        console.warn(`[dynamic-testing] DYNAMIC_TESTING_COUNTER_START=${raw} exceeds cap (${MAX_COUNTER_START}), using cap instead`);
        return MAX_COUNTER_START;
      }
      return raw;
    }
    console.warn(`[dynamic-testing] DYNAMIC_TESTING_COUNTER_START=${env} is not a valid positive integer, defaulting to 1`);
  }
  return 1;
};

export const COUNTER_START = resolveCounterStart();
