import { createExpressAppWithExecutionContext } from '../index';

import { getUniqueString, getUuid } from '@couimet/dynamic-testing';
import { ExecutionContext } from '@couimet/execution-context';
import { closeServer, fetchFrom } from '@couimet/express-test-support';
import { startServer, type StartServerResult } from '@couimet/express-tools';
import { createMockLogger } from '@couimet/logger-contract-testing';
import type { Application, RequestHandler } from 'express';

const mockLogger = createMockLogger();

describe('createExpressAppWithExecutionContext', () => {
  const started: StartServerResult[] = [];
  let incomingCorrelationId: string;

  const start = async (app: Application): Promise<StartServerResult> => {
    const result = await startServer(app);
    started.push(result);
    return result;
  };

  beforeEach(() => {
    incomingCorrelationId = getUniqueString({ prefix: 'incoming-correlation' });
  });

  afterEach(async () => {
    await Promise.all(started.splice(0).map((s) => closeServer(s.server)));
  });

  it('carries correlation and request ids on every response', async () => {
    const app = createExpressAppWithExecutionContext({ logger: mockLogger, helmet: false });
    app.get('/smoke', (_req, res) => {
      res.send('ok');
    });

    const testServer = await start(app);
    const headers = (await fetchFrom(testServer, '/smoke')).headers;
    expect(headers.get('x-correlation-id')).not.toBeNull();
    expect(headers.get('x-request-id')).not.toBeNull();
  });

  it('echoes an incoming x-correlation-id header on the response', async () => {
    const app = createExpressAppWithExecutionContext({ logger: mockLogger, helmet: false });
    app.get('/smoke', (_req, res) => {
      res.send('ok');
    });

    const testServer = await start(app);
    const headers = (await fetchFrom(testServer, '/smoke', { headers: { 'x-correlation-id': incomingCorrelationId } })).headers;
    expect(headers.get('x-correlation-id')).toBe(incomingCorrelationId);
    expect(headers.get('x-request-id')).not.toBeNull();
  });

  it('gives each request a distinct request id', async () => {
    const app = createExpressAppWithExecutionContext({ logger: mockLogger, helmet: false });
    app.get('/smoke', (_req, res) => {
      res.send('ok');
    });

    const testServer = await start(app);
    const first = (await fetchFrom(testServer, '/smoke')).headers;
    const second = (await fetchFrom(testServer, '/smoke')).headers;
    expect(first.get('x-request-id')).not.toBeNull();
    expect(second.get('x-request-id')).not.toBeNull();
    expect(first.get('x-request-id')).not.toBe(second.get('x-request-id'));
  });

  it('works without options and still primes requests', async () => {
    const app = createExpressAppWithExecutionContext(undefined);
    app.get('/smoke', (_req, res) => {
      res.send('ok');
    });

    const testServer = await start(app);
    const headers = (await fetchFrom(testServer, '/smoke')).headers;
    expect(headers.get('x-correlation-id')).not.toBeNull();
    expect(headers.get('x-request-id')).not.toBeNull();
  });

  it('runs the execution-context middleware before caller-provided beforeMiddlewares and the middlewares array', async () => {
    const order: string[] = [];
    let capturedCorrelationId: string | undefined;
    const customBefore: RequestHandler = (_req, _res, next) => {
      capturedCorrelationId = ExecutionContext.correlationId.toString();
      order.push('before');
      next();
    };
    const arrayMiddleware: RequestHandler = (_req, _res, next) => {
      order.push('array');
      next();
    };
    const incomingId = getUuid();

    const app = createExpressAppWithExecutionContext({
      logger: mockLogger,
      helmet: false,
      beforeMiddlewares: [customBefore],
      middlewares: [arrayMiddleware],
    });
    app.get('/smoke', (_req, res) => {
      order.push('route');
      res.send('ok');
    });

    const testServer = await start(app);
    await fetchFrom(testServer, '/smoke', { headers: { 'x-correlation-id': incomingId } });
    expect(order).toStrictEqual(['before', 'array', 'route']);
    expect(capturedCorrelationId).toBe(incomingId);
    expect(mockLogger.info).toHaveBeenCalledWith({ fn: 'createExpressApp', middleware: 'execution-context', middlewareIndex: 0 }, 'Applying middleware');
    expect(mockLogger.info).toHaveBeenCalledWith({ fn: 'createExpressApp', middlewareIndex: 1 }, 'Applying middleware without a name (index 1)');
    expect(mockLogger.info).toHaveBeenCalledWith({ fn: 'createExpressApp', middlewareIndex: 0 }, 'Applying middleware without a name (index 0)');
  });

  it('keeps the context middleware when the middlewares array is replaced', async () => {
    const customHandler: RequestHandler = (_req, res, next) => {
      res.setHeader('x-custom', 'present');
      next();
    };

    const app = createExpressAppWithExecutionContext({
      logger: mockLogger,
      helmet: false,
      middlewares: [customHandler],
    });
    app.get('/smoke', (_req, res) => {
      res.send('ok');
    });

    const testServer = await start(app);
    const headers = (await fetchFrom(testServer, '/smoke')).headers;
    expect(headers.get('x-custom')).toBe('present');
    expect(headers.get('x-correlation-id')).not.toBeNull();
    expect(headers.get('x-request-id')).not.toBeNull();
    expect(mockLogger.info).toHaveBeenCalledWith({ fn: 'createExpressApp', middleware: 'execution-context', middlewareIndex: 0 }, 'Applying middleware');
  });

  it('applies the default middlewares so the request trace is logged', async () => {
    const app = createExpressAppWithExecutionContext({ logger: mockLogger, helmet: false });
    app.get('/smoke', (_req, res) => {
      res.send('ok');
    });

    const testServer = await start(app);
    await fetchFrom(testServer, '/smoke');
    expect(mockLogger.info).toHaveBeenCalledWith({ fn: 'inboundRequestLogger', method: 'GET', path: '/smoke' }, 'Request started: GET /smoke');
  });
});
