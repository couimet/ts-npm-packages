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

@test "handles final line without trailing newline" {
  write_package_json
  # File whose last line has no trailing \n — exercises the while-read fix
  # that prevents silent data loss from read returning non-zero on EOF
  printf '%s\n' '# Changelog' '' 'All notable changes to the `@couimet/test-pkg` package are recorded here.' '' \
    'The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).' '' \
    '## 0.1.0' '' '### Added' '' '- Initial release' \
    > "${PKG_DIR}/CHANGELOG.md"
  # Strip the final newline added by printf '%s\n' on the last argument
  perl -pi -e 'chomp if eof' "${PKG_DIR}/CHANGELOG.md"

  run bash scripts/fix-changelogs.sh "${MOCK_DIR}"

  [[ "$status" -eq 0 ]]
  # The bare version header on the last line must be bracketed (not dropped)
  grep -q '^## \[0.1.0\]$' "${PKG_DIR}/CHANGELOG.md"
  # Step 2 while-read loop should not drop the final line
  ! grep -q '^## 0.1.0$' "${PKG_DIR}/CHANGELOG.md"
}

@test "produces correct output when no versions exist" {
  write_package_json
  cat > "${PKG_DIR}/CHANGELOG.md" << 'MD'
# Changelog

All notable changes to the `@couimet/test-pkg` package are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
MD

  run bash scripts/fix-changelogs.sh "${MOCK_DIR}"

  [[ "$status" -eq 0 ]]
  # Markers should still be injected even with no versions
  grep -q '^<!-- changelog-entries -->' "${PKG_DIR}/CHANGELOG.md"
  grep -q '^<!-- changelog-links -->' "${PKG_DIR}/CHANGELOG.md"
  # No blank line emitted after links marker when version_count == 0
  grep -qF '<!-- changelog-links -->' "${PKG_DIR}/CHANGELOG.md"
  # The links marker should be the last line (no trailing link lines)
  last_line="$(tail -1 "${PKG_DIR}/CHANGELOG.md")"
  [[ "$last_line" == "<!-- changelog-links -->" ]]
}

@test "processes multiple packages in one run" {
  mkdir -p "${MOCK_DIR}/packages/pkg-a"
  mkdir -p "${MOCK_DIR}/packages/pkg-b"

  echo '{"name":"@couimet/pkg-a"}' > "${MOCK_DIR}/packages/pkg-a/package.json"
  echo '{"name":"@couimet/pkg-b"}' > "${MOCK_DIR}/packages/pkg-b/package.json"

  cat > "${MOCK_DIR}/packages/pkg-a/CHANGELOG.md" << 'MD'
# Changelog

All notable changes to the `@couimet/pkg-a` package are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0]

### Added

- Initial release
MD

  cat > "${MOCK_DIR}/packages/pkg-b/CHANGELOG.md" << 'MD'
# Changelog

All notable changes to the `@couimet/pkg-b` package are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0]

### Added

- New feature
MD

  run bash scripts/fix-changelogs.sh "${MOCK_DIR}"

  [[ "$status" -eq 0 ]]
  # Both packages get markers injected
  grep -q '^<!-- changelog-entries -->' "${MOCK_DIR}/packages/pkg-a/CHANGELOG.md"
  grep -q '^<!-- changelog-entries -->' "${MOCK_DIR}/packages/pkg-b/CHANGELOG.md"
  # Both get links generated
  grep -qF '[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/%40couimet%2Fpkg-a%400.1.0' "${MOCK_DIR}/packages/pkg-a/CHANGELOG.md"
  grep -qF '[0.2.0]: https://github.com/couimet/ts-npm-packages/releases/tag/%40couimet%2Fpkg-b%400.2.0' "${MOCK_DIR}/packages/pkg-b/CHANGELOG.md"
}

@test "rebuilds links in correct order when input is reversed" {
  write_package_json
  cat > "${PKG_DIR}/CHANGELOG.md" << 'MD'
# Changelog

All notable changes to the `@couimet/test-pkg` package are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- changelog-entries -->

## [0.3.0]

### Added

- Latest

## [0.2.0]

### Added

- Middle

## [0.1.0]

### Added

- First

<!-- changelog-links -->

[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/%40couimet%2Ftest-pkg%400.1.0
[0.3.0]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Ftest-pkg%400.2.0...%40couimet%2Ftest-pkg%400.3.0
[0.2.0]: https://github.com/couimet/ts-npm-packages/compare/%40couimet%2Ftest-pkg%400.1.0...%40couimet%2Ftest-pkg%400.2.0
MD

  run bash scripts/fix-changelogs.sh "${MOCK_DIR}"

  [[ "$status" -eq 0 ]]

  # Extract the link lines in order after the links marker
  link_lines="$(sed -n '/^<!-- changelog-links -->/,$p' "${PKG_DIR}/CHANGELOG.md" | grep '^\[.*\]: https://')"

  # Should be newest-first: 0.3.0, 0.2.0, 0.1.0
  first="$(echo "$link_lines" | head -1)"
  second="$(echo "$link_lines" | head -2 | tail -1)"
  third="$(echo "$link_lines" | tail -1)"

  [[ "$first" =~ ^\[0\.3\.0\] ]]
  [[ "$second" =~ ^\[0\.2\.0\] ]]
  [[ "$third" =~ ^\[0\.1\.0\] ]]
}

@test "exits cleanly when no packages directory exists" {
  run bash scripts/fix-changelogs.sh "${MOCK_DIR}"

  [[ "$status" -eq 0 ]]
}

@test "handles changelog without keepachangelog boilerplate" {
  write_package_json
  cat > "${PKG_DIR}/CHANGELOG.md" << 'MD'
# Changelog

## [0.2.0]

### Added

- Feature

## [0.1.0]

### Added

- Initial release

[0.1.0]: https://github.com/couimet/ts-npm-packages/releases/tag/%40couimet%2Ftest-pkg%400.1.0
MD

  run bash scripts/fix-changelogs.sh "${MOCK_DIR}"

  [[ "$status" -eq 0 ]]
  # Markers are injected
  grep -q '^<!-- changelog-entries -->' "${PKG_DIR}/CHANGELOG.md"
  grep -q '^<!-- changelog-links -->' "${PKG_DIR}/CHANGELOG.md"
  # Version blocks are still present (treated as misplaced, moved below entries marker)
  grep -q '^## \[0.2.0\]$' "${PKG_DIR}/CHANGELOG.md"
  grep -q '^## \[0.1.0\]$' "${PKG_DIR}/CHANGELOG.md"
}
