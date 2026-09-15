import { useInboundRequestLogger } from '../index';
import { inboundRequestLogger } from '../middlewares/inboundRequestLogger';

import { createMockLogger } from '@couimet/logger-contract-testing';
import type { Application, NextFunction, Request, RequestHandler, Response } from 'express';

const METHOD = 'GET';
const PATH_ONLY = '/api/summary';
const WITH_QUERY = `${PATH_ONLY}?duration=24h&token=secret`;
const LOG_MESSAGE = `Request started: ${METHOD} ${PATH_ONLY}`;

const createReqResNext = (originalUrl: string | undefined, url: string) => {
  const nextSpy = jest.fn();

  return {
    next: nextSpy as unknown as NextFunction,
    nextSpy,
    req: { method: METHOD, originalUrl, url } as unknown as Request,
    res: {} as unknown as Response,
  };
};

describe('inboundRequestLogger', () => {
  it('logs the request start with a query-free path, then calls next', () => {
    const log = createMockLogger();
    const { nextSpy, req, res, next } = createReqResNext(WITH_QUERY, WITH_QUERY);

    inboundRequestLogger(log)(req, res, next);

    expect(log.info).toHaveBeenCalledWith({ fn: 'inboundRequestLogger', method: METHOD, path: PATH_ONLY }, LOG_MESSAGE);
    expect(nextSpy).toHaveBeenCalledWith();
  });

  it('falls back to url when originalUrl is absent and still strips the query', () => {
    const log = createMockLogger();
    const { nextSpy, req, res, next } = createReqResNext(undefined, WITH_QUERY);

    inboundRequestLogger(log)(req, res, next);

    expect(log.info).toHaveBeenCalledWith({ fn: 'inboundRequestLogger', method: METHOD, path: PATH_ONLY }, LOG_MESSAGE);
    expect(nextSpy).toHaveBeenCalledWith();
  });

  it('registers the middleware on the app', () => {
    const useSpy = jest.fn();
    const app = { use: useSpy } as unknown as Application;
    const log = createMockLogger();
    const { nextSpy, req, res, next } = createReqResNext(WITH_QUERY, WITH_QUERY);

    useInboundRequestLogger(app, log);

    expect(useSpy).toHaveBeenCalledTimes(1);

    const handler: RequestHandler = useSpy.mock.calls[0][0];
    handler(req, res, next);

    expect(log.info).toHaveBeenCalledWith({ fn: 'inboundRequestLogger', method: METHOD, path: PATH_ONLY }, LOG_MESSAGE);
    expect(nextSpy).toHaveBeenCalledWith();
  });
});
