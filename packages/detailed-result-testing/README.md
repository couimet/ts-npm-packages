# @couimet/detailed-result-testing

[![npm version](https://img.shields.io/npm/v/@couimet/detailed-result-testing.svg?style=flat-square)](https://www.npmjs.com/package/@couimet/detailed-result-testing) [![npm downloads](https://img.shields.io/npm/dm/@couimet/detailed-result-testing.svg?style=flat-square)](https://www.npmjs.com/package/@couimet/detailed-result-testing)

Custom Jest matchers for testing code that returns [`DetailedResult`](https://github.com/couimet/ts-npm-packages/tree/main/packages/detailed-result).

## Install

```bash
pnpm add -D @couimet/detailed-result-testing
```

## Overview

`@couimet/detailed-result-testing` provides two Jest matchers — `toBeSuccess` and `toBeFailure` — that assert on `DetailedResult` instances by their discriminator (`success`) and compare the value or error field using strict equality. Each matcher accepts an expected value and supports asymmetric matchers like `expect.objectContaining()` via `this.equals()`. A one-line setup file registers the matchers and augments TypeScript types so `expect(result).toBeSuccess(val)` typechecks out of the box. The setup also registers a Result-aware `toHaveDetailedError` that auto-unwraps `DetailedResult.error` before delegating to the matcher from `@couimet/detailed-error-testing`, so you can write `expect(result).toHaveDetailedError('VALIDATION', {...})` directly on a failed result. All Jest versions are supported, including Jest 30+ which moved its matcher types to `@jest/expect`.

## Quick start

### 1. Create a setup file

Pick the import that matches your Jest version.

```ts
// tests/jest-setup.ts
import '@couimet/detailed-result-testing/setup'; // Jest 30+
// Or: import '@couimet/detailed-result-testing/setup-before-jest-30'; // Jest <30
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
import { DetailedResult } from '@couimet/detailed-result';

describe('parseConfig', () => {
  it('returns a success result on valid input', () => {
    const result = parseConfig('valid');
    expect(result).toBeSuccess({ host: 'localhost', port: 8080 });
  });

  it('returns a failure result on invalid input', () => {
    const result = parseConfig('bad');
    expect(result).toBeFailure('Expected a valid config object');
  });
});
```

## API

Both matchers accept an expected value as the single argument and compare it against `result.value` (for `toBeSuccess`) or `result.error` (for `toBeFailure`) using `this.equals()`, which supports asymmetric matchers.

### `toBeSuccess(expected)`

Checks `result.success === true` and asserts `this.equals(expected, result.value)`.

```ts
expect(result).toBeSuccess({ id: 1, name: 'Alice' });
```

### `toBeFailure(expected)`

Checks `result.success === false` and asserts `this.equals(expected, result.error)`.

```ts
expect(result).toBeFailure('Invalid input');
```

## Common patterns

### Advanced validation via manual unwrap

For partial matching, use Jest's asymmetric matchers — no manual unwrapping needed:

```ts
expect(result).toBeSuccess(expect.objectContaining({ name: 'Alice' }));
expect(result).toBeFailure(expect.any(Error));
```

For assertions that have no asymmetric equivalent — for example, checking a number is greater than a threshold — check the discriminator manually and then unwrap:

```ts
expect(result.success).toBe(true);
expect(result.value).toBeGreaterThan(0);
```

```ts
expect(result.success).toBe(false);
expect(result.error).toContain('timeout');
```

### Asserting on the error

Pass the expected error value directly to `toBeFailure`. The comparison uses `this.equals()`, so both primitive and object values are supported:

```ts
const result = validateInput('bad');
expect(result).toBeFailure(new Error('Invalid input'));
```

When the error is a `DetailedError`, use the Result-aware `toHaveDetailedError` instead — it accepts `code` as a positional argument and supports field-level assertions on `message`, `functionName`, `details`, and `cause` (see [Using with DetailedError](#using-with-detailederror)).

### Asserting on the value

Pass the expected value directly to `toBeSuccess`. The comparison uses `this.equals()`, so both primitive and object values are supported:

```ts
const result = fetchData();
expect(result).toBeSuccess({
  items: [{ id: 1 }, { id: 2 }],
  total: 2,
});
```

### Negation

Both matchers support `.not`:

```ts
expect(result).not.toBeFailure('some error');
expect(result).not.toBeSuccess('wrong value');
```

### Partial matching with asymmetric matchers

Because the matcher uses `this.equals()`, you can pass asymmetric matchers like `expect.objectContaining()` or `expect.any()`:

```ts
expect(result).toBeSuccess(expect.objectContaining({ link: '...' }));
expect(result).toBeFailure(expect.any(Error));
```

### Using with DetailedError

When `@couimet/detailed-error` and `@couimet/detailed-error-testing` are installed, the setup also registers a Result-aware `toHaveDetailedError` that auto-unwraps `DetailedResult.error` before delegating to the matcher from `@couimet/detailed-error-testing`. This lets you write concise assertions on failed results that carry a `DetailedError`:

```ts
expect(result).toHaveDetailedError('VALIDATION', {
  message: 'Expected a valid config object',
  functionName: 'parseConfig',
});
```

This is equivalent to:

```ts
expect(result.success).toBe(false);
expect(result.error).toBeDetailedError('VALIDATION', {
  message: 'Expected a valid config object',
  functionName: 'parseConfig',
});
```

## Related

- [`@couimet/detailed-result`](https://github.com/couimet/ts-npm-packages/tree/main/packages/detailed-result) — the result type these matchers test
- [`@couimet/detailed-error-testing`](https://github.com/couimet/ts-npm-packages/tree/main/packages/detailed-error-testing) — matchers for `DetailedError` used alongside this package

## License

MIT
