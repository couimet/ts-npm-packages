# @couimet/detailed-result

Functional Result type for explicit error handling paired with `@couimet/detailed-error`.

## Usage

Create results with the `success()` and `failure()` factories, then check `.success` before accessing `.value` or `.error`:

```ts
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

**Pin the error type** by subclassing — the base class uses `success`/`failure`, freeing `ok`/`err` for subclasses to override with a pinned error type:

```ts
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

Accessing `.value` on an error result (or `.error` on a success result) throws a `DetailedError` with a `DetailedResultErrorCodes` code — these are invariant violations that signal a bug in the calling code (missing `.success` check).
