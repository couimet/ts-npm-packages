# @couimet/execution-context-testing

## Attribute keys

These helpers name no context key. The consumer owns every key, and a test names the same key that the production code writes.

An application collects its keys in one registry, which it passes to `ExecutionContext.validateAttributes()`. A test imports that registry instead of repeating a key string, so a renamed key breaks the build rather than the assertion.

Never add a key constant to this package. A hard-coded key here would tie the helper to one consumer and would drift from the registry that owns it.

## Test isolation

`withTestExecutionContext()` opens a scope that ends with the callback. Do not open a scope in a global hook. A scope that outlives its test leaks its attributes into the next test, and the failure then points at the wrong file.

`spyOnAttributeAdditions()` relies on `restoreMocks`, which every Jest config in this monorepo sets. A test file therefore needs no cleanup block.
