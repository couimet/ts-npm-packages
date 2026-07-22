import { PinoAdapter } from '../index';

import { getUniqueString } from '@couimet/dynamic-testing';
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

  it('should normalize Error values in debug context', () => {
    const pino = mockPino();
    const adapter = new PinoAdapter(pino);
    const fn = getUniqueString();
    const message = getUniqueString();
    const logMsg = getUniqueString();
    const code = getUniqueString();
    const error = new TypeError(message);
    (error as any).code = code;
    adapter.debug({ fn, error }, logMsg);
    expect(pino.debug).toHaveBeenCalledWith({ fn, error: { name: 'TypeError', message, stack: error.stack, code } }, logMsg);
  });

  it('should normalize Error values in info context', () => {
    const pino = mockPino();
    const adapter = new PinoAdapter(pino);
    const fn = getUniqueString();
    const message = getUniqueString();
    const logMsg = getUniqueString();
    const tags = [getUniqueString(), getUniqueString()];
    const error = new RangeError(message);
    (error as any).tags = tags;
    adapter.info({ fn, error }, logMsg);
    expect(pino.info).toHaveBeenCalledWith({ fn, error: { name: 'RangeError', message, stack: error.stack, tags } }, logMsg);
  });

  it('should normalize Error values in warn context', () => {
    const pino = mockPino();
    const adapter = new PinoAdapter(pino);
    const fn = getUniqueString();
    const message = getUniqueString();
    const logMsg = getUniqueString();
    const meta = { [getUniqueString()]: getUniqueString() };
    const error = new SyntaxError(message);
    (error as any).meta = meta;
    adapter.warn({ fn, error }, logMsg);
    expect(pino.warn).toHaveBeenCalledWith({ fn, error: { name: 'SyntaxError', message, stack: error.stack, meta } }, logMsg);
  });

  it('should normalize Error values in error context', () => {
    const pino = mockPino();
    const adapter = new PinoAdapter(pino);
    const fn = getUniqueString();
    const message = getUniqueString();
    const logMsg = getUniqueString();
    const code = getUniqueString();
    const statusCode = getUniqueString();
    const error = new URIError(message);
    (error as any).code = code;
    (error as any).statusCode = statusCode;
    adapter.error({ fn, error }, logMsg);
    expect(pino.error).toHaveBeenCalledWith({ fn, error: { name: 'URIError', message, stack: error.stack, code, statusCode } }, logMsg);
  });
});
