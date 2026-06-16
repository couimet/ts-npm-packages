#!/usr/bin/env bash
# Compare local package versions against the npm registry.
set -euo pipefail

pnpm version:list | while read -r spec; do
  name="${spec%@*}"
  local_ver="${spec##*@}"
  npm_ver=$(npm view "$name" version 2>/dev/null || echo 'NOT FOUND')
  if [[ "$local_ver" == "$npm_ver" ]]; then
    echo "OK  $name@$local_ver"
  else
    echo "MISMATCH  $name: local=$local_ver npm=$npm_ver"
  fi
done
