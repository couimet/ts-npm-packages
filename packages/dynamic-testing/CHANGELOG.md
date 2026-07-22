# Changelog

All notable changes to the `@couimet/dynamic-testing` package are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- changelog-entries -->

## [1.0.0]

### Added

- Enhanced `getRandomInt()` with an `allowTrailingZero` option (default `false`) that ensures the returned integer never ends with a trailing zero. Throws `NO_VALID_VALUES_IN_RANGE` or `SINGLE_VALID_VALUE` when the constraint leaves zero or exactly one valid value, respectively.
- `getUniqueTimestamp()` now uses `getRandomInt(1, 999)` to add a random millisecond component whose last digit is never zero, preventing precision loss from rounding.
- Updated `getRandomEnumValue()` and `getRandomString()` to pass `{ allowTrailingZero: true }` since they use the function for array-index selection.

## [0.4.0]

### Added

- Add `getUniqueInts()`, `getUniqueIntsNamed()`, `getUniqueDates()`, `getUniqueDatesNamed()` batch convenience wrappers.

## [0.3.0]

### Added

- Add `getUniqueRepo*()` SCM utilities (GitHub/GitLab identifiers with generic aliases via `configure()`)

## [0.2.0]

### Added

- Add `getUuid()` and `getUuidV4()` convenience wrappers around the `uuid` package for generating UUID v4 values in tests.

## [0.1.1]

### Changed

- Peer dependency `decimal.js` widened from `^10.0.0` to `>=10.0.0`

## [0.1.0]

### Added

- Initial release

<!-- changelog-links -->

[1.0.0]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Fdynamic-testing%400.4.0...%40couimet%2Fdynamic-testing%401.0.0
[0.4.0]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Fdynamic-testing%400.3.0...%40couimet%2Fdynamic-testing%400.4.0
[0.3.0]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Fdynamic-testing%400.2.0...%40couimet%2Fdynamic-testing%400.3.0
[0.2.0]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Fdynamic-testing%400.1.1...%40couimet%2Fdynamic-testing%400.2.0
[0.1.1]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Fdynamic-testing%400.1.0...%40couimet%2Fdynamic-testing%400.1.1
[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/%40couimet%2Fdynamic-testing%400.1.0
