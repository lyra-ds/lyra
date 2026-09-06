import assert from 'node:assert/strict';
import { request } from 'node:http';
import { test } from 'node:test';
const moduleURL = new URL('./registry-proxy.mjs', import.meta.url);
function connect(port, target, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, method: 'CONNECT', path: target, headers });
    req.on('connect', (res, socket) => {
      socket.destroy();
      resolve(res.statusCode);
    });
    req.on('response', (res) => {
      res.resume();
      resolve(res.statusCode);
    });
    req.on('error', reject);
    req.end();
  });
}
test('proxy rejects every nonexact authority before opening any outbound socket', async (t) => {
  const { createRegistryProxy } = await import(moduleURL);
  const calls = [];
  const proxy = createRegistryProxy({
    connect: (...args) => {
      calls.push(args);
      throw new Error('outbound forbidden in test');
    },
  });
  await proxy.listen({ port: 0, host: '127.0.0.1' });
  t.after(() => proxy.close());
  for (const target of [
    'example.com:443',
    'registry.npmjs.org:80',
    'registry.npmjs.org',
    'REGISTRY.NPMJS.ORG:443',
    'registry.npmjs.org.:443',
    'user:pass@registry.npmjs.org:443',
    'registry.npmjs.org:443/path',
    '127.0.0.1:443',
    '[::1]:443',
  ])
    assert.equal(await connect(proxy.address().port, target), 403, target);
  assert.equal(
    await connect(proxy.address().port, 'registry.npmjs.org:443', {
      'proxy-authorization': 'Basic abc',
    }),
    403,
  );
  assert.equal(calls.length, 0);
  assert.deepEqual(proxy.summary(), {
    schemaVersion: 1,
    connectAllowed: 0,
    connectRejected: 10,
    methodRejected: 0,
    tunnelFailures: 0,
  });
});
test('proxy rejects ordinary HTTP and summary has only closed request counts', async (t) => {
  const { createRegistryProxy } = await import(moduleURL);
  const proxy = createRegistryProxy();
  await proxy.listen({ port: 0, host: '127.0.0.1' });
  t.after(() => proxy.close());
  const response = await fetch('http://127.0.0.1:' + proxy.address().port + '/');
  assert.equal(response.status, 405);
  assert.deepEqual(proxy.summary(), {
    schemaVersion: 1,
    connectAllowed: 0,
    connectRejected: 0,
    methodRejected: 1,
    tunnelFailures: 0,
  });
});

test('registry preflight requires direct denial allowed HTTPS and denial of every other CONNECT', async () => {
  const { runRegistryPreflight } = await import(moduleURL);
  const calls = [];
  const dependencies = {
    directProbe: async () => {
      calls.push('direct');
      return false;
    },
    connectProbe: async (target) => {
      calls.push(target);
      return target === 'registry.npmjs.org:443' ? 200 : 403;
    },
    httpsProbe: async () => {
      calls.push('https');
      return 200;
    },
  };
  const proof = await runRegistryPreflight(
    { proxyURL: 'http://registry-proxy:3128' },
    dependencies,
  );
  assert.equal(calls[0], 'direct');
  assert.ok(calls.includes('https'));
  assert.ok(proof.nonAllowlistedTargetsRejected >= 6);
  assert.equal(proof.directRegistryBlocked, true);
  assert.equal(proof.registryHttpsSucceeded, true);
  await assert.rejects(
    runRegistryPreflight(
      { proxyURL: 'http://registry-proxy:3128' },
      { ...dependencies, directProbe: async () => true },
    ),
    /direct registry/,
  );
  await assert.rejects(
    runRegistryPreflight(
      { proxyURL: 'http://registry-proxy:3128' },
      { ...dependencies, connectProbe: async () => 200 },
    ),
    /non-allowlisted/,
  );
  await assert.rejects(
    runRegistryPreflight(
      { proxyURL: 'http://registry-proxy:3128' },
      { ...dependencies, httpsProbe: async () => 500 },
    ),
    /registry HTTPS/,
  );
});
