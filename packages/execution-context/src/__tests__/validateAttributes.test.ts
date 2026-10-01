import { ExecutionContext } from '../index';

import { ATTRIBUTE_REGISTRY } from './attributeTestValues';

import { getUniqueInt, getUniqueString } from '@couimet/dynamic-testing';

describe('ExecutionContext.validateAttributes', () => {
  it('maps every entry to the key its declaration carries', () => {
    const runId = getUniqueString();
    const version = getUniqueString();

    const attrs = ExecutionContext.validateAttributes(ATTRIBUTE_REGISTRY, { runId, version });

    expect(attrs).toStrictEqual({ run_id: runId, version });
  });

  it('omits a declared attribute the caller passes no entry for', () => {
    const runId = getUniqueString();

    const attrs = ExecutionContext.validateAttributes(ATTRIBUTE_REGISTRY, { runId });

    expect(attrs).toStrictEqual({ run_id: runId });
  });

  it('accepts any value for a declaration that carries no rule', () => {
    const attempt = getUniqueInt();

    const attrs = ExecutionContext.validateAttributes(ATTRIBUTE_REGISTRY, { attempt });

    expect(attrs).toStrictEqual({ attempt });
  });

  it('accepts an undefined entry when the declaration rule admits it', () => {
    const attrs = ExecutionContext.validateAttributes(ATTRIBUTE_REGISTRY, { region: undefined });

    expect(attrs).toStrictEqual({ region: undefined });
  });

  it('returns an empty bag when the caller passes no entry', () => {
    const attrs = ExecutionContext.validateAttributes(ATTRIBUTE_REGISTRY, {});

    expect(attrs).toStrictEqual({});
  });

  it('throws when a value fails its rule', () => {
    const blankVersion = '   ';

    expect(() => ExecutionContext.validateAttributes(ATTRIBUTE_REGISTRY, { version: blankVersion })).toThrowDetailedError('INVALID_ATTRIBUTE_VALUE', {
      message: 'Attribute value failed its validation rule',
      functionName: 'ExecutionContext.validateAttributes',
      details: { key: 'version', value: blankVersion },
    });
  });
});
