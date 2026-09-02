import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const enabled = process.env.OVERLAY_MODAL_REACT_BROWSER_TEST === '1';

test(
  'real React delegated root listeners stay excluded while a same-target candidate leak remains',
  { skip: !enabled },
  async (t) => {
    const { chromium } = await import('playwright');
    const { createServer } = await import('vite');
    const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
    const server = await createServer({
      ...(process.env.OVERLAY_BROWSER_CACHE_ROOT === undefined
        ? {}
        : { cacheDir: process.env.OVERLAY_BROWSER_CACHE_ROOT }),
      logLevel: 'silent',
      resolve: {
        alias: {
          'node:util': resolve(
            repositoryRoot,
            'tools/overlay-foundation-evaluation/fixtures/modal/runtime.react-browser-node-util.mjs',
          ),
        },
      },
      root: repositoryRoot,
      server: { host: '127.0.0.1', port: 0 },
    });
    await server.listen();
    t.after(() => server.close());
    const browser = await chromium.launch({ headless: true });
    t.after(() => browser.close());
    const address = server.httpServer.address();
    assert.notEqual(address, null);
    assert.equal(typeof address, 'object');

    const characterize = async (leak) => {
      const page = await browser.newPage();
      const browserErrors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') browserErrors.push(message.text());
      });
      page.on('close', () => browserErrors.push('page closed unexpectedly'));
      page.on('crash', () => browserErrors.push('page crashed'));
      page.on('pageerror', (error) => browserErrors.push(error.message));
      try {
        await page.goto(
          `http://127.0.0.1:${address.port}/tools/overlay-foundation-evaluation/fixtures/modal/runtime.react-browser.html?leak=${leak}`,
        );
        try {
          return await page.evaluate(async () => {
            while (globalThis.__LYRA_REACT_TRACKER_RESULT__ === undefined) {
              await new Promise((resolveFrame) => requestAnimationFrame(resolveFrame));
            }
            return globalThis.__LYRA_REACT_TRACKER_RESULT__;
          });
        } catch (error) {
          throw new AggregateError([error], browserErrors.join('\n'));
        }
      } finally {
        await page.close();
      }
    };

    const clean = await characterize(false);
    const leaked = await characterize(true);
    assert.equal(clean.persistentListeners > 0, true, JSON.stringify(clean));
    assert.equal(clean.listeners, 0, JSON.stringify(clean));
    assert.deepEqual(clean.listenerEntries, []);
    assert.equal(leaked.persistentListeners, clean.persistentListeners);
    assert.equal(leaked.listeners, 1);
    assert.deepEqual(
      leaked.listenerEntries.map(({ classification, owner, target, type }) => ({
        classification,
        owner,
        target,
        type,
      })),
      [
        {
          classification: 'focus-loop',
          owner: 'modal-fixture-root',
          target: 'modal-fixture-root',
          type: 'keydown',
        },
      ],
    );
  },
);
