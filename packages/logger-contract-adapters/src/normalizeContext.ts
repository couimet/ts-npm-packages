import { normalizeError } from './normalizeError';

import { LoggingContext } from '@couimet/logger-contract';

export const normalizeContext = (ctx: LoggingContext): LoggingContext => {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(ctx)) {
    Object.defineProperty(normalized, key, {
      value: normalizeError(value),
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }
  return normalized as LoggingContext;
};
