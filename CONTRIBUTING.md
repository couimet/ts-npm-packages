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

This section covers the stable release flow (changeset → PR → merge to main → auto-publish). If you need to test a package in a downstream repo before merging, skip ahead to the [pre-release flow](#testing-a-branch-end-to-end-before-merging) and use `/publish-prerelease-prepare` + `/publish-prerelease-publish` instead.

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
pnpm changeset:version
```

This consumes every pending changeset and writes the corresponding version bumps into `package.json` files and `CHANGELOG.md` entries. Commit the results. To check all package versions at a glance, run `pnpm version:list`.

## Testing a branch end-to-end before merging

Changesets supports a pre-release mode for intermediate publishes so you can test a package in downstream repos without merging first.

The recommended approach uses two Claude Code skills:

- `/publish-prerelease-prepare` — interviews you for the tag, packages, and bump type, then runs the full sequence locally (enter pre-release mode, create changeset, bump versions, commit). Idempotent — safe to re-run.
- `/publish-prerelease-publish` — pushes your branch and prints the workflow dispatch link. CI publishes with GitHub Actions OIDC trusted publishing, so no npm token is involved; your laptop never sees a registry credential.

No PR is needed for a pre-release publish. Push the feature branch to remote, then manually trigger the Publish workflow from that branch.

If you prefer to run the steps by hand:

1. **Enter pre-release mode** — use `dev` unless you need a different tag for the branch:

   ```bash
   pnpm changeset:pre-dev
   ```

   Or use `pnpm changeset pre enter <tag>` for a custom tag (`alpha`, `beta`, `rc`). The pre-release tag becomes the npm dist-tag that CI publishes under. All shortcut scripts (`changeset:pre-dev`, `changeset:pre-alpha`, `changeset:pre-beta`, `changeset:pre-exit`) refuse to run on `main` via the `guard:not-main` check.

2. **Make changes and add changesets** as usual (`pnpm changeset`).

3. **Apply the pre-release versions**:

   ```bash
   pnpm changeset:version
   ```

   This produces versions like `1.0.1-<tag>.0`. Verify with `pnpm version:list`. Commit the results.

4. **Publish the test version** — go to the [Publish workflow](https://github.com/couimet/ts-npm-packages/actions/workflows/publish.yml), select **Run workflow**, and set the branch to your PR branch. The workflow publishes under the pre-release tag from step 1, which becomes the npm dist-tag. The workflow fails unless `.changeset/pre.json` records `mode` as `pre`. It also fails when a package version changed on the branch does not carry the pre-release tag. A branch therefore cannot publish a plain version under `latest`. The workflow also refuses to publish if only changeset files and version bumps were modified — at least one real source file must change.

5. **Test in consuming repos** — install the tagged version (`pnpm add @couimet/<pkg>@<tag>`). Verify what's on npm with `pnpm version:check-registry`.

6. **Exit pre-release mode**:

   ```bash
   pnpm changeset:pre-exit
   ```

7. **Clean up** — remove the pre-release changelog entries and version suffixes, leaving only the stable changelog content. Commit, push, and merge the PR.

8. **Publish the stable version** — merging to `main` triggers the Publish workflow automatically (push to `main`).

## Hot-fix path

Follow the same steps as above but skip pre-release mode when you need to ship urgently. Add a changeset, run `pnpm changeset:version`, create the PR against `main`, and publish from `main` after merge.

## Automated publishing

Publishing is handled by the GitHub Actions workflow at `.github/workflows/publish.yml`:

- **Push to `main`** — runs automatically. Publishes stable versions and pushes git tags.
- **Workflow dispatch** — run manually from any branch in pre-release mode. Publishes under the pre-release tag instead of `latest`. Useful for pre-release testing.

Both paths use GitHub Actions OIDC trusted publishing and need no long-lived npm token. The job grants `id-token: write` and runs in the `production` environment. npm exchanges the GitHub OIDC token for a short-lived credential, and it accepts the exchange only when a trusted publisher on the package names this repository (`couimet/ts-npm-packages`), this workflow file (`publish.yml`), and the `production` environment. npm also attaches a provenance attestation to each published version.

A trusted publisher expires when no trusted publish succeeds within two days of creating the relationship. Check a package with `npm trust list @couimet/<package>`. A 404 on the publish PUT means the package has no trusted publisher, the repository, workflow file, or environment does not match the relationship, or the package does not exist yet. Fix the trusted publisher on npmjs.com, or create the package with the procedure below.

## Branch protection

Merges to `main` are gated by the CI workflow (`.github/workflows/ci.yml`). PRs must also pass a changeset check — run `pnpm changeset` to add one. The `guard-versions` check blocks pre-release semver suffixes in `package.json`, pre-release version entries in `.changeset/*.md` files, and `.changeset/pre.json` (including when present as an untracked working-tree file); use the feature-branch pre-release flow above if you need intermediate publishes, and clean everything up before the final merge.

## Scaffolding a package

```bash
./scripts/create-package.sh
```

Prompts for the package name (without the `@couimet/` prefix) and a one-line description. The script generates a ready-to-edit package directory with `tsconfig.json`, `jest.config.js`, eslint config, `CHANGELOG.md`, and a `src/` skeleton. The scaffold writes the `repository` field, which the trusted publisher needs.

## New package procedure

A trusted publisher attaches to a package that already exists, so a new package needs one publish from a maintainer laptop before CI can publish it. Run these steps in order:

1. Run `scripts/create-package.sh` to scaffold the package.
2. Add a changeset and merge the package to `main`.
3. Run `pnpm build` from the repo root.
4. Publish the first version from a maintainer laptop. Run an interactive `npm login` with 2FA, then run `pnpm publish --access public --no-git-checks` in the package directory. Trusted publishing cannot bootstrap a package that does not exist.
5. Create the trusted publisher. The `npm trust` command requires npm 11.15.0 or above. Node 24.16 bundles npm 11.13.0, so upgrade npm first with `npm install -g npm@^11.15.0`.

   ```bash
   npm trust github @couimet/<package> --repo couimet/ts-npm-packages --file publish.yml --env production --allow-publish -y
   ```

6. Run `npm trust list @couimet/<package>` and confirm the publish permission.
7. Create a second version for the first trusted publish. Add a changeset for the package if none is pending, then run `pnpm changeset:version` and commit the result. Merge a PR with it to `main`. The merge triggers the Publish workflow, which publishes the new version through the trust relationship.
8. Confirm that the trusted publish succeeded within 2 days of step 5. If the deadline passes, re-create the relationship.
9. Later pushes to `main` publish with OIDC and no token.
