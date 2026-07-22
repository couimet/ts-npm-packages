import { normalizeError } from './normalizeError';

import { LoggingContext } from '@couimet/logger-contract';

export const normalizeContext = (ctx: LoggingContext): LoggingContext => {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(ctx)) {
    normalized[key] = normalizeError(value);
  }
  return normalized as LoggingContext;
};
