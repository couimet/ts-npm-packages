import type { Logger } from '@couimet/logger-contract';
import { jest } from '@jest/globals';

export const createMockLogger = (): Logger => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
});
