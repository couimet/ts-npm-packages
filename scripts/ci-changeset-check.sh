#!/usr/bin/env bash
set -euo pipefail

# Validate a string as a well-formed SemVer version (semver.org 2.0.0): a
# zero-free numeric core with optional dot-separated prerelease and build
# identifiers that are nonempty and may contain hyphens. Numeric prerelease
# identifiers must not carry leading zeroes (build metadata is exempt).
valid_semver() {
  local v="$1"
  [[ "$v" =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$ ]] || return 1
  # Reject leading zeroes in numeric prerelease identifiers, e.g. 1.0.0-01
  if [ -n "${BASH_REMATCH[4]:-}" ]; then
    local pre="${BASH_REMATCH[4]#-}"
    local id
    local -a ids
    IFS='.' read -r -a ids <<< "$pre"
    for id in "${ids[@]}"; do
      if [[ "$id" =~ ^0[0-9]+$ ]]; then return 1; fi
    done
  fi
  return 0
}

# Compare two semantic versions (X.Y.Z, X.Y.Z-prerelease, or with +build metadata).
# Returns 0 if $1 is a valid version strictly greater than $2; rejects invalid,
# equal, and downgraded versions. Build metadata is ignored when comparing
# precedence per SemVer. An empty $2 (newly added package) accepts any valid $1.
semver_gt() {
  local cur="$1" base="$2"
  valid_semver "$cur" || return 1
  [ -z "$base" ] && return 0
  valid_semver "$base" || return 1
  # Strip build metadata (e.g. +build.7) so it is ignored for precedence
  cur="${cur%%+*}"
  base="${base%%+*}"
  local -a cur_parts base_parts
  local i c b
  IFS='.' read -r -a cur_parts <<< "${cur%%-*}"
  IFS='.' read -r -a base_parts <<< "${base%%-*}"
  for i in 0 1 2; do
    c="${cur_parts[$i]}"
    b="${base_parts[$i]}"
    if [ "$c" -gt "$b" ]; then return 0; fi
    if [ "$c" -lt "$b" ]; then return 1; fi
  done
  # Numeric core equal: a release version beats a prerelease; otherwise compare
  # the prerelease identifiers per SemVer precedence.
  if [[ "$cur" == *"-"* ]] && [[ "$base" != *"-"* ]]; then return 1; fi
  if [[ "$cur" != *"-"* ]] && [[ "$base" == *"-"* ]]; then return 0; fi

  local -a cur_ids base_ids
  local idx max_len a b
  IFS='.' read -r -a cur_ids <<< "${cur#*-}"
  IFS='.' read -r -a base_ids <<< "${base#*-}"
  if [ "${#cur_ids[@]}" -gt "${#base_ids[@]}" ]; then
    max_len="${#cur_ids[@]}"
  else
    max_len="${#base_ids[@]}"
  fi
  for ((idx = 0; idx < max_len; idx++)); do
    a="${cur_ids[$idx]:-}"
    b="${base_ids[$idx]:-}"
    # A shorter equal prefix is lower precedence (e.g. alpha < alpha.1)
    if [ -z "$a" ]; then return 1; fi
    if [ -z "$b" ]; then return 0; fi
    if [[ "$a" =~ ^[0-9]+$ ]] && [[ "$b" =~ ^[0-9]+$ ]]; then
      if [ "$a" -gt "$b" ]; then return 0; fi
      if [ "$a" -lt "$b" ]; then return 1; fi
    elif [[ "$a" =~ ^[0-9]+$ ]]; then
      # Numeric identifiers sort before alphanumeric identifiers
      return 1
    elif [[ "$b" =~ ^[0-9]+$ ]]; then
      return 0
    elif [[ "$a" < "$b" ]]; then
      return 1
    elif [[ "$a" > "$b" ]]; then
      return 0
    fi
  done
  return 1  # identical prereleases are not greater
}

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
  if ! semver_gt "$cur_ver" "$base_ver"; then
    echo "ERROR: ${pkg} changed but version ${cur_ver} is not bumped relative to ${BASE_REF}." >&2
    post_version_ok=0
    continue
  fi
  if ! grep -Fqx -- "## [${cur_ver%%+*}]" "$pkg_dir/CHANGELOG.md"; then
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
