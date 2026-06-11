import type { Options } from 'tsup';

export const baseConfig: Options = {
  target: 'es2022',
  clean: true,
  dts: { compilerOptions: { ignoreDeprecations: '6.0' } },
};
