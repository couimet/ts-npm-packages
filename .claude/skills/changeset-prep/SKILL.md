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
{ git diff --name-only <base> -- packages/
  git ls-files --others --exclude-standard -- packages/
} | cut -d'/' -f2 | sort -u
```

Uses `<base>` without `..HEAD` so uncommitted working-tree changes are included, and `git ls-files --others` adds untracked files that `git diff` would otherwise miss (e.g., a newly scaffolded package not yet staged). On a fresh branch with zero commits, `..HEAD` compares identical refs and always produces an empty diff.

If the output is empty, no workspace packages changed. Write a note via `/note` with description `changeset-prep` saying "No workspace packages changed. No changeset needed." and STOP.

## Step 3: Detect Issue Context

Run:

```bash
git branch --show-current
```

If the branch starts with `issues/`, extract the segment after `issues/`. Take characters up to the first `-` or `_`. If those characters are purely numeric, treat this as an issue branch: record the issue number for description generation in Step 5. If the segment is non-numeric (e.g., `issues/foo-bar` or `issues/123abc`), skip issue lookup entirely and use the commit-summary description path in Step 5 instead.

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
gh issue view <NUMBER> --json title,body -q '{title: .title, body: .body}'
```

Use the issue title and body to understand what changed, then write a Keep a Changelog entry from scratch. Do not copy the issue title verbatim — issue titles are summaries, not changelog entries.

**If not on an issues branch**, use the first commit summary as context:

```bash
git log --oneline <base>..HEAD | head -1
```

If the output is empty (no commits on the branch, only uncommitted changes), use the diff itself as context and write the description from scratch.

Strip any leading `[issues/<NUMBER>]` prefix from the commit message.

### Keep a Changelog Description Format

Prefix each description with a category that matches the bump level from Step 4: `Added:` (minor), `Fixed:` (patch), `Changed:` or `Removed:` (major). The user copies these directly into the interactive `pnpm changeset` description prompt.

The description after the prefix must follow Keep a Changelog conventions:

- **Past tense**, describing what was fixed/added/changed from the consumer's perspective.
- **Specific** — name the file, export, or behavior that changed. Prefer backtick-quoted identifiers.
- **One sentence per logical change.** When a changeset covers multiple changes under the same bump level, join them with a comma or semicolon. Avoid "and" chains beyond two items; use separate sentences for distinct fixes.
- **No issue numbers, no PR references, no meta-commentary.** The description becomes a CHANGELOG bullet; it must stand on its own without the issue tracker for context.

Good:
Fixed: `setup-before-jest-30.d.ts` emitted as a script instead of a module, preventing type augmentation from resolving for tsc/ts-jest consumers.
Fixed: `@couimet/detailed-error-testing` incorrectly marked as an optional peer dependency despite being unconditionally required by all entry points.
Added: `createMockMatcherContext()` helper for testing custom matchers without Jest internals.

Bad:
Fixed: two setup bugs — .d.ts emitted as script, optional peer incorrectly marked
Added: new features and improvements
Fixed: fix the thing

## Step 6: Check for Existing Changesets

```bash
ls .changeset/*.md 2>/dev/null | grep -v README || true
```

If any `.md` files exist (beyond README.md), record them. The note will mention that existing changesets were found so the user can decide whether additional entries are needed.

## Step 7: Write Note File

Use `/note` with description `changeset-prep`.

The note content must include:

- A `pnpm changeset` command header
- A table of package / bump / description rows, one per changed package. Omit packages classified as `skip` — they need no changeset entry. When every changed package is skip, write "No changeset needed." instead of a command table.
- Reasoning for each recommendation (one-line summary of what the diff showed)
- If existing changesets were found, a note listing them

Format:

```text
Run: pnpm changeset

When prompted, enter:

  @couimet/<name>   major   Removed: `legacyParse()` export; `parse()` replaced it.
  @couimet/<name>   minor   Added: `createMockMatcherContext()` helper for testing custom matchers without Jest internals.
  @couimet/<name>   patch   Fixed: `setup-before-jest-30.d.ts` emitted as a script instead of a module, preventing type augmentation from resolving for tsc/ts-jest consumers.

Reasoning:
- @couimet/<name>: removed export `foo` → major (Removed)
- @couimet/<name>: new export `bar` → minor (Added)
- @couimet/<name>: internal refactor, no API changes → patch (Fixed)
```

Omit both the command table and the Reasoning section when all packages are skip-level. Write "No changeset needed." instead. If existing changesets were found, add:

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
