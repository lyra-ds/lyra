import { adapterSuite } from '../wave2-test-support.mjs';
adapterSuite('anchored');

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { load, elements } from '../wave2-test-support.mjs';

for (const [candidate, family] of [
  ['base-ui', 'anchored'],
  ['base-ui', 'menu'],
  ['zag', 'anchored'],
])
  test(`review regression: ${candidate} ${family} passes a live declared successor to the candidate`, async () => {
    const nodes = new Map();
    let focused = 0;
    const node = (id) => ({
      isConnected: true,
      getAttribute: (name) => (name === 'data-overlay-id' ? id : null),
      focus() {
        focused++;
      },
    });
    nodes.set('successor-command', node('successor-command'));
    nodes.set('successor-region', node('successor-region'));
    const loaded = await load(candidate, family, {
      environment: {
        document: {
          querySelectorAll: (selector) =>
            selector === '[data-overlay-id]' ? [...nodes.values()] : [],
        },
      },
    });
    const candidateDestination = () => {
      const tree = loaded.ownerTrees()[0];
      return candidate === 'zag'
        ? loaded.capture.options.finalFocusEl
        : elements(tree).find((n) => n.type === 'Popup').props.finalFocus;
    };
    assert.equal(candidateDestination(), undefined);
    await loaded.fixture.operations.updateContent({ target: 'remove-trigger-successor-command' });
    loaded.render();
    const destination = candidateDestination();
    assert.equal(typeof destination, 'function');
    assert.equal(destination(), nodes.get('successor-command'));
    const replacement = node('successor-command');
    nodes.set('successor-command', replacement);
    assert.equal(
      destination(),
      replacement,
      'resolve the connected destination at candidate focus time',
    );
    await loaded.fixture.operations.updateContent({ target: 'remove-trigger-successor-region' });
    loaded.render();
    assert.equal(candidateDestination()(), nodes.get('successor-region'));
    await loaded.fixture.operations.updateContent({ target: 'restore-trigger' });
    loaded.render();
    assert.equal(
      candidateDestination(),
      undefined,
      'normal candidate restoration policy must remain unchanged',
    );
    assert.equal(focused, 0, 'only the candidate may perform successor focus');
  });

for (const [candidate, family] of [
  ['incumbent', 'anchored'],
  ['incumbent', 'menu'],
  ['radix', 'anchored'],
  ['radix', 'menu'],
  ['zag', 'menu'],
])
  test(`review regression: ${candidate} ${family} records unsupported successor destinations`, async () => {
    const loaded = await load(candidate, family);
    assert.ok(
      loaded.fixture
        .observe()
        .diagnostics.limitations.includes('successor-focus-target-unavailable'),
    );
  });

test('close invalidates an old owner callback without preventing fresh input', async () => {
  const loaded = await load('radix', 'anchored');
  const callback = elements(loaded.ownerTrees()[0]).find((n) => n.type === 'Root').props
    .onOpenChange;
  callback(true);
  callback(false);
  const count = loaded.fixture.observe().events.length;
  callback(true);
  assert.equal(loaded.fixture.observe().events.length, count);
  loaded.render();
  elements(loaded.ownerTrees()[0])
    .find((n) => n.type === 'Root')
    .props.onOpenChange(true);
  assert.equal(loaded.fixture.observe().events.length, count + 1);
});

test('the fixture counts actual descendant focus and live-region text changes', async () => {
  const live = { textContent: 'Workspace details', getAttribute: () => null };
  const document = {
    querySelectorAll: (selector) =>
      selector === '[aria-live], [role="status"], [role="alert"]' ? [live] : [],
  };
  const loaded = await load('radix', 'anchored', { environment: { document } });
  loaded.props.request.scenario.probes = [
    { category: 'states', target: 'document-focus', property: 'move-count-since-operation' },
  ];
  const root = loaded.tree;
  assert.equal(typeof root.props.onFocusCapture, 'function');
  root.props.onFocusCapture({ target: { getAttribute: () => 'popup-command' } });
  assert.equal(loaded.fixture.observe().states[0].value, 1);
  assert.deepEqual(loaded.fixture.observe().announcements, [{ message: 'Workspace details' }]);
  live.textContent = 'Updated details';
  assert.deepEqual(loaded.fixture.observe().announcements, [
    { message: 'Workspace details' },
    { message: 'Updated details' },
  ]);
});

test('server render controls select closed and open input without changing the execution projection', async () => {
  const loaded = await load('radix', 'anchored');
  const operations = [
    { operation: 'updateContent', target: 'server-render-closed' },
    { operation: 'updateContent', target: 'server-render-open' },
  ];
  const request = {
    ...loaded.props.request,
    scenario: { ...loaded.props.request.scenario, operations },
  };
  const props = { request, renderTarget: 'server-render-open', onReady() {} };
  // A separate renderer corresponds to a fresh server render pass.
  const { fakeReact } = await import('../wave2-test-support.mjs');
  const renderer = fakeReact();
  const { createAnchoredCandidate } = await import('./radix.mjs');
  const fixture = await createAnchoredCandidate({
    React: renderer.React,
    environment: {},
    importModule: async () => ({
      Root: 'Root',
      Trigger: 'Trigger',
      Content: 'Content',
      Portal: 'Portal',
    }),
  });
  const tree = renderer.render(fixture.AnchoredFixture, props);
  const owner = elements(tree).find((n) => n.type?.name === 'CandidateOwner');
  assert.equal(owner.props.model.owner.open, true);
  assert.deepEqual(request.scenario.operations, operations);
});

test('incumbent anchored height control grows real consumer content to its final element', async () => {
  const loaded = await load('incumbent', 'anchored');
  await loaded.fixture.operations.resize({ operation: 'resize', target: 'content-height-900' });
  loaded.render();
  const end = elements(loaded.ownerTrees()[0]).find(
    (n) => n.props['data-overlay-id'] === 'last-content-element',
  );
  assert.ok(end.props.style?.marginTop >= 800);
});

test('review regression: generated identities stay stable across closed and open and reject changed or orphan IDs', async () => {
  for (const family of ['anchored', 'menu', 'tooltip']) {
    const target = { anchored: 'popup', menu: 'menu', tooltip: 'tooltip' }[family];
    const relationship = family === 'tooltip' ? 'aria-describedby' : 'aria-controls';
    const attrs = {
      [relationship]: family === 'tooltip' ? 'existing-help generated-1' : 'generated-1',
    };
    const trigger = {
      isConnected: true,
      getAttribute: (name) => (name === 'data-overlay-id' ? 'trigger' : (attrs[name] ?? null)),
    };
    let popup;
    const document = {
      querySelectorAll: (selector) =>
        selector === '[data-overlay-id]' ? [trigger, ...(popup ? [popup] : [])] : [],
      getElementById: (id) =>
        id === 'existing-help' ? { id } : popup?.id === id ? popup : undefined,
    };
    const loaded = await load('radix', family, { environment: { document } });
    loaded.props.request.scenario.probes = [
      { category: 'states', target, property: 'id' },
      { category: 'states', target: 'trigger', property: relationship },
    ];
    const observe = () => loaded.fixture.observe().states.map((s) => s.value);
    const expected = family === 'tooltip' ? ['existing-help', `${target}-id`] : `${target}-id`;
    assert.deepEqual(observe(), [null, expected]);
    assert.deepEqual(
      loaded.fixture
        .observe()
        .relationships.filter((r) => r.name === relationship)
        .map((r) => r.target),
      Array.isArray(expected) ? expected : [expected],
    );
    popup = {
      id: 'generated-1',
      isConnected: true,
      getAttribute: (name) => (name === 'data-overlay-id' ? target : null),
    };
    assert.deepEqual(observe(), [`${target}-id`, expected]);
    popup.id = 'generated-2';
    const changed = observe();
    assert.notEqual(changed[0], `${target}-id`);
    assert.match(changed[0], /^unresolved-id-/);
    assert.deepEqual(changed[1], expected);
    attrs[relationship] = 'orphan-reference';
    assert.notDeepEqual(observe()[1], expected);
    assert.equal(popup.id, 'generated-2');
    assert.ok(
      loaded.fixture
        .observe()
        .diagnostics.identities.some(
          (entry) => entry.first === 'generated-1' && entry.current === 'generated-2',
        ),
    );
  }
});

test('review regression: identity collisions between owners cannot normalize to valid target identities', async () => {
  const { createIdentityMeasurements } = await import('../../fixtures/wave2/measurements.mjs');
  const ids = createIdentityMeasurements();
  ids.bind('parent-popup', 'shared');
  ids.bind('child-popup', 'shared');
  assert.notEqual(ids.normalize('shared'), 'parent-popup-id');
  assert.notEqual(ids.normalize('shared'), 'child-popup-id');
  assert.notEqual(ids.normalize('shared'), ids.normalize('other'));
});

test('review regression: first closed reference cannot disguise mismatched first content and consumer descriptions remain literal', async () => {
  let content;
  const trigger = {
    isConnected: true,
    getAttribute: (name) =>
      name === 'data-overlay-id'
        ? 'trigger'
        : name === 'aria-describedby'
          ? 'other-help initial-generated'
          : null,
  };
  const document = {
    querySelectorAll: (selector) =>
      selector === '[data-overlay-id]' ? [trigger, ...(content ? [content] : [])] : [],
    getElementById: (id) => (id === 'other-help' ? { id } : undefined),
  };
  const loaded = await load('radix', 'tooltip', { environment: { document } });
  loaded.props.request.scenario.probes = [
    { category: 'states', target: 'trigger', property: 'aria-describedby' },
    { category: 'states', target: 'tooltip', property: 'id' },
  ];
  assert.deepEqual(
    loaded.fixture.observe().states.map((s) => s.value),
    [['other-help', 'tooltip-id'], null],
  );
  content = {
    id: 'different-generated',
    isConnected: true,
    getAttribute: (name) => (name === 'data-overlay-id' ? 'tooltip' : null),
  };
  const values = loaded.fixture.observe().states.map((s) => s.value);
  assert.deepEqual(values[0], ['other-help', 'tooltip-id']);
  assert.match(values[1], /^unresolved-id-/);
});
