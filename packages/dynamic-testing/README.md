# @couimet/dynamic-testing

Dynamic testing utilities for TypeScript tests. See also: [Dynamic Testing](https://www.guru99.com/dynamic-testing.html).

`@couimet/dynamic-testing` helps you write tests that surface bugs through controlled non-determinism. Instead of hard-coding static values, you request unique or random values from the library. Set `DYNAMIC_TESTING_COUNTER_START` to control where the counter begins and make runs reproducible.

## How it works

The library has two generation modes, both driven by a single counter:

**Counter-based (`getUnique*`)** — increments a module-level counter (`UNIQUE_NUMBER++`) on every call. The counter starts at `DYNAMIC_TESTING_COUNTER_START` (or 1 if unset) and guarantees every returned value is different and truthy (never zero). Because the counter is shared, you can trace values back to the counter in test output — if you see `getUniqueInt()` return 42, you know 41 calls happened before it.

**Random (`getRandom*`)** — returns a non-deterministic value each call. Ideal for enums, booleans, and range-based integers.

```typescript
import { getRandomEnumValue, getRandomString, getUniqueFloat, getUniqueInt } from '@couimet/dynamic-testing';

// Counter-based: always unique, always truthy
const id = getUniqueInt(); // 1
const amount = getUniqueFloat(); // e.g. 2.58
const email = getUniqueInt(); // 3

// Random picks
enum Status {
  Active,
  Inactive,
  Pending,
}
const status = getRandomEnumValue(Status); // random enum value
const status2 = getRandomEnumValue(Status, Status.Inactive); // random, excludes Inactive
const flag = getRandomBoolean(); // true or false
const age = getRandomInt(18, 65); // [18, 65] inclusive
const code = getRandomString({ length: 10, prefix: 'USR-' });
```

## Reproducibility

Set the `DYNAMIC_TESTING_COUNTER_START` environment variable to a positive integer to control where the counter starts:

```bash
DYNAMIC_TESTING_COUNTER_START=42 jest
```

When `DYNAMIC_TESTING_COUNTER_START` is not set (or is not a valid positive integer), the counter defaults to 1. Values above 1,000,000 are replaced with the cap to keep starting values within a readable range. The counter itself continues past 1M as tests run.

## API reference

### Counter-based values (`getUnique*`)

The counter (`UNIQUE_NUMBER++`) is the foundation. Every call increments it. Values are guaranteed unique and truthy (never zero).

```typescript
getUniqueInt(): number
getUniqueInts(count: number): number[]
getUniqueIntsNamed<K extends string>(keys: readonly K[]): Record<K, number>
getUniqueFloat(precision?: number): number       // default precision 2 → e.g. 1.58, 2.91
getUniqueBigDecimal(precision?: number): string  // default precision 2 → e.g. "1.58", "2.91"
getUniqueTimestamp(): number                      // 1-minute increments from module load
getUniqueDate(): Date
getUniqueDates(count: number): Date[]
getUniqueDatesNamed<K extends string>(keys: readonly K[]): Record<K, Date>
```

`getUniqueFloat` and `getUniqueBigDecimal` combine a counter-derived integer with a random decimal part. The decimal never ends with zero to avoid `parseFloat` truncation. `precision` controls the number of decimal places (default 2, max 30).

Timestamps are anchored to `Date.now()` at module load and increment by 60,000ms (1 minute) per call. This makes diffs in human-readable dates obvious.

Batch wrappers (`getUniqueInts`, `getUniqueIntsNamed`, `getUniqueDates`, `getUniqueDatesNamed`) generate multiple unique values in a single call. `*Named` variants accept an array of string keys and return a matching `Record`. Empty `keys` arrays throw; `count` must be a positive integer.

### Seeded-random values (`getRandom*`)

```typescript
getEnumValues<T>(enumClass: T, ...excluded: T[keyof T][]): T[keyof T][]
getRandomEnumValue<T>(enumClass: T, ...excluded: T[keyof T][]): T[keyof T]
getRandomBoolean(trueProbability?: number): boolean  // default 0.5
getRandomInt(min: number, max: number): number       // [min, max] inclusive
```

`getRandomInt` is inclusive on both boundaries — `getRandomInt(1, 3)` can return 1, 2, or 3.

### Strings

```typescript
getRandomString(options?: StringOptions): string
getRandomAlphaString(length?: number): string
getRandomNumericString(length?: number): string
getRandomHexString(length?: number): string
getUniqueString(options?: UniqueStringOptions): string
```

`getUniqueString` guarantees uniqueness by appending the counter to a random prefix. The prefix is 8 characters unless `maxLength` constrains it. When `maxLength` is set the prefix is truncated to make room. If `maxLength` is too short even for the counter alone, the result is purely random and uniqueness is not guaranteed.

`StringOptions` (for `getRandomString`):

| Option    | Type                                                        | Default          | Description                               |
| --------- | ----------------------------------------------------------- | ---------------- | ----------------------------------------- |
| `length`  | `number`                                                    | `8`              | Length of the random portion              |
| `charset` | `'alpha' \| 'numeric' \| 'alphanumeric' \| 'hex' \| string` | `'alphanumeric'` | Characters to pick from                   |
| `prefix`  | `string`                                                    | `''`             | Prepended without consuming length budget |

`UniqueStringOptions` (for `getUniqueString`):

| Option      | Type                                                        | Default          | Description                                                                           |
| ----------- | ----------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------- |
| `maxLength` | `number`                                                    | —                | Max total length. When set too short to fit the counter, uniqueness is not guaranteed |
| `charset`   | `'alpha' \| 'numeric' \| 'alphanumeric' \| 'hex' \| string` | `'alphanumeric'` | Characters for the random prefix                                                      |
| `prefix`    | `string`                                                    | `''`             | Prepended without consuming length budget                                             |

### Decimal.js integration (optional)

`getUniqueDecimal()` returns a `Decimal` instance from [decimal.js](https://www.npmjs.com/package/decimal.js). Install `decimal.js` as a dependency to use it.

```typescript
import { getUniqueDecimal } from '@couimet/dynamic-testing';

const price = getUniqueDecimal(2); // Decimal instance: e.g. 1.58
price.plus(10).toNumber(); // e.g. 11.58
```

Throws `'Install decimal.js to use getUniqueDecimal()'` if `decimal.js` is not installed.

### SCM references

Generate unique, recognizable SCM (source control) identifiers for tests that exercise repository logic. All values are unique per call (counter-based) and bear a human-readable prefix for quick debugging.

**GitHub-specific** — always produce GitHub-style values:

```typescript
getUniqueGitHubOwner(): string           // e.g. gh-owner-aBcDeF-1
getUniqueGitHubRepo(): string            // e.g. gh-repo-xYzAbC-2
getUniqueGitHubRepoRef(): UniqueRepoRef  // { owner, repo, fullName }
```

`UniqueRepoRef` carries the owner, repo, and `owner/repo` full name:

```typescript
interface UniqueRepoRef {
  owner: string;
  repo: string;
  fullName: string;
}
```

**GitLab-specific** — always produce GitLab-style values:

```typescript
getUniqueGitLabNamespace(): string            // e.g. gl-namespace-aBcDeF-3
getUniqueGitLabProject(): string              // e.g. gl-project-xYzAbC-4
getUniqueGitLabProjectRef(): UniqueProjectRef // { namespace, project, fullName }
```

`UniqueProjectRef` carries the namespace, project, and `namespace/project` full name:

```typescript
interface UniqueProjectRef {
  namespace: string;
  project: string;
  fullName: string;
}
```

**Generic aliases** — portable across SCMs via `configure()`. Default to GitHub; switch to GitLab with `configure({ scm: 'gitlab' })`.

```typescript
getUniqueRepoOwner(): string          // delegates to GitHub owner or GitLab namespace
getUniqueRepo(): string               // delegates to GitHub repo or GitLab project
getUniqueRepoRef(): UniqueRepoRef     // always returns UniqueRepoRef
```

The generic aliases always return `UniqueRepoRef` (owner / repo / fullName). When `scm` is set to `'gitlab'`, `owner` holds the GitLab namespace and `repo` holds the GitLab project. This lingua franca keeps test code portable across SCMs without type-level branching.

**Prefix convention.** Values use short prefix tokens so you can identify the SCM and function at a glance:

| Prefix          | SCM    | Example value           |
| --------------- | ------ | ----------------------- |
| `gh-owner-`     | GitHub | `gh-owner-aBcDeF-1`     |
| `gh-repo-`      | GitHub | `gh-repo-xYzAbC-2`      |
| `gl-namespace-` | GitLab | `gl-namespace-aBcDeF-3` |
| `gl-project-`   | GitLab | `gl-project-xYzAbC-4`   |

**Configuration** (typically in `jest.setup.js` or a test setup file):

```typescript
import { configure } from '@couimet/dynamic-testing';

// Use GitLab-style identifiers everywhere via the generic aliases
configure({ scm: 'gitlab' });
```

### UUID generation

```typescript
getUuid(): string       // UUID v4, delegates to getUuidV4()
getUuidV4(): string     // UUID v4 via the `uuid` package
```

Both return a standard UUID v4 string (e.g. `"550e8400-e29b-41d4-a716-446655440000"`). `getUuid()` is the concise form; use `getUuidV4()` when you want the version to be explicit in the call site.

## Quick start

```bash
pnpm add @couimet/dynamic-testing
```

```typescript
import { getUniqueInt, getRandomString } from '@couimet/dynamic-testing';

it('creates a user', () => {
  const id = getUniqueInt();
  const name = getRandomString({ length: 12, prefix: 'user-' });
  // id is always different, name is non-deterministic
});
```
