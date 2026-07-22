# @couimet/eslint-config

[![npm version](https://img.shields.io/npm/v/@couimet/eslint-config.svg?style=flat-square)](https://www.npmjs.com/package/@couimet/eslint-config) [![npm downloads](https://img.shields.io/npm/dm/@couimet/eslint-config.svg?style=flat-square)](https://www.npmjs.com/package/@couimet/eslint-config)

Shared ESLint (flat config) and Prettier configuration for `@couimet/*` packages.

## Install

```bash
pnpm add -D @couimet/eslint-config eslint
```

pnpm does not link binaries for auto-installed peer dependencies, so `eslint` must be installed as a direct devDependency. The other peer dependencies (`@typescript-eslint/*`, `eslint-plugin-*`, etc.) are loaded as Node modules by eslint at runtime and are resolved by pnpm without an explicit install.

## ESLint

Create an `eslint.config.js` in your package:

```js
import couimetConfig from '@couimet/eslint-config/eslint';

export default couimetConfig;
```

To add overrides for specific files:

```js
import couimetConfig from '@couimet/eslint-config/eslint';

export default [
  ...couimetConfig,
  {
    files: ['__tests__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
```

## Barrel enforcement

The base config includes two barrel-import rules at `error`. Both apply to all files by default.

**`barrel-imports/no-duplicate-barrel-imports`** (from `@couimet/eslint-plugin-barrel-imports`): disallows multiple import statements from the same path. When a file imports from the same barrel more than once, merge the imports into a single statement.

**`barrel-boundary/enforce-barrel-files`** (from `eslint-plugin-barrel-boundary`): enforces that imports go through barrel files rather than directly to source files within a directory. The upstream `flat/recommended` preset is applied with its default settings.

### Interaction between the two rules

When a symbol is intentionally excluded from a barrel (a testing-only export is the most common case), the two rules can conflict. `enforce-barrel-files` forces the import through the barrel, but the symbol is not there, so the only working import is a direct source-file import — which `enforce-barrel-files` flags. Enable both rules and you cannot satisfy them simultaneously for that file.

The recommended fix is to disable `barrel-boundary/enforce-barrel-files` for the affected file pattern, typically tests:

```js
import couimetConfig from '@couimet/eslint-config/eslint';

export default [
  ...couimetConfig,
  {
    files: ['src/**/__tests__/**'],
    rules: {
      'barrel-boundary/enforce-barrel-files': 'off',
    },
  },
];
```

If your project policy allows it, you can instead add the missing symbol to the barrel.

## Default ignores

The ESLint config includes a set of default ignores for build output, cache directories, and tooling artifacts. See the `ignores` array in `eslint.config.js` for the current list.

## Explicit parameter types

Function and method parameters must carry explicit type annotations, even when TypeScript can infer them from contextual typing. This keeps callback signatures readable without tracing back to the property or parameter type.

```ts
type OnDetected = (comment: ReviewLimitComment, waitSeconds: number) => Promise<void>;

class EnqueueService {
  // With the typedef rule, parameter types must be written out:
  readonly handle: OnDetected = async (comment: ReviewLimitComment, waitSeconds: number) => {
    // ...
  };
}
```

Without this rule, `comment` and `waitSeconds` would compile fine with inferred types, but a reader scanning the implementation body would need to jump to the `OnDetected` definition to know what they are.

The rule is `@typescript-eslint/typedef` with `parameter: true`. See the [rule docs](https://typescript-eslint.io/rules/typedef/) for the full option set.

## Expiring TODOs

The config enforces `unicorn/expiring-todo-comments` at `error`. Every TODO comment must carry an expiry condition. Bare TODOs (no condition) are errors, and comments whose condition has been met (past date, installed dependency version, etc.) also error.

```ts
// TODO [2046-06-30]: Remove this workaround once lib v3 is released
// TODO [+react@19.0.0]: Migrate to the new concurrent API
```

See the [eslint-plugin-unicorn docs](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/expiring-todo-comments.md) for the full condition syntax (engine version, dependency presence, peer dependency version, and more).

## Prettier

In your package's `package.json`:

```json
{
  "prettier": "@couimet/eslint-config/prettier"
}
```

Or in a `.prettierrc`:

```json
"@couimet/eslint-config/prettier"
```

See [Prettier's documentation](https://prettier.io/docs/en/ignore) for `.prettierignore` setup.

## React

The config exports a `reactConfig(options)` function that adds React hooks and JSX safety rules. Use it when your project has React components.

Install the required plugins:

```bash
pnpm add -D eslint-plugin-react eslint-plugin-react-hooks
```

Then import and spread `reactConfig()` into your config array:

```js
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import baseConfig, { reactConfig } from '@couimet/eslint-config';

export default [
  ...baseConfig,
  ...reactConfig({
    plugins: { 'react-hooks': reactHooksPlugin, react: reactPlugin },
  }),
];
```

Both `react-hooks` and `react` are required in the plugins map. Passing them is the explicit opt-in gate.

The default rules are:

| Rule                          | Severity |
| ----------------------------- | -------- |
| `react-hooks/rules-of-hooks`  | error    |
| `react-hooks/exhaustive-deps` | warn     |
| `react/jsx-key`               | error    |
| `react/jsx-no-target-blank`   | error    |

Override individual rules with `options.rules`:

```js
...reactConfig({
  plugins: { 'react-hooks': reactHooksPlugin, react: reactPlugin },
  rules: { 'react-hooks/exhaustive-deps': 'off' },
}),
```
