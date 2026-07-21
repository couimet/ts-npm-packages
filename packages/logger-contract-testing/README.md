# @couimet/logger-contract-testing

[![npm version](https://img.shields.io/npm/v/@couimet/logger-contract-testing.svg?style=flat-square)](https://www.npmjs.com/package/@couimet/logger-contract-testing) [![npm downloads](https://img.shields.io/npm/dm/@couimet/logger-contract-testing.svg?style=flat-square)](https://www.npmjs.com/package/@couimet/logger-contract-testing)

Zero-setup mock-logger factories for tests written against [`@couimet/logger-contract`](https://github.com/couimet/ts-npm-packages/tree/main/packages/logger-contract).

## Install

```bash
pnpm add -D @couimet/logger-contract-testing
```

## Overview

`@couimet/logger-contract-testing` provides `createMockLogger()`, a factory that returns a `Logger` whose four methods (`debug`, `info`, `warn`, `error`) are all `jest.fn()` stubs. Drop it into a `beforeEach` and assert on log calls with standard Jest matchers — no manual mock wiring.

## Quick start

```typescript
import { createMockLogger } from '@couimet/logger-contract-testing';
import { setLogger } from '@couimet/logger-contract';

describe('MyService', () => {
  let logger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    logger = createMockLogger();
    setLogger(logger);
  });

  it('logs on startup', () => {
    new MyService();

    expect(logger.info).toHaveBeenCalledWith({ fn: 'MyService' }, 'Service started');
  });
});
```

## API

### `createMockLogger(): Logger`

Returns a `Logger` where `debug`, `info`, `warn`, and `error` are each `jest.fn()`. The returned object satisfies the `Logger` interface, so it can be passed anywhere a `Logger` is expected (including `setLogger`).

## Common patterns

### Asserting log context

```typescript
// Strict — exact match on the full context object
expect(logger.warn).toHaveBeenCalledWith({ fn: 'processData', userId: 123 }, 'Disk space below 10%');

// Loose — partial match when only some keys matter
expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ userId: 123 }), expect.any(String));
```

### Checking log messages

```typescript
expect(logger.warn).toHaveBeenCalledWith(expect.any(Object), 'Disk space below 10%');
```

### Verifying no logs

```typescript
expect(logger.error).not.toHaveBeenCalled();
expect(logger.warn).not.toHaveBeenCalled();
```

### Inspecting all calls

```typescript
const calls = (logger.info as jest.Mock).mock.calls;
expect(calls).toHaveLength(3);
expect(calls[0][1]).toBe('First message');
```

## Related

- [`@couimet/logger-contract`](https://github.com/couimet/ts-npm-packages/tree/main/packages/logger-contract) — the logging interface contract this package mocks

## License

MIT
