import { Logger, LoggingContext } from '@couimet/logger-contract';
import type { Logger as WinstonLogger } from 'winston';

export class WinstonAdapter implements Logger {
  private readonly logger: WinstonLogger;

  constructor(logger: WinstonLogger) {
    if (!logger) {
      throw new Error('[logger-contract-adapters] WinstonAdapter requires a winston Logger instance');
    }
    this.logger = logger;
  }

  debug(ctx: LoggingContext, message: string): void {
    this.logger.debug(message, ctx);
  }

  info(ctx: LoggingContext, message: string): void {
    this.logger.info(message, ctx);
  }

  warn(ctx: LoggingContext, message: string): void {
    this.logger.warn(message, ctx);
  }

  error(ctx: LoggingContext, message: string): void {
    this.logger.error(message, ctx);
  }
}
