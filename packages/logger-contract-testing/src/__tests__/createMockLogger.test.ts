import { createMockLogger } from '../index';

import { Logger } from '@couimet/logger-contract';
import { jest } from '@jest/globals';

describe('createMockLogger', () => {
  it('returns an object satisfying the Logger interface', () => {
    const logger: Logger = createMockLogger();

    expect(logger.debug).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.error).toBeDefined();
  });

  it('each method is a Jest mock with a .mock property', () => {
    const logger = createMockLogger();

    expect((logger.debug as jest.Mock).mock).toBeDefined();
    expect((logger.info as jest.Mock).mock).toBeDefined();
    expect((logger.warn as jest.Mock).mock).toBeDefined();
    expect((logger.error as jest.Mock).mock).toBeDefined();
  });

  it('all four methods are callable without throwing', () => {
    const logger = createMockLogger();

    expect(() => logger.debug({ fn: 'test' }, 'debug msg')).not.toThrow();
    expect(() => logger.info({ fn: 'test' }, 'info msg')).not.toThrow();
    expect(() => logger.warn({ fn: 'test' }, 'warn msg')).not.toThrow();
    expect(() => logger.error({ fn: 'test' }, 'error msg')).not.toThrow();
  });

  it('tracks calls via Jest mock matchers', () => {
    const logger = createMockLogger();

    logger.info({ fn: 'myFunction', userId: 42 }, 'User logged in');

    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith({ fn: 'myFunction', userId: 42 }, 'User logged in');
  });

  it('tracks calls independently across methods', () => {
    const logger = createMockLogger();

    logger.debug({ fn: 'a' }, 'debug');
    logger.debug({ fn: 'a' }, 'debug');
    logger.info({ fn: 'a' }, 'info');

    expect(logger.debug).toHaveBeenCalledTimes(2);
    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('each call returns an independent mock object', () => {
    const logger1 = createMockLogger();
    const logger2 = createMockLogger();

    logger1.info({ fn: 'first' }, 'hello');

    expect(logger1.info).toHaveBeenCalledTimes(1);
    expect(logger2.info).not.toHaveBeenCalled();
  });

  it('.mock.calls records arguments', () => {
    const logger = createMockLogger();

    logger.warn({ fn: 'check' }, 'warning');

    const calls = (logger.warn as jest.Mock).mock.calls;
    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual([{ fn: 'check' }, 'warning']);
  });
});
