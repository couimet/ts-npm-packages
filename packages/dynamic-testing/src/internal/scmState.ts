/**
 * Shared mutable SCM configuration state.
 *
 * module-level singleton that `scm.ts` reads via `getConfig()` and mutates via
 * `setConfig()`. This file lives in `src/internal/` so the test-only `_setScm`
 * export isn't leaked through the barrel (`export * from './scm'`).
 */

import type { ScmConfig } from '../scm';

const DEFAULT_CONFIG = { scm: 'github' } as const;

let config: ScmConfig = DEFAULT_CONFIG;

export const getConfig = (): ScmConfig => config;

export const setConfig = (cfg: Partial<ScmConfig>): void => {
  config = { ...config, ...cfg };
};

/** @internal Bypass validation — test-only. Do not use in consumer code. */
export const _setScm = (scm: unknown): void => {
  config = { ...config, scm: scm as ScmConfig['scm'] };
};
