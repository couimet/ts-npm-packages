---
name: finish-issue-hook
description: Auto-generate changeset inputs during /finish-issue
user-invocable: false
allowed-tools: Bash(*/scripts/check-readme-staleness.sh *), Bash(*/bats-tests/scripts/check-readme-staleness.bats *), Read, Write, Glob, Grep, Skill
---

# Finish-Issue Hook

Consulted automatically by `/finish-issue`.

## Additional Verification

After the standard verification steps (format, tests, status), invoke `/changeset-prep` to analyze the branch diff and write copy-pasteable `pnpm changeset` inputs to a note file under `.claude-work/issues/<ID>/notes/`. If no workspace packages changed, the skill reports that and exits — this is a no-op skip, not an error.

## README Staleness Check

After `/changeset-prep` completes (whether or not it found changes), verify every new or renamed package appears in the root `README.md` "Available packages" table. Read the base-branch marker at `<claude-work-root>/issues/<ID>/base-branch` to know which ref to diff against, then run:

```bash
bash scripts/check-readme-staleness.sh "$(cat <claude-work-root>/issues/<ID>/base-branch)"
```

If the check passes (exit 0), or the branch adds no new packages, continue with `/finish-issue` normally. If it fails (exit 1), the script prints the missing packages — add them to the table before finalizing.

Tests for the staleness script live at `bats-tests/scripts/check-readme-staleness.bats` and are exercised by `pnpm test:scripts`.
