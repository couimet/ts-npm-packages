#!/usr/bin/env bash
set -euo pipefail

BASE_REF="${1:-}"

if [ -z "$BASE_REF" ]; then
  echo "Usage: ci-changeset-check.sh <base-ref>" >&2
  echo "  base-ref: git ref to fall back to when no tags exist (e.g. origin/main)" >&2
  exit 2
fi

REF=$(git tag --sort=-creatordate | head -1)
if [ -z "$REF" ]; then
  REF="$BASE_REF"
fi

echo "Using comparison ref: $REF"
exec pnpm exec changeset status --since="$REF"
