/**
 * Error codes for {@link DetailedResult} internal invariant violations.
 *
 * These codes are used when {@link DetailedResult} detects an invalid state,
 * such as accessing `.value` on an error result or `.error` on a success result.
 * They are not expected to appear in normal application flow — they signal a bug
 * in the calling code (missing `.success` check before access).
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
   * either a success result with an error defined, or an error result with a value defined.
   * This should never happen through the public factory methods ({@link DetailedResult.success} /
   * {@link DetailedResult.failure}); it can only be triggered by a subclass constructor
   * passing inconsistent arguments.
   */
  RESULT_INVALID_STATE = 'RESULT_INVALID_STATE',

  /**
   * Attempted to access `.value` on an error {@link DetailedResult}.
   * Always check `.success` before accessing `.value`.
   */
  RESULT_VALUE_ACCESS_ON_ERROR = 'RESULT_VALUE_ACCESS_ON_ERROR',

  // Keep sorted alphabetically.
}
