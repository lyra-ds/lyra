import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MENU_SCENARIOS, menuScenariosForCell, validateMenuCoverage } from './menu.mjs';
import { checkCatalog } from './scenario-catalog.test-support.mjs';

const inventory = [
  [
    'of-menu.trigger-entry-keys.v1',
    ['chromium', 'firefox', 'webkit', 'react-18', 'react-19', 'keyboard-focus'],
  ],
  ['of-menu.arrow-wrap-roving-focus.v1', ['chromium', 'firefox', 'webkit', 'keyboard-focus']],
  ['of-menu.home-end-structural-skip.v1', ['chromium', 'firefox', 'webkit', 'keyboard-focus']],
  [
    'of-menu.disabled-discovery-no-activation.v1',
    ['chromium', 'firefox', 'webkit', 'keyboard-focus', 'axe-light', 'axe-dark', 'forced-colors'],
  ],
  [
    'of-menu.typeahead-reset-wrap.v1',
    ['chromium', 'firefox', 'webkit', 'keyboard-focus', 'ltr', 'rtl'],
  ],
  ['of-menu.repeated-character-cycle.v1', ['chromium', 'firefox', 'webkit', 'keyboard-focus']],
  ['of-menu.cancelable-selection.v1', ['chromium', 'firefox', 'webkit', 'react-18', 'react-19']],
  ['of-menu.tab-native-exit.v1', ['chromium', 'firefox', 'webkit', 'keyboard-focus']],
  ['of-menu.escape-successor-restoration.v1', ['chromium', 'firefox', 'webkit', 'keyboard-focus']],
  [
    'of-menu.public-model-variant-boundary.v1',
    ['chromium', 'firefox', 'webkit', 'axe-light', 'axe-dark', 'forced-colors', 'ltr', 'rtl'],
  ],
  ['of-menu.coarse-pointer-selection.v1', ['chromium', 'firefox', 'webkit', 'coarse-pointer']],
  ['of-menu.teardown.v1', ['chromium', 'firefox', 'webkit', 'reduced-motion']],
  ['of-menu.ssr-semantics.v1', ['ssr']],
  ['of-menu.hydration-stability.v1', ['react-18', 'react-19', 'hydration']],
];
checkCatalog('menu', MENU_SCENARIOS, menuScenariosForCell, validateMenuCoverage, inventory);

function scenario(id) {
  return MENU_SCENARIOS.find((s) => s.scenarioId === 'of-menu.' + id + '.v1');
}
// Assertions name consumer-control ordinals; a declared frame is the checkpoint.
const actions = (s) =>
  s.operations.filter((o) => !(o.operation === 'advanceTime' && o.milliseconds === 16));
function checkpoint(s, ordinal) {
  let seen = -1;
  for (const [index, operation] of s.operations.entries()) {
    if (operation.operation === 'advanceTime' && operation.milliseconds === 16) continue;
    if (++seen === ordinal)
      return s.operations[index + 1]?.operation === 'advanceTime' &&
        s.operations[index + 1]?.milliseconds === 16
        ? index + 1
        : index;
  }
}
function at(s, index, target, property) {
  index = checkpoint(s, index);
  const probe = s.probes.find(
    (p) => p.operationIndex === index && p.target === target && p.property === property,
  );
  assert.ok(probe, 'missing operation probe: ' + [index, target, property].join(' '));
  return s.expected.states[s.probes.filter((p) => p.category === 'states').indexOf(probe)].value;
}
test('menu: mutation unsupported menu role cannot synthesize supported variants or PASS', () => {
  const s = scenario('public-model-variant-boundary');
  assert.deepEqual(at(s, 2, 'menu', 'allowed-item-roles'), [
    'menuitem',
    'separator',
    'presentation',
  ]);
  for (const variant of ['submenu', 'checkbox', 'radio']) {
    assert.equal(at(s, 2, 'public-model', variant), 'not-applicable-current-public-model');
    const changed = structuredClone(MENU_SCENARIOS);
    changed
      .find((entry) => entry.scenarioId === s.scenarioId)
      .expected.states.find((p) => p.name === variant).value = 'PASS';
    assert.ok(validateMenuCoverage(changed).length);
  }
  for (const role of ['menuitemcheckbox', 'menuitemradio']) {
    const changed = structuredClone(MENU_SCENARIOS);
    changed
      .find((entry) => entry.scenarioId === s.scenarioId)
      .expected.roles.push({ role, name: 'Unsupported' });
    assert.ok(validateMenuCoverage(changed).length);
  }
});
test('menu: typeahead holds at 499 and resets at exactly 500 independently of matches', () => {
  for (const [id, before, boundary, buffer] of [
    ['typeahead-reset-wrap', 5, 6, 'br'],
    ['repeated-character-cycle', 6, 7, 'b'],
  ]) {
    const s = scenario(id);
    assert.deepEqual(actions(s)[before], {
      operation: 'advanceTime',
      target: 'browser-clock',
      milliseconds: 499,
    });
    assert.deepEqual(actions(s)[boundary], {
      operation: 'advanceTime',
      target: 'browser-clock',
      milliseconds: 1,
    });
    assert.equal(at(s, before, 'typeahead', 'buffer'), buffer);
    assert.equal(at(s, boundary, 'typeahead', 'buffer'), '');
  }
  const s = scenario('typeahead-reset-wrap');
  assert.equal(at(s, 2, 'document-focus', 'current'), 'beta');
  assert.equal(at(s, 4, 'document-focus', 'current'), 'bravo');
  assert.equal(at(s, 8, 'document-focus', 'current'), 'alpha');
  assert.equal(at(s, 10, 'document-focus', 'current'), 'beta');
  assert.equal(actions(s)[8].target, 'character-á');
  assert.equal(actions(s)[10].target, 'character-B');
});
test('menu: all commands including disabled participate in two full roving wraps', () => {
  const s = scenario('arrow-wrap-roving-focus');
  assert.deepEqual(
    s.expected.states.filter((p) => p.target === 'document-focus').map((p) => p.value),
    ['beta', 'alpine', 'bravo', 'alpha', 'bravo', 'alpine', 'beta', 'alpha'],
  );
  for (let index = 2; index <= 9; index++) {
    assert.equal(at(s, index, 'menu', 'tabindex-zero-item-count'), 1);
    assert.equal(at(s, index, 'other-command-items', 'tabindex'), -1);
    assert.equal(at(s, index, 'menu', 'aria-activedescendant-present'), false);
  }
});
test('menu: disabled discovery tests Enter Space and pointer, cancellation preserves previous selection', () => {
  const s = scenario('disabled-discovery-no-activation');
  assert.deepEqual(
    actions(s)
      .slice(3)
      .map((o) => o.target),
    ['enter-key', 'space-key', 'beta-down', 'beta-up'],
  );
  for (const index of [3, 4, 6]) {
    assert.equal(at(s, index, 'beta', 'activation-count'), 0);
    assert.equal(at(s, index, 'selection-handler', 'invocation-count'), 0);
    assert.equal(at(s, index, 'menu', 'selection'), null);
    assert.equal(at(s, index, 'menu', 'open'), true);
  }
  const cancel = scenario('cancelable-selection');
  assert.equal(actions(cancel)[6].target, 'end-key');
  assert.equal(at(cancel, 7, 'menu', 'selection'), 'alpha');
  assert.equal(at(cancel, 7, 'selection-handler', 'invocation-count'), 2);
  assert.equal(at(cancel, 7, 'menu', 'open'), true);
});

test('menu: trigger entry skips disabled endpoints rather than merely selecting list ends', () => {
  const s = scenario('trigger-entry-keys');
  assert.equal(s.initial.state.items[0].disabled, true);
  assert.equal(s.initial.state.items.at(-1).disabled, true);
  assert.deepEqual(
    s.expected.states
      .filter((entry) => entry.target === 'document-focus')
      .map((entry) => entry.value),
    ['alpha', 'alpha', 'alpha', 'bravo', 'disabled-first'],
  );
});

test('review regression: menu boundary input is supplied before entry with checkpoints preserved', () => {
  const s = scenario('trigger-entry-keys');
  assert.deepEqual(actions(s)[0], {
    operation: 'updateContent',
    target: 'menu-disabled-boundary-rows',
  });
  assert.deepEqual(actions(s)[1], { operation: 'focus', target: 'trigger' });
  for (const [index, focused] of [
    [2, 'alpha'],
    [5, 'alpha'],
    [8, 'alpha'],
    [11, 'bravo'],
    [15, 'disabled-first'],
  ])
    assert.equal(at(s, index, 'document-focus', 'current'), focused);
  assert.equal(at(s, 14, 'menu', 'reachable'), true);
  assert.ok(
    s.probes
      .filter((p) => p.category === 'roles')
      .every((p) => p.operationIndex === checkpoint(s, 15)),
  );
});
