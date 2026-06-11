# @couimet/logger-contract

A logging interface contract for TypeScript. Libraries depend on this package without committing consumers to any particular logging framework.

## Install

```bash
pnpm add @couimet/logger-contract
```

## Overview

`@couimet/logger-contract` defines a `Logger` interface, a no-op default, and a global registry. It is the single package in the dependency tree that knows what log levels and what context shape exist. Every concrete logger (console-based, structured, test-double) implements the same contract, so code that logs never couples to a specific implementation.

The package has zero runtime dependencies and ships the `Logger` interface, `LoggingContext` type, `NoOpLogger` class, a global registry (`setLogger`/`getLogger`), and `pingLog`.

## API

### `Logger` interface

```typescript
interface Logger {
  debug(ctx: LoggingContext, message: string): void;
  info(ctx: LoggingContext, message: string): void;
  warn(ctx: LoggingContext, message: string): void;
  error(ctx: LoggingContext, message: string): void;
}
```

### `LoggingContext`

A record of key-value pairs attached to every log line. The only required key is `fn` (the function name).

```typescript
interface LoggingContext {
  fn: string;
  [key: string]: unknown;
}
```

### `NoOpLogger`

Default implementation that silently discards all messages. Used until a real logger is registered.

```typescript
import { NoOpLogger } from '@couimet/logger-contract';

const logger = new NoOpLogger();
logger.info({ fn: 'main' }, 'This is discarded');
```

### Global registry

```typescript
import { setLogger, getLogger } from '@couimet/logger-contract';

// At application startup:
setLogger(new MyLogger());

// Anywhere in the codebase:
const logger = getLogger();
logger.info({ fn: 'processData', userId: 123 }, 'Processing data');
```

### `pingLog()`

Smoke-test utility that exercises all four log levels. Useful for verifying the logger is wired correctly after initialization.

```typescript
import { pingLog } from '@couimet/logger-contract';

pingLog();
// Emits one message at each level (DEBUG, INFO, WARN, ERROR)
```

## Implementing the contract

A concrete logger implements the `Logger` interface and can be any backend: console, structured JSON, OpenTelemetry exporter, or a test spy.

```typescript
import { Logger, LoggingContext } from '@couimet/logger-contract';

class ConsoleLogger implements Logger {
  debug(ctx: LoggingContext, message: string) {
    console.debug('[DEBUG]', message, ctx);
  }
  info(ctx: LoggingContext, message: string) {
    console.info('[INFO]', message, ctx);
  }
  warn(ctx: LoggingContext, message: string) {
    console.warn('[WARN]', message, ctx);
  }
  error(ctx: LoggingContext, message: string) {
    console.error('[ERROR]', message, ctx);
  }
}
```

## Testing

For testing code that depends on this contract, use [`@couimet/logger-contract-testing`](https://github.com/couimet/ts-npm-packages) which provides zero-setup mock factories for Jest.

## License

MIT
