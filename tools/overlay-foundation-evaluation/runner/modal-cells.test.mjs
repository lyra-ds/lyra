import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { MODAL_WAVE_CELLS, modalScenariosForCell } from '../contracts/modal.mjs';
import {
  createModalRuntime,
  mountModalFixtureClient,
  observeModalSsrMarkup,
} from '../fixtures/modal/runtime.mjs';
import { modalScenarioObservationMarkers } from '../fixtures/modal/scenario-interpreter.mjs';

const modulePath = new URL('./modal-cells.mjs', import.meta.url);

async function loadCells() {
  return import(modulePath);
}

function renderedSsrEvidence(request) {
  const server = request.scenario.scenarioId.endsWith('.ssr-open-semantics.v1');
  const title = server ? 'Server workspace' : 'Hydrated workspace';
  const source = server ? 'server-rendered-modal' : 'hydrated-modal';
  const titleId = server ? 'server-modal-title' : 'hydrated-modal-title';
  const html = `<section role="dialog" data-modal-observation-id="${source}" aria-labelledby="${titleId}"><h2 id="${titleId}">${title}</h2></section>`;
  return { html, observation: observeModalSsrMarkup({ request, html }) };
}

function neutralBrowserDocument(scenario, { hydrate = false } = {}) {
  const target = {
    click() {},
    dispatchEvent() {
      return true;
    },
  };
  const container = { hasChildNodes: () => hydrate };
  return {
    activeElement: null,
    documentElement: { dir: '' },
    getElementById: () => null,
    querySelector: (selector) => (selector === '[data-modal-fixture-root]' ? container : target),
    querySelectorAll: (selector) =>
      selector === '[data-modal-observation-kind]'
        ? modalScenarioObservationMarkers(scenario).map(({ kind, index, value }) => ({
            getAttribute(name) {
              return {
                'data-modal-observation-kind': kind,
                'data-modal-observation-index': String(index),
                'data-modal-observation-value': JSON.stringify(value),
              }[name];
            },
          }))
        : [],
  };
}

async function sharedBridge(
  request,
  { cleanupStatus = 'destroyed', observation, renderMode } = {},
) {
  const fixture = createModalRuntime(request);
  const hydrate =
    (renderMode ?? (request.cell.id === 'hydration' ? 'hydrateRoot' : 'createRoot')) ===
    'hydrateRoot';
  const document = neutralBrowserDocument(request.scenario, { hydrate });
  const mounted = await mountModalFixtureClient({
    React: {
      createElement(_type, props) {
        return { props };
      },
    },
    axe: { run: async () => ({ violations: [] }) },
    createModalCandidate: async () => ({ ModalFixture() {} }),
    createRoot: () => ({
      render(element) {
        element.props.onReady(fixture);
      },
      unmount() {},
    }),
    document,
    hydrateRoot(_container, element) {
      element.props.onReady(fixture);
      return { unmount() {} };
    },
    request,
  });
  if (observation === undefined && cleanupStatus === 'destroyed') return mounted;
  return {
    ...mounted,
    runScenario: (input) =>
      observation === undefined ? mounted.runScenario(input) : structuredClone(observation),
    cleanup: () => (cleanupStatus === 'destroyed' ? mounted.cleanup() : { status: cleanupStatus }),
  };
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
              let request;
              let bridge;
              return {
                async addInitScript(callback, input) {
                  calls.push(['init-request', input.cell.id, input.scenario.scenarioId]);
                  const previous = globalThis.__LYRA_MODAL_FIXTURE_REQUEST__;
                  try {
                    callback(input);
                    request = structuredClone(globalThis.__LYRA_MODAL_FIXTURE_REQUEST__);
                  } finally {
                    if (previous === undefined) delete globalThis.__LYRA_MODAL_FIXTURE_REQUEST__;
                    else globalThis.__LYRA_MODAL_FIXTURE_REQUEST__ = previous;
                  }
                },
                async goto(url) {
                  calls.push(['goto', url]);
                  bridge = await sharedBridge(request);
                },
                async evaluate(callback, input) {
                  if (input === undefined) calls.push('cleanup:fixture');
                  else calls.push(['evaluate', input.cell.id, input.scenario.scenarioId]);
                  const previousDocument = globalThis.document;
                  const previousBridge = globalThis.__LYRA_MODAL_FIXTURE__;
                  globalThis.document = neutralBrowserDocument(request.scenario);
                  globalThis.__LYRA_MODAL_FIXTURE__ = bridge;
                  try {
                    if (failPrimary && input !== undefined) {
                      throw new Error('synthetic browser failure');
                    }
                    return await callback(input);
                  } finally {
                    if (previousDocument === undefined) delete globalThis.document;
                    else globalThis.document = previousDocument;
                    if (previousBridge === undefined) delete globalThis.__LYRA_MODAL_FIXTURE__;
                    else globalThis.__LYRA_MODAL_FIXTURE__ = previousBridge;
                  }
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

async function ssrFixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'lyra-modal-cell-ssr-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const ssrPath = join(root, 'entry-server.mjs');
  await writeFile(
    ssrPath,
    `export async function renderModalFixture(request) {
  const title = request.scenario.scenarioId.includes('ssr-open-semantics')
    ? 'Server workspace'
    : 'Hydrated workspace';
  const source = request.scenario.scenarioId.includes('ssr-open-semantics')
    ? 'server-rendered-modal'
    : 'hydrated-modal';
  const titleId = request.scenario.scenarioId.includes('ssr-open-semantics')
    ? 'server-modal-title'
    : 'hydrated-modal-title';
  return '<section role="dialog" data-modal-observation-id="' + source
    + '" aria-labelledby="' + titleId + '"><h2 id="' + titleId + '">'
    + title + '</h2><input value="Workspace draft"></section>';
}
`,
  );
  return { clientHtmlPath: join(root, 'index.html'), ssrPath };
}

function executingPlaywright({
  renderMode = 'createRoot',
  cleanupStatus = 'destroyed',
  observation,
} = {}) {
  const calls = [];
  let request;
  let bridge;
  const playwright = {
    chromium: {
      async launch() {
        return {
          async newContext(options) {
            calls.push(['context', structuredClone(options)]);
            return {
              async newPage() {
                return {
                  async addInitScript(callback, input) {
                    const previous = globalThis.__LYRA_MODAL_FIXTURE_REQUEST__;
                    try {
                      callback(input);
                      request = structuredClone(globalThis.__LYRA_MODAL_FIXTURE_REQUEST__);
                    } finally {
                      if (previous === undefined) delete globalThis.__LYRA_MODAL_FIXTURE_REQUEST__;
                      else globalThis.__LYRA_MODAL_FIXTURE_REQUEST__ = previous;
                    }
                  },
                  async goto(url) {
                    calls.push(['goto', url]);
                    const actual = await sharedBridge(request, {
                      cleanupStatus,
                      observation,
                      renderMode,
                    });
                    bridge = {
                      ...actual,
                      async runScenario(input) {
                        calls.push(['run-scenario', structuredClone(input)]);
                        return actual.runScenario(input);
                      },
                      async runAxe() {
                        calls.push(['run-axe', request.cell.colorScheme]);
                        return actual.runAxe();
                      },
                      async cleanup() {
                        calls.push(['cleanup-bridge', cleanupStatus]);
                        return actual.cleanup();
                      },
                    };
                  },
                  async evaluate(callback, input) {
                    const previousDocument = globalThis.document;
                    const previousBridge = globalThis.__LYRA_MODAL_FIXTURE__;
                    globalThis.document = { documentElement: { dir: '' } };
                    globalThis.__LYRA_MODAL_FIXTURE__ = bridge;
                    try {
                      return await callback(input);
                    } finally {
                      if (previousDocument === undefined) delete globalThis.document;
                      else globalThis.document = previousDocument;
                      if (previousBridge === undefined) delete globalThis.__LYRA_MODAL_FIXTURE__;
                      else globalThis.__LYRA_MODAL_FIXTURE__ = previousBridge;
                    }
                  },
                  async close() {},
                };
              },
              async close() {},
            };
          },
          async close() {},
        };
      },
    },
  };
  return { calls, playwright };
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
  assert.equal(observations[0].reactVersion, '19.2.8');
  assert.deepEqual(
    Object.fromEntries(
      ['roles', 'relationships', 'states', 'focus', 'events', 'announcements', 'cleanup'].map(
        (key) => [key, observations[0].observation[key]],
      ),
    ),
    scenario.expected,
  );
  assert.equal(observations[0].observation.diagnostics.executor, 'shared-neutral-interpreter');
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
    {
      executeSsr: async ({ request }) => renderedSsrEvidence(request),
    },
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
      executeSsr: async ({ request }) => renderedSsrEvidence(request),
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

test('default SSR executor derives the complete observation from rendered markup', async (t) => {
  const { runModalCell } = await loadCells();
  const scenario = modalScenariosForCell('ssr')[0];
  const fixture = await ssrFixture(t);
  const result = await runModalCell({
    cellId: 'ssr',
    fixtures: new Map([['19.2.8', fixture]]),
    playwright: {},
    scenario,
  });
  assert.deepEqual(
    Object.fromEntries(
      ['roles', 'relationships', 'states', 'focus', 'events', 'announcements', 'cleanup'].map(
        (key) => [key, result[0].observation[key]],
      ),
    ),
    scenario.expected,
  );
});

test('hydrates actual server markup and passes the literal scenario and cell modes to the bridge', async (t) => {
  const { runModalCell } = await loadCells();
  const scenario = modalScenariosForCell('hydration')[0];
  const fixture = await ssrFixture(t);
  const fake = executingPlaywright({ renderMode: 'hydrateRoot' });
  const serverInputs = [];
  const results = await runModalCell(
    {
      cellId: 'hydration',
      fixtures: new Map([
        ['18.3.1', fixture],
        ['19.2.8', fixture],
      ]),
      playwright: fake.playwright,
      scenario,
    },
    {
      async startServer(input) {
        serverInputs.push(input);
        return { url: 'http://127.0.0.1:43123/', close: async () => {} };
      },
    },
  );
  assert.equal(serverInputs.length, 2);
  assert.equal(
    serverInputs.every(({ initialMarkup }) => /Hydrated workspace/u.test(initialMarkup)),
    true,
  );
  assert.equal(
    fake.calls
      .filter(([name]) => name === 'run-scenario')
      .every(([, input]) => input.hydrate === true && input.cell.id === 'hydration'),
    true,
  );
  assert.deepEqual(
    results.map(({ reactVersion }) => reactVersion),
    ['18.3.1', '19.2.8'],
  );
});

test('runs axe in light and dark cells and never requests synthesized hover for coarse pointer', async () => {
  const { runModalCell } = await loadCells();
  for (const cellId of ['axe-light', 'axe-dark', 'coarse-pointer']) {
    const scenario = modalScenariosForCell(cellId)[0];
    const fake = executingPlaywright();
    await runModalCell(
      {
        cellId,
        fixtures: new Map([['19.2.8', { clientHtmlPath: '/owned/index.html' }]]),
        playwright: fake.playwright,
        scenario,
      },
      {
        startServer: async () => ({ url: 'http://127.0.0.1:43123/', close: async () => {} }),
      },
    );
    const scenarioInput = fake.calls.find(([name]) => name === 'run-scenario')[1];
    if (cellId.startsWith('axe-')) {
      assert.deepEqual(
        fake.calls.find(([name]) => name === 'run-axe'),
        ['run-axe', cellId === 'axe-light' ? 'light' : 'dark'],
      );
    } else {
      assert.equal(scenarioInput.synthesizeHover, false);
      assert.equal(
        fake.calls.some(([name]) => name === 'run-axe'),
        false,
      );
    }
  }
});

test('treats an unverified fixture cleanup result as run-fatal but accepts already destroyed', async () => {
  const { runModalCell } = await loadCells();
  const scenario = modalScenariosForCell('chromium')[0];
  for (const cleanupStatus of ['missing', 'already-destroyed']) {
    const fake = executingPlaywright({ cleanupStatus });
    const operation = runModalCell(
      {
        cellId: 'chromium',
        fixtures: new Map([['19.2.8', { clientHtmlPath: '/owned/index.html' }]]),
        playwright: fake.playwright,
        scenario,
      },
      {
        startServer: async () => ({ url: 'http://127.0.0.1:43123/', close: async () => {} }),
      },
    );
    if (cleanupStatus === 'missing') {
      await assert.rejects(operation, /cleanup.*uncertain|cleanup result/iu);
    } else {
      await operation;
    }
  }
});

test('tags a malformed default browser observation as structurally run-fatal', async () => {
  const { runModalCell } = await loadCells();
  const scenario = modalScenariosForCell('chromium')[0];
  const fake = executingPlaywright({ observation: { unsupported: true } });
  await assert.rejects(
    runModalCell(
      {
        cellId: 'chromium',
        fixtures: new Map([['19.2.8', { clientHtmlPath: '/owned/index.html' }]]),
        playwright: fake.playwright,
        scenario,
      },
      {
        startServer: async () => ({ url: 'http://127.0.0.1:43123/', close: async () => {} }),
      },
    ),
    (error) =>
      error?.classification === 'policy' &&
      error?.scope === 'run' &&
      /browser observation is invalid/iu.test(error.message),
  );
});

test('tags malformed hydration SSR evidence as structurally run-fatal before browser launch', async () => {
  const { runModalCell } = await loadCells();
  const scenario = modalScenariosForCell('hydration')[0];
  const fake = executingPlaywright({ renderMode: 'hydrateRoot' });
  await assert.rejects(
    runModalCell(
      {
        cellId: 'hydration',
        fixtures: new Map([
          ['18.3.1', { clientHtmlPath: '/owned/react-18/index.html' }],
          ['19.2.8', { clientHtmlPath: '/owned/react-19/index.html' }],
        ]),
        playwright: fake.playwright,
        scenario,
      },
      {
        executeSsr: async () => ({
          html: '<section></section>',
          observation: { unsupported: true },
        }),
        startServer: async () => ({ url: 'http://127.0.0.1:43123/', close: async () => {} }),
      },
    ),
    (error) => error?.classification === 'policy' && error?.scope === 'run',
  );
  assert.equal(
    fake.calls.some(([name]) => name === 'goto'),
    false,
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
