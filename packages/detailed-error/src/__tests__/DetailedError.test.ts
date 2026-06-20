import { DetailedError, type ErrorOptions, SharedErrorCodes } from '../index';

describe('DetailedError with string codes', () => {
  it('constructs with all fields', () => {
    const err = new DetailedError({
      code: 'TEST_CODE',
      message: 'Something went wrong',
      functionName: 'doStuff',
      details: { key: 'value' },
      cause: new Error('root cause'),
    });

    expect(err.code).toBe('TEST_CODE');
    expect(err.message).toBe('Something went wrong');
    expect(err.functionName).toBe('doStuff');
    expect(err.details).toEqual({ key: 'value' });
    expect(err.cause).toBeInstanceOf(Error);
    expect((err.cause as Error).message).toBe('root cause');
  });

  it('constructs with only required fields', () => {
    const err = new DetailedError({
      code: 'MINIMAL',
      message: 'Just the essentials',
    });

    expect(err.code).toBe('MINIMAL');
    expect(err.message).toBe('Just the essentials');
    expect(err.functionName).toBeUndefined();
    expect(err.details).toBeUndefined();
    expect(err.cause).toBeUndefined();
  });

  it('is instanceof Error and DetailedError', () => {
    const err = new DetailedError({ code: 'X', message: 'msg' });

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(DetailedError);
  });

  it('exposes cause in the error-cause chain', () => {
    const root = new Error('root');
    const err = new DetailedError({ code: 'WRAPPED', message: 'wrapper', cause: root });

    expect(err.cause).toBe(root);
  });

  it('does not set cause when cause is undefined', () => {
    const err = new DetailedError({ code: 'NO_CAUSE', message: 'no cause here' });

    expect(err.cause).toBeUndefined();
  });

  it('details is a defensive deep copy — mutating a nested object does not affect the error', () => {
    const original = { nested: { key: 'original' } };
    const err = new DetailedError({ code: 'X', message: 'msg', details: original });

    (original.nested as Record<string, unknown>).key = 'mutated';
    (original as Record<string, unknown>).extra = 'added';

    expect(err.details).toEqual({ nested: { key: 'original' } });
    expect(err.details).not.toHaveProperty('extra');
  });

  it('details is not the same object reference as the input', () => {
    const original = { key: 'value' };
    const err = new DetailedError({ code: 'X', message: 'msg', details: original });

    expect(err.details).not.toBe(original);
    expect((err.details as Record<string, unknown>).nested).toBeUndefined();
  });

  it('deep-clones circular references without throwing', () => {
    const circular: Record<string, unknown> = { key: 'value' };
    circular.self = circular;

    const err = new DetailedError({ code: 'CIRCULAR', message: 'circular details', details: circular });

    expect(err.details).not.toBe(circular);
    expect((err.details as Record<string, unknown>).key).toBe('value');
    expect((err.details as Record<string, unknown>).self).toBe(err.details);
    // Original circular still references itself, not the clone
    circular.key = 'mutated';
    expect((err.details as Record<string, unknown>).key).toBe('value');
  });

  it('handles details with arrays and nested objects via deep clone', () => {
    const original = { items: [{ id: 1 }, { id: 2 }] };
    const err = new DetailedError({ code: 'X', message: 'msg', details: original });

    (original.items[0] as Record<string, unknown>).id = 99;
    original.items.push({ id: 3 });

    expect(err.details).toEqual({ items: [{ id: 1 }, { id: 2 }] });
  });

  it('is catchable via instanceof DetailedError', () => {
    const thrown = new DetailedError({ code: 'BOOM', message: 'it blew up' });

    try {
      throw thrown;
    } catch (err) {
      expect(err).toBeInstanceOf(DetailedError);
      expect(err).toBeInstanceOf(Error);
      expect((err as DetailedError<string>).code).toBe('BOOM');
    }
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

    expect(err).toBeInstanceOf(ProjectError);
    expect(err).toBeInstanceOf(DetailedError);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ProjectError');
    expect(err.code).toBe('BAD_INPUT');
  });

  it('accepts a shared error code', () => {
    const err = new ProjectError({ code: SharedErrorCodes.VALIDATION, message: 'invalid' });

    expect(err.code).toBe('VALIDATION');
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
        expect(err.code).toBe(ProjectCodes.TIMEOUT);
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
      expect(err).toBeInstanceOf(DetailedError);
      expect(err).toBeInstanceOf(Error);
      // Narrow enough to see code, but not the project enum type
      expect((err as DetailedError<string>).code).toBe('BAD_INPUT');
    }
  });

  it('generics keep code type narrow when constructed with an enum value', () => {
    const err = new DetailedError({
      code: SharedErrorCodes.UNKNOWN,
      message: 'Something unexpected',
    });

    const code: SharedErrorCodes = err.code;
    expect(code).toBe(SharedErrorCodes.UNKNOWN);
  });
});
