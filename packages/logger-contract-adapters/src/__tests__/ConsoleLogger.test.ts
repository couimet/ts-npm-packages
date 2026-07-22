import { ConsoleLogger } from '../ConsoleLogger';

import { getUniqueString } from '@couimet/dynamic-testing';

describe('ConsoleLogger', () => {
  let logger: ConsoleLogger;

  beforeEach(() => {
    logger = new ConsoleLogger();
  });

  describe('debug', () => {
    it('should call console.debug with formatted message', () => {
      const spy = jest.spyOn(console, 'debug').mockImplementation(() => {});
      logger.debug({ fn: 'myFn' }, 'test message');
      expect(spy).toHaveBeenCalledTimes(1);
      const output = spy.mock.calls[0]![0]!;
      expect(output).toContain('[DEBUG]');
      expect(output).toContain('test message');
      spy.mockRestore();
    });

    it('should place fn first in serialized context', () => {
      const spy = jest.spyOn(console, 'debug').mockImplementation(() => {});
      logger.debug({ fn: 'alpha', extra: 'beta' }, 'msg');
      const output = spy.mock.calls[0]![0]!;
      const jsonStart = output.indexOf('{');
      const jsonEnd = output.indexOf('}') + 1;
      const serialized = output.slice(jsonStart, jsonEnd);
      const parsed = JSON.parse(serialized);
      expect(Object.keys(parsed)[0]).toBe('fn');
      spy.mockRestore();
    });

    it('should normalize Error values in context', () => {
      const spy = jest.spyOn(console, 'debug').mockImplementation(() => {});
      const fn = getUniqueString();
      const message = getUniqueString();
      const logMsg = getUniqueString();
      const code = getUniqueString();
      const error = new TypeError(message);
      Object.assign(error, { code });
      logger.debug({ fn, error }, logMsg);
      const expectedCtx = { fn, error: { name: 'TypeError', message, stack: error.stack, code } };
      expect(spy).toHaveBeenCalledWith(`[DEBUG] ${JSON.stringify(expectedCtx)} ${logMsg}`);
    });
  });

  describe('info', () => {
    it('should call console.info with formatted message', () => {
      const spy = jest.spyOn(console, 'info').mockImplementation(() => {});
      logger.info({ fn: 'myFn' }, 'info msg');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0]![0]!).toContain('[INFO]');
      spy.mockRestore();
    });

    it('should normalize Error values in context', () => {
      const spy = jest.spyOn(console, 'info').mockImplementation(() => {});
      const fn = getUniqueString();
      const message = getUniqueString();
      const logMsg = getUniqueString();
      const tags = [getUniqueString(), getUniqueString()];
      const error = new RangeError(message);
      Object.assign(error, { tags });
      logger.info({ fn, error }, logMsg);
      const expectedCtx = { fn, error: { name: 'RangeError', message, stack: error.stack, tags } };
      expect(spy).toHaveBeenCalledWith(`[INFO] ${JSON.stringify(expectedCtx)} ${logMsg}`);
    });
  });

  describe('warn', () => {
    it('should call console.warn with formatted message', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      logger.warn({ fn: 'myFn' }, 'warn msg');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0]![0]!).toContain('[WARN]');
      spy.mockRestore();
    });

    it('should normalize Error values in context', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const fn = getUniqueString();
      const message = getUniqueString();
      const logMsg = getUniqueString();
      const meta = { [getUniqueString()]: getUniqueString() };
      const error = new SyntaxError(message);
      Object.assign(error, { meta });
      logger.warn({ fn, error }, logMsg);
      const expectedCtx = { fn, error: { name: 'SyntaxError', message, stack: error.stack, meta } };
      expect(spy).toHaveBeenCalledWith(`[WARN] ${JSON.stringify(expectedCtx)} ${logMsg}`);
    });
  });

  describe('error', () => {
    it('should call console.error with formatted message', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      logger.error({ fn: 'myFn' }, 'error msg');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0]![0]!).toContain('[ERROR]');
      spy.mockRestore();
    });

    it('should normalize Error values in context', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const fn = getUniqueString();
      const message = getUniqueString();
      const logMsg = getUniqueString();
      const code = getUniqueString();
      const statusCode = getUniqueString();
      const error = new URIError(message);
      Object.assign(error, { code, statusCode });
      logger.error({ fn, error }, logMsg);
      const expectedCtx = { fn, error: { name: 'URIError', message, stack: error.stack, code, statusCode } };
      expect(spy).toHaveBeenCalledWith(`[ERROR] ${JSON.stringify(expectedCtx)} ${logMsg}`);
    });
  });
});
