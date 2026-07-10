import { DynamicTestingErrorCodes } from './internal/DynamicTestingErrorCodes';
import { getConfig, setConfig } from './internal/scmState';
import { getUniqueString } from './string';

import { DetailedError } from '@couimet/detailed-error';

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

const SUPPORTED_SCMS: readonly Scm[] = ['github', 'gitlab'];

export const configure = (cfg: Partial<ScmConfig>): void => {
  if (cfg.scm !== undefined && !(SUPPORTED_SCMS as readonly string[]).includes(cfg.scm)) {
    throw new DetailedError({
      code: DynamicTestingErrorCodes.UNSUPPORTED_SCM,
      message: 'Unsupported SCM',
      functionName: 'configure',
      details: { received: cfg.scm },
    });
  }
  setConfig(cfg);
};

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
    default:
      throw DetailedError.forUnexpectedSwitchDefault('SCM', scm satisfies never, 'getUniqueRepoOwner', {
        code: DynamicTestingErrorCodes.UNEXPECTED_SCM,
      });
  }
};

export const getUniqueRepo = (): string => {
  const { scm } = getConfig();
  switch (scm) {
    case 'github':
      return getUniqueGitHubRepo();
    case 'gitlab':
      return getUniqueGitLabProject();
    default:
      throw DetailedError.forUnexpectedSwitchDefault('SCM', scm satisfies never, 'getUniqueRepo', {
        code: DynamicTestingErrorCodes.UNEXPECTED_SCM,
      });
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
    default:
      throw DetailedError.forUnexpectedSwitchDefault('SCM', scm satisfies never, 'getUniqueRepoRef', {
        code: DynamicTestingErrorCodes.UNEXPECTED_SCM,
      });
  }
};
