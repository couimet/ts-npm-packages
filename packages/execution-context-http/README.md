# @couimet/execution-context-http

[![npm version](https://img.shields.io/npm/v/@couimet/execution-context-http.svg?style=flat-square)](https://www.npmjs.com/package/@couimet/execution-context-http) [![Coverage](https://codecov.io/gh/couimet/ts-npm-packages/branch/main/graph/badge.svg?flag=execution-context-http)](https://codecov.io/gh/couimet/ts-npm-packages?flag=execution-context-http) [![npm downloads](https://img.shields.io/npm/dm/@couimet/execution-context-http.svg?style=flat-square)](https://www.npmjs.com/package/@couimet/execution-context-http)

`@couimet/execution-context-http` names the HTTP headers that carry a correlation id and a request id between services. The `HttpHeaders` enum holds the wire names, so inbound parsing and outbound writing share one spelling. The package has no runtime dependencies and no framework dependency. It lets the core [`@couimet/execution-context`](https://github.com/couimet/ts-npm-packages/tree/main/packages/execution-context) package stay free of HTTP concerns.

## Install

```bash
pnpm add @couimet/execution-context-http
```

## Usage

Read the header names off the enum instead of hard-coding strings:

```typescript
import { HttpHeaders } from '@couimet/execution-context-http';

HttpHeaders.CorrelationId; // 'x-correlation-id'
HttpHeaders.RequestId; // 'x-request-id'
```

An adapter uses the enum in both directions. It reads the names to pull the ids off an incoming request. Then it echoes the same names back when it writes the response. One enum keeps the two directions in sync:

```typescript
import { ExecutionContext } from '@couimet/execution-context';
import { HttpHeaders } from '@couimet/execution-context-http';

// Inbound: read the wire names off the request.
const correlationId = request.headers[HttpHeaders.CorrelationId]; // string | undefined
const requestId = request.headers[HttpHeaders.RequestId]; // string | undefined

// Prime a scope for the request handler.
ExecutionContext.run({ correlationId, requestId }, () => {
  const result = handler();

  // Outbound, while the scope is still active: echo the ids on the response.
  response.setHeader(HttpHeaders.CorrelationId, ExecutionContext.correlationId.toString());
  response.setHeader(HttpHeaders.RequestId, ExecutionContext.requestId.toString());

  return result;
});
```

## API reference

### HttpHeaders

The complete public API is one enum:

```typescript
enum HttpHeaders {
  CorrelationId = 'x-correlation-id',
  RequestId = 'x-request-id',
}
```

The member values are the lower-case wire header names used when writing a response. When an adapter reads the ids off a request, it cannot assume the headers object lower-cases its keys the way Node's `IncomingHttpHeaders` does. A runtime that preserves case can present `X-Correlation-Id` where the enum reads `x-correlation-id`, so the adapter should look the values up case-insensitively or normalize the header keys to lower case first. When an adapter writes a response, it echoes the id that it primed. Leave the header absent rather than send an empty string when no id exists, so a downstream consumer can treat a missing header as not provided.

## Related packages

- [`@couimet/execution-context`](https://github.com/couimet/ts-npm-packages/tree/main/packages/execution-context) is the runtime that consumes these names. Its `ExecutionContext.run()` primes the ids parsed from the headers.

A framework adapter reads the names from this package, pulls the ids off the incoming request, and wraps `ExecutionContext.run()`. Each adapter lives in its own package named after its framework, such as `@couimet/execution-context-http-express`. The core package never depends on HTTP or a framework.

## License

MIT
