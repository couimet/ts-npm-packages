# ts-npm-packages

A monorepo for a curated family of small TypeScript packages published under the [`@couimet`](https://www.npmjs.com/~couimet) scope on npm. Scaffold, tooling, and the first packages land in subsequent issues; see the planning docs below for the full plan and rationale.

## Planned packages

| Package | Purpose |
|---|---|
| `@couimet/execution-context` | Correlation ID, request ID, and async-local-storage propagation for call-chain tracing across service boundaries. |
| `@couimet/logger-contract` | Minimal logger interface contract — libraries depend on this without committing consumers to any logging framework. |
| `@couimet/logger-contract-testing` | Test mocks and helpers for the logger contract. |

## Planning history

- [2026-06-08 — monorepo research](docs/planning/2026-06-08-monorepo-research.md): tooling rationale, package inventory, naming, publishing flow, branch protection plan.
- [2026-06-10 — bootstrap plan](docs/planning/2026-06-10-bootstrap-plan.md): status snapshot, issue queue, and dependency graph for the first eight issues.
