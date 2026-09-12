import { stripQuery } from '../stripQuery';

import type { Logger } from '@couimet/logger-contract';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Logs the start of each request; morgan logs completion. Registered after
 * the execution-context middleware so both halves of the trace share the
 * request ids and a hanging request stays visible while in flight.
 *
 * The recorded path is query-free, so a credential such as the one in
 * `/callback?token=...` never reaches the log. `originalUrl` and `url` differ
 * only when the middleware is mounted below the app root, which
 * `createExpressApp` does not do, so the two collapse into one `path` field.
 */
export const inboundRequestLogger = (logger: Logger): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const path = stripQuery(req.originalUrl ?? req.url);

    logger.info({ fn: 'inboundRequestLogger', method: req.method, path }, `Request started: ${req.method} ${path}`);
    next();
  };
};
