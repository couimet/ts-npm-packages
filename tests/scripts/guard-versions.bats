#!/usr/bin/env bats

setup() {
  MOCK_DIR="$(mktemp -d)"
  export PATH="${MOCK_DIR}:${PATH}"

  cat > "${MOCK_DIR}/git" << 'SCRIPT'
#!/usr/bin/env bash
echo ""
SCRIPT
  chmod +x "${MOCK_DIR}/git"

  cat > "${MOCK_DIR}/jq" << 'SCRIPT'
#!/usr/bin/env bash
echo "1.0.0"
SCRIPT
  chmod +x "${MOCK_DIR}/jq"
}

teardown() {
  rm -rf "${MOCK_DIR}"
  rm -f .changeset/wild-trees-sing.md .changeset/pre.json
  rmdir .changeset 2>/dev/null || true
}

@test "exits 0 when no changed files" {
  run bash scripts/guard-versions.sh abc123 def456
  [[ "$status" -eq 0 ]]
}

@test "exits 2 when target_ref is missing" {
  run bash scripts/guard-versions.sh "" def456
  [[ "$status" -eq 2 ]]
  [[ "$output" == *"Usage:"* ]]
}

@test "exits 2 when head_ref is missing" {
  run bash scripts/guard-versions.sh abc123 ""
  [[ "$status" -eq 2 ]]
  [[ "$output" == *"Usage:"* ]]
}

@test "fails on pre-release package.json version" {
  cat > "${MOCK_DIR}/git" << 'SCRIPT'
#!/usr/bin/env bash
echo "packages/foo/package.json"
SCRIPT
  chmod +x "${MOCK_DIR}/git"

  cat > "${MOCK_DIR}/jq" << 'SCRIPT'
#!/usr/bin/env bash
echo "1.0.0-alpha.0"
SCRIPT
  chmod +x "${MOCK_DIR}/jq"

  run bash scripts/guard-versions.sh abc123 def456
  [[ "$status" -eq 1 ]]
  [[ "$output" == *"Pre-release version '1.0.0-alpha.0' found in packages/foo/package.json"* ]]
}

@test "passes on stable package.json version" {
  cat > "${MOCK_DIR}/git" << 'SCRIPT'
#!/usr/bin/env bash
echo "packages/foo/package.json"
SCRIPT
  chmod +x "${MOCK_DIR}/git"

  run bash scripts/guard-versions.sh abc123 def456
  [[ "$status" -eq 0 ]]
}

@test "passes on package.json with empty version field" {
  cat > "${MOCK_DIR}/git" << 'SCRIPT'
#!/usr/bin/env bash
echo "packages/foo/package.json"
SCRIPT
  chmod +x "${MOCK_DIR}/git"

  cat > "${MOCK_DIR}/jq" << 'SCRIPT'
#!/usr/bin/env bash
echo ""
SCRIPT
  chmod +x "${MOCK_DIR}/jq"

  run bash scripts/guard-versions.sh abc123 def456
  [[ "$status" -eq 0 ]]
}

@test "only checks packages/.../package.json paths" {
  cat > "${MOCK_DIR}/git" << 'SCRIPT'
#!/usr/bin/env bash
echo "package.json"
SCRIPT
  chmod +x "${MOCK_DIR}/git"

  cat > "${MOCK_DIR}/jq" << 'SCRIPT'
#!/usr/bin/env bash
echo "1.0.0-alpha.0"
SCRIPT
  chmod +x "${MOCK_DIR}/jq"

  run bash scripts/guard-versions.sh abc123 def456
  [[ "$status" -eq 0 ]]
}

@test "fails on pre-release entry in changeset" {
  mkdir -p .changeset
  cat > .changeset/wild-trees-sing.md << 'EOF'
---
"@couimet/foo": patch
"@couimet/bar": "1.0.0-alpha.0"
---

Some description here.
EOF

  cat > "${MOCK_DIR}/git" << 'SCRIPT'
#!/usr/bin/env bash
echo ".changeset/wild-trees-sing.md"
SCRIPT
  chmod +x "${MOCK_DIR}/git"

  run bash scripts/guard-versions.sh abc123 def456
  [[ "$status" -eq 1 ]]
  [[ "$output" == *"Pre-release version entry in changeset"* ]]
}

@test "passes on clean changeset" {
  mkdir -p .changeset
  cat > .changeset/wild-trees-sing.md << 'EOF'
---
"@couimet/foo": patch
---

Some description here.
EOF

  cat > "${MOCK_DIR}/git" << 'SCRIPT'
#!/usr/bin/env bash
echo ".changeset/wild-trees-sing.md"
SCRIPT
  chmod +x "${MOCK_DIR}/git"

  run bash scripts/guard-versions.sh abc123 def456
  [[ "$status" -eq 0 ]]
}

@test "fails when pre.json is in diff" {
  cat > "${MOCK_DIR}/git" << 'SCRIPT'
#!/usr/bin/env bash
echo ".changeset/pre.json"
SCRIPT
  chmod +x "${MOCK_DIR}/git"

  run bash scripts/guard-versions.sh abc123 def456
  [[ "$status" -eq 1 ]]
  [[ "$output" == *"pre.json must not be merged to main"* ]]
}

@test "fails when pre.json exists on disk" {
  mkdir -p .changeset
  touch .changeset/pre.json

  run bash scripts/guard-versions.sh abc123 def456
  [[ "$status" -eq 1 ]]
  [[ "$output" == *"pre.json is present in the working tree"* ]]
}

@test "reports all violations at once" {
  mkdir -p .changeset
  cat > .changeset/wild-trees-sing.md << 'EOF'
---
"@couimet/foo": "2.0.0-beta.1"
---

Some description here.
EOF

  cat > "${MOCK_DIR}/git" << 'SCRIPT'
#!/usr/bin/env bash
cat << 'FILES'
packages/foo/package.json
.changeset/wild-trees-sing.md
FILES
SCRIPT
  chmod +x "${MOCK_DIR}/git"

  cat > "${MOCK_DIR}/jq" << 'SCRIPT'
#!/usr/bin/env bash
echo "1.0.0-alpha.0"
SCRIPT
  chmod +x "${MOCK_DIR}/jq"

  run bash scripts/guard-versions.sh abc123 def456
  [[ "$status" -eq 1 ]]
  [[ "$output" == *"Pre-release version '1.0.0-alpha.0'"* ]]
  [[ "$output" == *"Pre-release version entry in changeset"* ]]
  [[ "$output" == *"Pre-release versions are not allowed in main-branch PRs"* ]]
}

@test "includes summary message on failure" {
  cat > "${MOCK_DIR}/git" << 'SCRIPT'
#!/usr/bin/env bash
echo "packages/foo/package.json"
SCRIPT
  chmod +x "${MOCK_DIR}/git"

  cat > "${MOCK_DIR}/jq" << 'SCRIPT'
#!/usr/bin/env bash
echo "1.0.0-alpha.0"
SCRIPT
  chmod +x "${MOCK_DIR}/jq"

  run bash scripts/guard-versions.sh abc123 def456
  [[ "$status" -eq 1 ]]
  [[ "$output" == *"Pre-release versions are not allowed in main-branch PRs"* ]]
  [[ "$output" == *"pnpm changeset pre enter"* ]]
  [[ "$output" == *"pnpm changeset pre exit"* ]]
}
