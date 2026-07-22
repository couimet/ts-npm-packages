import { WinstonAdapter } from '../WinstonAdapter';

import { getUniqueString } from '@couimet/dynamic-testing';
import type { Logger as WinstonLogger } from 'winston';

const mockWinston = (): WinstonLogger =>
  ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }) as unknown as WinstonLogger;

describe('WinstonAdapter', () => {
  it('should throw if constructed without a logger', () => {
    expect(() => new WinstonAdapter(null as unknown as WinstonLogger)).toThrow('[logger-contract-adapters]');
  });

  it('should delegate debug to winston logger', () => {
    const winston = mockWinston();
    const adapter = new WinstonAdapter(winston);
    adapter.debug({ fn: 'test' }, 'hello');
    expect(winston.debug).toHaveBeenCalledWith('hello', { fn: 'test' });
  });

  it('should delegate info to winston logger', () => {
    const winston = mockWinston();
    const adapter = new WinstonAdapter(winston);
    adapter.info({ fn: 'test', userId: 42 }, 'user action');
    expect(winston.info).toHaveBeenCalledWith('user action', { fn: 'test', userId: 42 });
  });

  it('should delegate warn to winston logger', () => {
    const winston = mockWinston();
    const adapter = new WinstonAdapter(winston);
    adapter.warn({ fn: 'test' }, 'warning');
    expect(winston.warn).toHaveBeenCalledWith('warning', { fn: 'test' });
  });

  it('should delegate error to winston logger', () => {
    const winston = mockWinston();
    const adapter = new WinstonAdapter(winston);
    adapter.error({ fn: 'test' }, 'failure');
    expect(winston.error).toHaveBeenCalledWith('failure', { fn: 'test' });
  });

  it('should normalize Error values in debug context', () => {
    const winston = mockWinston();
    const adapter = new WinstonAdapter(winston);
    const fn = getUniqueString();
    const message = getUniqueString();
    const logMsg = getUniqueString();
    const code = getUniqueString();
    const error = new TypeError(message);
    Object.assign(error, { code });
    adapter.debug({ fn, error }, logMsg);
    expect(winston.debug).toHaveBeenCalledWith(logMsg, { fn, error: { name: 'TypeError', message, stack: error.stack, code } });
  });

  it('should normalize Error values in info context', () => {
    const winston = mockWinston();
    const adapter = new WinstonAdapter(winston);
    const fn = getUniqueString();
    const message = getUniqueString();
    const logMsg = getUniqueString();
    const tags = [getUniqueString(), getUniqueString()];
    const error = new RangeError(message);
    Object.assign(error, { tags });
    adapter.info({ fn, error }, logMsg);
    expect(winston.info).toHaveBeenCalledWith(logMsg, { fn, error: { name: 'RangeError', message, stack: error.stack, tags } });
  });

  it('should normalize Error values in warn context', () => {
    const winston = mockWinston();
    const adapter = new WinstonAdapter(winston);
    const fn = getUniqueString();
    const message = getUniqueString();
    const logMsg = getUniqueString();
    const meta = { [getUniqueString()]: getUniqueString() };
    const error = new SyntaxError(message);
    Object.assign(error, { meta });
    adapter.warn({ fn, error }, logMsg);
    expect(winston.warn).toHaveBeenCalledWith(logMsg, { fn, error: { name: 'SyntaxError', message, stack: error.stack, meta } });
  });

  it('should normalize Error values in error context', () => {
    const winston = mockWinston();
    const adapter = new WinstonAdapter(winston);
    const fn = getUniqueString();
    const message = getUniqueString();
    const logMsg = getUniqueString();
    const code = getUniqueString();
    const statusCode = getUniqueString();
    const error = new URIError(message);
    Object.assign(error, { code, statusCode });
    adapter.error({ fn, error }, logMsg);
    expect(winston.error).toHaveBeenCalledWith(logMsg, { fn, error: { name: 'URIError', message, stack: error.stack, code, statusCode } });
  });
});
