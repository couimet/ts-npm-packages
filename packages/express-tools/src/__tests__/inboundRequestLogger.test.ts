import { useInboundRequestLogger } from '../index';
import { inboundRequestLogger } from '../middlewares/inboundRequestLogger';

import { createMockLogger } from '@couimet/logger-contract-testing';
import type { Application, NextFunction, Request, RequestHandler, Response } from 'express';

const METHOD = 'GET';
const ORIGINAL_URL = '/api/summary?duration=24h';
const URL_VALUE = '/api/summary?duration=24h';
const LOG_MESSAGE = `Request started: ${METHOD} ${ORIGINAL_URL}`;

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
  it('logs the request start with method and urls, then calls next', () => {
    const log = createMockLogger();
    const { nextSpy, req, res, next } = createReqResNext(ORIGINAL_URL, URL_VALUE);

    inboundRequestLogger(log)(req, res, next);

    expect(log.info).toHaveBeenCalledWith({ fn: 'inboundRequestLogger', method: METHOD, originalUrl: ORIGINAL_URL, url: URL_VALUE }, LOG_MESSAGE);
    expect(nextSpy).toHaveBeenCalledWith();
  });

  it('falls back to url in the message when originalUrl is absent', () => {
    const log = createMockLogger();
    const { nextSpy, req, res, next } = createReqResNext(undefined, URL_VALUE);

    inboundRequestLogger(log)(req, res, next);

    expect(log.info).toHaveBeenCalledWith(
      { fn: 'inboundRequestLogger', method: METHOD, originalUrl: undefined, url: URL_VALUE },
      `Request started: ${METHOD} ${URL_VALUE}`,
    );
    expect(nextSpy).toHaveBeenCalledWith();
  });

  it('registers the middleware on the app', () => {
    const useSpy = jest.fn();
    const app = { use: useSpy } as unknown as Application;
    const log = createMockLogger();
    const { nextSpy, req, res, next } = createReqResNext(ORIGINAL_URL, URL_VALUE);

    useInboundRequestLogger(app, log);

    expect(useSpy).toHaveBeenCalledTimes(1);

    const handler: RequestHandler = useSpy.mock.calls[0][0];
    handler(req, res, next);

    expect(log.info).toHaveBeenCalledWith({ fn: 'inboundRequestLogger', method: METHOD, originalUrl: ORIGINAL_URL, url: URL_VALUE }, LOG_MESSAGE);
    expect(nextSpy).toHaveBeenCalledWith();
  });
});
