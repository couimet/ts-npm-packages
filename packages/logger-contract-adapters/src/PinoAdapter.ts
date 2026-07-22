import { normalizeContext } from './normalizeContext';

import { Logger, LoggingContext } from '@couimet/logger-contract';
import type { Logger as PinoLogger } from 'pino';

export class PinoAdapter implements Logger {
  private readonly logger: PinoLogger;

  constructor(logger: PinoLogger) {
    if (!logger) {
      throw new Error('[logger-contract-adapters] PinoAdapter requires a pino Logger instance');
    }
    this.logger = logger;
  }

  debug(ctx: LoggingContext, message: string): void {
    this.logger.debug(normalizeContext(ctx), message);
  }

  info(ctx: LoggingContext, message: string): void {
    this.logger.info(normalizeContext(ctx), message);
  }

  warn(ctx: LoggingContext, message: string): void {
    this.logger.warn(normalizeContext(ctx), message);
  }

  error(ctx: LoggingContext, message: string): void {
    this.logger.error(normalizeContext(ctx), message);
  }
}
