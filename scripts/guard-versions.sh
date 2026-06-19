#!/usr/bin/env bash
# Usage: guard-versions.sh <target_ref> <head_ref>
# Checks changed files for pre-release versions that must not land on main.

set +e
had_errors=0

target_ref="$1"
head_ref="$2"

if [[ -z "$target_ref" || -z "$head_ref" ]]; then
  echo "Usage: guard-versions.sh <target_ref> <head_ref>" >&2
  exit 2
fi

if ! changed_files=$(git diff --name-only "${target_ref}...${head_ref}"); then
  echo "::error::git diff failed — cannot resolve refs '${target_ref}...${head_ref}'" >&2
  exit 2
fi

# Check 1: no pre-release versions in package.json files
echo "::group::Checking package.json version fields"
pkg_jsons=$(echo "$changed_files" | grep 'packages/.*/package.json$' || true)
if [[ -n "$pkg_jsons" ]]; then
  while IFS= read -r file; do
    ver=$(jq -r '.version // empty' "$file")
    if [[ -n "$ver" ]] && echo "$ver" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+-.+'; then
      echo "::error file=${file}::Pre-release version '${ver}' found in ${file}. Use a stable semver (x.y.z) for main branch PRs."
      had_errors=1
    fi
  done <<< "$pkg_jsons"
fi
echo "::endgroup::"

# Check 2: no pre-release versions in changeset files
echo "::group::Checking changeset version entries"
changesets=$(echo "$changed_files" | grep '\.changeset/.*\.md$' || true)
if [[ -n "$changesets" ]]; then
  while IFS= read -r cs_file; do
    prerelease_lines=$(grep -E '"[^"]+":\s*"[^"]*-[^"]+"|"[^"]+":\s*[0-9]+\.[0-9]+\.[0-9]+-[^[:space:]]+' "$cs_file" || true)
    if [[ -n "$prerelease_lines" ]]; then
      while IFS= read -r bad_line; do
        echo "::error file=${cs_file}::Pre-release version entry in changeset: ${bad_line}"
      done <<< "$prerelease_lines"
      had_errors=1
    fi
  done <<< "$changesets"
fi
echo "::endgroup::"

# Check 3: no .changeset/pre.json
echo "::group::Checking for pre-release mode config"
if echo "$changed_files" | grep -q '\.changeset/pre\.json'; then
  echo "::error file=.changeset/pre.json::pre.json must not be merged to main. Exit pre-release mode first."
  had_errors=1
fi
if [[ -f .changeset/pre.json ]]; then
  echo "::error file=.changeset/pre.json::pre.json is present in the working tree. Remove it before merging to main."
  had_errors=1
fi
echo "::endgroup::"

if [[ "$had_errors" -ne 0 ]]; then
  echo ""
  echo "Pre-release versions are not allowed in main-branch PRs."
  echo "Feature branches: use 'pnpm changeset pre enter <tag>' for pre-release testing, then 'pnpm changeset pre exit' and clean up changelogs before merging."
  exit 1
fi
