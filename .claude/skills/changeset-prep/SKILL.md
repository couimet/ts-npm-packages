---
name: changeset-prep
description: Analyze branch diff, recommend semver bump levels, and write copy-pasteable pnpm changeset inputs to a note file
argument-hint: [base-branch]
user-invocable: true
allowed-tools: Read, Write, Glob, Grep, Bash(git *), Bash(gh *), Bash(date *), Bash(mkdir *), Bash(cut *), Bash(sort *), Bash(head *), Bash(uniq *), Bash(ls *), Bash(grep *), Bash(*/skills/issue-context/claude-work-root.sh *), Skill
---

# Changeset Prep

Analyzes the branch diff against a base ref, finds changed workspace packages, recommends semver bump levels, and writes a note file with copy-pasteable `pnpm changeset` inputs. Does NOT write changeset files — the user runs `pnpm changeset` interactively using the note as reference.

**Input:** $ARGUMENTS (optional base branch override; defaults to `origin/main`)

## Step 1: Resolve Base Branch

If `$ARGUMENTS` is non-empty, use it as the base ref. Otherwise default to `origin/main`.

```bash
git fetch origin
```

## Step 2: Find Changed Workspace Packages

```bash
git diff --name-only <base> -- packages/ | cut -d'/' -f2 | sort -u
```

Uses `<base>` without `..HEAD` so uncommitted working-tree changes are included. On a fresh branch with zero commits, `..HEAD` compares identical refs and always produces an empty diff.

If the output is empty, no workspace packages changed. Write a note via `/note` with description `changeset-prep` saying "No workspace packages changed. No changeset needed." and STOP.

## Step 3: Detect Issue Context

Run:

```bash
git branch --show-current
```

If the branch matches `issues/<NUMBER>`, extract the issue number. Record it for description generation in Step 5. The `<NUMBER>` is characters after `issues/` up to the first `-` or `_`, only if those characters are purely numeric; otherwise use the full segment.

## Step 4: Categorize Changes per Package

For each package from Step 2, run:

```bash
git diff <base> -- packages/<name>/src/
```

Categorize using these heuristics (checked in order, first match wins):

1. **major** — any removed export (diff line starting with `-export`), or a changed export signature (diff shows both `-export` and `+export` for the same name with different signatures)
2. **minor** — any new export (diff line starting with `+export` that has no matching `-export` line for the same name)
3. **patch** — source changes under `packages/<name>/src/` but no export changes detected
4. **skip** — changes are only in `__tests__/` directories, or only in non-source files (README.md, CHANGELOG.md, package.json)

When unsure between patch and skip, default to patch. The user can downgrade during interactive `pnpm changeset`.

The heuristic only checks top-level `export` keyword lines. It does not detect renamed public methods on exported classes, changed function signatures, or removed type exports. Review the full diff for API surface changes the grep may miss. When in doubt, err toward a higher bump level.

## Step 5: Build Descriptions

**If on an issues branch** (from Step 3), fetch the issue title:

```bash
gh issue view <NUMBER> --json title -q .title
```

Use the issue title as the description for the first (or only) changed package. If multiple packages changed, append a short package-specific suffix (e.g., " — <pkg-name> components").

**If not on an issues branch**, use the first commit summary:

```bash
git log --oneline <base>..HEAD | head -1
```

Strip any leading `[issues/<NUMBER>]` prefix from the commit message.

Prefix each description with a Keep a Changelog category that matches the change: `Added:` for new exports (minor), `Fixed:` for source changes without API surface changes (patch), `Changed:` or `Removed:` for breaking changes (major). The user copies these directly into the interactive `pnpm changeset` description prompt.

## Step 6: Check for Existing Changesets

```bash
ls .changeset/*.md 2>/dev/null | grep -v README || true
```

If any `.md` files exist (beyond README.md), record them. The note will mention that existing changesets were found so the user can decide whether additional entries are needed.

## Step 7: Write Note File

Use `/note` with description `changeset-prep`.

The note content must include:

- A `pnpm changeset` command header
- A table of package / bump / description rows, one per changed package
- Reasoning for each recommendation (one-line summary of what the diff showed)
- If existing changesets were found, a note listing them

Format:

```text
Run: pnpm changeset

When prompted, enter:

  @couimet/<name>   major   Removed: <description>
  @couimet/<name>   minor   Added: <description>
  @couimet/<name>   patch   Fixed: <description>

Reasoning:
- @couimet/<name>: removed export `foo` → major (Removed)
- @couimet/<name>: new export `bar` → minor (Added)
- @couimet/<name>: internal refactor, no API changes → patch (Fixed)
```

Omit the Reasoning section if all packages are skip-level. If existing changesets were found, add:

```text
Note: existing changeset files found in .changeset/:
  - <file>.md
  - <file>.md
```

Each paragraph in the note is ONE continuous line. No fixed-column wrapping.

## Step 8: Report

Print the note path (returned by `/note`). Remind the user:

```text
Review the recommendations, then run `pnpm changeset` and use the note as reference.
```

Do NOT run `pnpm changeset` and do NOT write changeset files. The user controls the interactive prompts.
