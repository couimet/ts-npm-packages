#!/bin/bash
set -euo pipefail

read -r -p "Package name (without @couimet/ prefix): " pkg_name
if [[ -z "$pkg_name" ]]; then
  echo "Error: package name is required" >&2
  exit 1
fi

read -r -p "Short description: " short_desc

target_dir="packages/${pkg_name}"
mkdir -p "${target_dir}/src/__tests__"

# --- package.json ---
cat > "${target_dir}/package.json" << JSONEOF
{
  "name": "@couimet/${pkg_name}",
  "version": "1.0.0",
  "description": "${short_desc}",
  "homepage": "https://github.com/couimet/ts-npm-packages/tree/main/packages/${pkg_name}#readme",
  "bugs": {
    "url": "https://github.com/couimet/ts-npm-packages/issues"
  },
  "repository": {
    "type": "git",
    "url": "git@github.com:couimet/ts-npm-packages.git",
    "directory": "packages/${pkg_name}"
  },
  "license": "MIT",
  "author": "Charles Ouimet <charles.ouimet@gmail.com>",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  },
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsup",
    "clean": "rm -rf dist coverage *.tsbuildinfo",
    "clean:all": "pnpm clean && rm -rf node_modules .eslintcache *.log",
    "clean:deps": "rm -rf node_modules",
    "format": "prettier --check .",
    "lint": "eslint .",
    "test": "jest --coverage",
    "typecheck": "tsc --noEmit"
  },
  "prettier": "@couimet/eslint-config/prettier",
  "devDependencies": {
    "@couimet/eslint-config": "workspace:*",
    "@types/jest": "^29.5.14",
    "@types/node": "^22.19.20",
    "eslint": "^10.4.1",
    "jest": "^29.7.0",
    "prettier": "^3.8.4",
    "ts-jest": "^29.4.11",
    "tsup": "^8.5.1",
    "typescript": "^6.0.3"
  },
  "publishConfig": {
    "access": "public"
  }
}
JSONEOF

# --- tsconfig.json ---
cat > "${target_dir}/tsconfig.json" << 'TSCEOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "module": "CommonJS"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "src/**/*.test.ts", "src/__tests__/**"]
}
TSCEOF

# --- tsconfig.test.json ---
cat > "${target_dir}/tsconfig.test.json" << 'TSTESTEOF'
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "composite": false,
    "noEmit": true
  },
  "include": ["src/**/*.test.ts", "src/__tests__/**"]
}
TSTESTEOF

# --- eslint.config.mjs ---
cat > "${target_dir}/eslint.config.mjs" << 'ESLINTEOF'
import couimetConfig from '@couimet/eslint-config/eslint';

export default couimetConfig;
ESLINTEOF

# --- jest.config.js ---
cat > "${target_dir}/jest.config.js" << 'JESTEOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  errorOnDeprecated: true,
  testTimeout: 5000,
  maxWorkers: '50%',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts', '!src/__tests__/**', '!src/index.ts'],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 100,
      lines: 95,
      statements: 95,
    },
  },
  coverageDirectory: 'coverage',
  verbose: true,
};
JESTEOF

# --- CHANGELOG.md ---
cat > "${target_dir}/CHANGELOG.md" << CHGEOF
# Changelog

All notable changes to the \`@couimet/${pkg_name}\` package are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0]

### Added

- Initial release
CHGEOF

# --- README.md ---
cat > "${target_dir}/README.md" << READMEEOF
# @couimet/${pkg_name}

${short_desc}
READMEEOF

# --- src/index.ts ---
cat > "${target_dir}/src/index.ts" << 'INDEXEOF'
export {};
INDEXEOF

# --- src/__tests__/index.test.ts ---
cat > "${target_dir}/src/__tests__/index.test.ts" << TESTEOF
describe('${pkg_name}', () => {
  it.todo('replace with real tests');
});
TESTEOF

echo ""
echo "Scaffolded packages/${pkg_name}"
echo "Next: pnpm install && pnpm --filter @couimet/${pkg_name} build && pnpm --filter @couimet/${pkg_name} test"
