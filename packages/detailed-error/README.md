# @couimet/detailed-error

Structured error base class with typed error codes and shared error codes.

## Usage

Two patterns, same class:

**Enum-based strong typing** — define an error codes enum, subclass `DetailedError`, and the compiler enforces valid codes:

```ts
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
```

**Plain string codes** — instantiate `DetailedError<string>` directly without subclassing:

```ts
throw new DetailedError({ code: 'SOMETHING_WRONG', message: 'Something went wrong' });
```

See `src/DetailedError.ts` for the full JSDoc.
