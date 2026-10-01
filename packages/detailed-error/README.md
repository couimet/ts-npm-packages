# @couimet/detailed-error

[![npm version](https://img.shields.io/npm/v/@couimet/detailed-error)](https://www.npmjs.com/package/@couimet/detailed-error) [![npm downloads](https://img.shields.io/npm/dm/@couimet/detailed-error)](https://www.npmjs.com/package/@couimet/detailed-error) [![Coverage](https://codecov.io/gh/couimet/ts-npm-packages/branch/main/graph/badge.svg?flag=detailed-error)](https://codecov.io/gh/couimet/ts-npm-packages?flags%5B0%5D=detailed-error)

`DetailedError` is a base class for errors that carry a machine-readable code. The `code` field is generic, so a project can subclass the class with its own error-codes enum and get compiler-checked codes. A caller that needs no enum can use `DetailedError<string>` directly. Every instance carries the fields a log line or an error tracker consumes: `code`, `functionName`, and a `details` bag. The class extends the native `Error`, so `instanceof` checks, the `cause` chain, and the stack trace keep working.

## Install

```bash
pnpm add @couimet/detailed-error
```

## Usage

Define an error-codes enum, subclass `DetailedError` with it, and the compiler enforces valid codes:

```typescript
import { DetailedError, ErrorOptions, SharedErrorCodes } from '@couimet/detailed-error';

enum MyCodes {
  BAD_INPUT = 'BAD_INPUT',
  TIMEOUT = 'TIMEOUT',
}

class MyError extends DetailedError<MyCodes | SharedErrorCodes> {
  constructor(options: ErrorOptions<MyCodes | SharedErrorCodes>) {
    super(options);
    this.name = 'MyError';
  }
}

throw new MyError({
  code: MyCodes.TIMEOUT,
  message: 'The upstream service did not answer in time',
  functionName: 'fetchQuote',
  details: { timeoutMs: 5000 },
});
```

`DetailedError` does not assign `name` itself, so `error.name` stays `Error` until a subclass assigns its own name, as `MyError` does above.

Use `DetailedError<string>` directly when a project holds no codes enum:

```typescript
import { DetailedError } from '@couimet/detailed-error';

throw new DetailedError({ code: 'SOMETHING_WRONG', message: 'Something went wrong' });
```

Build an error for the unexpected branch of a `switch` with the `forUnexpectedSwitchDefault` factory:

```typescript
switch (status) {
  case 'open':
    return handleOpen();
  case 'closed':
    return handleClosed();
  default:
    throw MyError.forUnexpectedSwitchDefault('status', status, 'handleStatus');
}
```

## How it works

The constructor copies the `details` bag rather than holding the caller's object. The copy is deep, so a later mutation of the caller's object does not reach the error. The copy walks the object graph with a `WeakMap`, so a circular reference terminates and a shared reference stays shared rather than duplicated. An `Error` value inside `details` becomes a plain object. That object carries `name`, `message`, and `stack`, plus `cause` when the error sets one, plus the error's own enumerable properties. Copying an error this way keeps its message and stack through a `JSON.stringify` call, which the non-enumerable native properties would otherwise lose.

The `cause` option goes to the native `Error` constructor, so a caller reads it from `error.cause` and walks the error-cause chain. The class declares no separate `cause` field.

When the runtime provides `Error.captureStackTrace`, the constructor calls it with `new.target`. The stack trace then starts at the caller's frame and omits the `DetailedError` and subclass constructor frames.

The constructor rejects bad arguments with a `TypeError`. It rejects a non-object options argument, a non-string `code`, a non-string `message`, a non-string `functionName`, and a non-object `details`. Those arguments are programming errors, so they fail at the throw site rather than surface later as a confusing assertion failure.

## API reference

### DetailedError

```typescript
type ErrorDetails = { readonly [key: string]: unknown };

type ErrorOptions<T extends string> = {
  readonly code: T;
  readonly message: string;
  readonly functionName?: string;
  readonly details?: ErrorDetails;
  readonly cause?: unknown;
};

class DetailedError<T extends string> extends Error {
  readonly code: T;
  readonly functionName?: string;
  readonly details?: ErrorDetails;

  constructor(errorOptions: ErrorOptions<T>);

  static forUnexpectedSwitchDefault<T extends string, C extends new (...args: any[]) => DetailedError<T>>(
    this: C,
    label: string,
    value: unknown,
    functionName: string,
    options?: { message?: string; extraDetails?: ErrorDetails; code?: NoInfer<T> },
  ): InstanceType<C>;
}
```

- `ErrorDetails` is the type of the `details` bag, a read-only record of unknown values.
- `ErrorOptions<T>` is the type of the single constructor argument. `code` and `message` are required, and `functionName`, `details`, and `cause` are optional.
- `constructor(errorOptions)` stores `code`, `functionName`, and the cloned `details`, and forwards `cause` to the native `Error` constructor when `cause` is defined. It throws a `TypeError` for a non-object argument, for a non-string `code` or `message`, for a `functionName` that is present and not a string, and for a `details` that is present and not an object.
- `code` holds the error code. The type parameter `T` narrows it to the enum or to `string`.
- `functionName` names the function where the error occurred, and it is `undefined` when the caller omits it.
- `details` holds the cloned context bag, and it is `undefined` when the caller omits it.
- `forUnexpectedSwitchDefault(label, value, functionName, options?)` builds the error for an unreachable `switch` branch. The code defaults to `SharedErrorCodes.UNEXPECTED_SWITCH_VALUE`, and `options.code` overrides it. The message defaults to `` `Unexpected ${label}: ${JSON.stringify(value)}` ``, and `options.message` overrides it. The `details` bag carries `options.extraDetails` plus an `unexpectedValue` key holding `value`. The `value` argument wins over an `unexpectedValue` key inside `extraDetails`. Called on a subclass, the factory returns an instance of that subclass.

### SharedErrorCodes

Codes that any project can reuse:

```typescript
enum SharedErrorCodes {
  UNEXPECTED_CODE_PATH = 'UNEXPECTED_CODE_PATH',
  UNEXPECTED_SWITCH_VALUE = 'UNEXPECTED_SWITCH_VALUE',
  UNKNOWN = 'UNKNOWN',
  VALIDATION = 'VALIDATION',
}
```

`UNEXPECTED_CODE_PATH` marks a code path that should be unreachable when the case is too narrow for its own code. `UNEXPECTED_SWITCH_VALUE` marks a `switch` that received an unexpected value, and `forUnexpectedSwitchDefault` uses it by default. `UNKNOWN` is the catch-all. `VALIDATION` marks input from an external source that failed validation.

Merge the shared codes with a project enum to type both in one parameter. The spread order matters, because the later spread wins. Spread `SharedErrorCodes` first, so a duplicate key in it does not override the project value.

```typescript
const Codes = { ...SharedErrorCodes, ...MyCodes };
type Codes = MyCodes | SharedErrorCodes;
```

## Related packages

- [`@couimet/detailed-result`](https://github.com/couimet/ts-npm-packages/tree/main/packages/detailed-result) provides the Result type whose invariant violations throw a `DetailedError`.
- [`@couimet/detailed-error-testing`](https://github.com/couimet/ts-npm-packages/tree/main/packages/detailed-error-testing) provides Jest matchers that assert on `DetailedError` instances by `code`, `message`, `functionName`, `details`, and `cause`.

## License

MIT
