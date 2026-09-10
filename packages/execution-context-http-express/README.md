# @couimet/execution-context-http-express

[![npm version](https://img.shields.io/npm/v/@couimet/execution-context-http-express.svg?style=flat-square)](https://www.npmjs.com/package/@couimet/execution-context-http-express) [![Coverage](https://codecov.io/gh/couimet/ts-npm-packages/branch/main/graph/badge.svg?flag=execution-context-http-express)](https://codecov.io/gh/couimet/ts-npm-packages?flags%5B0%5D=execution-context-http-express) [![npm downloads](https://img.shields.io/npm/dm/@couimet/execution-context-http-express.svg?style=flat-square)](https://www.npmjs.com/package/@couimet/execution-context-http-express)

`@couimet/execution-context-http-express` binds the inbound HTTP correlation and request id headers to an [`@couimet/execution-context`](https://github.com/couimet/ts-npm-packages/tree/main/packages/execution-context) scope for the life of a request. Every middleware and handler that runs afterwards can read `ExecutionContext.correlationId` and `ExecutionContext.requestId` without threading them through call arguments. The middleware also echoes both ids back on the response. The package targets Express 5.

## Install

```bash
pnpm add @couimet/execution-context-http-express @couimet/execution-context @couimet/execution-context-http @couimet/express-tools express
```

## Usage

Build an app with the context middleware already registered first:

```typescript
import { createExpressAppWithExecutionContext } from '@couimet/execution-context-http-express';
import { ExecutionContext } from '@couimet/execution-context';
import { getLogger } from '@couimet/logger-contract';

const app = createExpressAppWithExecutionContext({ logger: getLogger() });

app.get('/orders', (_req, res) => {
  // The correlation id came from the caller, or was generated for this request.
  res.send({ correlationId: ExecutionContext.correlationId.toString() });
});
```

Add the middleware to an app you built by hand instead:

```typescript
import { useExecutionContext } from '@couimet/execution-context-http-express';
import express from 'express';

const app = express();
useExecutionContext(app);
```

Register it before any other middleware. Everything registered after it runs inside the primed context.

## API reference

The barrel re-exports the app factory, the two middleware factories, and the helper that registers the middleware on a hand-built app.

### createExpressAppWithExecutionContext

Creates an Express `Application` through [`@couimet/express-tools`](https://github.com/couimet/ts-npm-packages/tree/main/packages/express-tools) with the execution-context middleware registered before everything else. Accepts the same options as `createExpressApp`.

```typescript
function createExpressAppWithExecutionContext(options: Partial<CreateExpressOptions> | undefined): Application;
```

Caller-provided `beforeMiddlewares` entries run after the context middleware, so they already see a primed context. The returned app registers the context middleware under the label `execution-context`.

### executionContext

Creates the middleware that primes the context for one request.

```typescript
function executionContext(): RequestHandler;
```

The middleware reads the `x-correlation-id` and `x-request-id` request headers through [`@couimet/execution-context-http`](https://github.com/couimet/ts-npm-packages/tree/main/packages/execution-context-http) `HttpHeaders` values. It reuses a header value that is present and non-blank, and generates a new id otherwise. It then runs the rest of the request inside a context holding both ids, copies the outer context attributes into the new context, and sets both ids as response headers. The copied attributes are a shallow copy, so a mutation made inside the request does not reach the outer context.

Header values are trusted, because the caller sits behind an internal boundary. The middleware does not validate their format.

### labeledExecutionContext

Creates the same middleware wrapped as a `LabeledMiddleware` for the ordered middleware arrays of `createExpressApp`. The registration log then names the entry `execution-context` instead of printing its index.

```typescript
function labeledExecutionContext(): LabeledMiddleware;
```

### useExecutionContext

Registers the context middleware on an app you built by hand.

```typescript
function useExecutionContext(app: Application): void;
```

`createExpressAppWithExecutionContext` already registers it, so call this only for a hand-built app. Register it first, before any other middleware.

## Related packages

- [`@couimet/execution-context`](https://github.com/couimet/ts-npm-packages/tree/main/packages/execution-context) provides the `ExecutionContext` store this middleware primes.
- [`@couimet/execution-context-http`](https://github.com/couimet/ts-npm-packages/tree/main/packages/execution-context-http) names the correlation and request id headers, and parses them into ids.
- [`@couimet/express-tools`](https://github.com/couimet/ts-npm-packages/tree/main/packages/express-tools) provides `createExpressApp`, which this package wraps.
- [`@couimet/express-tools-testing`](https://github.com/couimet/ts-npm-packages/tree/main/packages/express-tools-testing) starts a test server for route-level tests.

## License

MIT
