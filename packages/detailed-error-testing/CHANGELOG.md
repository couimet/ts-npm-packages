# Changelog

All notable changes to the `@couimet/detailed-error-testing` package are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1]

### Patch Changes

- Fixed TypeScript type errors on custom matchers (`toThrowDetailedError`, etc.) when using Jest 30+. Matchers are now typed for both Jest <30 and Jest 30+ via separate setup entry points: `setup` augments `@jest/expect` for Jest 30+, `setup-before-jest-30` augments the global `jest` namespace for earlier versions.
- Fixed ESM/CJS dual-package hazard where `instanceof DetailedError` checks failed because Jest resolved the setup file as CJS while test code ran as ESM. The exports map `require` condition now points at `.mjs`, sharing a single `DetailedError` instance.
- Added `declare module '@jest/expect'` augmentation to the main entry point, so consumers who import `ExpectedDetailedError` get matcher types without a separate setup import.
- Rewrote the README Quick Start to show the two-step setup (one-line `.ts` file + `jest.config.js` entry) matching the @testing-library/jest-dom pattern. The old "one config line is enough" claim was incorrect.

## [0.1.0]

### Added

- Initial release

[0.1.1]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Fdetailed-error-testing%400.1.0...%40couimet%2Fdetailed-error-testing%400.1.1
[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/%40couimet%2Fdetailed-error-testing%400.1.0
