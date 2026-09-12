import { startServer } from '../index';

import { DetailedError } from '@couimet/detailed-error';
import express from 'express';

describe('startServer', () => {
  let stop: () => Promise<void>;

  beforeEach(() => {
    stop = async () => {};
  });

  afterEach(async () => {
    await stop();
  });

  it('resolves with the bound host, port and server', async () => {
    const app = express();
    const result = await startServer(app);

    stop = () => new Promise<void>((resolve, reject) => result.server.close((err) => (err ? reject(err) : resolve())));

    expect(result.host).toBe('127.0.0.1');
    expect(result.port).toBeGreaterThan(0);
    expect(result.server.listening).toBe(true);
  });

  it('binds the host when one is provided', async () => {
    const app = express();
    const result = await startServer(app, { host: '0.0.0.0' });

    stop = () => new Promise<void>((resolve, reject) => result.server.close((err) => (err ? reject(err) : resolve())));

    expect(result.host).toBe('0.0.0.0');
    expect(result.port).toBeGreaterThan(0);
  });

  it('ignores options explicitly set to undefined', async () => {
    const app = express();
    const result = await startServer(app, { host: undefined, port: undefined });

    stop = () => new Promise<void>((resolve, reject) => result.server.close((err) => (err ? reject(err) : resolve())));

    expect(result.host).toBe('127.0.0.1');
    expect(result.port).toBeGreaterThan(0);
  });

  it('rejects with SERVER_LISTEN_FAILED when port is already taken', async () => {
    const app1 = express();
    const result1 = await startServer(app1, { port: 0 });
    stop = () => new Promise<void>((resolve, reject) => result1.server.close((err) => (err ? reject(err) : resolve())));

    const app2 = express();
    const error = (await startServer(app2, { port: result1.port }).catch((e: unknown) => e)) as DetailedError<string>;

    expect(error).toBeDetailedError('SERVER_LISTEN_FAILED', {
      message: `Failed to start server on port ${result1.port}`,
      functionName: 'startServer',
      details: { port: result1.port, originalCode: 'EADDRINUSE' },
      cause: expect.any(Object),
    });
    expect((error.cause as NodeJS.ErrnoException).code).toBe('EADDRINUSE');
  });

  it('rejects with SERVER_LISTEN_FAILED when port is invalid', async () => {
    const app = express();
    const error = (await startServer(app, { port: -1 }).catch((e: unknown) => e)) as DetailedError<string>;

    expect(error).toBeDetailedError('SERVER_LISTEN_FAILED', {
      message: 'Failed to start server on port -1',
      functionName: 'startServer',
      details: { port: -1, originalCode: 'ERR_SOCKET_BAD_PORT' },
      cause: expect.any(Object),
    });
    expect((error.cause as NodeJS.ErrnoException).code).toBe('ERR_SOCKET_BAD_PORT');
  });
});
