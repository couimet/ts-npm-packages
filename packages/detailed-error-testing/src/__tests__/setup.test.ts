import '../setup';
import { DetailedError } from '@couimet/detailed-error';

describe('setup', () => {
  it('registers toThrowDetailedError on expect', () => {
    const fn = () => {
      throw new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn' });
    };

    expect(fn).toThrowDetailedError('ERR', { message: 'msg', functionName: 'fn' });
  });

  it('registers toThrowDetailedErrorAsync on expect', async () => {
    const fn = async () => {
      await Promise.resolve();
      throw new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn' });
    };

    await expect(fn).toThrowDetailedErrorAsync('ERR', { message: 'msg', functionName: 'fn' });
  });

  it('registers toBeDetailedError on expect', () => {
    const err = new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn' });

    expect(err).toBeDetailedError('ERR', { message: 'msg', functionName: 'fn' });
  });

  it('toThrowDetailedError can be negated with .not', () => {
    const fn = () => {
      throw new DetailedError({ code: 'ERR', message: 'msg', functionName: 'fn' });
    };

    expect(fn).not.toThrowDetailedError('OTHER', { message: 'msg', functionName: 'fn' });
  });
});
