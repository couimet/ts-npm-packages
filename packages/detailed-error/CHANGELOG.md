# Changelog

All notable changes to the `@couimet/detailed-error` package are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- changelog-entries -->

## [1.0.0]

### Changed

- `forUnexpectedSwitchDefault()` now uses `UNEXPECTED_SWITCH_VALUE` as its default error code instead of `UNEXPECTED_CODE_PATH`.

## [0.2.1]

### Fixed

- Fixed stack traces to point to the call site instead of the constructor, and Error instances in details are now preserved during deep cloning instead of being reduced to empty objects.

## [0.2.0]

### Added

- Add `forUnexpectedSwitchDefault()` static factory method to `DetailedError`

## [0.1.0]

### Added

- Initial release

<!-- changelog-links -->

[1.0.0]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Fdetailed-error%400.2.1...%40couimet%2Fdetailed-error%401.0.0
[0.2.1]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Fdetailed-error%400.2.0...%40couimet%2Fdetailed-error%400.2.1
[0.2.0]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Fdetailed-error%400.1.0...%40couimet%2Fdetailed-error%400.2.0
[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/%40couimet%2Fdetailed-error%400.1.0
