#!/bin/bash
set -euo pipefail

# Check that new or renamed packages in this branch appear in the root README table.
# Usage: check-readme-staleness.sh <base-ref>
#   e.g. check-readme-staleness.sh origin/main

base="${1:?Usage: check-readme-staleness.sh <base-ref>}"

repo_root=$(git rev-parse --show-toplevel)
cd "$repo_root"

# Find packages added (A) or renamed (R) in this branch vs base
changed=$(git diff --name-only --diff-filter=AR "$base"...HEAD -- 'packages/*/package.json' | sed 's|packages/||;s|/package.json||')

if [[ -z "$changed" ]]; then
  exit 0
fi

missing=()
while IFS= read -r pkg; do
  [[ -z "$pkg" ]] && continue
  if ! grep -q "| \`@couimet/$pkg\` |" README.md; then
    missing+=("$pkg")
  fi
done <<< "$changed"

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "ERROR: Root README.md 'Available packages' table is missing these packages:"
  for pkg in "${missing[@]}"; do
    echo "  - @couimet/$pkg"
  done
  echo "Add them to the table before finalizing."
  exit 1
fi
