// ── Internal testing utilities ───────────────────────────────────────────────
// NOT part of the public API. Exported only for @couimet/dynamic-testing's own
// unit tests. Do NOT import these from consumer test suites — behaviour may
// change without notice.

import { _resetCounter, _resetTimestampOffset } from './state';

/** @internal Reset the counter and timestamp offset. */
export const _reset = (value?: number): void => {
  _resetCounter(value);
  _resetTimestampOffset();
};
