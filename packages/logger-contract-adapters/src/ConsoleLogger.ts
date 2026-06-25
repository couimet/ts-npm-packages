import { Logger, LoggingContext } from '@couimet/logger-contract';

const orderedCtx = (ctx: LoggingContext): Record<string, unknown> => {
  const { fn, ...rest } = ctx;
  return { fn, ...rest };
};

const format = (level: string, ctx: LoggingContext, message: string): string => `[${level}] ${JSON.stringify(orderedCtx(ctx))} ${message}`;

export class ConsoleLogger implements Logger {
  debug(ctx: LoggingContext, message: string): void {
    console.debug(format('DEBUG', ctx, message));
  }

  info(ctx: LoggingContext, message: string): void {
    console.info(format('INFO', ctx, message));
  }

  warn(ctx: LoggingContext, message: string): void {
    console.warn(format('WARN', ctx, message));
  }

  error(ctx: LoggingContext, message: string): void {
    console.error(format('ERROR', ctx, message));
  }
}
