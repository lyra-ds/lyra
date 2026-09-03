import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  MODAL_SCENARIOS,
  MODAL_WAVE_CELLS,
  modalScenariosForCell,
  validateModalCoverage,
} from './modal.mjs';
import { validateScenario } from './protocol.mjs';

const EXPECTED_SCENARIO_CELLS = new Map([
  [
    'of-modal.semantics-isolation.v1',
    ['chromium', 'firefox', 'webkit', 'axe-light', 'axe-dark', 'forced-colors'],
  ],
  [
    'of-modal.declared-initial-focus.v1',
    ['chromium', 'firefox', 'webkit', 'keyboard-focus', 'ltr', 'rtl'],
  ],
  ['of-modal.validation-initial-focus.v1', ['chromium', 'firefox', 'webkit', 'keyboard-focus']],
  ['of-modal.destructive-initial-focus.v1', ['chromium', 'firefox', 'webkit', 'keyboard-focus']],
  ['of-modal.no-tabbables-panel-fallback.v1', ['chromium', 'firefox', 'webkit', 'keyboard-focus']],
  ['of-modal.focus-wrap-dynamic.v1', ['chromium', 'firefox', 'webkit', 'keyboard-focus']],
  ['of-modal.focused-node-removal.v1', ['chromium', 'firefox', 'webkit', 'keyboard-focus']],
  ['of-modal.nested-topmost.v1', ['chromium', 'firefox', 'webkit', 'keyboard-focus', 'ltr', 'rtl']],
  ['of-modal.pointer-origin-dismiss.v1', ['chromium', 'firefox', 'webkit', 'coarse-pointer']],
  [
    'of-modal.controlled-close-commit.v1',
    ['chromium', 'firefox', 'webkit', 'react-18', 'react-19'],
  ],
  ['of-modal.scroll-lock-reference-count.v1', ['chromium', 'firefox', 'webkit', 'coarse-pointer']],
  ['of-modal.exit-inactive-reopen.v1', ['chromium', 'firefox', 'webkit', 'reduced-motion']],
  ['of-modal.opener-restoration-successor.v1', ['chromium', 'firefox', 'webkit', 'keyboard-focus']],
  ['of-modal.parent-close-with-child.v1', ['chromium', 'firefox', 'webkit', 'keyboard-focus']],
  ['of-modal.unmount-cleanup.v1', ['chromium', 'firefox', 'webkit', 'reduced-motion']],
  ['of-modal.ssr-open-semantics.v1', ['ssr']],
  ['of-modal.hydration-stability.v1', ['react-18', 'react-19', 'hydration']],
]);

const EXPECTED_OPERATIONS = new Map([
  ['of-modal.semantics-isolation.v1', ['open:modal-opener']],
  [
    'of-modal.declared-initial-focus.v1',
    [
      'updateContent:declare-safe-initial-focus',
      'open:modal-opener',
      'close:modal-panel',
      'updateContent:declare-invalid-initial-focus',
      'open:modal-opener',
    ],
  ],
  [
    'of-modal.validation-initial-focus.v1',
    [
      'updateContent:enabled-invalid-field-case',
      'open:modal-opener',
      'close:modal-panel',
      'updateContent:focusable-summary-fallback-case',
      'open:modal-opener',
    ],
  ],
  [
    'of-modal.destructive-initial-focus.v1',
    ['updateContent:destructive-confirmation', 'open:modal-opener'],
  ],
  [
    'of-modal.no-tabbables-panel-fallback.v1',
    ['updateContent:no-tabbable-content', 'open:modal-opener'],
  ],
  [
    'of-modal.focus-wrap-dynamic.v1',
    [
      'open:modal-opener',
      'press:tab-from-last-target',
      'press:shift-tab-from-first-target',
      'updateContent:hide-disable-remove-tab-targets',
      'press:tab-from-first-target',
    ],
  ],
  [
    'of-modal.focused-node-removal.v1',
    [
      'open:modal-opener',
      'press:middle-focus-target',
      'updateContent:remove-focused-target',
      'updateContent:remove-nearest-safe-target',
    ],
  ],
  [
    'of-modal.nested-topmost.v1',
    [
      'setDirection:ltr',
      'open:parent-modal',
      'open:child-modal',
      'press:escape-key',
      'close:parent-modal',
      'setDirection:rtl',
      'open:parent-modal',
      'open:child-modal',
      'press:escape-key',
    ],
  ],
  [
    'of-modal.pointer-origin-dismiss.v1',
    [
      'open:modal-opener',
      'point:outside-down-up',
      'open:modal-opener',
      'point:outside-drag-inside',
      'point:outside-cancel',
      'point:outside-context-menu',
      'point:child-interaction',
      'point:outside-prevented-default',
    ],
  ],
  [
    'of-modal.controlled-close-commit.v1',
    ['open:controlled-modal', 'press:dismiss-control', 'updateContent:controlled-close-commit'],
  ],
  [
    'of-modal.scroll-lock-reference-count.v1',
    [
      'open:first-modal',
      'open:second-modal',
      'close:second-modal',
      'close:first-modal',
      'point:page-scroll-surface',
    ],
  ],
  [
    'of-modal.exit-inactive-reopen.v1',
    [
      'setMotionPreference:reduced-motion',
      'open:modal-opener',
      'close:modal-panel',
      'open:modal-opener',
    ],
  ],
  [
    'of-modal.opener-restoration-successor.v1',
    [
      'open:connected-opener',
      'close:modal-panel',
      'open:connected-opener',
      'updateContent:disconnect-opener',
      'close:modal-panel',
    ],
  ],
  [
    'of-modal.parent-close-with-child.v1',
    ['open:parent-modal', 'open:child-modal', 'close:parent-modal'],
  ],
  [
    'of-modal.unmount-cleanup.v1',
    [
      'destroy:entry-phase-modal',
      'open:open-phase-modal',
      'destroy:open-phase-modal',
      'open:exit-phase-modal',
      'close:exit-phase-modal',
      'destroy:exit-phase-modal',
    ],
  ],
  ['of-modal.ssr-open-semantics.v1', ['open:server-rendered-modal']],
  [
    'of-modal.hydration-stability.v1',
    ['open:server-rendered-modal', 'updateContent:hydrate-first-tree', 'press:hydrated-input'],
  ],
]);

test('owns exactly the fifteen behavioral modal cells', () => {
  assert.deepEqual(MODAL_WAVE_CELLS, [
    'chromium',
    'firefox',
    'webkit',
    'react-18',
    'react-19',
    'ssr',
    'hydration',
    'keyboard-focus',
    'axe-light',
    'axe-dark',
    'forced-colors',
    'reduced-motion',
    'ltr',
    'rtl',
    'coarse-pointer',
  ]);
  assert.throws(() => MODAL_WAVE_CELLS.push('bundle-size'), TypeError);
});

test('covers every modal cell and only OF-MODAL with immutable v1 IDs', () => {
  assert.deepEqual(validateModalCoverage(MODAL_SCENARIOS), []);
  for (const scenario of MODAL_SCENARIOS) {
    assert.equal(scenario.contractId, 'OF-MODAL');
    assert.match(scenario.scenarioId, /^of-modal\.[a-z0-9-]+\.v1$/u);
    assert.deepEqual(validateScenario(scenario), []);
    assert.equal(Object.isFrozen(scenario), true);
  }
  assert.deepEqual(
    new Set(MODAL_SCENARIOS.flatMap(({ requiredCells }) => requiredCells)),
    new Set(MODAL_WAVE_CELLS),
  );
  assert.deepEqual(
    new Map(MODAL_SCENARIOS.map(({ scenarioId, requiredCells }) => [scenarioId, requiredCells])),
    EXPECTED_SCENARIO_CELLS,
  );
  assert.throws(() => MODAL_SCENARIOS.push(structuredClone(MODAL_SCENARIOS[0])), TypeError);
});

test('explicitly enumerates each scenario ordered operations and normative expected fields', () => {
  assert.deepEqual(
    new Map(
      MODAL_SCENARIOS.map(({ scenarioId, operations }) => [
        scenarioId,
        operations.map(({ operation, target }) => `${operation}:${target}`),
      ]),
    ),
    EXPECTED_OPERATIONS,
  );
  for (const { expected } of MODAL_SCENARIOS) {
    assert.deepEqual(Object.keys(expected), [
      'roles',
      'relationships',
      'states',
      'focus',
      'events',
      'announcements',
      'cleanup',
    ]);
  }
});

test('binds every literal assertion to one closed candidate-neutral phase probe', () => {
  const allowedKeys = new Set([
    'category',
    'id',
    'operationIndex',
    'operationIndexes',
    'phase',
    'property',
    'relatedTarget',
    'target',
  ]);
  for (const scenario of MODAL_SCENARIOS) {
    assert.equal(Array.isArray(scenario.probes), true, scenario.scenarioId);
    const expectedCounts = {
      roles: scenario.expected.roles.length,
      relationships: scenario.expected.relationships.length,
      states: scenario.expected.states.length,
      focus: 1,
      events: scenario.expected.events.length,
      announcements: scenario.expected.announcements.length,
      cleanup: scenario.expected.cleanup.length,
    };
    const actualCounts = Object.fromEntries(Object.keys(expectedCounts).map((key) => [key, 0]));
    const ids = new Set();
    for (const probe of scenario.probes) {
      assert.deepEqual(
        Object.keys(probe).filter((key) => !allowedKeys.has(key)),
        [],
        `${scenario.scenarioId}/${probe.id} has an outcome-bearing field`,
      );
      assert.equal(ids.has(probe.id), false, `${scenario.scenarioId}/${probe.id}`);
      ids.add(probe.id);
      assert.equal(Object.hasOwn(actualCounts, probe.category), true);
      actualCounts[probe.category] += 1;
      assert.equal(
        ['after-operation', 'after-cleanup', 'server-render'].includes(probe.phase),
        true,
      );
      if (probe.phase === 'after-operation') {
        assert.equal(Number.isSafeInteger(probe.operationIndex), true);
        assert.equal(probe.operationIndex >= 0, true);
        assert.equal(probe.operationIndex < scenario.operations.length, true);
      } else {
        assert.equal(Object.hasOwn(probe, 'operationIndex'), false);
      }
      assert.equal(typeof probe.property, 'string');
      assert.equal(probe.property.length > 0, true);
    }
    assert.deepEqual(actualCounts, expectedCounts, scenario.scenarioId);
    assert.equal(Object.isFrozen(scenario.probes), true);
  }
});

test('runs nested topmost ownership and restoration in both LTR and RTL', () => {
  const scenario = MODAL_SCENARIOS.find(
    ({ scenarioId }) => scenarioId === 'of-modal.nested-topmost.v1',
  );
  assert.deepEqual(scenario.expected.events, [
    { target: 'ltr-child-modal', type: 'escape-owned' },
    { target: 'ltr-child-modal', type: 'closed' },
    { target: 'ltr-parent-modal-safe-target', type: 'focus-restored' },
    { target: 'rtl-child-modal', type: 'escape-owned' },
    { target: 'rtl-child-modal', type: 'closed' },
    { target: 'rtl-parent-modal-safe-target', type: 'focus-restored' },
  ]);
  assert.deepEqual(scenario.expected.focus, { target: 'rtl-parent-modal-safe-target' });
});

test('disconnects the active opener before closing to exercise successor restoration', () => {
  const scenario = MODAL_SCENARIOS.find(
    ({ scenarioId }) => scenarioId === 'of-modal.opener-restoration-successor.v1',
  );
  assert.deepEqual(scenario.expected.relationships, [
    { source: 'modal-panel', name: 'opened-by', target: 'meaningful-opener' },
    { source: 'disconnected-opener', name: 'succeeds-to', target: 'documented-successor' },
  ]);
  assert.deepEqual(scenario.expected.focus, { target: 'documented-successor' });
  assert.deepEqual(scenario.expected.events, [
    { target: 'connected-meaningful-opener', type: 'focus-restored' },
    { target: 'documented-successor', type: 'focus-restored' },
  ]);
  assert.deepEqual(scenario.expected.states, [
    { target: 'connected-meaningful-opener', name: 'restoration-wins', value: true },
    { target: 'disconnected-opener', name: 'connected', value: false },
    { target: 'documented-successor', name: 'restoration-wins', value: true },
    { target: 'document-body', name: 'focus-received', value: false },
  ]);
});

test('records literal initial focus for invalid-field and summary-fallback phases', () => {
  const scenario = MODAL_SCENARIOS.find(
    ({ scenarioId }) => scenarioId === 'of-modal.validation-initial-focus.v1',
  );
  assert.deepEqual(scenario.expected.focus, { target: 'focusable-validation-summary' });
  assert.deepEqual(scenario.expected.events, [
    { target: 'first-invalid-enabled-field', type: 'validation-initial-focus-applied' },
    { target: 'focusable-validation-summary', type: 'validation-initial-focus-applied' },
  ]);
  assert.deepEqual(scenario.expected.states, [
    { target: 'first-invalid-enabled-field', name: 'invalid', value: true },
    { target: 'first-invalid-enabled-field', name: 'initial-focus-received', value: true },
    { target: 'disabled-invalid-field', name: 'initial-focus-received', value: false },
    { target: 'focusable-validation-summary', name: 'initial-focus-received', value: true },
  ]);
});

test('returns the exact modal scenarios for a behavioral cell', () => {
  assert.deepEqual(
    modalScenariosForCell('coarse-pointer').map(({ scenarioId }) => scenarioId),
    ['of-modal.pointer-origin-dismiss.v1', 'of-modal.scroll-lock-reference-count.v1'],
  );
  assert.deepEqual(modalScenariosForCell('bundle-size'), []);
});

for (const [scenarioId, field] of [
  ['of-modal.semantics-isolation.v1', 'roles'],
  ['of-modal.declared-initial-focus.v1', 'focus'],
  ['of-modal.validation-initial-focus.v1', 'focus'],
  ['of-modal.destructive-initial-focus.v1', 'focus'],
  ['of-modal.no-tabbables-panel-fallback.v1', 'focus'],
  ['of-modal.focus-wrap-dynamic.v1', 'events'],
  ['of-modal.focused-node-removal.v1', 'events'],
  ['of-modal.nested-topmost.v1', 'relationships'],
  ['of-modal.pointer-origin-dismiss.v1', 'events'],
  ['of-modal.controlled-close-commit.v1', 'states'],
  ['of-modal.scroll-lock-reference-count.v1', 'states'],
  ['of-modal.exit-inactive-reopen.v1', 'cleanup'],
  ['of-modal.opener-restoration-successor.v1', 'events'],
  ['of-modal.parent-close-with-child.v1', 'cleanup'],
  ['of-modal.unmount-cleanup.v1', 'cleanup'],
  ['of-modal.ssr-open-semantics.v1', 'roles'],
  ['of-modal.hydration-stability.v1', 'states'],
]) {
  test(`rejects omission of required ${field} evidence from ${scenarioId}`, () => {
    const scenarios = structuredClone(MODAL_SCENARIOS);
    const scenario = scenarios.find((entry) => entry.scenarioId === scenarioId);
    if (field === 'focus') delete scenario.expected.focus;
    else scenario.expected[field].shift();

    assert.match(validateModalCoverage(scenarios).join('\n'), new RegExp(field, 'u'));
  });
}

for (const [label, mutate] of [
  [
    'scenario ID',
    (scenario) => {
      scenario.scenarioId = 'of-modal.radix-modal.v1';
    },
  ],
  [
    'components',
    (scenario) => {
      scenario.components = ['BaseUIDialog'];
    },
  ],
  [
    'initial markup vendor selector',
    (scenario) => {
      scenario.initial.markup = '<button data-radix-trigger>Open</button>';
    },
  ],
  [
    'initial state',
    (scenario) => {
      scenario.initial.state.library = 'incumbent';
    },
  ],
  [
    'operation',
    (scenario) => {
      scenario.operations[0].operation = 'zag-open';
    },
  ],
  [
    'operation target',
    (scenario) => {
      scenario.operations[0].target = 'radix-trigger';
    },
  ],
  [
    'expected role',
    (scenario) => {
      scenario.expected.roles[0].role = 'radix-dialog';
    },
  ],
  [
    'expected relationship vendor selector',
    (scenario) => {
      scenario.expected.relationships[0].vendorSelector = '[data-base-ui-dialog]';
    },
  ],
  [
    'expected state',
    (scenario) => {
      scenario.expected.states[0].target = 'zag-dialog';
    },
  ],
  [
    'expected focus',
    (scenario) => {
      scenario.expected.focus.target = 'incumbent-focus';
    },
  ],
  [
    'expected vendor event',
    (scenario) => {
      scenario.expected.events[0].vendorEvent = 'radix:open';
    },
  ],
  [
    'expected announcement',
    (scenario) => {
      scenario.expected.announcements[0].message = 'base-ui';
    },
  ],
  [
    'expected cleanup',
    (scenario) => {
      scenario.expected.cleanup[0] = 'zag-cleanup';
    },
  ],
  [
    'required cells',
    (scenario) => {
      scenario.requiredCells[0] = 'radix-browser';
    },
  ],
  [
    'capture',
    (scenario) => {
      scenario.capture[0] = 'incumbent-dom';
    },
  ],
]) {
  test(`rejects candidate or vendor identity in modal ${label}`, () => {
    const scenario = structuredClone(MODAL_SCENARIOS[0]);
    mutate(scenario);
    assert.match(validateScenario(scenario).join('\n'), /candidate or vendor coupling/u);
  });
}

test('rejects duplicate, missing, extra, invalid, and out-of-wave modal scenarios', () => {
  const duplicate = structuredClone(MODAL_SCENARIOS);
  duplicate.push(structuredClone(duplicate[0]));
  assert.match(validateModalCoverage(duplicate).join('\n'), /duplicate/u);

  const missing = structuredClone(MODAL_SCENARIOS).slice(1);
  assert.match(validateModalCoverage(missing).join('\n'), /scenario ID set/u);

  const extra = structuredClone(MODAL_SCENARIOS);
  extra.push({ ...structuredClone(extra[0]), scenarioId: 'of-modal.extra.v1' });
  assert.match(validateModalCoverage(extra).join('\n'), /scenario ID set/u);

  const invalid = structuredClone(MODAL_SCENARIOS);
  invalid[0].contractId = 'OF-MENU';
  assert.match(validateModalCoverage(invalid).join('\n'), /OF-MODAL|contractId/u);

  const outOfWave = structuredClone(MODAL_SCENARIOS);
  outOfWave[0].requiredCells.push('bundle-size');
  assert.match(validateModalCoverage(outOfWave).join('\n'), /cell set|requiredCells/u);
});
