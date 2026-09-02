import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MODAL_SCENARIOS } from '../../contracts/modal.mjs';
import { createModalRuntime, executeModalBrowserScenario } from './runtime.mjs';
import { modalScenarioObservationMarkers } from './scenario-interpreter.mjs';

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

function requestFor(scenario) {
  return {
    ...structuredClone(validRequest),
    scenario,
    cell: {
      ...validRequest.cell,
      id: scenario.requiredCells[0],
      direction: scenario.initial.state.direction ?? 'ltr',
      coarsePointer: scenario.initial.state.pointerMode === 'coarse',
      reducedMotion: scenario.initial.state.motionPreference === 'reduced-motion',
    },
  };
}

function neutralBrowserDocument(scenario) {
  const target = {
    click() {},
    dispatchEvent() {
      return true;
    },
  };
  return {
    activeElement: {
      getAttribute() {
        return null;
      },
    },
    documentElement: { dir: '' },
    getElementById() {
      return null;
    },
    querySelector() {
      return target;
    },
    querySelectorAll(selector) {
      if (selector !== '[data-modal-observation-kind]') return [];
      return modalScenarioObservationMarkers(scenario).map(({ kind, index, value }) => ({
        getAttribute(name) {
          return {
            'data-modal-observation-kind': kind,
            'data-modal-observation-index': String(index),
            'data-modal-observation-value': JSON.stringify(value),
          }[name];
        },
      }));
    },
  };
}

async function runSharedScenario(scenario, inputScenario = scenario) {
  const request = requestFor(scenario);
  const runtime = createModalRuntime(request);
  return executeModalBrowserScenario({
    document: neutralBrowserDocument(scenario),
    fixture: runtime,
    input: {
      scenario: inputScenario,
      cell: request.cell,
      hydrate: scenario.scenarioId.endsWith('.hydration-stability.v1'),
      synthesizeHover: false,
    },
    request,
  });
}

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

test('the shared neutral interpreter executes every immutable modal scenario', async (t) => {
  assert.equal(MODAL_SCENARIOS.length, 17);
  for (const scenario of MODAL_SCENARIOS) {
    await t.test(scenario.scenarioId, async () => {
      const observation = await runSharedScenario(scenario);
      assert.deepEqual(
        Object.fromEntries(
          ['roles', 'relationships', 'states', 'focus', 'events', 'announcements', 'cleanup'].map(
            (key) => [key, observation[key]],
          ),
        ),
        scenario.expected,
      );
      assert.equal(observation.diagnostics.executor, 'shared-neutral-interpreter');
      assert.deepEqual(observation.diagnostics.operations, scenario.operations);
    });
  }
});

test('shared observations do not change when only expected records change', async () => {
  const scenario = MODAL_SCENARIOS.find(({ scenarioId }) =>
    scenarioId.endsWith('.validation-initial-focus.v1'),
  );
  const changedExpected = structuredClone(scenario);
  changedExpected.expected.focus.target = 'deliberately-wrong-focus-target';
  changedExpected.expected.states[0].value = false;
  const baseline = await runSharedScenario(scenario);
  const changed = await runSharedScenario(scenario, changedExpected);
  assert.deepEqual(changed, baseline);
  assert.notDeepEqual(
    Object.fromEntries(
      ['roles', 'relationships', 'states', 'focus', 'events', 'announcements', 'cleanup'].map(
        (key) => [key, changed[key]],
      ),
    ),
    changedExpected.expected,
  );
});

test('shared interpreter preserves nuanced ordered modal behaviors', async () => {
  const bySuffix = (suffix) =>
    MODAL_SCENARIOS.find(({ scenarioId }) => scenarioId.endsWith(`.${suffix}.v1`));
  const validations = await runSharedScenario(bySuffix('validation-initial-focus'));
  assert.deepEqual(validations.events, [
    { target: 'first-invalid-enabled-field', type: 'validation-initial-focus-applied' },
    { target: 'focusable-validation-summary', type: 'validation-initial-focus-applied' },
  ]);
  const nested = await runSharedScenario(bySuffix('nested-topmost'));
  assert.deepEqual(
    nested.events.filter(({ type }) => type === 'focus-restored').map(({ target }) => target),
    ['ltr-parent-modal-safe-target', 'rtl-parent-modal-safe-target'],
  );
  const successor = await runSharedScenario(bySuffix('opener-restoration-successor'));
  assert.equal(
    successor.states.some(
      ({ target, name, value }) =>
        target === 'disconnected-opener' && name === 'connected' && value === false,
    ),
    true,
  );
  const pointer = await runSharedScenario(bySuffix('pointer-origin-dismiss'));
  assert.equal(pointer.states.filter(({ name, value }) => name === 'dismisses' && value).length, 1);
  const controlled = await runSharedScenario(bySuffix('controlled-close-commit'));
  assert.deepEqual(
    controlled.events.map(({ type }) => type),
    ['close-requested-once', 'controlled-close-committed'],
  );
  const hydration = await runSharedScenario(bySuffix('hydration-stability'));
  assert.equal(hydration.focus.target, 'pre-hydration-focus-target');
  const cleanup = await runSharedScenario(bySuffix('unmount-cleanup'));
  assert.equal(cleanup.cleanup.length, 6);
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
  const fixture = createModalRuntime(request);
  const eventTarget = {
    dispatchEvent() {
      return true;
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
      activeElement: null,
      documentElement: { dir: '' },
      getElementById: () => null,
      querySelector: (selector) =>
        selector === '[data-modal-fixture-root]' ? container : eventTarget,
      querySelectorAll: (selector) =>
        selector === '[data-modal-observation-kind]'
          ? modalScenarioObservationMarkers(request.scenario).map(({ kind, index, value }) => ({
              getAttribute(name) {
                return {
                  'data-modal-observation-kind': kind,
                  'data-modal-observation-index': String(index),
                  'data-modal-observation-value': JSON.stringify(value),
                }[name];
              },
            }))
          : [],
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
  const observation = await bridge.runScenario({
    scenario: request.scenario,
    cell: request.cell,
    hydrate: true,
    synthesizeHover: false,
  });
  assert.deepEqual(
    Object.fromEntries(
      ['roles', 'relationships', 'states', 'focus', 'events', 'announcements', 'cleanup'].map(
        (key) => [key, observation[key]],
      ),
    ),
    request.scenario.expected,
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
