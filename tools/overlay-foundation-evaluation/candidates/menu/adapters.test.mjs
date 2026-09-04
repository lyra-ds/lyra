import { adapterSuite } from '../wave2-test-support.mjs';
adapterSuite('menu');

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { candidateIds, load, elements } from '../wave2-test-support.mjs';

for (const candidate of candidateIds)
  test(`${candidate} menu exposes only the current command label separator model`, async () => {
    const loaded = await load(candidate, 'menu');
    const tree = loaded.ownerTrees()[0];
    const nodes = elements(tree);
    assert.ok(nodes.every((n) => !String(n.type).match(/Sub|Checkbox|Radio/)));
    loaded.props.request.scenario.probes = ['submenu', 'checkbox', 'radio'].map(
      (property, index) => ({
        id: String(index),
        category: 'states',
        target: 'public-model',
        property,
      }),
    );
    assert.deepEqual(
      loaded.fixture.observe().states.map((s) => s.value),
      Array(3).fill('not-applicable-current-public-model'),
    );
  });

test('cancelable selection preserves consumer prevention atomically at the callback boundary', async () => {
  const loaded = await load('radix', 'menu');
  await loaded.fixture.operations.updateContent({ target: 'cancel-selection-default' });
  loaded.render();
  const item = elements(loaded.ownerTrees()[0]).find((n) => n.props['data-overlay-id'] === 'alpha');
  const event = {
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
  };
  item.props.onSelect(event);
  assert.equal(event.defaultPrevented, true);
  assert.equal(
    loaded.fixture.observe().events.some((e) => e.type === 'selected'),
    false,
  );
});

test('menu fixture provides the declared native exit targets and accented typeahead input', async () => {
  const loaded = await load('radix', 'menu');
  const ids = elements(loaded.tree).map((n) => n.props['data-overlay-id']);
  assert.ok(ids.includes('before-menu'));
  assert.ok(ids.includes('after-menu'));
  const item = elements(loaded.ownerTrees()[0]).find(
    (n) => n.props['data-overlay-id'] === 'alpine',
  );
  assert.equal(item.props.children, 'Álpine');
});

test('menu scroll facts come from actual scroll offsets and native event prevention', async () => {
  const menu = {
    isConnected: true,
    scrollTop: 0,
    getAttribute: (name) => (name === 'data-overlay-id' ? 'menu' : null),
  };
  const document = { querySelectorAll: () => [menu] };
  const loaded = await load('radix', 'menu', {
    environment: { document },
    driver: {
      point: async (args) => {
        if (args.phase === 'move') menu.scrollTop = 30;
      },
    },
  });
  loaded.props.request.scenario.probes = [
    ['menu', 'scroll-position-changed'],
    ['menu', 'scroll-prevented'],
    ['synthetic-hover', 'event-count'],
  ].map(([target, property]) => ({ category: 'states', target, property }));
  await loaded.fixture.operations.point({ operation: 'point', target: 'touch-menu-scroll-start' });
  await loaded.fixture.operations.point({ operation: 'point', target: 'touch-menu-scroll-move' });
  assert.equal(typeof loaded.tree.props.onTouchMoveCapture, 'function');
  const nativeEvent = { defaultPrevented: false };
  loaded.tree.props.onTouchMoveCapture({ nativeEvent });
  nativeEvent.defaultPrevented = true;
  assert.deepEqual(
    loaded.fixture.observe().states.map((s) => s.value),
    [true, true, 0],
  );
});

test('menu role measurements preserve item multiplicity and structural roles', async () => {
  const children = ['menuitem', 'menuitem', 'separator', 'presentation'].map((role) => ({
    getAttribute: () => role,
  }));
  const menu = {
    isConnected: true,
    getAttribute: (name) => (name === 'data-overlay-id' ? 'menu' : null),
    querySelectorAll: () => children,
  };
  const loaded = await load('radix', 'menu', {
    environment: { document: { querySelectorAll: () => [menu] } },
  });
  loaded.props.request.scenario.probes = ['item-roles', 'allowed-item-roles'].map((property) => ({
    category: 'states',
    target: 'menu',
    property,
  }));
  assert.deepEqual(
    loaded.fixture.observe().states.map((s) => s.value),
    [
      ['menuitem', 'menuitem'],
      ['menuitem', 'separator', 'presentation'],
    ],
  );
});
