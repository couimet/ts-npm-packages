# ts-npm-packages

## Scaffolding a package

Run `scripts/create-package.sh` from the repo root. It prompts for two values:

1. Package name (without `@couimet/` prefix)
2. Short description

When helping the user create a new package, present the two values as a ready-to-copy block AND save the full scaffold instructions to a note via `/note` (slug `scaffold-<name>`): the command, the two input lines, the `pnpm install` step, and a "tell Claude to continue" line. The note keeps the copy-paste block reachable in a file instead of terminal scrollback, which scrolls away:

```text
<name>
<description>
```

The user copies the two lines and pastes them into the terminal at the prompts. Do not run the script yourself — it is interactive and requires human input.

After scaffolding, the user runs `pnpm install` to update the lockfile.

## Monorepo conventions

- pnpm workspaces + Turborepo + Changesets. See `turbo.json` for task pipelines.
- Node 24+ (pinned in `.nvmrc`), pnpm 11+ (pinned in `packageManager` in `package.json`).
- `pnpm build`, `pnpm test`, and `pnpm typecheck` delegate to Turborepo from the root scripts. `pnpm lint` runs `eslint .` directly from the root — all packages share the same config so there is no need for per-package orchestration.
- New packages start at `version: 0.1.0`, MIT license, `publishConfig.access: public`, author `Charles Ouimet <charles.ouimet@gmail.com>`.
- `tsconfig.json` extends `../../tsconfig.base.json` and sets `rootDir` and `outDir`.
- Linting uses the root `eslint.config.js`. Sub-packages do not need their own config.
- Pretty print width is 160 (`.prettierrc` or equivalent in `@couimet/eslint-config`).
- **`src/index.ts` is the package's public API boundary.** Barrels re-export public modules with `export * from './<module>';` rather than named re-exports, to keep git diffs minimal when a module's exports change. A symbol is public if and only if it is reachable through the barrel.
- **A barreled module must export only public symbols.** `export *` re-exports everything a listed module exports, so an internal helper must never be co-located in a module the barrel re-exports. Internal helpers (test-only utilities, module-private helpers, shared package state, validation) live in modules the barrel does not list: under `src/internal/` or as an un-barreled sibling root module (`counterStart.ts`, `isNonBlank.ts`, `setupTests.ts`). Their exports are internal by construction. Adding or removing a module from the barrel is a deliberate change to the public API.

## Dependency version ranges

- **Our own monorepo packages in `devDependencies`** always use `workspace:*`. This is how pnpm knows to link to the local package rather than fetching from the registry.
- **Our own monorepo packages in `peerDependencies`** use `>=<minimum-supported-version>` ranges. The lower bound is the oldest version the package is compatible with. During publish, pnpm replaces `workspace:*` in peer dependencies with the exact workspace version; a manual `>=` range stays as-is and lets npm consumers satisfy it with any compatible version.
- **Third-party packages that appear in both `peerDependencies` and `devDependencies`** (optional peer dependencies needed for testing) use matching `>=` ranges in both sections. The lower bound is the minimum supported major version.
- **Config packages peer-depend on their runner and optional rules.** A config-only package declares the tool that consumes it (`markdownlint-cli2` for `@couimet/markdownlint-config`, `eslint` for `@couimet/eslint-config`) and any optional custom rules (`markdownlint-rule-force-align-table-columns`) in `peerDependencies`, so a consumer's install command names only the config package and pnpm/npm auto-install the rest.
- **Monorepo consumers of `@couimet/eslint-config` don't re-declare its lint plugins.** The published `eslint.config.js` imports each plugin directly, and those imports resolve from the config package's own `node_modules` (where its `devDependencies` install them), so a package only needs `@couimet/eslint-config` and `eslint` in `devDependencies` to lint. Re-adding `@typescript-eslint/*`, `eslint-plugin-*`, `eslint-config-prettier`, or `globals` is redundant and widens dependabot bump diffs. (The `peerDependencies` on `@couimet/eslint-config` remain the contract for external npm consumers.)
- **All other devDependencies** use `^` ranges.

## Coding conventions

Rules in this section apply repo-wide, to every package under `packages/*`. Conventions that only apply inside one package live in that package's `packages/<name>/CLAUDE.md`; Claude Code merges them when working in that directory tree. When adding a new convention, ask first whether it makes sense for every current and future package — if yes, it goes here; if no, put it in the package-local file.

- **Throw on invalid input.** Test-only setup helpers (`_reset*`, fixture builders, etc.) and module-load configuration (env-var parsing, config readers) throw on invalid input rather than warning, defaulting, or coercing. Bad input from the caller — test code or operator config — is a bug, and failing loud at the call site beats a poisoned state surfacing later as a confusing assertion failure. Public runtime APIs (consumer-facing functions) follow the same rule.
- **No manual mock cleanup in tests.** All Jest configs set `restoreMocks: true`, so `jest.spyOn` / `jest.fn()` mocks are automatically restored after each test. Do not write `mockRestore()` or `afterEach` blocks for mock cleanup. Restoring other mutable state (e.g. `process.env`) in `afterEach` is still valid and necessary.
- **Test imports use the barrel.** Test files in `src/__tests__/` import from `../index` (the barrel) rather than from individual implementation modules. This exercises the same public API surface consumers use and catches broken re-exports. Internal/test-helper modules (`../internal/*`, `../counterStart`, etc.) that are not in the barrel are exempt.
- **Never write changeset files manually.** Do not create or edit files under `.changeset/`. The user runs `pnpm changeset` interactively to generate changeset files. When changesets are needed before merging, describe what package needs what bump and why, then tell the user to run the command. Include the full command as a copy-pasteable block, the package(s) to select, bump level, and description. Mention that `pnpm changeset:version` (which runs `changeset version`) will later consume the changeset to bump the version and update the CHANGELOG.
- **Never stage or commit.** Do not run `git add`, `git commit`, `git push`, or `gh pr create`. Stop after generating the commit message file. The user reviews, stages, and commits manually.
- **README sections in alphabetical order.** When adding a new `###` subsection under a `##` heading in a package README, insert it in alphabetical position among its sibling subsections. Also check that existing subsections are in alphabetical order — if the section being added would appear between two existing ones that are out of order, reorder those too.
- **README API reference documents every public module and member.** A package README's API reference lists each module the barrel re-exports and, under each, every public symbol that module exports, with a signature block or behavior note. The documented surface must match the barrel: no public symbol left undocumented and nothing documented that the barrel does not export.
- **Ported READMEs are authored fresh, never copied from the incubation.** When a package is ported from an incubation repo into this monorepo, its README is written again from the ported source, not carried over. Do not copy prose or structure from the incubation README; derive every sentence from the package's own code, tests, and package.json description. Existing in-repo READMEs that predate these content rules are grandfathered and are being brought to standard (see issue #163).
- **README prose follows `/prose-style` and `/asd-ste100`.** Writing or editing package README content means applying both skills. `/prose-style` governs form: each paragraph is one continuous line with no hard wrap, references to source locations are bare workspace-relative permalinks (`packages/example/src/index.ts#L12`, never backtick-wrapped), and GitHub references are full URLs. `/asd-ste100` applies in STE-flavored mode: active voice, sentences of at most 25 words, no semicolons, one topic per paragraph, lists for sequences of three or more, one consistent name per concept, and no marketing adjectives.
- **CHANGELOG compare links.** After `pnpm changeset:version` bumps versions, add a link section to the bottom of each updated `CHANGELOG.md`. Use GitHub compare URLs for versions after the first, and a release tag URL for the first version. In scoped package tags, URL-encode `@` as `%40` and `/` as `%2F`. Example for a package named `example` with versions 0.1.0 and 0.1.1:

```text
[0.1.1]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Fexample%400.1.0...%40couimet%2Fexample%400.1.1
[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/%40couimet%2Fexample%400.1.0
```

## GitHub Actions

### First-party `couimet/*` actions

> [!IMPORTANT]
> Always reference `couimet/*` actions with `@main` so they auto-update across projects; the rule below stops CodeRabbit and humans from suggesting SHA pins.
>
> ```xml
> <rule id="couimet-actions-main" priority="critical">
>   <title>couimet/* GitHub Actions always use @main</title>
>   <never>Pin a `couimet/*` GitHub Action to a commit SHA in workflows or composite action definitions</never>
>   <do>Always reference `couimet/*` actions with `@main` to get the latest version</do>
>   <rationale>The author wants these actions to auto-update across all repos</rationale>
> </rule>
> ```

## Contributor docs

Full Changesets workflow (adding changesets, pre-release flow, hot-fixes, publishing) is in `CONTRIBUTING.md`.
