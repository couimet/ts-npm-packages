#!/usr/bin/env bats

setup() {
  MOCK_DIR="$(mktemp -d)"
  export PATH="${MOCK_DIR}:${PATH}"
  rm -f /tmp/changeset-packages.txt /tmp/pnpm-args
}

teardown() {
  rm -rf "${MOCK_DIR}"
  [ -n "${TMP_FIXTURE_DIR:-}" ] && rm -rf "${TMP_FIXTURE_DIR}"
  rm -f /tmp/changeset-packages.txt /tmp/pnpm-args
}

write_git_mock_with_show() {
  # $1: tag, $2: diff output, $3: base package.json content for `git show`
  local tags="${1:-}"
  local diff_out="${2:-}"
  local base_pkg_json="${3:-}"
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
if [[ "\$*" == *"show"* ]]; then
  cat << 'SHOW'
${base_pkg_json}
SHOW
fi
SCRIPT
  chmod +x "${MOCK_DIR}/git"
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
  echo "\$*" > /tmp/pnpm-args
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

@test "gate check uses base ref, not tag ref" {
  write_git_mock "@couimet/eslint-config@0.4.0" ""
  write_pnpm_mock 0

  run bash scripts/ci-changeset-check.sh "origin/main"

  [[ "$status" -eq 0 ]]
  [[ "$(cat /tmp/pnpm-args)" == *"--since=origin/main"* ]]
}

# ── post-version validation tests ──

@test "fails on unconsumed changeset files" {
  write_git_mock "@couimet/test-pkg@0.1.0" $'packages/test-pkg/src/index.ts'
  write_pnpm_mock 0
  TMP_FIXTURE_DIR="$(mktemp -d)"
  mkdir -p "${TMP_FIXTURE_DIR}/.changeset"
  touch "${TMP_FIXTURE_DIR}/.changeset/some-change.md"
  cd "${TMP_FIXTURE_DIR}"

  run bash "${BATS_TEST_DIRNAME}/../../scripts/ci-changeset-check.sh" "origin/main"

  [[ "$status" -eq 1 ]]
  [[ "$output" == *"changeset:version"* ]]
}

@test "passes when post-version state bumps versions and updates changelogs" {
  TMP_FIXTURE_DIR="$(mktemp -d)"
  mkdir -p "${TMP_FIXTURE_DIR}/packages/test-pkg"
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/package.json" << 'JSON'
{"name": "@couimet/test-pkg", "version": "0.2.0"}
JSON
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/CHANGELOG.md" << 'MD'
## [0.2.0]

### Added

- New feature
MD
  cd "${TMP_FIXTURE_DIR}"

  write_git_mock_with_show "@couimet/test-pkg@0.1.0" $'packages/test-pkg/src/index.ts' $'{"name":"@couimet/test-pkg","version":"0.1.0"}'
  write_pnpm_mock 1

  run bash "${BATS_TEST_DIRNAME}/../../scripts/ci-changeset-check.sh" "origin/main"

  [[ "$status" -eq 0 ]]
}

@test "fails when post-version bump has no changelog entry" {
  TMP_FIXTURE_DIR="$(mktemp -d)"
  mkdir -p "${TMP_FIXTURE_DIR}/packages/test-pkg"
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/package.json" << 'JSON'
{"name": "@couimet/test-pkg", "version": "0.2.0"}
JSON
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/CHANGELOG.md" << 'MD'
## [0.1.0]

### Added

- Initial release
MD
  cd "${TMP_FIXTURE_DIR}"

  write_git_mock_with_show "@couimet/test-pkg@0.1.0" $'packages/test-pkg/src/index.ts' $'{"name":"@couimet/test-pkg","version":"0.1.0"}'
  write_pnpm_mock 1

  run bash "${BATS_TEST_DIRNAME}/../../scripts/ci-changeset-check.sh" "origin/main"

  [[ "$status" -eq 1 ]]
  [[ "$output" == *"no matching entry"* ]]
}

@test "fails when changed package version is not bumped" {
  TMP_FIXTURE_DIR="$(mktemp -d)"
  mkdir -p "${TMP_FIXTURE_DIR}/packages/test-pkg"
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/package.json" << 'JSON'
{"name": "@couimet/test-pkg", "version": "0.1.0"}
JSON
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/CHANGELOG.md" << 'MD'
## [0.1.0]

### Added

- Initial release
MD
  cd "${TMP_FIXTURE_DIR}"

  write_git_mock_with_show "@couimet/test-pkg@0.1.0" $'packages/test-pkg/src/index.ts' $'{"name":"@couimet/test-pkg","version":"0.1.0"}'
  write_pnpm_mock 1

  run bash "${BATS_TEST_DIRNAME}/../../scripts/ci-changeset-check.sh" "origin/main"

  [[ "$status" -eq 1 ]]
  [[ "$output" == *"not bumped"* ]]
}

@test "fails when changed package version is a downgrade" {
  TMP_FIXTURE_DIR="$(mktemp -d)"
  mkdir -p "${TMP_FIXTURE_DIR}/packages/test-pkg"
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/package.json" << 'JSON'
{"name": "@couimet/test-pkg", "version": "0.1.0"}
JSON
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/CHANGELOG.md" << 'MD'
## [0.1.0]

### Added

- Initial release
MD
  cd "${TMP_FIXTURE_DIR}"

  write_git_mock_with_show "@couimet/test-pkg@0.2.0" $'packages/test-pkg/src/index.ts' $'{"name":"@couimet/test-pkg","version":"0.2.0"}'
  write_pnpm_mock 1

  run bash "${BATS_TEST_DIRNAME}/../../scripts/ci-changeset-check.sh" "origin/main"

  [[ "$status" -eq 1 ]]
  [[ "$output" == *"not bumped"* ]]
}

@test "fails when changed package version is invalid" {
  TMP_FIXTURE_DIR="$(mktemp -d)"
  mkdir -p "${TMP_FIXTURE_DIR}/packages/test-pkg"
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/package.json" << 'JSON'
{"name": "@couimet/test-pkg", "version": "garbage"}
JSON
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/CHANGELOG.md" << 'MD'
## [0.1.0]

### Added

- Initial release
MD
  cd "${TMP_FIXTURE_DIR}"

  write_git_mock_with_show "@couimet/test-pkg@0.1.0" $'packages/test-pkg/src/index.ts' $'{"name":"@couimet/test-pkg","version":"0.1.0"}'
  write_pnpm_mock 1

  run bash "${BATS_TEST_DIRNAME}/../../scripts/ci-changeset-check.sh" "origin/main"

  [[ "$status" -eq 1 ]]
  [[ "$output" == *"not bumped"* ]]
}
