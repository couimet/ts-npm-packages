# @couimet/logger-contract-adapters

[![npm version](https://img.shields.io/npm/v/@couimet/logger-contract-adapters.svg?style=flat-square)](https://www.npmjs.com/package/@couimet/logger-contract-adapters) [![Coverage](https://codecov.io/gh/couimet/ts-npm-packages/branch/main/graph/badge.svg?flag=logger-contract-adapters)](https://codecov.io/gh/couimet/ts-npm-packages?flag=logger-contract-adapters) [![npm downloads](https://img.shields.io/npm/dm/@couimet/logger-contract-adapters.svg?style=flat-square)](https://www.npmjs.com/package/@couimet/logger-contract-adapters)

Logger adapters that bridge `@couimet/logger-contract` with popular logging libraries. Provides a zero-dependency `ConsoleLogger` plus adapters for the most widely used Node.js loggers.

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

## Adapters

### ConsoleLogger

Zero dependencies. Uses `console.debug/info/warn/error` as sinks. Context is serialized as JSON with `fn` ordered first.

```typescript
import { setLogger } from '@couimet/logger-contract';
import { ConsoleLogger } from '@couimet/logger-contract-adapters';

// At application startup:
setLogger(new ConsoleLogger());
```

### WinstonAdapter

Wraps a winston `Logger` instance. Passes context as log metadata.

```typescript
import { createLogger, transports } from 'winston';
import { WinstonAdapter } from '@couimet/logger-contract-adapters';

const winstonLogger = createLogger({ transports: [new transports.Console()] });
setLogger(new WinstonAdapter(winstonLogger));
```

### PinoAdapter

Wraps a pino `Logger` instance. Passes context as structured log fields.

```typescript
import pino from 'pino';
import { PinoAdapter } from '@couimet/logger-contract-adapters';

const pinoLogger = pino();
setLogger(new PinoAdapter(pinoLogger));
```

### Log4jsAdapter

Wraps a log4js `Logger` instance.

```typescript
import log4js from 'log4js';
import { Log4jsAdapter } from '@couimet/logger-contract-adapters';

const log4jsLogger = log4js.getLogger();
setLogger(new Log4jsAdapter(log4jsLogger));
```

## Custom adapters

The built-in adapters run every context through `normalizeContext` before handing it to the underlying logger. That is what turns an `Error` value into a plain, JSON-serializable object instead of one whose `message` and `stack` a backend silently drops, because those properties are not enumerable and are skipped by typical serialization. A custom adapter for a logger the package does not cover should normalize the same way, and both helpers are exported for exactly that:

```typescript
normalizeContext(ctx: LoggingContext): LoggingContext
normalizeError(value: unknown): unknown
```

`normalizeError(value)` returns `value` unchanged unless it is an `Error`, in which case it returns a plain object carrying the error's `name`, `message`, and `stack`, plus any own enumerable properties the error was extended with, such as a `code`. `normalizeContext(ctx)` returns a new context object whose values have each been passed through `normalizeError`; the input context is left untouched.

A custom adapter implements `Logger` from `@couimet/logger-contract` and, in each level method, passes the normalized context where the wrapped backend expects it. Mirror what the built-in adapters do:

```typescript
import { normalizeContext } from '@couimet/logger-contract-adapters';
import type { Logger, LoggingContext } from '@couimet/logger-contract';

class CustomAdapter implements Logger {
  // constructor stores the wrapped backend; error() shown, debug/info/warn mirror it
  error(ctx: LoggingContext, message: string): void {
    this.backend.error(message, normalizeContext(ctx));
  }
}
```

## The `initLogger()` pattern

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

This pattern keeps the adapter package focused on implementations and lets each application decide how to bootstrap its logger.

## Testing

For testing code that depends on the logger contract, use [`@couimet/logger-contract-testing`](https://github.com/couimet/ts-npm-packages) which provides zero-setup mock factories for Jest.

## License

MIT
