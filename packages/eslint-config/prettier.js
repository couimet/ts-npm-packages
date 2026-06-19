import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export default {
  plugins: [require.resolve('prettier-plugin-packagejson')],
  tabWidth: 2,
  singleQuote: true,
  printWidth: 160,
  trailingComma: 'all',
};
