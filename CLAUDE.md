# ts-npm-packages

## Scaffolding a package

Run `scripts/create-package.sh` from the repo root. It prompts for two values:

1. Package name (without `@couimet/` prefix)
2. Short description

When helping the user create a new package, present the two values as a ready-to-copy block:

```
<name>
<description>
```

The user copies the two lines and pastes them into the terminal at the prompts. Do not run the script yourself — it is interactive and requires human input.

After scaffolding, the user runs `pnpm install` to update the lockfile.

## Monorepo conventions

- pnpm workspaces + Turborepo + Changesets. See `turbo.json` for task pipelines.
- Node 24+ (pinned in `.nvmrc`), pnpm 11+ (pinned in `packageManager` in `package.json`).
- `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck` delegate to Turborepo from the root scripts.
- New packages start at `version: 0.1.0`, MIT license, `publishConfig.access: public`, author `Charles Ouimet <charles.ouimet@gmail.com>`.
- `tsconfig.json` extends `../../tsconfig.base.json` and sets `rootDir` and `outDir`.
- Flat ESLint config (`eslint.config.mjs`) imports from `@couimet/eslint-config/eslint`.
- Pretty print width is 160 (`.prettierrc` or equivalent in `@couimet/eslint-config`).
- `src/index.ts` barrel files use `export * from './<module>';` rather than named re-exports, to keep git diffs minimal when modules gain or drop exports. Internal helpers (test-only or module-private) must live outside the module's public exports so `export *` doesn't leak them.

## Coding conventions

Rules in this section apply repo-wide, to every package under `packages/*`. Conventions that only apply inside one package live in that package's `packages/<name>/CLAUDE.md`; Claude Code merges them when working in that directory tree. When adding a new convention, ask first whether it makes sense for every current and future package — if yes, it goes here; if no, put it in the package-local file.

- **Throw on invalid input.** Test-only setup helpers (`_reset*`, fixture builders, etc.) and module-load configuration (env-var parsing, config readers) throw on invalid input rather than warning, defaulting, or coercing. Bad input from the caller — test code or operator config — is a bug, and failing loud at the call site beats a poisoned state surfacing later as a confusing assertion failure. Public runtime APIs (consumer-facing functions) follow the same rule.
- **No manual mock cleanup in tests.** All Jest configs set `restoreMocks: true`, so `jest.spyOn` / `jest.fn()` mocks are automatically restored after each test. Do not write `mockRestore()` or `afterEach` blocks for mock cleanup. Restoring other mutable state (e.g. `process.env`) in `afterEach` is still valid and necessary.
- **Never write changeset files manually.** Do not create or edit files under `.changeset/`. The user runs `pnpm changeset` interactively to generate changeset files. When changesets are needed before merging, describe what package needs what bump and why, then tell the user to run the command.

## Contributor docs

Full Changesets workflow (adding changesets, pre-release flow, hot-fixes, publishing) is in `CONTRIBUTING.md`.
