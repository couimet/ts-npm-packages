---
name: finish-issue-hook
description: Auto-generate changeset inputs during /finish-issue
user-invocable: false
allowed-tools: Bash, Read, Write, Glob, Grep
---

# Finish-Issue Hook

Consulted automatically by `/finish-issue`.

## Additional Verification

After the standard verification steps (format, tests, status), invoke `/changeset-prep` to analyze the branch diff and write copy-pasteable `pnpm changeset` inputs to a note file under `.claude-work/issues/<ID>/notes/`. If no workspace packages changed, the skill reports that and exits — this is a no-op skip, not an error.
