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
- New packages start at `version: 1.0.0`, MIT license, `publishConfig.access: public`, author `Charles Ouimet <charles.ouimet@gmail.com>`.
- `tsconfig.json` extends `../../tsconfig.base.json` and sets `rootDir` and `outDir`.
- Flat ESLint config (`eslint.config.mjs`) imports from `@couimet/eslint-config/eslint`.
- Pretty print width is 160 (`.prettierrc` or equivalent in `@couimet/eslint-config`).
- `src/index.ts` barrel files use `export * from './<module>';` rather than named re-exports, to keep git diffs minimal when modules gain or drop exports. Internal helpers (test-only or module-private) must live outside the module's public exports so `export *` doesn't leak them.

## Contributor docs

Full Changesets workflow (adding changesets, pre-release flow, hot-fixes, publishing) is in `CONTRIBUTING.md`.
