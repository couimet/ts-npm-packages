import { DetailedResultErrorCodes } from './DetailedResultErrorCodes';

import { DetailedError } from '@couimet/detailed-error';

/**
 * Functional error handling Value Object.
 *
 * Represents either a successful value or an error. Use {@link DetailedResult.ok} and
 * {@link DetailedResult.err} factories to create instances, check `.success` before
 * accessing `.value` or `.error`.
 *
 * The constructor is `protected` so subclasses can pin the error type by overriding
 * the static factories.
 *
 * @typeParam T - The success value type.
 * @typeParam E - The error type. Unconstrained — use plain `Error`, {@link DetailedError}, or a project-specific subclass.
 */
export class DetailedResult<T, E> {
  private readonly _success: boolean;
  private readonly _value: T | undefined;
  private readonly _error: E | undefined;

  /**
   * Not for public use. Use {@link DetailedResult.ok} or {@link DetailedResult.err} factories instead.
   *
   * Marked `protected` so subclasses can extend to pin the error type.
   */
  protected constructor(success: boolean, value: T | undefined, error: E | undefined) {
    if (success && error !== undefined) {
      throw new DetailedError({
        code: DetailedResultErrorCodes.RESULT_INVALID_STATE,
        message: 'DetailedResult marked as success cannot have an error defined',
        functionName: 'DetailedResult.constructor',
        details: {
          success,
          hasValue: value !== undefined,
          hasError: error !== undefined,
        },
      });
    }
    if (!success && value !== undefined) {
      throw new DetailedError({
        code: DetailedResultErrorCodes.RESULT_INVALID_STATE,
        message: 'DetailedResult marked as error cannot have a value defined',
        functionName: 'DetailedResult.constructor',
        details: {
          success,
          hasValue: value !== undefined,
          hasError: error !== undefined,
        },
      });
    }
    if (!success && error === undefined) {
      throw new DetailedError({
        code: DetailedResultErrorCodes.RESULT_INVALID_STATE,
        message: 'DetailedResult marked as error must have an error defined',
        functionName: 'DetailedResult.constructor',
        details: {
          success,
          hasValue: value !== undefined,
          hasError: error !== undefined,
        },
      });
    }
    this._success = success;
    this._value = value;
    this._error = error;
  }

  /** Create a successful {@link DetailedResult} containing a value. */
  static ok<T>(value: T): DetailedResult<T, never> {
    return new DetailedResult<T, never>(true, value, undefined);
  }

  /** Create an error {@link DetailedResult} containing an error. */
  static err<E>(error: E): DetailedResult<never, E> {
    return new DetailedResult<never, E>(false, undefined, error);
  }

  /** Check if this {@link DetailedResult} is successful. Always check this before accessing `.value` or `.error`. */
  get success(): boolean {
    return this._success;
  }

  /**
   * Get the success value. Throws a {@link DetailedError} with code
   * {@link DetailedResultErrorCodes.RESULT_VALUE_ACCESS_ON_ERROR} if this is an error result.
   */
  get value(): T {
    if (!this._success) {
      throw new DetailedError({
        code: DetailedResultErrorCodes.RESULT_VALUE_ACCESS_ON_ERROR,
        message: 'Cannot access value on an error DetailedResult. Check .success before accessing .value',
        functionName: 'DetailedResult.value',
      });
    }
    return this._value as T;
  }

  /**
   * Get the error. Throws a {@link DetailedError} with code
   * {@link DetailedResultErrorCodes.RESULT_ERROR_ACCESS_ON_SUCCESS} if this is a success result.
   */
  get error(): E {
    if (this._success) {
      throw new DetailedError({
        code: DetailedResultErrorCodes.RESULT_ERROR_ACCESS_ON_SUCCESS,
        message: 'Cannot access error on a successful DetailedResult. Check .success before accessing .error',
        functionName: 'DetailedResult.error',
      });
    }
    return this._error as E;
  }
}
