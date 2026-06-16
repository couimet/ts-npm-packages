#!/usr/bin/env bash
set -euo pipefail
# Refuse to run on the main branch.
if [[ "$(git branch --show-current)" == main ]]; then
  echo "ERROR: this command cannot run on main" >&2
  exit 1
fi
