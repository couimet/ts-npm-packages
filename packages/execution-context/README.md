# @couimet/execution-context

[![npm version](https://img.shields.io/npm/v/@couimet/execution-context.svg?style=flat-square)](https://www.npmjs.com/package/@couimet/execution-context) [![Coverage](https://codecov.io/gh/couimet/ts-npm-packages/branch/main/graph/badge.svg?flag=execution-context)](https://codecov.io/gh/couimet/ts-npm-packages?flag=execution-context) [![npm downloads](https://img.shields.io/npm/dm/@couimet/execution-context.svg?style=flat-square)](https://www.npmjs.com/package/@couimet/execution-context)

`ExecutionContext.run()` opens a scope that carries a correlation id, a request id, and an attribute bag. Code inside the scope, including work resumed after `await`, reads the same ids and attributes. The scope follows OpenTelemetry's context propagation, which `AsyncLocalStorage` carries across async boundaries. `run()` pins a provided id and generates a fresh one when a field is `undefined` or blank. Typical priming sites are an application bootstrap, a middleware that scopes one HTTP request, and a timer that scopes one scheduled run.

## Install

```bash
pnpm add @couimet/execution-context
```

The package declares `@opentelemetry/api` and `@couimet/detailed-error` as peer dependencies, and pnpm or npm installs them automatically. The `AsyncLocalStorage` context manager that `run()` relies on ships as the direct dependency `@opentelemetry/context-async-hooks`.

## Usage

```typescript
import { CorrelationId, ExecutionContext } from '@couimet/execution-context';

ExecutionContext.run({ correlationId: 'my-job', requestId: 'abc-123', attributes: { userId: 'u-42' } }, () => {
  const id = ExecutionContext.correlationId.toString(); // 'my-job'
  ExecutionContext.addAttributes({ attempt: 2 });
  // awaited work below still reads this scope
});

ExecutionContext.isActive(); // false, once the run has returned
```

Pass an id to pin it. Pass `undefined` or a blank string, and `run()` generates a fresh one through `fromStringOrCreate()`. An explicit blank passed to `fromString()` throws instead. A nested `run()` starts a fresh scope, so it does not inherit the outer ids unless the caller passes them in.

## How it works

A `run()` executes its callback inside a new OpenTelemetry context. It first builds a store that holds a `CorrelationId`, a `RequestId`, and an attribute bag. Then it installs that store on the active context and runs the callback. When the callback returns or throws, the previous context is restored. Sibling `run()` calls therefore never see each other's values.

The callback may be sync or async. `run` returns whatever the callback returns. An async callback's awaited work still reads the same context, because `AsyncLocalStorage` propagates the context through the async chain. One request id can therefore follow a log line emitted deep inside an awaited service call.

The package installs the OpenTelemetry global context manager exactly once. The first `run()` performs the install lazily. Callers that never `run` can still install the manager up front with `ensureContextManagerInitialized()`. The global manager can be set only once, and another component may already own the slot. When it does, `run()` and `ensureContextManagerInitialized()` throw a `DetailedError` with code `CONTEXT_MANAGER_REGISTRATION_FAILED` rather than propagate ids through a manager this package cannot verify.

## API reference

The barrel re-exports four modules: `ExecutionContext`, the `CorrelationId` and `RequestId` value objects, and the `ExecutionContextErrorCodes` enum.

### CorrelationId

An opaque value object that wraps a correlation id string. The wrapped value is private, so `toString()` is the only way to read it. Compare two ids through their `toString()` results, not by reference.

```typescript
class CorrelationId {
  static create(): CorrelationId;
  static fromString(value: string): CorrelationId;
  static fromStringOrCreate(value: string | undefined): CorrelationId;
  toString(): string;
}
```

- `create()` returns a fresh id from a UUID v4.
- `fromString(value)` wraps `value` when it is non-blank. Otherwise it throws a `DetailedError` with code `INVALID_BLANK_CORRELATION_ID`, message `correlationId must be a non-blank string`, and `functionName` `CorrelationId.fromString`. The `details` carry the offending value. A non-primitive value is rejected by the shared string guard with code `INVALID_STRING_TYPE`.
- `fromStringOrCreate(value)` never throws for a primitive string or `undefined`. A non-blank value is pinned through `fromString`, a blank or missing value falls back to `create()`, and a non-primitive value is rejected by the shared string guard with code `INVALID_STRING_TYPE`.
- `toString()` returns the wrapped string.

### ExecutionContext

A static-only runner whose constructor is private. Every member reads or writes the store active on the current OpenTelemetry context.

```typescript
type ContextAttributes = Record<string, unknown>;

interface RunParams {
  readonly correlationId: string | undefined;
  readonly requestId: string | undefined;
  readonly attributes?: ContextAttributes;
}

class ExecutionContext {
  static ensureContextManagerInitialized(): void;
  static run<T>(data: RunParams, fn: () => T): T;
  static isActive(): boolean;
  static get correlationId(): CorrelationId;
  static get requestId(): RequestId;
  static getAttribute(key: string): unknown;
  static addAttributes(attrs: ContextAttributes): void;
  static getAttributes(): ContextAttributes;
}
```

- `ensureContextManagerInitialized()` installs the OpenTelemetry `AsyncLocalStorage` context manager as the global manager. It is idempotent, so a second call is a no-op. `run()` calls it automatically on first use. It throws a `DetailedError` with code `CONTEXT_MANAGER_REGISTRATION_FAILED` when another component already owns the global manager slot.
- `run<T>(data, fn)` primes a fresh store and runs `fn` inside that context. Both ids go through `fromStringOrCreate`, and attributes default to `{}`. Attributes that are null, an array, or not an object throw a `DetailedError` with code `INVALID_CONTEXT_ATTRIBUTES`. It returns whatever `fn` returns. Anything previously active is replaced for the duration of `fn`, then restored when `fn` returns or throws.
- `isActive()` returns true when the current code is executing inside a `run` block.
- The `correlationId` and `requestId` getters return the primed id. Called outside a run, they throw a `DetailedError` with code `NO_ACTIVE_CONTEXT`.
- `getAttribute(key)` returns the stored attribute for `key`, or `undefined` when the key is absent or no scope is active.
- `addAttributes(attrs)` merges `attrs` into the active attribute bag, with later keys winning. Attributes that are null, an array, or not an object throw a `DetailedError` with code `INVALID_CONTEXT_ATTRIBUTES` before the merge. It replaces the bag object, so a reference captured earlier does not see the merge. It is a no-op when no scope is active.
- `getAttributes()` returns the active attribute bag, which is the live bag rather than a copy. It returns `{}` when no scope is active.

### ExecutionContextErrorCodes

Error codes used by the `DetailedError` instances that this package throws:

```typescript
enum ExecutionContextErrorCodes {
  INVALID_BLANK_CORRELATION_ID = 'INVALID_BLANK_CORRELATION_ID',
  INVALID_BLANK_REQUEST_ID = 'INVALID_BLANK_REQUEST_ID',
  NO_ACTIVE_CONTEXT = 'NO_ACTIVE_CONTEXT',
  CONTEXT_MANAGER_REGISTRATION_FAILED = 'CONTEXT_MANAGER_REGISTRATION_FAILED',
  INVALID_CONTEXT_ATTRIBUTES = 'INVALID_CONTEXT_ATTRIBUTES',
  INVALID_STRING_TYPE = 'INVALID_STRING_TYPE',
}
```

`fromString` on either id throws `INVALID_BLANK_CORRELATION_ID` or `INVALID_BLANK_REQUEST_ID`. The two getters throw `NO_ACTIVE_CONTEXT`. `ensureContextManagerInitialized()` throws `CONTEXT_MANAGER_REGISTRATION_FAILED` when another component already owns the global context manager slot. `run()` and `addAttributes()` throw `INVALID_CONTEXT_ATTRIBUTES` when attributes are null, an array, or not an object. `fromString` and `fromStringOrCreate` on either id throw `INVALID_STRING_TYPE` when the value is not a primitive string, such as a boxed `String`. Every error is a `DetailedError` from [`@couimet/detailed-error`](https://github.com/couimet/ts-npm-packages/tree/main/packages/detailed-error).

### RequestId

Identical in shape to `CorrelationId`, holding a request id string:

```typescript
class RequestId {
  static create(): RequestId;
  static fromString(value: string): RequestId;
  static fromStringOrCreate(value: string | undefined): RequestId;
  toString(): string;
}
```

The behavior matches `CorrelationId`, with `INVALID_BLANK_REQUEST_ID` thrown by `fromString` on a blank value and `INVALID_STRING_TYPE` thrown when the value is not a primitive string.

## Package family

`@couimet/execution-context` holds only the scope machinery. It ships the `ExecutionContext` runner, the `CorrelationId` and `RequestId` value objects, the attribute-bag types, and `ExecutionContextErrorCodes`. It carries no knowledge of HTTP or of any framework.

Companion packages group the transport and framework concerns, and each carries its integration in the package name. One companion exists today:

- `@couimet/execution-context-http` exports the wire header names (`x-correlation-id`, `x-request-id`) as the `HttpHeaders` enum. It has no framework dependency.

Future framework adapters follow the same shape. The adapter reads the two header names from `@couimet/execution-context-http`, pulls the ids off an incoming request, and calls `ExecutionContext.run()` with them. Each adapter lives in its own package, such as `@couimet/execution-context-http-middy` or `@couimet/execution-context-http-koa`. The core package never depends on a framework.

## License

MIT
