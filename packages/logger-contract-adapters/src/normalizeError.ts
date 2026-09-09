/** Converts an `Error` into a plain object carrying its `name`, `message`, `stack`, and own enumerable properties; non-`Error` values pass through unchanged. Properties are copied by reference, so a bigint or circular member keeps its runtime type. */
export const normalizeError = (value: unknown): unknown => {
  if (value instanceof Error) {
    const serialized: Record<string, unknown> = {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
    for (const key of Object.keys(value)) {
      if (!Object.prototype.hasOwnProperty.call(serialized, key)) {
        Object.defineProperty(serialized, key, {
          value: (value as unknown as Record<string, unknown>)[key],
          enumerable: true,
          configurable: true,
          writable: true,
        });
      }
    }
    return serialized;
  }
  return value;
};
