import { buildTestUrl } from '../buildTestUrl';

describe('buildTestUrl', () => {
  it('builds an http url from the host and port', () => {
    expect(buildTestUrl({ host: '127.0.0.1', port: 3000 }, '/smoke')).toBe('http://127.0.0.1:3000/smoke');
  });

  it('brackets an IPv6 host so the url stays valid', () => {
    expect(buildTestUrl({ host: '::1', port: 3000 }, '/smoke')).toBe('http://[::1]:3000/smoke');
  });

  it('keeps the query string when the path carries one', () => {
    expect(buildTestUrl({ host: '127.0.0.1', port: 3000 }, '/smoke?duration=24h')).toBe('http://127.0.0.1:3000/smoke?duration=24h');
  });
});
