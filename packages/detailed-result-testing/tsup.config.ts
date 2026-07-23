import { baseConfig } from '../../tsup.config.base';

import { defineConfig } from 'tsup';

export default defineConfig({
  ...baseConfig,
  entry: { index: 'src/index.ts', setup: 'src/setup.ts', 'setup-before-jest-30': 'src/setup-before-jest-30.ts' },
  format: ['cjs', 'esm'],
});
