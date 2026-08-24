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

# Hard fail: unconsumed changeset files mean `pnpm changeset:version` was not run
for changeset in .changeset/*.md; do
  [ -e "$changeset" ] || continue
  [ "$(basename "$changeset")" = "README.md" ] && continue
  echo "ERROR: unconsumed changeset file ${changeset} found. Run 'pnpm changeset:version' to apply it before merging." >&2
  exit 1
done

# Gate A: mid-workflow changesets are rejected above, so status now passes only when
# there is nothing left to release
if pnpm exec changeset status --since="$BASE_REF"; then
  exit 0
fi

# Gate B: post-`changeset:version` state — every changed package must be bumped above
# the base ref and carry a matching changelog entry
post_version_ok=1
changed_count=0
while IFS= read -r pkg; do
  [ -z "$pkg" ] && continue
  changed_count=$((changed_count + 1))
  pkg_dir="packages/${pkg}"
  if [ ! -f "$pkg_dir/package.json" ]; then
    echo "ERROR: ${pkg_dir}/package.json missing for changed package ${pkg}." >&2
    post_version_ok=0
    continue
  fi
  cur_ver=$(jq -r '.version // empty' "$pkg_dir/package.json")
  base_ver=$(git show "$BASE_REF:$pkg_dir/package.json" 2>/dev/null | jq -r '.version // empty' || true)
  if [ "$cur_ver" = "$base_ver" ]; then
    echo "ERROR: ${pkg} changed but version ${cur_ver} is not bumped relative to ${BASE_REF}." >&2
    post_version_ok=0
    continue
  fi
  if ! grep -Fq "## [${cur_ver}]" "$pkg_dir/CHANGELOG.md"; then
    echo "ERROR: ${pkg} version ${cur_ver} has no matching entry in ${pkg_dir}/CHANGELOG.md." >&2
    post_version_ok=0
  fi
done < <(tr ',' '\n' < /tmp/changeset-packages.txt | sed 's/^ //')

if [ "$changed_count" -eq 0 ]; then
  echo "ERROR: changeset status failed but no changed packages were found." >&2
  exit 1
fi

if [ "$post_version_ok" -eq 1 ]; then
  exit 0
fi

exit 1
