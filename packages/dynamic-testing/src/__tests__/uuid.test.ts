import { getUuid, getUuidV4 } from '../uuid';

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('getUuid', () => {
  it('returns a valid UUIDv4 string', () => {
    expect(getUuid()).toMatch(UUID_V4_RE);
  });

  it('returns different values on successive calls', () => {
    const a = getUuid();
    const b = getUuid();
    expect(a).not.toBe(b);
  });
});

describe('getUuidV4', () => {
  it('returns a valid UUIDv4 string', () => {
    expect(getUuidV4()).toMatch(UUID_V4_RE);
  });

  it('returns different values on successive calls', () => {
    const a = getUuidV4();
    const b = getUuidV4();
    expect(a).not.toBe(b);
  });
});
