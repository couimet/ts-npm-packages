# @couimet/dynamic-testing

## Error messages

Every error thrown from this package must use `DetailedError` from `@couimet/detailed-error` rather than `new Error(...)` directly. Use codes from `DynamicTestingErrorCodes` in `src/internal/DynamicTestingErrorCodes.ts` for package-specific errors; leverage `SharedErrorCodes` when a code is truly shared. Always set `functionName` to the calling function's name so consumers can identify the error source without a stack trace.

## Validation

Use the shared predicates in `src/internal/validation.ts` (`isPositiveInteger`, `isNonNegativeInteger`, `isFiniteInteger`) for numeric input checks rather than inlining `Number.isInteger(x) && x > 0`. Pair the predicate with `throw new DetailedError({ code: DynamicTestingErrorCodes.VALIDATION, message: '...', functionName: '...' })`.

## Internal vs. public

Anything under `src/internal/` is implementation detail. It is not re-exported from `src/index.ts` and consumers must not import from `@couimet/dynamic-testing/src/internal/`. Test scaffolding (`_reset`, `_getCounter`) lives there for the same reason — keep it out of the package's public surface.
