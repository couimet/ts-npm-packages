---
name: publish-prerelease-prepare
description: Prepare a pre-release — interview for tag, packages, and bump type, then enter pre-release mode, create a changeset, bump versions, and commit locally. Does NOT push or publish.
---

# Publish Pre-Release — Prepare

Handles the local prep work for a pre-release: enter Changesets pre-release mode, write a changeset, bump versions, commit. Does not push to remote or trigger the publish workflow.

## Prerequisite: code changes

Before running this skill, you must have real code changes committed on your feature branch. The CI publish workflow refuses to publish a pre-release with only changeset files and version bumps. At least one source file must be modified.

## Interview flow

### Step 1: Discover packages

Run `pnpm ls -r --depth -1 --json` and parse the output. Filter out any package with `"private": true`. Build a list of `name@version` for all public packages.

### Step 2: Ask questions

Use AskUserQuestion with four questions:

**Q1 — Code changes** (single-select):

- `Changes are committed` — proceed with the prepare flow.
- `I still need to make changes` — stop here. Tell the user to make and commit real code changes first, then re-run this skill.

**Q2 — Pre-release tag** (single-select):

- `alpha` (Recommended)
- `beta`
- `rc`

**Q3 — Packages to publish** (multiSelect):
Build one option per public package discovered in Step 1. Format label as `@couimet/<name> (@<version>)`. All unchecked by default.

**Q4 — Bump type** (single-select):

- `patch` (Recommended) — e.g. 1.0.0 → 1.0.0-alpha.0
- `minor` — e.g. 1.0.0 → 1.1.0-alpha.0
- `major` — e.g. 1.0.0 → 2.0.0-alpha.0

If Q1 answer is "I still need to make changes", skip all remaining execution and tell the user to make code changes first, then re-run the skill.

## Execution (idempotent)

Each step checks current state before acting. Safe to re-run.

### Guard: refuse on main

If `git branch --show-current` is `main`, stop and tell the user to switch to a feature branch.

### Guard: dirty working tree

If `git status --porcelain` is non-empty, stop and tell the user to commit or stash first.

### Guard: real code changes

Run `git diff --name-only origin/main...HEAD` and verify at least one changed file is not under `.changeset/` and is not a `package.json`. If only changeset/version files changed, warn the user that the CI publish workflow will reject this, and ask whether to continue anyway.

### 1. Enter pre-release mode

Read `.changeset/pre.json` if it exists. If `tag` matches the chosen tag, skip. If a different tag is set, warn the user and exit (tell them to resolve manually with `pnpm changeset pre exit` first). If no `pre.json`, run `pnpm changeset pre enter <tag>`.

### 2. Skip if already versioned

Check each selected package's `package.json` version field. If any already contains `-<tag>.` (e.g. `1.0.0-alpha.0`), this flow already ran. Print the current versions via `pnpm version:list` and stop. Nothing to do.

### 3. Skip changeset creation if one already exists

If there are `.md` files in `.changeset/` beyond `README.md`, a changeset is already pending. Print "Existing changeset found, skipping creation" and proceed to step 4.

Otherwise, write a new changeset file to `.changeset/<random-slug>.md`:

```md
---
'@couimet/<pkg1>': <bump>
'@couimet/<pkg2>': <bump>
---

Pre-release for downstream testing.
```

Generate the random slug with: `node -e "console.log('pre-release-' + Math.random().toString(36).substring(2, 8))"`.

### 4. Apply versions

Run `pnpm changeset version`. Then run `pnpm version:list` so the user can verify.

### 5. Commit (locally only)

Run:

```bash
git add -A
git commit -m "$(cat <<'EOF'
Enter pre-release mode (<tag>) and bump <packages> to pre-release versions

Co-Authored-By: AI assistant
EOF
)"
```

Replace `<tag>` with the chosen tag and `<packages>` with a comma-separated list of package names.

### 6. Final output

Print:

```
Done. Commit created locally. Next:

  1. Review the commit: git log -1 --stat
  2. When ready, run: /publish-prerelease-publish
```

Do not push or attempt to publish. That is a separate step handled by the publish skill.
