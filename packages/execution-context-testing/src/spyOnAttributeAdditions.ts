import { ExecutionContext } from '@couimet/execution-context';
import { jest } from '@jest/globals';

/**
 * Returns a spy on `ExecutionContext.addAttributes` that still calls through. A test therefore
 * asserts the exact attributes the code under test added, instead of reading the merged bag.
 *
 * The Jest configuration sets `restoreMocks`, so the spy goes away after each test and a test file
 * needs no cleanup block.
 */
export const spyOnAttributeAdditions = (): jest.SpiedFunction<typeof ExecutionContext.addAttributes> => jest.spyOn(ExecutionContext, 'addAttributes');
