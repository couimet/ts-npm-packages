#!/usr/bin/env bats

setup() {
  REPO_DIR="$(mktemp -d)"
  MOCK_DIR="$(mktemp -d)"
  export PATH="${MOCK_DIR}:${PATH}"
}

teardown() {
  rm -rf "${REPO_DIR}" "${MOCK_DIR}"
}

# Helper: create a mock git that returns controlled output for rev-parse and diff.
# Writes diff output to a temp file (read by the mock) to safely handle multiline content.
mock_git() {
  local toplevel="${1:?}"
  local diff_output="${2:-}"
  local base_ref="${3:-origin/main}"

  printf '%s\n' "$diff_output" > "${MOCK_DIR}/diff_output"

  cat > "${MOCK_DIR}/git" << EOF
#!/usr/bin/env bash
if [[ "\$*" = "rev-parse --show-toplevel" ]]; then
  echo "${toplevel}"
elif [[ "\$*" = "diff --name-only --diff-filter=AR ${base_ref}...HEAD -- packages/*/package.json" ]]; then
  cat "${MOCK_DIR}/diff_output"
else
  echo "unexpected git args: \$*" >&2
  exit 1
fi
EOF
  chmod +x "${MOCK_DIR}/git"
}

@test "exits 0 when no packages are added or renamed" {
  mock_git "${REPO_DIR}" ""
  run bash scripts/check-readme-staleness.sh origin/main
  [[ "$status" -eq 0 ]]
  [[ -z "$output" ]]
}

@test "exits 0 when all new packages are in README" {
  echo "| \`@couimet/foo\` | description |" > "${REPO_DIR}/README.md"
  mock_git "${REPO_DIR}" "packages/foo/package.json"
  run bash scripts/check-readme-staleness.sh origin/main
  [[ "$status" -eq 0 ]]
  [[ -z "$output" ]]
}

@test "exits 1 when a new package is missing from README" {
  echo "| \`@couimet/other\` | description |" > "${REPO_DIR}/README.md"
  mock_git "${REPO_DIR}" "packages/foo/package.json"
  run bash scripts/check-readme-staleness.sh origin/main
  [[ "$status" -eq 1 ]]
  [[ "$output" == *"ERROR"* ]]
  [[ "$output" == *"@couimet/foo"* ]]
}

@test "exits 1 and lists all missing packages" {
  echo "| \`@couimet/bar\` | description |" > "${REPO_DIR}/README.md"
  mock_git "${REPO_DIR}" $'packages/foo/package.json\npackages/baz/package.json'
  run bash scripts/check-readme-staleness.sh origin/main
  [[ "$status" -eq 1 ]]
  [[ "$output" == *"@couimet/foo"* ]]
  [[ "$output" == *"@couimet/baz"* ]]
  [[ "$output" != *"@couimet/bar"* ]]
}

@test "exits 0 when a renamed package is in README" {
  echo "| \`@couimet/newname\` | description |" > "${REPO_DIR}/README.md"
  mock_git "${REPO_DIR}" "packages/newname/package.json" "origin/main"
  run bash scripts/check-readme-staleness.sh origin/main
  [[ "$status" -eq 0 ]]
  [[ -z "$output" ]]
}

@test "exits 1 when package is in README prose but not in table" {
  cat > "${REPO_DIR}/README.md" << EOF
# Header

Some mention of @couimet/foo in prose, but not in the table below.

## Available packages

| \`@couimet/bar\` | something |
EOF
  mock_git "${REPO_DIR}" "packages/foo/package.json"
  run bash scripts/check-readme-staleness.sh origin/main
  [[ "$status" -eq 1 ]]
  [[ "$output" == *"ERROR"* ]]
  [[ "$output" == *"@couimet/foo"* ]]
}

@test "usage error when no base ref provided" {
  run bash scripts/check-readme-staleness.sh
  [[ "$status" -ne 0 ]]
}
