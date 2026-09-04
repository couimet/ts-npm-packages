import { CorrelationId } from './correlationId';
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

  static get correlationId(): CorrelationId {
    return this.requireStore().correlationId;
  }

  static get requestId(): RequestId {
    return this.requireStore().requestId;
  }

  static getAttribute(key: string): unknown {
    return this.getStore()?.attributes?.[key];
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
}
