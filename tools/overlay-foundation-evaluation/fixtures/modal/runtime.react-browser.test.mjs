import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const enabled = process.env.OVERLAY_MODAL_REACT_BROWSER_TEST === '1';

test(
  'real React delegated root listeners stay excluded while a same-target candidate leak remains',
  { skip: !enabled, timeout: 30_000 },
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

    const characterize = async ({ fixture = 'runtime.react-browser.html', leak }) => {
      const page = await browser.newPage();
      const browserErrors = [];
      const browserFailure = Promise.withResolvers();
      void browserFailure.promise.catch(() => {});
      let closing = false;
      const failBrowser = (error) => {
        const browserError = error instanceof Error ? error : new Error(String(error));
        browserErrors.push(browserError);
        browserFailure.reject(browserError);
      };
      page.on('console', (message) => {
        if (message.type() === 'error') browserErrors.push(new Error(message.text()));
      });
      page.on('close', () => {
        if (!closing) failBrowser(new Error('page closed unexpectedly'));
      });
      page.on('crash', () => failBrowser(new Error('page crashed')));
      page.on('pageerror', failBrowser);
      try {
        await page.goto(
          `http://127.0.0.1:${address.port}/tools/overlay-foundation-evaluation/fixtures/modal/${fixture}?leak=${leak}`,
          { timeout: 5_000 },
        );
        try {
          const resultReady = page.evaluate(
            (timeoutMilliseconds) =>
              new Promise((resolveResult, rejectResult) => {
                const timeout = setTimeout(
                  () => rejectResult(new Error('React tracker result timed out')),
                  timeoutMilliseconds,
                );
                const checkResult = () => {
                  if (globalThis.__LYRA_REACT_TRACKER_RESULT__ !== undefined) {
                    clearTimeout(timeout);
                    resolveResult(globalThis.__LYRA_REACT_TRACKER_RESULT__);
                    return;
                  }
                  requestAnimationFrame(checkResult);
                };
                checkResult();
              }),
            5_000,
          );
          void resultReady.catch(() => {});
          const result = await Promise.race([resultReady, browserFailure.promise]);
          if (browserErrors.length > 0) {
            throw new AggregateError(
              browserErrors,
              browserErrors.map(({ message }) => message).join('\n'),
            );
          }
          return result;
        } catch (error) {
          if (browserErrors.includes(error)) throw error;
          throw new AggregateError(
            [error, ...browserErrors],
            [error, ...browserErrors].map(({ message }) => message).join('\n'),
          );
        }
      } finally {
        closing = true;
        await page.close();
      }
    };

    let safetyTimer;
    try {
      await assert.rejects(
        Promise.race([
          characterize({ fixture: 'runtime.react-browser-failure.html', leak: false }),
          new Promise((_, reject) => {
            safetyTimer = setTimeout(
              () => reject(new Error('browser failure propagation safety timeout')),
              5_000,
            );
          }),
        ]),
        /react characterization failed before publishing result/u,
      );
    } finally {
      clearTimeout(safetyTimer);
    }
    const clean = await characterize({ leak: false });
    const leaked = await characterize({ leak: true });
    assert.equal(clean.persistentListeners > 0, true, JSON.stringify(clean));
    assert.equal(clean.listeners, 0, JSON.stringify(clean));
    assert.deepEqual(clean.listenerEntries, []);
    const exercised = clean.listenerLifecycles.filter(
      ({ releaseCount, releasedOperation }) => releaseCount === 1 && releasedOperation === 'close',
    );
    assert.equal(exercised.length, 6, JSON.stringify(clean));
    assert.equal(new Set(exercised.map(({ id }) => id)).size, 6);
    const panelListeners = exercised.filter(({ target }) => target === 'modal-panel');
    assert.deepEqual(
      panelListeners.map(({ boundary, purpose, uses }) => ({ boundary, purpose, uses })),
      [
        {
          boundary: 'modal-panel',
          purpose: 'other',
          uses: [
            {
              effects: ['default-prevented'],
              operation: 'press',
              phase: 'operation',
              purpose: 'focus-loop',
              target: 'modal-panel',
              type: 'keydown',
            },
          ],
        },
        {
          boundary: 'modal-panel',
          purpose: 'other',
          uses: [
            {
              effects: ['default-prevented'],
              operation: 'press',
              phase: 'operation',
              purpose: 'dismiss',
              target: 'modal-panel',
              type: 'keydown',
            },
          ],
        },
      ],
    );
    assert.deepEqual(
      exercised
        .filter(({ target }) => target !== 'modal-panel')
        .map(({ boundary, target, uses }) => ({
          boundary,
          target,
          purposes: uses.map(({ purpose }) => purpose),
        })),
      ['modal-opener', 'modal-backdrop', 'document', 'window'].map((target) => ({
        boundary: 'outside-modal-boundary',
        purposes: ['focus-loop'],
        target,
      })),
    );
    assert.equal(leaked.persistentListeners, clean.persistentListeners);
    assert.equal(leaked.listeners, 1);
    assert.deepEqual(
      leaked.listenerEntries.map(({ owner, purpose, target, type }) => ({
        owner,
        purpose,
        target,
        type,
      })),
      [
        {
          owner: 'modal-fixture-root',
          purpose: 'other',
          target: 'modal-fixture-root',
          type: 'keydown',
        },
      ],
    );
  },
);
