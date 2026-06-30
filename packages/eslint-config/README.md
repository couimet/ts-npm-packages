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
