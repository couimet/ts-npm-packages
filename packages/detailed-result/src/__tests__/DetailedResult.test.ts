import { DetailedResult, DetailedResultErrorCodes } from '../index';

import { DetailedError } from '@couimet/detailed-error';

describe('DetailedResult', () => {
  describe('success', () => {
    it('creates a successful result with the given value', () => {
      const result = DetailedResult.success(42);

      expect(result.success).toBe(true);
      expect(result.value).toBe(42);
    });

    it('works with undefined value', () => {
      const result = DetailedResult.success(undefined);

      expect(result.success).toBe(true);
      expect(result.value).toBeUndefined();
    });

    it('works with null value', () => {
      const result = DetailedResult.success(null);

      expect(result.success).toBe(true);
      expect(result.value).toBeNull();
    });

    it('works with object values', () => {
      const obj = { key: 'value' };
      const result = DetailedResult.success(obj);

      expect(result.success).toBe(true);
      expect(result.value).toBe(obj);
    });
  });

  describe('failure', () => {
    it('creates an error result with the given error', () => {
      const error = new Error('something went wrong');
      const result = DetailedResult.failure(error);

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
    });

    it('works with DetailedError', () => {
      const error = new DetailedError({ code: 'NOT_FOUND', message: 'Resource not found' });
      const result = DetailedResult.failure(error);

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
    });

    it('preserves all fields from DetailedError through the result', () => {
      const cause = new Error('root cause');
      const error = new DetailedError({
        code: 'CUSTOM_ERR',
        message: 'something broke',
        functionName: 'doWork',
        details: { userId: 42, retryable: true },
        cause,
      });
      const result = DetailedResult.failure(error);

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(result.error).toStrictEqual(error);
    });

    it('works with string errors', () => {
      const result = DetailedResult.failure('something went wrong');

      expect(result.success).toBe(false);
      expect(result.error).toBe('something went wrong');
    });
  });

  describe('success discriminator', () => {
    it('returns true for success results', () => {
      expect(DetailedResult.success(1).success).toBe(true);
    });

    it('returns false for failure results', () => {
      expect(DetailedResult.failure(new Error('fail')).success).toBe(false);
    });
  });

  describe('value getter', () => {
    it('returns the value on a success result', () => {
      const result = DetailedResult.success('hello');

      expect(result.value).toBe('hello');
    });

    it('throws DetailedError with RESULT_VALUE_ACCESS_ON_ERROR on an error result', () => {
      const result = DetailedResult.failure(new Error('fail'));

      expect(() => result.value).toThrowDetailedError('RESULT_VALUE_ACCESS_ON_ERROR', {
        message: 'Cannot access value on an error DetailedResult. Check .success before accessing .value',
        functionName: 'DetailedResult.value',
      });
    });
  });

  describe('error getter', () => {
    it('returns the error on an error result', () => {
      const error = new Error('fail');
      const result = DetailedResult.failure(error);

      expect(result.error).toBe(error);
    });

    it('throws DetailedError with RESULT_ERROR_ACCESS_ON_SUCCESS on a success result', () => {
      const result = DetailedResult.success(42);

      expect(() => result.error).toThrowDetailedError('RESULT_ERROR_ACCESS_ON_SUCCESS', {
        message: 'Cannot access error on a successful DetailedResult. Check .success before accessing .error',
        functionName: 'DetailedResult.error',
      });
    });
  });

  describe('constructor invariants', () => {
    class TestResult<T, E> extends DetailedResult<T, E> {
      constructor(success: boolean, value: T | undefined, error: E | undefined) {
        super(success, value, error);
      }
    }

    it('throws RESULT_INVALID_STATE when success result has an error', () => {
      expect(() => new TestResult(true, 'value', new Error('should not be here'))).toThrowDetailedError('RESULT_INVALID_STATE', {
        message: 'DetailedResult marked as success cannot have an error defined',
        functionName: 'DetailedResult.constructor',
        details: { success: true, hasValue: true, hasError: true },
      });
    });

    it('throws RESULT_INVALID_STATE when error result has a value', () => {
      expect(() => new TestResult(false, 'should not be here', new Error('fail'))).toThrowDetailedError('RESULT_INVALID_STATE', {
        message: 'DetailedResult marked as error cannot have a value defined',
        functionName: 'DetailedResult.constructor',
        details: { success: false, hasValue: true, hasError: true },
      });
    });

    it('throws RESULT_INVALID_STATE when error result has no error defined', () => {
      expect(() => new TestResult(false, undefined, undefined)).toThrowDetailedError('RESULT_INVALID_STATE', {
        message: 'DetailedResult marked as error must have an error defined',
        functionName: 'DetailedResult.constructor',
        details: { success: false, hasValue: false, hasError: false },
      });
    });

    it('constructor invariant details include success, hasValue, and hasError', () => {
      expect(() => new TestResult(true, 'val', new Error('err'))).toThrowDetailedError('RESULT_INVALID_STATE', {
        message: 'DetailedResult marked as success cannot have an error defined',
        functionName: 'DetailedResult.constructor',
        details: { success: true, hasValue: true, hasError: true },
      });
    });
  });

  describe('subclass', () => {
    class MyError extends DetailedError<'MY_ERROR'> {
      constructor(message: string) {
        super({ code: 'MY_ERROR', message });
        this.name = 'MyError';
      }
    }

    class MyResult<T> extends DetailedResult<T, MyError> {
      private constructor(success: boolean, value: T | undefined, error: MyError | undefined) {
        super(success, value, error);
      }

      static ok<T>(value: T): MyResult<T> {
        return new MyResult(true, value, undefined);
      }

      static err(error: MyError): MyResult<never> {
        return new MyResult<never>(false, undefined, error);
      }
    }

    it('subclass ok factory creates a success result', () => {
      const result = MyResult.ok(42);

      expect(result).toBeInstanceOf(MyResult);
      expect(result).toBeInstanceOf(DetailedResult);
      expect(result.success).toBe(true);
      expect(result.value).toBe(42);
    });

    it('subclass err factory creates an error result', () => {
      const error = new MyError('something failed');
      const result = MyResult.err(error);

      expect(result).toBeInstanceOf(MyResult);
      expect(result).toBeInstanceOf(DetailedResult);
      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
    });

    it('subclass error getter throws DetailedError on success', () => {
      const result = MyResult.ok(42);

      expect(() => result.error).toThrowDetailedError('RESULT_ERROR_ACCESS_ON_SUCCESS', {
        message: 'Cannot access error on a successful DetailedResult. Check .success before accessing .error',
        functionName: 'DetailedResult.error',
      });
    });

    it('subclass value getter throws DetailedError on error', () => {
      const result = MyResult.err(new MyError('fail'));

      expect(() => result.value).toThrowDetailedError('RESULT_VALUE_ACCESS_ON_ERROR', {
        message: 'Cannot access value on an error DetailedResult. Check .success before accessing .value',
        functionName: 'DetailedResult.value',
      });
    });
  });

  describe('DetailedResultErrorCodes', () => {
    it('has distinct values for each code', () => {
      const values = Object.values(DetailedResultErrorCodes);
      const unique = new Set(values);

      expect(unique.size).toBe(values.length);
    });
  });
});
