/**
 * Error codes for {@link DetailedResult} internal invariant violations.
 *
 * These codes are used when {@link DetailedResult} detects an invalid state,
 * such as accessing `.value` on an error result, accessing `.error` on a success
 * result, or constructing a result with arguments that contradict the invariant.
 * They are not expected to appear in normal application flow — they signal a bug
 * in the calling code, such as a missing `.success` check or an error argument
 * that is `undefined`.
 */
export enum DetailedResultErrorCodes {
  // Keep sorted alphabetically.

  /**
   * Attempted to access `.error` on a successful {@link DetailedResult}.
   * Always check `.success` before accessing `.error`.
   */
  RESULT_ERROR_ACCESS_ON_SUCCESS = 'RESULT_ERROR_ACCESS_ON_SUCCESS',

  /**
   * {@link DetailedResult} was constructed with an invalid combination of arguments:
   * a success result with an error defined, an error result with a value defined, or
   * an error result with no error defined. The factories keep the first two combinations
   * out of reach for a defined input, but {@link DetailedResult.failure} reaches the third
   * one when the caller passes `undefined`. A subclass constructor that passes inconsistent
   * arguments can reach all three.
   */
  RESULT_INVALID_STATE = 'RESULT_INVALID_STATE',

  /**
   * Attempted to access `.value` on an error {@link DetailedResult}.
   * Always check `.success` before accessing `.value`.
   */
  RESULT_VALUE_ACCESS_ON_ERROR = 'RESULT_VALUE_ACCESS_ON_ERROR',

  // Keep sorted alphabetically.
}
