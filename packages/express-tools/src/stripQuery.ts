/**
 * Returns the part of `url` before the query string.
 *
 * Both loggers in this package need a value that cannot carry a credential, and
 * every natural source carries one: `req.originalUrl` and `req.url` include the
 * query string, and morgan's built-in `:url` token resolves to
 * `req.originalUrl || req.url`, so a request to `/callback?token=...` writes the
 * token into the log. This module is deliberately not in the barrel, so it stays
 * an implementation detail of the two middlewares that need it.
 */
export const stripQuery = (url: string): string => {
  const queryStart = url.indexOf('?');

  return queryStart === -1 ? url : url.slice(0, queryStart);
};
