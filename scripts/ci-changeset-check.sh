#!/usr/bin/env bash
set -euo pipefail

BASE_REF="${1:-}"

if [ -z "$BASE_REF" ]; then
  echo "Usage: ci-changeset-check.sh <base-ref>" >&2
  echo "  base-ref: PR target branch (e.g. origin/main) — used for the gate check" >&2
  exit 2
fi

# Resolve the tag ref for the package list (accumulated unreleased changes)
REF=$(git tag --sort=-creatordate | head -1)
if [ -z "$REF" ]; then
  REF="$BASE_REF"
fi

echo "Using comparison ref: $REF"

# Write the list of changed packages so the comment script can include them
git diff --name-only "$REF"..HEAD -- packages/ | cut -d'/' -f2 | sort -u | paste -sd ',' - | sed 's/,/, /g' > /tmp/changeset-packages.txt

# Gate: use PR target ref to avoid false positives on version-packages PRs
exec pnpm exec changeset status --since="$BASE_REF"
