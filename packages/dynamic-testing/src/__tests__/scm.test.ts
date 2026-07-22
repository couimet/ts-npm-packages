import {
  configure,
  getUniqueGitHubOwner,
  getUniqueGitHubRepo,
  getUniqueGitHubRepoRef,
  getUniqueGitLabNamespace,
  getUniqueGitLabProject,
  getUniqueGitLabProjectRef,
  getUniqueRepo,
  getUniqueRepoOwner,
  getUniqueRepoRef,
  type Scm,
} from '../index';
import { _setScm } from '../internal/scmState';

describe('scm', () => {
  beforeEach(() => {
    configure({ scm: 'github' });
  });

  describe('getUniqueGitHubOwner', () => {
    it('returns a string starting with gh-owner-', () => {
      const value = getUniqueGitHubOwner();
      expect(value).toStartWith('gh-owner-');
    });
  });

  describe('getUniqueGitHubRepo', () => {
    it('returns a string starting with gh-repo-', () => {
      const value = getUniqueGitHubRepo();
      expect(value).toStartWith('gh-repo-');
    });
  });

  describe('getUniqueGitHubRepoRef', () => {
    it('returns owner starting with gh-owner-', () => {
      const ref = getUniqueGitHubRepoRef();
      expect(ref.owner).toStartWith('gh-owner-');
    });

    it('returns repo starting with gh-repo-', () => {
      const ref = getUniqueGitHubRepoRef();
      expect(ref.repo).toStartWith('gh-repo-');
    });

    it('returns fullName as owner/repo', () => {
      const ref = getUniqueGitHubRepoRef();
      expect(ref.fullName).toBe(`${ref.owner}/${ref.repo}`);
    });
  });

  describe('getUniqueGitLabNamespace', () => {
    it('returns a string starting with gl-namespace-', () => {
      const value = getUniqueGitLabNamespace();
      expect(value).toStartWith('gl-namespace-');
    });
  });

  describe('getUniqueGitLabProject', () => {
    it('returns a string starting with gl-project-', () => {
      const value = getUniqueGitLabProject();
      expect(value).toStartWith('gl-project-');
    });
  });

  describe('getUniqueGitLabProjectRef', () => {
    it('returns namespace starting with gl-namespace-', () => {
      const ref = getUniqueGitLabProjectRef();
      expect(ref.namespace).toStartWith('gl-namespace-');
    });

    it('returns project starting with gl-project-', () => {
      const ref = getUniqueGitLabProjectRef();
      expect(ref.project).toStartWith('gl-project-');
    });

    it('returns fullName as namespace/project', () => {
      const ref = getUniqueGitLabProjectRef();
      expect(ref.fullName).toBe(`${ref.namespace}/${ref.project}`);
    });
  });

  describe('getUniqueRepoOwner', () => {
    it('returns a GitHub-style owner by default', () => {
      const value = getUniqueRepoOwner();
      expect(value).toStartWith('gh-owner-');
    });

    it('returns a GitLab-style namespace after configure({ scm: "gitlab" })', () => {
      configure({ scm: 'gitlab' });
      const value = getUniqueRepoOwner();
      expect(value).toStartWith('gl-namespace-');
    });
  });

  describe('getUniqueRepo', () => {
    it('returns a GitHub-style repo by default', () => {
      const value = getUniqueRepo();
      expect(value).toStartWith('gh-repo-');
    });

    it('returns a GitLab-style project after configure({ scm: "gitlab" })', () => {
      configure({ scm: 'gitlab' });
      const value = getUniqueRepo();
      expect(value).toStartWith('gl-project-');
    });
  });

  describe('getUniqueRepoRef', () => {
    it('returns a GitHub-style ref by default', () => {
      const ref = getUniqueRepoRef();
      expect(ref.owner).toStartWith('gh-owner-');
      expect(ref.repo).toStartWith('gh-repo-');
      expect(ref.fullName).toBe(`${ref.owner}/${ref.repo}`);
    });

    it('returns a GitLab-style ref mapped to UniqueRepoRef after configure({ scm: "gitlab" })', () => {
      configure({ scm: 'gitlab' });
      const ref = getUniqueRepoRef();
      expect(ref.owner).toStartWith('gl-namespace-');
      expect(ref.repo).toStartWith('gl-project-');
      expect(ref.fullName).toBe(`${ref.owner}/${ref.repo}`);
    });
  });

  describe('uniqueness', () => {
    it('getUniqueGitHubOwner returns different values on successive calls', () => {
      const a = getUniqueGitHubOwner();
      const b = getUniqueGitHubOwner();
      expect(a).not.toBe(b);
    });

    it('getUniqueGitHubRepo returns different values on successive calls', () => {
      const a = getUniqueGitHubRepo();
      const b = getUniqueGitHubRepo();
      expect(a).not.toBe(b);
    });

    it('getUniqueGitHubRepoRef returns different values on successive calls', () => {
      const a = getUniqueGitHubRepoRef();
      const b = getUniqueGitHubRepoRef();
      expect(a.fullName).not.toBe(b.fullName);
    });

    it('getUniqueGitLabNamespace returns different values on successive calls', () => {
      const a = getUniqueGitLabNamespace();
      const b = getUniqueGitLabNamespace();
      expect(a).not.toBe(b);
    });

    it('getUniqueGitLabProject returns different values on successive calls', () => {
      const a = getUniqueGitLabProject();
      const b = getUniqueGitLabProject();
      expect(a).not.toBe(b);
    });

    it('getUniqueGitLabProjectRef returns different values on successive calls', () => {
      const a = getUniqueGitLabProjectRef();
      const b = getUniqueGitLabProjectRef();
      expect(a.fullName).not.toBe(b.fullName);
    });

    it('getUniqueRepoOwner returns different values on successive calls', () => {
      const a = getUniqueRepoOwner();
      const b = getUniqueRepoOwner();
      expect(a).not.toBe(b);
    });

    it('getUniqueRepo returns different values on successive calls', () => {
      const a = getUniqueRepo();
      const b = getUniqueRepo();
      expect(a).not.toBe(b);
    });

    it('getUniqueRepoRef returns different values on successive calls', () => {
      const a = getUniqueRepoRef();
      const b = getUniqueRepoRef();
      expect(a.fullName).not.toBe(b.fullName);
    });
  });

  describe('exhaustiveness', () => {
    describe('configure() validation', () => {
      it('throws a DetailedError with VALIDATION code, functionName, and details', () => {
        expect(() => configure({ scm: 'bitbucket' as Scm })).toThrowDetailedError('UNSUPPORTED_SCM', {
          message: 'Unsupported SCM',
          functionName: 'configure',
          details: { received: 'bitbucket' },
        });
      });
    });

    describe('exhaustive-switch defaults', () => {
      it('getUniqueRepoOwner throws when scm is an unexpected runtime value', () => {
        _setScm('bitbucket');
        expect(() => getUniqueRepoOwner()).toThrowDetailedError('UNEXPECTED_SCM', {
          message: 'Unexpected SCM: "bitbucket"',
          functionName: 'getUniqueRepoOwner',
          details: { unexpectedValue: 'bitbucket' },
        });
      });

      it('getUniqueRepo throws when scm is an unexpected runtime value', () => {
        _setScm('bitbucket');
        expect(() => getUniqueRepo()).toThrowDetailedError('UNEXPECTED_SCM', {
          message: 'Unexpected SCM: "bitbucket"',
          functionName: 'getUniqueRepo',
          details: { unexpectedValue: 'bitbucket' },
        });
      });

      it('getUniqueRepoRef throws when scm is an unexpected runtime value', () => {
        _setScm('bitbucket');
        expect(() => getUniqueRepoRef()).toThrowDetailedError('UNEXPECTED_SCM', {
          message: 'Unexpected SCM: "bitbucket"',
          functionName: 'getUniqueRepoRef',
          details: { unexpectedValue: 'bitbucket' },
        });
      });
    });
    describe('_setScm validation', () => {
      it('throws when passed a non-string value', () => {
        expect(() => _setScm(null)).toThrowDetailedError('SET_SCM_INVALID_TYPE', {
          message: '_setScm expects a string',
          functionName: '_setScm',
          details: { received: null },
        });
        expect(() => _setScm(123)).toThrowDetailedError('SET_SCM_INVALID_TYPE', {
          message: '_setScm expects a string',
          functionName: '_setScm',
          details: { received: 123 },
        });
        expect(() => _setScm(undefined)).toThrowDetailedError('SET_SCM_INVALID_TYPE', {
          message: '_setScm expects a string',
          functionName: '_setScm',
          details: { received: undefined },
        });
      });
    });
  });
});
