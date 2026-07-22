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

### When a symbol is not in the barrel

If one of the duplicate imports includes a symbol intentionally excluded from the barrel (a testing-only export is the most common case), merging the imports will cause TypeScript to report that the symbol is not exported. Import that symbol directly from its source file instead:

```diff
- import { publicApi } from './barrel.js';
+ import { publicApi } from './barrel.js';
+ import { testingOnlyExport } from './barrel/sourceModule.js';
```

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
