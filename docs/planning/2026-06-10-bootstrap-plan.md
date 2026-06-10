# ts-npm-packages monorepo: bootstrap plan and status

*Snapshot: 2026-06-10. Companion to [2026-06-08-monorepo-research.md](./2026-06-08-monorepo-research.md), which holds the broader context and tooling rationale.*

## Status

- `@couimet` org created on [npmjs.com/@couimet](https://www.npmjs.com/@couimet). Scope locked.
- GitHub repo `github.com/couimet/ts-npm-packages` created (public, default branch `main`).
- Eight bootstrap issues filed (see [Issue tracking](#issue-tracking) below).
- Branch protection on `main`: **TBD** — apply after issue #8 establishes the CI status-check names that the protection rules will require.
- Founding planning docs (this file + the research note): being added under `docs/planning/` via issue **#1**.

## Context

Triggered by an article I drafted on correlation-id vs request-id (`articles/_sources/devto-post-2026-06-correlation-id-vs-request-id.md` in [github.com/couimet/couimet.github.io](https://github.com/couimet/couimet.github.io)). The article needs links to real source code for `execution-context`, `axios-interceptors`, `RequestId`, and `CorrelationId`. The original implementations live in a private monorepo I no longer maintain publicly, so they aren't linkable. I also want to move `barebone-logger` and `barebone-logger-testing` out of [github.com/couimet/rangeLink](https://github.com/couimet/rangeLink) (currently bundled with an unrelated VS Code extension project) and into a curated public home.

Tooling decision (from the research note): pnpm workspaces + Turborepo + Changesets. Proven stack with copyable config patterns.

## Naming decision

`barebone-logger` is being renamed to `@couimet/logger-contract` during migration. The defining property of the package is that it is an interface contract — libraries depend on it without committing consumers to any logging framework. "Barebones" described the API surface; "logger-contract" describes what the package actually is. Symmetrical sibling: `@couimet/logger-contract-testing`.

`npm view barebone-logger` returned 404, so the rename is unconstrained — no existing consumers to preserve.

## Cross-repo conventions

- All migrated and new packages publish at `1.0.0`.
- Author: `Charles Ouimet <charles.ouimet@gmail.com>`.
- License: MIT.
- `publishConfig.access: "public"` on every package.
- Source links for the `barebone-logger` family use `github.com/couimet/rangeLink` GitHub URLs.

## Issue tracking

Eight bootstrap issues filed in order, with dependency edges encoded in each body:

| # | Title | Labels |
|---|---|---|
| [#1](https://github.com/couimet/ts-npm-packages/issues/1) | chore: import founding planning docs into `docs/planning/` | `documentation`, `chore` |
| [#2](https://github.com/couimet/ts-npm-packages/issues/2) | feat: bootstrap pnpm workspaces + Turborepo + Changesets | `infra`, `enhancement` |
| [#3](https://github.com/couimet/ts-npm-packages/issues/3) | feat: add `@couimet/logger-contract` | `package`, `migration` |
| [#4](https://github.com/couimet/ts-npm-packages/issues/4) | feat: add `@couimet/logger-contract-testing` | `package`, `migration` |
| [#5](https://github.com/couimet/ts-npm-packages/issues/5) | feat: add `@couimet/execution-context` | `package`, `new-package` |
| [#6](https://github.com/couimet/ts-npm-packages/issues/6) | discussion: final name for the axios interceptor package | `discussion`, `naming` |
| [#7](https://github.com/couimet/ts-npm-packages/issues/7) | feat: add the axios interceptor for execution-context propagation | `package`, `new-package` |
| [#8](https://github.com/couimet/ts-npm-packages/issues/8) | infra: GitHub Actions workflows for PR checks and Changesets publish | `infra`, `ci` |

Dependency graph:

```
#1 docs ──────────────────────────────────────► (no blocks)

#2 bootstrap ─┬─► #3 logger-contract ─┬─► #4 logger-contract-testing
              │                       │
              │                       └─► #7 axios-package
              ├─► #5 execution-context ───► #7 axios-package
              └─► #8 ci-workflows

#6 axios-naming ─► #7 axios-package
```

Critical path: **#2 → #5 → #7** (or via **#3 → #7**). Issues **#1**, **#6**, and **#8** can be progressed in parallel with the package work.

## Open decisions flagged for later

- **`@couimet/console-logger`** — a simple console-based implementation of `@couimet/logger-contract`. Useful as a quick-start for consumers of the axios interceptor. Defer until after Tier 1 + Tier 2 migrations land. Will become an issue when the time comes.
- **Issue and PR templates** under `.github/`. Probably yes once the issue cadence stabilizes; not urgent for the first eight issues.

## Cross-repo linkage

Once `@couimet/execution-context` and the axios interceptor package are published, update the source links in the dev.to article (`articles/_sources/devto-post-2026-06-correlation-id-vs-request-id.md` in [github.com/couimet/couimet.github.io](https://github.com/couimet/couimet.github.io)) to point at this repo's packages and at the published npm pages.

## Working notes that fed this plan

These are the ephemeral working notes from the planning sessions, kept here only for traceability:

- `2026-06-08` — initial monorepo research and naming exploration (became [`2026-06-08-monorepo-research.md`](./2026-06-08-monorepo-research.md)).
- `2026-06-10` — bootstrap plan + status snapshot (became this file).
- `2026-06-10` — GitHub issue drafts that were then filed as #1–#8.

The originals lived in a private working directory tied to issue #77 in the source-article repo. Their useful content has been folded into the two markdown files in this directory.
