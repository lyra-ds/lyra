import { adapterSuite } from '../wave2-test-support.mjs';
adapterSuite('menu');

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { candidateIds, load, elements } from '../wave2-test-support.mjs';
import { MENU_SCENARIOS } from '../../contracts/menu.mjs';

for (const candidate of candidateIds)
  test(`review regression: ${candidate} menu uses declared accented and disabled boundary inputs`, async () => {
    const loaded = await load(candidate, 'menu');
    const input = () =>
      elements(loaded.tree).find((node) => node.type?.name === 'CandidateOwner').props.model.items;
    assert.equal(input().find((item) => item.id === 'alpha').label, 'Álpha');
    assert.equal(
      input().some((item) => item.id === 'disabled-first'),
      false,
    );
    await loaded.fixture.operations.updateContent({
      operation: 'updateContent',
      target: 'menu-disabled-boundary-rows',
    });
    loaded.render();
    const supplied = input().map((item) => ({
      id: item.id,
      ...(item.label === undefined ? {} : { text: item.label }),
      kind: item.type ?? 'command',
      ...(item.disabled ? { disabled: true } : {}),
    }));
    assert.deepEqual(supplied, MENU_SCENARIOS[0].initial.state.items);
    if (candidate === 'incumbent') {
      const dropdown = elements(loaded.ownerTrees()[0]).find((node) => node.type === 'Dropdown');
      assert.equal(dropdown.props.items[0].id, 'disabled-first');
      assert.equal(dropdown.props.items.at(-1).id, 'disabled-last');
      assert.equal(
        dropdown.props.items.some((item) => Object.hasOwn(item, 'disabled')),
        false,
      );
    }
  });

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

test('review regression: SSR menu controls provide three commands while hydration keeps four', async () => {
  const { fakeReact, modulesFor } = await import('../wave2-test-support.mjs');
  for (const candidate of candidateIds)
    for (const renderTarget of [
      'server-render-menu-closed',
      'server-render-menu-open',
      'server-render-menu-open-active-alpha',
    ]) {
      const renderer = fakeReact();
      const modules = modulesFor(candidate, 'menu', {});
      const { createMenuCandidate } = await import(`./${candidate}.mjs`);
      const { MenuFixture } = await createMenuCandidate({
        React: renderer.React,
        environment: {},
        importModule: async (name) => modules.get(name),
      });
      const tree = renderer.render(MenuFixture, {
        request: {
          cell: { direction: 'ltr' },
          scenario: {
            operations: [{ operation: 'updateContent', target: renderTarget }],
            probes: [],
          },
        },
        renderTarget,
        onReady() {},
      });
      const items = elements(tree).find((n) => n.type?.name === 'CandidateOwner').props.model.items;
      assert.deepEqual(
        items.filter((item) => !item.type).map((item) => item.id),
        renderTarget.endsWith('active-alpha')
          ? ['alpha', 'beta', 'alpine', 'bravo']
          : ['alpha', 'beta', 'bravo'],
      );
      assert.deepEqual(
        items.filter((item) => item.type).map((item) => item.type),
        ['label', 'separator'],
      );
    }
});
