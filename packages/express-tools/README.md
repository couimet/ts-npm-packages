# @couimet/express-tools

[![npm version](https://img.shields.io/npm/v/@couimet/express-tools.svg?style=flat-square)](https://www.npmjs.com/package/@couimet/express-tools) [![Coverage](https://codecov.io/gh/couimet/ts-npm-packages/branch/main/graph/badge.svg?flag=express-tools)](https://codecov.io/gh/couimet/ts-npm-packages?flags%5B0%5D=express-tools) [![npm downloads](https://img.shields.io/npm/dm/@couimet/express-tools.svg?style=flat-square)](https://www.npmjs.com/package/@couimet/express-tools)

`@couimet/express-tools` builds a pre-configured Express application. The `createExpressApp` factory turns on helmet security headers, logs the start of each request, and logs completion through morgan. Two ordered arrays keep middleware registration explicit, and an entry can carry a label that names it in the registration log. Every log line goes through [`@couimet/logger-contract`](https://github.com/couimet/ts-npm-packages/tree/main/packages/logger-contract), so the package never commits a consumer to a logging framework. The package targets Express 5.

## Install

```bash
pnpm add @couimet/express-tools @couimet/logger-contract express
```

## Usage

Create an app with the defaults, or turn helmet off:

```typescript
import { createExpressApp } from '@couimet/express-tools';
import { getLogger } from '@couimet/logger-contract';

const logger = getLogger();

// Helmet on, request-start logging and morgan completion logging registered.
const app = createExpressApp({ logger });

// The same app without helmet.
const withoutHelmet = createExpressApp({ logger, helmet: false });
```

The `middlewares` array replaces the defaults. Build the default entries first when you want to append to them:

```typescript
import { buildDefaultMiddlewares, createExpressApp } from '@couimet/express-tools';

const app = createExpressApp({
  logger,
  middlewares: [...buildDefaultMiddlewares({ logger, format: ':method :url :status' }), { label: 'custom', handler: customMiddleware }],
});
```

Use `beforeMiddlewares` for middleware that must prime state before helmet and the `middlewares` array run. The execution-context middleware is the motivating case:

```typescript
const app = createExpressApp({
  logger,
  beforeMiddlewares: [{ label: 'execution-context', handler: executionContext() }],
});
```

## API reference

The barrel re-exports the app factory, the morgan helper, the middleware identifier enum, the error codes enum, the server helper, and the inbound request logger.

### buildDefaultMiddlewares

Returns the two default middleware entries for `createExpressApp`, each labeled with a `MiddlewareIdentifier` value. The returned array carries the caller's logger into both entries, so morgan writes to that logger instead of the module-load-time `getLogger()` result.

```typescript
function buildDefaultMiddlewares(options: BuildDefaultMiddlewaresOptions): MiddlewareEntry[];
```

The entries are the inbound request logger, labeled `inbound-request-logger`, and the morgan middleware, labeled `morgan`.

### BuildDefaultMiddlewaresOptions

```typescript
interface BuildDefaultMiddlewaresOptions {
  logger: Logger;
  format: string;
}
```

The `logger` field is the logger both entries write to. The `format` field is the morgan format string.

### createExpressApp

Creates an Express `Application` with helmet, the inbound request logger, and morgan already registered. Every option has a default.

```typescript
function createExpressApp(options?: Partial<CreateExpressOptions>): Application;
```

The merge drops any option whose value is `undefined`. A partial options object therefore overrides only the fields it sets, and an explicit `undefined` behaves like an omitted field.

### CreateExpressOptions

| Option              | Type                | Default                 | Description                                                                                       |
| ------------------- | ------------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| `helmet`            | `boolean`           | `true`                  | Adds helmet security headers.                                                                     |
| `logger`            | `Logger`            | `getLogger()`           | Receives the lifecycle and request events.                                                        |
| `beforeMiddlewares` | `MiddlewareEntry[]` | `[]`                    | Entries registered before helmet and `middlewares`. No default entries.                           |
| `middlewares`       | `MiddlewareEntry[]` | inbound logger + morgan | Entries registered after helmet. A provided array replaces the defaults entirely.                 |
| `morganFormat`      | `string`            | `MORGAN_DEFAULT_FORMAT` | Morgan format used by the default morgan entry. Ignored when `middlewares` replaces the defaults. |

The `beforeMiddlewares` array exists so a middleware that primes shared state runs before everything else. The `middlewares` array then runs in order, one entry at a time.

### createMorganMiddleware

Creates a morgan request-logging middleware that writes each completion line to the given logger through a custom stream. The package never writes to stdout.

```typescript
function createMorganMiddleware(options?: Partial<CreateMorganOptions>): RequestHandler;
```

As with `createExpressApp`, the merge drops options whose value is `undefined`.

### CreateMorganOptions

```typescript
interface CreateMorganOptions {
  format: string;
  logger: Logger;
}
```

The `format` field defaults to `MORGAN_DEFAULT_FORMAT`. The `logger` field defaults to the module-load-time `getLogger()` result.

### ExpressToolsErrorCodes

The error codes this package raises:

```typescript
enum ExpressToolsErrorCodes {
  SERVER_LISTEN_FAILED = 'SERVER_LISTEN_FAILED',
}
```

`SERVER_LISTEN_FAILED` covers a failed `server.listen()` call, such as `EADDRINUSE` or `EACCES`. The `details` object carries the requested `port` and the original `originalCode`. The original error is the `cause`.

### LabeledMiddleware

Pairs a middleware handler with the name used in the registration log. An entry in either ordered array is a bare `RequestHandler` or a `LabeledMiddleware`.

```typescript
interface LabeledMiddleware {
  readonly label: string;
  readonly handler: RequestHandler;
}
```

A labeled entry logs its `label` at registration. An unlabeled entry logs its index instead.

### MiddlewareEntry

```typescript
type MiddlewareEntry = RequestHandler | LabeledMiddleware;
```

### MiddlewareIdentifier

The labels this package gives its own middleware:

```typescript
enum MiddlewareIdentifier {
  InboundRequestLogger = 'inbound-request-logger',
  Morgan = 'morgan',
}
```

These values name the two entries `buildDefaultMiddlewares` returns.

### MORGAN_DEFAULT_FORMAT

The morgan format string `createMorganMiddleware` and `createExpressApp` use by default:

```typescript
const MORGAN_DEFAULT_FORMAT = ':method :url :status :response-time ms';
```

### startServer

Starts an HTTP server for the given app on the given port. The promise resolves once the server is bound and rejects on any listen failure.

```typescript
function startServer(app: Application, port: number): Promise<StartServerResult>;
```

Pass port `0` to let the operating system pick a free port. Read the assigned port off the result. Every rejection is a `DetailedError` whose code is `SERVER_LISTEN_FAILED`. Both an asynchronous `error` event and a synchronous throw from `server.listen()` map to that code.

### StartServerResult

```typescript
interface StartServerResult {
  port: number;
  server: Server;
}
```

The `port` field is the bound port, which differs from the requested one when you pass `0`. Close the `server` field when the test or process finishes.

### useInboundRequestLogger

Registers the inbound request logger on an app you built by hand. `createExpressApp` already registers it, so call this only for a hand-built app.

```typescript
function useInboundRequestLogger(app: Application, logger: Logger): void;
```

Register it after the execution-context middleware. Both halves of the request trace then carry the same correlation id and request id.

## Related packages

- [`@couimet/logger-contract`](https://github.com/couimet/ts-npm-packages/tree/main/packages/logger-contract) defines the `Logger` interface this package logs through.
- [`@couimet/detailed-error`](https://github.com/couimet/ts-npm-packages/tree/main/packages/detailed-error) provides the `DetailedError` type `startServer` rejects with.
- [`@couimet/express-tools-testing`](https://github.com/couimet/ts-npm-packages/tree/main/packages/express-tools-testing) starts a test server from `createExpressApp` for route-level tests.
- [`@couimet/execution-context-http-express`](https://github.com/couimet/ts-npm-packages/tree/main/packages/execution-context-http-express) layers the execution-context middleware on top of `createExpressApp`.

## License

MIT
