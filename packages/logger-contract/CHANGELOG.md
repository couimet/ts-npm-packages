# Changelog

All notable changes to the `@couimet/logger-contract` package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0]

### Added

- `Logger` interface with four levels: `debug`, `info`, `warn`, `error`
- `LoggingContext` type with required `fn` key and extensible string-keyed metadata
- `NoOpLogger` default implementation that silently discards all messages
- Global logger registry via `setLogger()` / `getLogger()`
- `pingLog()` smoke-test utility that exercises all four log levels

[1.0.0]: https://github.com/couimet/ts-npm-packages/releases/tag/%40couimet%2Flogger-contract%401.0.0
