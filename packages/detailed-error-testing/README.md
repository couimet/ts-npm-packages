# @couimet/detailed-error-testing

[![npm version](https://img.shields.io/npm/v/@couimet/detailed-error-testing.svg?style=flat-square)](https://www.npmjs.com/package/@couimet/detailed-error-testing) [![npm downloads](https://img.shields.io/npm/dm/@couimet/detailed-error-testing.svg?style=flat-square)](https://www.npmjs.com/package/@couimet/detailed-error-testing)

Custom Jest matchers for testing code that throws or returns [`DetailedError`](https://github.com/couimet/ts-npm-packages/tree/main/packages/detailed-error).

## Install

```bash
pnpm add -D @couimet/detailed-error-testing
```

## Overview

`@couimet/detailed-error-testing` provides three Jest matchers — `toBeDetailedError`, `toThrowDetailedError`, and `toThrowDetailedErrorAsync` — that assert on `DetailedError` instances by their `code`, `message`, `functionName`, `details`, and `cause`. A one-line setup file registers the matchers and augments TypeScript types so `expect(...).toThrowDetailedError(...)` typechecks out of the box. All Jest versions are supported, including Jest 30+ which moved its matcher types to `@jest/expect`.

## Quick start

### 1. Create a setup file

Pick the import that matches your Jest version.

```ts
// tests/jest-setup.ts
import '@couimet/detailed-error-testing/setup'; // Jest 30+
// Or: import '@couimet/detailed-error-testing/setup-before-jest-30'; // Jest <30
```

### 2. Add it to your Jest config

```js
// jest.config.js
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/tests/jest-setup.ts'],
};
```

If your package manager does not hoist transitive dependencies (e.g. pnpm in strict mode), add `@jest/expect` to your devDependencies:

```bash
pnpm add -D @jest/expect
```

That is all the setup needed. If your tsconfig doesn't already include your test directory, ensure it does:

```json
"include": ["src", "tests"]
```

The import handles both matcher registration at runtime and TypeScript type augmentation — no separate `.d.ts` file required.

Use the matchers in any test:

```ts
import { DetailedError } from '@couimet/detailed-error';

describe('parseConfig', () => {
  it('throws on invalid input', () => {
    expect(() => parseConfig('bad')).toThrowDetailedError('VALIDATION', {
      message: 'Expected a valid config object',
      functionName: 'parseConfig',
    });
  });

  it('rejects on timeout', async () => {
    await expect(fetchConfig).toThrowDetailedErrorAsync('TIMEOUT', {
      message: 'Request timed out after 5000ms',
    });
  });

  it('attaches error details', () => {
    try {
      parseConfig('bad');
    } catch (err) {
      expect(err).toBeDetailedError('VALIDATION', {
        message: 'Expected a valid config object',
        functionName: 'parseConfig',
        details: { field: 'host', value: null },
      });
    }
  });
});
```

## API

All three matchers accept `code` as the first positional argument and an expected object as the second. `message` is required on the expected object; `functionName`, `details`, and `cause` are optional and only checked when provided.

### `toThrowDetailedError(code, expected)`

Asserts that a synchronous function throws a `DetailedError` matching the given code and expected fields.

```ts
expect(() => doStuff()).toThrowDetailedError('UNKNOWN', {
  message: 'Something unexpected happened',
  functionName: 'doStuff',
});
```

### `toThrowDetailedErrorAsync(code, expected)`

Same as `toThrowDetailedError` but for async functions. Returns a promise — always `await` it.

```ts
await expect(() => fetchData()).toThrowDetailedErrorAsync('NETWORK', {
  message: 'Failed to reach server',
  functionName: 'fetchData',
  cause: new Error('ECONNREFUSED'),
});
```

### `toBeDetailedError(code, expected)`

Asserts that an already-caught value is a `DetailedError` matching the given code and expected fields. This is the lower-level matcher used by the two `toThrow` variants — useful when you need to assert on an error that was caught inline or passed through a callback.

```ts
try {
  processFile(path);
} catch (err) {
  expect(err).toBeDetailedError('IO_ERROR', {
    message: 'File not readable',
    functionName: 'processFile',
    details: { path },
  });
}
```

## Common patterns

### Asserting on cause

Pass the exact `cause` reference — the matcher uses reference equality:

```ts
const root = new Error('Disk full');
const err = new DetailedError({ code: 'WRITE_FAILED', message: 'Cannot write', functionName: 'save', cause: root });

// Passes — same reference
expect(err).toBeDetailedError('WRITE_FAILED', {
  message: 'Cannot write',
  functionName: 'save',
  cause: root,
});
```

### Optional fields

`functionName`, `details`, and `cause` are optional on the expected object. Omit any of them to assert the error does not have that field set:

```ts
// Only check code and message — assert no functionName, details, or cause
expect(err).toBeDetailedError('TIMEOUT', {
  message: 'Request timed out',
});
```

If the error has a value for an omitted field, the matcher fails.

### Negation

All three matchers support `.not`:

```ts
expect(() => doStuff()).not.toThrowDetailedError('UNEXPECTED_CODE_PATH', {
  message: 'Should not happen',
  functionName: 'doStuff',
});
```

## Related

- [`@couimet/detailed-error`](https://github.com/couimet/ts-npm-packages/tree/main/packages/detailed-error) — the error base class these matchers test

## License

MIT
