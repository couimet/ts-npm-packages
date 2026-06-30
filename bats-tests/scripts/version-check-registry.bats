#!/usr/bin/env bats

setup() {
  MOCK_DIR="$(mktemp -d)"
  export PATH="${MOCK_DIR}:${PATH}"

  cat > "${MOCK_DIR}/pnpm" << 'SCRIPT'
#!/usr/bin/env bash
printf '@couimet/foo@1.2.3\n@couimet/bar@0.5.0-alpha.1\n'
SCRIPT
  chmod +x "${MOCK_DIR}/pnpm"

  cat > "${MOCK_DIR}/npm" << 'SCRIPT'
#!/usr/bin/env bash
case "$2" in
  @couimet/foo) echo "1.2.3" ;;
  @couimet/bar)  echo "0.5.0-alpha.1" ;;
  *) echo "UNKNOWN" ;;
esac
SCRIPT
  chmod +x "${MOCK_DIR}/npm"
}

teardown() {
  rm -rf "${MOCK_DIR}"
}

@test "reports OK when versions match" {
  run bash scripts/version-check-registry.sh
  [[ "$status" -eq 0 ]]
  [[ "$output" == *"OK  @couimet/foo@1.2.3"* ]]
  [[ "$output" == *"OK  @couimet/bar@0.5.0-alpha.1"* ]]
}

@test "reports MISMATCH when versions differ" {
  cat > "${MOCK_DIR}/npm" << 'SCRIPT'
#!/usr/bin/env bash
echo "9.9.9"
SCRIPT
  chmod +x "${MOCK_DIR}/npm"

  run bash scripts/version-check-registry.sh
  [[ "$status" -eq 0 ]]
  [[ "$output" == *"MISMATCH  @couimet/foo: local=1.2.3 npm=9.9.9"* ]]
  [[ "$output" == *"MISMATCH  @couimet/bar: local=0.5.0-alpha.1 npm=9.9.9"* ]]
}

@test "reports NOT FOUND when package missing from registry" {
  cat > "${MOCK_DIR}/npm" << 'SCRIPT'
#!/usr/bin/env bash
echo "npm error code E404" >&2
exit 1
SCRIPT
  chmod +x "${MOCK_DIR}/npm"

  run bash scripts/version-check-registry.sh
  [[ "$status" -eq 0 ]]
  [[ "$output" == *"NOT FOUND"* ]]
}
