import { ExpressToolsErrorCodes } from './ExpressToolsErrorCodes';

import { DetailedError } from '@couimet/detailed-error';
import type { Application } from 'express';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

export interface StartServerParams {
  /** Interface to bind. Defaults to loopback, so a test server stays off the network. */
  host: string;
  /** Port to bind. Defaults to `0`, which lets the operating system assign a free ephemeral port. */
  port: number;
}

export interface StartServerResult {
  /** The address the server actually bound. */
  host: string;
  port: number;
  server: Server;
}

const BASE_DEFAULTS: StartServerParams = { host: '127.0.0.1', port: 0 };

/**
 * Starts listening on the given host and port. Resolves when the server is
 * bound; rejects on EADDRINUSE or other errors.
 *
 * This owns the only listen in the tree. Both members have defaults, and the
 * merge filters out `undefined` values so a partial override cannot clobber a
 * default with an explicit `undefined`.
 */
export const startServer = (app: Application, options?: Partial<StartServerParams>): Promise<StartServerResult> =>
  new Promise((resolve, reject) => {
    const opts: StartServerParams = {
      ...BASE_DEFAULTS,
      ...Object.fromEntries(Object.entries(options ?? {}).filter(([, v]) => v !== undefined)),
    };

    const server = createServer(app);

    server.on('error', (err: NodeJS.ErrnoException) => {
      reject(
        new DetailedError({
          code: ExpressToolsErrorCodes.SERVER_LISTEN_FAILED,
          message: `Failed to start server on port ${opts.port}`,
          functionName: 'startServer',
          details: { port: opts.port, originalCode: err.code },
          cause: err,
        }),
      );
    });

    server.on('listening', () => {
      const address = server.address() as AddressInfo;

      resolve({ host: address.address, port: address.port, server });
    });

    try {
      server.listen(opts.port, opts.host);
    } catch (err: unknown) {
      const originalCode = (err as NodeJS.ErrnoException).code;

      reject(
        new DetailedError({
          code: ExpressToolsErrorCodes.SERVER_LISTEN_FAILED,
          message: `Failed to start server on port ${opts.port}`,
          functionName: 'startServer',
          details: { port: opts.port, originalCode },
          cause: err,
        }),
      );
    }
  });
