import { ExecutionContext } from '../index';

import { BLANK_VALUE, WHITESPACE_VALUE } from './idTestValues';

import { getUniqueString } from '@couimet/dynamic-testing';
import { context } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';

describe('ExecutionContext', () => {
  let storedAttributes: Record<string, string>;
  let correlationId: string;
  let mergeAttributes: Record<string, string>;
  let otherCorrelationId: string;
  let otherRequestId: string;
  let requestId: string;
  let updatedVersion: string;

  beforeEach(() => {
    storedAttributes = { version: getUniqueString({ prefix: '1.0.0' }) };
    correlationId = getUniqueString({ prefix: 'correlation-1' });
    mergeAttributes = { feature: getUniqueString({ prefix: 'retrigger' }) };
    otherCorrelationId = getUniqueString({ prefix: 'correlation-2' });
    otherRequestId = getUniqueString({ prefix: 'request-2' });
    requestId = getUniqueString({ prefix: 'request-1' });
    updatedVersion = getUniqueString({ prefix: '2.0.0' });
  });

  it('fails fast when a global context manager is already registered', () => {
    const otherManager = new AsyncLocalStorageContextManager().enable();
    context.setGlobalContextManager(otherManager);

    expect(() => ExecutionContext.ensureContextManagerInitialized()).toThrowDetailedError('CONTEXT_MANAGER_REGISTRATION_FAILED', {
      message: 'a global context manager is already registered',
      functionName: 'ExecutionContext.ensureContextManagerInitialized',
      details: {},
    });
    expect(() => ExecutionContext.run({ correlationId, requestId }, () => {})).toThrowDetailedError('CONTEXT_MANAGER_REGISTRATION_FAILED', {
      message: 'a global context manager is already registered',
      functionName: 'ExecutionContext.ensureContextManagerInitialized',
      details: {},
    });

    context.disable();

    expect(() => ExecutionContext.ensureContextManagerInitialized()).not.toThrow();
  });

  it('throws when reading the ids outside any run', () => {
    expect(() => ExecutionContext.correlationId).toThrowDetailedError('NO_ACTIVE_CONTEXT', {
      message: 'execution context is not active',
      functionName: 'ExecutionContext.requireStore',
      details: {},
    });
    expect(() => ExecutionContext.requestId).toThrowDetailedError('NO_ACTIVE_CONTEXT', {
      message: 'execution context is not active',
      functionName: 'ExecutionContext.requireStore',
      details: {},
    });
  });

  it('exposes empty attributes outside any run', () => {
    expect(ExecutionContext.getAttribute('version')).toBeUndefined();
    expect(ExecutionContext.getAttributes()).toStrictEqual({});
  });

  it('reports inactive outside any run', () => {
    expect(ExecutionContext.isActive()).toBe(false);
  });

  it('reports active inside run', () => {
    ExecutionContext.run({ correlationId, requestId }, () => {
      expect(ExecutionContext.isActive()).toBe(true);
    });
  });

  it('ignores addAttributes outside any run', () => {
    ExecutionContext.addAttributes({ version: updatedVersion });

    expect(ExecutionContext.getAttributes()).toStrictEqual({});
  });

  it('runs the callback with the ids active', () => {
    ExecutionContext.run({ correlationId, requestId }, () => {
      expect(ExecutionContext.correlationId.toString()).toBe(correlationId);
      expect(ExecutionContext.requestId.toString()).toBe(requestId);
    });
  });

  it('propagates the context across await boundaries', async () => {
    await ExecutionContext.run({ correlationId, requestId }, async () => {
      await Promise.resolve();

      expect(ExecutionContext.correlationId.toString()).toBe(correlationId);
      expect(ExecutionContext.requestId.toString()).toBe(requestId);
    });
  });

  it('returns the callback result', () => {
    const result = ExecutionContext.run({ correlationId, requestId }, () => 'booted');

    expect(result).toBe('booted');
  });

  it('primes generated ids when run is given undefined ids', () => {
    ExecutionContext.run({ correlationId: undefined, requestId: undefined }, () => {
      expect(ExecutionContext.correlationId).toBeDefined();
      expect(ExecutionContext.requestId).toBeDefined();
    });
  });

  it('primes generated ids when run is given blank ids', () => {
    ExecutionContext.run({ correlationId: BLANK_VALUE, requestId: WHITESPACE_VALUE }, () => {
      expect(ExecutionContext.correlationId).toBeDefined();
      expect(ExecutionContext.requestId).toBeDefined();
    });
  });

  it('wipes any previously set context when run is called again', () => {
    ExecutionContext.run({ correlationId, requestId }, () => {
      ExecutionContext.run({ correlationId: otherCorrelationId, requestId: otherRequestId }, () => {
        expect(ExecutionContext.correlationId.toString()).toBe(otherCorrelationId);
        expect(ExecutionContext.requestId.toString()).toBe(otherRequestId);
      });
    });
  });

  it('restores the outer context after a nested run returns', () => {
    ExecutionContext.run({ correlationId, requestId }, () => {
      ExecutionContext.run({ correlationId: otherCorrelationId, requestId: otherRequestId }, () => {});

      expect(ExecutionContext.correlationId.toString()).toBe(correlationId);
      expect(ExecutionContext.requestId.toString()).toBe(requestId);
    });
  });

  it('restores the inactive state after run returns', () => {
    ExecutionContext.run({ correlationId, requestId }, () => {});

    expect(() => ExecutionContext.correlationId).toThrowDetailedError('NO_ACTIVE_CONTEXT', {
      message: 'execution context is not active',
      functionName: 'ExecutionContext.requireStore',
      details: {},
    });
  });

  it('stores the given attributes in the context', () => {
    ExecutionContext.run({ correlationId, requestId, attributes: storedAttributes }, () => {
      expect(ExecutionContext.getAttributes()).toStrictEqual(storedAttributes);
      expect(ExecutionContext.getAttribute('version')).toBe(storedAttributes.version);
    });
  });

  it('starts with empty attributes when none are given', () => {
    ExecutionContext.run({ correlationId, requestId }, () => {
      expect(ExecutionContext.getAttributes()).toStrictEqual({});
      expect(ExecutionContext.getAttribute('version')).toBeUndefined();
    });
  });

  it('merges attributes added to the current context', () => {
    ExecutionContext.run({ correlationId, requestId, attributes: storedAttributes }, () => {
      ExecutionContext.addAttributes(mergeAttributes);

      expect(ExecutionContext.getAttributes()).toStrictEqual({ ...storedAttributes, ...mergeAttributes });
    });
  });

  it('overwrites an existing attribute with the same key', () => {
    ExecutionContext.run({ correlationId, requestId, attributes: storedAttributes }, () => {
      ExecutionContext.addAttributes({ version: updatedVersion });

      expect(ExecutionContext.getAttributes()).toStrictEqual({ ...storedAttributes, version: updatedVersion });
    });
  });

  it('rejects null attributes from run', () => {
    expect(() => ExecutionContext.run({ correlationId, requestId, attributes: null as unknown as Record<string, unknown> }, () => {})).toThrowDetailedError(
      'INVALID_CONTEXT_ATTRIBUTES',
      {
        message: 'attributes must be a record of string keys to unknown values',
        functionName: 'ExecutionContext.run',
        details: {},
      },
    );
  });

  it('rejects array attributes from run', () => {
    expect(() =>
      ExecutionContext.run({ correlationId, requestId, attributes: ['value'] as unknown as Record<string, unknown> }, () => {}),
    ).toThrowDetailedError('INVALID_CONTEXT_ATTRIBUTES', {
      message: 'attributes must be a record of string keys to unknown values',
      functionName: 'ExecutionContext.run',
      details: {},
    });
  });

  it('rejects non-object attributes from run', () => {
    expect(() =>
      ExecutionContext.run({ correlationId, requestId, attributes: 'invalid' as unknown as Record<string, unknown> }, () => {}),
    ).toThrowDetailedError('INVALID_CONTEXT_ATTRIBUTES', {
      message: 'attributes must be a record of string keys to unknown values',
      functionName: 'ExecutionContext.run',
      details: {},
    });
  });

  it('rejects null attributes from addAttributes outside any run', () => {
    expect(() => ExecutionContext.addAttributes(null as unknown as Record<string, unknown>)).toThrowDetailedError('INVALID_CONTEXT_ATTRIBUTES', {
      message: 'attributes must be a record of string keys to unknown values',
      functionName: 'ExecutionContext.addAttributes',
      details: {},
    });
  });

  it('rejects array attributes from addAttributes outside any run', () => {
    expect(() => ExecutionContext.addAttributes(['value'] as unknown as Record<string, unknown>)).toThrowDetailedError('INVALID_CONTEXT_ATTRIBUTES', {
      message: 'attributes must be a record of string keys to unknown values',
      functionName: 'ExecutionContext.addAttributes',
      details: {},
    });
  });

  it('rejects non-object attributes from addAttributes outside any run', () => {
    expect(() => ExecutionContext.addAttributes('invalid' as unknown as Record<string, unknown>)).toThrowDetailedError('INVALID_CONTEXT_ATTRIBUTES', {
      message: 'attributes must be a record of string keys to unknown values',
      functionName: 'ExecutionContext.addAttributes',
      details: {},
    });
  });

  it('initializes the context manager once and stays safe on repeated calls', () => {
    ExecutionContext.ensureContextManagerInitialized();
    ExecutionContext.ensureContextManagerInitialized();

    ExecutionContext.run({ correlationId, requestId }, () => {
      expect(ExecutionContext.correlationId.toString()).toBe(correlationId);
    });
  });
});
