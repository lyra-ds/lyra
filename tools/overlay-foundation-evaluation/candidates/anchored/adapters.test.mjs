import { adapterSuite } from '../wave2-test-support.mjs';
adapterSuite('anchored');

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { load, elements } from '../wave2-test-support.mjs';

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
