import { ExecutionContext } from '../index';

import { ATTRIBUTE_REGISTRY } from './attributeTestValues';

import { getUniqueInt, getUniqueString } from '@couimet/dynamic-testing';

describe('ExecutionContext.findAttribute', () => {
  let correlationId: string;
  let requestId: string;

  beforeEach(() => {
    correlationId = getUniqueString();
    requestId = getUniqueString();
  });

  const runWith = <T>(attributes: Record<string, unknown>, fn: () => T): T => ExecutionContext.run({ correlationId, requestId, attributes }, fn);

  it('returns the value of a declaration that carries a rule', () => {
    const version = getUniqueString();

    const seen = runWith({ version }, () => ExecutionContext.findAttribute(ATTRIBUTE_REGISTRY.version));

    expect(seen).toBe(version);
  });

  it('returns the value of a declaration that carries no rule', () => {
    const attempt = getUniqueInt();

    const seen = runWith({ attempt }, () => ExecutionContext.findAttribute(ATTRIBUTE_REGISTRY.attempt));

    expect(seen).toBe(attempt);
  });

  it('returns the value of a raw key', () => {
    const version = getUniqueString();

    const seen = runWith({ version }, () => ExecutionContext.findAttribute('version'));

    expect(seen).toBe(version);
  });

  it('runs no rule for a raw key', () => {
    const blank = '   ';

    const seen = runWith({ version: blank }, () => ExecutionContext.findAttribute('version'));

    expect(seen).toBe(blank);
  });

  it('returns undefined when no writer set the declared attribute', () => {
    runWith({}, () => {
      expect(ExecutionContext.findAttribute(ATTRIBUTE_REGISTRY.version)).toBeUndefined();
    });
  });

  it('returns undefined when no writer set the raw key', () => {
    runWith({}, () => {
      expect(ExecutionContext.findAttribute('version')).toBeUndefined();
    });
  });

  it('reads an undefined value back when the declaration rule admits it', () => {
    runWith({ region: undefined }, () => {
      expect(ExecutionContext.findAttribute(ATTRIBUTE_REGISTRY.region)).toBeUndefined();
    });
  });

  it('reads an undefined value back from a raw key', () => {
    runWith({ region: undefined }, () => {
      expect(ExecutionContext.findAttribute('region')).toBeUndefined();
    });
  });

  it('throws when a declaration whose rule rejects undefined faces a stored undefined', () => {
    runWith({ version: undefined }, () => {
      expect(() => ExecutionContext.findAttribute(ATTRIBUTE_REGISTRY.version)).toThrowDetailedError('INVALID_ATTRIBUTE_VALUE', {
        message: 'Attribute value failed its validation rule',
        functionName: 'ExecutionContext.findAttribute',
        details: { key: 'version', value: undefined },
      });
    });
  });

  it('never reads a key inherited from the prototype', () => {
    runWith({ version: getUniqueString() }, () => {
      expect(ExecutionContext.findAttribute('toString')).toBeUndefined();
      expect(ExecutionContext.findAttribute('__proto__')).toBeUndefined();
    });
  });

  it('returns undefined outside any run', () => {
    expect(ExecutionContext.findAttribute(ATTRIBUTE_REGISTRY.version)).toBeUndefined();
    expect(ExecutionContext.findAttribute('version')).toBeUndefined();
  });

  it('throws when a present value fails its rule', () => {
    const blank = '   ';

    runWith({ version: blank }, () => {
      expect(() => ExecutionContext.findAttribute(ATTRIBUTE_REGISTRY.version)).toThrowDetailedError('INVALID_ATTRIBUTE_VALUE', {
        message: 'Attribute value failed its validation rule',
        functionName: 'ExecutionContext.findAttribute',
        details: { key: 'version', value: blank },
      });
    });
  });

  it('throws when a present value is not of the declared type', () => {
    const notAString = getUniqueInt();

    runWith({ version: notAString }, () => {
      expect(() => ExecutionContext.findAttribute(ATTRIBUTE_REGISTRY.version)).toThrowDetailedError('INVALID_ATTRIBUTE_VALUE', {
        message: 'Attribute value failed its validation rule',
        functionName: 'ExecutionContext.findAttribute',
        details: { key: 'version', value: notAString },
      });
    });
  });
});
