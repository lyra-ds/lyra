import assert from 'node:assert/strict';
import { test } from 'node:test';
import { WAVE_2_SCENARIOS } from '../../contracts/wave2.mjs';
import { createWave2Runtime, installWave2ResourceTracker } from './runtime.mjs';
const cell = {
  id: 'chromium',
  reactVersion: '19.2.8',
  direction: 'ltr',
  colorScheme: 'light',
  forcedColors: false,
  reducedMotion: false,
  coarsePointer: false,
};
const op = (operation, target = 'popup') => ({ operation, target });
function harness(operations, probes = []) {
  const pending = new Map();
  let next = 0;
  const scope = {
    setTimeout(fn) {
      pending.set(++next, fn);
      return next;
    },
    clearTimeout(id) {
      pending.delete(id);
    },
  };
  const tracker = installWave2ResourceTracker(scope);
  const state = { open: false, selected: false, placement: 0, focus: 'trigger' };
  const calls = [];
  let stale;
  const owned = [];
  const timers = [];
  const fixture = {
    operations: {
      open(operation, context) {
        calls.push(operation);
        state.open = true;
        owned.push(tracker.acquireClaim({ kind: 'portal', owner: 'popup' }));
        stale = context.guard(() => {
          state.open = true;
        });
        timers.push(scope.setTimeout(stale, 10));
      },
      close(operation) {
        calls.push(operation);
        state.open = false;
        timers.forEach((id) => scope.clearTimeout(id));
        owned.forEach((c) => c.release());
      },
      press(operation, context) {
        calls.push(operation);
        return context.commit({
          prevented: true,
          event: { target: 'item', type: 'selected' },
          apply() {
            state.selected = true;
            state.open = false;
          },
        });
      },
      destroy(operation) {
        calls.push(operation);
        state.open = false;
        timers.forEach((id) => scope.clearTimeout(id));
        owned.forEach((c) => c.release());
      },
      resize(operation) {
        calls.push(operation);
        state.placement++;
      },
      updateContent(operation) {
        calls.push(operation);
        state.open = false;
        timers.forEach((id) => scope.clearTimeout(id));
        owned.forEach((c) => c.release());
      },
      advanceTime() {
        throw new Error('candidate clock must not execute');
      },
    },
    observe() {
      return {
        direction: 'ltr',
        roles: [],
        relationships: [],
        states: [
          { target: 'popup', name: 'open', value: state.open },
          { target: 'popup', name: 'placement', value: state.placement },
          { target: 'item', name: 'selected', value: state.selected },
        ],
        focus: { target: state.focus },
        events: [],
        announcements: [],
        diagnostics: { vendor: 'radix' },
      };
    },
    destroy() {
      state.open = false;
      timers.forEach((id) => scope.clearTimeout(id));
      owned.forEach((c) => c.release());
      return { status: 'destroyed' };
    },
  };
  const runtime = createWave2Runtime({
    schemaVersion: 1,
    scenario: { scenarioId: 'of-anchored.runtime.v1', operations, probes },
    cell,
  });
  runtime.beginScenario({ fixture, tracker });
  return { runtime, fixture, tracker, state, calls, pending, stale: () => stale };
}
test('Wave2 enforces immutable record order and captures probes at declared operations', async () => {
  const operations = [op('open'), op('resize'), op('close')];
  const h = harness(operations, [
    {
      id: 'open-state',
      category: 'states',
      phase: 'after-operation',
      operationIndex: 0,
      target: 'popup',
      property: 'open',
    },
  ]);
  await assert.rejects(h.runtime.runOperation(operations[1]), /order/);
  await h.runtime.runOperation(operations[0]);
  await h.runtime.runOperation(operations[1]);
  await h.runtime.runOperation(operations[2]);
  assert.deepEqual(h.calls, operations);
  assert.equal(h.runtime.observe().trace[1].snapshot.probes[0].fact.value, true);
  assert.equal(h.runtime.observe().states[0].value, true);
  await assert.rejects(h.runtime.runOperation(operations[2]), /order/);
  await h.runtime.destroy();
});
test('Wave2 close, removal and destroy invalidate pending callbacks and release resources', async () => {
  for (const terminal of ['close', 'updateContent', 'destroy']) {
    const h = harness([op('open'), op(terminal)]);
    await h.runtime.runOperation(op('open'));
    const stale = h.stale();
    await h.runtime.runOperation(op(terminal));
    assert.equal(stale(), false);
    assert.equal(h.state.open, false);
    await h.runtime.destroy();
    const after = h.runtime.observe();
    assert.equal(after.trace.at(-1).snapshot.resources.timers, 0);
    assert.deepEqual(after.trace.at(-1).snapshot.resources.claims, []);
    assert.deepEqual(await h.runtime.destroy(), { status: 'already-destroyed' });
    assert.deepEqual(h.runtime.observe(), after);
  }
});
test('Wave2 prevented selection is atomic and placement changes preserve focus and semantic events', async () => {
  const h = harness([op('open'), op('press', 'item'), op('resize')]);
  await h.runtime.runOperation(op('open'));
  await h.runtime.runOperation(op('press', 'item'));
  assert.equal(h.state.open, true);
  assert.equal(h.state.selected, false);
  assert.deepEqual(h.runtime.observe().events, []);
  await h.runtime.runOperation(op('resize'));
  assert.equal(h.state.placement, 1);
  assert.equal(h.runtime.observe().focus.target, 'trigger');
  assert.deepEqual(h.runtime.observe().events, []);
  await h.runtime.destroy();
});
test('Wave2 advanceTime requires a runner clock receipt and never invokes candidate code', async () => {
  const timing = { operation: 'advanceTime', target: 'browser-clock', milliseconds: 10 };
  const h = harness([op('open'), timing]);
  await h.runtime.runOperation(op('open'));
  await assert.rejects(h.runtime.runOperation(timing), /runner.*clock/);
  for (const callback of h.pending.values()) callback();
  await h.runtime.runOperation(timing, {
    clockTransition: { operationIndex: 1, before: 0, after: 10 },
  });
  assert.equal(h.calls.length, 1);
  await h.runtime.destroy();
});
test('Wave2 observations preserve diagnostic separation and expose actual fixture faults', async () => {
  const h = harness([op('resize')]);
  h.fixture.operations.resize = () => {
    h.state.focus = 'unexpected';
  };
  await h.runtime.runOperation(op('resize'));
  assert.equal(h.runtime.observe().focus.target, 'unexpected');
  assert.equal(h.runtime.observe().diagnostics.fixture.vendor, 'radix');
  assert.equal(
    h.runtime.observe().states.some((s) => s.value === 'radix'),
    false,
  );
  const observe = h.fixture.observe;
  h.fixture.observe = () => ({
    ...observe(),
    states: [{ target: 'popup', name: 'vendor', value: 'radix' }],
  });
  assert.throws(() => h.runtime.observe(), /vendor|candidate/);
  h.fixture.observe = observe;
  await h.runtime.destroy();
});

test('Wave2 scoped destroy preserves later catalog operations and fresh owners', async () => {
  const operations = [
    op('open'),
    op('destroy'),
    op('destroy'),
    op('resize'),
    op('updateContent', 'mount-fresh-tooltip'),
    op('open'),
  ];
  const h = harness(operations);
  for (const operation of operations) await h.runtime.runOperation(operation);
  assert.deepEqual(h.calls, operations);
  assert.equal(h.state.open, true);
  await h.runtime.destroy();
});

test('Wave2 executes every catalog operation including repeated scoped destruction', async () => {
  for (const scenario of WAVE_2_SCENARIOS) {
    const h = harness(scenario.operations);
    for (const operation of scenario.operations)
      h.fixture.operations[operation.operation] = () => {};
    let now = 0;
    for (const [operationIndex, operation] of scenario.operations.entries()) {
      const before = now;
      if (operation.operation === 'advanceTime') now += operation.milliseconds;
      await h.runtime.runOperation(
        operation,
        operation.operation === 'advanceTime'
          ? { clockTransition: { operationIndex, before, after: now } }
          : {},
      );
    }
    assert.equal(
      h.runtime.observe().trace.filter((e) => e.phase === 'after-operation').length,
      scenario.operations.length,
      scenario.scenarioId,
    );
    await h.runtime.destroy();
  }
});

test('Wave2 reads target-bound roles and announcements from the real document', async () => {
  const h = harness([op('resize')]);
  await h.runtime.destroy();
  const tooltip = {
    isConnected: true,
    getAttribute(name) {
      return (
        { 'data-overlay-id': 'tooltip', role: 'tooltip', 'aria-label': 'Actual details' }[name] ??
        null
      );
    },
    textContent: 'Actual details',
  };
  const document = {
    querySelectorAll() {
      return [tooltip];
    },
  };
  const originalObserve = h.fixture.observe;
  h.fixture.observe = () => ({
    ...originalObserve(),
    announcements: [{ message: 'Actual details' }],
  });
  const probes = [
    {
      id: 'role',
      category: 'roles',
      phase: 'after-operation',
      operationIndex: 0,
      target: 'tooltip',
      property: 'accessible-role',
    },
    {
      id: 'announcement',
      category: 'announcements',
      phase: 'after-operation',
      operationIndex: 0,
      target: 'tooltip',
      property: 'text',
    },
  ];
  const runtime = createWave2Runtime({
    schemaVersion: 1,
    scenario: { scenarioId: 'of-tooltip.semantic.v1', operations: [op('resize')], probes },
    cell,
  });
  runtime.beginScenario({ fixture: h.fixture, tracker: h.tracker, document });
  await runtime.runOperation(op('resize'));
  assert.deepEqual(runtime.observe().roles, [{ role: 'tooltip', name: 'Actual details' }]);
  assert.deepEqual(runtime.observe().announcements, [{ message: 'Actual details' }]);
  await runtime.destroy();
});

test('Wave2 owner-scoped guards survive another owner closing but not their own removal', async () => {
  const h = harness([
    op('open', 'trigger-a'),
    op('open', 'trigger-b'),
    op('destroy', 'popup-a'),
    op('destroy', 'popup-b'),
  ]);
  const callbacks = {};
  h.fixture.operations.open = (operation, context) => {
    const owner = operation.target.replace('trigger', 'popup');
    callbacks[owner] = context.guard(() => owner, { owner });
  };
  for (const operation of [
    op('open', 'trigger-a'),
    op('open', 'trigger-b'),
    op('destroy', 'popup-a'),
  ])
    await h.runtime.runOperation(operation);
  assert.equal(callbacks['popup-a'](), false);
  assert.equal(callbacks['popup-b'](), 'popup-b');
  await h.runtime.runOperation(op('destroy', 'popup-b'));
  assert.equal(callbacks['popup-b'](), false);
  await h.runtime.destroy();
});

test('Wave2 closes the callback gate before awaiting asynchronous terminal cleanup', async () => {
  const h = harness([op('open')]);
  let ownedCallback;
  h.fixture.operations.open = (operation, context) => {
    ownedCallback = context.guard(
      () => {
        h.state.open = true;
      },
      { owner: 'popup' },
    );
  };
  await h.runtime.runOperation(op('open'));
  let release;
  h.fixture.destroy = () =>
    new Promise((resolve) => {
      release = () => resolve({ status: 'destroyed' });
    });
  const cleanup = h.runtime.destroy();
  assert.equal(ownedCallback(), false);
  release();
  await cleanup;
});

test('Wave2 final teardown is terminal even for remaining runner clock operations', async () => {
  const timing = { operation: 'advanceTime', target: 'browser-clock', milliseconds: 10 };
  const h = harness([op('open'), timing]);
  await h.runtime.runOperation(op('open'));
  await h.runtime.destroy();
  await assert.rejects(
    h.runtime.runOperation(timing, {
      clockTransition: { operationIndex: 1, before: 0, after: 10 },
    }),
    /destroyed/,
  );
});

test('Wave2 fixture snapshots cannot supply coordinator-owned probes or resource counts', async () => {
  for (const key of ['probes', 'resources']) {
    const h = harness([op('resize')]);
    const observe = h.fixture.observe;
    h.fixture.observe = () => ({ ...observe(), [key]: key === 'probes' ? [] : {} });
    assert.throws(() => h.runtime.observe(), /coordinator-owned/);
    h.fixture.observe = observe;
    await h.runtime.destroy();
  }
});
