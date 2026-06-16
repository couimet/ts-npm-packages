import type { Logger } from '@couimet/logger-contract';

/**
 * Creates a mock Logger for testing.
 * All methods are jest.fn() stubs that can be asserted on.
 *
 * @returns A Logger whose methods are all jest.fn()
 */
export const createMockLogger = (): Logger => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
});
