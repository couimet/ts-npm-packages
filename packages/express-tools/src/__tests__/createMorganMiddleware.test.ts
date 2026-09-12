import { createMorganMiddleware, MiddlewareIdentifier, MORGAN_DEFAULT_FORMAT, startServer, type StartServerResult } from '../index';

import { closeServer, fetchFrom } from '@couimet/express-test-support';
import { createMockLogger } from '@couimet/logger-contract-testing';
import express, { type RequestHandler } from 'express';

const mockLogger = createMockLogger();

describe('createMorganMiddleware', () => {
  const started: StartServerResult[] = [];

  const startWithMiddleware = async (middleware: RequestHandler): Promise<StartServerResult> => {
    const app = express();
    app.use(middleware);
    app.get('/test', (_req, res) => res.send('ok'));
    const result = await startServer(app);
    started.push(result);
    return result;
  };

  afterEach(async () => {
    await Promise.all(started.splice(0).map((s) => closeServer(s.server)));
  });

  it('has the expected middleware identifier value for MORGAN', () => {
    expect(MiddlewareIdentifier.Morgan).toBe('morgan');
  });

  it('has the expected default format', () => {
    expect(MORGAN_DEFAULT_FORMAT).toBe(':method :path :status :response-time ms');
  });

  it('logs requests with the default format', async () => {
    const logger = createMockLogger();
    const testServer = await startWithMiddleware(createMorganMiddleware({ logger }));

    await fetchFrom(testServer, '/test');
    expect(logger.info).toHaveBeenCalledWith({ fn: 'http.request' }, expect.stringMatching(/^GET \/test 200 \d+\.\d+ ms$/));
  });

  it('omits the query string from the default format', async () => {
    const logger = createMockLogger();
    const testServer = await startWithMiddleware(createMorganMiddleware({ logger }));

    await fetchFrom(testServer, '/test?token=secret');
    expect(logger.info).toHaveBeenCalledWith({ fn: 'http.request' }, expect.stringMatching(/^GET \/test 200 \d+\.\d+ ms$/));
  });

  it('still writes the query string when a caller supplies the built-in url token', async () => {
    // The accepted cost of fixing the default rather than every format: a caller
    // who writes an explicit :url has chosen a format of their own, and this
    // middleware does not overrule that choice.
    const logger = createMockLogger();
    const testServer = await startWithMiddleware(createMorganMiddleware({ format: ':method :url', logger }));

    await fetchFrom(testServer, '/test?token=secret');
    expect(logger.info).toHaveBeenCalledWith({ fn: 'http.request' }, 'GET /test?token=secret');
  });

  it('uses a custom format when provided', async () => {
    const logger = createMockLogger();
    const testServer = await startWithMiddleware(createMorganMiddleware({ format: ':method :url', logger }));

    await fetchFrom(testServer, '/test');
    expect(logger.info).toHaveBeenCalledWith({ fn: 'http.request' }, expect.stringMatching(/^GET \/test$/));
  });

  it('ignores options explicitly set to undefined', async () => {
    const logger = createMockLogger();
    const testServer = await startWithMiddleware(createMorganMiddleware({ format: undefined, logger }));

    await fetchFrom(testServer, '/test');
    expect(logger.info).toHaveBeenCalledWith({ fn: 'http.request' }, expect.stringMatching(/^GET \/test 200 \d+\.\d+ ms$/));
  });

  it('falls back to the module-load-time logger when called with no arguments', async () => {
    const testServer = await startWithMiddleware(createMorganMiddleware());

    expect((await fetchFrom(testServer, '/test')).status).toBe(200);
    expect(mockLogger.info).not.toHaveBeenCalled();
  });
});
