# Contributing

This monorepo uses [Turborepo](https://turborepo.com/) with [Changesets](https://github.com/changesets/changesets) to manage packages, versions, and releases.

## Setup

```bash
pnpm install
pnpm build
pnpm test
```

Node 24+ and pnpm 11+ are required. The repo is configured with `engine-strict=true` and a `.nvmrc` pinning the Node version.

## Packages

Each package lives under `packages/<name>/` and publishes under the `@couimet` scope. To scaffold a new package, run `scripts/create-package.sh` from the repo root.

## Proposing a version change

When your PR should trigger a release, create a changeset at the repo root:

```bash
pnpm changeset
```

The CLI asks three things:

1. Which packages to bump.
2. Bump type — `major`, `minor`, or `patch` ([semver](https://semver.org/)).
3. A description of the change. Write it for the changelog reader: what was added, fixed, or changed, and why a consumer should care. Follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

This drops a markdown file into `.changeset/`. Commit it alongside your code changes.

## Applying versions and updating changelogs

Before merging, run:

```bash
pnpm changeset version
```

This consumes every pending changeset and writes the corresponding version bumps into `package.json` files and `CHANGELOG.md` entries. Commit the results.

## Testing a branch end-to-end before merging

Changesets supports a pre-release mode for intermediate publishes so you can test a package in downstream repos without merging first. The flow:

1. **Enter pre-release mode** — pick a short tag that identifies your branch (e.g. `alpha`, `rc`, or an issue slug):

   ```bash
   pnpm changeset pre enter <tag>
   ```

2. **Make changes and add changesets** as usual (`pnpm changeset`).

3. **Apply the pre-release versions**:

   ```bash
   pnpm changeset version
   ```

   This produces versions like `1.0.1-<tag>.0`. Commit the results.

4. **Publish the test version** — go to the [Publish workflow](https://github.com/couimet/ts-npm-packages/actions/workflows/publish.yml), select **Run workflow**, and set the branch to your PR branch. The workflow publishes with the npm `dev` dist-tag.

5. **Test in consuming repos** — install the dev-tagged version (`pnpm add @couimet/<pkg>@dev`).

6. **Exit pre-release mode**:

   ```bash
   pnpm changeset pre exit
   ```

7. **Clean up** — remove the pre-release changelog entries and version suffixes, leaving only the stable changelog content. Commit, push, and merge the PR.

8. **Publish the stable version** — merging to `main` triggers the Publish workflow automatically (push to `main`).

## Hot-fix path

Follow the same steps as above but skip pre-release mode when you need to ship urgently. Add a changeset, run `pnpm changeset version`, create the PR against `main`, and publish from `main` after merge.

## Automated publishing

Publishing is handled by the GitHub Actions workflow at `.github/workflows/publish.yml`:

- **Push to `main`** — runs automatically. Publishes stable versions and pushes git tags.
- **Workflow dispatch** — run manually from any branch. Publishes with the `dev` dist-tag instead of `latest`. Useful for pre-release testing.

Both paths require a valid `NPM_TOKEN` secret with publish rights on the `@couimet` scope.

## Branch protection

Merges to `main` are gated by the CI workflow (`.github/workflows/ci.yml`). Every PR must pass:

- `build-and-test`
- `lint-and-typecheck` (includes `format`, `lint`, and `typecheck` steps)

Additionally, PRs targeting `main` must pass `guard-versions`, which blocks pre-release semver suffixes (`1.0.0-rc.1`, `2.0.0-alpha.0`, etc.), pre-release entries in changeset files, and `.changeset/pre.json`. Use the feature-branch pre-release flow above if you need intermediate publishes; clean everything up before the final merge.

## Scaffolding a package

```bash
./scripts/create-package.sh
```

Prompts for the package name (without the `@couimet/` prefix) and a one-line description. The script generates a ready-to-edit package directory with `tsconfig.json`, `jest.config.js`, eslint config, `CHANGELOG.md`, and a `src/` skeleton.
