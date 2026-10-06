/**
 * One attribute an application puts in the execution context: the key it writes under, and an
 * optional rule that decides which values may enter.
 *
 * `isValid` is a type predicate, so a declaration that carries a rule also carries the type of its
 * value and a reader needs no annotation. A declaration that omits the rule accepts every value,
 * which is what an attribute holding a count or a flag needs.
 */
export interface ExecutionContextAttribute<T> {
  readonly key: string;
  readonly isValid?: (value: unknown) => value is T;
}

/**
 * The values for one registry, each typed by its own declaration's rule. A declaration without a
 * rule takes `unknown`, and a name the registry does not declare is a compile error at the call
 * site.
 */
export type ExecutionContextAttributeValues<R> = {
  readonly [K in keyof R]?: R[K] extends { isValid: (value: unknown) => value is infer T } ? T : unknown;
};
