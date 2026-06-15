---
name: publish-prerelease-publish
description: Push the current branch and print instructions for triggering the pre-release publish workflow. Does NOT publish directly — publishing happens in CI via the workflow dispatch.
---

# Publish Pre-Release — Publish

Pushes the current branch to remote and prints the steps to trigger the pre-release publish workflow. CI handles the actual npm publish using the `NPM_TOKEN` secret. Your laptop never touches the token.

## Execution

### Guard: refuse on main

If `git branch --show-current` is `main`, stop and tell the user this flow is for feature branches only.

### Guard: pre-release versions present

Verify at least one public package has a pre-release version suffix (`-alpha.`, `-beta.`, `-rc.`). If not, tell the user to run `/publish-prerelease-prepare` first.

### Guard: commit not yet pushed

Check `git log origin/$(git branch --show-current)..HEAD --oneline`. If there are no unpushed commits, the branch is already pushed. Skip the push step and go directly to printing the workflow URL.

### 1. Push the branch

Run:

```bash
git push -u origin $(git branch --show-current)
```

### 2. Print publish instructions

```
Branch pushed. To publish:

  1. Open the Publish workflow:
     https://github.com/couimet/ts-npm-packages/actions/workflows/publish.yml

  2. Click "Run workflow" → select branch: $(git branch --show-current)

  3. CI checks that real code changes exist (not just changeset/version bumps),
     builds, tests, and publishes to npm with the "dev" dist-tag.

     The NPM_TOKEN secret is stored in GitHub repo settings. Your laptop never
     sees it — only CI can publish to npmjs.

  4. After the workflow completes, verify:
     pnpm version:check-registry

  5. Install in downstream repos:
     pnpm add @couimet/<pkg>@dev
```

Do not attempt to run `pnpm publish` or `pnpm changeset publish` locally. Publishing to npmjs happens exclusively through the GitHub Actions workflow.
