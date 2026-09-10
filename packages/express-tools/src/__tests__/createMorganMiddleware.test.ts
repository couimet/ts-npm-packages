import { createMorganMiddleware, MiddlewareIdentifier, MORGAN_DEFAULT_FORMAT } from '../index';

import { createMockLogger } from '@couimet/logger-contract-testing';
import express, { type RequestHandler } from 'express';
import type { Server } from 'node:http';

const mockLogger = createMockLogger();

const fetchStatus = (server: Server, path: string): Promise<number> =>
  new Promise((resolve, reject) => {
    const addr = server.address();
    if (!addr || typeof addr === 'string') {
      reject(new Error('Server not listening'));
      return;
    }
    fetch(`http://[::1]:${addr.port}${path}`)
      .then((res) => resolve(res.status))
      .catch(reject);
  });

describe('createMorganMiddleware', () => {
  const startWithMiddleware = (middleware: RequestHandler): Server => {
    const app = express();
    app.use(middleware);
    app.get('/test', (_req, res) => res.send('ok'));
    return app.listen(0);
  };

  const closeServer = (server: Server): Promise<void> => new Promise<void>((resolve) => server.close(() => resolve()));

  it('has the expected middleware identifier value for MORGAN', () => {
    expect(MiddlewareIdentifier.Morgan).toBe('morgan');
  });

  it('has the expected default format', () => {
    expect(MORGAN_DEFAULT_FORMAT).toBe(':method :url :status :response-time ms');
  });

  it('logs requests with the default format', async () => {
    const logger = createMockLogger();
    const server = startWithMiddleware(createMorganMiddleware({ logger }));
    try {
      await fetchStatus(server, '/test');
      expect(logger.info).toHaveBeenCalledWith({ fn: 'http.request' }, expect.stringMatching(/^GET \/test 200 \d+\.\d+ ms$/));
    } finally {
      await closeServer(server);
    }
  });

  it('uses a custom format when provided', async () => {
    const logger = createMockLogger();
    const server = startWithMiddleware(createMorganMiddleware({ format: ':method :url', logger }));
    try {
      await fetchStatus(server, '/test');
      expect(logger.info).toHaveBeenCalledWith({ fn: 'http.request' }, expect.stringMatching(/^GET \/test$/));
    } finally {
      await closeServer(server);
    }
  });

  it('ignores options explicitly set to undefined', async () => {
    const logger = createMockLogger();
    const server = startWithMiddleware(createMorganMiddleware({ format: undefined, logger }));
    try {
      await fetchStatus(server, '/test');
      expect(logger.info).toHaveBeenCalledWith({ fn: 'http.request' }, expect.stringMatching(/^GET \/test 200 \d+\.\d+ ms$/));
    } finally {
      await closeServer(server);
    }
  });

  it('falls back to the module-load-time logger when called with no arguments', async () => {
    const server = startWithMiddleware(createMorganMiddleware());
    try {
      expect(await fetchStatus(server, '/test')).toBe(200);
      expect(mockLogger.info).not.toHaveBeenCalled();
    } finally {
      await closeServer(server);
    }
  });
});
