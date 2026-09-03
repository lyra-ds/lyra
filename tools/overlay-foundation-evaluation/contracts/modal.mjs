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

const PROBE_CATEGORIES = Object.freeze([
  'roles',
  'relationships',
  'states',
  'focus',
  'events',
  'announcements',
  'cleanup',
]);

function afterOperation(operationIndex, target, property, extra = {}) {
  return { phase: 'after-operation', operationIndex, target, property, ...extra };
}

function afterCleanup(target, property, extra = {}) {
  return { phase: 'after-cleanup', target, property, ...extra };
}

function serverRender(target, property, extra = {}) {
  return { phase: 'server-render', target, property, ...extra };
}

function modalProbes(groups) {
  return PROBE_CATEGORIES.flatMap((category) =>
    groups[category].map((probe, index) => ({
      id: `${category}-${index + 1}`,
      category,
      ...probe,
    })),
  );
}

function modalScenario({
  id,
  operations,
  probes,
  expected,
  cells,
  state = {},
  captureResources = true,
}) {
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
    probes: modalProbes(probes),
    expected,
    requiredCells: cells,
    capture: [
      'dom',
      'accessibility-tree',
      'events',
      'focus',
      ...(captureResources ? ['resources'] : []),
    ],
  });
}

export const MODAL_SCENARIOS = Object.freeze([
  modalScenario({
    id: 'semantics-isolation',
    state: { open: false, colorMode: 'light', forcedColors: false },
    operations: [{ operation: 'open', target: 'modal-opener' }],
    probes: {
      roles: [afterOperation(0, 'modal-panel', 'accessible-role')],
      relationships: [
        afterOperation(0, 'modal-panel', 'labelled-by'),
        afterOperation(0, 'modal-panel', 'described-by'),
      ],
      states: [
        afterOperation(0, 'modal-panel', 'aria-modal'),
        afterOperation(0, 'background', 'inert'),
        afterOperation(0, 'background', 'accessibility-branch'),
      ],
      focus: [afterOperation(0, 'document-focus', 'current')],
      events: [afterOperation(0, 'modal-panel', 'opened')],
      announcements: [afterOperation(0, 'modal-live-region', 'text')],
      cleanup: [
        afterCleanup('background', 'interactive'),
        afterCleanup('background-accessibility-branch', 'restored'),
      ],
    },
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
    probes: {
      roles: [afterOperation(4, 'modal-panel', 'accessible-role')],
      relationships: [afterOperation(4, 'modal-panel', 'labelled-by')],
      states: [
        afterOperation(1, 'safe-declared-target', 'initial-focus-received'),
        afterOperation(4, 'invalid-declared-target', 'initial-focus-received'),
        afterOperation(4, 'safe-fallback-target', 'fallback-received'),
      ],
      focus: [
        afterOperation(4, 'document-focus', 'ordered-history', {
          operationIndexes: [1, 4],
        }),
      ],
      events: [
        afterOperation(1, 'safe-declared-target', 'initial-focus-applied'),
        afterOperation(4, 'invalid-declared-target', 'initial-focus-skipped'),
        afterOperation(4, 'safe-fallback-target', 'initial-focus-applied'),
      ],
      announcements: [afterOperation(4, 'modal-live-region', 'text')],
      cleanup: [
        afterCleanup('initial-focus-guard', 'released'),
        afterCleanup('background', 'interactive'),
      ],
    },
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
      { operation: 'updateContent', target: 'enabled-invalid-field-case' },
      { operation: 'open', target: 'modal-opener' },
      { operation: 'close', target: 'modal-panel' },
      { operation: 'updateContent', target: 'focusable-summary-fallback-case' },
      { operation: 'open', target: 'modal-opener' },
    ],
    probes: {
      roles: [afterOperation(4, 'modal-panel', 'accessible-role')],
      relationships: [afterOperation(1, 'first-invalid-enabled-field', 'described-by')],
      states: [
        afterOperation(1, 'first-invalid-enabled-field', 'invalid'),
        afterOperation(1, 'first-invalid-enabled-field', 'initial-focus-received'),
        afterOperation(1, 'disabled-invalid-field', 'initial-focus-received'),
        afterOperation(4, 'focusable-validation-summary', 'initial-focus-received'),
      ],
      focus: [afterOperation(4, 'document-focus', 'current')],
      events: [
        afterOperation(1, 'first-invalid-enabled-field', 'validation-initial-focus-applied'),
        afterOperation(4, 'focusable-validation-summary', 'validation-initial-focus-applied'),
      ],
      announcements: [afterOperation(4, 'modal-live-region', 'validation-text')],
      cleanup: [
        afterCleanup('validation-focus-guard', 'released'),
        afterCleanup('background', 'interactive'),
      ],
    },
    expected: {
      roles: [{ role: 'dialog', name: 'Correct workspace details' }],
      relationships: [
        { source: 'first-invalid-enabled-field', name: 'described-by', target: 'field-error' },
      ],
      states: [
        { target: 'first-invalid-enabled-field', name: 'invalid', value: true },
        { target: 'first-invalid-enabled-field', name: 'initial-focus-received', value: true },
        { target: 'disabled-invalid-field', name: 'initial-focus-received', value: false },
        { target: 'focusable-validation-summary', name: 'initial-focus-received', value: true },
      ],
      focus: { target: 'focusable-validation-summary' },
      events: [
        { target: 'first-invalid-enabled-field', type: 'validation-initial-focus-applied' },
        { target: 'focusable-validation-summary', type: 'validation-initial-focus-applied' },
      ],
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
    probes: {
      roles: [afterOperation(1, 'modal-panel', 'accessible-role')],
      relationships: [afterOperation(1, 'modal-panel', 'described-by')],
      states: [
        afterOperation(1, 'least-destructive-action', 'initial-focus-received'),
        afterOperation(1, 'destructive-action', 'initial-focus-received'),
        afterOperation(1, 'declared-action', 'initial-focus-received'),
      ],
      focus: [afterOperation(1, 'document-focus', 'current')],
      events: [afterOperation(1, 'least-destructive-action', 'initial-focus-applied')],
      announcements: [afterOperation(1, 'modal-live-region', 'confirmation-text')],
      cleanup: [
        afterCleanup('destructive-focus-guard', 'released'),
        afterCleanup('background', 'interactive'),
      ],
    },
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
    probes: {
      roles: [afterOperation(1, 'modal-panel', 'accessible-role')],
      relationships: [afterOperation(1, 'modal-panel', 'labelled-by')],
      states: [
        afterOperation(1, 'modal-panel', 'tabindex'),
        afterOperation(1, 'modal-panel', 'named'),
      ],
      focus: [afterOperation(1, 'document-focus', 'current')],
      events: [afterOperation(1, 'modal-panel', 'panel-fallback-focus-applied')],
      announcements: [afterOperation(1, 'modal-live-region', 'text')],
      cleanup: [
        afterCleanup('panel-fallback-focus', 'released'),
        afterCleanup('background', 'interactive'),
      ],
    },
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
    probes: {
      roles: [afterOperation(4, 'modal-panel', 'accessible-role')],
      relationships: [
        afterOperation(4, 'modal-panel', 'contains-focus', {
          relatedTarget: 'eligible-tab-targets',
        }),
      ],
      states: [
        afterOperation(3, 'hidden-tab-target', 'tab-eligible'),
        afterOperation(3, 'disabled-tab-target', 'tab-eligible'),
        afterOperation(3, 'removed-tab-target', 'tab-eligible'),
      ],
      focus: [afterOperation(4, 'document-focus', 'current')],
      events: [
        afterOperation(1, 'first-eligible-target', 'forward-tab-wrapped'),
        afterOperation(2, 'last-eligible-target', 'reverse-tab-wrapped'),
        afterOperation(3, 'eligible-tab-targets', 'dynamic-targets-recomputed'),
      ],
      announcements: [afterOperation(0, 'modal-live-region', 'text')],
      cleanup: [
        afterCleanup('focus-loop-listener', 'released'),
        afterCleanup('background', 'interactive'),
      ],
    },
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
    probes: {
      roles: [afterOperation(3, 'modal-panel', 'accessible-role')],
      relationships: [
        afterOperation(3, 'modal-panel', 'contains-focus', {
          relatedTarget: 'safe-focus-targets',
        }),
      ],
      states: [
        afterOperation(3, 'background', 'focus-escaped'),
        afterOperation(3, 'modal-panel', 'tabindex'),
      ],
      focus: [
        afterOperation(3, 'document-focus', 'ordered-history', {
          operationIndexes: [2, 3],
        }),
      ],
      events: [
        afterOperation(2, 'nearest-safe-target', 'focus-recovered'),
        afterOperation(3, 'modal-panel', 'panel-fallback-focus-applied'),
      ],
      announcements: [afterOperation(3, 'modal-live-region', 'active-text')],
      cleanup: [
        afterCleanup('focus-recovery-listener', 'released'),
        afterCleanup('background', 'interactive'),
      ],
    },
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
      { operation: 'close', target: 'parent-modal' },
      { operation: 'setDirection', target: 'rtl' },
      { operation: 'open', target: 'parent-modal' },
      { operation: 'open', target: 'child-modal' },
      { operation: 'press', target: 'escape-key' },
    ],
    probes: {
      roles: [
        afterOperation(7, 'parent-modal', 'accessible-role'),
        afterOperation(7, 'child-modal', 'accessible-role'),
      ],
      relationships: [
        afterOperation(7, 'child-modal', 'topmost-over', { relatedTarget: 'parent-modal' }),
        afterOperation(8, 'child-modal', 'restores-focus-inside', {
          relatedTarget: 'parent-modal',
        }),
      ],
      states: [
        afterOperation(7, 'child-modal', 'owns-escape'),
        afterOperation(7, 'child-modal', 'owns-focus'),
        afterOperation(7, 'child-modal', 'owns-inert-branch'),
        afterOperation(7, 'child-modal', 'owns-scroll-claim'),
        afterOperation(8, 'parent-modal', 'logical-open'),
      ],
      focus: [afterOperation(8, 'document-focus', 'directional-parent-target')],
      events: [
        afterOperation(3, 'child-modal', 'directional-escape-owned'),
        afterOperation(3, 'child-modal', 'directional-closed'),
        afterOperation(3, 'parent-modal-safe-target', 'directional-focus-restored'),
        afterOperation(8, 'child-modal', 'directional-escape-owned'),
        afterOperation(8, 'child-modal', 'directional-closed'),
        afterOperation(8, 'parent-modal-safe-target', 'directional-focus-restored'),
      ],
      announcements: [afterOperation(7, 'modal-live-region', 'nested-text')],
      cleanup: [
        afterOperation(8, 'child-scroll-claim', 'released'),
        afterOperation(8, 'parent-scroll-claim', 'retained'),
      ],
    },
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
      focus: { target: 'rtl-parent-modal-safe-target' },
      events: [
        { target: 'ltr-child-modal', type: 'escape-owned' },
        { target: 'ltr-child-modal', type: 'closed' },
        { target: 'ltr-parent-modal-safe-target', type: 'focus-restored' },
        { target: 'rtl-child-modal', type: 'escape-owned' },
        { target: 'rtl-child-modal', type: 'closed' },
        { target: 'rtl-parent-modal-safe-target', type: 'focus-restored' },
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
    probes: {
      roles: [afterOperation(7, 'modal-panel', 'accessible-role')],
      relationships: [
        afterOperation(7, 'outside-surface', 'outside-of', { relatedTarget: 'modal-panel' }),
      ],
      states: [
        afterOperation(1, 'complete-outside-down-up', 'dismisses'),
        afterOperation(3, 'outside-drag-inside', 'dismisses'),
        afterOperation(4, 'outside-cancel', 'dismisses'),
        afterOperation(5, 'outside-context-menu', 'dismisses'),
        afterOperation(6, 'child-interaction', 'dismisses'),
        afterOperation(7, 'outside-prevented-default', 'dismisses'),
      ],
      focus: [afterOperation(1, 'document-focus', 'opener-after-outside-gesture')],
      events: [
        afterOperation(1, 'modal-panel', 'outside-origin-close-requested-once'),
        afterOperation(7, 'modal-panel', 'incomplete-pointer-sequences-ignored', {
          operationIndexes: [3, 4, 5, 6, 7],
        }),
      ],
      announcements: [afterOperation(1, 'modal-live-region', 'text')],
      cleanup: [
        afterCleanup('pointer-sequence-guard', 'released'),
        afterCleanup('background', 'interactive'),
      ],
    },
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
    probes: {
      roles: [afterOperation(1, 'controlled-modal', 'accessible-role')],
      relationships: [afterOperation(1, 'dismiss-control', 'controls')],
      states: [
        afterOperation(1, 'controlled-modal', 'close-request-count'),
        afterOperation(1, 'controlled-modal', 'logical-open-before-commit'),
        afterOperation(2, 'controlled-modal', 'logical-open-after-commit'),
      ],
      focus: [
        afterOperation(2, 'document-focus', 'open-until-commit', {
          operationIndexes: [0, 1, 2],
        }),
      ],
      events: [
        afterOperation(1, 'controlled-modal', 'close-requested-once'),
        afterOperation(2, 'controlled-modal', 'controlled-close-committed'),
      ],
      announcements: [afterOperation(2, 'modal-live-region', 'text')],
      cleanup: [
        afterCleanup('controlled-layer-resources', 'released'),
        afterCleanup('background', 'interactive'),
      ],
    },
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
    probes: {
      roles: [
        afterOperation(1, 'first-modal', 'accessible-role'),
        afterOperation(1, 'second-modal', 'accessible-role'),
      ],
      relationships: [
        afterOperation(1, 'second-modal', 'shares-scroll-owner-with', {
          relatedTarget: 'first-modal',
        }),
      ],
      states: [
        afterOperation(3, 'page-scroll-lock', 'maximum-claim-count', {
          operationIndexes: [0, 1, 2, 3],
        }),
        afterOperation(3, 'page-scroll-lock', 'final-claim-count'),
        afterOperation(3, 'page-layout', 'shift'),
        afterOperation(4, 'page-scroll-position', 'changed'),
      ],
      focus: [afterOperation(3, 'document-focus', 'first-opener-after-release')],
      events: [
        afterOperation(1, 'page-scroll-lock', 'claim-acquired-per-modal'),
        afterOperation(3, 'page-scroll-lock', 'final-claim-released'),
        afterOperation(4, 'page-scroll-surface', 'scroll-resumed'),
      ],
      announcements: [afterOperation(3, 'modal-live-region', 'all-closed-text')],
      cleanup: [
        afterOperation(4, 'page-scroll-lock', 'released'),
        afterOperation(4, 'page-scroll', 'resumed'),
      ],
    },
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
    probes: {
      roles: [afterOperation(3, 'reopened-modal', 'accessible-role')],
      relationships: [
        afterOperation(3, 'reopened-modal', 'owns', {
          relatedTarget: 'single-resource-owner',
        }),
      ],
      states: [
        afterOperation(2, 'committed-closed-modal', 'semantics-active'),
        afterOperation(2, 'committed-closed-modal', 'resource-claim-count'),
        afterOperation(3, 'reopened-modal', 'owner-count'),
      ],
      focus: [afterOperation(3, 'document-focus', 'reopened-safe-target')],
      events: [
        afterOperation(2, 'modal-panel', 'close-committed'),
        afterOperation(3, 'reopened-modal', 'single-owner-created'),
      ],
      announcements: [afterOperation(3, 'modal-live-region', 'text')],
      cleanup: [
        afterCleanup('committed-close-semantics', 'released'),
        afterCleanup('committed-close-resources', 'released'),
      ],
    },
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
      { operation: 'open', target: 'connected-opener' },
      { operation: 'updateContent', target: 'disconnect-opener' },
      { operation: 'close', target: 'modal-panel' },
    ],
    probes: {
      roles: [afterOperation(2, 'modal-panel', 'accessible-role')],
      relationships: [
        afterOperation(2, 'modal-panel', 'opened-by', {
          relatedTarget: 'meaningful-opener',
        }),
        afterOperation(4, 'disconnected-opener', 'succeeds-to', {
          relatedTarget: 'documented-successor',
        }),
      ],
      states: [
        afterOperation(1, 'connected-meaningful-opener', 'restoration-wins'),
        afterOperation(3, 'disconnected-opener', 'connected'),
        afterOperation(4, 'documented-successor', 'restoration-wins'),
        afterOperation(4, 'document-body', 'focus-received'),
      ],
      focus: [afterOperation(4, 'document-focus', 'current')],
      events: [
        afterOperation(1, 'connected-meaningful-opener', 'focus-restored'),
        afterOperation(4, 'documented-successor', 'focus-restored'),
      ],
      announcements: [afterOperation(4, 'modal-live-region', 'text')],
      cleanup: [
        afterCleanup('restoration-guard', 'released'),
        afterCleanup('modal-portal', 'removed'),
      ],
    },
    expected: {
      roles: [{ role: 'dialog', name: 'Workspace settings' }],
      relationships: [
        { source: 'modal-panel', name: 'opened-by', target: 'meaningful-opener' },
        { source: 'disconnected-opener', name: 'succeeds-to', target: 'documented-successor' },
      ],
      states: [
        { target: 'connected-meaningful-opener', name: 'restoration-wins', value: true },
        { target: 'disconnected-opener', name: 'connected', value: false },
        { target: 'documented-successor', name: 'restoration-wins', value: true },
        { target: 'document-body', name: 'focus-received', value: false },
      ],
      focus: { target: 'documented-successor' },
      events: [
        { target: 'connected-meaningful-opener', type: 'focus-restored' },
        { target: 'documented-successor', type: 'focus-restored' },
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
    probes: {
      roles: [
        afterOperation(1, 'parent-modal', 'accessible-role'),
        afterOperation(1, 'child-modal', 'accessible-role'),
      ],
      relationships: [
        afterOperation(1, 'child-modal', 'owned-by', { relatedTarget: 'parent-modal' }),
      ],
      states: [
        afterOperation(2, 'parent-modal', 'logical-open'),
        afterOperation(2, 'child-modal', 'logical-open'),
        afterOperation(2, 'child-portal', 'orphaned'),
      ],
      focus: [afterOperation(2, 'document-focus', 'parent-successor')],
      events: [
        afterOperation(2, 'child-modal', 'closed-or-transferred-before-parent-close'),
        afterOperation(2, 'parent-modal', 'closed-by-single-explicit-operation'),
      ],
      announcements: [afterOperation(2, 'modal-live-region', 'parent-and-child-closed-text')],
      cleanup: [
        afterCleanup('child-ownership', 'released'),
        afterCleanup('parent-ownership', 'released'),
        afterCleanup('portal', 'no-orphan'),
      ],
    },
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
    captureResources: true,
    state: { open: false, motionPreference: 'reduced-motion' },
    operations: [
      { operation: 'destroy', target: 'entry-phase-modal' },
      { operation: 'open', target: 'open-phase-modal' },
      { operation: 'destroy', target: 'open-phase-modal' },
      { operation: 'open', target: 'exit-phase-modal' },
      { operation: 'close', target: 'exit-phase-modal' },
      { operation: 'destroy', target: 'exit-phase-modal' },
    ],
    probes: {
      roles: [afterOperation(3, 'modal-panel', 'accessible-role')],
      relationships: [afterOperation(3, 'modal-owner', 'owns', { relatedTarget: 'modal-portal' })],
      states: [
        afterCleanup('modal-listeners', 'remaining-count'),
        afterCleanup('background-inert-claim', 'remaining-count'),
        afterCleanup('page-scroll-claim', 'remaining-count'),
        afterCleanup('modal-timers', 'remaining-count'),
        afterCleanup('modal-guards', 'remaining-count'),
        afterCleanup('modal-portals', 'remaining-count'),
      ],
      focus: [afterCleanup('document-focus', 'meaningful-opener-or-successor')],
      events: [
        afterOperation(0, 'entry-phase-modal', 'destroyed-once'),
        afterOperation(2, 'open-phase-modal', 'destroyed-once'),
        afterOperation(5, 'exit-phase-modal', 'destroyed-once'),
      ],
      announcements: [afterOperation(5, 'modal-live-region', 'text')],
      cleanup: [
        afterCleanup('listeners', 'released-once'),
        afterCleanup('inert', 'released-once'),
        afterCleanup('scroll', 'released-once'),
        afterCleanup('timers', 'released-once'),
        afterCleanup('guards', 'released-once'),
        afterCleanup('portal', 'released-once'),
      ],
    },
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
    captureResources: false,
    state: { open: true, environment: 'server' },
    operations: [{ operation: 'open', target: 'server-rendered-modal' }],
    probes: {
      roles: [serverRender('server-rendered-modal', 'accessible-role')],
      relationships: [serverRender('server-rendered-modal', 'labelled-by')],
      states: [
        serverRender('server-rendered-modal', 'semantically-available'),
        serverRender('browser-globals', 'accessed'),
      ],
      focus: [serverRender('document-focus', 'server-unchanged')],
      events: [serverRender('server-rendered-modal', 'rendered-open')],
      announcements: [serverRender('server-rendered-modal', 'availability-text')],
      cleanup: [serverRender('browser-resource-claims', 'none')],
    },
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
    probes: {
      roles: [afterOperation(2, 'hydrated-modal', 'accessible-role')],
      relationships: [
        afterOperation(0, 'hydrated-modal', 'same-identity-as', {
          relatedTarget: 'server-rendered-modal',
        }),
      ],
      states: [
        afterOperation(0, 'first-tree', 'identical'),
        afterOperation(0, 'generated-identifiers', 'stable'),
        afterOperation(0, 'controlled-state', 'stable'),
        afterOperation(0, 'hydration-warning', 'emitted'),
        afterOperation(0, 'hydration-recovery', 'performed'),
        afterOperation(0, 'hydrated-input', 'value-lost'),
        afterOperation(2, 'hydrated-event', 'duplicate-count'),
        afterOperation(0, 'focus', 'moved-during-hydration'),
      ],
      focus: [afterOperation(0, 'document-focus', 'pre-hydration')],
      events: [afterOperation(2, 'hydrated-input', 'activated-once')],
      announcements: [afterOperation(2, 'modal-live-region', 'hydration-text')],
      cleanup: [
        afterOperation(2, 'single-event-owner', 'retained'),
        afterOperation(2, 'single-modal-owner', 'retained'),
      ],
    },
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
    'probes',
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
