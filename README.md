# ts-npm-packages

[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE) ![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/couimet/ts-npm-packages?label=CodeRabbit+Reviews)

A monorepo for a curated family of small TypeScript packages published under the [`@couimet`](https://www.npmjs.com/~couimet) scope on npm. Scaffold, tooling, and the first packages land in subsequent issues; see the planning docs below for the full plan and rationale.

## Planned packages

| Package                            | Purpose                                                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `@couimet/execution-context`       | Correlation ID, request ID, and async-local-storage propagation for call-chain tracing across service boundaries.   |
| `@couimet/logger-contract`         | Minimal logger interface contract — libraries depend on this without committing consumers to any logging framework. |
| `@couimet/logger-contract-testing` | Test mocks and helpers for the logger contract.                                                                     |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full Changesets workflow, pre-release publishing, and the package scaffolding script.
