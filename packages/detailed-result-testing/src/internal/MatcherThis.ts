/**
 * Minimal `this` type for Jest matchers that only declares the properties we
 * actually use.  This avoids a version conflict between `@types/jest` (v29)
 * and `expect` / `@jest/expect` (v30), where the `utils` shape differs by a
 * `SERIALIZABLE_PROPERTIES` property.  By declaring only the subset we need,
 * both runtime versions are structurally assignable.
 */
export interface MatcherThis {
  isNot?: boolean;
  equals(
    a: unknown,
    b: unknown,
    customTesters?: Array<(a: unknown, b: unknown, customTesters: Array<unknown>) => boolean | undefined>,
    strictCheck?: boolean,
  ): boolean;
  utils: {
    matcherHint(matcherName: string, received?: string, expected?: string, options?: { isNot?: boolean; comment?: string }): string;
    printExpected(value: unknown): string;
    printReceived(value: unknown): string;
    printWithType(name: string, value: unknown, print: (v: unknown) => string): string;
    stringify(value: unknown): string;
  };
}
