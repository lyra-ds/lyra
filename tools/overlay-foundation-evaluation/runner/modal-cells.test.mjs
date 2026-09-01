import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MODAL_WAVE_CELLS, modalScenariosForCell } from '../contracts/modal.mjs';

const modulePath = new URL('./modal-cells.mjs', import.meta.url);

async function loadCells() {
  return import(modulePath);
}

function normalizedExpected(scenario) {
  return { ...structuredClone(scenario.expected), diagnostics: {} };
}

function fakePlaywright({ failPrimary = false } = {}) {
  const calls = [];
  const engine = (name) => ({
    async launch() {
      calls.push(`launch:${name}`);
      return {
        async newContext(options) {
          calls.push(['context', name, structuredClone(options)]);
          return {
            async newPage() {
              calls.push(`page:${name}`);
              return {
                async goto(url) {
                  calls.push(['goto', url]);
                },
                async evaluate(_callback, input) {
                  if (input === undefined) {
                    calls.push('cleanup:fixture');
                    return true;
                  }
                  calls.push(['evaluate', input.cell.id, input.scenario.scenarioId]);
                  if (failPrimary) throw new Error('synthetic browser failure');
                  return normalizedExpected(input.scenario);
                },
                async close() {
                  calls.push('cleanup:page');
                },
              };
            },
            async close() {
              calls.push('cleanup:context');
            },
          };
        },
        async close() {
          calls.push('cleanup:browser');
        },
      };
    },
  });
  return {
    calls,
    playwright: {
      chromium: engine('chromium'),
      firefox: engine('firefox'),
      webkit: engine('webkit'),
    },
  };
}

test('maps every modal cell once without owning decision-evidence cells', async () => {
  const { MODAL_CELL_POLICIES } = await loadCells();
  assert.deepEqual(Object.keys(MODAL_CELL_POLICIES), MODAL_WAVE_CELLS);
  for (const forbidden of [
    'bundle-standalone',
    'bundle-composition',
    'packed-esm',
    'packed-cjs',
    'packed-types',
    'consumer-vite',
    'consumer-next',
    'consumer-commonjs',
  ])
    assert.equal(MODAL_CELL_POLICIES[forbidden], undefined);
});

test('pins exact modal browser, React, SSR, accessibility, and input policies', async () => {
  const { MODAL_CELL_POLICIES: policies } = await loadCells();
  assert.deepEqual(policies.chromium, {
    mode: 'browser',
    engine: 'chromium',
    reactVersions: ['19.2.8'],
    context: {},
  });
  assert.equal(policies.firefox.engine, 'firefox');
  assert.equal(policies.webkit.engine, 'webkit');
  assert.deepEqual(policies['react-18'].reactVersions, ['18.3.1']);
  assert.deepEqual(policies['react-19'].reactVersions, ['19.2.8']);
  assert.deepEqual(policies.ssr, { mode: 'ssr', reactVersions: ['19.2.8'] });
  assert.deepEqual(policies.hydration.reactVersions, ['18.3.1', '19.2.8']);
  assert.equal(policies.hydration.hydrate, true);
  assert.equal(policies['keyboard-focus'].engine, 'chromium');
  assert.deepEqual(policies['axe-light'], {
    mode: 'browser',
    engine: 'chromium',
    reactVersions: ['19.2.8'],
    context: { colorScheme: 'light' },
    axe: true,
  });
  assert.deepEqual(policies['axe-dark'].context, { colorScheme: 'dark' });
  assert.deepEqual(policies['forced-colors'].context, { forcedColors: 'active' });
  assert.deepEqual(policies['reduced-motion'].context, { reducedMotion: 'reduce' });
  assert.equal(policies.ltr.dir, 'ltr');
  assert.equal(policies.rtl.dir, 'rtl');
  assert.deepEqual(policies['coarse-pointer'].context, { hasTouch: true });
  assert.equal(policies['coarse-pointer'].synthesizeHover, false);
});

test('dispatches the WebKit cell through WebKit and returns a normalized observation', async () => {
  const { runModalCell } = await loadCells();
  const fake = fakePlaywright();
  const scenario = modalScenariosForCell('webkit')[0];
  const observations = await runModalCell(
    {
      cellId: 'webkit',
      fixtures: new Map([['19.2.8', { clientHtmlPath: '/owned/index.html' }]]),
      playwright: fake.playwright,
      scenario,
    },
    {
      async startServer() {
        return {
          url: 'http://127.0.0.1:43123/',
          async close() {
            fake.calls.push('cleanup:server');
          },
        };
      },
    },
  );
  assert.deepEqual(observations, [
    { reactVersion: '19.2.8', observation: normalizedExpected(scenario) },
  ]);
  assert.equal(fake.calls.includes('launch:webkit'), true);
  assert.equal(
    fake.calls.some((call) => call === 'launch:chromium'),
    false,
  );
});

test('runs SSR without launching a browser and hydration with both exact React versions', async () => {
  const { runModalCell } = await loadCells();
  const fake = fakePlaywright();
  const ssrScenario = modalScenariosForCell('ssr')[0];
  const ssr = await runModalCell(
    {
      cellId: 'ssr',
      fixtures: new Map([['19.2.8', { ssrPath: '/owned/ssr.mjs' }]]),
      playwright: fake.playwright,
      scenario: ssrScenario,
    },
    { executeSsr: async ({ scenario }) => normalizedExpected(scenario) },
  );
  assert.deepEqual(
    ssr.map(({ reactVersion }) => reactVersion),
    ['19.2.8'],
  );
  assert.equal(
    fake.calls.some((call) => typeof call === 'string' && call.startsWith('launch:')),
    false,
  );

  const hydrationScenario = modalScenariosForCell('hydration')[0];
  const hydration = await runModalCell(
    {
      cellId: 'hydration',
      fixtures: new Map([
        ['18.3.1', { clientHtmlPath: '/owned/react-18/index.html' }],
        ['19.2.8', { clientHtmlPath: '/owned/react-19/index.html' }],
      ]),
      playwright: fake.playwright,
      scenario: hydrationScenario,
    },
    {
      async startServer({ fixture }) {
        return { url: `http://127.0.0.1/${fixture.clientHtmlPath}`, close: async () => {} };
      },
    },
  );
  assert.deepEqual(
    hydration.map(({ reactVersion }) => reactVersion),
    ['18.3.1', '19.2.8'],
  );
});

test('attempts fixture, page, context, browser, and server cleanup after a primary failure', async () => {
  const { runModalCell } = await loadCells();
  const fake = fakePlaywright({ failPrimary: true });
  const scenario = modalScenariosForCell('chromium')[0];
  await assert.rejects(
    runModalCell(
      {
        cellId: 'chromium',
        fixtures: new Map([['19.2.8', { clientHtmlPath: '/owned/index.html' }]]),
        playwright: fake.playwright,
        scenario,
      },
      {
        async startServer() {
          return {
            url: 'http://127.0.0.1:43123/',
            async close() {
              fake.calls.push('cleanup:server');
            },
          };
        },
      },
    ),
    /synthetic browser failure/u,
  );
  for (const cleanup of [
    'cleanup:fixture',
    'cleanup:page',
    'cleanup:context',
    'cleanup:browser',
    'cleanup:server',
  ]) {
    assert.equal(fake.calls.includes(cleanup), true, cleanup);
  }
});
