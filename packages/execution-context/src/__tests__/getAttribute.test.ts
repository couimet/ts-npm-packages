import { ExecutionContext } from '../index';

import { ATTRIBUTE_REGISTRY } from './attributeTestValues';

import { getUniqueInt, getUniqueString } from '@couimet/dynamic-testing';

describe('ExecutionContext.getAttribute', () => {
  let correlationId: string;
  let requestId: string;

  beforeEach(() => {
    correlationId = getUniqueString();
    requestId = getUniqueString();
  });

  const runWith = <T>(attributes: Record<string, unknown>, fn: () => T): T => ExecutionContext.run({ correlationId, requestId, attributes }, fn);

  it('returns the value of a declaration that carries a rule', () => {
    const runId = getUniqueString();

    const seen = runWith({ run_id: runId }, () => ExecutionContext.getAttribute(ATTRIBUTE_REGISTRY.runId));

    expect(seen).toBe(runId);
  });

  it('returns the value of a declaration that carries no rule', () => {
    const attempt = getUniqueInt();

    const seen = runWith({ attempt }, () => ExecutionContext.getAttribute(ATTRIBUTE_REGISTRY.attempt));

    expect(seen).toBe(attempt);
  });

  it('returns the value of a raw key', () => {
    const runId = getUniqueString();

    const seen = runWith({ run_id: runId }, () => ExecutionContext.getAttribute('run_id'));

    expect(seen).toBe(runId);
  });

  it('runs no rule for a raw key', () => {
    const blank = '   ';

    const seen = runWith({ run_id: blank }, () => ExecutionContext.getAttribute('run_id'));

    expect(seen).toBe(blank);
  });

  it('throws when no writer set the declared attribute', () => {
    runWith({}, () => {
      expect(() => ExecutionContext.getAttribute(ATTRIBUTE_REGISTRY.runId)).toThrowDetailedError('MISSING_CONTEXT_ATTRIBUTE', {
        message: 'Active execution context is missing the attribute',
        functionName: 'ExecutionContext.getAttribute',
        details: { key: 'run_id' },
      });
    });
  });

  it('throws when no writer set the raw key', () => {
    runWith({}, () => {
      expect(() => ExecutionContext.getAttribute('run_id')).toThrowDetailedError('MISSING_CONTEXT_ATTRIBUTE', {
        message: 'Active execution context is missing the attribute',
        functionName: 'ExecutionContext.getAttribute',
        details: { key: 'run_id' },
      });
    });
  });

  it('reads an undefined value back when the declaration rule admits it', () => {
    runWith({ region: undefined }, () => {
      expect(ExecutionContext.getAttribute(ATTRIBUTE_REGISTRY.region)).toBeUndefined();
    });
  });

  it('reads an undefined value back from a raw key', () => {
    runWith({ region: undefined }, () => {
      expect(ExecutionContext.getAttribute('region')).toBeUndefined();
    });
  });

  it('throws when a declaration whose rule rejects undefined faces a stored undefined', () => {
    runWith({ run_id: undefined }, () => {
      expect(() => ExecutionContext.getAttribute(ATTRIBUTE_REGISTRY.runId)).toThrowDetailedError('INVALID_ATTRIBUTE_VALUE', {
        message: 'Attribute value failed its validation rule',
        functionName: 'ExecutionContext.getAttribute',
        details: { key: 'run_id', value: undefined },
      });
    });
  });

  it('never reads a key inherited from the prototype', () => {
    runWith({ run_id: getUniqueString() }, () => {
      expect(() => ExecutionContext.getAttribute('toString')).toThrowDetailedError('MISSING_CONTEXT_ATTRIBUTE', {
        message: 'Active execution context is missing the attribute',
        functionName: 'ExecutionContext.getAttribute',
        details: { key: 'toString' },
      });
    });
  });

  it('throws when the value fails its rule', () => {
    const blank = '   ';

    runWith({ run_id: blank }, () => {
      expect(() => ExecutionContext.getAttribute(ATTRIBUTE_REGISTRY.runId)).toThrowDetailedError('INVALID_ATTRIBUTE_VALUE', {
        message: 'Attribute value failed its validation rule',
        functionName: 'ExecutionContext.getAttribute',
        details: { key: 'run_id', value: blank },
      });
    });
  });

  it('throws when the value is not of the declared type', () => {
    const notAString = getUniqueInt();

    runWith({ run_id: notAString }, () => {
      expect(() => ExecutionContext.getAttribute(ATTRIBUTE_REGISTRY.runId)).toThrowDetailedError('INVALID_ATTRIBUTE_VALUE', {
        message: 'Attribute value failed its validation rule',
        functionName: 'ExecutionContext.getAttribute',
        details: { key: 'run_id', value: notAString },
      });
    });
  });

  it('throws outside any run', () => {
    expect(() => ExecutionContext.getAttribute(ATTRIBUTE_REGISTRY.runId)).toThrowDetailedError('MISSING_CONTEXT_ATTRIBUTE', {
      message: 'Active execution context is missing the attribute',
      functionName: 'ExecutionContext.getAttribute',
      details: { key: 'run_id' },
    });
  });
});
