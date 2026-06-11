# Monorepo for public npm packages: research and plan

_Original research: 2026-06-08. Trimmed 2026-06-10 once the foundational decisions (repo name, npm scope, package renames) landed; this file remains the broad-context reference. For actionable status see [2026-06-10-bootstrap-plan.md](./2026-06-10-bootstrap-plan.md)._

## Trigger

This planning artifact came out of writing a dev.to article on correlation-id vs request-id. The article needs links to real source code for `execution-context`, `axios-interceptors`, `RequestId`, and `CorrelationId`. The original implementations live in a private monorepo I no longer maintain publicly, so they aren't linkable from the article. That gap turned into a broader question: where should I put a curated set of small TypeScript packages going forward?

The same exercise also covered moving `barebone-logger` and `barebone-logger-testing` out of [github.com/couimet/rangeLink](https://github.com/couimet/rangeLink), where they currently live alongside an unrelated VS Code extension project.

## Tooling recommendation

pnpm workspaces + Turborepo + Changesets. Same stack I've successfully used in a prior private monorepo. Changesets handles per-package versioning and changelogs; Turborepo handles the build pipeline; pnpm handles workspace dependency resolution. All three are well-documented and easy to onboard later contributors against.

## Package inventory and migration complexity

### Tier 1: Extract as-is

**`execution-context`**

- Dependencies: only `@opentelemetry/api`, `@opentelemetry/context-async-hooks`, `uuid` (all public OSS).
- Contains: `CorrelationId`, `RequestId` (value objects), `ExecutionContext` (AsyncLocalStorage propagation), `HttpHeaders` (header name enum).
- Changes needed: change license to MIT, set `publishConfig.access: "public"`, update repository/homepage URLs.
- Target package name: `@couimet/execution-context`.

**`barebone-logger`** (from rangeLink)

- Source: [github.com/couimet/rangeLink/tree/main/packages/barebone-logger](https://github.com/couimet/rangeLink/tree/main/packages/barebone-logger).
- Dependencies: zero.
- Already MIT-licensed.
- Contains: minimal logger interface (`info`, `warn`, `debug`, `error` with `LoggingContext`), `NoOpLogger` default, `setLogger`/`getLogger` registry, `pingLog` smoke test.
- Changes needed: rename to `@couimet/logger-contract` (the package is an interface contract — that framing is more honest than "barebones"), set `publishConfig.access: "public"`, update repository/homepage URLs.
- Target package name: **`@couimet/logger-contract`** (renamed during migration; `npm view barebone-logger` returned 404, so the name was free and the rename is unconstrained).

**`barebone-logger-testing`** (from rangeLink)

- Source: [github.com/couimet/rangeLink/tree/main/packages/barebone-logger-testing](https://github.com/couimet/rangeLink/tree/main/packages/barebone-logger-testing).
- Dependencies: only `barebone-logger` (workspace:\*).
- Already MIT-licensed.
- Contains: test mocks for the logger contract.
- Changes needed: rename to `@couimet/logger-contract-testing`, update the workspace dep to `@couimet/logger-contract`, update URLs.

### Tier 2: Needs refactoring before extraction

**`axios-interceptors`** (the `executionContextRequestInterceptor`)

- Current peer deps in the original codebase: an internal `execution-context` package, an internal `logger` package, and `axios`.
- The interceptor already takes a `Logger` as a constructor parameter, accepting any object matching the logger interface. Swapping the peer to `@couimet/logger-contract` is structural-only.
- Contains: `executionContextRequestInterceptor` (the snippet referenced from the dev.to article).
- Changes needed: replace the internal logger import with the `@couimet/logger-contract` interface, update peer deps, change license/scope, set `publishConfig.access: "public"`, update URLs.
- Target package name: `@couimet/axios-execution-context` (working pick; final name to be decided — see [bootstrap-plan](./2026-06-10-bootstrap-plan.md)).

### Extraction order

1. Migrate `barebone-logger` → `@couimet/logger-contract` (no deps, foundational).
2. Migrate `barebone-logger-testing` → `@couimet/logger-contract-testing` (depends on `@couimet/logger-contract`).
3. Add `@couimet/execution-context` (external OSS deps only).
4. Refactor and add the axios interceptor package (switch logger peer to `@couimet/logger-contract`, then add).

## Package naming

All packages live under the `@couimet` scope ([npmjs.com/@couimet](https://www.npmjs.com/@couimet)). Namespace isolation, intentional curation signal, and `publishConfig.access: "public"` make this the obvious choice; longer import paths are the only tradeoff and are minor. The `barebone-logger` and `barebone-logger-testing` packages are renamed to `@couimet/logger-contract` and `@couimet/logger-contract-testing` during migration: the "barebones" framing was apologetic about API size, while "logger-contract" describes what the package actually is — an interface contract that libraries depend on without committing consumers to any logging framework.

## Publishing to npmjs.com

Workflow (pnpm + Turborepo + Changesets):

1. `pnpm changeset` — create a changeset marking which packages changed and the version bump.
2. `pnpm changeset version` — consume changesets, bump versions in `package.json` files, generate `CHANGELOG.md`.
3. `pnpm build` — Turborepo builds all packages in dependency order.
4. `pnpm changeset publish` — publishes changed packages to npm.

Prerequisites:

- npmjs.com account with publish rights on the `@couimet` scope.
- `publishConfig.access: "public"` in each package's `package.json` (scoped packages default to restricted).
- An npm access token with read+write permissions, set as `NPM_TOKEN` in GitHub Actions secrets.
- `repository.url` and `homepage` fields pointing to this repo.

GitHub Actions automation (sketch):

```yaml
# .github/workflows/publish.yml
name: Publish
on:
  push:
    branches: [main]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm changeset publish
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## GitHub branch protection

Rules to configure at `Settings → Branches → main`:

**Branch: `main`**

- Require a pull request before merging: **ON**
- Require approvals: **1** (sole approver for now)
- Dismiss stale pull request approvals when new commits are pushed: **ON**
- Require status checks to pass before merging: **ON** (require `build` and `test` Turborepo tasks)
- Require conversation resolution before merging: **ON**
- Do not allow bypassing the above settings: **ON** (prevents force-pushes even by admin)
- Restrict who can push to matching branches: only the maintainer

**All branches (`*`):**

- No direct pushes allowed (enforced by the main branch rule above).

Every change goes through PRs that I must approve — including my own. Deliberate friction to keep `main` clean.

## Bridging to action

Actionable next steps, current status, and the issue queue live in [2026-06-10-bootstrap-plan.md](./2026-06-10-bootstrap-plan.md).
