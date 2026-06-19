# Changelog

All notable changes to the `@couimet/eslint-config` package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0]

### Added

- Default `ignores` in the ESLint flat config now covers `pnpm-lock.yaml`, `*.tsbuildinfo`, and `*.d.ts.map`

### Changed

- All peer dependencies widened from `^` to `>=`

## 0.2.0

### Changed

- Resolve prettier-plugin-packagejson by absolute path so consumers no longer need to declare it as a peer dependency.

## [0.1.0]

### Added

- Shared ESLint flat config with TypeScript-ESLint, import sorting, unused import detection, and Prettier integration
- Shared Prettier config (`printWidth: 160`, `singleQuote: true`, `trailingComma: 'all'`)
- Subpath exports: `@couimet/eslint-config/eslint` and `@couimet/eslint-config/prettier`

[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/@couimet/eslint-config@0.1.0
