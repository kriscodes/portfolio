import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { app } from './app.js';
test('public API has stable read contracts and rejects unknown writes', async () => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  try {
    const health = await fetch(`${base}/api/v1/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).status, 'ok');
    const response = await fetch(`${base}/api/v1/projects`);
    const body = await response.json();
    assert.equal(body.data[0].slug, 'care-iq');
    assert.equal(body.data[0].status, 'active-development');
    const invalid = await fetch(`${base}/api/v1/projects`, { method: 'POST' });
    assert.equal(invalid.status, 404);
    assert.equal((await invalid.json()).error.code, 'NOT_FOUND');
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
