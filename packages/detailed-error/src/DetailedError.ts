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

const cloneWithWeakMap = (obj: ErrorDetails): ErrorDetails => {
  const seen = new WeakMap<object, object>();

  const clone = (value: unknown): unknown => {
    if (value === null || typeof value !== 'object') return value;
    if (seen.has(value as object)) return seen.get(value as object);
    if (Array.isArray(value)) {
      const arr: unknown[] = [];
      seen.set(value, arr);
      for (const item of value) arr.push(clone(item));
      return arr as unknown as ErrorDetails;
    }
    const result: Record<string, unknown> = {};
    seen.set(value as object, result);
    for (const key of Object.keys(value as Record<string, unknown>)) {
      result[key] = clone((value as Record<string, unknown>)[key]);
    }
    return result;
  };

  return clone(obj) as ErrorDetails;
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
    if (typeof errorOptions !== 'object' || errorOptions === null) {
      throw new TypeError('DetailedError constructor requires an errorOptions object');
    }

    const { code, details, cause, message, functionName } = errorOptions;

    if (typeof code !== 'string') {
      throw new TypeError(`DetailedError "code" must be a string, received ${typeof code}`);
    }
    if (typeof message !== 'string') {
      throw new TypeError(`DetailedError "message" must be a string, received ${typeof message}`);
    }
    if (functionName !== undefined && typeof functionName !== 'string') {
      throw new TypeError(`DetailedError "functionName" must be a string if provided, received ${typeof functionName}`);
    }
    if (details !== undefined && (typeof details !== 'object' || details === null)) {
      throw new TypeError(`DetailedError "details" must be an object if provided, received ${typeof details}`);
    }

    super(message, cause !== undefined ? { cause } : undefined);

    this.code = code;
    this.functionName = functionName;
    this.details = details !== undefined ? cloneWithWeakMap(details) : undefined;
  }
}
