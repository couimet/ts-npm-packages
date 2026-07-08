import prettierOptions from './prettier.js';

import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unicorn from 'eslint-plugin-unicorn';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

/**
 * @typedef {object} ReactConfigPlugins
 * @property {import('eslint').ESLint.Plugin} ['react-hooks']
 * @property {import('eslint').ESLint.Plugin} react
 */

/**
 * @typedef {object} ReactConfigOptions
 * @property {ReactConfigPlugins} plugins
 * @property {Record<string, 'off' | 'warn' | 'error'>} [rules]
 */

/**
 * Returns an ESLint flat config array with React hooks and JSX safety rules.
 *
 * Consumers must install `eslint-plugin-react` and `eslint-plugin-react-hooks`
 * and pass both plugins via `options.plugins`.
 *
 * @param {ReactConfigOptions} options
 * @returns {import('eslint').Linter.FlatConfig[]}
 */
export function reactConfig(options) {
  if (!options?.plugins?.['react-hooks']) {
    throw new Error('reactConfig: options.plugins["react-hooks"] is required');
  }
  if (!options?.plugins?.['react']) {
    throw new Error('reactConfig: options.plugins["react"] is required');
  }

  return [
    {
      files: ['**/*.tsx'],
      plugins: options.plugins,
      rules: {
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'react/jsx-key': 'error',
        'react/jsx-no-target-blank': 'error',
        ...options.rules,
      },
    },
  ];
}

export default [
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**', '**/.history/**', '**/.turbo/**', 'pnpm-lock.yaml', '**/*.tsbuildinfo', '**/*.d.ts.map'],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
      unicorn,
      prettier: prettierPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...prettierConfig.rules,

      'prettier/prettier': ['error', { ...prettierOptions, endOfLine: 'auto' }],

      '@typescript-eslint/no-explicit-any': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          args: 'all',
          ignoreRestSiblings: true,
          vars: 'all',
        },
      ],
      '@typescript-eslint/no-empty-function': 'off',

      'simple-import-sort/imports': [
        'error',
        {
          groups: [['^\\^@'], ['^\\.\\.(?!/?$)', '^\\.\\./?$'], ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$']],
        },
      ],
      'simple-import-sort/exports': 'error',

      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      'require-await': 'error',

      'unicorn/expiring-todo-comments': [
        'error',
        {
          checkDates: true,
          allowWarningComments: false,
        },
      ],
    },
  },
];
