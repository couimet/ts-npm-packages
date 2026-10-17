#!/usr/bin/env bash
set -euo pipefail

# Check that every public symbol a package ships is documented in its README.
#
# The barrel at packages/<name>/src/index.ts defines the public API, so this script walks each
# module the barrel re-exports, collects the symbols that module exports, and fails when the
# package README never documents one. A re-export counts whatever quote style it uses, and a grouped
# re-export counts across the lines it spans.
#
# Two modes. A README that carries an "## API reference" section is checked inside that section,
# where a symbol must hold an entry of its own: a line in a fenced block, a heading that names it,
# or a list item or paragraph that starts with it. A name that appears only inside another member's
# prose is not documentation, so it fails there. A README that predates the standard carries no such
# section, so the whole file is searched for a mention instead, which is the looser test those files
# need until issue 163 brings them to standard.
#
# Private packages are skipped: they are never published, so the standard does not apply.
# Usage: check-readme-api-reference.sh [repo-root]

REPO_ROOT="${1:-$(pwd)}"
violations=0

# Prints 0 when the section documents the symbol under an entry of its own, and 1 otherwise.
documents_symbol_entry() {
  awk -v symbol="$1" '
    BEGIN { fenced = 0; found = 0 }
    /^```/ { fenced = !fenced; next }
    {
      line = $0
      if (fenced) {
        if (index(line, symbol) > 0) { found = 1; exit }
        next
      }
      if (line ~ /^#{3,6} +/) {
        sub(/^#{3,6} +/, "", line)
        sub(/^`+/, "", line)
        if (index(line, symbol) == 1) { found = 1; exit }
        next
      }
      sub(/^[-*] +/, "", line)
      sub(/^`+/, "", line)
      if (index(line, symbol) == 1) {
        rest = substr(line, length(symbol) + 1, 1)
        if (rest == "" || rest !~ /[A-Za-z0-9_$]/) { found = 1; exit }
      }
    }
    END { exit(found ? 0 : 1) }
  '
}

# Prints the module specifiers a barrel re-exports, one per line. A re-export can use either quote
# style and can span lines, so the file first joins into one line, a line comment drops out, and each
# ` export` starts a line of its own. Every line must then begin with `export` and reach `from` before
# any `;`, which is what keeps an import out of the list.
barrel_module_specifiers() {
  sed -E 's|//.*$||' "$1" | tr '\n' ' ' | sed -E 's/ export/\nexport/g' |
    grep -oE "^export [^;]*from [\"']\./[^\"']+[\"']" |
    grep -oE "\./[^\"']+" |
    sed -E 's|^\./||; s|\.js$||'
}

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
    require_entry=true
  else
    scope="$(cat "$readme")"
    scope_label="the README"
    require_entry=false
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

      documented=false
      if [ "$require_entry" = true ]; then
        if documents_symbol_entry "$symbol" <<< "$scope"; then
          documented=true
        fi
      elif grep -qwF -- "$symbol" <<< "$scope"; then
        documented=true
      fi

      if [ "$documented" = false ]; then
        if [ "$require_entry" = true ]; then
          echo "ERROR: ${relative_pkg}/src/${specifier}.ts exports '${symbol}', which ${scope_label} of ${relative_pkg}/README.md does not document under an entry of its own." >&2
        else
          echo "ERROR: ${relative_pkg}/src/${specifier}.ts exports '${symbol}', which ${scope_label} of ${relative_pkg}/README.md does not mention." >&2
        fi
        violations=$((violations + 1))
      fi
    done < <(grep -oE '^export (declare )?(abstract )?(class|(async )?function\*?|const|let|var|interface|type|enum) [A-Za-z0-9_]+' "$module_file" | awk '{print $NF}')
  done < <(barrel_module_specifiers "$barrel")
done

if [ "$violations" -gt 0 ]; then
  echo "Found $violations README API reference violation(s)" >&2
  exit 1
fi
