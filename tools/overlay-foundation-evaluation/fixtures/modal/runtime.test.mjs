import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MODAL_SCENARIOS } from '../../contracts/modal.mjs';
import { createModalRuntime } from './runtime.mjs';

const validRequest = {
  schemaVersion: 1,
  scenario: MODAL_SCENARIOS[0],
  cell: {
    id: 'chromium',
    reactVersion: '19.2.8',
    direction: 'ltr',
    colorScheme: 'light',
    forcedColors: false,
    reducedMotion: false,
    coarsePointer: false,
  },
};

test('runtime exposes only the eight Lyra-owned fixture operations', () => {
  const runtime = createModalRuntime(validRequest);
  assert.deepEqual(Object.keys(runtime.operations), [
    'open',
    'close',
    'press',
    'point',
    'setDirection',
    'setMotionPreference',
    'updateContent',
    'destroy',
  ]);
  assert.deepEqual(runtime.request, validRequest);
});

test('an accepted action emits one neutral event and snapshots its resource', () => {
  const runtime = createModalRuntime(validRequest);
  assert.equal(
    runtime.operations.open({
      event: { target: 'modal-panel', type: 'opened' },
      resource: 'background-inert',
    }),
    true,
  );
  const observation = runtime.observe();
  assert.deepEqual(observation.events, [{ target: 'modal-panel', type: 'opened' }]);
  assert.deepEqual(observation.cleanup, ['background-inert']);
  observation.events[0].type = 'changed-after-snapshot';
  assert.deepEqual(runtime.observe().events, [{ target: 'modal-panel', type: 'opened' }]);
});

test('a prevented action leaves state and resources unchanged', () => {
  const runtime = createModalRuntime(validRequest);
  runtime.operations.open({
    event: { target: 'modal-panel', type: 'opened' },
    resource: 'background-inert',
  });
  const before = runtime.observe();
  assert.equal(
    runtime.operations.close({
      prevented: true,
      event: { target: 'modal-panel', type: 'closed' },
      resource: 'focus-restore',
    }),
    false,
  );
  assert.deepEqual(runtime.observe(), before);
});

test('destroy is idempotent and stale callbacks cannot append events', () => {
  const runtime = createModalRuntime(validRequest);
  runtime.operations.open({
    event: { target: 'modal-panel', type: 'opened' },
    resource: 'background-inert',
  });
  const staleCallback = () =>
    runtime.operations.close({ event: { target: 'modal-panel', type: 'late-event' } });
  runtime.destroy();
  const afterFirstDestroy = runtime.observe();
  runtime.destroy();
  assert.deepEqual(runtime.observe(), afterFirstDestroy);
  assert.deepEqual(afterFirstDestroy.cleanup, []);
  assert.equal(staleCallback(), false);
  assert.deepEqual(runtime.observe(), afterFirstDestroy);
  assert.deepEqual(runtime.cleanup(), { status: 'already-destroyed' });
});

test('rejects a vendor fact in an accepted normative event', () => {
  const runtime = createModalRuntime(validRequest);
  assert.equal(
    runtime.operations.open({ event: { target: 'modal-panel', type: 'radix-opened' } }),
    false,
  );
  assert.deepEqual(runtime.observe().events, []);
});

test('derives SSR semantics from actual rendered markup without reading expected records', async () => {
  const { observeModalSsrMarkup } = await import('./runtime.mjs');
  const request = structuredClone(validRequest);
  request.scenario = MODAL_SCENARIOS.find(({ scenarioId }) =>
    scenarioId.endsWith('.ssr-open-semantics.v1'),
  );
  request.cell.id = 'ssr';
  const markup =
    '<section role="dialog" data-modal-observation-id="server-rendered-modal" aria-labelledby="server-modal-title"><h2 id="server-modal-title">Server workspace</h2></section>';
  assert.deepEqual(observeModalSsrMarkup({ request, html: markup }), {
    roles: [{ role: 'dialog', name: 'Server workspace' }],
    relationships: [
      { source: 'server-rendered-modal', name: 'labelled-by', target: 'server-modal-title' },
    ],
    states: [
      { target: 'server-rendered-modal', name: 'semantically-available', value: true },
      { target: 'browser-globals', name: 'accessed', value: false },
    ],
    focus: { target: 'server-document-focus-unchanged' },
    events: [{ target: 'server-rendered-modal', type: 'rendered-open' }],
    announcements: [{ message: 'Server workspace dialog is available' }],
    cleanup: ['no-browser-resource-claims'],
    diagnostics: {},
  });
});

test('client mount selects hydrateRoot for server markup and exposes executable cell context', async () => {
  const { mountModalFixtureClient } = await import('./runtime.mjs');
  const request = structuredClone(validRequest);
  request.scenario = MODAL_SCENARIOS.find(({ scenarioId }) =>
    scenarioId.endsWith('.hydration-stability.v1'),
  );
  request.cell = {
    ...request.cell,
    id: 'hydration',
    direction: 'rtl',
    colorScheme: 'dark',
    forcedColors: true,
    reducedMotion: true,
    coarsePointer: true,
  };
  const calls = [];
  const fixture = {
    cleanup: () => ({ status: 'destroyed' }),
    executeScenario: (input) => {
      calls.push(['execute', structuredClone(input)]);
      return { marker: 'actual observation' };
    },
  };
  const container = { hasChildNodes: () => true };
  const bridge = await mountModalFixtureClient({
    React: {
      createElement(_type, props) {
        return { props };
      },
    },
    axe: {
      async run(target) {
        calls.push(['axe', target]);
        return { violations: [] };
      },
    },
    async createModalCandidate() {
      return { ModalFixture() {} };
    },
    createRoot() {
      throw new Error('createRoot must not run for server markup');
    },
    document: {
      documentElement: { dir: '' },
      querySelector: () => container,
    },
    hydrateRoot(target, element) {
      calls.push(['hydrateRoot', target]);
      element.props.onReady(fixture);
      return { unmount: () => calls.push(['unmount']) };
    },
    request,
  });
  assert.equal(bridge.renderMode, 'hydrateRoot');
  assert.deepEqual(bridge.request, request);
  assert.deepEqual(
    await bridge.runScenario({
      scenario: request.scenario,
      cell: request.cell,
      hydrate: true,
      synthesizeHover: false,
    }),
    { marker: 'actual observation' },
  );
  await bridge.runAxe();
  assert.equal(
    calls.some(([name]) => name === 'hydrateRoot'),
    true,
  );
  assert.equal(
    calls.some(([name]) => name === 'axe'),
    true,
  );
  assert.deepEqual(await bridge.cleanup(), { status: 'destroyed' });
});
