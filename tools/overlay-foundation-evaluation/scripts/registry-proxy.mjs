#!/usr/bin/env node
import { createServer, request as httpRequest } from 'node:http';
import { connect as netConnect } from 'node:net';
import { connect as tlsConnect } from 'node:tls';
import { setTimeout as delay } from 'node:timers/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// The authority is deliberately literal: redirects cannot widen this boundary.
export function createRegistryProxy({ connect = netConnect } = {}) {
  const counts = {
    schemaVersion: 1,
    connectAllowed: 0,
    connectRejected: 0,
    methodRejected: 0,
    tunnelFailures: 0,
  };
  const sockets = new Set();
  const server = createServer((_request, response) => {
    counts.methodRejected++;
    response.writeHead(405, { connection: 'close', 'content-length': '0' });
    response.end();
  });
  const track = (socket) => {
    sockets.add(socket);
    socket.once('close', () => sockets.delete(socket));
    socket.on('error', () => {});
    return socket;
  };
  server.on('connection', track);
  server.on('connect', (request, client, head) => {
    if (
      request.url !== 'registry.npmjs.org:443' ||
      request.headers['proxy-authorization'] !== undefined ||
      request.headers.authorization !== undefined
    ) {
      counts.connectRejected++;
      client.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');
      return;
    }
    counts.connectAllowed++;
    let upstream,
      connected = false,
      failed = false;
    const fail = () => {
      if (failed) return;
      failed = true;
      counts.tunnelFailures++;
      if (!connected)
        client.end('HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');
      else client.destroy();
      upstream?.destroy();
    };
    try {
      upstream = track(connect({ host: 'registry.npmjs.org', port: 443 }));
      upstream.setTimeout(30_000, fail);
      upstream.once('error', fail);
      client.once('close', () => upstream.destroy());
      upstream.once('close', () => client.destroy());
      upstream.once('connect', () => {
        connected = true;
        upstream.setTimeout(0);
        client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        if (head.length) upstream.write(head);
        client.pipe(upstream);
        upstream.pipe(client);
      });
    } catch {
      fail();
    }
  });
  return Object.freeze({
    listen: ({ host = '0.0.0.0', port = 3128 } = {}) =>
      new Promise((yes, no) => {
        server.once('error', no);
        server.listen(port, host, () => {
          server.removeListener('error', no);
          yes();
        });
      }),
    address: () => server.address(),
    summary: () => Object.freeze({ ...counts }),
    close: () =>
      new Promise((yes, no) => {
        for (const socket of sockets) socket.destroy();
        server.close((error) => (error ? no(error) : yes()));
      }),
  });
}

function directProbe() {
  return new Promise((resolve) => {
    const socket = netConnect({ host: 'registry.npmjs.org', port: 443 });
    const finish = (value) => {
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(2000, () => finish(false));
    socket.once('error', () => finish(false));
    socket.once('connect', () => finish(true));
  });
}
function proxyConnect(proxyURL, target) {
  return new Promise((resolve, reject) => {
    const proxy = new URL(proxyURL);
    const request = httpRequest({
      hostname: proxy.hostname,
      port: proxy.port,
      method: 'CONNECT',
      path: target,
    });
    request.setTimeout(5000, () => request.destroy(new Error('proxy CONNECT timed out')));
    request.once('error', reject);
    request.once('connect', (response, socket) =>
      resolve({ statusCode: response.statusCode, socket }),
    );
    request.once('response', (response) => {
      response.resume();
      resolve({ statusCode: response.statusCode });
    });
    request.end();
  });
}
async function connectProbe(target, proxyURL) {
  const result = await proxyConnect(proxyURL, target);
  result.socket?.destroy();
  return result.statusCode;
}
async function httpsProbe(proxyURL) {
  const result = await proxyConnect(proxyURL, 'registry.npmjs.org:443');
  if (result.statusCode !== 200) {
    result.socket?.destroy();
    return result.statusCode;
  }
  return new Promise((resolve, reject) => {
    const socket = tlsConnect({
      socket: result.socket,
      servername: 'registry.npmjs.org',
      rejectUnauthorized: true,
    });
    let bytes = '';
    socket.setTimeout(10000, () => socket.destroy(new Error('registry HTTPS probe timed out')));
    socket.once('error', reject);
    socket.once('secureConnect', () =>
      socket.write('GET /-/ping HTTP/1.1\r\nHost: registry.npmjs.org\r\nConnection: close\r\n\r\n'),
    );
    socket.on('data', (chunk) => {
      bytes += chunk.toString('ascii');
      if (bytes.includes('\r\n')) {
        const match = /^HTTP\/1\.[01] ([0-9]{3}) /u.exec(bytes);
        socket.destroy();
        if (!match) reject(new Error('invalid registry HTTPS response'));
        else resolve(Number(match[1]));
      }
    });
  });
}
export async function runRegistryPreflight(
  { proxyURL = process.env.HTTPS_PROXY } = {},
  dependencies = {},
) {
  const probes = { directProbe, connectProbe, httpsProbe, ...dependencies };
  if (proxyURL !== 'http://registry-proxy:3128')
    throw new Error('registry preflight requires exact repository proxy');
  if (await probes.directProbe())
    throw new Error('direct registry access must fail from evaluation network');
  let connected;
  const deadline = Date.now() + 10000;
  for (;;)
    try {
      connected = await probes.connectProbe('registry.npmjs.org:443', proxyURL);
      break;
    } catch (error) {
      if (Date.now() > deadline) throw error;
      await delay(100);
    }
  if (connected !== 200 || (await probes.httpsProbe(proxyURL)) !== 200)
    throw new Error('allowlisted registry HTTPS must succeed through proxy');
  const targets = [
    'example.com:443',
    'registry.npmjs.org:80',
    'registry.npmjs.org',
    'user@registry.npmjs.org:443',
    'registry.npmjs.org.:443',
    '127.0.0.1:443',
    '[::1]:443',
  ];
  for (const target of targets)
    if ((await probes.connectProbe(target, proxyURL)) !== 403)
      throw new Error('non-allowlisted CONNECT target was not rejected: ' + target);
  return {
    schemaVersion: 1,
    directRegistryBlocked: true,
    registryHttpsSucceeded: true,
    nonAllowlistedTargetsRejected: targets.length,
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (process.versions.node !== '24.18.0') throw new Error('registry proxy requires Node 24.18.0');
  if (process.argv.length === 3 && process.argv[2] === '--preflight') {
    const proof = await runRegistryPreflight();
    process.stdout.write(JSON.stringify(proof) + '\n');
  } else {
    if (process.argv.length !== 2)
      throw new Error('registry proxy accepts no arguments or --preflight');
    const proxy = createRegistryProxy();
    await proxy.listen();
    let stopping = false;
    const stop = async () => {
      if (stopping) return;
      stopping = true;
      await proxy.close();
      process.stdout.write(JSON.stringify(proxy.summary()) + '\n');
    };
    process.once('SIGTERM', stop);
    process.once('SIGINT', stop);
  }
}
