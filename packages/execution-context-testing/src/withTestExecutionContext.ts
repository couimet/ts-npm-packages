import { getUniqueString } from '@couimet/dynamic-testing';
import { ExecutionContext, type RunParams } from '@couimet/execution-context';

/**
 * Runs `fn` inside a fresh execution context, so a test reads an active context without priming one
 * by hand. Pass `undefined` to let the helper generate both ids. Pass a `RunParams` to pin the ids a
 * test asserts against. Any id the caller omits is generated, so a test that cares only about the
 * attributes passes `undefined` and never holds a fixed pair.
 *
 * The attributes pass through untouched, so `ExecutionContext.run` applies its own default for
 * `undefined` and rejects a value that is not a record. The helper therefore coerces no input.
 *
 * The context dies with the callback, because `ExecutionContext.run` restores the state it found.
 */
export const withTestExecutionContext = <T>(params: RunParams | undefined, fn: () => T): T =>
  ExecutionContext.run(
    {
      correlationId: params?.correlationId ?? getUniqueString({ prefix: 'correlation-' }),
      requestId: params?.requestId ?? getUniqueString({ prefix: 'request-' }),
      attributes: params?.attributes,
    },
    fn,
  );
