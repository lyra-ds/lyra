import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TOOLTIP_SCENARIOS, tooltipScenariosForCell, validateTooltipCoverage } from './tooltip.mjs';
import { checkCatalog } from './scenario-catalog.test-support.mjs';

const inventory = [
  ['of-tooltip.focus-immediate-ownership.v1', ['chromium', 'firefox', 'webkit', 'keyboard-focus']],
  ['of-tooltip.hover-initial-delay.v1', ['chromium', 'firefox', 'webkit']],
  ['of-tooltip.warm-coordinator.v1', ['chromium', 'firefox', 'webkit']],
  ['of-tooltip.pointer-transition-grace.v1', ['chromium', 'firefox', 'webkit']],
  ['of-tooltip.combined-focus-hover.v1', ['chromium', 'firefox', 'webkit', 'keyboard-focus']],
  ['of-tooltip.escape-no-focus-move.v1', ['chromium', 'firefox', 'webkit', 'keyboard-focus']],
  [
    'of-tooltip.stable-description.v1',
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
  ['of-tooltip.logical-placement.v1', ['chromium', 'firefox', 'webkit', 'ltr', 'rtl']],
  ['of-tooltip.coarse-pointer-alternative.v1', ['chromium', 'firefox', 'webkit', 'coarse-pointer']],
  [
    'of-tooltip.trigger-removal-stale-timer.v1',
    ['chromium', 'firefox', 'webkit', 'reduced-motion'],
  ],
  ['of-tooltip.final-owner-teardown.v1', ['chromium', 'firefox', 'webkit', 'reduced-motion']],
  ['of-tooltip.ssr-description.v1', ['ssr']],
  ['of-tooltip.hydration-stability.v1', ['react-18', 'react-19', 'hydration']],
];
checkCatalog(
  'tooltip',
  TOOLTIP_SCENARIOS,
  tooltipScenariosForCell,
  validateTooltipCoverage,
  inventory,
);

function scenario(id) {
  return TOOLTIP_SCENARIOS.find((s) => s.scenarioId === 'of-tooltip.' + id + '.v1');
}
function at(s, index, target, property) {
  const probe = s.probes.find(
    (p) => p.operationIndex === index && p.target === target && p.property === property,
  );
  assert.ok(probe, 'missing operation probe: ' + [index, target, property].join(' '));
  return s.expected.states[s.probes.filter((p) => p.category === 'states').indexOf(probe)].value;
}
function timing(s, index, milliseconds, target, property, value) {
  assert.deepEqual(s.operations[index], {
    operation: 'advanceTime',
    target: 'browser-clock',
    milliseconds,
  });
  assert.equal(at(s, index, target, property), value);
}
test('tooltip: mutation 499-to-500 breaks cold-hover exact boundary oracle', () => {
  const s = scenario('hover-initial-delay');
  assert.equal(s.operations[1].operation, 'hover');
  timing(s, 2, 499, 'tooltip', 'open', false);
  timing(s, 3, 1, 'tooltip', 'open', true);
  const changed = structuredClone(TOOLTIP_SCENARIOS);
  changed.find((entry) => entry.scenarioId === s.scenarioId).operations[2].milliseconds = 500;
  assert.ok(validateTooltipCoverage(changed).length);
});
test('tooltip: 0 ms warm entry, canceled expiry and fresh 299/300 ms cold boundary are separate observations', () => {
  const s = scenario('warm-coordinator');
  timing(s, 2, 299, 'coordinator', 'warm', true);
  assert.equal(at(s, 3, 'tooltip-b', 'open'), true);
  assert.equal(at(s, 3, 'open-delay-timer', 'active-count'), 0);
  timing(s, 4, 0, 'tooltip-b', 'open', true);
  timing(s, 6, 100, 'tooltip-b', 'open', false);
  timing(s, 7, 299, 'coordinator', 'warm', true);
  assert.equal(s.operations[8].operation, 'focus');
  assert.equal(at(s, 8, 'warm-expiry-timer', 'active-count'), 0);
  timing(s, 9, 300, 'coordinator', 'warm', true);
  assert.equal(s.operations[10].operation, 'blur');
  timing(s, 11, 299, 'coordinator', 'warm', true);
  timing(s, 12, 1, 'coordinator', 'warm', false);
  timing(s, 14, 499, 'tooltip-a', 'open', false);
  timing(s, 15, 1, 'tooltip-a', 'open', true);
});
test('tooltip: trigger-to-content crossing cancels grace; leaving both has independent 99/100 ms observations', () => {
  const s = scenario('pointer-transition-grace');
  timing(s, 4, 99, 'tooltip', 'open', true);
  assert.deepEqual(s.operations[5], { operation: 'hover', target: 'tooltip' });
  timing(s, 6, 1, 'tooltip', 'open', true);
  timing(s, 8, 99, 'tooltip', 'open', true);
  timing(s, 9, 1, 'tooltip', 'open', false);
});
test('tooltip: losing either owner independently preserves the other', () => {
  const s = scenario('combined-focus-hover');
  assert.equal(s.operations[2].target, 'outside');
  timing(s, 3, 100, 'tooltip', 'open', true);
  assert.equal(s.operations[5].operation, 'blur');
  assert.equal(at(s, 5, 'tooltip', 'open'), true);
  timing(s, 8, 99, 'tooltip', 'open', true);
  timing(s, 9, 1, 'tooltip', 'open', false);
});
test('tooltip: removal suppresses the pending 500 ms callback; final destroy makes a fresh owner cold', () => {
  const removed = scenario('trigger-removal-stale-timer');
  timing(removed, 2, 499, 'tooltip', 'open', false);
  assert.equal(removed.operations[3].target, 'remove-trigger');
  timing(removed, 4, 1, 'tooltip', 'open', false);
  assert.equal(at(removed, 4, 'announcements', 'count'), 0);
  const destroyed = scenario('final-owner-teardown');
  assert.equal(at(destroyed, 6, 'coordinator', 'owner-count'), 0);
  assert.equal(at(destroyed, 6, 'coordinator', 'warm'), false);
  timing(destroyed, 11, 499, 'tooltip', 'open', false);
  timing(destroyed, 12, 1, 'tooltip', 'open', true);
});
