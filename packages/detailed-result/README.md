# @couimet/detailed-result

[![npm version](https://img.shields.io/npm/v/@couimet/detailed-result)](https://www.npmjs.com/package/@couimet/detailed-result) [![npm downloads](https://img.shields.io/npm/dm/@couimet/detailed-result)](https://www.npmjs.com/package/@couimet/detailed-result) [![Coverage](https://codecov.io/gh/couimet/ts-npm-packages/branch/main/graph/badge.svg?flag=detailed-result)](https://codecov.io/gh/couimet/ts-npm-packages?flags%5B0%5D=detailed-result)

`DetailedResult` is a value object holding either a success value or an error. The `success` and `failure` factories build an instance, and the `success` flag names the branch it holds. The type keeps error handling in the return value, so a caller reads the outcome without a `try`/`catch` block. The package pairs with [`@couimet/detailed-error`](https://github.com/couimet/ts-npm-packages/tree/main/packages/detailed-error), which supplies the error type and the invariant errors this class throws.

## Install

```bash
pnpm add @couimet/detailed-result @couimet/detailed-error
```

The package declares `@couimet/detailed-error` as a peer dependency, and pnpm or npm installs it automatically.

## Usage

Create results with the factories, then check `.success` before reading `.value` or `.error`:

```typescript
import { DetailedResult } from '@couimet/detailed-result';

function divide(a: number, b: number): DetailedResult<number, string> {
  if (b === 0) {
    return DetailedResult.failure('Division by zero');
  }
  return DetailedResult.success(a / b);
}

const result = divide(10, 2);
if (result.success) {
  console.log(result.value); // 5
} else {
  console.error(result.error);
}
```

Pin the error type by subclassing. The base class uses `success` and `failure`, which leaves `ok` and `err` free for a subclass to claim with a pinned error type:

```typescript
class MyError extends Error {}

class MyResult<T> extends DetailedResult<T, MyError> {
  private constructor(success: boolean, value: T | undefined, error: MyError | undefined) {
    super(success, value, error);
  }

  static ok<T>(value: T): MyResult<T> {
    return new MyResult(true, value, undefined);
  }

  static err(error: MyError): MyResult<never> {
    return new MyResult(false, undefined, error);
  }
}

const result = MyResult.ok(42);
// result.error is typed as MyError
```

## How it works

`DetailedResult` enforces one invariant: a success result carries a value and no error, and an error result carries an error and no value. The protected constructor rejects every other combination with a `DetailedError` whose code is `RESULT_INVALID_STATE`. Three combinations fail. A success with an error defined fails, an error result with a value defined fails, and an error result with no error defined fails. The `success` and `failure` factories build the first two correctly, so only a subclass constructor reaches those guards.

`DetailedResult.success(undefined)` is valid, because a success result may hold any value. `DetailedResult.failure(undefined)` throws `RESULT_INVALID_STATE`, because an error result must carry a defined error. A caller that needs a success result with no value returns `success(undefined)`.

Reading the wrong accessor is a programming error rather than a recoverable state. `value` on an error result throws a `DetailedError` with code `RESULT_VALUE_ACCESS_ON_ERROR`. `error` on a success result throws one with code `RESULT_ERROR_ACCESS_ON_SUCCESS`. Both messages name the missing `.success` check. Check `.success` before either accessor.

## API reference

The barrel re-exports two modules: `DetailedResult` and `DetailedResultErrorCodes`.

### DetailedResult

```typescript
class DetailedResult<T, E> {
  protected constructor(success: boolean, value: T | undefined, error: E | undefined);

  static success<T>(value: T): DetailedResult<T, never>;
  static failure<E>(error: E): DetailedResult<never, E>;

  get success(): boolean;
  get value(): T;
  get error(): E;
}
```

- `T` is the success value type, and `E` is the error type. `E` is unconstrained, so a caller can use plain `Error`, a `DetailedError`, or a project-specific subclass.
- `constructor(success, value, error)` is protected, so only a subclass reaches it through `super`. It throws a `DetailedError` with code `RESULT_INVALID_STATE` for a success with an error defined, for an error result with a value defined, and for an error result with no error defined.
- `success<T>(value)` returns a success result holding `value`. The error type is `never`, so a caller cannot read `.error` from it without a type error. The value may be `undefined`.
- `failure<E>(error)` returns an error result holding `error`. The success type is `never`. The `error` argument must be defined, and `failure(undefined)` throws `RESULT_INVALID_STATE`.
- `success` reports whether the result holds a success value. Check it before reading `.value` or `.error`.
- `value` returns the success value, typed `T`. It throws a `DetailedError` with code `RESULT_VALUE_ACCESS_ON_ERROR` when the result holds an error.
- `error` returns the error, typed `E`. It throws a `DetailedError` with code `RESULT_ERROR_ACCESS_ON_SUCCESS` when the result holds a success value.

### DetailedResultErrorCodes

Codes for the invariant violations this class detects:

```typescript
enum DetailedResultErrorCodes {
  RESULT_ERROR_ACCESS_ON_SUCCESS = 'RESULT_ERROR_ACCESS_ON_SUCCESS',
  RESULT_INVALID_STATE = 'RESULT_INVALID_STATE',
  RESULT_VALUE_ACCESS_ON_ERROR = 'RESULT_VALUE_ACCESS_ON_ERROR',
}
```

`RESULT_ERROR_ACCESS_ON_SUCCESS` marks a read of `.error` on a success result. `RESULT_INVALID_STATE` marks a constructor argument combination that contradicts the invariant. `RESULT_VALUE_ACCESS_ON_ERROR` marks a read of `.value` on an error result. None of the three appears in normal application flow, because each one signals a missing `.success` check or a subclass constructor that passes inconsistent arguments.

## Related packages

- [`@couimet/detailed-error`](https://github.com/couimet/ts-npm-packages/tree/main/packages/detailed-error) provides the `DetailedError` class this package throws for an invariant violation, and the error type a caller pins through the `E` parameter.
- [`@couimet/detailed-result-testing`](https://github.com/couimet/ts-npm-packages/tree/main/packages/detailed-result-testing) provides Jest matchers that assert on `DetailedResult` instances through `toBeSuccess` and `toBeFailure`.

## License

MIT
