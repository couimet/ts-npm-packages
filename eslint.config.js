import baseConfig from '@couimet/eslint-config/eslint';

export default [
  ...baseConfig,
  {
    ignores: ['.history/**', '.claude-work/**'],
  },
];
