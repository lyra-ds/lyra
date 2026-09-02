import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MODAL_SCENARIOS } from '../../contracts/modal.mjs';
import { modalExecutionScenario } from './protocol.mjs';
import {
  createModalRuntime,
  executeModalBrowserScenario,
  installModalResourceTracker,
} from './runtime.mjs';

const validRequest = {
  schemaVersion: 1,
  scenario: modalExecutionScenario(MODAL_SCENARIOS[0]),
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
    scenario: modalExecutionScenario(scenario),
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

function behaviorBrowserHarness(
  scenario,
  {
    ignoreOpen = false,
    ignoreOpenFocus = false,
    ignorePointerClose = false,
    missingControl,
    missingControlledCommit = false,
    missingHydrationInput = false,
    noWrap = false,
    portalLeak = false,
    resourceSnapshot,
  } = {},
) {
  const actions = [];
  const events = [];
  const body = fakeElement({ 'data-modal-id': 'document-body' });
  const opener = fakeElement({
    'data-fixture-control': 'opener',
    'data-modal-id': 'modal-opener',
  });
  const safeTarget = fakeElement({ 'data-modal-id': 'modal-safe-target' });
  const firstTarget = fakeElement({ 'data-modal-id': 'first-eligible-target-after-wrap' });
  const firstEligibleTarget = fakeElement({ 'data-modal-id': 'first-eligible-target' });
  const lastEligibleTarget = fakeElement({ 'data-modal-id': 'last-eligible-target' });
  const middleTarget = fakeElement({ 'data-modal-id': 'middle-focus-target' });
  const nearestTarget = fakeElement({ 'data-modal-id': 'nearest-safe-target' });
  const hiddenTarget = fakeElement({ 'data-modal-id': 'hidden-tab-target' });
  const disabledTarget = fakeElement({ 'data-modal-id': 'disabled-tab-target' });
  const removedTarget = fakeElement({ 'data-modal-id': 'removed-tab-target' });
  const childTarget = fakeElement({ 'data-modal-id': 'child-modal-safe-target' });
  const pageScrollTarget = fakeElement({ 'data-modal-id': 'page-scroll-surface' });
  const preventedOutsideTarget = fakeElement(
    { 'data-modal-id': 'outside-prevented-default' },
    {
      actions,
      onEvent(event) {
        if (event.type === 'pointerdown') event.preventDefault();
      },
    },
  );
  const title = fakeElement({ id: 'behavior-title' }, { textContent: 'Behavior workspace' });
  const description = fakeElement(
    { id: 'behavior-description' },
    { textContent: 'Behavior description' },
  );
  const panel = fakeElement({
    role: 'dialog',
    'data-modal-id': 'modal-panel',
    'data-modal-panel': '',
    'data-modal-portal': '',
    'aria-labelledby': 'behavior-title',
    'aria-describedby': 'behavior-description',
    'aria-modal': 'true',
  });
  const childPanel = fakeElement({
    role: 'dialog',
    'aria-label': 'Child workspace',
    'data-modal-id': 'child-modal',
    'data-modal-panel': '',
    'data-modal-portal': '',
    'aria-modal': 'true',
  });
  const live = fakeElement({ 'aria-live': 'polite' });
  let activeElement = body;
  let open = false;
  let nestedOpen = false;
  let pendingControlledClose = false;
  let pointerStartedOutside = false;
  let destroyed = false;

  const focus = (element) => {
    activeElement = element;
  };
  safeTarget.focus = () => focus(safeTarget);
  firstTarget.focus = () => focus(firstTarget);
  firstEligibleTarget.focus = () => focus(firstEligibleTarget);
  lastEligibleTarget.focus = () => focus(lastEligibleTarget);
  middleTarget.focus = () => focus(middleTarget);
  opener.focus = () => focus(opener);
  lastEligibleTarget.dispatchEvent = (event) => {
    actions.push({ type: event.type, target: 'last-eligible-target', key: event.key });
    if (event.type === 'keydown' && !noWrap) {
      focus(firstTarget);
      events.push({ target: 'first-eligible-target', type: 'forward-tab-wrapped' });
    }
    return event.defaultPrevented !== true;
  };
  firstEligibleTarget.dispatchEvent = (event) => {
    actions.push({ type: event.type, target: 'first-eligible-target', key: event.key });
    if (event.type === 'keydown' && event.shiftKey === true && !noWrap) {
      focus(lastEligibleTarget);
      events.push({ target: 'last-eligible-target', type: 'reverse-tab-wrapped' });
    }
    return event.defaultPrevented !== true;
  };
  const complete = (control) => {
    const previous = Number(control.getAttribute('data-modal-completion-count') ?? '0');
    control.setAttribute('data-modal-completion-count', String(previous + 1));
  };
  const openDialog = (target) => {
    if (ignoreOpen) return;
    if (/child|second/iu.test(target)) {
      nestedOpen = true;
      focus(childTarget);
      events.push({ target: 'child-modal', type: 'opened' });
      return;
    }
    open = true;
    if (!ignoreOpenFocus) focus(safeTarget);
    events.push({ target: 'modal-panel', type: 'opened' });
    live.textContent = 'Behavior workspace dialog opened';
  };
  const closeDialog = (type = 'closed', target = 'modal-panel') => {
    if (/child|second/iu.test(target)) {
      nestedOpen = false;
      focus(safeTarget);
      events.push({ target: 'child-modal', type });
      return;
    }
    open = false;
    nestedOpen = false;
    focus(opener);
    events.push({ target: 'modal-panel', type });
    live.textContent = 'Behavior workspace dialog closed';
  };
  safeTarget.dispatchEvent = (event) => {
    actions.push({ type: event.type, target: 'modal-safe-target', key: event.key });
    if (event.type === 'keydown' && event.key === 'Escape') {
      if (nestedOpen) closeDialog('closed', 'child-modal');
      else if (scenario.initial.state.controlled === true) {
        pendingControlledClose = true;
        events.push({ target: 'controlled-modal', type: 'close-requested-once' });
      } else closeDialog();
    }
    return event.defaultPrevented !== true;
  };
  childTarget.dispatchEvent = (event) => {
    actions.push({ type: event.type, target: 'child-modal-safe-target', key: event.key });
    if (event.type === 'keydown' && event.key === 'Escape') {
      closeDialog('closed', 'child-modal');
    }
    return event.defaultPrevented !== true;
  };

  const backdrop = fakeElement(
    { 'data-fixture-part': 'backdrop', 'data-modal-id': 'modal-backdrop' },
    {
      actions,
      onEvent(event) {
        if (event.type === 'pointerdown') pointerStartedOutside = true;
        if (event.type === 'pointercancel') pointerStartedOutside = false;
        if (event.type === 'pointerup' && pointerStartedOutside) {
          pointerStartedOutside = false;
          if (!ignorePointerClose) closeDialog('outside-origin-close-requested-once');
        }
      },
    },
  );
  panel.dispatchEvent = (event) => {
    actions.push({ type: event.type, target: 'modal-panel', key: event.key });
    if (event.type === 'pointerup') pointerStartedOutside = false;
    return event.defaultPrevented !== true;
  };

  const controls = new Map();
  for (const { operation, target } of scenario.operations) {
    if (`${operation}:${target}` === missingControl) continue;
    let control;
    control = fakeElement(
      {
        'data-modal-control': target,
        'data-modal-operation': operation,
        'data-modal-id': target,
        'data-modal-completion-count': '0',
      },
      {
        actions,
        onEvent(event) {
          if (operation === 'open') openDialog(target);
          else if (operation === 'close') closeDialog('closed', target);
          else if (operation === 'press' && target === 'tab-from-last-target' && !noWrap) {
            focus(firstTarget);
            events.push({ target: 'first-eligible-target', type: 'forward-tab-wrapped' });
          } else if (operation === 'press' && target === 'dismiss-control') {
            pendingControlledClose = true;
            events.push({ target: 'controlled-modal', type: 'close-requested-once' });
          } else if (operation === 'updateContent' && target === 'controlled-close-commit') {
            if (pendingControlledClose && !missingControlledCommit) {
              pendingControlledClose = false;
              closeDialog('controlled-close-committed');
            } else {
              return;
            }
          } else if (operation === 'destroy') {
            open = false;
            nestedOpen = false;
            focus(opener);
            events.push({ target, type: 'destroyed-once' });
          }
          complete(control);
          if (event?.type === 'keydown' && target === 'tab-from-last-target' && noWrap) {
            focus(control);
          }
        },
      },
    );
    controls.set(`${operation}:${target}`, control);
  }

  let rootHasChildren = false;
  let rootMarkup = '<input id="hydrated-input" value="Workspace draft">';
  const hydrationInput = fakeElement(
    { id: 'hydrated-input', 'data-modal-id': 'hydrated-input' },
    { value: 'Workspace draft' },
  );
  const fixtureRoot = {
    hasChildNodes: () => rootHasChildren,
    get innerHTML() {
      return rootMarkup;
    },
    set innerHTML(value) {
      rootMarkup = value;
    },
    querySelectorAll(selector) {
      if (selector === '[id]' || selector === 'input, textarea, select') {
        return rootHasChildren ? [hydrationInput] : [];
      }
      return [];
    },
  };
  const document = {
    body,
    get activeElement() {
      return activeElement;
    },
    documentElement: { dataset: {}, dir: '' },
    defaultView: {
      ...(resourceSnapshot === undefined
        ? {}
        : {
            __LYRA_MODAL_RESOURCE_TRACKER__: {
              restore: () => true,
              snapshot: () => structuredClone(resourceSnapshot()),
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
      return { 'behavior-title': title, 'behavior-description': description }[id] ?? null;
    },
    querySelector(selector) {
      const operation = /data-modal-operation="([^"]+)"/u.exec(selector)?.[1];
      const target = /data-modal-control="([^"]+)"/u.exec(selector)?.[1];
      if (operation !== undefined && target !== undefined) {
        return controls.get(`${operation}:${target}`) ?? null;
      }
      if (selector === '[data-modal-fixture-root]') return fixtureRoot;
      if (selector === '[data-fixture-control="opener"]') return opener;
      if (selector === '[data-fixture-part="backdrop"]') return backdrop;
      if (selector === '[data-modal-panel]') return nestedOpen ? childPanel : open ? panel : null;
      if (selector === '[data-modal-id="child-modal-safe-target"]') return childTarget;
      if (selector === '[data-modal-id="outside-prevented-default"]') {
        return preventedOutsideTarget;
      }
      if (selector === '[data-modal-id="hydrated-input"]') {
        return missingHydrationInput ? null : hydrationInput;
      }
      if (selector === '[data-modal-id="first-eligible-target"]') return firstEligibleTarget;
      if (selector === '[data-modal-id="last-eligible-target"]') return lastEligibleTarget;
      if (selector === '[data-modal-id="middle-focus-target"]') return middleTarget;
      if (selector === '[data-modal-id="nearest-safe-target"]') return nearestTarget;
      if (selector === '[data-modal-id="page-scroll-surface"]') return pageScrollTarget;
      if (selector === '[data-modal-id="hidden-tab-target"]') return hiddenTarget;
      if (selector === '[data-modal-id="disabled-tab-target"]') return disabledTarget;
      if (selector === '[data-modal-id="removed-tab-target"]') return removedTarget;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-modal-panel]') {
        return [...(open ? [panel] : []), ...(nestedOpen ? [childPanel] : [])];
      }
      if (selector === '[role="dialog"], [role="alertdialog"]') {
        return [...(open ? [panel] : []), ...(nestedOpen ? [childPanel] : [])];
      }
      if (selector === '[data-modal-id]') {
        return [
          opener,
          safeTarget,
          firstTarget,
          firstEligibleTarget,
          lastEligibleTarget,
          middleTarget,
          nearestTarget,
          hiddenTarget,
          disabledTarget,
          removedTarget,
          childTarget,
          pageScrollTarget,
          preventedOutsideTarget,
          backdrop,
          ...(open || portalLeak ? [panel] : []),
          ...(nestedOpen ? [childPanel] : []),
        ];
      }
      if (selector === '[aria-live]') return live.textContent === '' ? [] : [live];
      if (selector === '[data-modal-portal]') {
        return [...(open || portalLeak ? [panel] : []), ...(nestedOpen ? [childPanel] : [])];
      }
      return [];
    },
  };
  const fixture = {
    cleanup() {
      if (destroyed) return { status: 'already-destroyed' };
      destroyed = true;
      open = portalLeak;
      nestedOpen = false;
      return { status: 'destroyed' };
    },
    destroy() {
      if (destroyed) return false;
      destroyed = true;
      return true;
    },
    isDestroyed: () => destroyed,
    observe: () => ({
      roles: [],
      relationships: [],
      states: [],
      focus: { target: 'modal-fixture-root' },
      events: structuredClone(events),
      announcements: [],
      cleanup: [],
      diagnostics: {},
    }),
  };
  return {
    actions,
    controls,
    document,
    fixture,
    setRootHasChildren(value) {
      rootHasChildren = value;
    },
    setHydrationMarkup(value) {
      rootMarkup = value;
    },
  };
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
  request.scenario = modalExecutionScenario(
    MODAL_SCENARIOS.find(({ scenarioId }) => scenarioId.endsWith('.ssr-open-semantics.v1')),
  );
  request.cell.id = 'ssr';
  const markup =
    '<section role="dialog" data-modal-observation-id="server-rendered-modal" aria-labelledby="server-modal-title"><h2 id="server-modal-title">Server workspace</h2></section>';
  const observation = observeModalSsrMarkup({ request, html: markup });
  assert.deepEqual(
    Object.fromEntries(
      ['roles', 'relationships', 'states', 'focus', 'events', 'announcements', 'cleanup'].map(
        (key) => [key, observation[key]],
      ),
    ),
    {
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
    },
  );
  assert.deepEqual(observation.trace, [
    {
      phase: 'server-render',
      snapshot: {
        roles: observation.roles,
        relationships: observation.relationships,
        states: observation.states,
        focus: observation.focus,
        events: observation.events,
        announcements: observation.announcements,
      },
    },
  ]);
  assert.deepEqual(observation.diagnostics, {
    cleanupObserved: true,
    executionCompleted: true,
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

test('the shared driver completes every immutable operation through behavior-bound controls', async (t) => {
  assert.equal(MODAL_SCENARIOS.length, 17);
  for (const scenario of MODAL_SCENARIOS) {
    await t.test(scenario.scenarioId, async () => {
      const request = requestFor(scenario);
      const harness = behaviorBrowserHarness(scenario, {
        resourceSnapshot: scenario.capture.includes('resources')
          ? () => ({ listeners: 0, timers: 0 })
          : undefined,
      });
      const observation = await executeModalBrowserScenario({
        document: harness.document,
        fixture: harness.fixture,
        input: {
          scenario,
          cell: request.cell,
          hydrate: scenario.scenarioId.endsWith('.hydration-stability.v1'),
          synthesizeHover: false,
        },
        request,
      });
      assert.equal(observation.diagnostics.executionCompleted, true);
      assert.deepEqual(
        observation.diagnostics.actions.map(({ operation, target }) => ({ operation, target })),
        scenario.operations,
      );
      assert.equal(
        observation.diagnostics.actions.every(({ completed }) => completed === true),
        true,
      );
      assert.equal(observation.trace.length, scenario.operations.length + 1);
    });
  }
});

test('resource probes are factual and appear only in scenarios that request them', async () => {
  const execute = async (scenario) => {
    const request = requestFor(scenario);
    const harness = behaviorBrowserHarness(scenario, {
      resourceSnapshot: () => ({ listeners: 3, timers: 2 }),
    });
    return executeModalBrowserScenario({
      document: harness.document,
      fixture: harness.fixture,
      input: { scenario, cell: request.cell, hydrate: false, synthesizeHover: false },
      request,
    });
  };
  const ordinary = await execute(MODAL_SCENARIOS[0]);
  const cleanup = await execute(
    MODAL_SCENARIOS.find(({ scenarioId }) => scenarioId.endsWith('.unmount-cleanup.v1')),
  );
  assert.equal(
    ordinary.trace.some(({ snapshot }) => snapshot.resources !== undefined),
    false,
  );
  assert.deepEqual(cleanup.trace[0].snapshot.resources, { listeners: 3, timers: 2 });
});

test('client hydration keeps factual execution and cleanup traces around the real root lifecycle', async () => {
  const { mountModalFixtureClient } = await import('./runtime.mjs');
  const scenario = MODAL_SCENARIOS.find(({ scenarioId }) =>
    scenarioId.endsWith('.hydration-stability.v1'),
  );
  const request = requestFor(scenario);
  request.cell.id = 'hydration';
  const harness = behaviorBrowserHarness(scenario);
  harness.setRootHasChildren(true);
  const calls = [];
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
    createModalCandidate: async () => ({ ModalFixture() {} }),
    createRoot() {
      throw new Error('createRoot must not run for server markup');
    },
    document: harness.document,
    hydrateRoot(target, element) {
      calls.push(['hydrateRoot', target]);
      element.props.onReady(harness.fixture);
      return {
        unmount() {
          calls.push(['unmount']);
          harness.setRootHasChildren(false);
        },
      };
    },
    request,
  });
  assert.equal(bridge.renderMode, 'hydrateRoot');
  const beforeCleanup = await bridge.runScenario({
    scenario,
    cell: request.cell,
    hydrate: true,
    synthesizeHover: false,
  });
  assert.equal(beforeCleanup.diagnostics.hydrate, true);
  await bridge.runAxe();
  const afterCleanup = await bridge.cleanup();
  assert.equal(afterCleanup.observation.trace.at(-1).phase, 'after-cleanup');
  assert.equal(
    calls.some(([name]) => name === 'hydrateRoot'),
    true,
  );
  assert.equal(
    calls.some(([name]) => name === 'axe'),
    true,
  );
  assert.equal(
    calls.some(([name]) => name === 'unmount'),
    true,
  );
});

test('captures hydration stability from the server tree before hydrateRoot and first client tree', async () => {
  const scenario = structuredClone(
    MODAL_SCENARIOS.find(({ scenarioId }) => scenarioId.endsWith('.hydration-stability.v1')),
  );
  scenario.operations = [{ operation: 'open', target: 'server-rendered-modal' }];
  const request = requestFor(scenario);
  request.cell.id = 'hydration';
  const harness = behaviorBrowserHarness(scenario);
  harness.setRootHasChildren(true);
  const mounted = await (
    await import('./runtime.mjs')
  ).mountModalFixtureClient({
    React: {
      createElement(_type, props) {
        return { props };
      },
    },
    createModalCandidate: async () => ({ ModalFixture() {} }),
    createRoot() {
      throw new Error('unexpected createRoot');
    },
    document: harness.document,
    hydrateRoot(_target, element) {
      element.props.onReady(harness.fixture);
      return { unmount: () => harness.setRootHasChildren(false) };
    },
    request,
  });
  const observation = await mounted.runScenario({
    scenario,
    cell: request.cell,
    hydrate: true,
    synthesizeHover: false,
  });
  assert.deepEqual(observation.diagnostics.hydration, {
    controlledStateStable: true,
    firstTreeIdentical: true,
    focusMoved: false,
    generatedIdentifiersStable: true,
    inputValuesAfter: ['Workspace draft'],
    inputValuesBefore: ['Workspace draft'],
    warningCount: 0,
  });
});

test('captures a factual snapshot after every completed browser operation', async () => {
  const scenario = structuredClone(MODAL_SCENARIOS[0]);
  scenario.operations = [
    { operation: 'open', target: 'modal-opener' },
    { operation: 'close', target: 'modal-panel' },
    { operation: 'open', target: 'modal-opener' },
  ];
  const request = requestFor(scenario);
  const harness = behaviorBrowserHarness(scenario);
  const observation = await executeModalBrowserScenario({
    document: harness.document,
    fixture: harness.fixture,
    input: { scenario, cell: request.cell, hydrate: false, synthesizeHover: false },
    request,
  });
  assert.equal(observation.diagnostics.executionCompleted, true);
  assert.deepEqual(
    observation.trace.map(({ phase, operation }) => [phase, operation?.operation ?? null]),
    [
      ['before-operations', null],
      ['after-operation', 'open'],
      ['after-operation', 'close'],
      ['after-operation', 'open'],
    ],
  );
  assert.deepEqual(
    observation.trace.map(({ snapshot }) => snapshot.focus.target),
    ['document-body', 'modal-safe-target', 'modal-opener', 'modal-safe-target'],
  );
  assert.deepEqual(observation.trace[1].snapshot.roles, [
    { role: 'dialog', name: 'Behavior workspace' },
  ]);
  assert.deepEqual(observation.trace[2].snapshot.roles, []);
});

test('fails closed when a neutral control is missing and does not execute later operations', async () => {
  const scenario = structuredClone(MODAL_SCENARIOS[0]);
  scenario.operations = [
    { operation: 'open', target: 'modal-opener' },
    { operation: 'close', target: 'modal-panel' },
    { operation: 'open', target: 'modal-opener' },
  ];
  const request = requestFor(scenario);
  const harness = behaviorBrowserHarness(scenario, { missingControl: 'close:modal-panel' });
  const observation = await executeModalBrowserScenario({
    document: harness.document,
    fixture: harness.fixture,
    input: { scenario, cell: request.cell, hydrate: false, synthesizeHover: false },
    request,
  });
  assert.equal(observation.diagnostics.executionCompleted, false);
  assert.deepEqual(
    observation.diagnostics.actions.map(({ operation, completed }) => [operation, completed]),
    [
      ['open', true],
      ['close', false],
    ],
  );
  assert.equal(observation.diagnostics.actions[1].failure, 'control-missing');
  assert.equal(harness.actions.filter(({ type }) => type === 'click').length, 1);
});

test('fails closed when the real hydrated interaction target is missing', async () => {
  const scenario = structuredClone(
    MODAL_SCENARIOS.find(({ scenarioId }) => scenarioId.endsWith('.hydration-stability.v1')),
  );
  scenario.operations = [{ operation: 'press', target: 'hydrated-input' }];
  const request = requestFor(scenario);
  const harness = behaviorBrowserHarness(scenario, { missingHydrationInput: true });
  const observation = await executeModalBrowserScenario({
    document: harness.document,
    fixture: harness.fixture,
    input: { scenario, cell: request.cell, hydrate: true, synthesizeHover: false },
    request,
  });
  assert.equal(observation.diagnostics.executionCompleted, false);
  assert.equal(observation.diagnostics.actions[0].dispatched, false);
  assert.equal(observation.diagnostics.actions[0].failure, 'surface-missing');
});

test('disconnects the real scenario opener without deleting the generic fixture opener', async () => {
  const scenario = structuredClone(
    MODAL_SCENARIOS.find(({ scenarioId }) =>
      scenarioId.endsWith('.opener-restoration-successor.v1'),
    ),
  );
  scenario.operations = [
    { operation: 'open', target: 'connected-opener' },
    { operation: 'updateContent', target: 'disconnect-opener' },
  ];
  const request = requestFor(scenario);
  const harness = behaviorBrowserHarness(scenario);
  const observation = await executeModalBrowserScenario({
    document: harness.document,
    fixture: harness.fixture,
    input: { scenario, cell: request.cell, hydrate: false, synthesizeHover: false },
    request,
  });
  assert.equal(observation.diagnostics.executionCompleted, true);
  assert.equal(harness.controls.get('open:connected-opener').isConnected, false);
  assert.equal(harness.document.querySelector('[data-fixture-control="opener"]').isConnected, true);
});

test('never removes the document body when candidate focus did not enter the modal', async () => {
  const scenario = structuredClone(MODAL_SCENARIOS[0]);
  scenario.operations = [
    { operation: 'open', target: 'modal-opener' },
    { operation: 'updateContent', target: 'remove-focused-target' },
  ];
  const request = requestFor(scenario);
  const harness = behaviorBrowserHarness(scenario, { ignoreOpenFocus: true });
  const observation = await executeModalBrowserScenario({
    document: harness.document,
    fixture: harness.fixture,
    input: { scenario, cell: request.cell, hydrate: false, synthesizeHover: false },
    request,
  });
  assert.equal(harness.document.body.isConnected, true);
  assert.equal(observation.diagnostics.executionCompleted, false);
  assert.equal(observation.diagnostics.actions[1].failure, 'mutation-not-completed');
});

test('captures every pointer-origin variant against its real interaction surface', async () => {
  const scenario = MODAL_SCENARIOS.find(({ scenarioId }) =>
    scenarioId.endsWith('.pointer-origin-dismiss.v1'),
  );
  const request = requestFor(scenario);
  const harness = behaviorBrowserHarness(scenario);
  const observation = await executeModalBrowserScenario({
    document: harness.document,
    fixture: harness.fixture,
    input: { scenario, cell: request.cell, hydrate: false, synthesizeHover: false },
    request,
  });
  assert.equal(observation.diagnostics.executionCompleted, true);
  assert.deepEqual(
    observation.trace.slice(1).map(({ snapshot }) => snapshot.roles.length > 0),
    [true, false, true, true, true, true, true, true],
  );
  assert.equal(observation.diagnostics.actions.at(-1).prevented, true);
  assert.equal(
    observation.diagnostics.actions.at(-1).surfaces.includes('outside-prevented-default'),
    true,
  );
});

test('phase destroy does not disable later operations while fixture teardown remains terminal', () => {
  const runtime = createModalRuntime(validRequest);
  assert.equal(
    runtime.operations.destroy({
      event: { target: 'entry-phase-modal', type: 'destroyed-once' },
    }),
    true,
  );
  assert.equal(runtime.isDestroyed(), false);
  assert.equal(
    runtime.operations.open({ event: { target: 'open-phase-modal', type: 'opened' } }),
    true,
  );
  assert.equal(runtime.destroy(), true);
  assert.equal(runtime.isDestroyed(), true);
  assert.equal(runtime.operations.open({ event: { target: 'late-modal', type: 'opened' } }), false);
});

test('semantic, wrap, pointer-origin, and controlled-commit faults change factual traces', async () => {
  const execute = async (scenario, options) => {
    const request = requestFor(scenario);
    const harness = behaviorBrowserHarness(scenario, options);
    return executeModalBrowserScenario({
      document: harness.document,
      fixture: harness.fixture,
      input: { scenario, cell: request.cell, hydrate: false, synthesizeHover: false },
      request,
    });
  };
  const cases = [
    {
      name: 'semantic open',
      operations: [{ operation: 'open', target: 'modal-opener' }],
      fault: { ignoreOpen: true },
    },
    {
      name: 'focus wrap',
      operations: [
        { operation: 'open', target: 'modal-opener' },
        { operation: 'press', target: 'tab-from-last-target' },
      ],
      fault: { noWrap: true },
    },
    {
      name: 'pointer origin',
      operations: [
        { operation: 'open', target: 'modal-opener' },
        { operation: 'point', target: 'outside-down-up' },
      ],
      fault: { ignorePointerClose: true },
    },
    {
      name: 'controlled commit',
      operations: [
        { operation: 'open', target: 'controlled-modal' },
        { operation: 'press', target: 'dismiss-control' },
        { operation: 'updateContent', target: 'controlled-close-commit' },
      ],
      fault: { missingControlledCommit: true },
    },
  ];
  for (const { name, operations, fault } of cases) {
    const scenario = structuredClone(MODAL_SCENARIOS[0]);
    scenario.operations = operations;
    if (operations.some(({ target }) => target === 'controlled-modal')) {
      scenario.initial.state.controlled = true;
    }
    const correct = await execute(scenario);
    const faulty = await execute(scenario, fault);
    assert.notDeepEqual(faulty.trace, correct.trace, `${name} fault must change trace`);
    if (name === 'semantic open') {
      assert.equal(correct.diagnostics.executionCompleted, true);
      assert.equal(faulty.diagnostics.executionCompleted, false);
      assert.equal(faulty.diagnostics.actions[0].failure, 'transition-not-completed');
    }
  }
});

test('returns cleanup evidence only after root unmount and actual resource release', async () => {
  const scenario = structuredClone(
    MODAL_SCENARIOS.find(({ scenarioId }) => scenarioId.endsWith('.unmount-cleanup.v1')),
  );
  scenario.operations = [{ operation: 'open', target: 'open-phase-modal' }];
  const request = requestFor(scenario);
  const resources = { listeners: 2, timers: 1 };
  const harness = behaviorBrowserHarness(scenario, {
    resourceSnapshot: () => resources,
  });
  const mounted = await (
    await import('./runtime.mjs')
  ).mountModalFixtureClient({
    React: {
      createElement(_type, props) {
        return { props };
      },
    },
    createModalCandidate: async () => ({ ModalFixture() {} }),
    createRoot: () => ({
      render(element) {
        harness.setRootHasChildren(true);
        element.props.onReady(harness.fixture);
      },
      unmount() {
        harness.setRootHasChildren(false);
        resources.listeners = 0;
        resources.timers = 0;
      },
    }),
    document: harness.document,
    hydrateRoot() {
      throw new Error('unexpected hydration');
    },
    request,
  });
  await mounted.runScenario({
    scenario,
    cell: request.cell,
    hydrate: false,
    synthesizeHover: false,
  });
  const result = await mounted.cleanup();
  assert.equal(result.status, 'destroyed');
  assert.equal(result.observation.diagnostics.cleanupObserved, true);
  const cleanup = result.observation.trace.at(-1);
  assert.equal(cleanup.phase, 'after-cleanup');
  assert.deepEqual(cleanup.snapshot.resources, { listeners: 0, timers: 0 });
  assert.equal(
    cleanup.snapshot.states.some(
      ({ target, name, value }) =>
        target === 'modal-listeners' && name === 'remaining-count' && value === 0,
    ),
    true,
  );
});

test('portal, listener, and timer leaks change the post-cleanup factual trace', async () => {
  const execute = async ({ leak }) => {
    const scenario = structuredClone(
      MODAL_SCENARIOS.find(({ scenarioId }) => scenarioId.endsWith('.unmount-cleanup.v1')),
    );
    scenario.operations = [{ operation: 'open', target: 'open-phase-modal' }];
    const request = requestFor(scenario);
    const resources = { listeners: 2, timers: 1 };
    const harness = behaviorBrowserHarness(scenario, {
      portalLeak: leak,
      resourceSnapshot: () => resources,
    });
    const mounted = await (
      await import('./runtime.mjs')
    ).mountModalFixtureClient({
      React: {
        createElement(_type, props) {
          return { props };
        },
      },
      createModalCandidate: async () => ({ ModalFixture() {} }),
      createRoot: () => ({
        render(element) {
          harness.setRootHasChildren(true);
          element.props.onReady(harness.fixture);
        },
        unmount() {
          harness.setRootHasChildren(false);
          if (!leak) {
            resources.listeners = 0;
            resources.timers = 0;
          }
        },
      }),
      document: harness.document,
      hydrateRoot() {
        throw new Error('unexpected hydration');
      },
      request,
    });
    await mounted.runScenario({
      scenario,
      cell: request.cell,
      hydrate: false,
      synthesizeHover: false,
    });
    return (await mounted.cleanup()).observation;
  };
  const released = await execute({ leak: false });
  const leaked = await execute({ leak: true });
  assert.notDeepEqual(leaked.trace.at(-1), released.trace.at(-1));
  assert.equal(released.cleanup.includes('modal-portals-removed'), true);
  assert.equal(released.cleanup.includes('modal-listeners-released'), true);
  assert.equal(released.cleanup.includes('modal-timers-released'), true);
  assert.equal(leaked.cleanup.includes('modal-portals-remaining'), true);
  assert.equal(leaked.cleanup.includes('modal-listeners-remaining'), true);
  assert.equal(leaked.cleanup.includes('modal-timers-remaining'), true);
});
