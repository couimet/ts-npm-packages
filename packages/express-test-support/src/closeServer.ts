import type { Server } from 'node:http';

/**
 * Closes the server and settles once it has stopped listening.
 *
 * Replaces the copy that each suite used to declare for itself. Rejects when the
 * server is not running, which `node:http` reports through the close callback.
 */
export const closeServer = (server: Server): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
