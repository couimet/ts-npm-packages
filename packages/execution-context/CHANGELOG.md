# Changelog

All notable changes to the `@couimet/execution-context` package are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- changelog-entries -->

## [1.0.0]

### Added

- `ExecutionContext.getAttribute()` accepts a declared attribute as well as a raw key. The declared form carries the value type, so the reader needs no annotation.
- `ExecutionContext.findAttribute()` accepts the same two forms as `getAttribute()` and returns `undefined` in place of a throw.
- `ExecutionContext.withAttributes()` layers an attribute bag over the active scope for the duration of a callback.
- `ExecutionContext.validateAttributes()` checks each entry against its own declaration's rule and returns the context bag.
- `ExecutionContextAttribute<T>` declares one attribute as a context key and an optional `isValid` type predicate.
- `ExecutionContextAttributeValues<R>` types the entries of one `validateAttributes()` call from the registry.
- The error codes `INVALID_ATTRIBUTE_VALUE`, `MISSING_CONTEXT_ATTRIBUTE`, and `UNKNOWN_ATTRIBUTE_NAME`.

### Changed

- `getAttribute(key)` throws `MISSING_CONTEXT_ATTRIBUTE` when no writer set the key, and it returned `undefined` in 0.1.0. A key that a writer set to `undefined` is present, so only an unset key throws. Use `findAttribute()` where an absent key is an expected outcome.

## [0.1.0]

### Added

- Initial release

<!-- changelog-links -->

[1.0.0]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Fexecution-context%400.1.0...%40couimet%2Fexecution-context%401.0.0
[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/%40couimet%2Fexecution-context%400.1.0
