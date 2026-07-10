/**
 * Shared mutable state for the dynamic-testing package.
 *
 * The counter and timestamp offset are module-level singletons — every `getUnique*`
 * call reads and increments them. They live in this separate file so that:
 *
 * - `unique.ts` (public API) can import and mutate them without owning the state.
 *   This keeps `unique.ts` free of internal exports that `export *` would leak.
 * - `uniqueTestUtils.ts` (test-only helpers) can reset and snapshot them without
 *   coupling to the public module, which would force `unique.ts` to export
 *   internal symbols just for its own tests.
 * - The `index.ts` barrel can use `export * from './unique'` without accidentally
 *   exposing test scaffolding to consumers.
 *
 * Nothing in this directory is part of the public API. Do NOT import from
 * `@couimet/dynamic-testing/src/internal/` in consumer code.
 */

import { COUNTER_START, MAX_COUNTER_START } from '../counterStart';

import { DynamicTestingErrorCodes } from './DynamicTestingErrorCodes';
import { isPositiveInteger } from './validation';

import { DetailedError } from '@couimet/detailed-error';

export const MODULE_LOAD_TIME = Date.now();

let COUNTER = COUNTER_START;
let TIMESTAMP_OFFSET = 1;

export const _getCounter = (): number => COUNTER;
export const _resetCounter = (value?: number): void => {
  const start = value ?? COUNTER_START;
  if (!isPositiveInteger(start)) {
    throw new DetailedError({
      code: DynamicTestingErrorCodes.RESET_COUNTER_NOT_POSITIVE_INTEGER,
      message: '_resetCounter requires a positive integer',
      functionName: '_resetCounter',
      details: { received: start },
    });
  }
  if (start > MAX_COUNTER_START) {
    throw new DetailedError({
      code: DynamicTestingErrorCodes.RESET_COUNTER_EXCEEDS_CAP,
      message: '_resetCounter value exceeds cap',
      functionName: '_resetCounter',
      details: { received: start, cap: MAX_COUNTER_START },
    });
  }
  COUNTER = start;
};
export const incCounter = (): number => COUNTER++;

export const incTimestampOffset = (): number => TIMESTAMP_OFFSET++;
export const _resetTimestampOffset = (): void => {
  TIMESTAMP_OFFSET = 1;
};
