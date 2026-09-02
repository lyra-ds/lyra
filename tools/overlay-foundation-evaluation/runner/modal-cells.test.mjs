import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { runInThisContext } from 'node:vm';

import { MODAL_WAVE_CELLS, modalScenariosForCell } from '../contracts/modal.mjs';
import {
  createModalRuntime,
  mountModalFixtureClient,
  observeModalSsrMarkup,
} from '../fixtures/modal/runtime.mjs';

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

function fakeElement(attributes = {}, { textContent = '' } = {}) {
  const values = new Map(Object.entries(attributes));
  return {
    disabled: false,
    hidden: false,
    inert: false,
    isConnected: true,
    textContent,
    click() {
      this.dispatchEvent(new Event('click'));
    },
    dispatchEvent(event) {
      this.onEvent?.(event);
      return event.defaultPrevented !== true;
    },
    getAttribute(name) {
      return values.get(name) ?? null;
    },
    hasAttribute(name) {
      return values.has(name);
    },
    setAttribute(name, value) {
      values.set(name, String(value));
    },
  };
}

function neutralBrowserDocument(scenario, { hydrate = false } = {}) {
  let rootHasChildren = hydrate;
  let open = false;
  let activeElement;
  const container = { hasChildNodes: () => rootHasChildren };
  const body = fakeElement({ 'data-modal-id': 'document-body' });
  const opener = fakeElement({
    'data-fixture-control': 'opener',
    'data-modal-id': 'modal-opener',
  });
  const focusTarget = fakeElement({ 'data-modal-id': 'browser-focus-target' });
  const childTarget = fakeElement({ 'data-modal-id': 'child-modal-safe-target' });
  const hydrationInput = fakeElement({ 'data-modal-id': 'hydrated-input' });
  const title = fakeElement({ id: 'browser-title' }, { textContent: 'Observed browser fixture' });
  const panel = fakeElement({
    role: 'dialog',
    'data-modal-id': 'modal-panel',
    'aria-labelledby': 'browser-title',
    'aria-modal': 'true',
  });
  const live = fakeElement({ 'aria-live': 'polite' });
  const backdrop = fakeElement({
    'data-fixture-part': 'backdrop',
    'data-modal-id': 'modal-backdrop',
  });
  activeElement = body;
  const events = [];
  const controls = new Map();
  for (const { operation, target } of scenario.operations) {
    const control = fakeElement({
      'data-modal-operation': operation,
      'data-modal-control': target,
      'data-modal-id': target,
      'data-modal-completion-count': '0',
    });
    control.onEvent = () => {
      if (operation === 'open') {
        open = true;
        activeElement = focusTarget;
        events.push({ target: 'modal-panel', type: 'opened' });
        live.textContent = 'Browser fixture active';
      } else if (operation === 'close') {
        open = false;
        activeElement = opener;
        events.push({ target: 'modal-panel', type: 'closed' });
        live.textContent = 'Browser fixture closed';
      }
      const count = Number(control.getAttribute('data-modal-completion-count') ?? '0');
      control.setAttribute('data-modal-completion-count', String(count + 1));
    };
    controls.set(`${operation}:${target}`, control);
  }
  const document = {
    body,
    get activeElement() {
      return activeElement;
    },
    documentElement: { dataset: {}, dir: '' },
    defaultView: { Event },
    getElementById: (id) => (id === 'browser-title' ? title : null),
    querySelector(selector) {
      if (selector === '[data-modal-fixture-root]') return container;
      const operation = /data-modal-operation="([^"]+)"/u.exec(selector)?.[1];
      const target = /data-modal-control="([^"]+)"/u.exec(selector)?.[1];
      if (operation !== undefined && target !== undefined) {
        return controls.get(`${operation}:${target}`) ?? null;
      }
      if (selector === '[data-fixture-control="opener"]') return opener;
      if (selector === '[data-fixture-part="backdrop"]') return backdrop;
      if (selector === '[data-modal-panel]') return open ? panel : null;
      if (selector === '[data-modal-id="child-modal-safe-target"]') return childTarget;
      if (selector === '[data-modal-id="hydrated-input"]') return hydrationInput;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-modal-panel]') return open ? [panel] : [];
      if (selector === '[role="dialog"], [role="alertdialog"]') return open ? [panel] : [];
      if (selector === '[data-modal-id]') {
        return [
          opener,
          focusTarget,
          childTarget,
          hydrationInput,
          backdrop,
          ...(open ? [panel] : []),
        ];
      }
      if (selector === '[aria-live]') return live.textContent === '' ? [] : [live];
      if (selector === '[data-modal-portal]') return open ? [panel] : [];
      return [];
    },
  };
  return {
    document,
    events,
    setRootHasChildren(value) {
      rootHasChildren = value;
      if (!value) open = false;
    },
  };
}

async function sharedBridge(
  request,
  { cleanupStatus = 'destroyed', observation, renderMode } = {},
) {
  const hydrate =
    (renderMode ?? (request.cell.id === 'hydration' ? 'hydrateRoot' : 'createRoot')) ===
    'hydrateRoot';
  const harness = neutralBrowserDocument(request.scenario, { hydrate });
  const document = harness.document;
  const runtime = createModalRuntime(request);
  const fixture = {
    ...runtime,
    observe() {
      const observation = runtime.observe();
      return { ...observation, events: structuredClone(harness.events) };
    },
  };
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
        harness.setRootHasChildren(true);
        element.props.onReady(fixture);
      },
      unmount() {
        harness.setRootHasChildren(false);
      },
    }),
    document,
    hydrateRoot(_container, element) {
      element.props.onReady(fixture);
      return { unmount: () => harness.setRootHasChildren(false) };
    },
    request,
  });
  if (observation === undefined && cleanupStatus === 'destroyed') return mounted;
  return {
    ...mounted,
    async runScenario(input) {
      const actual = await mounted.runScenario(input);
      return observation === undefined ? actual : structuredClone(observation);
    },
    async cleanup() {
      const actual = await mounted.cleanup();
      return cleanupStatus === 'destroyed' ? actual : { ...actual, status: cleanupStatus };
    },
  };
}

function fakePlaywright({
  delayBridge = false,
  delayReadiness = false,
  failPrimary = false,
  serializeCallbacks = false,
} = {}) {
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
              let bridgeReady = false;
              return {
                async addInitScript(callback, input) {
                  calls.push(['init-request', input.cell.id, input.scenario.scenarioId]);
                  const previous = globalThis.__LYRA_MODAL_FIXTURE_REQUEST__;
                  try {
                    const browserCallback = serializeCallbacks
                      ? runInThisContext(`(${callback.toString()})`)
                      : callback;
                    browserCallback(input);
                    request = structuredClone(globalThis.__LYRA_MODAL_FIXTURE_REQUEST__);
                  } finally {
                    if (previous === undefined) delete globalThis.__LYRA_MODAL_FIXTURE_REQUEST__;
                    else globalThis.__LYRA_MODAL_FIXTURE_REQUEST__ = previous;
                  }
                },
                async goto(url) {
                  calls.push(['goto', url]);
                  if (!delayBridge) {
                    const actual = await sharedBridge(request);
                    bridge = {
                      ...actual,
                      get readyStatus() {
                        return bridgeReady ? 'ready' : 'pending';
                      },
                    };
                    bridgeReady = !delayReadiness;
                  }
                },
                async waitForFunction(callback) {
                  calls.push('wait:fixture-bridge');
                  if (bridge === undefined) {
                    const actual = await sharedBridge(request);
                    bridge = {
                      ...actual,
                      get readyStatus() {
                        return bridgeReady ? 'ready' : 'pending';
                      },
                    };
                    bridgeReady = !delayReadiness;
                  }
                  const previousBridge = globalThis.__LYRA_MODAL_FIXTURE__;
                  globalThis.__LYRA_MODAL_FIXTURE__ = bridge;
                  try {
                    const browserCallback = serializeCallbacks
                      ? runInThisContext(`(${callback.toString()})`)
                      : callback;
                    if (delayReadiness && browserCallback()) {
                      throw new Error('runner accepted a pending fixture bridge');
                    }
                    bridgeReady = true;
                    if (!browserCallback()) throw new Error('fixture bridge was not ready');
                  } finally {
                    if (previousBridge === undefined) delete globalThis.__LYRA_MODAL_FIXTURE__;
                    else globalThis.__LYRA_MODAL_FIXTURE__ = previousBridge;
                  }
                },
                async evaluate(callback, input) {
                  if (input === undefined) calls.push('cleanup:fixture');
                  else calls.push(['evaluate', input.cell.id, input.scenario.scenarioId]);
                  const previousDocument = globalThis.document;
                  const previousBridge = globalThis.__LYRA_MODAL_FIXTURE__;
                  globalThis.document = neutralBrowserDocument(request.scenario).document;
                  globalThis.__LYRA_MODAL_FIXTURE__ = bridge;
                  try {
                    if (failPrimary && input !== undefined) {
                      throw new Error('synthetic browser failure');
                    }
                    const browserCallback = serializeCallbacks
                      ? runInThisContext(`(${callback.toString()})`)
                      : callback;
                    return await browserCallback(input);
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
                      readyStatus: 'ready',
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
                  async waitForFunction(callback) {
                    const previousBridge = globalThis.__LYRA_MODAL_FIXTURE__;
                    globalThis.__LYRA_MODAL_FIXTURE__ = bridge;
                    try {
                      if (!callback()) throw new Error('fixture bridge was not ready');
                    } finally {
                      if (previousBridge === undefined) delete globalThis.__LYRA_MODAL_FIXTURE__;
                      else globalThis.__LYRA_MODAL_FIXTURE__ = previousBridge;
                    }
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
  assert.deepEqual(observations[0].observation.roles, [
    { role: 'dialog', name: 'Observed browser fixture' },
  ]);
  assert.deepEqual(observations[0].observation.focus, { target: 'browser-focus-target' });
  assert.equal(observations[0].observation.diagnostics.executor, 'shared-browser-driver');
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
    {
      roles: [{ role: 'dialog', name: 'Server workspace' }],
      relationships: [
        {
          source: 'server-rendered-modal',
          name: 'labelled-by',
          target: 'server-modal-title',
        },
      ],
      states: [
        { target: 'server-rendered-modal', name: 'semantically-available', value: true },
        { target: 'browser-globals', name: 'accessed', value: false },
      ],
      focus: { target: 'server-document-focus-unchanged' },
      events: [{ target: 'server-rendered-modal', type: 'rendered-open' }],
      announcements: [{ message: 'Server workspace dialog is available' }],
      cleanup: ['no-browser-resource-claims'],
    },
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
      .every(
        ([, input]) =>
          input.hydrate === true &&
          input.cell.id === 'hydration' &&
          !Object.hasOwn(input.scenario, 'expected'),
      ),
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

test('returns the browser observation produced after fixture and root cleanup', async () => {
  const { runModalCell } = await loadCells();
  const scenario = modalScenariosForCell('chromium')[0];
  const fake = fakePlaywright();
  const observations = await runModalCell(
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
  assert.equal(observations[0].observation.diagnostics.cleanupObserved, true);
  assert.equal(observations[0].observation.trace.at(-1).phase, 'after-cleanup');
});

test('browser callbacks execute without access to Node module closures', async () => {
  const { runModalCell } = await loadCells();
  const scenario = modalScenariosForCell('chromium')[0];
  const fake = fakePlaywright({ serializeCallbacks: true });
  const observations = await runModalCell(
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
  assert.equal(observations[0].observation.diagnostics.cleanupObserved, true);
});

test('waits for asynchronous candidate module initialization before browser execution', async () => {
  const { runModalCell } = await loadCells();
  const scenario = modalScenariosForCell('chromium')[0];
  const fake = fakePlaywright({ delayBridge: true });
  const observations = await runModalCell(
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
  assert.equal(fake.calls.includes('wait:fixture-bridge'), true);
  assert.equal(observations[0].observation.diagnostics.executionCompleted, true);
});

test('waits for the candidate fixture readiness signal before browser execution', async () => {
  const { runModalCell } = await loadCells();
  const scenario = modalScenariosForCell('chromium')[0];
  const fake = fakePlaywright({ delayReadiness: true });
  const observations = await runModalCell(
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
  assert.equal(observations[0].observation.diagnostics.executionCompleted, true);
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
