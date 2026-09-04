import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ANCHORED_SCENARIOS,
  anchoredScenariosForCell,
  validateAnchoredCoverage,
} from './anchored.mjs';
import { checkCatalog } from './scenario-catalog.test-support.mjs';

const inventory = [
  [
    'of-anchored.popup-trigger-relationships.v1',
    [
      'chromium',
      'firefox',
      'webkit',
      'react-18',
      'react-19',
      'axe-light',
      'axe-dark',
      'forced-colors',
    ],
  ],
  [
    'of-anchored.preferred-flip-shift-constraint.v1',
    ['chromium', 'firefox', 'webkit', 'forced-colors', 'coarse-pointer'],
  ],
  [
    'of-anchored.live-placement-updates.v1',
    ['chromium', 'firefox', 'webkit', 'keyboard-focus', 'reduced-motion'],
  ],
  ['of-anchored.logical-direction.v1', ['chromium', 'firefox', 'webkit', 'ltr', 'rtl']],
  [
    'of-anchored.nested-child-pointer-origin.v1',
    ['chromium', 'firefox', 'webkit', 'coarse-pointer'],
  ],
  [
    'of-anchored.topmost-escape-restoration.v1',
    ['chromium', 'firefox', 'webkit', 'keyboard-focus', 'ltr', 'rtl'],
  ],
  ['of-anchored.portal-context.v1', ['chromium', 'firefox', 'webkit', 'axe-light', 'axe-dark']],
  ['of-anchored.trigger-removal-successor.v1', ['chromium', 'firefox', 'webkit', 'keyboard-focus']],
  ['of-anchored.teardown.v1', ['chromium', 'firefox', 'webkit', 'reduced-motion']],
  ['of-anchored.ssr-semantics.v1', ['ssr']],
  ['of-anchored.hydration-stability.v1', ['react-18', 'react-19', 'hydration']],
];
checkCatalog(
  'anchored',
  ANCHORED_SCENARIOS,
  anchoredScenariosForCell,
  validateAnchoredCoverage,
  inventory,
);

function scenario(id) {
  return ANCHORED_SCENARIOS.find((s) => s.scenarioId === 'of-anchored.' + id + '.v1');
}
function at(s, index, target, property) {
  const probe = s.probes.find(
    (p) => p.operationIndex === index && p.target === target && p.property === property,
  );
  assert.ok(probe, 'missing operation probe: ' + [index, target, property].join(' '));
  const position = s.probes.filter((p) => p.category === 'states').indexOf(probe);
  return s.expected.states[position].value;
}
test('anchored: mutation expected-from-observation cannot replace literal placement oracle', () => {
  const s = scenario('preferred-flip-shift-constraint');
  assert.equal(at(s, 1, 'popup', 'side'), 'bottom');
  assert.equal(at(s, 2, 'popup', 'side'), 'top');
  assert.equal(at(s, 3, 'popup', 'shifted'), true);
  assert.equal(at(s, 4, 'popup', 'bounded-scroll-region'), true);
  for (const index of [1, 2, 3, 4])
    assert.equal(at(s, index, 'popup', 'visual-viewport-contained'), true);
  assert.deepEqual(
    s.operations.slice(2, 5).map((o) => [o.operation, o.target]),
    [
      ['resize', 'trigger-bottom-edge'],
      ['resize', 'trigger-right-edge'],
      ['resize', 'content-height-900'],
    ],
  );
  assert.deepEqual(s.initial.state.viewport, { x: 0, y: 0, width: 800, height: 600 });
  const changed = structuredClone(ANCHORED_SCENARIOS);
  const placement = changed.find((entry) => entry.scenarioId === s.scenarioId);
  placement.expected.states[0].value = { source: 'observation', property: 'side' };
  assert.ok(validateAnchoredCoverage(changed).length);
});
test('anchored: each resize and ancestor scroll updates with unchanged focus and no semantic event', () => {
  const s = scenario('live-placement-updates');
  assert.deepEqual(
    s.operations.slice(3, 8).map((o) => o.target),
    [
      'trigger-width-160',
      'content-width-280',
      'viewport-width-640',
      'visual-viewport-offset-40',
      'ancestor-y-80',
    ],
  );
  for (const index of [3, 4, 5, 6, 7]) {
    assert.equal(at(s, index, 'placement', 'updated-since-operation'), true);
    assert.equal(at(s, index, 'document-focus', 'current'), 'trigger');
    assert.equal(at(s, index, 'semantic-events', 'count-since-operation'), 0);
  }
  assert.equal(s.operations[8].operation, 'close');
  for (const index of [9, 10])
    assert.equal(at(s, index, 'placement', 'measurement-count-since-operation'), 0);
});
test('anchored: pointer dismissal has explicit independent down/up, drag, cancel and context-menu operations', () => {
  const s = scenario('nested-child-pointer-origin');
  assert.deepEqual(
    s.operations.slice(2).map((o) => o.target),
    [
      'child-down',
      'child-up',
      'outside-down',
      'inside-up',
      'inside-down',
      'outside-up',
      'outside-down',
      'outside-drag',
      'outside-up',
      'outside-down',
      'outside-pointer-cancel',
      'outside-up',
      'outside-context-menu-down',
      'outside-context-menu-up',
      'outside-down',
      'outside-up',
    ],
  );
  for (let index = 2; index <= 16; index++) assert.equal(at(s, index, 'child-popup', 'open'), true);
  assert.equal(at(s, 17, 'child-popup', 'open'), false);
});
test('anchored: logical direction exercises both alignments and horizontal sides in LTR and RTL', () => {
  const s = scenario('logical-direction');
  assert.deepEqual(
    s.operations.filter((o) => o.operation === 'setDirection').map((o) => o.target),
    ['ltr', 'rtl'],
  );
  assert.deepEqual(
    s.expected.states.filter((p) => p.name === 'physical-side').map((p) => p.value),
    ['bottom', 'bottom', 'top', 'left', 'right', 'bottom', 'bottom', 'top', 'right', 'left'],
  );
  assert.deepEqual(
    s.expected.states.filter((p) => p.name === 'alignment-edge').map((p) => p.value),
    ['left', 'right', 'left', 'center', 'center', 'right', 'left', 'right', 'center', 'center'],
  );
});

test('anchored: popup trigger invariants hold closed and open across reopening', () => {
  const s = scenario('popup-trigger-relationships');
  assert.deepEqual(
    s.operations.map(({ operation, target }) => [operation, target]),
    [
      ['focus', 'trigger'],
      ['open', 'trigger'],
      ['close', 'popup'],
      ['open', 'trigger'],
    ],
  );
  for (const index of [0, 1, 2, 3]) {
    assert.equal(at(s, index, 'trigger', 'semantic-trigger-count'), 1);
    assert.equal(at(s, index, 'trigger', 'tab-stop-count'), 1);
    assert.deepEqual(at(s, index, 'trigger', 'aria-haspopup-by-component'), {
      Popover: 'dialog',
      Dropdown: 'menu',
      WorkspaceSwitcher: 'listbox',
    });
    assert.equal(at(s, index, 'trigger', 'aria-expanded'), index % 2 === 1);
    assert.equal(at(s, index, 'trigger', 'aria-controls'), 'popup-id');
  }
});
