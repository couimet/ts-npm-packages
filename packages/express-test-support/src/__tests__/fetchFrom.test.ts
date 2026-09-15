import { closeServer, fetchFrom, type FetchTarget } from '../index';

import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

describe('fetchFrom', () => {
  let server: Server;
  let target: FetchTarget;

  beforeEach(async () => {
    server = createServer((req, res) => {
      res.setHeader('x-test-header', 'present');
      res.end(`${req.method} ${req.url} ${req.headers['x-request-header'] ?? 'none'}`);
    });

    target = await new Promise<FetchTarget>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address() as AddressInfo;

        resolve({ host: address.address, port: address.port });
      });
    });
  });

  afterEach(async () => {
    await closeServer(server);
  });

  it('returns the response for the requested path', async () => {
    const response = await fetchFrom(target, '/smoke');

    expect(response.status).toBe(200);
    expect(response.headers.get('x-test-header')).toBe('present');
    expect(await response.text()).toBe('GET /smoke none');
  });

  it('keeps the query string when the path carries one', async () => {
    const response = await fetchFrom(target, '/smoke?duration=24h');

    expect(await response.text()).toBe('GET /smoke?duration=24h none');
  });

  it('forwards the request init to fetch', async () => {
    const response = await fetchFrom(target, '/smoke', { headers: { 'x-request-header': 'sent' }, method: 'POST' });

    expect(await response.text()).toBe('POST /smoke sent');
  });
});
