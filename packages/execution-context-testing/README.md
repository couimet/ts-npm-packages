# @couimet/execution-context-testing

[![npm version](https://img.shields.io/npm/v/@couimet/execution-context-testing)](https://www.npmjs.com/package/@couimet/execution-context-testing) [![npm downloads](https://img.shields.io/npm/dm/@couimet/execution-context-testing)](https://www.npmjs.com/package/@couimet/execution-context-testing) [![Coverage](https://codecov.io/gh/couimet/ts-npm-packages/branch/main/graph/badge.svg?flag=execution-context-testing)](https://codecov.io/gh/couimet/ts-npm-packages?flags%5B0%5D=execution-context-testing)

`@couimet/execution-context-testing` gives a test the two helpers it needs when the code under test reads or adds execution-context attributes. `withTestExecutionContext()` runs a callback inside a fresh context, so the test reads an active scope without priming one by hand. `spyOnAttributeAdditions()` returns a Jest spy on `ExecutionContext.addAttributes()`, so the test asserts the attributes the code added rather than the merged bag. Both helpers build on [`@couimet/execution-context`](https://github.com/couimet/ts-npm-packages/tree/main/packages/execution-context).

## Install

```bash
pnpm add -D @couimet/execution-context-testing
```

The package declares `@couimet/execution-context`, `@jest/globals`, and `jest` as peer dependencies, and pnpm or npm installs them automatically. The id generator that `withTestExecutionContext()` falls back to ships as the direct dependency [`@couimet/dynamic-testing`](https://github.com/couimet/ts-npm-packages/tree/main/packages/dynamic-testing).

## Usage

```typescript
import { spyOnAttributeAdditions, withTestExecutionContext } from '@couimet/execution-context-testing';
import { ExecutionContext } from '@couimet/execution-context';

const addAttributes = spyOnAttributeAdditions();

withTestExecutionContext({ correlationId: 'corr-1', requestId: 'req-1', attributes: { run_id: 'run-7' } }, () => {
  runOneJob();

  expect(ExecutionContext.correlationId.toString()).toBe('corr-1');
  expect(addAttributes).toHaveBeenCalledWith({ attempt: 2 });
});
```

Pass `undefined` for the parameters and the helper generates both ids. Pass a `RunParams` and the helper pins the ids a test asserts against. The context ends with the callback, so the next test starts clean.

The context keys stay owned by the consumer. A test that asserts on an attribute names the same key that the production code writes, and this package names none of them. An application collects those keys in its own registry, which `ExecutionContext.validateAttributes()` consumes.

## API reference

### spyOnAttributeAdditions

Returns a spy on `ExecutionContext.addAttributes()` that still calls through.

```typescript
function spyOnAttributeAdditions(): jest.SpiedFunction<typeof ExecutionContext.addAttributes>;
```

The code under test keeps merging its attributes into the active context, so the spy changes no behavior. The assertion then reads the additions alone, apart from the attributes the scope already carried. The Jest configuration sets `restoreMocks`, so the spy goes away after each test and a test file needs no cleanup block.

### withTestExecutionContext

Runs a callback inside a fresh execution context, and returns whatever the callback returns.

```typescript
function withTestExecutionContext<T>(params: RunParams | undefined, fn: () => T): T;
```

Pass `undefined` as `params` to let the helper generate both ids. That form suits a test that asserts on attributes alone, because the test never holds a fixed pair. Pass a `RunParams` to pin the ids the test asserts against. A `RunParams` field left `undefined` is still generated, so a test pins only the ids it needs.

The context dies with the callback, because `ExecutionContext.run()` restores the state it found. `ExecutionContext.isActive()` therefore returns false again once the callback returns.

## Related packages

- [`@couimet/execution-context`](https://github.com/couimet/ts-npm-packages/tree/main/packages/execution-context) provides `ExecutionContext` and `RunParams`, which both helpers wrap.
- [`@couimet/dynamic-testing`](https://github.com/couimet/ts-npm-packages/tree/main/packages/dynamic-testing) provides `getUniqueString()`, which generates an id that the caller does not pin.

## License

MIT
