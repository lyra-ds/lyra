import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CANDIDATE_IDS,
  CONTRACT_IDS,
  FAILURE_CLASSIFICATIONS,
  FIXTURE_OPERATIONS,
  RESULTS,
  validateScenario,
} from './protocol.mjs';

const validScenario = {
  schemaVersion: 1,
  revision: 1,
  contractId: 'OF-MODAL',
  scenarioId: 'of-modal.initial-focus.v1',
  components: ['Dialog'],
  initial: { markup: '<button>Open</button>', state: { open: false } },
  operations: [{ operation: 'open', target: 'primary-trigger' }],
  expected: {
    roles: [{ role: 'dialog', name: 'Settings' }],
    relationships: [],
    states: [{ target: 'dialog', name: 'open', value: true }],
    focus: { target: 'first-focusable' },
    events: [],
    announcements: [],
    cleanup: ['body-scroll-unlocked', 'background-interactive'],
  },
  requiredCells: ['chromium', 'firefox', 'webkit'],
  capture: ['dom', 'accessibility-tree', 'events'],
};

test('exports the five immutable contract IDs', () => {
  assert.deepEqual(CONTRACT_IDS, [
    'OF-MODAL',
    'OF-ANCHORED',
    'OF-MENU',
    'OF-TOOLTIP',
    'OF-COMPOSED',
  ]);
  assert.throws(() => CONTRACT_IDS.push('OF-EXTRA'), TypeError);
});

test('exports the shared immutable protocol vocabularies', () => {
  assert.deepEqual(CANDIDATE_IDS, ['incumbent', 'radix', 'base-ui', 'zag']);
  assert.deepEqual(RESULTS, ['PASS', 'FAIL', 'unavailable']);
  assert.deepEqual(FAILURE_CLASSIFICATIONS, [
    'product',
    'fixture',
    'infrastructure',
    'security',
    'packaging',
    'measurement',
    'policy',
  ]);
  assert.deepEqual(FIXTURE_OPERATIONS, [
    'open',
    'close',
    'press',
    'point',
    'setDirection',
    'setMotionPreference',
    'updateContent',
    'destroy',
  ]);
});

test('accepts a complete candidate-neutral scenario', () => {
  assert.deepEqual(validateScenario(validScenario), []);
});

for (const forbiddenKey of ['candidateId', 'vendorSelector', 'vendorAttribute']) {
  test(`rejects scenario-owned ${forbiddenKey}`, () => {
    assert.match(
      validateScenario({ ...validScenario, [forbiddenKey]: 'radix' }).join('\n'),
      /unsupported key/u,
    );
  });
}

test('rejects unknown operations and missing expected focus', () => {
  const scenario = structuredClone(validScenario);
  scenario.operations = [{ operation: 'clickVendorNode', target: 'x' }];
  delete scenario.expected.focus;
  const errors = validateScenario(scenario).join('\n');
  assert.match(errors, /operation is invalid/u);
  assert.match(errors, /expected.focus/u);
});
