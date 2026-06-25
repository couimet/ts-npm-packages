import { WinstonAdapter } from '../WinstonAdapter';

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
});
