#!/usr/bin/env bats

setup() {
  MOCK_DIR="$(mktemp -d)"
  export PATH="${MOCK_DIR}:${PATH}"

  cat > "${MOCK_DIR}/pnpm" << 'SCRIPT'
#!/usr/bin/env bash
subcmd() { while [[ $# -gt 0 ]]; do case "$1" in -C) shift 2;; -*) shift;; *) echo "$1"; return;; esac; done; }
case "$(subcmd "$@")" in
  init)  echo '{"name":"test","version":"1.0.0","private":true}' > package.json ;;
  version:list) cat << 'EOF'
@couimet/foo@1.0.0-alpha.0
@couimet/bar@2.0.0-beta.1
EOF
  ;;
  add) exit 0 ;;
  *) echo "unexpected pnpm args: $*" >&2; exit 1 ;;
esac
SCRIPT
  chmod +x "${MOCK_DIR}/pnpm"

  cat > "${MOCK_DIR}/node" << 'SCRIPT'
#!/usr/bin/env bash
echo "All pre-release packages resolve successfully"
SCRIPT
  chmod +x "${MOCK_DIR}/node"
}

teardown() {
  rm -rf "${MOCK_DIR}"
}

@test "exits with error when no pre-release packages" {
  cat > "${MOCK_DIR}/pnpm" << 'SCRIPT'
#!/usr/bin/env bash
subcmd() { while [[ $# -gt 0 ]]; do case "$1" in -C) shift 2;; -*) shift;; *) echo "$1"; return;; esac; done; }
case "$(subcmd "$@")" in
  init)  echo '{"name":"test","version":"1.0.0","private":true}' > package.json ;;
  version:list) echo "@couimet/foo@1.0.0" ;;
  add) exit 0 ;;
esac
SCRIPT
  chmod +x "${MOCK_DIR}/pnpm"

  run bash scripts/publish-verify.sh
  [[ "$status" -eq 1 ]]
  [[ "$output" == *"No pre-release packages found"* ]]
}

@test "installs pre-release packages and runs smoke test" {
  run bash scripts/publish-verify.sh
  [[ "$status" -eq 0 ]]
  [[ "$output" == *"All pre-release packages resolve successfully"* ]]
}

@test "fails when pnpm add cannot find a package" {
  cat > "${MOCK_DIR}/pnpm" << 'SCRIPT'
#!/usr/bin/env bash
subcmd() { while [[ $# -gt 0 ]]; do case "$1" in -C) shift 2;; -*) shift;; *) echo "$1"; return;; esac; done; }
case "$(subcmd "$@")" in
  init)  echo '{"name":"test","version":"1.0.0","private":true}' > package.json ;;
  version:list) cat << 'EOF'
@couimet/foo@1.0.0-alpha.0
EOF
  ;;
  add) echo "ERR_PNPM_NO_MATCHING_VERSION No matching version found" >&2; exit 1 ;;
esac
SCRIPT
  chmod +x "${MOCK_DIR}/pnpm"

  run bash scripts/publish-verify.sh
  [[ "$status" -ne 0 ]]
}

@test "fails when smoke test imports fail" {
  cat > "${MOCK_DIR}/node" << 'SCRIPT'
#!/usr/bin/env bash
echo "Cannot find module '@couimet/foo'" >&2
exit 1
SCRIPT
  chmod +x "${MOCK_DIR}/node"

  run bash scripts/publish-verify.sh
  [[ "$status" -ne 0 ]]
}
