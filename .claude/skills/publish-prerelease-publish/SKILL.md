---
name: publish-prerelease-publish
description: Push the current branch and print instructions for triggering the pre-release publish workflow. Does NOT publish directly — publishing happens in CI via the workflow dispatch.
---

# Publish Pre-Release — Publish

Pushes the current branch to remote and prints the steps to trigger the pre-release publish workflow. CI publishes with GitHub Actions OIDC trusted publishing, so no npm token is involved. Your laptop never touches a registry credential.

## Execution

### Guard: refuse on main

If `git branch --show-current` is `main`, stop and tell the user this flow is for feature branches only.

### Guard: pre-release versions present

Verify at least one public package has a pre-release version suffix (`-dev.`, `-alpha.`, `-beta.`, `-rc.`). If not, tell the user to run `/publish-prerelease-prepare` first.

### Guard: commit not yet pushed

Check `git log origin/$(git branch --show-current)..HEAD --oneline`. If there are no unpushed commits, the branch is already pushed. Skip the push step and go directly to printing the workflow URL.

### 1. Push the branch

Run:

```bash
git push -u origin $(git branch --show-current)
```

### 2. Write a note with the instructions

Run `date +%Y%m%d-%H%M%S` to get a timestamp. Build the target path:

- On an `issues/<ID>` branch: `.claude-work/issues/<ID>/notes/<timestamp>-publish-instructions.txt`
- Otherwise: `.claude-work/notes/<timestamp>-publish-instructions.txt`

Create the directory (`mkdir -p`) if it doesn't exist.

Run `pnpm version:list` and filter to packages with pre-release suffixes. The npm dist-tag equals the pre-release tag, which Changesets reads from `.changeset/pre.json`. Build two install lines:

- Tag line: `pnpm add <name>@<tag> <name2>@<tag> ...`
- Explicit line: `pnpm add <name>@<version> <name2>@<version> ...`

Write the note:

```text
Publish pre-release from $(git branch --show-current)

1. Open https://github.com/couimet/ts-npm-packages/actions/workflows/publish.yml
2. Click "Run workflow" → set "Branch to publish from" (ref) to: $(git branch --show-current)
3. CI checks real code changes exist, builds, tests, publishes to npm with the <tag> dist-tag
4. Verify: pnpm version:check-registry
5. Install downstream:
   <tag-line>
   (explicit: <explicit-line>)
```

### 3. Print publish instructions

Print the same content that was written to the note file. Also print the note filepath so the user knows where to find it.

Do not attempt to run `pnpm publish` or `pnpm changeset publish` locally for a pre-release. Except for the first publish of a new package, publishing to npmjs happens through the GitHub Actions workflow.
