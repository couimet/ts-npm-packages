/** Base type for error details */
export type ErrorDetails = { readonly [key: string]: unknown };

/** Base type for error options */
export type ErrorOptions<T extends string> = {
  /** Unique error code identifying the type of error */
  readonly code: T;
  /** Human-readable error message */
  readonly message: string;
  /** Name of the function where the error occurred */
  readonly functionName?: string;
  /** Additional contextual information about the error */
  readonly details?: ErrorDetails;
  /** Original error that caused this error */
  readonly cause?: unknown;
};

/**
 * Base class for all errors.
 *
 * Using a generic type for {@link code} allows both enum-based strong typing and plain string codes:
 *
 * - **Enum (strong typing):** subclass {@link DetailedError} with an enum type like `DetailedError<MyErrorCodes>`
 * - **String (simple):** use `DetailedError<string>` directly without subclassing
 *
 * {@link cause} is passed to the native {@link Error} constructor so it appears in stack traces
 * and error-cause chains without a redundant field declaration.
 */
export class DetailedError<T extends string> extends Error {
  /** Unique error code identifying the type of error */
  public readonly code: T;
  /** Name of the function where the error occurred */
  public readonly functionName?: string;
  /** Additional contextual information about the error */
  public readonly details?: ErrorDetails;

  constructor(errorOptions: ErrorOptions<T>) {
    const { code, details, cause, message, functionName } = errorOptions;

    super(message, cause !== undefined ? { cause } : undefined);

    this.code = code;
    this.functionName = functionName;
    this.details = details !== undefined ? structuredClone(details) : undefined;
  }
}
