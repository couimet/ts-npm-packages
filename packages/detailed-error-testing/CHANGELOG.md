# Changelog

All notable changes to the `@couimet/detailed-error-testing` package are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.1.1-alpha.1

### Patch Changes

- Iterate on alpha

## [0.1.1-alpha.0]

### Patch Changes

- Fixed TypeScript type errors on custom matchers (`toThrowDetailedError`, etc.) when using Jest 30+. Matchers are now typed for both Jest <30 and Jest 30+ by augmenting `@jest/expect` alongside the existing global `jest` namespace.

## [0.1.0]

### Added

- Initial release

[0.1.1]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Fdetailed-error-testing%400.1.0...%40couimet%2Fdetailed-error-testing%400.1.1
[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/%40couimet%2Fdetailed-error-testing%400.1.0
