# Changelog

All notable changes to the `@couimet/eslint-config` package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- changelog-entries -->

## [0.6.2]

### Fixed

- Added `@typescript-eslint/typedef` with `parameter: true` to require explicit type annotations on function and method parameters, even when TypeScript can infer them from contextual typing.

## [0.6.1]

### Fixed

- Fixed `@typescript-eslint/no-unused-vars` `args` from `none` to `all` so unused function parameters are now flagged as errors. The `argsIgnorePattern: '^_'` escape hatch still applies.

## [0.6.0]

### Added

- Added `reactConfig()` named export with React hooks (`rules-of-hooks`, `exhaustive-deps`) and JSX safety (`jsx-key`, `jsx-no-target-blank`) rules.

## [0.5.0]

### Added

- Add eslint-plugin-unicorn with expiring-todo-comments rule enabled at error.

## [0.4.0]

### Added

- Add `.history/` and `.turbo/` to default ESLint ignores

## [0.3.0]

### Added

- Default `ignores` in the ESLint flat config now covers `pnpm-lock.yaml`, `*.tsbuildinfo`, and `*.d.ts.map`

### Changed

- All peer dependencies widened from `^` to `>=`

## [0.2.0]

### Changed

- Resolve prettier-plugin-packagejson by absolute path so consumers no longer need to declare it as a peer dependency.

## [0.1.0]

### Added

- Shared ESLint flat config with TypeScript-ESLint, import sorting, unused import detection, and Prettier integration
- Shared Prettier config (`printWidth: 160`, `singleQuote: true`, `trailingComma: 'all'`)
- Subpath exports: `@couimet/eslint-config/eslint` and `@couimet/eslint-config/prettier`

<!-- changelog-links -->

[0.6.2]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Feslint-config%400.6.1...%40couimet%2Feslint-config%400.6.2
[0.6.1]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Feslint-config%400.6.0...%40couimet%2Feslint-config%400.6.1
[0.6.0]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Feslint-config%400.5.0...%40couimet%2Feslint-config%400.6.0
[0.5.0]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Feslint-config%400.4.0...%40couimet%2Feslint-config%400.5.0
[0.4.0]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Feslint-config%400.3.0...%40couimet%2Feslint-config%400.4.0
[0.3.0]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Feslint-config%400.2.0...%40couimet%2Feslint-config%400.3.0
[0.2.0]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Feslint-config%400.1.0...%40couimet%2Feslint-config%400.2.0
[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/%40couimet%2Feslint-config%400.1.0
