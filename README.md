# ts-npm-packages

[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE) ![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/couimet/ts-npm-packages?label=CodeRabbit+Reviews)

A monorepo for a curated family of small TypeScript packages published under the [`@couimet`](https://www.npmjs.com/~couimet) scope on npm.

## Available packages

| Package                            | Purpose                                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| `@couimet/detailed-error`          | Structured error base class with typed error codes and shared error codes.                        |
| `@couimet/dynamic-testing`         | Dynamic testing utilities with seeded randomness for TypeScript tests.                            |
| `@couimet/eslint-config`           | Shared ESLint (flat config) and Prettier configuration for `@couimet/*` packages.                 |
| `@couimet/logger-contract`         | Logger interface contract — libraries depend on this without committing to any logging framework. |
| `@couimet/logger-contract-testing` | Zero-setup mock-logger factories for tests written against `@couimet/logger-contract`.            |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full Changesets workflow, pre-release publishing, and the package scaffolding script.
