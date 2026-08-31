# @couimet/markdownlint-config

[![npm version](https://img.shields.io/npm/v/@couimet/markdownlint-config.svg?style=flat-square)](https://www.npmjs.com/package/@couimet/markdownlint-config) [![npm downloads](https://img.shields.io/npm/dm/@couimet/markdownlint-config.svg?style=flat-square)](https://www.npmjs.com/package/@couimet/markdownlint-config)

Shared markdownlint configuration for `@couimet/*` packages. Enforces the couimet defaults plus aligned table padding (`MD060`), with optional `--fix` support via the `MD060A` custom rule.

## Install

```bash
pnpm add -D @couimet/markdownlint-config
```

`markdownlint-cli2` (the lint runner) and `markdownlint-rule-force-align-table-columns` (custom rule `MD060A`, only needed for aligned-table auto-fix) are peer dependencies of the config, which pnpm and npm install automatically when peer auto-install is enabled: pnpm's default `autoInstallPeers=true` (since pnpm 10) or npm 7+ with peer dependencies enabled. `autoInstallPeers=false`, `legacy-peer-deps=true`, or older npm versions leave these dependencies unavailable, so install them manually in that case.

## Usage

### Extend from your own config

To add project-specific exceptions, extend the package from your own `.markdownlint-cli2.jsonc`:

```jsonc
{
  "config": {
    "extends": "@couimet/markdownlint-config",
    "MD013": false,
  },
}
```

markdownlint-cli2 resolves the `extends` target through `node_modules`. Rules set after the base config override the defaults, so a project adds its own exceptions the same way the `MD013: false` example above disables line-length checks.

### Opt into aligned-table auto-fix

The built-in `MD060` rule cannot auto-fix the aligned style; the `MD060A` custom rule is what lets `markdownlint-cli2 --fix` re-align the pipes. It is a peer dependency of the config; register it in `customRules` to activate:

```jsonc
{
  "customRules": ["markdownlint-rule-force-align-table-columns"],
  "config": {
    "extends": "@couimet/markdownlint-config",
  },
}
```

`MD060A` enforces alignment independently of `MD060`. To relax the aligned style entirely, disable both rules: `"MD060": false` and `"MD060A": false`.

### Point at the default file

The package ships a default `markdownlint-cli2.jsonc` that enforces the couimet defaults plus aligned table padding, without the `MD060A` custom rule:

```bash
markdownlint-cli2 --config node_modules/@couimet/markdownlint-config/markdownlint-cli2.jsonc "**/*.md"
```

## Programmatic access

`require('@couimet/markdownlint-config')` returns the config object directly when you need it in a Node script.

## Rules

| Rule  | Value                       | Note                              |
| ----- | --------------------------- | --------------------------------- |
| MD013 | false                       | Line length                       |
| MD024 | `{ "siblings_only": true }` | Duplicate headings                |
| MD033 | false                       | Inline HTML                       |
| MD060 | `{ "style": "aligned" }`    | Table column style: aligned pipes |

### MD060 table alignment

`MD060` (`table-column-style`) with `style: "aligned"` requires every table to keep its pipes vertically aligned:

```markdown
| Name  | Value |
| ----- | ----- |
| alpha | 1     |
```

The built-in `MD060` rule has no auto-fix for the aligned style; registering the `MD060A` custom rule (see [Opt into aligned-table auto-fix](#opt-into-aligned-table-auto-fix)) is what lets `markdownlint-cli2 --fix` re-align the pipes.
