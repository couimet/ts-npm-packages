import { DetailedError, type ErrorDetails, type ErrorOptions, SharedErrorCodes } from '../index';

import { toBeDetailedError } from '@couimet/detailed-error-testing';

expect.extend({ toBeDetailedError });

describe('DetailedError with string codes', () => {
  it('constructs with all fields', () => {
    const root = new Error('root cause');
    const err = new DetailedError({
      code: 'TEST_CODE',
      message: 'Something went wrong',
      functionName: 'doStuff',
      details: { key: 'value' },
      cause: root,
    });

    expect(err).toBeDetailedError('TEST_CODE', {
      message: 'Something went wrong',
      functionName: 'doStuff',
      details: { key: 'value' },
      cause: root,
    });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(DetailedError);
  });

  it('constructs with only required fields', () => {
    const err = new DetailedError({
      code: 'MINIMAL',
      message: 'Just the essentials',
    });

    expect(err).toBeDetailedError('MINIMAL', {
      message: 'Just the essentials',
    });
  });

  it('is instanceof Error and DetailedError', () => {
    const err = new DetailedError({ code: 'X', message: 'msg' });

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(DetailedError);
  });

  it('exposes cause in the error-cause chain', () => {
    const root = new Error('root');
    const err = new DetailedError({ code: 'WRAPPED', message: 'wrapper', cause: root });

    expect(err).toBeDetailedError('WRAPPED', {
      message: 'wrapper',
      cause: root,
    });
    expect(err.cause).toBe(root);
  });

  it('does not set cause when cause is undefined', () => {
    const err = new DetailedError({ code: 'NO_CAUSE', message: 'no cause here' });

    expect(err).toBeDetailedError('NO_CAUSE', {
      message: 'no cause here',
    });
  });

  it('details is a defensive deep copy — mutating a nested object does not affect the error', () => {
    const original = { nested: { key: 'original' } };
    const err = new DetailedError({ code: 'X', message: 'msg', details: original });

    (original.nested as Record<string, unknown>).key = 'mutated';
    (original as Record<string, unknown>).extra = 'added';

    expect(err).toBeDetailedError('X', {
      message: 'msg',
      details: { nested: { key: 'original' } },
    });
  });

  it('details is not the same object reference as the input', () => {
    const original = { key: 'value' };
    const err = new DetailedError({ code: 'X', message: 'msg', details: original });

    expect(err).toBeDetailedError('X', {
      message: 'msg',
      details: { key: 'value' },
    });
    expect(err.details).not.toBe(original);
  });

  it('deep-clones circular references without throwing', () => {
    const circular: Record<string, unknown> = { key: 'value' };
    circular.self = circular;

    const err = new DetailedError({ code: 'CIRCULAR', message: 'circular details', details: circular });

    const expectedDetails: Record<string, unknown> = { key: 'value' };
    expectedDetails.self = expectedDetails;

    expect(err).toBeDetailedError('CIRCULAR', {
      message: 'circular details',
      details: expectedDetails,
    });
    expect(err.details).not.toBe(circular);
    // Original circular still references itself, not the clone
    circular.key = 'mutated';
    expect((err.details as Record<string, unknown>).key).toBe('value');
  });

  it('handles details with arrays and nested objects via deep clone', () => {
    const original = { items: [{ id: 1 }, { id: 2 }] };
    const err = new DetailedError({ code: 'X', message: 'msg', details: original });

    (original.items[0] as Record<string, unknown>).id = 99;
    original.items.push({ id: 3 });

    expect(err).toBeDetailedError('X', {
      message: 'msg',
      details: { items: [{ id: 1 }, { id: 2 }] },
    });
  });

  it('is catchable via instanceof DetailedError', () => {
    const thrown = new DetailedError({ code: 'BOOM', message: 'it blew up' });

    try {
      throw thrown;
    } catch (err) {
      expect(err).toBeDetailedError('BOOM', {
        message: 'it blew up',
      });
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(DetailedError);
    }
  });

  describe('forUnexpectedSwitchDefault', () => {
    it('constructs with default message from label and value', () => {
      const err = DetailedError.forUnexpectedSwitchDefault('state', 'invalid', 'doWork');

      expect(err).toBeDetailedError('UNEXPECTED_CODE_PATH', {
        message: 'Unexpected state: "invalid"',
        functionName: 'doWork',
        details: { unexpectedValue: 'invalid' },
      });
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(DetailedError);
    });

    it('uses custom message when provided', () => {
      const err = DetailedError.forUnexpectedSwitchDefault('poll outcome', 'stale', 'PollDetector.handle', {
        message: 'Poll returned unrecognized status',
      });

      expect(err).toBeDetailedError('UNEXPECTED_CODE_PATH', {
        message: 'Poll returned unrecognized status',
        functionName: 'PollDetector.handle',
        details: { unexpectedValue: 'stale' },
      });
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(DetailedError);
    });

    it('uses custom code from options when provided', () => {
      const err = DetailedError.forUnexpectedSwitchDefault('mode', 'unknown', 'switchMode', {
        code: 'MY_CUSTOM_CODE',
      });

      expect(err).toBeDetailedError('MY_CUSTOM_CODE', {
        message: 'Unexpected mode: "unknown"',
        functionName: 'switchMode',
        details: { unexpectedValue: 'unknown' },
      });
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(DetailedError);
    });

    it('includes extraDetails alongside unexpectedValue', () => {
      const err = DetailedError.forUnexpectedSwitchDefault('type', 'unknown', 'parse', {
        extraDetails: { context: 'deserialization', inputId: 42 },
      });

      expect(err).toBeDetailedError('UNEXPECTED_CODE_PATH', {
        message: 'Unexpected type: "unknown"',
        functionName: 'parse',
        details: { context: 'deserialization', inputId: 42, unexpectedValue: 'unknown' },
      });
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(DetailedError);
    });

    it('explicit unexpectedValue in extraDetails is overwritten by the value argument', () => {
      const err = DetailedError.forUnexpectedSwitchDefault('type', 'actual', 'parse', {
        extraDetails: { unexpectedValue: 'stale' },
      });

      expect(err).toBeDetailedError('UNEXPECTED_CODE_PATH', {
        message: 'Unexpected type: "actual"',
        functionName: 'parse',
        details: { unexpectedValue: 'actual' },
      });
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(DetailedError);
    });

    it('handles null value', () => {
      const err = DetailedError.forUnexpectedSwitchDefault('result', null, 'fetchData');

      expect(err).toBeDetailedError('UNEXPECTED_CODE_PATH', {
        message: 'Unexpected result: null',
        functionName: 'fetchData',
        details: { unexpectedValue: null },
      });
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(DetailedError);
    });

    it('handles undefined value', () => {
      const err = DetailedError.forUnexpectedSwitchDefault('result', undefined, 'fetchData');

      expect(err).toBeDetailedError('UNEXPECTED_CODE_PATH', {
        message: 'Unexpected result: undefined',
        functionName: 'fetchData',
        details: { unexpectedValue: undefined },
      });
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(DetailedError);
    });

    it('error name is Error (DetailedError does not set a custom name)', () => {
      const err = DetailedError.forUnexpectedSwitchDefault('key', 'bad', 'validate');

      expect(err).toBeDetailedError('UNEXPECTED_CODE_PATH', {
        message: 'Unexpected key: "bad"',
        functionName: 'validate',
        details: { unexpectedValue: 'bad' },
      });
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(DetailedError);
      expect(err.name).toBe('Error');
    });
  });
});

describe('DetailedError with enum codes', () => {
  enum ProjectCodes {
    BAD_INPUT = 'BAD_INPUT',
    TIMEOUT = 'TIMEOUT',
  }

  // Merged enum pattern (see SharedErrorCodes JSDoc)
  const Codes = { ...ProjectCodes, ...SharedErrorCodes };
  type Codes = ProjectCodes | SharedErrorCodes;

  class ProjectError extends DetailedError<Codes> {
    constructor(options: ErrorOptions<Codes>) {
      super(options);
      this.name = 'ProjectError';
    }
  }

  it('accepts a project-specific enum value', () => {
    const err = new ProjectError({ code: ProjectCodes.BAD_INPUT, message: 'bad input' });

    expect(err).toBeDetailedError('BAD_INPUT', {
      message: 'bad input',
    });
    expect(err).toBeInstanceOf(ProjectError);
    expect(err).toBeInstanceOf(DetailedError);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ProjectError');
  });

  it('accepts a shared error code', () => {
    const err = new ProjectError({ code: SharedErrorCodes.VALIDATION, message: 'invalid' });

    expect(err).toBeDetailedError('VALIDATION', {
      message: 'invalid',
    });
    expect(err).toBeInstanceOf(ProjectError);
  });

  it('is catchable via instanceof guard with else re-throw', () => {
    const thrown = new ProjectError({ code: ProjectCodes.TIMEOUT, message: 'timed out' });

    let caught = false;
    try {
      throw thrown;
    } catch (err) {
      if (err instanceof ProjectError) {
        caught = true;
        expect(err).toBeDetailedError('TIMEOUT', {
          message: 'timed out',
        });
      } else {
        throw err;
      }
    }
    expect(caught).toBe(true);
  });

  it('a thrown ProjectError is also catchable via instanceof DetailedError', () => {
    const thrown = new ProjectError({ code: ProjectCodes.BAD_INPUT, message: 'bad' });

    try {
      throw thrown;
    } catch (err) {
      expect(err).toBeDetailedError('BAD_INPUT', {
        message: 'bad',
      });
      expect(err).toBeInstanceOf(DetailedError);
      expect(err).toBeInstanceOf(Error);
    }
  });

  it('generics keep code type narrow when constructed with an enum value', () => {
    const err = new DetailedError({
      code: SharedErrorCodes.UNKNOWN,
      message: 'Something unexpected',
    });

    const code: SharedErrorCodes = err.code;
    expect(err).toBeDetailedError(code, {
      message: 'Something unexpected',
    });
  });

  describe('forUnexpectedSwitchDefault', () => {
    it('returns a ProjectError instance when called on the subclass', () => {
      const err = ProjectError.forUnexpectedSwitchDefault('state column', 'invalid', 'SystemStateRepositoryImpl.setState');

      expect(err).toBeDetailedError('UNEXPECTED_CODE_PATH', {
        message: 'Unexpected state column: "invalid"',
        functionName: 'SystemStateRepositoryImpl.setState',
        details: { unexpectedValue: 'invalid' },
      });
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(DetailedError);
      expect(err).toBeInstanceOf(ProjectError);
    });

    it('sets the error name to the subclass name', () => {
      const err = ProjectError.forUnexpectedSwitchDefault('key', 'bad', 'validate');

      expect(err).toBeDetailedError('UNEXPECTED_CODE_PATH', {
        message: 'Unexpected key: "bad"',
        functionName: 'validate',
        details: { unexpectedValue: 'bad' },
      });
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(DetailedError);
      expect(err).toBeInstanceOf(ProjectError);
      expect(err.name).toBe('ProjectError');
    });

    it('accepts a project-specific enum value as the code override', () => {
      const err = ProjectError.forUnexpectedSwitchDefault('mode', 'unknown', 'switchMode', {
        code: ProjectCodes.BAD_INPUT,
      });

      expect(err).toBeDetailedError('BAD_INPUT', {
        message: 'Unexpected mode: "unknown"',
        functionName: 'switchMode',
        details: { unexpectedValue: 'unknown' },
      });
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(DetailedError);
      expect(err).toBeInstanceOf(ProjectError);
    });

    it('accepts a shared error code as the code override', () => {
      const err = ProjectError.forUnexpectedSwitchDefault('mode', 'unknown', 'switchMode', {
        code: SharedErrorCodes.VALIDATION,
      });

      expect(err).toBeDetailedError('VALIDATION', {
        message: 'Unexpected mode: "unknown"',
        functionName: 'switchMode',
        details: { unexpectedValue: 'unknown' },
      });
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(DetailedError);
      expect(err).toBeInstanceOf(ProjectError);
    });
  });
});

describe('DetailedError constructor validation', () => {
  it('throws when errorOptions is not an object', () => {
    expect(() => new DetailedError(undefined as unknown as ErrorOptions<string>)).toThrow(TypeError);
    expect(() => new DetailedError(null as unknown as ErrorOptions<string>)).toThrow(TypeError);
  });

  it('throws when code is not a string', () => {
    expect(() => new DetailedError({ code: 123 as unknown as string, message: 'x' })).toThrow(TypeError);
  });

  it('throws when message is not a string', () => {
    expect(() => new DetailedError({ code: 'X', message: 123 as unknown as string })).toThrow(TypeError);
  });

  it('throws when functionName is provided but not a string', () => {
    expect(() => new DetailedError({ code: 'X', message: 'x', functionName: 123 as unknown as string })).toThrow(TypeError);
  });

  it('throws when details is provided but not an object', () => {
    expect(() => new DetailedError({ code: 'X', message: 'x', details: 'not-an-object' as unknown as ErrorDetails })).toThrow(TypeError);
    expect(() => new DetailedError({ code: 'X', message: 'x', details: null as unknown as ErrorDetails })).toThrow(TypeError);
  });

  it('does not throw when optional fields are omitted', () => {
    expect(() => new DetailedError({ code: 'X', message: 'x' })).not.toThrow();
  });
});

describe('DetailedError deep clone fallback', () => {
  it('clones details containing a function via the WeakMap fallback', () => {
    const fn = (): string => 'hello';
    const circular: Record<string, unknown> = { key: 'value' };
    circular.self = circular;
    const details = { fn, circular, items: [{ id: 1 }, { id: 2 }], key: 'value' };
    const err = new DetailedError({ code: 'ERR', message: 'msg', details });

    const expectedCircular: Record<string, unknown> = { key: 'value' };
    expectedCircular.self = expectedCircular;

    expect(err).toBeDetailedError('ERR', {
      message: 'msg',
      details: { fn, circular: expectedCircular, items: [{ id: 1 }, { id: 2 }], key: 'value' },
    });
    expect((err.details as Record<string, unknown>).fn).toBe(fn);
    // Mutating the original should not affect the clone
    (details.items[0] as Record<string, unknown>).id = 99;
    const clonedItems = (err.details as Record<string, unknown>).items as Array<Record<string, unknown>>;
    expect(clonedItems[0]!.id).toBe(1);
  });
});

describe('DetailedError stack trace', () => {
  it('stack trace does not include the DetailedError constructor', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg' });

    expect(err.stack).toBeDefined();
    // The constructor frame should be trimmed so the stack points to the call site (this test).
    expect(err.stack).not.toContain('DetailedError.ts');
  });

  it('stack trace does not include the subclass constructor', () => {
    class SubError extends DetailedError<string> {
      constructor(code: string, message: string) {
        super({ code, message });
        this.name = 'SubError';
      }
    }

    const err = new SubError('ERR', 'msg');

    expect(err.stack).toBeDefined();
    expect(err.stack).not.toContain('DetailedError.ts');
  });
});

describe('DetailedError clone preserves Error instances in details', () => {
  it('preserves name, message, and stack of an Error in details', () => {
    const original = new Error('inner error');
    const err = new DetailedError({ code: 'ERR', message: 'msg', details: { cause: original } });

    const cloned = (err.details as Record<string, unknown>).cause as Record<string, unknown>;
    expect(cloned).not.toBe(original);
    expect(cloned.name).toBe('Error');
    expect(cloned.message).toBe('inner error');
    expect(cloned.stack).toBe(original.stack);
  });

  it('preserves Error cause recursively', () => {
    const root = new Error('root');
    const inner = new Error('inner', { cause: root });
    const err = new DetailedError({ code: 'ERR', message: 'msg', details: { error: inner } });

    const cloned = (err.details as Record<string, unknown>).error as Record<string, unknown>;
    expect(cloned.message).toBe('inner');
    expect(cloned.cause).toBeDefined();
    expect((cloned.cause as Record<string, unknown>).message).toBe('root');
  });

  it('preserves Error instances nested inside an array', () => {
    const inner = new Error('nested');
    const err = new DetailedError({ code: 'ERR', message: 'msg', details: { errors: [inner] } });

    const cloned = ((err.details as Record<string, unknown>).errors as Array<Record<string, unknown>>)[0]!;
    expect(cloned.message).toBe('nested');
    expect(cloned.name).toBe('Error');
  });

  it('mutating the original Error does not affect the cloned details', () => {
    const original = new Error('original');
    const err = new DetailedError({ code: 'ERR', message: 'msg', details: { error: original } });

    original.message = 'mutated';

    const cloned = (err.details as Record<string, unknown>).error as Record<string, unknown>;
    expect(cloned.message).toBe('original');
  });
});
