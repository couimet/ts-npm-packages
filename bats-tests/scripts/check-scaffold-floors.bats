#!/usr/bin/env bats

setup() {
  MOCK_DIR="$(mktemp -d)"
  mkdir -p "${MOCK_DIR}/scripts" "${MOCK_DIR}/packages"
}

teardown() {
  rm -rf "${MOCK_DIR}"
}

write_scaffold() {
  {
    printf '  "devDependencies": {\n'
    printf '%s\n' "$1"
    printf '  },\n'
  } > "${MOCK_DIR}/scripts/create-package.sh"
}

write_package() {
  mkdir -p "${MOCK_DIR}/packages/$1"
  printf '%s\n' "$2" > "${MOCK_DIR}/packages/$1/package.json"
}

@test "exits 0 when every scaffold floor matches the workspace" {
  write_scaffold '    "eslint": "^10.10.0",'
  write_package alpha '{ "devDependencies": { "eslint": "^10.10.0" } }'
  write_package beta '{ "devDependencies": { "eslint": "^10.10.0" } }'

  run bash scripts/check-scaffold-floors.sh "${MOCK_DIR}"
  [[ "$status" -eq 0 ]]
  [[ -z "$output" ]]
}

@test "exits 1 when a scaffold floor lags the workspace" {
  write_scaffold '    "eslint": "^10.4.1",'
  write_package alpha '{ "devDependencies": { "eslint": "^10.10.0" } }'
  write_package beta '{ "devDependencies": { "eslint": "^10.10.0" } }'

  run bash scripts/check-scaffold-floors.sh "${MOCK_DIR}"
  [[ "$status" -eq 1 ]]
  [[ "$output" == *"pins 'eslint' at ^10.4.1"* ]]
  [[ "$output" == *"the workspace uses ^10.10.0"* ]]
  [[ "$output" == *"Found 1 scaffold floor violation(s)"* ]]
}

@test "ignores the older floor that a minority of packages still carry" {
  write_scaffold '    "eslint": "^10.10.0",'
  write_package alpha '{ "devDependencies": { "eslint": "^10.10.0" } }'
  write_package beta '{ "devDependencies": { "eslint": "^10.10.0" } }'
  write_package grandfathered '{ "devDependencies": { "eslint": ">=10.8.1" } }'

  run bash scripts/check-scaffold-floors.sh "${MOCK_DIR}"
  [[ "$status" -eq 0 ]]
  [[ -z "$output" ]]
}

@test "exits 1 when the workspace ties on a floor" {
  write_scaffold '    "eslint": "^10.10.0",'
  write_package alpha '{ "devDependencies": { "eslint": "^10.10.0" } }'
  write_package beta '{ "devDependencies": { "eslint": "^10.8.1" } }'

  run bash scripts/check-scaffold-floors.sh "${MOCK_DIR}"
  [[ "$status" -eq 1 ]]
  [[ "$output" == *"has no single floor to mirror"* ]]
  [[ "$output" == *"^10.10.0"* ]]
  [[ "$output" == *"^10.8.1"* ]]
}

@test "exits 1 when the scaffold pins a dependency no package declares" {
  write_scaffold '    "eslint": "^10.10.0",'
  write_package alpha '{ "devDependencies": { "typescript": "^6.0.3" } }'

  run bash scripts/check-scaffold-floors.sh "${MOCK_DIR}"
  [[ "$status" -eq 1 ]]
  [[ "$output" == *"pins 'eslint', which no package declares"* ]]
}

@test "reads the floors from the devDependencies block alone" {
  write_scaffold '    "eslint": "^10.10.0",'
  write_package alpha '{ "devDependencies": { "eslint": "^10.10.0" } }'
  printf '%s\n' '  "engines": {' '    "node": ">=24"' '  },' >> "${MOCK_DIR}/scripts/create-package.sh"

  run bash scripts/check-scaffold-floors.sh "${MOCK_DIR}"
  [[ "$status" -eq 0 ]]
  [[ -z "$output" ]]
}

@test "exits 1 when the scaffold carries no devDependencies block" {
  printf '%s\n' '#!/bin/bash' 'echo nothing' > "${MOCK_DIR}/scripts/create-package.sh"
  write_package alpha '{ "devDependencies": { "eslint": "^10.10.0" } }'

  run bash scripts/check-scaffold-floors.sh "${MOCK_DIR}"
  [[ "$status" -eq 1 ]]
  [[ "$output" == *"carries no devDependencies block"* ]]
}

@test "exits 1 when the scaffold script is missing" {
  write_package alpha '{ "devDependencies": { "eslint": "^10.10.0" } }'

  run bash scripts/check-scaffold-floors.sh "${MOCK_DIR}"
  [[ "$status" -eq 1 ]]
  [[ "$output" == *"does not exist"* ]]
}
