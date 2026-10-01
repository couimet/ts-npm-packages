import { CorrelationId } from './correlationId';
import { ExecutionContextAttribute, ExecutionContextAttributeValues } from './executionContextAttributes';
import { ExecutionContextErrorCodes } from './executionContextErrorCodes';
import { RequestId } from './requestId';

import { DetailedError } from '@couimet/detailed-error';
import { context, createContextKey } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';

export type ContextAttributes = Record<string, unknown>;

type ContextData = {
  correlationId: CorrelationId;
  requestId: RequestId;
  attributes: ContextAttributes;
};

export interface RunParams {
  readonly correlationId: string | undefined;
  readonly requestId: string | undefined;
  readonly attributes?: ContextAttributes;
}

const EXECUTION_CONTEXT_KEY = createContextKey('ExecutionContext');

// A read target is a declaration or a raw key, and this shape holds the two fields the read needs.
type AttributeTarget = {
  readonly key: string;
  readonly isValid: ((value: unknown) => boolean) | undefined;
};

// A stored attribute carries presence and value apart. A key a writer set to `undefined` is present,
// and a key no writer set is the only absent one, so the value alone cannot answer the read.
type StoredAttribute = {
  readonly present: boolean;
  readonly value: unknown;
};

function assertContextAttributes(attributes: unknown, functionName: string): void {
  if (attributes === undefined) {
    return;
  }

  const isRecord = attributes !== null && typeof attributes === 'object' && !Array.isArray(attributes);
  if (!isRecord) {
    throw new DetailedError({
      code: ExecutionContextErrorCodes.INVALID_CONTEXT_ATTRIBUTES,
      message: 'attributes must be a record of string keys to unknown values',
      functionName,
      details: {},
    });
  }
}

export class ExecutionContext {
  private static contextInitialized = false;

  /* istanbul ignore next */
  private constructor() {}

  /**
   * Installs the global context manager exactly once. Idempotent: later calls
   * are a no-op once installed. Throws when another component already owns the
   * global manager slot, because the package then cannot guarantee that async
   * work inherits the primed ids and failing loud beats silent loss of ids.
   */
  static ensureContextManagerInitialized(): void {
    if (ExecutionContext.contextInitialized) {
      return;
    }

    const manager = new AsyncLocalStorageContextManager().enable();
    const registered = context.setGlobalContextManager(manager);
    if (!registered) {
      manager.disable();
      throw new DetailedError({
        code: ExecutionContextErrorCodes.CONTEXT_MANAGER_REGISTRATION_FAILED,
        message: 'a global context manager is already registered',
        functionName: 'ExecutionContext.ensureContextManagerInitialized',
        details: {},
      });
    }

    ExecutionContext.contextInitialized = true;
  }

  private static getStore(): ContextData | undefined {
    return context.active().getValue(EXECUTION_CONTEXT_KEY) as ContextData | undefined;
  }

  /**
   * Primes the execution context; anything previously set gets wiped.
   * Call sites are the app bootstrap, middleware priming the context from a
   * request, and timer runs scoping a single execution.
   */
  static run<T>(data: RunParams, fn: () => T): T {
    this.ensureContextManagerInitialized();
    assertContextAttributes(data.attributes, 'ExecutionContext.run');

    const newContext: ContextData = {
      correlationId: CorrelationId.fromStringOrCreate(data.correlationId),
      requestId: RequestId.fromStringOrCreate(data.requestId),
      attributes: data.attributes ?? {},
    };

    const ctx = context.active().setValue(EXECUTION_CONTEXT_KEY, newContext);
    return context.with(ctx, fn);
  }

  static isActive(): boolean {
    return this.getStore() !== undefined;
  }

  // The ids are guaranteed when the context is active; a missing store is a programming error.
  private static requireStore(): ContextData {
    const store = this.getStore();
    if (store === undefined) {
      throw new DetailedError({
        code: ExecutionContextErrorCodes.NO_ACTIVE_CONTEXT,
        message: 'execution context is not active',
        functionName: 'ExecutionContext.requireStore',
        details: {},
      });
    }
    return store;
  }

  private static resolveAttribute(attribute: ExecutionContextAttribute<unknown> | string): AttributeTarget {
    return typeof attribute === 'string' ? { key: attribute, isValid: undefined } : { key: attribute.key, isValid: attribute.isValid };
  }

  private static readStoredAttribute(key: string): StoredAttribute {
    const attributes = this.getStore()?.attributes;
    if (attributes === undefined || !Object.prototype.hasOwnProperty.call(attributes, key)) {
      return { present: false, value: undefined };
    }

    return { present: true, value: attributes[key] };
  }

  private static assertAttributeRule(key: string, value: unknown, isValid: ((value: unknown) => boolean) | undefined, functionName: string): void {
    if (isValid !== undefined && !isValid(value)) {
      throw new DetailedError({
        code: ExecutionContextErrorCodes.INVALID_ATTRIBUTE_VALUE,
        message: 'Attribute value failed its validation rule',
        functionName,
        details: { key, value },
      });
    }
  }

  static get correlationId(): CorrelationId {
    return this.requireStore().correlationId;
  }

  static get requestId(): RequestId {
    return this.requireStore().requestId;
  }

  /**
   * Reads an attribute from the active execution context, and throws instead of returning `undefined`
   * when no writer set the key, so a mistyped or unscoped read fails at the first call.
   *
   * A declaration that carries a rule verifies the value before the return, and the rule alone decides
   * whether `undefined` is a legal value for that attribute. A declaration that omits the rule returns
   * the type the caller writes, and the call trusts the value. A raw key runs no rule at all, so its
   * result stays `unknown`: no type parameter appears in that signature, so an expected type cannot
   * flow back into the call and narrow it silently.
   */
  static getAttribute<T>(attribute: ExecutionContextAttribute<T>): T;
  static getAttribute(key: string): unknown;
  static getAttribute(attribute: ExecutionContextAttribute<unknown> | string): unknown {
    const { key, isValid } = this.resolveAttribute(attribute);
    const { present, value } = this.readStoredAttribute(key);

    if (!present) {
      throw new DetailedError({
        code: ExecutionContextErrorCodes.MISSING_CONTEXT_ATTRIBUTE,
        message: 'Active execution context is missing the attribute',
        functionName: 'ExecutionContext.getAttribute',
        details: { key },
      });
    }

    this.assertAttributeRule(key, value, isValid, 'ExecutionContext.getAttribute');
    return value;
  }

  /**
   * Reads an attribute from the active execution context, and returns `undefined` when no writer set
   * the key or no context is active. Use it where an absent key is an expected outcome.
   *
   * This method accepts the same two forms as `getAttribute`, and verifies a declaration's rule
   * whenever a writer set the key. Only an absent key skips the rule, so a stored value that breaks
   * its rule throws here rather than passing as absent. A caller that carries a declaration also
   * carries the type of an optional result.
   */
  static findAttribute<T>(attribute: ExecutionContextAttribute<T>): T | undefined;
  static findAttribute(key: string): unknown;
  static findAttribute(attribute: ExecutionContextAttribute<unknown> | string): unknown {
    const { key, isValid } = this.resolveAttribute(attribute);
    const { present, value } = this.readStoredAttribute(key);

    if (present) {
      this.assertAttributeRule(key, value, isValid, 'ExecutionContext.findAttribute');
    }

    return value;
  }

  static addAttributes(attrs: ContextAttributes): void {
    assertContextAttributes(attrs, 'ExecutionContext.addAttributes');

    const store = this.getStore();
    if (!store) return;

    store.attributes = {
      ...store.attributes,
      ...attrs,
    };
  }

  static getAttributes(): ContextAttributes {
    return this.getStore()?.attributes ?? {};
  }

  /**
   * Layers `attrs` over the active execution context for the duration of `fn`, then removes them: the
   * surrounding context holds its own attributes again once `fn` settles, whether it returned or threw.
   *
   * The ids are read before the child scope opens, so the block keeps the ids it inherited. Work that
   * starts inside the block and finishes after it keeps the layered attributes, because that is what
   * an async context means. An attribute the block sets itself dies with the block, and that rule
   * covers a collision with a key layered here too. A caller that needs an attribute to outlive the
   * block sets it outside the block. This method throws `NO_ACTIVE_CONTEXT` outside any run, and
   * `INVALID_CONTEXT_ATTRIBUTES` when `attrs` is not a record of string keys.
   *
   * This method checks the shape of `attrs`, not its values. A caller that writes declared attributes
   * builds the bag with `validateAttributes`, so a value that fails its rule never reaches this call.
   */
  static withAttributes<T>(attrs: ContextAttributes, fn: () => T): T {
    return this.run(
      {
        correlationId: this.correlationId.toString(),
        requestId: this.requestId.toString(),
        attributes: { ...this.getAttributes() },
      },
      () => {
        // addAttributes carries the package's own parameter check, which a spread of the merged bag
        // would bypass, and it writes only into the store this call created.
        this.addAttributes(attrs);
        return fn();
      },
    );
  }

  /**
   * Builds the context bag for `entries`, and checks every value against its own declaration's rule
   * before any of them is written. A blank value therefore fails in the frame that produced it, and no
   * value from a rejected set reaches the store.
   *
   * The entries are keyed by declaration name, not by context key, so the registry is the only place a
   * context key appears. The mapped type then stops two caller mistakes at compile time: a value of
   * the wrong type, and a name the registry does not declare. Two entries for one attribute cannot
   * exist either, because an object literal cannot repeat a property.
   */
  static validateAttributes<R extends Record<string, ExecutionContextAttribute<unknown>>>(
    registry: R,
    entries: ExecutionContextAttributeValues<R>,
  ): ContextAttributes {
    const attrs: ContextAttributes = {};
    // Every key of a registry holds a declaration, so the lookup cannot miss. The mapped type states
    // that fact, and `noUncheckedIndexedAccess` does not widen a mapped type the way it widens an
    // index signature.
    const declarations = registry as Record<keyof R, ExecutionContextAttribute<unknown>>;

    for (const name of Object.keys(entries) as Array<keyof R>) {
      const attribute = declarations[name];
      const value = entries[name];

      this.assertAttributeRule(attribute.key, value, attribute.isValid, 'ExecutionContext.validateAttributes');
      attrs[attribute.key] = value;
    }

    return attrs;
  }
}
