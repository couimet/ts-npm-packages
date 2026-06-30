#!/usr/bin/env bats

setup() {
  MOCK_DIR="$(mktemp -d)"
  export PATH="${MOCK_DIR}:${PATH}"
  rm -f /tmp/changeset-packages.txt /tmp/gh-payload.json
}

teardown() {
  rm -rf "${MOCK_DIR}"
  rm -f /tmp/changeset-packages.txt /tmp/gh-payload.json
}

# ── helpers ──

write_gh_mock() {
  # $1: existing comment ID (empty = no existing comment)
  local existing_id="${1:-}"
  cat > "${MOCK_DIR}/gh" << SCRIPT
#!/usr/bin/env bash
# Determine if this is a "find" call (has --jq)
jq_expr=""
prev=""
for arg in "\$@"; do
  if [[ "\$prev" == "--jq" ]]; then
    jq_expr="\$arg"
  fi
  if [[ "\$prev" == "--input" ]]; then
    cp "\$arg" /tmp/gh-payload.json
  fi
  prev="\$arg"
done

if [[ -n "\${jq_expr}" ]]; then
  # find_comment_id call
  if [[ -n "${existing_id}" ]]; then
    echo '[{"id": '"${existing_id}"', "body": "feedback <!-- changeset-gate --> details"}]' | jq -r "\${jq_expr}"
  else
    echo '[]' | jq -r "\${jq_expr}"
  fi
fi
# Non-find calls (create / update / delete) succeed silently
SCRIPT
  chmod +x "${MOCK_DIR}/gh"
}

# ── validation tests ──

@test "exits 2 with no arguments" {
  run bash scripts/ci-changeset-comment.sh
  [[ "$status" -eq 2 ]]
  [[ "$output" == *"Usage"* ]]
}

@test "exits 2 with missing pr-number" {
  run bash scripts/ci-changeset-comment.sh upsert
  [[ "$status" -eq 2 ]]
  [[ "$output" == *"Usage"* ]]
}

@test "exits 2 with unknown action" {
  run bash scripts/ci-changeset-comment.sh frobnicate 42
  [[ "$status" -eq 2 ]]
  [[ "$output" == *"Usage"* ]]
}

# ── upsert tests ──

@test "upsert creates comment when none exists" {
  write_gh_mock "" # no existing comment

  run bash scripts/ci-changeset-comment.sh upsert 42
  [[ "$status" -eq 0 ]]
}

@test "upsert updates comment when one exists" {
  write_gh_mock "99" # existing comment with id 99

  run bash scripts/ci-changeset-comment.sh upsert 42
  [[ "$status" -eq 0 ]]
}

# ── delete tests ──

@test "delete succeeds (no-op) when no comment exists" {
  write_gh_mock "" # no existing comment

  run bash scripts/ci-changeset-comment.sh delete 42
  [[ "$status" -eq 0 ]]
}

@test "delete removes comment when one exists" {
  write_gh_mock "42" # existing comment

  run bash scripts/ci-changeset-comment.sh delete 42
  [[ "$status" -eq 0 ]]
}

# ── comment body tests ──

@test "comment body includes changed packages when file exists" {
  write_gh_mock "" # no existing comment
  echo "eslint-config, logger" > /tmp/changeset-packages.txt

  run bash scripts/ci-changeset-comment.sh upsert 42
  [[ "$status" -eq 0 ]]
  grep -q 'Changed packages.*eslint-config, logger' /tmp/gh-payload.json
}

@test "comment body omits package list when file is empty" {
  write_gh_mock "" # no existing comment
  echo -n "" > /tmp/changeset-packages.txt

  run bash scripts/ci-changeset-comment.sh upsert 42
  [[ "$status" -eq 0 ]]
  ! grep -q 'Changed packages' /tmp/gh-payload.json
}

@test "comment body omits package list when file does not exist" {
  write_gh_mock "" # no existing comment

  run bash scripts/ci-changeset-comment.sh upsert 42
  [[ "$status" -eq 0 ]]
  ! grep -q 'Changed packages' /tmp/gh-payload.json
}
