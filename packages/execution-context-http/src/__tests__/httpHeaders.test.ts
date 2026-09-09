import { HttpHeaders } from '../index';

describe('HttpHeaders', () => {
  it('has the correct values', () => {
    expect(HttpHeaders).toStrictEqual({
      CorrelationId: 'x-correlation-id',
      RequestId: 'x-request-id',
    });
  });
});
