#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${1:-$(pwd)}"
violations=0

for changelog in "$REPO_ROOT"/packages/*/CHANGELOG.md; do
  [ -f "$changelog" ] || continue

  # Check 1: No semver bump headings (### Major/Minor/Patch Changes)
  if grep -qnE '^### (Major|Minor|Patch) Changes$' "$changelog"; then
    echo "ERROR: $changelog contains semver bump headings (Major/Minor/Patch Changes). Use keep-a-changelog categories (Added, Changed, Fixed, etc.)." >&2
    violations=$((violations + 1))
  fi

  # Check 2: No bare version headers (## X.Y.Z without brackets)
  if grep -qnE '^## [0-9]+\.[0-9]+\.[0-9]+' "$changelog"; then
    echo "ERROR: $changelog contains bare version headers (missing brackets around version number)." >&2
    violations=$((violations + 1))
  fi

  # Check 3: No version blocks above the changelog-entries marker
  if grep -q '^<!-- changelog-entries -->' "$changelog"; then
    if sed -n '1,/^<!-- changelog-entries -->/p' "$changelog" | grep -qE '^## \[[0-9]+\.[0-9]+\.[0-9]+'; then
      echo "ERROR: $changelog has version blocks above the <!-- changelog-entries --> marker." >&2
      violations=$((violations + 1))
    fi
  fi

  # Check 4: Every ## [X.Y.Z] version header has a corresponding [X.Y.Z]: compare link
  while IFS= read -r version; do
    if ! grep -qF "[${version}]:" "$changelog"; then
      echo "ERROR: $changelog is missing compare link for version $version." >&2
      violations=$((violations + 1))
    fi
  done < <(grep -E '^## \[[0-9]+\.[0-9]+\.[0-9]+' "$changelog" | sed 's/^## \[//;s/\].*$//')

  # Check 5: Empty line between <!-- changelog-entries --> marker and first version header
  if grep -q '^<!-- changelog-entries -->' "$changelog"; then
    marker_line="$(grep -n '^<!-- changelog-entries -->' "$changelog" | head -1 | cut -d: -f1)"
    next_line_num=$((marker_line + 1))
    next_line="$(sed -n "${next_line_num}p" "$changelog" 2>/dev/null || true)"
    if echo "$next_line" | grep -qE '^## \['; then
      echo "ERROR: $changelog is missing an empty line between <!-- changelog-entries --> marker and first version header." >&2
      violations=$((violations + 1))
    fi
  fi
done

if [ "$violations" -gt 0 ]; then
  echo "Found $violations CHANGELOG violation(s)" >&2
  exit 1
fi
