/**
 * Reduces a raw request-header value to the single string that ExecutionContext.run() accepts.
 * Node's IncomingHttpHeaders can present a repeated header as a string[]; the first value wins.
 * A missing or empty value stays undefined, so run() generates a fresh id.
 */
export function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  const first = typeof value === 'string' ? value : value?.[0];
  return first === '' ? undefined : first;
}
