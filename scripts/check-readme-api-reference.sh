#!/usr/bin/env bash
set -euo pipefail

# Check that every public symbol a package ships is documented in its README.
#
# The barrel at packages/<name>/src/index.ts defines the public API, so this script walks each
# module the barrel re-exports, collects the symbols that module exports, and fails when the
# package README never mentions one. A package README that carries an "## API reference" section
# is checked inside that section, which is where the standard puts the documentation. A README
# that predates the standard carries no such section, so the whole file is searched instead.
#
# Private packages are skipped: they are never published, so the standard does not apply.
# Usage: check-readme-api-reference.sh [repo-root]

REPO_ROOT="${1:-$(pwd)}"
violations=0

for barrel in "$REPO_ROOT"/packages/*/src/index.ts; do
  [ -f "$barrel" ] || continue

  pkg_dir="$(dirname "$(dirname "$barrel")")"
  pkg_name="$(basename "$pkg_dir")"
  relative_pkg="packages/${pkg_name}"

  manifest="${pkg_dir}/package.json"
  if [ -f "$manifest" ] && [ "$(jq -r '.private // false' "$manifest")" = "true" ]; then
    continue
  fi

  readme="${pkg_dir}/README.md"
  if [ ! -f "$readme" ]; then
    echo "ERROR: ${relative_pkg}/README.md is missing." >&2
    violations=$((violations + 1))
    continue
  fi

  if grep -qE '^## API reference$' "$readme"; then
    scope="$(awk '/^## API reference$/{flag=1;next}/^## /{flag=0}flag' "$readme")"
    scope_label="the '## API reference' section"
  else
    scope="$(cat "$readme")"
    scope_label="the README"
  fi

  while IFS= read -r specifier; do
    [ -n "$specifier" ] || continue

    module_file="${pkg_dir}/src/${specifier}.ts"
    if [ ! -f "$module_file" ]; then
      echo "ERROR: ${relative_pkg}/src/index.ts re-exports './${specifier}', but src/${specifier}.ts does not exist." >&2
      violations=$((violations + 1))
      continue
    fi

    while IFS= read -r symbol; do
      [ -n "$symbol" ] || continue

      if ! grep -qwF -- "$symbol" <<< "$scope"; then
        echo "ERROR: ${relative_pkg}/src/${specifier}.ts exports '${symbol}', which ${scope_label} of ${relative_pkg}/README.md does not mention." >&2
        violations=$((violations + 1))
      fi
    done < <(grep -oE '^export (declare )?(abstract )?(class|function|const|let|var|interface|type|enum) [A-Za-z0-9_]+' "$module_file" | awk '{print $NF}')
  done < <(grep -oE "^export .*from '\./[^']+'" "$barrel" | grep -oE "'\./[^']+'" | sed "s/'\.\///;s/'$//;s/\.js$//")
done

if [ "$violations" -gt 0 ]; then
  echo "Found $violations README API reference violation(s)" >&2
  exit 1
fi
