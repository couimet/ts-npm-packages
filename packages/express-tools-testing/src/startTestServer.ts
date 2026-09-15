import { createExpressApp, startServer } from '@couimet/express-tools';
import type { Logger } from '@couimet/logger-contract';
import type { Application } from 'express';
import type { Server } from 'node:http';

export interface TestServer {
  server: Server;
  port: number;
  host: string;
}

export const startTestServer = (logger: Logger, register: (app: Application) => void): Promise<TestServer> => {
  const app = createExpressApp({ logger });
  register(app);

  return startServer(app);
};
