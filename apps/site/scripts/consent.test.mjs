import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { transpileModule } from 'typescript';

const sourcePath = resolve(import.meta.dirname, '../lib/consent.ts');

async function loadConsent() {
  const source = readFileSync(sourcePath, 'utf8');
  const output = transpileModule(source, {
    compilerOptions: { module: 99, target: 9 },
  }).outputText;

  return import(`data:text/javascript,${encodeURIComponent(output)}`);
}

function setStorage(value, { throws = false } = {}) {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem() {
          if (throws) throw new Error('storage is unavailable');
          return value;
        },
      },
    },
  });
}

test('consent reader is SSR-safe when no browser window exists', async (t) => {
  t.after(() => Reflect.deleteProperty(globalThis, 'window'));
  Reflect.deleteProperty(globalThis, 'window');

  const { mayLoadAnalytics, readConsent } = await loadConsent();

  assert.equal(readConsent(), null);
  assert.equal(mayLoadAnalytics(), false);
});

test('analytics may load only after an exact all decision', async (t) => {
  t.after(() => Reflect.deleteProperty(globalThis, 'window'));
  const { mayLoadAnalytics, readConsent } = await loadConsent();

  setStorage('all');
  assert.equal(readConsent(), 'all');
  assert.equal(mayLoadAnalytics(), true);

  setStorage('essentials');
  assert.equal(readConsent(), 'essentials');
  assert.equal(mayLoadAnalytics(), false);

  setStorage('anything-else');
  assert.equal(readConsent(), null);
  assert.equal(mayLoadAnalytics(), false);
});

test('consent reader treats blocked storage as no decision', async (t) => {
  t.after(() => Reflect.deleteProperty(globalThis, 'window'));
  const { mayLoadAnalytics, readConsent } = await loadConsent();

  setStorage(null, { throws: true });

  assert.equal(readConsent(), null);
  assert.equal(mayLoadAnalytics(), false);
});
