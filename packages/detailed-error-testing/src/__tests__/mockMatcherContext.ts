import type { MatcherThis } from '../internal/MatcherThis';

const utils = jest.requireActual('jest-matcher-utils');

/**
 * Build a minimal `MatcherThis` suitable for unit-testing matchers that
 * consume `this.utils` and `this.equals`.  Uses the real `equals` from
 * `@jest/expect-utils` so test behavior matches runtime exactly.
 *
 * The `overrides` bag lets callers set `isNot: true` for negation tests,
 * or replace any individual piece.
 */
export function createMockMatcherContext(overrides?: Partial<MatcherThis>): MatcherThis {
  return {
    isNot: overrides?.isNot ?? false,
    equals: overrides?.equals ?? jest.requireActual('@jest/expect-utils').equals,
    utils: {
      matcherHint: utils.matcherHint,
      printExpected: utils.printExpected,
      printReceived: utils.printReceived,
      printWithType: utils.printWithType,
      stringify: utils.stringify,
      ...overrides?.utils,
    },
  };
}
