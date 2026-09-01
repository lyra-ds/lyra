import { isDeepStrictEqual } from 'node:util';

import { validateScenario } from './protocol.mjs';

export const MODAL_WAVE_CELLS = Object.freeze([
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

function freezeJson(value) {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const entry of Object.values(value)) freezeJson(entry);
  return Object.freeze(value);
}

function modalScenario({ id, operations, expected, cells, state = {} }) {
  return freezeJson({
    schemaVersion: 1,
    revision: 1,
    contractId: 'OF-MODAL',
    scenarioId: `of-modal.${id}.v1`,
    components: ['Dialog', 'Drawer', 'BottomSheet', 'CommandPalette', 'CreateWorkspaceDialog'],
    initial: {
      markup: '<button data-fixture-control="opener">Open</button>',
      state,
    },
    operations,
    expected,
    requiredCells: cells,
    capture: ['dom', 'accessibility-tree', 'events', 'focus', 'resources'],
  });
}

export const MODAL_SCENARIOS = Object.freeze([
  modalScenario({
    id: 'semantics-isolation',
    state: { open: false, colorMode: 'light', forcedColors: false },
    operations: [{ operation: 'open', target: 'modal-opener' }],
    expected: {
      roles: [{ role: 'dialog', name: 'Workspace details' }],
      relationships: [
        { source: 'modal-panel', name: 'labelled-by', target: 'modal-title' },
        { source: 'modal-panel', name: 'described-by', target: 'modal-description' },
      ],
      states: [
        { target: 'modal-panel', name: 'aria-modal', value: true },
        { target: 'background', name: 'inert', value: true },
        { target: 'background', name: 'accessibility-branch', value: 'absent' },
      ],
      focus: { target: 'modal-safe-target' },
      events: [{ target: 'modal-panel', type: 'opened' }],
      announcements: [{ message: 'Workspace details dialog opened' }],
      cleanup: ['background-interactive', 'background-accessibility-branch-restored'],
    },
    cells: ['chromium', 'firefox', 'webkit', 'axe-light', 'axe-dark', 'forced-colors'],
  }),
  modalScenario({
    id: 'declared-initial-focus',
    state: { open: false, direction: 'ltr', declaredTarget: 'safe-initial-focus' },
    operations: [
      { operation: 'updateContent', target: 'declare-safe-initial-focus' },
      { operation: 'open', target: 'modal-opener' },
      { operation: 'close', target: 'modal-panel' },
      { operation: 'updateContent', target: 'declare-invalid-initial-focus' },
      { operation: 'open', target: 'modal-opener' },
    ],
    expected: {
      roles: [{ role: 'dialog', name: 'Create workspace' }],
      relationships: [{ source: 'modal-panel', name: 'labelled-by', target: 'modal-title' }],
      states: [
        { target: 'safe-declared-target', name: 'initial-focus-received', value: true },
        { target: 'invalid-declared-target', name: 'initial-focus-received', value: false },
        { target: 'safe-fallback-target', name: 'fallback-received', value: true },
      ],
      focus: { target: 'safe-declared-target-then-safe-fallback-target' },
      events: [
        { target: 'safe-declared-target', type: 'initial-focus-applied' },
        { target: 'invalid-declared-target', type: 'initial-focus-skipped' },
        { target: 'safe-fallback-target', type: 'initial-focus-applied' },
      ],
      announcements: [{ message: 'Create workspace dialog opened' }],
      cleanup: ['initial-focus-guard-released', 'background-interactive'],
    },
    cells: ['chromium', 'firefox', 'webkit', 'keyboard-focus', 'ltr', 'rtl'],
  }),
  modalScenario({
    id: 'validation-initial-focus',
    state: { open: false, validationErrors: true },
    operations: [
      { operation: 'updateContent', target: 'validation-errors' },
      { operation: 'open', target: 'modal-opener' },
    ],
    expected: {
      roles: [{ role: 'dialog', name: 'Correct workspace details' }],
      relationships: [
        { source: 'first-invalid-enabled-field', name: 'described-by', target: 'field-error' },
      ],
      states: [
        { target: 'first-invalid-enabled-field', name: 'invalid', value: true },
        { target: 'disabled-invalid-field', name: 'initial-focus-received', value: false },
      ],
      focus: { target: 'first-invalid-enabled-field-or-focusable-summary' },
      events: [{ target: 'first-invalid-enabled-field', type: 'validation-initial-focus-applied' }],
      announcements: [{ message: 'Workspace details contain validation errors' }],
      cleanup: ['validation-focus-guard-released', 'background-interactive'],
    },
    cells: ['chromium', 'firefox', 'webkit', 'keyboard-focus'],
  }),
  modalScenario({
    id: 'destructive-initial-focus',
    state: { open: false, destructiveAction: true },
    operations: [
      { operation: 'updateContent', target: 'destructive-confirmation' },
      { operation: 'open', target: 'modal-opener' },
    ],
    expected: {
      roles: [{ role: 'alertdialog', name: 'Delete workspace' }],
      relationships: [
        { source: 'modal-panel', name: 'described-by', target: 'destructive-warning' },
      ],
      states: [
        { target: 'least-destructive-action', name: 'initial-focus-received', value: true },
        { target: 'destructive-action', name: 'initial-focus-received', value: false },
        { target: 'declared-action', name: 'initial-focus-received', value: false },
      ],
      focus: { target: 'least-destructive-action' },
      events: [{ target: 'least-destructive-action', type: 'initial-focus-applied' }],
      announcements: [{ message: 'Delete workspace confirmation opened' }],
      cleanup: ['destructive-focus-guard-released', 'background-interactive'],
    },
    cells: ['chromium', 'firefox', 'webkit', 'keyboard-focus'],
  }),
  modalScenario({
    id: 'no-tabbables-panel-fallback',
    state: { open: false, tabbableCount: 0 },
    operations: [
      { operation: 'updateContent', target: 'no-tabbable-content' },
      { operation: 'open', target: 'modal-opener' },
    ],
    expected: {
      roles: [{ role: 'dialog', name: 'Processing workspace' }],
      relationships: [{ source: 'modal-panel', name: 'labelled-by', target: 'modal-title' }],
      states: [
        { target: 'modal-panel', name: 'tabindex', value: -1 },
        { target: 'modal-panel', name: 'named', value: true },
      ],
      focus: { target: 'modal-panel' },
      events: [{ target: 'modal-panel', type: 'panel-fallback-focus-applied' }],
      announcements: [{ message: 'Processing workspace dialog opened' }],
      cleanup: ['panel-fallback-focus-released', 'background-interactive'],
    },
    cells: ['chromium', 'firefox', 'webkit', 'keyboard-focus'],
  }),
  modalScenario({
    id: 'focus-wrap-dynamic',
    state: { open: false, dynamicTargets: true },
    operations: [
      { operation: 'open', target: 'modal-opener' },
      { operation: 'press', target: 'tab-from-last-target' },
      { operation: 'press', target: 'shift-tab-from-first-target' },
      { operation: 'updateContent', target: 'hide-disable-remove-tab-targets' },
      { operation: 'press', target: 'tab-from-first-target' },
    ],
    expected: {
      roles: [{ role: 'dialog', name: 'Workspace commands' }],
      relationships: [
        { source: 'modal-panel', name: 'contains-focus', target: 'eligible-tab-targets' },
      ],
      states: [
        { target: 'hidden-tab-target', name: 'tab-eligible', value: false },
        { target: 'disabled-tab-target', name: 'tab-eligible', value: false },
        { target: 'removed-tab-target', name: 'tab-eligible', value: false },
      ],
      focus: { target: 'first-eligible-target-after-wrap' },
      events: [
        { target: 'first-eligible-target', type: 'forward-tab-wrapped' },
        { target: 'last-eligible-target', type: 'reverse-tab-wrapped' },
        { target: 'eligible-tab-targets', type: 'dynamic-targets-recomputed' },
      ],
      announcements: [{ message: 'Workspace commands dialog opened' }],
      cleanup: ['focus-loop-listener-released', 'background-interactive'],
    },
    cells: ['chromium', 'firefox', 'webkit', 'keyboard-focus'],
  }),
  modalScenario({
    id: 'focused-node-removal',
    state: { open: false, focusedNodeRemovable: true },
    operations: [
      { operation: 'open', target: 'modal-opener' },
      { operation: 'press', target: 'middle-focus-target' },
      { operation: 'updateContent', target: 'remove-focused-target' },
      { operation: 'updateContent', target: 'remove-nearest-safe-target' },
    ],
    expected: {
      roles: [{ role: 'dialog', name: 'Workspace members' }],
      relationships: [
        { source: 'modal-panel', name: 'contains-focus', target: 'safe-focus-targets' },
      ],
      states: [
        { target: 'background', name: 'focus-escaped', value: false },
        { target: 'modal-panel', name: 'tabindex', value: -1 },
      ],
      focus: { target: 'nearest-safe-target-then-modal-panel' },
      events: [
        { target: 'nearest-safe-target', type: 'focus-recovered' },
        { target: 'modal-panel', type: 'panel-fallback-focus-applied' },
      ],
      announcements: [{ message: 'Workspace members dialog remains active' }],
      cleanup: ['focus-recovery-listener-released', 'background-interactive'],
    },
    cells: ['chromium', 'firefox', 'webkit', 'keyboard-focus'],
  }),
  modalScenario({
    id: 'nested-topmost',
    state: { open: false, direction: 'ltr', nested: true },
    operations: [
      { operation: 'setDirection', target: 'ltr' },
      { operation: 'open', target: 'parent-modal' },
      { operation: 'open', target: 'child-modal' },
      { operation: 'press', target: 'escape-key' },
      { operation: 'setDirection', target: 'rtl' },
    ],
    expected: {
      roles: [
        { role: 'dialog', name: 'Parent workspace' },
        { role: 'dialog', name: 'Child workspace' },
      ],
      relationships: [
        { source: 'child-modal', name: 'topmost-over', target: 'parent-modal' },
        { source: 'child-modal', name: 'restores-focus-inside', target: 'parent-modal' },
      ],
      states: [
        { target: 'child-modal', name: 'owns-escape', value: true },
        { target: 'child-modal', name: 'owns-focus', value: true },
        { target: 'child-modal', name: 'owns-inert-branch', value: true },
        { target: 'child-modal', name: 'owns-scroll-claim', value: true },
        { target: 'parent-modal', name: 'logical-open', value: true },
      ],
      focus: { target: 'parent-modal-safe-target-after-child-close' },
      events: [
        { target: 'child-modal', type: 'escape-owned' },
        { target: 'child-modal', type: 'closed' },
        { target: 'parent-modal-safe-target', type: 'focus-restored' },
      ],
      announcements: [{ message: 'Child workspace dialog opened over parent workspace dialog' }],
      cleanup: ['child-scroll-claim-released', 'parent-scroll-claim-retained'],
    },
    cells: ['chromium', 'firefox', 'webkit', 'keyboard-focus', 'ltr', 'rtl'],
  }),
  modalScenario({
    id: 'pointer-origin-dismiss',
    state: { open: false, pointerMode: 'coarse' },
    operations: [
      { operation: 'open', target: 'modal-opener' },
      { operation: 'point', target: 'outside-down-up' },
      { operation: 'open', target: 'modal-opener' },
      { operation: 'point', target: 'outside-drag-inside' },
      { operation: 'point', target: 'outside-cancel' },
      { operation: 'point', target: 'outside-context-menu' },
      { operation: 'point', target: 'child-interaction' },
      { operation: 'point', target: 'outside-prevented-default' },
    ],
    expected: {
      roles: [{ role: 'dialog', name: 'Workspace options' }],
      relationships: [{ source: 'outside-surface', name: 'outside-of', target: 'modal-panel' }],
      states: [
        { target: 'complete-outside-down-up', name: 'dismisses', value: true },
        { target: 'outside-drag-inside', name: 'dismisses', value: false },
        { target: 'outside-cancel', name: 'dismisses', value: false },
        { target: 'outside-context-menu', name: 'dismisses', value: false },
        { target: 'child-interaction', name: 'dismisses', value: false },
        { target: 'outside-prevented-default', name: 'dismisses', value: false },
      ],
      focus: { target: 'modal-opener-after-complete-outside-gesture' },
      events: [
        { target: 'modal-panel', type: 'outside-origin-close-requested-once' },
        { target: 'modal-panel', type: 'incomplete-pointer-sequences-ignored' },
      ],
      announcements: [{ message: 'Workspace options dialog dismissed' }],
      cleanup: ['pointer-sequence-guard-released', 'background-interactive'],
    },
    cells: ['chromium', 'firefox', 'webkit', 'coarse-pointer'],
  }),
  modalScenario({
    id: 'controlled-close-commit',
    state: { open: false, controlled: true },
    operations: [
      { operation: 'open', target: 'controlled-modal' },
      { operation: 'press', target: 'dismiss-control' },
      { operation: 'updateContent', target: 'controlled-close-commit' },
    ],
    expected: {
      roles: [{ role: 'dialog', name: 'Controlled workspace' }],
      relationships: [{ source: 'dismiss-control', name: 'controls', target: 'controlled-modal' }],
      states: [
        { target: 'controlled-modal', name: 'close-request-count', value: 1 },
        { target: 'controlled-modal', name: 'logical-open-before-commit', value: true },
        { target: 'controlled-modal', name: 'logical-open-after-commit', value: false },
      ],
      focus: { target: 'controlled-modal-until-close-commit' },
      events: [
        { target: 'controlled-modal', type: 'close-requested-once' },
        { target: 'controlled-modal', type: 'controlled-close-committed' },
      ],
      announcements: [{ message: 'Controlled workspace dialog closed' }],
      cleanup: ['controlled-layer-resources-released', 'background-interactive'],
    },
    cells: ['chromium', 'firefox', 'webkit', 'react-18', 'react-19'],
  }),
  modalScenario({
    id: 'scroll-lock-reference-count',
    state: { open: false, pageScrollPosition: 'preserved' },
    operations: [
      { operation: 'open', target: 'first-modal' },
      { operation: 'open', target: 'second-modal' },
      { operation: 'close', target: 'second-modal' },
      { operation: 'close', target: 'first-modal' },
      { operation: 'point', target: 'page-scroll-surface' },
    ],
    expected: {
      roles: [
        { role: 'dialog', name: 'First workspace modal' },
        { role: 'dialog', name: 'Second workspace modal' },
      ],
      relationships: [
        { source: 'second-modal', name: 'shares-scroll-owner-with', target: 'first-modal' },
      ],
      states: [
        { target: 'page-scroll-lock', name: 'maximum-claim-count', value: 2 },
        { target: 'page-scroll-lock', name: 'final-claim-count', value: 0 },
        { target: 'page-layout', name: 'shift', value: 0 },
        { target: 'page-scroll-position', name: 'changed', value: false },
      ],
      focus: { target: 'first-modal-opener-after-final-release' },
      events: [
        { target: 'page-scroll-lock', type: 'claim-acquired-per-modal' },
        { target: 'page-scroll-lock', type: 'final-claim-released' },
        { target: 'page-scroll-surface', type: 'scroll-resumed' },
      ],
      announcements: [{ message: 'All workspace modals closed' }],
      cleanup: ['page-scroll-lock-released', 'page-scroll-resumed'],
    },
    cells: ['chromium', 'firefox', 'webkit', 'coarse-pointer'],
  }),
  modalScenario({
    id: 'exit-inactive-reopen',
    state: { open: false, motionPreference: 'reduced-motion' },
    operations: [
      { operation: 'setMotionPreference', target: 'reduced-motion' },
      { operation: 'open', target: 'modal-opener' },
      { operation: 'close', target: 'modal-panel' },
      { operation: 'open', target: 'modal-opener' },
    ],
    expected: {
      roles: [{ role: 'dialog', name: 'Reopened workspace' }],
      relationships: [{ source: 'reopened-modal', name: 'owns', target: 'single-resource-owner' }],
      states: [
        { target: 'committed-closed-modal', name: 'semantics-active', value: false },
        { target: 'committed-closed-modal', name: 'resource-claim-count', value: 0 },
        { target: 'reopened-modal', name: 'owner-count', value: 1 },
      ],
      focus: { target: 'reopened-modal-safe-target' },
      events: [
        { target: 'modal-panel', type: 'close-committed' },
        { target: 'reopened-modal', type: 'single-owner-created' },
      ],
      announcements: [{ message: 'Reopened workspace dialog opened' }],
      cleanup: ['committed-close-semantics-released', 'committed-close-resources-released'],
    },
    cells: ['chromium', 'firefox', 'webkit', 'reduced-motion'],
  }),
  modalScenario({
    id: 'opener-restoration-successor',
    state: { open: false, openerConnected: true },
    operations: [
      { operation: 'open', target: 'connected-opener' },
      { operation: 'close', target: 'modal-panel' },
      { operation: 'updateContent', target: 'disconnect-opener' },
      { operation: 'open', target: 'documented-successor' },
      { operation: 'close', target: 'modal-panel' },
    ],
    expected: {
      roles: [{ role: 'dialog', name: 'Workspace settings' }],
      relationships: [
        { source: 'modal-panel', name: 'opened-by', target: 'meaningful-opener' },
        { source: 'disconnected-opener', name: 'succeeds-to', target: 'documented-region' },
      ],
      states: [
        { target: 'connected-meaningful-opener', name: 'restoration-wins', value: true },
        { target: 'document-body', name: 'focus-received', value: false },
      ],
      focus: { target: 'connected-opener-then-documented-successor-or-region' },
      events: [
        { target: 'connected-meaningful-opener', type: 'focus-restored' },
        { target: 'documented-successor-or-region', type: 'focus-restored' },
      ],
      announcements: [{ message: 'Workspace settings dialog closed' }],
      cleanup: ['restoration-guard-released', 'modal-portal-removed'],
    },
    cells: ['chromium', 'firefox', 'webkit', 'keyboard-focus'],
  }),
  modalScenario({
    id: 'parent-close-with-child',
    state: { open: false, nested: true },
    operations: [
      { operation: 'open', target: 'parent-modal' },
      { operation: 'open', target: 'child-modal' },
      { operation: 'close', target: 'parent-modal' },
    ],
    expected: {
      roles: [
        { role: 'dialog', name: 'Parent workspace' },
        { role: 'dialog', name: 'Child workspace' },
      ],
      relationships: [{ source: 'child-modal', name: 'owned-by', target: 'parent-modal' }],
      states: [
        { target: 'parent-modal', name: 'logical-open', value: false },
        { target: 'child-modal', name: 'logical-open', value: false },
        { target: 'child-portal', name: 'orphaned', value: false },
      ],
      focus: { target: 'parent-modal-successor' },
      events: [
        { target: 'child-modal', type: 'closed-or-transferred-before-parent-close' },
        { target: 'parent-modal', type: 'closed-by-single-explicit-operation' },
      ],
      announcements: [{ message: 'Parent and child workspace dialogs closed' }],
      cleanup: ['child-ownership-released', 'parent-ownership-released', 'no-orphan-portal'],
    },
    cells: ['chromium', 'firefox', 'webkit', 'keyboard-focus'],
  }),
  modalScenario({
    id: 'unmount-cleanup',
    state: { open: false, motionPreference: 'reduced-motion' },
    operations: [
      { operation: 'destroy', target: 'entry-phase-modal' },
      { operation: 'open', target: 'open-phase-modal' },
      { operation: 'destroy', target: 'open-phase-modal' },
      { operation: 'open', target: 'exit-phase-modal' },
      { operation: 'close', target: 'exit-phase-modal' },
      { operation: 'destroy', target: 'exit-phase-modal' },
    ],
    expected: {
      roles: [{ role: 'dialog', name: 'Disposable workspace' }],
      relationships: [{ source: 'modal-owner', name: 'owns', target: 'modal-portal' }],
      states: [
        { target: 'modal-listeners', name: 'remaining-count', value: 0 },
        { target: 'background-inert-claim', name: 'remaining-count', value: 0 },
        { target: 'page-scroll-claim', name: 'remaining-count', value: 0 },
        { target: 'modal-timers', name: 'remaining-count', value: 0 },
        { target: 'modal-guards', name: 'remaining-count', value: 0 },
        { target: 'modal-portals', name: 'remaining-count', value: 0 },
      ],
      focus: { target: 'meaningful-opener-or-documented-successor' },
      events: [
        { target: 'entry-phase-modal', type: 'destroyed-once' },
        { target: 'open-phase-modal', type: 'destroyed-once' },
        { target: 'exit-phase-modal', type: 'destroyed-once' },
      ],
      announcements: [{ message: 'Disposable workspace dialog removed' }],
      cleanup: [
        'listeners-released-once',
        'inert-released-once',
        'scroll-released-once',
        'timers-released-once',
        'guards-released-once',
        'portal-released-once',
      ],
    },
    cells: ['chromium', 'firefox', 'webkit', 'reduced-motion'],
  }),
  modalScenario({
    id: 'ssr-open-semantics',
    state: { open: true, environment: 'server' },
    operations: [{ operation: 'open', target: 'server-rendered-modal' }],
    expected: {
      roles: [{ role: 'dialog', name: 'Server workspace' }],
      relationships: [
        { source: 'server-rendered-modal', name: 'labelled-by', target: 'server-modal-title' },
      ],
      states: [
        { target: 'server-rendered-modal', name: 'semantically-available', value: true },
        { target: 'browser-globals', name: 'accessed', value: false },
      ],
      focus: { target: 'server-document-focus-unchanged' },
      events: [{ target: 'server-rendered-modal', type: 'rendered-open' }],
      announcements: [{ message: 'Server workspace dialog is available' }],
      cleanup: ['no-browser-resource-claims'],
    },
    cells: ['ssr'],
  }),
  modalScenario({
    id: 'hydration-stability',
    state: { open: true, inputValue: 'Workspace draft', hydrated: false },
    operations: [
      { operation: 'open', target: 'server-rendered-modal' },
      { operation: 'updateContent', target: 'hydrate-first-tree' },
      { operation: 'press', target: 'hydrated-input' },
    ],
    expected: {
      roles: [{ role: 'dialog', name: 'Hydrated workspace' }],
      relationships: [
        { source: 'hydrated-modal', name: 'same-identity-as', target: 'server-rendered-modal' },
      ],
      states: [
        { target: 'first-tree', name: 'identical', value: true },
        { target: 'generated-identifiers', name: 'stable', value: true },
        { target: 'controlled-state', name: 'stable', value: true },
        { target: 'hydration-warning', name: 'emitted', value: false },
        { target: 'hydration-recovery', name: 'performed', value: false },
        { target: 'hydrated-input', name: 'value-lost', value: false },
        { target: 'hydrated-event', name: 'duplicate-count', value: 0 },
        { target: 'focus', name: 'moved-during-hydration', value: false },
      ],
      focus: { target: 'pre-hydration-focus-target' },
      events: [{ target: 'hydrated-input', type: 'activated-once' }],
      announcements: [{ message: 'Hydrated workspace dialog remains available' }],
      cleanup: ['single-event-owner-retained', 'single-modal-owner-retained'],
    },
    cells: ['react-18', 'react-19', 'hydration'],
  }),
]);

const MODAL_SCENARIO_BY_ID = new Map(
  MODAL_SCENARIOS.map((scenario) => [scenario.scenarioId, scenario]),
);
const MODAL_SCENARIO_IDS = Object.freeze(MODAL_SCENARIOS.map(({ scenarioId }) => scenarioId));

function sameStringSet(actual, expected) {
  return (
    actual.length === expected.length &&
    actual.every((entry) => typeof entry === 'string' && expected.includes(entry))
  );
}

function validateExactScenarioRecord(scenario, expected, path, errors) {
  for (const key of [
    'schemaVersion',
    'revision',
    'contractId',
    'scenarioId',
    'components',
    'initial',
    'operations',
    'requiredCells',
    'capture',
  ]) {
    if (!isDeepStrictEqual(scenario[key], expected[key])) {
      errors.push(`${path}.${key} must match the immutable modal v1 record`);
    }
  }
  for (const key of [
    'roles',
    'relationships',
    'states',
    'focus',
    'events',
    'announcements',
    'cleanup',
  ]) {
    if (!isDeepStrictEqual(scenario.expected?.[key], expected.expected[key])) {
      errors.push(`${path}.expected.${key} must match the immutable modal v1 record`);
    }
  }
}

export function modalScenariosForCell(cellId) {
  return Object.freeze(
    MODAL_SCENARIOS.filter(({ requiredCells }) => requiredCells.includes(cellId)),
  );
}

export function validateModalCoverage(scenarios) {
  if (!Array.isArray(scenarios)) return ['modal scenarios must be an array'];

  const errors = [];
  const seenScenarioIds = new Set();
  const coveredCells = new Set();

  scenarios.forEach((scenario, index) => {
    const path = `modal scenarios[${index}]`;
    for (const error of validateScenario(scenario)) errors.push(`${path}: ${error}`);

    if (scenario?.contractId !== 'OF-MODAL') {
      errors.push(`${path}.contractId must equal OF-MODAL`);
    }

    const scenarioId = scenario?.scenarioId;
    if (seenScenarioIds.has(scenarioId)) errors.push(`${path}.scenarioId is duplicate`);
    seenScenarioIds.add(scenarioId);

    const expected = MODAL_SCENARIO_BY_ID.get(scenarioId);
    if (expected !== undefined) validateExactScenarioRecord(scenario, expected, path, errors);

    if (Array.isArray(scenario?.requiredCells)) {
      for (const cell of scenario.requiredCells) {
        coveredCells.add(cell);
        if (!MODAL_WAVE_CELLS.includes(cell)) {
          errors.push(`${path}.requiredCells contains an out-of-wave cell`);
        }
      }
    }
  });

  const actualScenarioIds = scenarios.map((scenario) => scenario?.scenarioId);
  if (!sameStringSet(actualScenarioIds, MODAL_SCENARIO_IDS)) {
    errors.push('modal scenario ID set must match the immutable modal v1 inventory');
  }

  const actualCells = [...coveredCells];
  if (!sameStringSet(actualCells, MODAL_WAVE_CELLS)) {
    errors.push('modal cell set must equal the fifteen behavioral wave cells');
  }
  for (const cell of MODAL_WAVE_CELLS) {
    if (!scenarios.some((scenario) => scenario?.requiredCells?.includes(cell))) {
      errors.push(`modal cell ${cell} must have at least one scenario`);
    }
  }

  return errors;
}
