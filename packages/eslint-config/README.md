# @couimet/eslint-config

Shared ESLint (flat config) and Prettier configuration for `@couimet/*` packages.

## Install

```bash
pnpm add -D @couimet/eslint-config
```

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
