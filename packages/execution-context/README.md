# @couimet/execution-context

[![npm version](https://img.shields.io/npm/v/@couimet/execution-context)](https://www.npmjs.com/package/@couimet/execution-context) [![npm downloads](https://img.shields.io/npm/dm/@couimet/execution-context)](https://www.npmjs.com/package/@couimet/execution-context) [![Coverage](https://codecov.io/gh/couimet/ts-npm-packages/branch/main/graph/badge.svg?flag=execution-context)](https://codecov.io/gh/couimet/ts-npm-packages?flags%5B0%5D=execution-context)

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

An application that declares its own attributes keeps the context keys in one registry. `validateAttributes()` turns the entries of one call into the bag, and `withAttributes()` layers a bag over the active scope for the duration of a callback:

```typescript
import { ExecutionContext } from '@couimet/execution-context';

const ATTRIBUTES = {
  attempt: { key: 'attempt' },
  region: {
    key: 'region',
    isValid: (value: unknown): value is string | undefined => value === undefined || (typeof value === 'string' && value.trim() !== ''),
  },
  runId: { key: 'run_id', isValid: (value: unknown): value is string => typeof value === 'string' && value.trim() !== '' },
} as const;

ExecutionContext.run(
  { correlationId: 'my-job', requestId: 'abc-123', attributes: ExecutionContext.validateAttributes(ATTRIBUTES, { region: undefined, runId: 'run-7' }) },
  () => {
    ExecutionContext.getAttribute(ATTRIBUTES.runId); // 'run-7'
    ExecutionContext.getAttribute(ATTRIBUTES.region); // undefined, a writer set it to undefined
    ExecutionContext.getAttribute(ATTRIBUTES.attempt); // throws MISSING_CONTEXT_ATTRIBUTE, no writer set it
    ExecutionContext.findAttribute(ATTRIBUTES.attempt); // undefined, the forgiving read
  },
);
```

`getAttribute()` throws when no writer set the key, so a mistyped key or an unscoped read fails at the first call. `findAttribute()` accepts the same forms and returns `undefined` instead, so an optional attribute needs no guard. A declaration that carries a rule verifies the value on both reads.

Presence is separate from the value. A key that a writer set to `undefined` is present, so `getAttribute()` reads it back as `undefined` rather than throwing. Only a key that no writer set throws `MISSING_CONTEXT_ATTRIBUTE`. A declaration states that intent in its rule, which admits `undefined` or rejects it.

## How it works

A `run()` executes its callback inside a new OpenTelemetry context. It first builds a store that holds a `CorrelationId`, a `RequestId`, and an attribute bag. Then it installs that store on the active context and runs the callback. When the callback returns or throws, the previous context is restored. Sibling `run()` calls therefore never see each other's values.

The callback may be sync or async. `run` returns whatever the callback returns. An async callback's awaited work still reads the same context, because `AsyncLocalStorage` propagates the context through the async chain. One request id can therefore follow a log line emitted deep inside an awaited service call.

The package installs the OpenTelemetry global context manager exactly once. The first `run()` performs the install lazily. Callers that never `run` can still install the manager up front with `ensureContextManagerInitialized()`. The global manager can be set only once, and another component may already own the slot. When it does, `run()` and `ensureContextManagerInitialized()` throw a `DetailedError` with code `CONTEXT_MANAGER_REGISTRATION_FAILED` rather than propagate ids through a manager this package cannot verify.

## API reference

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
  static getAttribute<T>(attribute: ExecutionContextAttribute<T>): T;
  static getAttribute(key: string): unknown;
  static findAttribute<T>(attribute: ExecutionContextAttribute<T>): T | undefined;
  static findAttribute(key: string): unknown;
  static addAttributes(attrs: ContextAttributes): void;
  static getAttributes(): ContextAttributes;
  static withAttributes<T>(attrs: ContextAttributes, fn: () => T): T;
  static validateAttributes<R extends Record<string, ExecutionContextAttribute<unknown>>>(
    registry: R,
    entries: ExecutionContextAttributeValues<R>,
  ): ContextAttributes;
}
```

- `ensureContextManagerInitialized()` installs the OpenTelemetry `AsyncLocalStorage` context manager as the global manager. It is idempotent, so a second call is a no-op. `run()` calls it automatically on first use. It throws a `DetailedError` with code `CONTEXT_MANAGER_REGISTRATION_FAILED` when another component already owns the global manager slot.
- `run<T>(data, fn)` primes a fresh store and runs `fn` inside that context. Both ids go through `fromStringOrCreate`, and attributes default to `{}`. Attributes that are null, an array, or not an object throw a `DetailedError` with code `INVALID_CONTEXT_ATTRIBUTES`. It returns whatever `fn` returns. Anything previously active is replaced for the duration of `fn`, then restored when `fn` returns or throws.
- `isActive()` returns true when the current code is executing inside a `run` block.
- The `correlationId` and `requestId` getters return the primed id. Called outside a run, they throw a `DetailedError` with code `NO_ACTIVE_CONTEXT`.
- `getAttribute(attribute)` and `getAttribute(key)` read one attribute and throw when no writer set the key. A declaration that carries a rule verifies the value before the return, and that rule alone decides whether `undefined` is a legal value. A raw key runs no rule, so its result stays `unknown`. Both forms throw a `DetailedError` with code `MISSING_CONTEXT_ATTRIBUTE` for an absent key. A value that fails its rule throws with code `INVALID_ATTRIBUTE_VALUE`. A key that a writer set to `undefined` is present, and a key inherited from the prototype is never read.
- `findAttribute(attribute)` and `findAttribute(key)` accept the same two forms as `getAttribute`. They return `undefined` instead of throwing `MISSING_CONTEXT_ATTRIBUTE`. They verify a declaration's rule whenever a writer set the key, so only an absent key skips the rule. Use them where an absent attribute is an expected outcome.
- `addAttributes(attrs)` merges `attrs` into the active attribute bag, with later keys winning. Attributes that are null, an array, or not an object throw a `DetailedError` with code `INVALID_CONTEXT_ATTRIBUTES` before the merge. It replaces the bag object, so a reference captured earlier does not see the merge. It is a no-op when no scope is active.
- `getAttributes()` returns the active attribute bag, which is the live bag rather than a copy. It returns `{}` when no scope is active.
- `withAttributes(attrs, fn)` layers `attrs` over the active scope for the duration of `fn`, then removes them. The block keeps the ids it inherited, because the ids are read before the child scope opens. An attribute the block sets itself dies with the block. Work that starts inside the block and finishes after it keeps the layered attributes. Outside any run it throws `NO_ACTIVE_CONTEXT`, and it rejects a bag that is not a record with code `INVALID_CONTEXT_ATTRIBUTES`.
- `validateAttributes(registry, entries)` checks each entry against its own declaration's rule and returns the context bag for the entries. It writes nothing, so no value from a rejected set reaches the store. The entries are keyed by declaration name rather than by context key. It throws a `DetailedError` with code `INVALID_ATTRIBUTE_VALUE` and `{ key, value }` details for a value that fails its rule.

### ExecutionContextAttributes

These two types describe an application's own attributes. The registry holds one declaration per attribute, and each declaration carries the context key it writes under. The registry is therefore the only place a context key appears.

```typescript
interface ExecutionContextAttribute<T> {
  readonly key: string;
  readonly isValid?: (value: unknown) => value is T;
}

type ExecutionContextAttributeValues<R> = {
  readonly [K in keyof R]?: R[K] extends { isValid: (value: unknown) => value is T } ? T : unknown;
};
```

- `ExecutionContextAttribute<T>` declares one attribute. `key` is the context key, and the optional `isValid` is a type predicate that decides which values may enter. A declaration that carries a rule also carries the type of its value, so a reader needs no annotation. A declaration that omits the rule accepts every value. A rule that admits `undefined` makes an undefined value legal, so a writer can set that attribute to `undefined` and a reader gets the value back. Write that predicate inline, because the package ships no combinator for it.
- `ExecutionContextAttributeValues<R>` maps a registry to the entries of one call, each typed by its own declaration's rule. A declaration without a rule takes `unknown`, and a name the registry does not declare is a compile error at the call site.

`validateAttributes()` turns the entries into the bag, so the declaration names stay in the application and the context keys reach the store through one place. The rule gate runs at the write, and no value from a rejected set reaches the store.

### ExecutionContextErrorCodes

Error codes used by the `DetailedError` instances that this package throws:

```typescript
enum ExecutionContextErrorCodes {
  INVALID_ATTRIBUTE_VALUE = 'INVALID_ATTRIBUTE_VALUE',
  INVALID_BLANK_CORRELATION_ID = 'INVALID_BLANK_CORRELATION_ID',
  INVALID_BLANK_REQUEST_ID = 'INVALID_BLANK_REQUEST_ID',
  INVALID_CONTEXT_ATTRIBUTES = 'INVALID_CONTEXT_ATTRIBUTES',
  INVALID_STRING_TYPE = 'INVALID_STRING_TYPE',
  MISSING_CONTEXT_ATTRIBUTE = 'MISSING_CONTEXT_ATTRIBUTE',
  NO_ACTIVE_CONTEXT = 'NO_ACTIVE_CONTEXT',
  CONTEXT_MANAGER_REGISTRATION_FAILED = 'CONTEXT_MANAGER_REGISTRATION_FAILED',
}
```

`fromString` on either id throws `INVALID_BLANK_CORRELATION_ID` or `INVALID_BLANK_REQUEST_ID`. The two getters throw `NO_ACTIVE_CONTEXT`. `ensureContextManagerInitialized()` throws `CONTEXT_MANAGER_REGISTRATION_FAILED` when another component already owns the global context manager slot. `run()`, `addAttributes()`, and `withAttributes()` throw `INVALID_CONTEXT_ATTRIBUTES` when attributes are null, an array, or not an object. `getAttribute()`, `findAttribute()`, and `validateAttributes()` throw `INVALID_ATTRIBUTE_VALUE` when a value fails its declaration's rule. `getAttribute()` throws `MISSING_CONTEXT_ATTRIBUTE` when no writer set the value. `fromString` and `fromStringOrCreate` on either id throw `INVALID_STRING_TYPE` when the value is not a primitive string, such as a boxed `String`. Every error is a `DetailedError` from [`@couimet/detailed-error`](https://github.com/couimet/ts-npm-packages/tree/main/packages/detailed-error).

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

Companion packages group the transport and framework concerns, and each carries its integration in the package name:

- `@couimet/execution-context-http` exports the wire header names (`x-correlation-id`, `x-request-id`) as the `HttpHeaders` enum. It has no framework dependency.
- `@couimet/execution-context-http-express` exports the Express middleware that primes a scope from the two headers.

One testing companion covers the test side:

- `@couimet/execution-context-testing` exports `withTestExecutionContext()`, which opens a scope for a test, and `spyOnAttributeAdditions()`, which returns a Jest spy on `addAttributes()`.

Future framework adapters follow the same shape. The adapter reads the two header names from `@couimet/execution-context-http`, pulls the ids off an incoming request, and calls `ExecutionContext.run()` with them. Each adapter lives in its own package, such as `@couimet/execution-context-http-middy` or `@couimet/execution-context-http-koa`. The core package never depends on a framework.

## License

MIT
