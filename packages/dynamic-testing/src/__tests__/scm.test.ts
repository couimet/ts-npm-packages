import type { Scm } from '../scm';
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
} from '../scm';

describe('scm', () => {
  beforeEach(() => {
    configure({ scm: 'github' });
  });

  describe('getUniqueGitHubOwner', () => {
    it('returns a string starting with gh-owner-', () => {
      const value = getUniqueGitHubOwner();
      expect(value).toMatch('gh-owner-');
    });
  });

  describe('getUniqueGitHubRepo', () => {
    it('returns a string starting with gh-repo-', () => {
      const value = getUniqueGitHubRepo();
      expect(value).toMatch('gh-repo-');
    });
  });

  describe('getUniqueGitHubRepoRef', () => {
    it('returns owner starting with gh-owner-', () => {
      const ref = getUniqueGitHubRepoRef();
      expect(ref.owner).toMatch('gh-owner-');
    });

    it('returns repo starting with gh-repo-', () => {
      const ref = getUniqueGitHubRepoRef();
      expect(ref.repo).toMatch('gh-repo-');
    });

    it('returns fullName as owner/repo', () => {
      const ref = getUniqueGitHubRepoRef();
      expect(ref.fullName).toBe(`${ref.owner}/${ref.repo}`);
    });
  });

  describe('getUniqueGitLabNamespace', () => {
    it('returns a string starting with gl-namespace-', () => {
      const value = getUniqueGitLabNamespace();
      expect(value).toMatch('gl-namespace-');
    });
  });

  describe('getUniqueGitLabProject', () => {
    it('returns a string starting with gl-project-', () => {
      const value = getUniqueGitLabProject();
      expect(value).toMatch('gl-project-');
    });
  });

  describe('getUniqueGitLabProjectRef', () => {
    it('returns namespace starting with gl-namespace-', () => {
      const ref = getUniqueGitLabProjectRef();
      expect(ref.namespace).toMatch('gl-namespace-');
    });

    it('returns project starting with gl-project-', () => {
      const ref = getUniqueGitLabProjectRef();
      expect(ref.project).toMatch('gl-project-');
    });

    it('returns fullName as namespace/project', () => {
      const ref = getUniqueGitLabProjectRef();
      expect(ref.fullName).toBe(`${ref.namespace}/${ref.project}`);
    });
  });

  describe('getUniqueRepoOwner', () => {
    it('returns a GitHub-style owner by default', () => {
      const value = getUniqueRepoOwner();
      expect(value).toMatch('gh-owner-');
    });

    it('returns a GitLab-style namespace after configure({ scm: "gitlab" })', () => {
      configure({ scm: 'gitlab' });
      const value = getUniqueRepoOwner();
      expect(value).toMatch('gl-namespace-');
    });
  });

  describe('getUniqueRepo', () => {
    it('returns a GitHub-style repo by default', () => {
      const value = getUniqueRepo();
      expect(value).toMatch('gh-repo-');
    });

    it('returns a GitLab-style project after configure({ scm: "gitlab" })', () => {
      configure({ scm: 'gitlab' });
      const value = getUniqueRepo();
      expect(value).toMatch('gl-project-');
    });
  });

  describe('getUniqueRepoRef', () => {
    it('returns a GitHub-style ref by default', () => {
      const ref = getUniqueRepoRef();
      expect(ref.owner).toMatch('gh-owner-');
      expect(ref.repo).toMatch('gh-repo-');
      expect(ref.fullName).toBe(`${ref.owner}/${ref.repo}`);
    });

    it('returns a GitLab-style ref mapped to UniqueRepoRef after configure({ scm: "gitlab" })', () => {
      configure({ scm: 'gitlab' });
      const ref = getUniqueRepoRef();
      expect(ref.owner).toMatch('gl-namespace-');
      expect(ref.repo).toMatch('gl-project-');
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
    it('getUniqueRepoOwner throws on an unsupported SCM value', () => {
      configure({ scm: 'bitbucket' as Scm });
      expect(() => getUniqueRepoOwner()).toThrow('[dynamic-testing] Unsupported SCM: bitbucket');
    });

    it('getUniqueRepo throws on an unsupported SCM value', () => {
      configure({ scm: 'bitbucket' as Scm });
      expect(() => getUniqueRepo()).toThrow('[dynamic-testing] Unsupported SCM: bitbucket');
    });

    it('getUniqueRepoRef throws on an unsupported SCM value', () => {
      configure({ scm: 'bitbucket' as Scm });
      expect(() => getUniqueRepoRef()).toThrow('[dynamic-testing] Unsupported SCM: bitbucket');
    });
  });
});
