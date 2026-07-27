# Changelog

All notable changes to the `@couimet/detailed-result-testing` package are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- changelog-entries -->

## [0.2.1]

### Fixed

- `setup-before-jest-30.d.ts` emitted as a script instead of a module, preventing type augmentation from resolving for tsc/ts-jest consumers
- `@couimet/detailed-error-testing` incorrectly marked as an optional peer dependency despite being unconditionally required by all entry points.

## [0.2.0]

### Added

- `toBeSuccessWith()` / `toBeFailureWith()` callback-based matchers (#122), and improved `toBeSuccess()` / `toBeFailure()` state-mismatch messages to include the actual payload (#121)

## [0.1.0]

### Added

- Initial release; custom Jest matchers for testing code that returns `DetailedResult`

<!-- changelog-links -->

[0.2.1]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Fdetailed-result-testing%400.2.0...%40couimet%2Fdetailed-result-testing%400.2.1
[0.2.0]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Fdetailed-result-testing%400.1.0...%40couimet%2Fdetailed-result-testing%400.2.0
[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/%40couimet%2Fdetailed-result-testing%400.1.0
