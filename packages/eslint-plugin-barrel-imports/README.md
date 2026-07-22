# @couimet/eslint-plugin-barrel-imports

ESLint plugin with rules enforcing barrel import hygiene.

## Install

```bash
pnpm add -D @couimet/eslint-plugin-barrel-imports eslint
```

## Rule Reference

### `no-duplicate-barrel-imports`

Disallows multiple import statements from the same path. When a file imports from the same barrel (or any module path) more than once, the second and subsequent imports are flagged. Merge them into a single import statement.

**Why:** Multiple imports from the same path add noise, make it harder to see what a file depends on at a glance, and risk merge-conflict churn when two contributors add imports to the same barrel line.

**Examples:**

- ❌ `import { foo } from './barrel.js';` / `import { bar } from './barrel.js';`
- ✅ `import { foo, bar } from './barrel.js';`

## Usage (ESLint flat config)

```js
import barrelImports from '@couimet/eslint-plugin-barrel-imports';

export default [
  {
    plugins: { 'barrel-imports': barrelImports },
    rules: {
      'barrel-imports/no-duplicate-barrel-imports': 'error',
    },
  },
];
```
