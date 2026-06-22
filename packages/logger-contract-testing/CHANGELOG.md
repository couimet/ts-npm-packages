# Changelog

All notable changes to the `@couimet/logger-contract-testing` package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1]

### Fixed

- `createMockLogger` now imports `jest` from `@jest/globals` instead of relying on the global object, fixing `ReferenceError: jest is not defined` in ESM consumers

### Added

- `@jest/globals` (`>=30.0.0`) as a peer dependency

### Changed

- Peer dependency `jest` widened from `^29.0.0` to `>=29.0.0`

## [1.0.0]

### Added

- `createMockLogger()` factory returning a `Logger` with `jest.fn()` stubs for all four methods

[1.0.1]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Flogger-contract-testing%401.0.0...%40couimet%2Flogger-contract-testing%401.0.1
[1.0.0]: https://github.com/couimet/ts-npm-packages/releases/tag/%40couimet%2Flogger-contract-testing%401.0.0
