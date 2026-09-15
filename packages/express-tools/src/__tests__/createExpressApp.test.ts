import { buildDefaultMiddlewares, createExpressApp, MORGAN_DEFAULT_FORMAT, startServer, type StartServerResult } from '../index';

import { closeServer, fetchFrom } from '@couimet/express-test-support';
import { createMockLogger } from '@couimet/logger-contract-testing';
import type { Application, RequestHandler } from 'express';

const mockLogger = createMockLogger();

describe('createExpressApp', () => {
  const started: StartServerResult[] = [];

  const start = async (app: Application): Promise<StartServerResult> => {
    const result = await startServer(app);
    started.push(result);
    return result;
  };

  afterEach(async () => {
    await Promise.all(started.splice(0).map((s) => closeServer(s.server)));
  });

  it('returns a working Express app that routes requests and sends responses', async () => {
    const app = createExpressApp({ logger: mockLogger });
    app.get('/smoke', (_req, res) => {
      res.send('ok');
    });

    const testServer = await start(app);
    const response = await fetchFrom(testServer, '/smoke');
    expect(await response.text()).toBe('ok');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(mockLogger.info).toHaveBeenCalledWith({ fn: 'createExpressApp' }, 'Express app created');
  });

  it('still routes requests when helmet is disabled', async () => {
    const app = createExpressApp({ logger: mockLogger, helmet: false });
    app.get('/smoke', (_req, res) => {
      res.send('ok');
    });

    const testServer = await start(app);
    const response = await fetchFrom(testServer, '/smoke');
    expect(await response.text()).toBe('ok');
    expect(response.headers.get('x-content-type-options')).toBeNull();
    expect(mockLogger.info).toHaveBeenCalledWith({ fn: 'createExpressApp' }, 'Express app created');
  });

  it('works with no options and with explicit undefined values', async () => {
    const app1 = createExpressApp();
    const app2 = createExpressApp({ logger: mockLogger, helmet: undefined });
    app1.get('/smoke', (_req, res) => res.send('a'));
    app2.get('/smoke', (_req, res) => res.send('b'));

    const s1 = await start(app1);
    const s2 = await start(app2);
    expect(await (await fetchFrom(s1, '/smoke')).text()).toBe('a');
    expect(await (await fetchFrom(s2, '/smoke')).text()).toBe('b');
    expect(mockLogger.info).toHaveBeenCalledWith({ fn: 'createExpressApp' }, 'Express app created');
  });

  it('applies default middlewares when no middlewares option is provided', async () => {
    const app = createExpressApp({ logger: mockLogger, helmet: false, morganFormat: ':method :url :status' });
    app.get('/smoke', (_req, res) => res.send('ok'));

    const testServer = await start(app);
    expect(await (await fetchFrom(testServer, '/smoke')).text()).toBe('ok');
    expect(mockLogger.info).toHaveBeenCalledWith({ fn: 'inboundRequestLogger', method: 'GET', path: '/smoke' }, 'Request started: GET /smoke');
    expect(mockLogger.info).toHaveBeenCalledWith({ fn: 'http.request' }, 'GET /smoke 200');
  });

  it('replaces default middlewares entirely when a custom middlewares array is provided', async () => {
    const customHandler: RequestHandler = (_req, res, next) => {
      res.setHeader('x-custom', 'present');
      next();
    };

    const app = createExpressApp({
      logger: mockLogger,
      helmet: false,
      middlewares: [{ label: 'custom', handler: customHandler }],
    });
    app.get('/smoke', (_req, res) => res.send('ok'));

    const testServer = await start(app);
    const response = await fetchFrom(testServer, '/smoke');
    expect(response.headers.get('x-custom')).toBe('present');
    expect(mockLogger.info).toHaveBeenCalledWith({ fn: 'createExpressApp', middleware: 'custom', middlewareIndex: 0 }, 'Applying middleware');
    expect(mockLogger.info).not.toHaveBeenCalledWith({ fn: 'createExpressApp', middleware: 'morgan', middlewareIndex: 1 }, 'Applying middleware');
  });

  it('applies the default middlewares when middlewares is explicitly undefined', async () => {
    const app = createExpressApp({
      logger: mockLogger,
      helmet: false,
      middlewares: undefined,
      morganFormat: ':method :url :status',
    });
    app.get('/smoke', (_req, res) => res.send('ok'));

    const testServer = await start(app);
    expect(await (await fetchFrom(testServer, '/smoke')).text()).toBe('ok');
    expect(mockLogger.info).toHaveBeenCalledWith({ fn: 'inboundRequestLogger', method: 'GET', path: '/smoke' }, 'Request started: GET /smoke');
    expect(mockLogger.info).toHaveBeenCalledWith({ fn: 'http.request' }, 'GET /smoke 200');
  });

  it('applies middleware before routes so middleware runs on every request', async () => {
    const order: string[] = [];
    const trackingMiddleware: RequestHandler = (_req, _res, next) => {
      order.push('middleware');
      next();
    };

    const app = createExpressApp({
      logger: mockLogger,
      helmet: false,
      middlewares: [trackingMiddleware],
    });
    app.get('/smoke', (_req, res) => {
      order.push('route');
      res.send('ok');
    });

    const testServer = await start(app);
    await fetchFrom(testServer, '/smoke');
    expect(order).toStrictEqual(['middleware', 'route']);
  });

  it('runs beforeMiddlewares before helmet and the middlewares array', async () => {
    const order: string[] = [];
    const beforeMiddleware: RequestHandler = (_req, _res, next) => {
      order.push('before');
      next();
    };
    const mapMiddleware: RequestHandler = (_req, _res, next) => {
      order.push('map');
      next();
    };

    const app = createExpressApp({
      logger: mockLogger,
      helmet: false,
      beforeMiddlewares: [beforeMiddleware],
      middlewares: [mapMiddleware],
    });
    app.get('/smoke', (_req, res) => {
      order.push('route');
      res.send('ok');
    });

    const testServer = await start(app);
    await fetchFrom(testServer, '/smoke');
    expect(order).toStrictEqual(['before', 'map', 'route']);
  });

  it('buildDefaultMiddlewares returns labeled entries for the inbound logger and morgan', () => {
    const middlewares = buildDefaultMiddlewares({ logger: mockLogger, format: MORGAN_DEFAULT_FORMAT });
    expect(middlewares.map((m) => ('label' in m ? m.label : undefined))).toStrictEqual(['inbound-request-logger', 'morgan']);
    expect(middlewares.every((m) => 'label' in m && typeof m.handler === 'function')).toBe(true);
  });

  it('registers middlewares in array order and logs unlabeled entries with their index', async () => {
    const order: string[] = [];
    const first: RequestHandler = (_req, _res, next) => {
      order.push('first');
      next();
    };
    const second: RequestHandler = (_req, _res, next) => {
      order.push('second');
      next();
    };

    const app = createExpressApp({
      logger: mockLogger,
      helmet: false,
      middlewares: [first, second],
    });
    app.get('/smoke', (_req, res) => res.send('ok'));

    const testServer = await start(app);
    await fetchFrom(testServer, '/smoke');
    expect(order).toStrictEqual(['first', 'second']);
    expect(mockLogger.info).toHaveBeenCalledWith({ fn: 'createExpressApp', middlewareIndex: 0 }, 'Applying middleware without a name (index 0)');
    expect(mockLogger.info).toHaveBeenCalledWith({ fn: 'createExpressApp', middlewareIndex: 1 }, 'Applying middleware without a name (index 1)');
  });

  it('logs labeled beforeMiddlewares entries at registration', async () => {
    const beforeMiddleware: RequestHandler = (_req, _res, next) => next();

    const app = createExpressApp({
      logger: mockLogger,
      helmet: false,
      beforeMiddlewares: [{ label: 'prime', handler: beforeMiddleware }],
    });
    app.get('/smoke', (_req, res) => res.send('ok'));

    const testServer = await start(app);
    await fetchFrom(testServer, '/smoke');
    expect(mockLogger.info).toHaveBeenCalledWith({ fn: 'createExpressApp', middleware: 'prime', middlewareIndex: 0 }, 'Applying middleware');
  });
});
