import { normalizeError } from './normalizeError';

import { LoggingContext } from '@couimet/logger-contract';

/** Returns a new context whose values have each been passed through `normalizeError`; the input context is left unchanged. */
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
