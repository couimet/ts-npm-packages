#!/usr/bin/env bats

setup() {
  MOCK_DIR="$(mktemp -d)"
  PKG_DIR="${MOCK_DIR}/packages/test-pkg"
  mkdir -p "${PKG_DIR}"
}

teardown() {
  rm -rf "${MOCK_DIR}"
}

write_clean_changelog() {
  cat > "${PKG_DIR}/CHANGELOG.md" << 'MD'
# Changelog

All notable changes are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

<!-- changelog-entries -->

## [0.2.0]

### Added

- New feature

## [0.1.0]

### Added

- Initial release

<!-- changelog-links -->

[0.2.0]: https://github.com/couimet/ts-npm-packages/compare/test-pkg%400.1.0...test-pkg%400.2.0
[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/test-pkg%400.1.0
MD
}

# ── tests ──

@test "passes clean changelog and exits 0" {
  write_clean_changelog

  run bash scripts/check-changelogs.sh "${MOCK_DIR}"

  [[ "$status" -eq 0 ]]
  [[ -z "$output" ]]
}

@test "detects semver headings and exits non-zero" {
  write_clean_changelog
  cat > "${PKG_DIR}/CHANGELOG.md" << 'MD'
# Changelog

All notable changes are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

<!-- changelog-entries -->

## [0.1.0]

### Minor Changes

- New feature

<!-- changelog-links -->

[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/test-pkg%400.1.0
MD

  run bash scripts/check-changelogs.sh "${MOCK_DIR}"

  [[ "$status" -ne 0 ]]
  [[ "$output" == *"semver bump headings"* ]]
}

@test "detects bare version headers and exits non-zero" {
  write_clean_changelog
  cat > "${PKG_DIR}/CHANGELOG.md" << 'MD'
# Changelog

All notable changes are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

<!-- changelog-entries -->

## 0.1.0

### Added

- Initial release

<!-- changelog-links -->

[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/test-pkg%400.1.0
MD

  run bash scripts/check-changelogs.sh "${MOCK_DIR}"

  [[ "$status" -ne 0 ]]
  [[ "$output" == *"bare version headers"* ]]
}

@test "allows bracketed version headers" {
  write_clean_changelog
  # The version header is ## [0.1.0] — this should pass (no bare headers)

  run bash scripts/check-changelogs.sh "${MOCK_DIR}"

  [[ "$status" -eq 0 ]]
}

@test "detects version blocks above entries marker" {
  write_clean_changelog
  cat > "${PKG_DIR}/CHANGELOG.md" << 'MD'
# Changelog

## [0.3.0]

### Added

- Misplaced feature

All notable changes are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

<!-- changelog-entries -->

## [0.2.0]

### Added

- Properly placed feature

[0.2.0]: https://github.com/couimet/ts-npm-packages/compare/test-pkg%400.1.0...test-pkg%400.2.0
[0.3.0]: https://github.com/couimet/ts-npm-packages/compare/test-pkg%400.2.0...test-pkg%400.3.0
MD

  run bash scripts/check-changelogs.sh "${MOCK_DIR}"

  [[ "$status" -ne 0 ]]
  [[ "$output" == *"version blocks above"* ]]
}

@test "detects missing compare links" {
  write_clean_changelog
  cat > "${PKG_DIR}/CHANGELOG.md" << 'MD'
# Changelog

All notable changes are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

<!-- changelog-entries -->

## [0.2.0]

### Added

- New feature

## [0.1.0]

### Added

- Initial release

<!-- changelog-links -->

[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/test-pkg%400.1.0
MD

  run bash scripts/check-changelogs.sh "${MOCK_DIR}"

  [[ "$status" -ne 0 ]]
  [[ "$output" == *"missing compare link for version 0.2.0"* ]]
}

@test "reports multiple violations" {
  write_clean_changelog
  cat > "${PKG_DIR}/CHANGELOG.md" << 'MD'
# Changelog

All notable changes are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

<!-- changelog-entries -->

## [0.2.0]

### Minor Changes

- New feature

## 0.1.0

### Added

- Initial release

[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/test-pkg%400.1.0
MD

  run bash scripts/check-changelogs.sh "${MOCK_DIR}"

  [[ "$status" -ne 0 ]]
  # Should find at least: semver heading, bare version header, missing link for 0.2.0
  [[ "$output" == *"Found "*" CHANGELOG violation"* ]]
}

@test "checks all packages in the tree" {
  mkdir -p "${MOCK_DIR}/packages/pkg-a"
  mkdir -p "${MOCK_DIR}/packages/pkg-b"

  cat > "${MOCK_DIR}/packages/pkg-a/CHANGELOG.md" << 'MD'
# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

<!-- changelog-entries -->

## [0.1.0]

### Added

- Feature A

<!-- changelog-links -->

[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/pkg-a%400.1.0
MD

  cat > "${MOCK_DIR}/packages/pkg-b/CHANGELOG.md" << 'MD'
# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

<!-- changelog-entries -->

## [0.1.0]

### Minor Changes

- Feature B

<!-- changelog-links -->

[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/pkg-b%400.1.0
MD

  run bash scripts/check-changelogs.sh "${MOCK_DIR}"

  [[ "$status" -ne 0 ]]
  [[ "$output" == *"semver bump headings"* ]]
  [[ "$output" == *"pkg-b"* ]]
}

@test "exits 0 when no packages directory exists" {
  rm -rf "${MOCK_DIR}/packages"

  run bash scripts/check-changelogs.sh "${MOCK_DIR}"

  [[ "$status" -eq 0 ]]
}

@test "detects missing empty line after entries marker" {
  write_clean_changelog
  # Remove the blank line after <!-- changelog-entries -->
  cat > "${PKG_DIR}/CHANGELOG.md" << 'MD'
# Changelog

All notable changes are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

<!-- changelog-entries -->
## [0.1.0]

### Added

- Initial release

<!-- changelog-links -->

[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/test-pkg%400.1.0
MD

  run bash scripts/check-changelogs.sh "${MOCK_DIR}"

  [[ "$status" -ne 0 ]]
  [[ "$output" == *"missing an empty line between <!-- changelog-entries --> marker"* ]]
}

@test "allows empty line after entries marker when no entries exist" {
  cat > "${PKG_DIR}/CHANGELOG.md" << 'MD'
# Changelog

All notable changes are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

<!-- changelog-entries -->

<!-- changelog-links -->
MD

  run bash scripts/check-changelogs.sh "${MOCK_DIR}"

  [[ "$status" -eq 0 ]]
}
