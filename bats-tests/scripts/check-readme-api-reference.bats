#!/usr/bin/env bats

setup() {
  MOCK_DIR="$(mktemp -d)"
  PKG_DIR="${MOCK_DIR}/packages/test-pkg"
  mkdir -p "${PKG_DIR}/src"
  cat > "${PKG_DIR}/package.json" << 'JSON'
{ "name": "@couimet/test-pkg", "version": "0.1.0" }
JSON
}

teardown() {
  rm -rf "${MOCK_DIR}"
}

write_barrel() {
  cat > "${PKG_DIR}/src/index.ts" << 'TS'
export * from './widget';
TS
}

write_widget_module() {
  cat > "${PKG_DIR}/src/widget.ts" << 'TS'
export interface Widget {
  readonly id: string;
}

export const buildWidget = (id: string): Widget => ({ id });
TS
}

write_readme() {
  cat > "${PKG_DIR}/README.md" << MD
# test-pkg

$1
MD
}

@test "exits 0 when the API reference documents every exported symbol" {
  write_barrel
  write_widget_module
  write_readme '## API reference

### Widget

### buildWidget'

  run bash scripts/check-readme-api-reference.sh "${MOCK_DIR}"
  [[ "$status" -eq 0 ]]
  [[ -z "$output" ]]
}

@test "exits 1 when an exported symbol is missing from the API reference" {
  write_barrel
  write_widget_module
  write_readme '## API reference

### Widget'

  run bash scripts/check-readme-api-reference.sh "${MOCK_DIR}"
  [[ "$status" -eq 1 ]]
  [[ "$output" == *"exports 'buildWidget'"* ]]
  [[ "$output" == *"the '## API reference' section"* ]]
}

@test "ignores an exported symbol named only outside the API reference" {
  write_barrel
  write_widget_module
  write_readme '## Usage

Call buildWidget to build a widget.

## API reference

### Widget'

  run bash scripts/check-readme-api-reference.sh "${MOCK_DIR}"
  [[ "$status" -eq 1 ]]
  [[ "$output" == *"exports 'buildWidget'"* ]]
}

@test "searches the whole README when it carries no API reference section" {
  write_barrel
  write_widget_module
  write_readme '## API

buildWidget builds a Widget.'

  run bash scripts/check-readme-api-reference.sh "${MOCK_DIR}"
  [[ "$status" -eq 0 ]]
}

@test "exits 1 when a barrelled module file does not exist" {
  write_barrel
  write_readme '## API reference'

  run bash scripts/check-readme-api-reference.sh "${MOCK_DIR}"
  [[ "$status" -eq 1 ]]
  [[ "$output" == *"src/widget.ts does not exist"* ]]
}

@test "ignores a module the barrel imports instead of re-exporting" {
  cat > "${PKG_DIR}/src/index.ts" << 'TS'
import type { Widget } from './widget';

export * from './gadget';
TS
  cat > "${PKG_DIR}/src/widget.ts" << 'TS'
export interface Widget {
  readonly id: string;
}
TS
  cat > "${PKG_DIR}/src/gadget.ts" << 'TS'
export const buildGadget = (): string => 'gadget';
TS
  write_readme '## API reference

### buildGadget'

  run bash scripts/check-readme-api-reference.sh "${MOCK_DIR}"
  [[ "$status" -eq 0 ]]
}

@test "exits 1 when the package README is missing" {
  write_barrel
  write_widget_module

  run bash scripts/check-readme-api-reference.sh "${MOCK_DIR}"
  [[ "$status" -eq 1 ]]
  [[ "$output" == *"README.md is missing"* ]]
}

@test "skips a private package" {
  cat > "${PKG_DIR}/package.json" << 'JSON'
{ "name": "@couimet/test-pkg", "version": "0.1.0", "private": true }
JSON
  write_barrel
  write_widget_module

  run bash scripts/check-readme-api-reference.sh "${MOCK_DIR}"
  [[ "$status" -eq 0 ]]
  [[ -z "$output" ]]
}
