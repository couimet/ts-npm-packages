/**
 * Error codes for @couimet/dynamic-testing.
 *
 * Each validation gets its own code so tests and error handlers can match on
 * the exact failure rather than a generic bucket. Values are descriptive
 * strings (same as keys) for clear context in logs.
 *
 * Keep sorted alphabetically.
 */
export enum DynamicTestingErrorCodes {
  /** An environment variable value exceeds the configured cap. */
  ENV_VAR_EXCEEDS_CAP = 'ENV_VAR_EXCEEDS_CAP',
  /** An environment variable value is not a valid positive integer. */
  ENV_VAR_NOT_POSITIVE_INTEGER = 'ENV_VAR_NOT_POSITIVE_INTEGER',
  /** The `length` option to `getRandomString` is not a non-negative integer. */
  LENGTH_NOT_NON_NEGATIVE_INTEGER = 'LENGTH_NOT_NON_NEGATIVE_INTEGER',
  /** The `maxLength` option to `getUniqueString` is not a non-negative integer. */
  MAX_LENGTH_NOT_NON_NEGATIVE_INTEGER = 'MAX_LENGTH_NOT_NON_NEGATIVE_INTEGER',
  /** The `max` argument to `getRandomInt` is not a finite integer. */
  MAX_NOT_FINITE_INTEGER = 'MAX_NOT_FINITE_INTEGER',
  /** `min` is greater than `max` in a call to `getRandomInt`. */
  MIN_EXCEEDS_MAX = 'MIN_EXCEEDS_MAX',
  /** The `min` argument to `getRandomInt` is not a finite integer. */
  MIN_NOT_FINITE_INTEGER = 'MIN_NOT_FINITE_INTEGER',
  /** An optional peer dependency is not installed. */
  MISSING_OPTIONAL_DEPENDENCY = 'MISSING_OPTIONAL_DEPENDENCY',
  /** All enum values have been excluded, leaving none to pick from. */
  NO_ENUM_VALUES_AVAILABLE = 'NO_ENUM_VALUES_AVAILABLE',
  /** The `precision` argument exceeds the maximum allowed value. */
  PRECISION_EXCEEDS_MAXIMUM = 'PRECISION_EXCEEDS_MAXIMUM',
  /** The `precision` argument is not a positive integer. */
  PRECISION_NOT_POSITIVE_INTEGER = 'PRECISION_NOT_POSITIVE_INTEGER',
  /** The `_resetCounter` value exceeds the configured cap. */
  RESET_COUNTER_EXCEEDS_CAP = 'RESET_COUNTER_EXCEEDS_CAP',
  /** The `_resetCounter` value is not a positive integer. */
  RESET_COUNTER_NOT_POSITIVE_INTEGER = 'RESET_COUNTER_NOT_POSITIVE_INTEGER',
  /** `_setScm` was called with a non-string value. */
  SET_SCM_INVALID_TYPE = 'SET_SCM_INVALID_TYPE',
  /** `trueProbability` is not a finite number in [0, 1]. */
  TRUE_PROBABILITY_OUT_OF_RANGE = 'TRUE_PROBABILITY_OUT_OF_RANGE',
  /** The `scm` field on a switch statement received an unexpected value. */
  UNEXPECTED_SCM = 'UNEXPECTED_SCM',
  /** The SCM value passed to `configure()` is not in the supported list. */
  UNSUPPORTED_SCM = 'UNSUPPORTED_SCM',
}
