import type { FetchTarget } from './fetchTarget';

/**
 * Builds the URL for `path` on the given test server.
 *
 * An IPv6 host is bracketed, because `http://::1:3000/smoke` is not a valid URL
 * and `startServer` accepts any host. Not in the barrel: only {@link fetchFrom}
 * needs it.
 */
export const buildTestUrl = (target: FetchTarget, path: string): string => {
  const host = target.host.includes(':') ? `[${target.host}]` : target.host;

  return `http://${host}:${target.port}${path}`;
};
