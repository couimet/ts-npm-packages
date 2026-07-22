export const normalizeError = (value: unknown): unknown => {
  if (value instanceof Error) {
    const serialized: Record<string, unknown> = {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
    for (const key of Object.keys(value)) {
      if (!(key in serialized)) {
        serialized[key] = (value as unknown as Record<string, unknown>)[key];
      }
    }
    return serialized;
  }
  return value;
};
