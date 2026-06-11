import { Logger } from './Logger';
import { NoOpLogger } from './NoOpLogger';

/**
 * Global logger management for the core library.
 * By default, uses NoOpLogger (discards all messages).
 * Applications can call setLogger() to provide a real logger implementation.
 */
let logger: Logger = new NoOpLogger();

/**
 * Set the global logger instance.
 * This should be called once at application startup.
 *
 * Automatically confirms the logger is working by emitting a debug message.
 *
 * @param newLogger The logger implementation to use
 */
export function setLogger(newLogger: Logger): void {
  // Probe before assigning so a broken logger doesn't poison global state
  newLogger.debug({ fn: 'setLogger' }, 'Logger initialized');
  logger = newLogger;
}

/**
 * Get the current global logger instance.
 *
 * @returns The current logger (NoOpLogger by default)
 */
export function getLogger(): Logger {
  return logger;
}
