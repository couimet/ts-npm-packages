import { spyOnAttributeAdditions, withTestExecutionContext } from '../index';

import { getUniqueString } from '@couimet/dynamic-testing';
import { ExecutionContext } from '@couimet/execution-context';

describe('spyOnAttributeAdditions', () => {
  let addAttributes: ReturnType<typeof spyOnAttributeAdditions>;

  beforeEach(() => {
    addAttributes = spyOnAttributeAdditions();
  });

  it('records the attributes the code under test layers over the context', () => {
    const attributeValue = getUniqueString();

    withTestExecutionContext(undefined, () => ExecutionContext.withAttributes({ run_id: attributeValue }, () => undefined));

    expect(addAttributes).toHaveBeenCalledWith({ run_id: attributeValue });
  });

  it('records only the added attributes when the scope inherited others', () => {
    const inheritedValue = getUniqueString();
    const attributeValue = getUniqueString();

    withTestExecutionContext({ attributes: { version: inheritedValue }, correlationId: undefined, requestId: undefined }, () =>
      ExecutionContext.withAttributes({ run_id: attributeValue }, () => undefined),
    );

    expect(addAttributes).toHaveBeenCalledTimes(1);
    expect(addAttributes).toHaveBeenCalledWith({ run_id: attributeValue });
  });

  it('still adds the attributes to the active context', () => {
    const attributeValue = getUniqueString();

    const observed = withTestExecutionContext(undefined, () =>
      ExecutionContext.withAttributes({ run_id: attributeValue }, () => ExecutionContext.getAttributes()),
    );

    expect(observed).toStrictEqual({ run_id: attributeValue });
  });

  it('records nothing when the code under test adds no attribute', () => {
    withTestExecutionContext(undefined, () => undefined);

    expect(addAttributes).not.toHaveBeenCalled();
  });
});
