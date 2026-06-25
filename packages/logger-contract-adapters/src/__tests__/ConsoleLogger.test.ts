import { ConsoleLogger } from '../ConsoleLogger';

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
  });

  describe('info', () => {
    it('should call console.info with formatted message', () => {
      const spy = jest.spyOn(console, 'info').mockImplementation(() => {});
      logger.info({ fn: 'myFn' }, 'info msg');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0]![0]!).toContain('[INFO]');
      spy.mockRestore();
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
  });

  describe('error', () => {
    it('should call console.error with formatted message', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      logger.error({ fn: 'myFn' }, 'error msg');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0]![0]!).toContain('[ERROR]');
      spy.mockRestore();
    });
  });
});
