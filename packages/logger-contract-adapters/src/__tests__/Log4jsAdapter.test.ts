import { Log4jsAdapter } from '../Log4jsAdapter';

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
});
