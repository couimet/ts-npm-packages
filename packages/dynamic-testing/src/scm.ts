import { pkgError } from './internal/errors';
import { getUniqueString } from './string';

export interface UniqueRepoRef {
  owner: string;
  repo: string;
  fullName: string;
}

export interface UniqueProjectRef {
  namespace: string;
  project: string;
  fullName: string;
}

export type Scm = 'github' | 'gitlab';

export type ScmConfig = { scm: Scm };

const DEFAULT_CONFIG = { scm: 'github' } as const;

let config: ScmConfig = DEFAULT_CONFIG;

export const configure = (cfg: Partial<ScmConfig>): void => {
  config = { ...config, ...cfg };
};

const getConfig = (): ScmConfig => config;

export const getUniqueGitHubOwner = (): string => getUniqueString({ charset: 'alpha', prefix: 'gh-owner-' });

export const getUniqueGitHubRepo = (): string => getUniqueString({ charset: 'alpha', prefix: 'gh-repo-' });

export const getUniqueGitHubRepoRef = (): UniqueRepoRef => {
  const owner = getUniqueGitHubOwner();
  const repo = getUniqueGitHubRepo();
  return { owner, repo, fullName: `${owner}/${repo}` };
};

export const getUniqueGitLabNamespace = (): string => getUniqueString({ charset: 'alpha', prefix: 'gl-namespace-' });

export const getUniqueGitLabProject = (): string => getUniqueString({ charset: 'alpha', prefix: 'gl-project-' });

export const getUniqueGitLabProjectRef = (): UniqueProjectRef => {
  const namespace = getUniqueGitLabNamespace();
  const project = getUniqueGitLabProject();
  return { namespace, project, fullName: `${namespace}/${project}` };
};

export const getUniqueRepoOwner = (): string => {
  const { scm } = getConfig();
  switch (scm) {
    case 'github':
      return getUniqueGitHubOwner();
    case 'gitlab':
      return getUniqueGitLabNamespace();
    default: {
      const _exhaustive: never = scm;
      throw pkgError(`Unsupported SCM: ${String(_exhaustive)}`);
    }
  }
};

export const getUniqueRepo = (): string => {
  const { scm } = getConfig();
  switch (scm) {
    case 'github':
      return getUniqueGitHubRepo();
    case 'gitlab':
      return getUniqueGitLabProject();
    default: {
      const _exhaustive: never = scm;
      throw pkgError(`Unsupported SCM: ${String(_exhaustive)}`);
    }
  }
};

export const getUniqueRepoRef = (): UniqueRepoRef => {
  const { scm } = getConfig();
  switch (scm) {
    case 'github':
      return getUniqueGitHubRepoRef();
    case 'gitlab': {
      const { namespace, project, fullName } = getUniqueGitLabProjectRef();
      return { owner: namespace, repo: project, fullName };
    }
    default: {
      const _exhaustive: never = scm;
      throw pkgError(`Unsupported SCM: ${String(_exhaustive)}`);
    }
  }
};
