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

@test "passes when prerelease version bumps within the same numeric core" {
  TMP_FIXTURE_DIR="$(mktemp -d)"
  mkdir -p "${TMP_FIXTURE_DIR}/packages/test-pkg"
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/package.json" << 'JSON'
{"name": "@couimet/test-pkg", "version": "1.0.0-beta.2"}
JSON
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/CHANGELOG.md" << 'MD'
## [1.0.0-beta.2]

### Added

- Prerelease bump
MD
  cd "${TMP_FIXTURE_DIR}"

  write_git_mock_with_show "@couimet/test-pkg@1.0.0-beta.1" $'packages/test-pkg/src/index.ts' $'{"name":"@couimet/test-pkg","version":"1.0.0-beta.1"}'
  write_pnpm_mock 1

  run bash "${BATS_TEST_DIRNAME}/../../scripts/ci-changeset-check.sh" "origin/main"

  [[ "$status" -eq 0 ]]
}

@test "fails when prerelease version downgrades within the same numeric core" {
  TMP_FIXTURE_DIR="$(mktemp -d)"
  mkdir -p "${TMP_FIXTURE_DIR}/packages/test-pkg"
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/package.json" << 'JSON'
{"name": "@couimet/test-pkg", "version": "1.0.0-beta.1"}
JSON
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/CHANGELOG.md" << 'MD'
## [1.0.0-beta.1]

### Added

- Prerelease
MD
  cd "${TMP_FIXTURE_DIR}"

  write_git_mock_with_show "@couimet/test-pkg@1.0.0-beta.2" $'packages/test-pkg/src/index.ts' $'{"name":"@couimet/test-pkg","version":"1.0.0-beta.2"}'
  write_pnpm_mock 1

  run bash "${BATS_TEST_DIRNAME}/../../scripts/ci-changeset-check.sh" "origin/main"

  [[ "$status" -eq 1 ]]
  [[ "$output" == *"not bumped"* ]]
}

@test "fails when changelog mentions current version only in prose" {
  TMP_FIXTURE_DIR="$(mktemp -d)"
  mkdir -p "${TMP_FIXTURE_DIR}/packages/test-pkg"
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/package.json" << 'JSON'
{"name": "@couimet/test-pkg", "version": "0.2.0"}
JSON
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/CHANGELOG.md" << 'MD'
## [0.1.0]

### Added

- Initial release

See the ## [0.2.0] notes for what changed.
MD
  cd "${TMP_FIXTURE_DIR}"

  write_git_mock_with_show "@couimet/test-pkg@0.1.0" $'packages/test-pkg/src/index.ts' $'{"name":"@couimet/test-pkg","version":"0.1.0"}'
  write_pnpm_mock 1

  run bash "${BATS_TEST_DIRNAME}/../../scripts/ci-changeset-check.sh" "origin/main"

  [[ "$status" -eq 1 ]]
  [[ "$output" == *"no matching entry"* ]]
}

@test "passes when prerelease identifier contains a hyphen" {
  TMP_FIXTURE_DIR="$(mktemp -d)"
  mkdir -p "${TMP_FIXTURE_DIR}/packages/test-pkg"
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/package.json" << 'JSON'
{"name": "@couimet/test-pkg", "version": "1.0.1-rc-1"}
JSON
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/CHANGELOG.md" << 'MD'
## [1.0.1-rc-1]

### Added

- Release candidate bump
MD
  cd "${TMP_FIXTURE_DIR}"

  write_git_mock_with_show "@couimet/test-pkg@1.0.1-rc-0" $'packages/test-pkg/src/index.ts' $'{"name":"@couimet/test-pkg","version":"1.0.1-rc-0"}'
  write_pnpm_mock 1

  run bash "${BATS_TEST_DIRNAME}/../../scripts/ci-changeset-check.sh" "origin/main"

  [[ "$status" -eq 0 ]]
}

@test "fails when prerelease has an empty trailing identifier" {
  TMP_FIXTURE_DIR="$(mktemp -d)"
  mkdir -p "${TMP_FIXTURE_DIR}/packages/test-pkg"
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/package.json" << 'JSON'
{"name": "@couimet/test-pkg", "version": "1.0.1-alpha."}
JSON
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/CHANGELOG.md" << 'MD'
## [1.0.1-alpha.]

### Added

- Invalid prerelease
MD
  cd "${TMP_FIXTURE_DIR}"

  write_git_mock_with_show "@couimet/test-pkg@1.0.0" $'packages/test-pkg/src/index.ts' $'{"name":"@couimet/test-pkg","version":"1.0.0"}'
  write_pnpm_mock 1

  run bash "${BATS_TEST_DIRNAME}/../../scripts/ci-changeset-check.sh" "origin/main"

  [[ "$status" -eq 1 ]]
  [[ "$output" == *"not bumped"* ]]
}

@test "fails when prerelease has an empty middle identifier" {
  TMP_FIXTURE_DIR="$(mktemp -d)"
  mkdir -p "${TMP_FIXTURE_DIR}/packages/test-pkg"
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/package.json" << 'JSON'
{"name": "@couimet/test-pkg", "version": "1.0.1-alpha..1"}
JSON
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/CHANGELOG.md" << 'MD'
## [1.0.1-alpha..1]

### Added

- Invalid prerelease
MD
  cd "${TMP_FIXTURE_DIR}"

  write_git_mock_with_show "@couimet/test-pkg@1.0.0" $'packages/test-pkg/src/index.ts' $'{"name":"@couimet/test-pkg","version":"1.0.0"}'
  write_pnpm_mock 1

  run bash "${BATS_TEST_DIRNAME}/../../scripts/ci-changeset-check.sh" "origin/main"

  [[ "$status" -eq 1 ]]
  [[ "$output" == *"not bumped"* ]]
}

@test "fails when build metadata has an empty identifier" {
  TMP_FIXTURE_DIR="$(mktemp -d)"
  mkdir -p "${TMP_FIXTURE_DIR}/packages/test-pkg"
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/package.json" << 'JSON'
{"name": "@couimet/test-pkg", "version": "1.0.1+build."}
JSON
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/CHANGELOG.md" << 'MD'
## [1.0.1+build.]

### Added

- Invalid build metadata
MD
  cd "${TMP_FIXTURE_DIR}"

  write_git_mock_with_show "@couimet/test-pkg@1.0.0" $'packages/test-pkg/src/index.ts' $'{"name":"@couimet/test-pkg","version":"1.0.0"}'
  write_pnpm_mock 1

  run bash "${BATS_TEST_DIRNAME}/../../scripts/ci-changeset-check.sh" "origin/main"

  [[ "$status" -eq 1 ]]
  [[ "$output" == *"not bumped"* ]]
}

@test "fails when numeric prerelease identifier has a leading zero" {
  TMP_FIXTURE_DIR="$(mktemp -d)"
  mkdir -p "${TMP_FIXTURE_DIR}/packages/test-pkg"
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/package.json" << 'JSON'
{"name": "@couimet/test-pkg", "version": "1.0.1-01"}
JSON
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/CHANGELOG.md" << 'MD'
## [1.0.1-01]

### Added

- Invalid prerelease
MD
  cd "${TMP_FIXTURE_DIR}"

  write_git_mock_with_show "@couimet/test-pkg@1.0.0" $'packages/test-pkg/src/index.ts' $'{"name":"@couimet/test-pkg","version":"1.0.0"}'
  write_pnpm_mock 1

  run bash "${BATS_TEST_DIRNAME}/../../scripts/ci-changeset-check.sh" "origin/main"

  [[ "$status" -eq 1 ]]
  [[ "$output" == *"not bumped"* ]]
}

@test "passes when base version carries build metadata" {
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

  write_git_mock_with_show "@couimet/test-pkg@0.1.0" $'packages/test-pkg/src/index.ts' $'{"name":"@couimet/test-pkg","version":"0.1.0+build.7"}'
  write_pnpm_mock 1

  run bash "${BATS_TEST_DIRNAME}/../../scripts/ci-changeset-check.sh" "origin/main"

  [[ "$status" -eq 0 ]]
}

@test "passes when current version carries build metadata" {
  TMP_FIXTURE_DIR="$(mktemp -d)"
  mkdir -p "${TMP_FIXTURE_DIR}/packages/test-pkg"
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/package.json" << 'JSON'
{"name": "@couimet/test-pkg", "version": "1.0.1+build.7"}
JSON
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/CHANGELOG.md" << 'MD'
## [1.0.1]

### Added

- New feature
MD
  cd "${TMP_FIXTURE_DIR}"

  write_git_mock_with_show "@couimet/test-pkg@1.0.0" $'packages/test-pkg/src/index.ts' $'{"name":"@couimet/test-pkg","version":"1.0.0"}'
  write_pnpm_mock 1

  run bash "${BATS_TEST_DIRNAME}/../../scripts/ci-changeset-check.sh" "origin/main"

  [[ "$status" -eq 0 ]]
}

@test "passes when both versions carry build metadata" {
  TMP_FIXTURE_DIR="$(mktemp -d)"
  mkdir -p "${TMP_FIXTURE_DIR}/packages/test-pkg"
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/package.json" << 'JSON'
{"name": "@couimet/test-pkg", "version": "1.0.1+build.7"}
JSON
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/CHANGELOG.md" << 'MD'
## [1.0.1]

### Added

- New feature
MD
  cd "${TMP_FIXTURE_DIR}"

  write_git_mock_with_show "@couimet/test-pkg@1.0.0" $'packages/test-pkg/src/index.ts' $'{"name":"@couimet/test-pkg","version":"1.0.0+build.8"}'
  write_pnpm_mock 1

  run bash "${BATS_TEST_DIRNAME}/../../scripts/ci-changeset-check.sh" "origin/main"

  [[ "$status" -eq 0 ]]
}

@test "fails when versions differ only in build metadata" {
  TMP_FIXTURE_DIR="$(mktemp -d)"
  mkdir -p "${TMP_FIXTURE_DIR}/packages/test-pkg"
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/package.json" << 'JSON'
{"name": "@couimet/test-pkg", "version": "1.0.0+build.7"}
JSON
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/CHANGELOG.md" << 'MD'
## [1.0.0]

### Added

- New feature
MD
  cd "${TMP_FIXTURE_DIR}"

  write_git_mock_with_show "@couimet/test-pkg@1.0.0" $'packages/test-pkg/src/index.ts' $'{"name":"@couimet/test-pkg","version":"1.0.0+build.8"}'
  write_pnpm_mock 1

  run bash "${BATS_TEST_DIRNAME}/../../scripts/ci-changeset-check.sh" "origin/main"

  [[ "$status" -eq 1 ]]
  [[ "$output" == *"not bumped"* ]]
}

# ── docs-only change handling ──

@test "passes when changed package has only docs changes" {
  TMP_FIXTURE_DIR="$(mktemp -d)"
  mkdir -p "${TMP_FIXTURE_DIR}/packages/test-pkg"
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/package.json" << 'JSON'
{"name": "@couimet/test-pkg", "version": "0.1.0"}
JSON
  cd "${TMP_FIXTURE_DIR}"

  write_git_mock_with_show "@couimet/test-pkg@0.1.0" $'packages/test-pkg/README.md' $'{"name":"@couimet/test-pkg","version":"0.1.0"}'
  write_pnpm_mock 1

  run bash "${BATS_TEST_DIRNAME}/../../scripts/ci-changeset-check.sh" "origin/main"

  [[ "$status" -eq 0 ]]
}

@test "passes when changed package has only changelog changes" {
  TMP_FIXTURE_DIR="$(mktemp -d)"
  mkdir -p "${TMP_FIXTURE_DIR}/packages/test-pkg"
  cat > "${TMP_FIXTURE_DIR}/packages/test-pkg/package.json" << 'JSON'
{"name": "@couimet/test-pkg", "version": "0.1.0"}
JSON
  cd "${TMP_FIXTURE_DIR}"

  write_git_mock_with_show "@couimet/test-pkg@0.1.0" $'packages/test-pkg/CHANGELOG.md' $'{"name":"@couimet/test-pkg","version":"0.1.0"}'
  write_pnpm_mock 1

  run bash "${BATS_TEST_DIRNAME}/../../scripts/ci-changeset-check.sh" "origin/main"

  [[ "$status" -eq 0 ]]
}

@test "fails when docs change accompanies an unbumped source change" {
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

  write_git_mock_with_show "@couimet/test-pkg@0.1.0" $'packages/test-pkg/README.md\npackages/test-pkg/src/index.ts' $'{"name":"@couimet/test-pkg","version":"0.1.0"}'
  write_pnpm_mock 1

  run bash "${BATS_TEST_DIRNAME}/../../scripts/ci-changeset-check.sh" "origin/main"

  [[ "$status" -eq 1 ]]
  [[ "$output" == *"not bumped"* ]]
}
