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
  if [ -n "${FIXTURE_DIR:-}" ]; then
    rm -rf "${FIXTURE_DIR}"
  fi
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

# ── private type surface check ──

setup_private_leak_fixture() {
  FIXTURE_DIR="$(mktemp -d)"
  mkdir -p "${FIXTURE_DIR}/packages/leaf/dist" "${FIXTURE_DIR}/packages/public/dist"
  printf '{"name":"@couimet/leaf","private":true}\n' > "${FIXTURE_DIR}/packages/leaf/package.json"
  printf '{"name":"@couimet/public"}\n' > "${FIXTURE_DIR}/packages/public/package.json"
}

@test "passes when no built type names a private workspace package" {
  setup_private_leak_fixture
  printf "export declare const helper: () => string;\n" > "${FIXTURE_DIR}/packages/public/dist/index.d.ts"
  cd "${FIXTURE_DIR}"

  run bash "${BATS_TEST_DIRNAME}/../../scripts/publish-verify.sh"
  [[ "$status" -eq 0 ]]
}

@test "fails when a built type names a private workspace package" {
  setup_private_leak_fixture
  printf "import { FetchTarget } from '@couimet/leaf';\nexport declare const helper: (t: FetchTarget) => string;\n" > "${FIXTURE_DIR}/packages/public/dist/index.d.ts"
  cd "${FIXTURE_DIR}"

  run bash "${BATS_TEST_DIRNAME}/../../scripts/publish-verify.sh"
  [[ "$status" -eq 1 ]]
  [[ "$output" == *"names the private package @couimet/leaf"* ]]
  [[ "$output" == *"re-exports a type from a private workspace package"* ]]
}

@test "ignores the private package's own declarations" {
  setup_private_leak_fixture
  printf "export declare const internal: () => string;\n" > "${FIXTURE_DIR}/packages/leaf/dist/index.d.ts"
  printf "export declare const helper: () => string;\n" > "${FIXTURE_DIR}/packages/public/dist/index.d.ts"
  cd "${FIXTURE_DIR}"

  run bash "${BATS_TEST_DIRNAME}/../../scripts/publish-verify.sh"
  [[ "$status" -eq 0 ]]
}
