#!/usr/bin/env bats

setup() {
  # Create a temp dir for mock executables
  MOCK_DIR="$(mktemp -d)"
  export PATH="${MOCK_DIR}:${PATH}"
}

teardown() {
  rm -rf "${MOCK_DIR}"
}

@test "exits 0 on feature branch" {
  cat > "${MOCK_DIR}/git" << 'EOF'
#!/usr/bin/env bash
echo "issues/4_something"
EOF
  chmod +x "${MOCK_DIR}/git"

  run bash scripts/guard-not-main.sh
  [[ "$status" -eq 0 ]]
}

@test "exits 1 on main branch" {
  cat > "${MOCK_DIR}/git" << 'EOF'
#!/usr/bin/env bash
echo "main"
EOF
  chmod +x "${MOCK_DIR}/git"

  run bash scripts/guard-not-main.sh
  [[ "$status" -eq 1 ]]
  [[ "$output" == *"cannot run on main"* ]]
}

@test "no output on success" {
  cat > "${MOCK_DIR}/git" << 'EOF'
#!/usr/bin/env bash
echo "feature/xyz"
EOF
  chmod +x "${MOCK_DIR}/git"

  run bash scripts/guard-not-main.sh
  [[ -z "$output" ]]
}
