#!/usr/bin/env bats

setup() {
  MOCK_DIR="$(mktemp -d)"
  export PATH="${MOCK_DIR}:${PATH}"
  rm -f /tmp/changeset-packages.txt
}

teardown() {
  rm -rf "${MOCK_DIR}"
  rm -f /tmp/changeset-packages.txt
}

# ── helpers ──

write_git_mock() {
  # $1: tags (newline-separated, newest first), or empty for no tags
  # $2: diff output (newline-separated package paths), or empty for no changes
  local tags="${1:-}"
  local diff_out="${2:-}"

  if [ -z "${tags}" ] && [ -z "${diff_out}" ]; then
    cat > "${MOCK_DIR}/git" << 'SCRIPT'
#!/usr/bin/env bash
if [[ "$*" == *"tag --sort=-creatordate"* ]]; then
  exit 0
fi
if [[ "$*" == *"diff"* ]]; then
  exit 0
fi
SCRIPT
  elif [ -n "${tags}" ] && [ -z "${diff_out}" ]; then
    cat > "${MOCK_DIR}/git" << SCRIPT
#!/usr/bin/env bash
if [[ "\$*" == *"tag --sort=-creatordate"* ]]; then
  cat << 'TAGS'
${tags}
TAGS
fi
if [[ "\$*" == *"diff"* ]]; then
  exit 0
fi
SCRIPT
  elif [ -z "${tags}" ] && [ -n "${diff_out}" ]; then
    cat > "${MOCK_DIR}/git" << SCRIPT
#!/usr/bin/env bash
if [[ "\$*" == *"tag --sort=-creatordate"* ]]; then
  exit 0
fi
if [[ "\$*" == *"diff"* ]]; then
  cat << 'DIFF'
${diff_out}
DIFF
fi
SCRIPT
  else
    cat > "${MOCK_DIR}/git" << SCRIPT
#!/usr/bin/env bash
if [[ "\$*" == *"tag --sort=-creatordate"* ]]; then
  cat << 'TAGS'
${tags}
TAGS
fi
if [[ "\$*" == *"diff"* ]]; then
  cat << 'DIFF'
${diff_out}
DIFF
fi
SCRIPT
  fi
  chmod +x "${MOCK_DIR}/git"
}

write_pnpm_mock() {
  # $1: exit code to return from changeset status
  local exit_code="${1:-0}"
  cat > "${MOCK_DIR}/pnpm" << SCRIPT
#!/usr/bin/env bash
if [[ "\$*" == *"changeset status"* ]]; then
  exit ${exit_code}
fi
exit 0
SCRIPT
  chmod +x "${MOCK_DIR}/pnpm"
}

# ── tests ──

@test "exits 2 when no base ref argument given" {
  run bash scripts/ci-changeset-check.sh
  [[ "$status" -eq 2 ]]
  [[ "$output" == *"Usage"* ]]
}

@test "falls back to base ref when no tags exist" {
  write_git_mock "" ""
  write_pnpm_mock 0

  run bash scripts/ci-changeset-check.sh "origin/main"

  [[ "$status" -eq 0 ]]
  [[ "$output" == *"Using comparison ref: origin/main"* ]]
}

@test "uses latest tag when tags exist" {
  write_git_mock $'@couimet/eslint-config@0.4.0\n@couimet/eslint-config@0.3.0' ""
  write_pnpm_mock 0

  run bash scripts/ci-changeset-check.sh "origin/main"

  [[ "$status" -eq 0 ]]
  [[ "$output" == *"Using comparison ref: @couimet/eslint-config@0.4.0"* ]]
}

@test "passes through changeset status exit 0" {
  write_git_mock "@couimet/eslint-config@0.4.0" ""
  write_pnpm_mock 0

  run bash scripts/ci-changeset-check.sh "origin/main"
  [[ "$status" -eq 0 ]]
}

@test "passes through changeset status exit 1" {
  write_git_mock "@couimet/eslint-config@0.4.0" ""
  write_pnpm_mock 1

  run bash scripts/ci-changeset-check.sh "origin/main"
  [[ "$status" -eq 1 ]]
}

@test "prefers the single latest tag when multiple exist" {
  write_git_mock $'@couimet/logger-contract-adapters@0.1.0\n@couimet/eslint-config@0.4.0\n@couimet/detailed-error@0.1.0' ""
  write_pnpm_mock 0

  run bash scripts/ci-changeset-check.sh "origin/develop"

  [[ "$status" -eq 0 ]]
  [[ "$output" == *"Using comparison ref: @couimet/logger-contract-adapters@0.1.0"* ]]
}

@test "writes changed package names to temp file" {
  write_git_mock "@couimet/eslint-config@0.4.0" $'packages/eslint-config/README.md\npackages/logger/src/index.ts'
  write_pnpm_mock 0

  run bash scripts/ci-changeset-check.sh "origin/main"
  [[ "$status" -eq 0 ]]
  [[ "$(cat /tmp/changeset-packages.txt)" == "eslint-config, logger" ]]
}

@test "writes empty temp file when no packages changed" {
  write_git_mock "@couimet/eslint-config@0.4.0" ""
  write_pnpm_mock 0

  run bash scripts/ci-changeset-check.sh "origin/main"
  [[ "$status" -eq 0 ]]
  [[ "$(cat /tmp/changeset-packages.txt)" == "" ]]
}
