# @couimet/express-tools-testing

[![npm version](https://img.shields.io/npm/v/@couimet/express-tools-testing.svg?style=flat-square)](https://www.npmjs.com/package/@couimet/express-tools-testing) [![Coverage](https://codecov.io/gh/couimet/ts-npm-packages/branch/main/graph/badge.svg?flag=express-tools-testing)](https://codecov.io/gh/couimet/ts-npm-packages?flags%5B0%5D=express-tools-testing) [![npm downloads](https://img.shields.io/npm/dm/@couimet/express-tools-testing.svg?style=flat-square)](https://www.npmjs.com/package/@couimet/express-tools-testing)

`@couimet/express-tools-testing` starts a real HTTP server for a route-level test. One call builds an app from [`@couimet/express-tools`](https://github.com/couimet/ts-npm-packages/tree/main/packages/express-tools), hands it to your callback to register routes, and listens on an ephemeral port. The test then sends real requests to that port and closes the server when it finishes. The package saves each test from repeating the app construction, the registration step, and the port lookup.

## Install

```bash
pnpm add -D @couimet/express-tools-testing
```

## Usage

```typescript
import { startTestServer } from '@couimet/express-tools-testing';
import { createMockLogger } from '@couimet/logger-contract-testing';

const logger = createMockLogger();

const { server, port } = startTestServer(logger, (app) => {
  app.get('/health', (_req, res) => {
    res.send('ok');
  });
});

// Send requests to the ephemeral port, then close the server.
await fetch(`http://[::1]:${port}/health`);
await new Promise<void>((resolve) => server.close(() => resolve()));
```

The app comes from `createExpressApp({ logger })`, so the defaults apply. Helmet security headers are on, and the inbound request logger and morgan write to the logger you pass. The logger records every request the test makes.

## API reference

The barrel re-exports one module: `startTestServer`.

### startTestServer

Builds an app, registers the routes, and starts listening. Returns once the server is bound.

```typescript
function startTestServer(logger: Logger, register: (app: Application) => void): TestServer;
```

The `logger` parameter goes to `createExpressApp`. The `register` parameter receives the app so the test can attach its handlers. Routes registered with `app.get`, `app.post`, and the other Express verbs behave as they do in production.

The call listens on port `0`, so the operating system picks a free port. That choice keeps parallel test files from colliding. Read the assigned port off the returned object.

The signature returns synchronously. A `startTestServer` call always yields a bound server, and the ephemeral port is available immediately. Close the returned server in an `afterEach` hook so the test process exits.

### TestServer

```typescript
interface TestServer {
  server: Server;
  port: number;
}
```

The `server` field is the Node HTTP server. Call `close()` on it to release the port. The `port` field is the port the operating system assigned.

## Related packages

- [`@couimet/express-tools`](https://github.com/couimet/ts-npm-packages/tree/main/packages/express-tools) provides `createExpressApp`, which builds the app this helper starts.
- [`@couimet/logger-contract-testing`](https://github.com/couimet/ts-npm-packages/tree/main/packages/logger-contract-testing) provides the mock logger to pass as the `logger` argument.

## License

MIT
