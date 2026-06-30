#!/usr/bin/env bats

setup() {
  MOCK_DIR="$(mktemp -d)"
  export PATH="${MOCK_DIR}:${PATH}"
}

teardown() {
  rm -rf "${MOCK_DIR}"
}

@test "lists public packages as name@version" {
  cat > "${MOCK_DIR}/pnpm" << 'SCRIPT'
#!/usr/bin/env bash
cat << 'EOF'
[
  {"name": "root", "private": true},
  {"name": "@couimet/foo", "version": "1.2.3", "private": false},
  {"name": "@couimet/bar", "version": "0.5.0-alpha.1", "private": false}
]
EOF
SCRIPT
  chmod +x "${MOCK_DIR}/pnpm"

  # The script also pipes to node, which we keep real. Our mock pnpm outputs valid JSON above.
  run bash scripts/version-list.sh
  [[ "$status" -eq 0 ]]
  [[ "$output" == *"@couimet/foo@1.2.3"* ]]
  [[ "$output" == *"@couimet/bar@0.5.0-alpha.1"* ]]
}

@test "excludes private packages" {
  cat > "${MOCK_DIR}/pnpm" << 'SCRIPT'
#!/usr/bin/env bash
cat << 'EOF'
[
  {"name": "root", "private": true},
  {"name": "@couimet/public", "version": "2.0.0", "private": false}
]
EOF
SCRIPT
  chmod +x "${MOCK_DIR}/pnpm"

  run bash scripts/version-list.sh
  [[ "$status" -eq 0 ]]
  [[ "$output" != *"root"* ]]
  [[ "$output" == *"@couimet/public@2.0.0"* ]]
}

@test "empty output when all packages are private" {
  cat > "${MOCK_DIR}/pnpm" << 'SCRIPT'
#!/usr/bin/env bash
cat << 'EOF'
[
  {"name": "root", "private": true}
]
EOF
SCRIPT
  chmod +x "${MOCK_DIR}/pnpm"

  run bash scripts/version-list.sh
  [[ "$status" -eq 0 ]]
  [[ -z "$output" ]]
}
