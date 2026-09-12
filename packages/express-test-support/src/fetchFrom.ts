import { buildTestUrl } from './buildTestUrl';
import type { FetchTarget } from './fetchTarget';

/**
 * Sends a request to `path` on the given test server and returns the response.
 *
 * One reader for every suite. The body, the headers and the status all come off
 * the returned `Response`, so there is one request body to maintain and to cover
 * instead of a reader per shape, and every call site reads the same signature.
 * Pass `init` to send request headers or choose a method.
 */
export const fetchFrom = (target: FetchTarget, path: string, init?: RequestInit): Promise<Response> => fetch(buildTestUrl(target, path), init);
