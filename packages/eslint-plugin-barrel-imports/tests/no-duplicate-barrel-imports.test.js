import barrelImports, { noDuplicateBarrelImports } from '../src/index.mjs';

import tsParser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

describe('plugin export', () => {
  it('should export the rule under barrel-imports/no-duplicate-barrel-imports', () => {
    expect(barrelImports.rules).toHaveProperty('no-duplicate-barrel-imports');
    expect(barrelImports.rules['no-duplicate-barrel-imports']).toBe(noDuplicateBarrelImports);
  });
});

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('no-duplicate-barrel-imports', noDuplicateBarrelImports, {
  valid: [
    // Single import.
    "import { foo } from './barrel.js';",
    // Distinct paths.
    "import { foo } from './barrel.js';\nimport { bar } from './other.js';",
    // Dynamic import (not flagged).
    "const mod = await import('./barrel.js');",
    // Empty specifier (defensive guard: falsy path triggers early return).
    "import {} from '';",
  ],

  invalid: [
    {
      code: "import { foo } from './barrel.js';\nimport { bar } from './barrel.js';",
      errors: [{ messageId: 'duplicateBarrel', data: { path: './barrel.js' } }],
    },
    {
      // Triple duplicate from same path.
      code: "import { foo } from './barrel.js';\nimport { bar } from './barrel.js';\nimport { baz } from './barrel.js';",
      errors: [
        { messageId: 'duplicateBarrel', data: { path: './barrel.js' } },
        { messageId: 'duplicateBarrel', data: { path: './barrel.js' } },
      ],
    },
  ],
});

// Run against a real project tree when TEST_ROOT_DIR is set (dev gating).
const rootDir = process.env.TEST_ROOT_DIR;
if (rootDir) {
  describe('real-project validation', () => {
    const files = [];

    /**
     * @param {string} dir
     */
    // eslint-disable-next-line @typescript-eslint/typedef -- JSDoc @param already provides the type
    function collect(dir) {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (entry.startsWith('.') || entry === 'node_modules' || entry === 'dist' || entry === 'coverage') continue;
        const s = statSync(full);
        if (s.isDirectory()) {
          collect(full);
        } else if (/\.(ts|js|mjs|tsx|jsx)$/.test(entry)) {
          files.push(full);
        }
      }
    }

    collect(rootDir);

    for (const file of files) {
      it(`should have no duplicate barrel imports in ${file}`, () => {
        const code = readFileSync(file, 'utf8');
        const ruleTesterLocal = new RuleTester({
          languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            parser: tsParser,
            parserOptions: { ecmaFeatures: { jsx: true } },
          },
        });

        ruleTesterLocal.run('no-duplicate-barrel-imports', noDuplicateBarrelImports, {
          valid: [code],
          invalid: [],
        });
      });
    }
  });
}
