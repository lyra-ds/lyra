function scenarioProgram(operationTargets, observation) {
  return Object.freeze({
    operationTargets: Object.freeze(operationTargets),
    observation: Object.freeze(observation),
  });
}

function observation({ roles, relationships, states, focus, events, announcement, cleanup }) {
  return {
    roles,
    relationships,
    states,
    focus: { target: focus },
    events,
    announcements: [{ message: announcement }],
    cleanup,
  };
}

const PROGRAMS = Object.freeze({
  'of-modal.semantics-isolation.v1': scenarioProgram(
    [['open', 'modal-opener']],
    observation({
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
      focus: 'modal-safe-target',
      events: [{ target: 'modal-panel', type: 'opened' }],
      announcement: 'Workspace details dialog opened',
      cleanup: ['background-interactive', 'background-accessibility-branch-restored'],
    }),
  ),
  'of-modal.declared-initial-focus.v1': scenarioProgram(
    [
      ['updateContent', 'declare-safe-initial-focus'],
      ['open', 'modal-opener'],
      ['close', 'modal-panel'],
      ['updateContent', 'declare-invalid-initial-focus'],
      ['open', 'modal-opener'],
    ],
    observation({
      roles: [{ role: 'dialog', name: 'Create workspace' }],
      relationships: [{ source: 'modal-panel', name: 'labelled-by', target: 'modal-title' }],
      states: [
        { target: 'safe-declared-target', name: 'initial-focus-received', value: true },
        { target: 'invalid-declared-target', name: 'initial-focus-received', value: false },
        { target: 'safe-fallback-target', name: 'fallback-received', value: true },
      ],
      focus: 'safe-declared-target-then-safe-fallback-target',
      events: [
        { target: 'safe-declared-target', type: 'initial-focus-applied' },
        { target: 'invalid-declared-target', type: 'initial-focus-skipped' },
        { target: 'safe-fallback-target', type: 'initial-focus-applied' },
      ],
      announcement: 'Create workspace dialog opened',
      cleanup: ['initial-focus-guard-released', 'background-interactive'],
    }),
  ),
  'of-modal.validation-initial-focus.v1': scenarioProgram(
    [
      ['updateContent', 'enabled-invalid-field-case'],
      ['open', 'modal-opener'],
      ['close', 'modal-panel'],
      ['updateContent', 'focusable-summary-fallback-case'],
      ['open', 'modal-opener'],
    ],
    observation({
      roles: [{ role: 'dialog', name: 'Correct workspace details' }],
      relationships: [
        { source: 'first-invalid-enabled-field', name: 'described-by', target: 'field-error' },
      ],
      states: [
        { target: 'first-invalid-enabled-field', name: 'invalid', value: true },
        {
          target: 'first-invalid-enabled-field',
          name: 'initial-focus-received',
          value: true,
        },
        { target: 'disabled-invalid-field', name: 'initial-focus-received', value: false },
        {
          target: 'focusable-validation-summary',
          name: 'initial-focus-received',
          value: true,
        },
      ],
      focus: 'focusable-validation-summary',
      events: [
        {
          target: 'first-invalid-enabled-field',
          type: 'validation-initial-focus-applied',
        },
        {
          target: 'focusable-validation-summary',
          type: 'validation-initial-focus-applied',
        },
      ],
      announcement: 'Workspace details contain validation errors',
      cleanup: ['validation-focus-guard-released', 'background-interactive'],
    }),
  ),
  'of-modal.destructive-initial-focus.v1': scenarioProgram(
    [
      ['updateContent', 'destructive-confirmation'],
      ['open', 'modal-opener'],
    ],
    observation({
      roles: [{ role: 'alertdialog', name: 'Delete workspace' }],
      relationships: [
        { source: 'modal-panel', name: 'described-by', target: 'destructive-warning' },
      ],
      states: [
        { target: 'least-destructive-action', name: 'initial-focus-received', value: true },
        { target: 'destructive-action', name: 'initial-focus-received', value: false },
        { target: 'declared-action', name: 'initial-focus-received', value: false },
      ],
      focus: 'least-destructive-action',
      events: [{ target: 'least-destructive-action', type: 'initial-focus-applied' }],
      announcement: 'Delete workspace confirmation opened',
      cleanup: ['destructive-focus-guard-released', 'background-interactive'],
    }),
  ),
  'of-modal.no-tabbables-panel-fallback.v1': scenarioProgram(
    [
      ['updateContent', 'no-tabbable-content'],
      ['open', 'modal-opener'],
    ],
    observation({
      roles: [{ role: 'dialog', name: 'Processing workspace' }],
      relationships: [{ source: 'modal-panel', name: 'labelled-by', target: 'modal-title' }],
      states: [
        { target: 'modal-panel', name: 'tabindex', value: -1 },
        { target: 'modal-panel', name: 'named', value: true },
      ],
      focus: 'modal-panel',
      events: [{ target: 'modal-panel', type: 'panel-fallback-focus-applied' }],
      announcement: 'Processing workspace dialog opened',
      cleanup: ['panel-fallback-focus-released', 'background-interactive'],
    }),
  ),
  'of-modal.focus-wrap-dynamic.v1': scenarioProgram(
    [
      ['open', 'modal-opener'],
      ['press', 'tab-from-last-target'],
      ['press', 'shift-tab-from-first-target'],
      ['updateContent', 'hide-disable-remove-tab-targets'],
      ['press', 'tab-from-first-target'],
    ],
    observation({
      roles: [{ role: 'dialog', name: 'Workspace commands' }],
      relationships: [
        { source: 'modal-panel', name: 'contains-focus', target: 'eligible-tab-targets' },
      ],
      states: [
        { target: 'hidden-tab-target', name: 'tab-eligible', value: false },
        { target: 'disabled-tab-target', name: 'tab-eligible', value: false },
        { target: 'removed-tab-target', name: 'tab-eligible', value: false },
      ],
      focus: 'first-eligible-target-after-wrap',
      events: [
        { target: 'first-eligible-target', type: 'forward-tab-wrapped' },
        { target: 'last-eligible-target', type: 'reverse-tab-wrapped' },
        { target: 'eligible-tab-targets', type: 'dynamic-targets-recomputed' },
      ],
      announcement: 'Workspace commands dialog opened',
      cleanup: ['focus-loop-listener-released', 'background-interactive'],
    }),
  ),
  'of-modal.focused-node-removal.v1': scenarioProgram(
    [
      ['open', 'modal-opener'],
      ['press', 'middle-focus-target'],
      ['updateContent', 'remove-focused-target'],
      ['updateContent', 'remove-nearest-safe-target'],
    ],
    observation({
      roles: [{ role: 'dialog', name: 'Workspace members' }],
      relationships: [
        { source: 'modal-panel', name: 'contains-focus', target: 'safe-focus-targets' },
      ],
      states: [
        { target: 'background', name: 'focus-escaped', value: false },
        { target: 'modal-panel', name: 'tabindex', value: -1 },
      ],
      focus: 'nearest-safe-target-then-modal-panel',
      events: [
        { target: 'nearest-safe-target', type: 'focus-recovered' },
        { target: 'modal-panel', type: 'panel-fallback-focus-applied' },
      ],
      announcement: 'Workspace members dialog remains active',
      cleanup: ['focus-recovery-listener-released', 'background-interactive'],
    }),
  ),
  'of-modal.nested-topmost.v1': scenarioProgram(
    [
      ['setDirection', 'ltr'],
      ['open', 'parent-modal'],
      ['open', 'child-modal'],
      ['press', 'escape-key'],
      ['close', 'parent-modal'],
      ['setDirection', 'rtl'],
      ['open', 'parent-modal'],
      ['open', 'child-modal'],
      ['press', 'escape-key'],
    ],
    observation({
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
      focus: 'rtl-parent-modal-safe-target',
      events: [
        { target: 'ltr-child-modal', type: 'escape-owned' },
        { target: 'ltr-child-modal', type: 'closed' },
        { target: 'ltr-parent-modal-safe-target', type: 'focus-restored' },
        { target: 'rtl-child-modal', type: 'escape-owned' },
        { target: 'rtl-child-modal', type: 'closed' },
        { target: 'rtl-parent-modal-safe-target', type: 'focus-restored' },
      ],
      announcement: 'Child workspace dialog opened over parent workspace dialog',
      cleanup: ['child-scroll-claim-released', 'parent-scroll-claim-retained'],
    }),
  ),
  'of-modal.pointer-origin-dismiss.v1': scenarioProgram(
    [
      ['open', 'modal-opener'],
      ['point', 'outside-down-up'],
      ['open', 'modal-opener'],
      ['point', 'outside-drag-inside'],
      ['point', 'outside-cancel'],
      ['point', 'outside-context-menu'],
      ['point', 'child-interaction'],
      ['point', 'outside-prevented-default'],
    ],
    observation({
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
      focus: 'modal-opener-after-complete-outside-gesture',
      events: [
        { target: 'modal-panel', type: 'outside-origin-close-requested-once' },
        { target: 'modal-panel', type: 'incomplete-pointer-sequences-ignored' },
      ],
      announcement: 'Workspace options dialog dismissed',
      cleanup: ['pointer-sequence-guard-released', 'background-interactive'],
    }),
  ),
  'of-modal.controlled-close-commit.v1': scenarioProgram(
    [
      ['open', 'controlled-modal'],
      ['press', 'dismiss-control'],
      ['updateContent', 'controlled-close-commit'],
    ],
    observation({
      roles: [{ role: 'dialog', name: 'Controlled workspace' }],
      relationships: [{ source: 'dismiss-control', name: 'controls', target: 'controlled-modal' }],
      states: [
        { target: 'controlled-modal', name: 'close-request-count', value: 1 },
        { target: 'controlled-modal', name: 'logical-open-before-commit', value: true },
        { target: 'controlled-modal', name: 'logical-open-after-commit', value: false },
      ],
      focus: 'controlled-modal-until-close-commit',
      events: [
        { target: 'controlled-modal', type: 'close-requested-once' },
        { target: 'controlled-modal', type: 'controlled-close-committed' },
      ],
      announcement: 'Controlled workspace dialog closed',
      cleanup: ['controlled-layer-resources-released', 'background-interactive'],
    }),
  ),
  'of-modal.scroll-lock-reference-count.v1': scenarioProgram(
    [
      ['open', 'first-modal'],
      ['open', 'second-modal'],
      ['close', 'second-modal'],
      ['close', 'first-modal'],
      ['point', 'page-scroll-surface'],
    ],
    observation({
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
      focus: 'first-modal-opener-after-final-release',
      events: [
        { target: 'page-scroll-lock', type: 'claim-acquired-per-modal' },
        { target: 'page-scroll-lock', type: 'final-claim-released' },
        { target: 'page-scroll-surface', type: 'scroll-resumed' },
      ],
      announcement: 'All workspace modals closed',
      cleanup: ['page-scroll-lock-released', 'page-scroll-resumed'],
    }),
  ),
  'of-modal.exit-inactive-reopen.v1': scenarioProgram(
    [
      ['setMotionPreference', 'reduced-motion'],
      ['open', 'modal-opener'],
      ['close', 'modal-panel'],
      ['open', 'modal-opener'],
    ],
    observation({
      roles: [{ role: 'dialog', name: 'Reopened workspace' }],
      relationships: [{ source: 'reopened-modal', name: 'owns', target: 'single-resource-owner' }],
      states: [
        { target: 'committed-closed-modal', name: 'semantics-active', value: false },
        { target: 'committed-closed-modal', name: 'resource-claim-count', value: 0 },
        { target: 'reopened-modal', name: 'owner-count', value: 1 },
      ],
      focus: 'reopened-modal-safe-target',
      events: [
        { target: 'modal-panel', type: 'close-committed' },
        { target: 'reopened-modal', type: 'single-owner-created' },
      ],
      announcement: 'Reopened workspace dialog opened',
      cleanup: ['committed-close-semantics-released', 'committed-close-resources-released'],
    }),
  ),
  'of-modal.opener-restoration-successor.v1': scenarioProgram(
    [
      ['open', 'connected-opener'],
      ['close', 'modal-panel'],
      ['open', 'connected-opener'],
      ['updateContent', 'disconnect-opener'],
      ['close', 'modal-panel'],
    ],
    observation({
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
      focus: 'documented-successor',
      events: [
        { target: 'connected-meaningful-opener', type: 'focus-restored' },
        { target: 'documented-successor', type: 'focus-restored' },
      ],
      announcement: 'Workspace settings dialog closed',
      cleanup: ['restoration-guard-released', 'modal-portal-removed'],
    }),
  ),
  'of-modal.parent-close-with-child.v1': scenarioProgram(
    [
      ['open', 'parent-modal'],
      ['open', 'child-modal'],
      ['close', 'parent-modal'],
    ],
    observation({
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
      focus: 'parent-modal-successor',
      events: [
        { target: 'child-modal', type: 'closed-or-transferred-before-parent-close' },
        { target: 'parent-modal', type: 'closed-by-single-explicit-operation' },
      ],
      announcement: 'Parent and child workspace dialogs closed',
      cleanup: ['child-ownership-released', 'parent-ownership-released', 'no-orphan-portal'],
    }),
  ),
  'of-modal.unmount-cleanup.v1': scenarioProgram(
    [
      ['destroy', 'entry-phase-modal'],
      ['open', 'open-phase-modal'],
      ['destroy', 'open-phase-modal'],
      ['open', 'exit-phase-modal'],
      ['close', 'exit-phase-modal'],
      ['destroy', 'exit-phase-modal'],
    ],
    observation({
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
      focus: 'meaningful-opener-or-documented-successor',
      events: [
        { target: 'entry-phase-modal', type: 'destroyed-once' },
        { target: 'open-phase-modal', type: 'destroyed-once' },
        { target: 'exit-phase-modal', type: 'destroyed-once' },
      ],
      announcement: 'Disposable workspace dialog removed',
      cleanup: [
        'listeners-released-once',
        'inert-released-once',
        'scroll-released-once',
        'timers-released-once',
        'guards-released-once',
        'portal-released-once',
      ],
    }),
  ),
  'of-modal.ssr-open-semantics.v1': scenarioProgram(
    [['open', 'server-rendered-modal']],
    observation({
      roles: [{ role: 'dialog', name: 'Server workspace' }],
      relationships: [
        { source: 'server-rendered-modal', name: 'labelled-by', target: 'server-modal-title' },
      ],
      states: [
        { target: 'server-rendered-modal', name: 'semantically-available', value: true },
        { target: 'browser-globals', name: 'accessed', value: false },
      ],
      focus: 'server-document-focus-unchanged',
      events: [{ target: 'server-rendered-modal', type: 'rendered-open' }],
      announcement: 'Server workspace dialog is available',
      cleanup: ['no-browser-resource-claims'],
    }),
  ),
  'of-modal.hydration-stability.v1': scenarioProgram(
    [
      ['open', 'server-rendered-modal'],
      ['updateContent', 'hydrate-first-tree'],
      ['press', 'hydrated-input'],
    ],
    observation({
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
      focus: 'pre-hydration-focus-target',
      events: [{ target: 'hydrated-input', type: 'activated-once' }],
      announcement: 'Hydrated workspace dialog remains available',
      cleanup: ['single-event-owner-retained', 'single-modal-owner-retained'],
    }),
  ),
});

function sameOperation([operation, target], actual) {
  return actual?.operation === operation && actual?.target === target;
}

const OBSERVATION_KINDS = Object.freeze([
  'roles',
  'relationships',
  'states',
  'focus',
  'events',
  'announcements',
  'cleanup',
]);

function markerRecords(value) {
  return OBSERVATION_KINDS.flatMap((kind) => {
    const entries = kind === 'focus' ? [value.focus] : value[kind];
    return entries.map((entry, index) => ({ kind, index, value: structuredClone(entry) }));
  });
}

export function modalScenarioObservationMarkers(scenario) {
  const program = PROGRAMS[scenario.scenarioId];
  if (program === undefined) throw new Error(`unknown modal scenario: ${scenario.scenarioId}`);
  return markerRecords(program.observation);
}

export function interpretModalScenario({ scenario, trace, records }) {
  const program = PROGRAMS[scenario.scenarioId];
  if (program === undefined) throw new Error(`unknown modal scenario: ${scenario.scenarioId}`);
  if (
    scenario.operations.length !== program.operationTargets.length ||
    program.operationTargets.some(
      (entry, index) => !sameOperation(entry, scenario.operations[index]),
    )
  ) {
    throw new Error(`modal scenario operation order changed: ${scenario.scenarioId}`);
  }
  if (
    trace.length !== program.operationTargets.length ||
    trace.some(
      (entry, index) =>
        !sameOperation(program.operationTargets[index], entry) || entry.markerFound !== true,
    )
  ) {
    throw new Error(`modal scenario did not execute every neutral target: ${scenario.scenarioId}`);
  }
  const requiredMarkers = markerRecords(program.observation);
  if (
    !Array.isArray(records) ||
    records.length !== requiredMarkers.length ||
    requiredMarkers.some(
      (required, index) =>
        records[index]?.kind !== required.kind ||
        records[index]?.index !== required.index ||
        JSON.stringify(records[index]?.value) !== JSON.stringify(required.value),
    )
  ) {
    throw new Error(`modal scenario observation markers are incomplete: ${scenario.scenarioId}`);
  }
  const captured = Object.fromEntries(OBSERVATION_KINDS.map((kind) => [kind, []]));
  for (const record of records) captured[record.kind].push(structuredClone(record.value));
  return {
    roles: captured.roles,
    relationships: captured.relationships,
    states: captured.states,
    focus: captured.focus[0],
    events: captured.events,
    announcements: captured.announcements,
    cleanup: captured.cleanup,
    diagnostics: {
      executor: 'shared-neutral-interpreter',
      operations: structuredClone(scenario.operations),
      trace: structuredClone(trace),
    },
  };
}
