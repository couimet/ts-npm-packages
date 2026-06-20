/**
 * Common error codes that any project can reuse.
 *
 * ## Merging with project-specific codes
 *
 * Define a project enum, then create a merged object and a union type. Spread order matters:
 * put the project-specific enum first so a duplicate key in {@link SharedErrorCodes} does not
 * silently override the project value.
 *
 * ```ts
 * const Codes = { ...MyServiceCodes, ...SharedErrorCodes };
 * type Codes = MyServiceCodes | SharedErrorCodes;
 * ```
 *
 * For a runnable example of enum spreading with TypeScript types, see
 * https://stackblitz.com/edit/typescript-3xheja?file=index.ts
 * (from https://stackoverflow.com/a/64549988/2965062).
 */
export enum SharedErrorCodes {
  // Keep sorted alphabetically.
  /**
   * A code path was reached that was not expected to be reachable.
   * Use when the situation is too narrow to merit its own dedicated code.
   */
  UNEXPECTED_CODE_PATH = 'UNEXPECTED_CODE_PATH',

  /**
   * Catch-all for errors that do not fit a more specific code.
   */
  UNKNOWN = 'UNKNOWN',

  /**
   * Input from an external source failed validation.
   */
  VALIDATION = 'VALIDATION',

  // Keep sorted alphabetically.
}
