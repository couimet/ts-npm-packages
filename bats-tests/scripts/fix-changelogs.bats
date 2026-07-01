#!/usr/bin/env bats

setup() {
  MOCK_DIR="$(mktemp -d)"
  PKG_DIR="${MOCK_DIR}/packages/test-pkg"
  mkdir -p "${PKG_DIR}"
}

teardown() {
  rm -rf "${MOCK_DIR}"
}

write_package_json() {
  cat > "${PKG_DIR}/package.json" << 'JSON'
{"name": "@couimet/test-pkg"}
JSON
}

write_changelog() {
  cat > "${PKG_DIR}/CHANGELOG.md" << 'MD'
# Changelog

All notable changes to the `@couimet/test-pkg` package are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0]

### Added

- Initial release

[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/%40couimet%2Ftest-pkg%400.1.0
MD
}

# ── tests ──

@test "replaces semver headings with keep-a-changelog categories" {
  write_package_json
  cat > "${PKG_DIR}/CHANGELOG.md" << 'MD'
# Changelog

All notable changes to the `@couimet/test-pkg` package are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0]

### Major Changes

- Breaking change

## [0.1.0]

### Minor Changes

- New feature

### Patch Changes

- Bug fix

[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/%40couimet%2Ftest-pkg%400.1.0
MD

  run bash scripts/fix-changelogs.sh "${MOCK_DIR}"

  [[ "$status" -eq 0 ]]
  ! grep -q '^### Major Changes$' "${PKG_DIR}/CHANGELOG.md"
  ! grep -q '^### Minor Changes$' "${PKG_DIR}/CHANGELOG.md"
  ! grep -q '^### Patch Changes$' "${PKG_DIR}/CHANGELOG.md"
  grep -q '^### Changed$' "${PKG_DIR}/CHANGELOG.md"
  grep -q '^### Added$' "${PKG_DIR}/CHANGELOG.md"
  grep -q '^### Fixed$' "${PKG_DIR}/CHANGELOG.md"
}

@test "adds brackets to bare version headers" {
  write_package_json
  cat > "${PKG_DIR}/CHANGELOG.md" << 'MD'
# Changelog

All notable changes to the `@couimet/test-pkg` package are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.2.0

### Added

- New feature

## [0.1.0]

### Added

- Initial release

[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/%40couimet%2Ftest-pkg%400.1.0
MD

  run bash scripts/fix-changelogs.sh "${MOCK_DIR}"

  [[ "$status" -eq 0 ]]
  grep -q '^## \[0.2.0\]$' "${PKG_DIR}/CHANGELOG.md"
  # Already-bracketed header is not double-bracketed
  grep -q '^## \[0.1.0\]$' "${PKG_DIR}/CHANGELOG.md"
  ! grep -q '^## \[\[0.1.0\]\]$' "${PKG_DIR}/CHANGELOG.md"
}

@test "injects entries marker when missing" {
  write_package_json
  write_changelog

  run bash scripts/fix-changelogs.sh "${MOCK_DIR}"

  [[ "$status" -eq 0 ]]
  grep -q '^<!-- changelog-entries -->' "${PKG_DIR}/CHANGELOG.md"
}

@test "moves version blocks from above marker to below it" {
  write_package_json
  cat > "${PKG_DIR}/CHANGELOG.md" << 'MD'
# Changelog

## [0.3.0]

### Added

- Latest feature

All notable changes to the `@couimet/test-pkg` package are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- changelog-entries -->

## [0.2.0]

### Added

- Older feature

## [0.1.0]

### Added

- Initial release

[0.2.0]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Ftest-pkg%400.1.0...%40couimet%2Ftest-pkg%400.2.0
[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/%40couimet%2Ftest-pkg%400.1.0
MD

  run bash scripts/fix-changelogs.sh "${MOCK_DIR}"

  [[ "$status" -eq 0 ]]

  # The 0.3.0 block should now appear after the entries marker
  marker_line="$(grep -n '^<!-- changelog-entries -->' "${PKG_DIR}/CHANGELOG.md" | cut -d: -f1)"
  version_0_3_line="$(grep -n '^## \[0.3.0\]$' "${PKG_DIR}/CHANGELOG.md" | cut -d: -f1)"
  version_0_2_line="$(grep -n '^## \[0.2.0\]$' "${PKG_DIR}/CHANGELOG.md" | cut -d: -f1)"

  [[ "$version_0_3_line" -gt "$marker_line" ]]
  [[ "$version_0_2_line" -gt "$marker_line" ]]
  # 0.3.0 (newer) should come before 0.2.0 (older)
  [[ "$version_0_3_line" -lt "$version_0_2_line" ]]
}

@test "generates release tag link for oldest (single) version" {
  write_package_json
  cat > "${PKG_DIR}/CHANGELOG.md" << 'MD'
# Changelog

All notable changes to the `@couimet/test-pkg` package are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0]

### Added

- Initial release
MD

  run bash scripts/fix-changelogs.sh "${MOCK_DIR}"

  [[ "$status" -eq 0 ]]
  grep -qF '[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/%40couimet%2Ftest-pkg%400.1.0' "${PKG_DIR}/CHANGELOG.md"
}

@test "generates compare link for newer version" {
  write_package_json
  cat > "${PKG_DIR}/CHANGELOG.md" << 'MD'
# Changelog

All notable changes to the `@couimet/test-pkg` package are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0]

### Added

- New feature

## [0.1.0]

### Added

- Initial release

[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/%40couimet%2Ftest-pkg%400.1.0
MD

  run bash scripts/fix-changelogs.sh "${MOCK_DIR}"

  [[ "$status" -eq 0 ]]
  grep -qF '[0.2.0]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Ftest-pkg%400.1.0...%40couimet%2Ftest-pkg%400.2.0' "${PKG_DIR}/CHANGELOG.md"
}

@test "is idempotent" {
  write_package_json
  cat > "${PKG_DIR}/CHANGELOG.md" << 'MD'
# Changelog

## 0.3.0

### Minor Changes

- New feature

All notable changes to the `@couimet/test-pkg` package are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0]

### Minor Changes

- Old feature

## [0.1.0]

### Added

- Initial release

[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/%40couimet%2Ftest-pkg%400.1.0
MD

  run bash scripts/fix-changelogs.sh "${MOCK_DIR}"
  [[ "$status" -eq 0 ]]

  cp "${PKG_DIR}/CHANGELOG.md" "${PKG_DIR}/CHANGELOG.first-pass.md"

  run bash scripts/fix-changelogs.sh "${MOCK_DIR}"
  [[ "$status" -eq 0 ]]

  diff "${PKG_DIR}/CHANGELOG.md" "${PKG_DIR}/CHANGELOG.first-pass.md"
}

@test "no-op on already-correct changelog" {
  write_package_json
  cat > "${PKG_DIR}/CHANGELOG.md" << 'MD'
# Changelog

All notable changes to the `@couimet/test-pkg` package are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- changelog-entries -->

## [0.2.0]

### Added

- New feature

## [0.1.0]

### Added

- Initial release

<!-- changelog-links -->

[0.2.0]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Ftest-pkg%400.1.0...%40couimet%2Ftest-pkg%400.2.0
[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/%40couimet%2Ftest-pkg%400.1.0
MD

  cp "${PKG_DIR}/CHANGELOG.md" "${MOCK_DIR}/original.md"

  run bash scripts/fix-changelogs.sh "${MOCK_DIR}"

  [[ "$status" -eq 0 ]]
  diff "${PKG_DIR}/CHANGELOG.md" "${MOCK_DIR}/original.md"
}

@test "handles pre-release versions" {
  write_package_json
  cat > "${PKG_DIR}/CHANGELOG.md" << 'MD'
# Changelog

All notable changes to the `@couimet/test-pkg` package are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.2.0-alpha.1

### Added

- Pre-release feature

## [0.1.0]

### Added

- Initial release
MD

  run bash scripts/fix-changelogs.sh "${MOCK_DIR}"

  [[ "$status" -eq 0 ]]
  grep -q '^## \[0.2.0-alpha.1\]$' "${PKG_DIR}/CHANGELOG.md"
  grep -qF '[0.2.0-alpha.1]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Ftest-pkg%400.1.0...%40couimet%2Ftest-pkg%400.2.0-alpha.1' "${PKG_DIR}/CHANGELOG.md"
}

@test "skips packages with missing package.json" {
  rm -f "${PKG_DIR}/package.json"
  cat > "${PKG_DIR}/CHANGELOG.md" << 'MD'
# Changelog

## [0.1.0]

### Added

- Initial release
MD

  run bash scripts/fix-changelogs.sh "${MOCK_DIR}"

  [[ "$status" -eq 0 ]]
}

@test "injects entries marker after keepachangelog.com line" {
  write_package_json
  write_changelog

  run bash scripts/fix-changelogs.sh "${MOCK_DIR}"

  [[ "$status" -eq 0 ]]

  # The marker should appear after the keepachangelog.com reference line
  marker_line="$(grep -n '^<!-- changelog-entries -->' "${PKG_DIR}/CHANGELOG.md" | cut -d: -f1)"
  kacl_line="$(grep -n 'keepachangelog.com' "${PKG_DIR}/CHANGELOG.md" | cut -d: -f1)"

  [[ "$marker_line" -gt "$kacl_line" ]]
}
