import { PinoAdapter } from '../PinoAdapter';

import type { Logger as PinoLogger } from 'pino';

const mockPino = (): PinoLogger =>
  ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }) as unknown as PinoLogger;

describe('PinoAdapter', () => {
  it('should throw if constructed without a logger', () => {
    expect(() => new PinoAdapter(null as unknown as PinoLogger)).toThrow('[logger-contract-adapters]');
  });

  it('should delegate debug to pino logger with (ctx, message) convention', () => {
    const pino = mockPino();
    const adapter = new PinoAdapter(pino);
    adapter.debug({ fn: 'test' }, 'hello');
    expect(pino.debug).toHaveBeenCalledWith({ fn: 'test' }, 'hello');
  });

  it('should delegate info to pino logger', () => {
    const pino = mockPino();
    const adapter = new PinoAdapter(pino);
    adapter.info({ fn: 'test', userId: 42 }, 'user action');
    expect(pino.info).toHaveBeenCalledWith({ fn: 'test', userId: 42 }, 'user action');
  });

  it('should delegate warn to pino logger', () => {
    const pino = mockPino();
    const adapter = new PinoAdapter(pino);
    adapter.warn({ fn: 'test' }, 'warning');
    expect(pino.warn).toHaveBeenCalledWith({ fn: 'test' }, 'warning');
  });

  it('should delegate error to pino logger', () => {
    const pino = mockPino();
    const adapter = new PinoAdapter(pino);
    adapter.error({ fn: 'test' }, 'failure');
    expect(pino.error).toHaveBeenCalledWith({ fn: 'test' }, 'failure');
  });
});
