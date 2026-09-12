# @couimet/express-tools-testing

[![npm version](https://img.shields.io/npm/v/@couimet/express-tools-testing)](https://www.npmjs.com/package/@couimet/express-tools-testing) [![npm downloads](https://img.shields.io/npm/dm/@couimet/express-tools-testing)](https://www.npmjs.com/package/@couimet/express-tools-testing) [![Coverage](https://codecov.io/gh/couimet/ts-npm-packages/branch/main/graph/badge.svg?flag=express-tools-testing)](https://codecov.io/gh/couimet/ts-npm-packages?flags%5B0%5D=express-tools-testing)

`@couimet/express-tools-testing` starts a real HTTP server for a route-level test. One call builds an app from [`@couimet/express-tools`](https://github.com/couimet/ts-npm-packages/tree/main/packages/express-tools), hands it to your callback to register routes, and listens on an ephemeral port on the loopback interface. The test then sends real requests to that address and closes the server when it finishes. The package saves each test from repeating the app construction, the registration step, and the address lookup.

## Install

```bash
pnpm add -D @couimet/express-tools-testing
```

## Usage

```typescript
import { startTestServer } from '@couimet/express-tools-testing';
import { createMockLogger } from '@couimet/logger-contract-testing';

const logger = createMockLogger();

const { host, port, server } = await startTestServer(logger, (app) => {
  app.get('/health', (_req, res) => {
    res.send('ok');
  });
});

// Send requests to the bound address, then close the server.
await fetch(`http://${host}:${port}/health`);
await new Promise<void>((resolve) => server.close(() => resolve()));
```

The app comes from `createExpressApp({ logger })`, so the defaults apply. Helmet security headers are on, and the inbound request logger and morgan write to the logger you pass. The logger records every request the test makes.

## API reference

The barrel re-exports one module: `startTestServer`.

### startTestServer

Builds an app, registers the routes, and starts listening. Returns once the server is bound.

```typescript
function startTestServer(logger: Logger, register: (app: Application) => void): Promise<TestServer>;
```

The `logger` parameter goes to `createExpressApp`. The `register` parameter receives the app so the test can attach its handlers. Routes registered with `app.get`, `app.post`, and the other Express verbs behave as they do in production.

The call listens on port `0`, so the operating system picks a free port. That choice keeps parallel test files from colliding. Read the assigned port off the returned object.

The call binds host `127.0.0.1`, so the server accepts loopback connections only. Read the bound host off the returned object and build the request URL from it.

Await the call before the test sends a request. The promise resolves once the server accepts connections. It rejects when the listen fails, carrying the reason in a `DetailedError`. Close the returned server in an `afterEach` hook so the test process exits.

### TestServer

```typescript
interface TestServer {
  server: Server;
  port: number;
  host: string;
}
```

The `server` field is the Node HTTP server. Call `close()` on it to release the port. The `port` field is the port the operating system assigned. The `host` field is the address the server bound.

## Related packages

- [`@couimet/express-tools`](https://github.com/couimet/ts-npm-packages/tree/main/packages/express-tools) provides `createExpressApp`, which builds the app this helper starts.
- [`@couimet/logger-contract-testing`](https://github.com/couimet/ts-npm-packages/tree/main/packages/logger-contract-testing) provides the mock logger to pass as the `logger` argument.

## License

MIT
