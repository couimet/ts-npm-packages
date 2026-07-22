import { normalizeContext } from './normalizeContext';

import { Logger, LoggingContext } from '@couimet/logger-contract';
import type { Logger as Log4jsLogger } from 'log4js';

export class Log4jsAdapter implements Logger {
  private readonly logger: Log4jsLogger;

  constructor(logger: Log4jsLogger) {
    if (!logger) {
      throw new Error('[logger-contract-adapters] Log4jsAdapter requires a log4js Logger instance');
    }
    this.logger = logger;
  }

  debug(ctx: LoggingContext, message: string): void {
    this.logger.debug(message, normalizeContext(ctx));
  }

  info(ctx: LoggingContext, message: string): void {
    this.logger.info(message, normalizeContext(ctx));
  }

  warn(ctx: LoggingContext, message: string): void {
    this.logger.warn(message, normalizeContext(ctx));
  }

  error(ctx: LoggingContext, message: string): void {
    this.logger.error(message, normalizeContext(ctx));
  }
}
