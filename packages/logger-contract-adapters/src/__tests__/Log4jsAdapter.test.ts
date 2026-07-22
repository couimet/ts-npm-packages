import { Log4jsAdapter } from '../Log4jsAdapter';

import { getUniqueString } from '@couimet/dynamic-testing';
import type { Logger as Log4jsLogger } from 'log4js';

const mockLog4js = (): Log4jsLogger =>
  ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }) as unknown as Log4jsLogger;

describe('Log4jsAdapter', () => {
  it('should throw if constructed without a logger', () => {
    expect(() => new Log4jsAdapter(null as unknown as Log4jsLogger)).toThrow('[logger-contract-adapters]');
  });

  it('should delegate debug to log4js logger', () => {
    const log4js = mockLog4js();
    const adapter = new Log4jsAdapter(log4js);
    adapter.debug({ fn: 'test' }, 'hello');
    expect(log4js.debug).toHaveBeenCalledWith('hello', { fn: 'test' });
  });

  it('should delegate info to log4js logger', () => {
    const log4js = mockLog4js();
    const adapter = new Log4jsAdapter(log4js);
    adapter.info({ fn: 'test', userId: 42 }, 'user action');
    expect(log4js.info).toHaveBeenCalledWith('user action', { fn: 'test', userId: 42 });
  });

  it('should delegate warn to log4js logger', () => {
    const log4js = mockLog4js();
    const adapter = new Log4jsAdapter(log4js);
    adapter.warn({ fn: 'test' }, 'warning');
    expect(log4js.warn).toHaveBeenCalledWith('warning', { fn: 'test' });
  });

  it('should delegate error to log4js logger', () => {
    const log4js = mockLog4js();
    const adapter = new Log4jsAdapter(log4js);
    adapter.error({ fn: 'test' }, 'failure');
    expect(log4js.error).toHaveBeenCalledWith('failure', { fn: 'test' });
  });

  it('should normalize Error values in debug context', () => {
    const log4js = mockLog4js();
    const adapter = new Log4jsAdapter(log4js);
    const fn = getUniqueString();
    const message = getUniqueString();
    const logMsg = getUniqueString();
    const code = getUniqueString();
    const error = new TypeError(message);
    Object.assign(error, { code });
    adapter.debug({ fn, error }, logMsg);
    expect(log4js.debug).toHaveBeenCalledWith(logMsg, { fn, error: { name: 'TypeError', message, stack: error.stack, code } });
  });

  it('should normalize Error values in info context', () => {
    const log4js = mockLog4js();
    const adapter = new Log4jsAdapter(log4js);
    const fn = getUniqueString();
    const message = getUniqueString();
    const logMsg = getUniqueString();
    const tags = [getUniqueString(), getUniqueString()];
    const error = new RangeError(message);
    Object.assign(error, { tags });
    adapter.info({ fn, error }, logMsg);
    expect(log4js.info).toHaveBeenCalledWith(logMsg, { fn, error: { name: 'RangeError', message, stack: error.stack, tags } });
  });

  it('should normalize Error values in warn context', () => {
    const log4js = mockLog4js();
    const adapter = new Log4jsAdapter(log4js);
    const fn = getUniqueString();
    const message = getUniqueString();
    const logMsg = getUniqueString();
    const meta = { [getUniqueString()]: getUniqueString() };
    const error = new SyntaxError(message);
    Object.assign(error, { meta });
    adapter.warn({ fn, error }, logMsg);
    expect(log4js.warn).toHaveBeenCalledWith(logMsg, { fn, error: { name: 'SyntaxError', message, stack: error.stack, meta } });
  });

  it('should normalize Error values in error context', () => {
    const log4js = mockLog4js();
    const adapter = new Log4jsAdapter(log4js);
    const fn = getUniqueString();
    const message = getUniqueString();
    const logMsg = getUniqueString();
    const code = getUniqueString();
    const statusCode = getUniqueString();
    const error = new URIError(message);
    Object.assign(error, { code, statusCode });
    adapter.error({ fn, error }, logMsg);
    expect(log4js.error).toHaveBeenCalledWith(logMsg, { fn, error: { name: 'URIError', message, stack: error.stack, code, statusCode } });
  });
});
