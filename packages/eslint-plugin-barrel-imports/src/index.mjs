import noDuplicateBarrelImports from './rules/no-duplicate-barrel-imports.mjs';

export { default as noDuplicateBarrelImports } from './rules/no-duplicate-barrel-imports.mjs';

export default {
  rules: {
    'no-duplicate-barrel-imports': noDuplicateBarrelImports,
  },
};
