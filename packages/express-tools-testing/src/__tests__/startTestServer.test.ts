import { startTestServer, type TestServer } from '../index';

import { closeServer, fetchFrom } from '@couimet/express-test-support';
import { createMockLogger } from '@couimet/logger-contract-testing';
import type { Application } from 'express';

describe('startTestServer', () => {
  let testServer: TestServer | undefined;

  afterEach(async () => {
    if (testServer) await closeServer(testServer.server);
    testServer = undefined;
  });

  it('builds the app, calls register, and serves the registered route', async () => {
    const logger = createMockLogger();
    const register = jest.fn((app: Application) => {
      app.get('/health', (_req, res) => {
        res.send('ok');
      });
    });

    testServer = await startTestServer(logger, register);

    expect(register).toHaveBeenCalledWith(expect.any(Function));
    expect(testServer.host).toBe('127.0.0.1');
    expect(testServer.port).toBeGreaterThan(0);

    const response = await fetchFrom(testServer, '/health');

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('ok');
  });
});
