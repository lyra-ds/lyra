import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MODAL_SCENARIOS } from '../../contracts/modal.mjs';
import {
  createModalRuntime,
  executeModalBrowserScenario,
  installModalResourceTracker,
} from './runtime.mjs';

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

function fakeElement(attributes = {}, options = {}) {
  const values = new Map(Object.entries(attributes));
  return {
    disabled: options.disabled === true,
    hidden: options.hidden === true,
    inert: options.inert === true,
    isConnected: options.isConnected !== false,
    textContent: options.textContent ?? '',
    value: options.value,
    click() {
      options.actions?.push({ type: 'click', target: values.get('data-modal-control') });
      options.onEvent?.({ type: 'click' });
    },
    dispatchEvent(event) {
      options.actions?.push({
        type: event.type,
        target: values.get('data-modal-control'),
        key: event.key,
      });
      options.onEvent?.(event);
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
    ...(options.onFocus === undefined
      ? {}
      : {
          focus() {
            options.onFocus(this);
          },
        }),
    remove() {
      this.isConnected = false;
      options.actions?.push({ type: 'remove', target: values.get('data-modal-control') });
    },
  };
}

function actualBrowserHarness(
  scenario,
  {
    ariaModal = true,
    dialog = true,
    focusTarget = 'observed-safe-target',
    name = 'Observed workspace',
    events = [{ target: 'observed-panel', type: 'opened' }],
    liveMessage = 'Observed workspace opened',
    portal = true,
    resourceSnapshot,
    resources = ['background-inert-active'],
  } = {},
) {
  const actions = [];
  const title = fakeElement({ id: 'observed-title' }, { textContent: name });
  const description = fakeElement(
    { id: 'observed-description' },
    { textContent: 'Observed description' },
  );
  const panel = fakeElement(
    {
      role: 'dialog',
      'data-modal-id': 'observed-panel',
      'aria-labelledby': 'observed-title',
      'aria-describedby': 'observed-description',
      ...(ariaModal ? { 'aria-modal': 'true' } : {}),
    },
    { isConnected: dialog },
  );
  let activeElement = fakeElement({ 'data-modal-id': focusTarget });
  const opener = fakeElement({ 'data-fixture-control': 'opener' });
  const backdrop = fakeElement({
    'data-fixture-part': 'backdrop',
    'data-modal-id': 'modal-backdrop',
  });
  const childControl = fakeElement({ 'data-modal-id': 'child-modal-safe-target' });
  const fixtureRoot = fakeElement({ 'data-modal-fixture-root': '' });
  const live = fakeElement({ 'aria-live': 'polite' }, { textContent: liveMessage });
  const portalElement = fakeElement(
    { 'data-modal-id': 'observed-portal', 'data-modal-portal': '' },
    { isConnected: portal },
  );
  const controls = new Map();
  for (const { operation, target } of scenario.operations) {
    let control;
    control = fakeElement(
      { 'data-modal-control': target, 'data-modal-operation': operation, 'data-modal-id': target },
      {
        actions,
        ...(/declare-safe|summary-fallback/iu.test(target)
          ? { onFocus: () => (activeElement = control) }
          : {}),
      },
    );
    controls.set(`${operation}:${target}`, control);
  }
  controls.set('panel:modal-panel', panel);
  const document = {
    get activeElement() {
      return activeElement;
    },
    documentElement: { dir: '' },
    defaultView: {
      ...(resourceSnapshot === undefined
        ? {}
        : {
            __LYRA_MODAL_RESOURCE_TRACKER__: {
              snapshot: () => structuredClone(resourceSnapshot),
            },
          }),
      Event: class {
        constructor(type, init = {}) {
          this.type = type;
          Object.assign(this, init);
          this.defaultPrevented = false;
        }
        preventDefault() {
          this.defaultPrevented = true;
        }
      },
    },
    getElementById(id) {
      return { 'observed-title': title, 'observed-description': description }[id] ?? null;
    },
    querySelector(selector) {
      const operation = /data-modal-operation="([^"]+)"/u.exec(selector)?.[1];
      const target = /data-modal-control="([^"]+)"/u.exec(selector)?.[1];
      if (operation !== undefined && target !== undefined) {
        return controls.get(`${operation}:${target}`) ?? null;
      }
      if (target !== undefined) {
        return [...controls.entries()].find(([key]) => key.endsWith(`:${target}`))?.[1] ?? null;
      }
      if (selector === '[data-modal-panel]') return dialog ? panel : null;
      if (selector === '[data-fixture-control="opener"]') return opener;
      if (selector === '[data-fixture-part="backdrop"]') return backdrop;
      if (selector === '[data-modal-id="child-modal-safe-target"]') return childControl;
      if (selector === '[data-modal-fixture-root]') return fixtureRoot;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '[role="dialog"], [role="alertdialog"]') return dialog ? [panel] : [];
      if (selector === '[data-modal-id]') {
        return [...(dialog ? [panel] : []), ...(portal ? [portalElement] : [])];
      }
      if (selector === '[aria-live]') return liveMessage === '' ? [] : [live];
      if (selector === '[data-modal-portal]') return portal ? [portalElement] : [];
      return [];
    },
  };
  const runtime = createModalRuntime(requestFor(scenario));
  const fixture = {
    ...runtime,
    observe() {
      return { ...runtime.observe(), events: structuredClone(events), cleanup: [...resources] };
    },
  };
  return { actions, document, fixture };
}

async function runSharedScenario(scenario, inputScenario = scenario, options = {}) {
  const request = requestFor(scenario);
  const harness = actualBrowserHarness(scenario, options);
  return executeModalBrowserScenario({
    document: harness.document,
    fixture: harness.fixture,
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

test('tracks actual browser listeners and timers without claimed release markers', () => {
  let nextTimer = 0;
  const timers = new Map();
  class FakeEventTarget {
    listeners = [];
    addEventListener(type, listener, options) {
      this.listeners.push({ type, listener, options });
    }
    removeEventListener(type, listener) {
      this.listeners = this.listeners.filter(
        (entry) => entry.type !== type || entry.listener !== listener,
      );
    }
  }
  const scope = {
    EventTarget: FakeEventTarget,
    clearInterval(handle) {
      timers.delete(handle);
    },
    clearTimeout(handle) {
      timers.delete(handle);
    },
    setInterval(callback) {
      const handle = ++nextTimer;
      timers.set(handle, callback);
      return handle;
    },
    setTimeout(callback) {
      const handle = ++nextTimer;
      timers.set(handle, callback);
      return handle;
    },
  };
  const tracker = installModalResourceTracker(scope);
  const target = new FakeEventTarget();
  const listener = () => {};
  target.addEventListener('keydown', listener);
  const timeout = scope.setTimeout(() => {}, 10);
  const interval = scope.setInterval(() => {}, 10);
  assert.deepEqual(tracker.snapshot(), { listeners: 1, timers: 2 });
  target.removeEventListener('keydown', listener);
  scope.clearTimeout(timeout);
  scope.clearInterval(interval);
  assert.deepEqual(tracker.snapshot(), { listeners: 0, timers: 0 });
  tracker.restore();
});

test('the shared driver dispatches every immutable modal scenario through real controls', async (t) => {
  assert.equal(MODAL_SCENARIOS.length, 17);
  for (const scenario of MODAL_SCENARIOS) {
    await t.test(scenario.scenarioId, async () => {
      const observation = await runSharedScenario(scenario, scenario, {
        name: `Observed ${scenario.scenarioId}`,
      });
      assert.equal(observation.diagnostics.executor, 'shared-browser-driver');
      assert.deepEqual(observation.diagnostics.operations, scenario.operations);
      assert.deepEqual(
        observation.diagnostics.actions.map(({ operation, target }) => ({ operation, target })),
        scenario.operations,
      );
      assert.deepEqual(observation.roles, [
        { role: 'dialog', name: `Observed ${scenario.scenarioId}` },
      ]);
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
  assert.deepEqual(changed.roles, [{ role: 'dialog', name: 'Observed workspace' }]);
  assert.deepEqual(changed.focus, { target: 'focusable-summary-fallback-case' });
});

test('the browser observer changes evidence when rendered behavior is faulty', async () => {
  const scenario = MODAL_SCENARIOS[0];
  const baseline = await runSharedScenario(scenario);
  const missingSemantics = await runSharedScenario(scenario, scenario, {
    ariaModal: false,
    name: '',
  });
  const wrongFocus = await runSharedScenario(scenario, scenario, {
    focusTarget: 'wrong-focus-target',
  });
  const noDialog = await runSharedScenario(scenario, scenario, {
    dialog: false,
    events: [],
  });
  const cleanupLeak = await runSharedScenario(scenario, scenario, {
    portal: true,
    resources: ['listener-leak', 'portal-leak'],
  });
  assert.deepEqual(baseline.roles, [{ role: 'dialog', name: 'Observed workspace' }]);
  assert.equal(
    baseline.states.some(
      ({ target, name, value }) =>
        target === 'observed-panel' && name === 'aria-modal' && value === true,
    ),
    true,
  );
  assert.deepEqual(missingSemantics.roles, []);
  assert.equal(
    missingSemantics.states.some(({ name, value }) => name === 'aria-modal' && value === false),
    true,
  );
  assert.deepEqual(wrongFocus.focus, { target: 'wrong-focus-target' });
  assert.deepEqual(noDialog.roles, []);
  assert.deepEqual(noDialog.events, []);
  assert.deepEqual(cleanupLeak.cleanup, ['listener-leak', 'portal-leak']);
});

test('browser observations include actual listener and timer resource counts', async () => {
  const observation = await runSharedScenario(MODAL_SCENARIOS[0], undefined, {
    resourceSnapshot: { listeners: 3, timers: 2 },
  });
  assert.equal(
    observation.states.some(
      ({ target, name, value }) =>
        target === 'modal-listeners' && name === 'remaining-count' && value === 3,
    ),
    true,
  );
  assert.equal(
    observation.states.some(
      ({ target, name, value }) =>
        target === 'modal-timers' && name === 'remaining-count' && value === 2,
    ),
    true,
  );
});

test('pointer, focus-wrap, controlled-commit, and portal faults remain visible', async () => {
  const bySuffix = (suffix) =>
    MODAL_SCENARIOS.find(({ scenarioId }) => scenarioId.endsWith(`.${suffix}.v1`));
  const pointerClosed = await runSharedScenario(bySuffix('pointer-origin-dismiss'), undefined, {
    dialog: false,
    events: [{ target: 'observed-panel', type: 'outside-close-requested' }],
  });
  const pointerFault = await runSharedScenario(bySuffix('pointer-origin-dismiss'), undefined, {
    dialog: true,
    events: [],
  });
  assert.deepEqual(pointerClosed.roles, []);
  assert.deepEqual(pointerClosed.events, [
    { target: 'observed-panel', type: 'outside-close-requested' },
  ]);
  assert.deepEqual(pointerFault.roles, [{ role: 'dialog', name: 'Observed workspace' }]);
  assert.deepEqual(pointerFault.events, []);

  const wrapped = await runSharedScenario(bySuffix('focus-wrap-dynamic'), undefined, {
    focusTarget: 'first-focus-target',
  });
  const noWrap = await runSharedScenario(bySuffix('focus-wrap-dynamic'), undefined, {
    focusTarget: 'last-focus-target',
  });
  assert.deepEqual(wrapped.focus, { target: 'first-focus-target' });
  assert.deepEqual(noWrap.focus, { target: 'last-focus-target' });

  const committed = await runSharedScenario(bySuffix('controlled-close-commit'), undefined, {
    dialog: false,
  });
  const missingCommit = await runSharedScenario(bySuffix('controlled-close-commit'), undefined, {
    dialog: true,
  });
  assert.deepEqual(committed.roles, []);
  assert.deepEqual(missingCommit.roles, [{ role: 'dialog', name: 'Observed workspace' }]);

  const orphan = await runSharedScenario(bySuffix('parent-close-with-child'), undefined, {
    dialog: false,
    portal: true,
  });
  assert.equal(
    orphan.states.some(({ name, value }) => name === 'orphaned' && value === true),
    true,
  );
});

test('the driver performs nuanced pointer, direction, hydration, and cleanup phases', async () => {
  const bySuffix = (suffix) =>
    MODAL_SCENARIOS.find(({ scenarioId }) => scenarioId.endsWith(`.${suffix}.v1`));
  const nested = await runSharedScenario(bySuffix('nested-topmost'));
  assert.deepEqual(
    nested.diagnostics.actions
      .filter(({ operation }) => operation === 'setDirection')
      .map(({ target }) => target),
    ['ltr', 'rtl'],
  );
  const validation = await runSharedScenario(bySuffix('validation-initial-focus'));
  assert.deepEqual(
    validation.diagnostics.actions
      .flatMap(({ mutations = [] }) => mutations)
      .filter(({ name }) => ['invalid-field-enabled', 'validation-summary-focused'].includes(name)),
    [
      { name: 'invalid-field-enabled', changed: true },
      { name: 'validation-summary-focused', changed: true },
    ],
  );
  assert.deepEqual(validation.focus, { target: 'focusable-summary-fallback-case' });
  const pointer = await runSharedScenario(bySuffix('pointer-origin-dismiss'));
  assert.deepEqual(
    pointer.diagnostics.actions
      .filter(({ operation }) => operation === 'point')
      .map(({ target, events, surfaces }) => [target, events, surfaces]),
    [
      ['outside-down-up', ['pointerdown', 'pointerup'], ['modal-backdrop', 'modal-backdrop']],
      ['outside-drag-inside', ['pointerdown', 'pointerup'], ['modal-backdrop', 'observed-panel']],
      ['outside-cancel', ['pointerdown', 'pointercancel'], ['modal-backdrop', 'modal-backdrop']],
      ['outside-context-menu', ['contextmenu'], ['modal-backdrop']],
      [
        'child-interaction',
        ['pointerdown', 'pointerup'],
        ['child-modal-safe-target', 'child-modal-safe-target'],
      ],
      [
        'outside-prevented-default',
        ['pointerdown', 'pointerup'],
        ['modal-backdrop', 'modal-backdrop'],
      ],
    ],
  );
  const controlled = await runSharedScenario(bySuffix('controlled-close-commit'));
  assert.deepEqual(
    controlled.diagnostics.actions.map(({ target }) => target),
    ['controlled-modal', 'dismiss-control', 'controlled-close-commit'],
  );
  const successor = await runSharedScenario(bySuffix('opener-restoration-successor'));
  const disconnect = successor.diagnostics.actions.find(
    ({ operation, target }) => operation === 'updateContent' && target === 'disconnect-opener',
  );
  assert.deepEqual(disconnect.mutations, [{ name: 'opener-disconnected', changed: true }]);
  const focusedRemoval = await runSharedScenario(bySuffix('focused-node-removal'));
  assert.equal(
    focusedRemoval.diagnostics.actions
      .flatMap(({ mutations = [] }) => mutations)
      .some(({ name, changed }) => name === 'focused-target-removed' && changed === true),
    true,
  );
  const hydration = await runSharedScenario(bySuffix('hydration-stability'));
  assert.equal(hydration.diagnostics.hydrate, true);
  assert.equal(
    hydration.diagnostics.actions
      .flatMap(({ mutations = [] }) => mutations)
      .some(({ name, changed }) => name === 'hydration-tree-inspected' && changed === true),
    true,
  );
  const cleanup = await runSharedScenario(bySuffix('unmount-cleanup'));
  assert.deepEqual(
    cleanup.diagnostics.actions
      .filter(({ operation }) => operation === 'destroy')
      .map(({ target }) => target),
    ['entry-phase-modal', 'open-phase-modal', 'exit-phase-modal'],
  );
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
  const harness = actualBrowserHarness(request.scenario, { name: 'Mounted hydration' });
  const fixture = harness.fixture;
  const container = { hasChildNodes: () => true };
  const fixtureDocument = {
    ...harness.document,
    querySelector(selector) {
      if (selector === '[data-modal-fixture-root]') return container;
      return harness.document.querySelector(selector);
    },
  };
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
    document: fixtureDocument,
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
  assert.deepEqual(observation.roles, [{ role: 'dialog', name: 'Mounted hydration' }]);
  assert.deepEqual(observation.focus, { target: 'observed-safe-target' });
  assert.equal(observation.diagnostics.hydrate, true);
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
