# @couimet/dynamic-testing

## Validation

Use the shared predicates in `src/internal/validation.ts` (`isPositiveInteger`, `isNonNegativeInteger`) for numeric input checks rather than inlining `Number.isInteger(x) && x > 0`. Pair the predicate with `throw pkgError(...)` per the repo-wide rule in the root `CLAUDE.md`.

## Error messages

Every error thrown from this package must use `pkgError` from `src/internal/errors.ts` rather than `new Error(...)` directly. `pkgError` prefixes the message with `[dynamic-testing]` so a consumer seeing a stack trace can immediately attribute the failure. The prefix lives in exactly one constant — do not hand-write it in error messages.

## Internal vs. public

Anything under `src/internal/` is implementation detail. It is not re-exported from `src/index.ts` and consumers must not import from `@couimet/dynamic-testing/src/internal/`. Test scaffolding (`_reset`, `_getCounter`) lives there for the same reason — keep it out of the package's public surface.
