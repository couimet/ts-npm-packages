export const isNonBlankString = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

// A rule that admits `undefined` beside a non-blank string, so a test can store an undefined value
// and read it back.
export const isOptionalNonBlankString = (value: unknown): value is string | undefined => value === undefined || isNonBlankString(value);

// One registry for the attribute tests: a declaration that carries a rule, a declaration that carries
// no rule, a ruled declaration whose value type admits `undefined`, and a second strict declaration so
// a test can pass one entry and leave another out.
export const ATTRIBUTE_REGISTRY = {
  attempt: { key: 'attempt' },
  region: { key: 'region', isValid: isOptionalNonBlankString },
  runId: { key: 'run_id', isValid: isNonBlankString },
  version: { key: 'version', isValid: isNonBlankString },
} as const;
