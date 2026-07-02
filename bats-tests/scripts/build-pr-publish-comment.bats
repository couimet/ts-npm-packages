#!/usr/bin/env bats

setup() {
  MOCK_DIR="$(mktemp -d)"
  export PATH="${MOCK_DIR}:${PATH}"

  PUBLISH_OUTPUT="$(mktemp)"
}

teardown() {
  rm -rf "${MOCK_DIR}" "${PUBLISH_OUTPUT}"
}

write_publish_output() {
  cat > "${PUBLISH_OUTPUT}" << 'EOF'
New tag: @couimet/foo@1.0.0
New tag: @couimet/bar@2.1.0
EOF
}

# gh mock that pipes JSON through jq when --jq is present
write_gh_mock() {
  local json="$1"
  cat > "${MOCK_DIR}/gh" << SCRIPT
#!/usr/bin/env bash
# Find --jq value and apply it to the hardcoded JSON
json='${json}'
jq_expr=""
for arg in "\$@"; do
  case "\$arg" in
    --jq) shift_after_jq=true ;;
    *) if [[ "\$shift_after_jq" == "true" ]]; then jq_expr="\$arg"; shift_after_jq=false; fi ;;
  esac
done
if [[ -n "\$jq_expr" ]]; then
  echo "\$json" | jq -r "\$jq_expr"
else
  echo "\$json"
fi
SCRIPT
  chmod +x "${MOCK_DIR}/gh"
}

# --- main mode ---

@test "main: publishes packages and finds merged PR" {
  write_publish_output
  write_gh_mock '[{"number":42}]'

  run bash scripts/build-pr-publish-comment.sh --publish-output "${PUBLISH_OUTPUT}" --mode main --repo owner/repo --sha abc123
  [[ "$status" -eq 0 ]]
  [[ "$output" == *"comment_file="* ]]
  [[ "$output" == *"pr_number=42"* ]]
  [[ "$output" != *"skip=true"* ]]
}

@test "main: no PR found (direct push)" {
  write_publish_output
  write_gh_mock '[]'

  run bash scripts/build-pr-publish-comment.sh --publish-output "${PUBLISH_OUTPUT}" --mode main --repo owner/repo --sha abc123
  [[ "$status" -eq 0 ]]
  [[ "$output" == *"skip=true"* ]]
}

@test "main: requires --repo and --sha" {
  write_publish_output
  run bash scripts/build-pr-publish-comment.sh --publish-output "${PUBLISH_OUTPUT}" --mode main
  [[ "$status" -eq 1 ]]
}

# --- prerelease mode ---

@test "prerelease: publishes packages and finds open PR" {
  write_publish_output
  write_gh_mock '[{"number":99}]'

  run bash scripts/build-pr-publish-comment.sh --publish-output "${PUBLISH_OUTPUT}" --mode prerelease --branch feat/foo
  [[ "$status" -eq 0 ]]
  [[ "$output" == *"comment_file="* ]]
  [[ "$output" == *"pr_number=99"* ]]
  [[ "$output" != *"skip=true"* ]]
}

@test "prerelease: no open PR found" {
  write_publish_output
  write_gh_mock '[]'

  run bash scripts/build-pr-publish-comment.sh --publish-output "${PUBLISH_OUTPUT}" --mode prerelease --branch feat/bar
  [[ "$status" -eq 0 ]]
  [[ "$output" == *"skip=true"* ]]
}

@test "prerelease: requires --branch" {
  write_publish_output
  run bash scripts/build-pr-publish-comment.sh --publish-output "${PUBLISH_OUTPUT}" --mode prerelease
  [[ "$status" -eq 1 ]]
}

# --- error handling ---

@test "fails when publish output file missing" {
  run bash scripts/build-pr-publish-comment.sh --publish-output /nonexistent --mode main --repo owner/repo --sha abc123
  [[ "$status" -eq 1 ]]
}

@test "fails on invalid mode" {
  write_publish_output
  run bash scripts/build-pr-publish-comment.sh --publish-output "${PUBLISH_OUTPUT}" --mode bogus --repo owner/repo --sha abc123
  [[ "$status" -eq 1 ]]
}

@test "main: empty publish output skips with warning to stderr" {
  run --separate-stderr bash scripts/build-pr-publish-comment.sh --publish-output "${PUBLISH_OUTPUT}" --mode main --repo owner/repo --sha abc123
  [[ "$status" -eq 0 ]]
  [[ "$output" == *"skip=true"* ]]
  [[ "$stderr" == *"::warning::No packages were published"* ]]
}

@test "prerelease: empty publish output skips with warning to stderr" {
  run --separate-stderr bash scripts/build-pr-publish-comment.sh --publish-output "${PUBLISH_OUTPUT}" --mode prerelease --branch feat/foo
  [[ "$status" -eq 0 ]]
  [[ "$output" == *"skip=true"* ]]
  [[ "$stderr" == *"::warning::No packages were published"* ]]
}

@test "main: no PR found warns to stderr" {
  write_publish_output
  write_gh_mock '[]'

  run --separate-stderr bash scripts/build-pr-publish-comment.sh --publish-output "${PUBLISH_OUTPUT}" --mode main --repo owner/repo --sha abc123
  [[ "$status" -eq 0 ]]
  [[ "$output" == *"skip=true"* ]]
  [[ "$stderr" == *"::warning::No PR found"* ]]
}

@test "prerelease: no PR found warns to stderr" {
  write_publish_output
  write_gh_mock '[]'

  run --separate-stderr bash scripts/build-pr-publish-comment.sh --publish-output "${PUBLISH_OUTPUT}" --mode prerelease --branch feat/bar
  [[ "$status" -eq 0 ]]
  [[ "$output" == *"skip=true"* ]]
  [[ "$stderr" == *"::warning::No PR found"* ]]
}
