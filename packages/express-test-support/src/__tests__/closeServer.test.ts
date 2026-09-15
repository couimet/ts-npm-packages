import { closeServer } from '../index';

import { createServer } from 'node:http';

describe('closeServer', () => {
  it('resolves once the server has stopped listening', async () => {
    const server = createServer();
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });

    await expect(closeServer(server)).resolves.toBeUndefined();
    expect(server.listening).toBe(false);
  });

  it('rejects when the server is not running', async () => {
    await expect(closeServer(createServer())).rejects.toThrow('Server is not running');
  });
});
