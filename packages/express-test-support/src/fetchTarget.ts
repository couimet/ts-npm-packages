/**
 * The parts of a running test server that a request needs.
 *
 * Declared here rather than imported from `@couimet/express-tools` on purpose.
 * This package must keep zero `@couimet` dependency edges, because two of its
 * three consumers live inside `@couimet/express-tools`, so an edge back to that
 * package would close a cycle turbo refuses to build. `StartServerResult` from
 * `@couimet/express-tools` and the `TestServer` that
 * `@couimet/express-tools-testing` returns both satisfy this shape structurally,
 * so neither has to import it either.
 */
export interface FetchTarget {
  /** The address the server actually bound. */
  host: string;
  /** The port the server actually bound. */
  port: number;
}
