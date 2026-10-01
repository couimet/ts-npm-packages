#!/usr/bin/env bash
set -euo pipefail

# Check that the devDependency floors in scripts/create-package.sh match the workspace.
#
# The scaffold writes the shared devDependencies into every new package.json, so its floors decide
# what a new package starts with. A floor that lags the workspace makes the new package look
# different from its siblings and hands dependabot a bump it should not need.
#
# The workspace floor of a dependency is the value that the most packages declare. Packages that
# predate a floor bump still carry the older value, and they are the minority, so the majority vote
# ignores them. When two values hold the same count, the workspace agrees on no single floor, and
# this script reports that state rather than pick one.
#
# Usage: check-scaffold-floors.sh [repo-root]

REPO_ROOT="${1:-$(pwd)}"
SCAFFOLD="${REPO_ROOT}/scripts/create-package.sh"
violations=0

if [ ! -f "$SCAFFOLD" ]; then
  echo "ERROR: ${SCAFFOLD} does not exist." >&2
  exit 1
fi

# The scaffold writes each manifest through an unquoted heredoc, so the floors are read out of the
# script text. The block ends at the first closing brace at its own indentation level.
scaffold_floors="$(
  awk '/^  "devDependencies": \{$/ { flag = 1; next } flag && /^  \},?$/ { exit } flag' "$SCAFFOLD" |
    sed -E 's/^[[:space:]]*"([^"]+)":[[:space:]]*"([^"]*)",?$/\1\t\2/'
)"

if [ -z "$scaffold_floors" ]; then
  echo "ERROR: ${SCAFFOLD} carries no devDependencies block." >&2
  exit 1
fi

while IFS=$'\t' read -r name pinned; do
  [ -n "$name" ] || continue

  counts="$(jq -r --arg k "$name" '(.devDependencies // {})[$k] // empty' "$REPO_ROOT"/packages/*/package.json | sort | uniq -c | sort -rn)"
  declared="$(echo "$counts" | head -1 | sed -E 's/^[[:space:]]*[0-9]+ //')"

  if [ -z "$declared" ]; then
    echo "ERROR: ${SCAFFOLD} pins '${name}', which no package declares." >&2
    violations=$((violations + 1))
    continue
  fi

  top_count="$(echo "$counts" | head -1 | awk '{ print $1 }')"
  second_count="$(echo "$counts" | sed -n '2p' | awk '{ print $1 }')"
  if [ -n "$second_count" ] && [ "$top_count" = "$second_count" ]; then
    tied="$(echo "$counts" | awk -v n="$top_count" '$1 == n { printf "%s%s", sep, $2; sep = ", " }')"
    echo "ERROR: the workspace declares '${name}' with ${tied} at the same count, so ${SCAFFOLD} has no single floor to mirror." >&2
    violations=$((violations + 1))
    continue
  fi

  if [ "$pinned" != "$declared" ]; then
    echo "ERROR: ${SCAFFOLD} pins '${name}' at ${pinned}, but the workspace uses ${declared}." >&2
    violations=$((violations + 1))
  fi
done <<< "$scaffold_floors"

if [ "$violations" -gt 0 ]; then
  echo "Found $violations scaffold floor violation(s)" >&2
  exit 1
fi
