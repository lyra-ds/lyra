import { adapterSuite } from '../wave2-test-support.mjs';
adapterSuite('tooltip');

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { load, elements, candidateIds } from '../wave2-test-support.mjs';
import { installWave2ResourceTracker } from '../../fixtures/wave2/runtime.mjs';

for (const candidate of candidateIds)
  test(`review regression: ${candidate} tooltip coordinator ownership is not inferred from fixture mounts`, async () => {
    const loaded = await load(candidate, 'tooltip');
    loaded.props.request.scenario.probes = [
      { category: 'states', target: 'coordinator', property: 'owner-count' },
    ];
    assert.equal(loaded.fixture.observe().states[0].value, null);
    await loaded.fixture.operations.destroy({ target: 'tooltip' });
    loaded.render();
    assert.equal(loaded.fixture.observe().states[0].value, null);
    await loaded.fixture.operations.updateContent({ target: 'mount-fresh-tooltip' });
    loaded.render();
    assert.equal(loaded.fixture.observe().states[0].value, null);
  });

test('zag tooltip teardown releases actual candidate timers and leaves no stale callback', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const tracker = installWave2ResourceTracker(globalThis);
  t.after(() => {
    tracker.restore();
    t.mock.timers.reset();
  });
  let fired = 0;
  const loaded = await load('zag', 'tooltip', {
    candidateEffect: () => {
      const timer = setTimeout(() => {
        fired++;
      }, 500);
      return () => clearTimeout(timer);
    },
  });
  loaded.ownerTrees();
  assert.equal(tracker.snapshot().timers, 1);
  await loaded.fixture.destroy();
  loaded.unmountOwners();
  assert.equal(tracker.snapshot().timers, 0);
  t.mock.timers.tick(500);
  assert.equal(fired, 0);
});

test('unrelated timers never become purpose-specific tooltip measurements', async () => {
  const loaded = await load('radix', 'tooltip', {
    environment: {
      __LYRA_OVERLAY_RESOURCE_TRACKER__: {
        snapshot: () => ({ timers: 1, listeners: 0, timerEntries: [{ owner: 'unrelated' }] }),
      },
    },
  });
  loaded.props.request.scenario.probes = [
    'open-delay-timer',
    'pointer-grace-timer',
    'warm-expiry-timer',
  ].map((target, index) => ({
    id: String(index),
    category: 'states',
    target,
    property: 'active-count',
  }));
  assert.deepEqual(
    loaded.fixture.observe().states.map((s) => s.value),
    [null, null, null],
  );
});

test('purpose-specific timer zero is observed only when the measured aggregate is zero', async () => {
  const loaded = await load('radix', 'tooltip', {
    environment: {
      __LYRA_OVERLAY_RESOURCE_TRACKER__: { snapshot: () => ({ timers: 0, listeners: 0 }) },
    },
  });
  loaded.props.request.scenario.probes = [
    'open-delay-timer',
    'pointer-grace-timer',
    'warm-expiry-timer',
  ].map((target, index) => ({
    id: String(index),
    category: 'states',
    target,
    property: 'active-count',
  }));
  assert.deepEqual(
    loaded.fixture.observe().states.map((s) => s.value),
    [0, 0, 0],
  );
});

test('incumbent tooltip receives only a supported physical side', async () => {
  const loaded = await load('incumbent', 'tooltip');
  const tooltip = elements(loaded.ownerTrees()[0]).find((n) => n.type === 'Tooltip');
  assert.equal(tooltip.props.placement, 'bottom');
});

test('tooltip observes native disclosure state and actual first-visible clock time', async () => {
  let time = 100,
    open = false;
  const nodes = new Map();
  const trigger = {
    isConnected: true,
    getAttribute: (name) => (name === 'data-overlay-id' ? 'trigger' : null),
    focus() {
      open = true;
    },
  };
  const summary = { tagName: 'SUMMARY', tabIndex: 0 };
  const disclosure = {
    isConnected: true,
    open: false,
    getAttribute: (name) => (name === 'data-overlay-id' ? 'help-disclosure' : null),
    querySelector: (selector) =>
      selector === 'summary' ? summary : { textContent: 'Workspace details' },
  };
  const tooltip = {
    isConnected: true,
    getAttribute: (name) => (name === 'data-overlay-id' ? 'tooltip' : null),
    getClientRects: () => (open ? [{}] : []),
  };
  const document = {
    querySelectorAll: (selector) =>
      selector === '[data-overlay-id]' ? [trigger, tooltip, disclosure] : [],
  };
  const loaded = await load('radix', 'tooltip', {
    environment: { document, performance: { now: () => time } },
  });
  loaded.props.request.scenario.probes = [
    ['help-disclosure', 'open'],
    ['help-disclosure', 'visible-text'],
    ['help-disclosure', 'operable'],
    ['tooltip', 'elapsed-open-delay'],
  ].map(([target, property]) => ({ category: 'states', target, property }));
  assert.equal(loaded.fixture.observe().states[0].value, false);
  await loaded.fixture.operations.focus({ operation: 'focus', target: 'trigger' });
  const facts = loaded.fixture.observe().states;
  assert.equal(facts[3].value, 0);
  disclosure.open = true;
  assert.deepEqual(
    loaded.fixture
      .observe()
      .states.slice(0, 3)
      .map((s) => s.value),
    [true, 'Workspace details', true],
  );
});
