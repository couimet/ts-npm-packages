import { stripQuery } from '../stripQuery';

describe('stripQuery', () => {
  it('returns the url unchanged when it carries no query string', () => {
    expect(stripQuery('/api/summary')).toBe('/api/summary');
  });

  it('drops the query string and the question mark that introduces it', () => {
    expect(stripQuery('/api/summary?duration=24h')).toBe('/api/summary');
  });

  it('drops every parameter when the query string carries a credential', () => {
    expect(stripQuery('/callback?token=secret&next=%2Fhome')).toBe('/callback');
  });

  it('returns the root path for a request to the app root', () => {
    expect(stripQuery('/')).toBe('/');
  });
});
