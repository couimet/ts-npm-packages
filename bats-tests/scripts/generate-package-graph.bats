#!/usr/bin/env bats

setup() {
  REPO_DIR="$(mktemp -d)"
  mkdir -p "${REPO_DIR}/packages"
  cat > "${REPO_DIR}/README.md" << 'EOF'
# Test

<!-- BEGIN dependency-graph -->
<!-- END dependency-graph -->

## After
EOF
}

teardown() {
  rm -rf "${REPO_DIR}"
}

# Helper: write a package manifest. The third argument is a JSON fragment
# appended after the name, e.g. '"dependencies":{"@couimet/beta":"^1.0.0"}'.
add_package() {
  local dir="${1:?}"
  local name="${2:?}"
  local extra="${3:-}"

  mkdir -p "${REPO_DIR}/packages/${dir}"
  if [ -n "$extra" ]; then
    printf '{"name":"%s",%s}\n' "$name" "$extra" > "${REPO_DIR}/packages/${dir}/package.json"
  else
    printf '{"name":"%s"}\n' "$name" > "${REPO_DIR}/packages/${dir}/package.json"
  fi
}

@test "draws dependencies as solid edges and peer dependencies as dotted edges" {
  add_package alpha "@couimet/alpha" '"dependencies":{"@couimet/beta":"^1.0.0"}'
  add_package beta "@couimet/beta"
  add_package gamma "@couimet/gamma" '"peerDependencies":{"@couimet/beta":">=1.0.0"}'

  run bash scripts/generate-package-graph.sh "${REPO_DIR}"
  [[ "$status" -eq 0 ]]
  grep -q '^    alpha --> beta$' "${REPO_DIR}/README.md"
  grep -q '^    gamma -.-> beta$' "${REPO_DIR}/README.md"
}

@test "omits devDependencies from the graph" {
  add_package alpha "@couimet/alpha" '"devDependencies":{"@couimet/beta":"workspace:*"}'
  add_package beta "@couimet/beta"

  run bash scripts/generate-package-graph.sh "${REPO_DIR}"
  [[ "$status" -eq 0 ]]
  run grep -cE -- '^    .*(-\.->|-->)' "${REPO_DIR}/README.md"
  [[ "$output" = "0" ]]
}

@test "ignores dependencies on packages outside the workspace" {
  add_package alpha "@couimet/alpha" '"dependencies":{"express":"^5.0.0"}'

  run bash scripts/generate-package-graph.sh "${REPO_DIR}"
  [[ "$status" -eq 0 ]]
  run grep -cE -- '^    .*(-\.->|-->)' "${REPO_DIR}/README.md"
  [[ "$output" = "0" ]]
  grep -q '`alpha` is not shown' "${REPO_DIR}/README.md"
}

@test "draws a target listed in both sections once, as a dependencies edge" {
  add_package alpha "@couimet/alpha" '"dependencies":{"@couimet/beta":"^1.0.0"},"peerDependencies":{"@couimet/beta":">=1.0.0"}'
  add_package beta "@couimet/beta"

  run bash scripts/generate-package-graph.sh "${REPO_DIR}"
  [[ "$status" -eq 0 ]]
  grep -q '^    alpha --> beta$' "${REPO_DIR}/README.md"
  run grep -c 'alpha ' "${REPO_DIR}/README.md"
  [[ "$output" = "1" ]]
}

@test "sorts edges deterministically" {
  add_package zeta "@couimet/zeta" '"dependencies":{"@couimet/beta":"^1.0.0"}'
  add_package alpha "@couimet/alpha" '"dependencies":{"@couimet/zeta":"^1.0.0"}'
  add_package beta "@couimet/beta"

  run bash scripts/generate-package-graph.sh "${REPO_DIR}"
  [[ "$status" -eq 0 ]]
  run sed -n '/```mermaid/,/```/p' "${REPO_DIR}/README.md"
  [[ "${lines[0]}" = '```mermaid' ]]
  [[ "${lines[1]}" = "graph LR" ]]
  [[ "${lines[2]}" = "    alpha --> zeta" ]]
  [[ "${lines[3]}" = "    zeta --> beta" ]]
}

@test "names a package with no internal edge in the legend" {
  add_package alpha "@couimet/alpha" '"dependencies":{"@couimet/beta":"^1.0.0"}'
  add_package beta "@couimet/beta"
  add_package lonely "@couimet/lonely"

  run bash scripts/generate-package-graph.sh "${REPO_DIR}"
  [[ "$status" -eq 0 ]]
  grep -q '`lonely` is not shown' "${REPO_DIR}/README.md"
  run grep -c '^    lonely' "${REPO_DIR}/README.md"
  [[ "$output" = "0" ]]
}

@test "names several packages with no internal edge in the legend" {
  add_package alpha "@couimet/alpha" '"dependencies":{"@couimet/beta":"^1.0.0"}'
  add_package beta "@couimet/beta"
  add_package lonely1 "@couimet/lonely1"
  add_package lonely2 "@couimet/lonely2"

  run bash scripts/generate-package-graph.sh "${REPO_DIR}"
  [[ "$status" -eq 0 ]]
  grep -q '`lonely1` and `lonely2` are not shown' "${REPO_DIR}/README.md"
}

@test "states the legend when every package has an internal edge" {
  add_package alpha "@couimet/alpha" '"dependencies":{"@couimet/beta":"^1.0.0"}'
  add_package beta "@couimet/beta"

  run bash scripts/generate-package-graph.sh "${REPO_DIR}"
  [[ "$status" -eq 0 ]]
  grep -q 'Every package declares at least one internal' "${REPO_DIR}/README.md"
}

@test "rewrites only the marked span" {
  add_package alpha "@couimet/alpha" '"dependencies":{"@couimet/beta":"^1.0.0"}'
  add_package beta "@couimet/beta"

  run bash scripts/generate-package-graph.sh "${REPO_DIR}"
  [[ "$status" -eq 0 ]]
  grep -q '^# Test$' "${REPO_DIR}/README.md"
  grep -q '^## After$' "${REPO_DIR}/README.md"
}

@test "exits 0 when the graph is up to date" {
  add_package alpha "@couimet/alpha" '"dependencies":{"@couimet/beta":"^1.0.0"}'
  add_package beta "@couimet/beta"
  run bash scripts/generate-package-graph.sh "${REPO_DIR}"

  run bash scripts/generate-package-graph.sh "${REPO_DIR}" --check
  [[ "$status" -eq 0 ]]
  [[ -z "$output" ]]
}

@test "exits 1 when the graph is out of date" {
  add_package alpha "@couimet/alpha" '"dependencies":{"@couimet/beta":"^1.0.0"}'
  add_package beta "@couimet/beta"

  run bash scripts/generate-package-graph.sh "${REPO_DIR}" --check
  [[ "$status" -eq 1 ]]
  [[ "$output" == *"out of date"* ]]
}

@test "check mode leaves the README untouched" {
  add_package alpha "@couimet/alpha" '"dependencies":{"@couimet/beta":"^1.0.0"}'
  add_package beta "@couimet/beta"

  run bash scripts/generate-package-graph.sh "${REPO_DIR}" --check
  [[ "$status" -eq 1 ]]
  run grep -c 'mermaid' "${REPO_DIR}/README.md"
  [[ "$output" = "0" ]]
}

@test "exits non-zero when the markers are missing" {
  echo "# No markers here" > "${REPO_DIR}/README.md"
  add_package alpha "@couimet/alpha" '"dependencies":{"@couimet/beta":"^1.0.0"}'
  add_package beta "@couimet/beta"

  run bash scripts/generate-package-graph.sh "${REPO_DIR}"
  [[ "$status" -ne 0 ]]
  [[ "$output" == *"must contain both"* ]]
}

@test "exits non-zero when the markers are in the wrong order" {
  cat > "${REPO_DIR}/README.md" << 'EOF'
# Test

<!-- END dependency-graph -->
<!-- BEGIN dependency-graph -->
EOF
  add_package alpha "@couimet/alpha" '"dependencies":{"@couimet/beta":"^1.0.0"}'
  add_package beta "@couimet/beta"

  run bash scripts/generate-package-graph.sh "${REPO_DIR}"
  [[ "$status" -ne 0 ]]
  [[ "$output" == *"before"* ]]
}

@test "exits 1 when README.md is missing" {
  rm "${REPO_DIR}/README.md"

  run bash scripts/generate-package-graph.sh "${REPO_DIR}"
  [[ "$status" -eq 1 ]]
  [[ "$output" == *"not found"* ]]
}

@test "rejects an unknown option" {
  run bash scripts/generate-package-graph.sh --bogus
  [[ "$status" -eq 2 ]]
  [[ "$output" == *"unknown option"* ]]
}

@test "rejects a second positional argument" {
  run bash scripts/generate-package-graph.sh "${REPO_DIR}" /tmp
  [[ "$status" -eq 2 ]]
  [[ "$output" == *"unexpected argument"* ]]
}
