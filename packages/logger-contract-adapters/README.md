# @couimet/logger-contract-adapters

[![npm version](https://img.shields.io/npm/v/@couimet/logger-contract-adapters)](https://www.npmjs.com/package/@couimet/logger-contract-adapters) [![npm downloads](https://img.shields.io/npm/dm/@couimet/logger-contract-adapters)](https://www.npmjs.com/package/@couimet/logger-contract-adapters) [![Coverage](https://codecov.io/gh/couimet/ts-npm-packages/branch/main/graph/badge.svg?flag=logger-contract-adapters)](https://codecov.io/gh/couimet/ts-npm-packages?flags%5B0%5D=logger-contract-adapters)

Adapters that connect [`@couimet/logger-contract`](https://github.com/couimet/ts-npm-packages/tree/main/packages/logger-contract) to the widely used Node.js loggers. The package ships `ConsoleLogger`, which needs no external dependency, plus adapters for winston, pino, and log4js. Application code calls `getLogger()` from the contract package, so an application can swap the backend without a change at any call site.

## Install

```bash
pnpm add @couimet/logger-contract-adapters
```

Each external logger (winston, pino, log4js) is an optional peer dependency. Install only the one you need:

```bash
pnpm add winston   # if using WinstonAdapter
pnpm add pino      # if using PinoAdapter
pnpm add log4js    # if using Log4jsAdapter
```

## Usage

Register one adapter at application startup with `setLogger` from the contract package:

```typescript
import { setLogger } from '@couimet/logger-contract';
import { ConsoleLogger } from '@couimet/logger-contract-adapters';

setLogger(new ConsoleLogger());
```

`WinstonAdapter` wraps a winston `Logger` instance and passes the context as log metadata:

```typescript
import { createLogger, transports } from 'winston';
import { setLogger } from '@couimet/logger-contract';
import { WinstonAdapter } from '@couimet/logger-contract-adapters';

const winstonLogger = createLogger({ transports: [new transports.Console()] });
setLogger(new WinstonAdapter(winstonLogger));
```

`PinoAdapter` wraps a pino `Logger` instance and passes the context as structured log fields:

```typescript
import pino from 'pino';
import { setLogger } from '@couimet/logger-contract';
import { PinoAdapter } from '@couimet/logger-contract-adapters';

const pinoLogger = pino();
setLogger(new PinoAdapter(pinoLogger));
```

`Log4jsAdapter` wraps a log4js `Logger` instance:

```typescript
import log4js from 'log4js';
import { setLogger } from '@couimet/logger-contract';
import { Log4jsAdapter } from '@couimet/logger-contract-adapters';

const log4jsLogger = log4js.getLogger();
setLogger(new Log4jsAdapter(log4jsLogger));
```

Each adapter is a standalone class with no opinion on how you register it. Downstream projects typically create a thin `initLogger()` wrapper that wires the adapter into the global logger contract:

```typescript
// src/logger.ts (in your application)
import { setLogger } from '@couimet/logger-contract';
import { ConsoleLogger } from '@couimet/logger-contract-adapters';

export const initLogger = (): void => {
  setLogger(new ConsoleLogger());
};
```

```typescript
// src/index.ts (your entry point)
import { initLogger } from './logger';

initLogger();
// All code that calls getLogger() now uses ConsoleLogger
```

That wrapper keeps this package focused on implementations and lets each application decide how to bootstrap its logger.

## How it works

Every adapter runs the context through `normalizeContext` before it hands the context to the underlying logger. The normalization is what turns an `Error` value into a plain object. The `message` and `stack` of an error are not enumerable, so typical serialization skips them, while a plain object keeps them.

The adapters differ in who serializes the normalized context. `ConsoleLogger` serializes it itself, with a serializer built on `safe-stable-stringify`. That serializer places `fn` first, tolerates bigint and circular values, and writes them as JSON. The winston, pino, and log4js adapters instead hand the object to the wrapped backend serializer. A bigint or circular member must therefore stay away from the contexts those three log.

The adapters also differ in argument order. `PinoAdapter` passes the context first and the message second, because pino reads the first argument as the structured fields. `WinstonAdapter` and `Log4jsAdapter` pass the message first and the context second.

## API reference

The barrel re-exports six modules: `ConsoleLogger`, `Log4jsAdapter`, `PinoAdapter`, `WinstonAdapter`, `normalizeContext`, and `normalizeError`. Every adapter implements the `Logger` interface from `@couimet/logger-contract`, so each one carries the four level methods `debug`, `info`, `warn`, and `error`, in that order, each taking a `LoggingContext` and a `string`.

### ConsoleLogger

```typescript
class ConsoleLogger implements Logger {
  debug(ctx: LoggingContext, message: string): void;
  info(ctx: LoggingContext, message: string): void;
  warn(ctx: LoggingContext, message: string): void;
  error(ctx: LoggingContext, message: string): void;
}
```

Takes no constructor argument. Each level method writes one pre-formatted string to the matching console method (`console.debug`, `console.info`, `console.warn`, `console.error`). The string reads `[LEVEL] <context as JSON> <message>`, and the context JSON places `fn` first.

### Log4jsAdapter

```typescript
class Log4jsAdapter implements Logger {
  constructor(logger: Log4jsLogger);
  debug(ctx: LoggingContext, message: string): void;
  info(ctx: LoggingContext, message: string): void;
  warn(ctx: LoggingContext, message: string): void;
  error(ctx: LoggingContext, message: string): void;
}
```

Wraps a log4js `Logger`. Each level method calls the matching method on the wrapped logger with the message first and the normalized context second. The constructor throws a plain `Error` when the argument is falsy.

### normalizeContext

```typescript
const normalizeContext: (ctx: LoggingContext) => LoggingContext;
```

Returns a new context whose values have each passed through `normalizeError`. The input context is left untouched. The values are copied by reference, so a bigint or circular member keeps its runtime type.

### normalizeError

```typescript
const normalizeError: (value: unknown) => unknown;
```

Returns `value` unchanged unless it is an `Error`. For an `Error` it returns a plain object carrying the error's `name`, `message`, and `stack`, plus every own enumerable property the error was extended with, such as a `code`. A property already present on the returned object is not overwritten. The properties are copied by reference, so a bigint or circular member keeps its runtime type.

### PinoAdapter

```typescript
class PinoAdapter implements Logger {
  constructor(logger: PinoLogger);
  debug(ctx: LoggingContext, message: string): void;
  info(ctx: LoggingContext, message: string): void;
  warn(ctx: LoggingContext, message: string): void;
  error(ctx: LoggingContext, message: string): void;
}
```

Wraps a pino `Logger`. Each level method calls the matching method on the wrapped logger with the normalized context first and the message second. The constructor throws a plain `Error` when the argument is falsy.

### WinstonAdapter

```typescript
class WinstonAdapter implements Logger {
  constructor(logger: WinstonLogger);
  debug(ctx: LoggingContext, message: string): void;
  info(ctx: LoggingContext, message: string): void;
  warn(ctx: LoggingContext, message: string): void;
  error(ctx: LoggingContext, message: string): void;
}
```

Wraps a winston `Logger`. Each level method calls the matching method on the wrapped logger with the message first and the normalized context second. The constructor throws a plain `Error` when the argument is falsy.

## Writing a custom adapter

A custom adapter for a logger this package does not cover implements `Logger` from `@couimet/logger-contract` and normalizes the context the same way the built-in adapters do. Both helpers are exported for that purpose. In each level method, pass the normalized context where the wrapped backend expects it:

```typescript
import { normalizeContext } from '@couimet/logger-contract-adapters';
import type { Logger, LoggingContext } from '@couimet/logger-contract';

type Backend = {
  debug(message: string, ctx: LoggingContext): void;
  info(message: string, ctx: LoggingContext): void;
  warn(message: string, ctx: LoggingContext): void;
  error(message: string, ctx: LoggingContext): void;
};

class CustomAdapter implements Logger {
  private readonly backend: Backend;

  constructor(backend: Backend) {
    this.backend = backend;
  }

  debug(ctx: LoggingContext, message: string): void {
    this.backend.debug(message, normalizeContext(ctx));
  }

  info(ctx: LoggingContext, message: string): void {
    this.backend.info(message, normalizeContext(ctx));
  }

  warn(ctx: LoggingContext, message: string): void {
    this.backend.warn(message, normalizeContext(ctx));
  }

  error(ctx: LoggingContext, message: string): void {
    this.backend.error(message, normalizeContext(ctx));
  }
}
```

## Related packages

- [`@couimet/logger-contract`](https://github.com/couimet/ts-npm-packages/tree/main/packages/logger-contract) defines the `Logger` interface and the `LoggingContext` type every adapter here implements, and holds the global registry these adapters register into.
- [`@couimet/logger-contract-testing`](https://github.com/couimet/ts-npm-packages/tree/main/packages/logger-contract-testing) provides `createMockLogger()`, a zero-setup Jest factory that returns the same `Logger` shape with `jest.fn()` stubs.

## License

MIT
