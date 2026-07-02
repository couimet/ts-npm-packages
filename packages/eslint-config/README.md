# @couimet/eslint-config

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

## Default ignores

The ESLint config includes a set of default ignores for build output, cache directories, and tooling artifacts. See the `ignores` array in `eslint.config.js` for the current list.

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

## Expiring TODOs

The config enforces `unicorn/expiring-todo-comments` at `error`. Every TODO comment must carry an expiry condition. Bare TODOs (no condition) are errors, and comments whose condition has been met (past date, installed dependency version, etc.) also error.

```ts
// TODO [2046-06-30]: Remove this workaround once lib v3 is released
// TODO [+react@19.0.0]: Migrate to the new concurrent API
```

See the [eslint-plugin-unicorn docs](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/expiring-todo-comments.md) for the full condition syntax (engine version, dependency presence, peer dependency version, and more).

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
