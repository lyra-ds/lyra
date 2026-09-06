import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MODAL_SCENARIOS } from '../../contracts/modal.mjs';
import {
  modalExecutionScenario,
  validateModalFixtureRequest,
  validateModalObservation,
} from './protocol.mjs';

const validRequest = {
  schemaVersion: 1,
  scenario: modalExecutionScenario(MODAL_SCENARIOS[0]),
  cell: {
    id: 'chromium',
    reactVersion: '19.2.8',
    direction: 'ltr',
    colorScheme: 'light',
    forcedColors: false,
    reducedMotion: false,
    coarsePointer: false,
  },
};

const validObservation = {
  roles: [{ role: 'dialog', name: 'Workspace details' }],
  relationships: [{ source: 'modal-panel', name: 'labelled-by', target: 'modal-title' }],
  states: [{ target: 'modal-panel', name: 'aria-modal', value: true }],
  focus: { target: 'modal-safe-target' },
  events: [{ target: 'modal-panel', type: 'opened' }],
  announcements: [{ message: 'Workspace details dialog opened' }],
  cleanup: ['background-interactive'],
  trace: [
    {
      phase: 'before-operations',
      snapshot: {
        direction: 'ltr',
        roles: [],
        relationships: [],
        states: [],
        focus: { target: 'modal-opener' },
        events: [],
        announcements: [],
      },
    },
    {
      phase: 'after-operation',
      operationIndex: 0,
      operation: { operation: 'open', target: 'modal-opener' },
      snapshot: {
        direction: 'ltr',
        roles: [{ role: 'dialog', name: 'Workspace details' }],
        relationships: [{ source: 'modal-panel', name: 'labelled-by', target: 'modal-title' }],
        states: [{ target: 'modal-panel', name: 'aria-modal', value: true }],
        focus: { target: 'modal-safe-target' },
        events: [{ target: 'modal-panel', type: 'opened' }],
        announcements: [{ message: 'Workspace details dialog opened' }],
      },
    },
    {
      phase: 'after-cleanup',
      snapshot: {
        direction: 'ltr',
        roles: [],
        relationships: [],
        states: [],
        focus: { target: 'modal-opener' },
        events: [{ target: 'modal-panel', type: 'opened' }],
        announcements: [],
      },
    },
  ],
  diagnostics: {
    vendor: 'radix',
    selector: '[data-radix-dialog-content]',
    cleanupObserved: true,
    executionCompleted: true,
    actions: [
      {
        operation: 'open',
        target: 'modal-opener',
        controlFound: true,
        dispatched: true,
        completed: true,
      },
    ],
  },
};

test('accepts one complete neutral request and observation', () => {
  assert.deepEqual(validateModalFixtureRequest(validRequest), []);
  assert.deepEqual(validateModalObservation(validObservation), []);
});

test('requires every trace snapshot to carry a validated direction', () => {
  const missing = structuredClone(validObservation);
  delete missing.trace[0].snapshot.direction;
  assert.match(validateModalObservation(missing).join('\n'), /direction must equal ltr or rtl/u);

  const invalid = structuredClone(validObservation);
  invalid.trace[1].snapshot.direction = 'sideways';
  assert.match(validateModalObservation(invalid).join('\n'), /direction must equal ltr or rtl/u);
});

test('rejects every mixed SSR/browser trace topology', () => {
  const mixed = structuredClone(validObservation);
  mixed.trace.splice(1, 0, {
    phase: 'server-render',
    snapshot: structuredClone(mixed.trace[0].snapshot),
  });
  assert.match(
    validateModalObservation(mixed).join('\n'),
    /server-render.*only|trace.*mode|exactly one/iu,
  );

  const serverWithCleanup = structuredClone(validObservation);
  serverWithCleanup.trace = [
    {
      phase: 'server-render',
      snapshot: structuredClone(validObservation.trace[1].snapshot),
    },
    {
      phase: 'after-cleanup',
      snapshot: structuredClone(validObservation.trace[2].snapshot),
    },
  ];
  delete serverWithCleanup.diagnostics.actions;
  assert.match(
    validateModalObservation(serverWithCleanup).join('\n'),
    /server-render.*only|trace.*mode|exactly one/iu,
  );
});

for (const key of ['candidateId', 'vendorSelector', 'implementation']) {
  test(`rejects fixture request coupling ${key}`, () => {
    assert.match(
      validateModalFixtureRequest({ ...validRequest, [key]: 'radix' }).join('\n'),
      /unsupported|coupling/u,
    );
  });
}

test('rejects an incomplete cell and unsupported observation field', () => {
  const request = structuredClone(validRequest);
  delete request.cell.coarsePointer;
  assert.match(validateModalFixtureRequest(request).join('\n'), /coarsePointer/u);
  assert.match(
    validateModalObservation({ ...validObservation, candidateId: 'radix' }).join('\n'),
    /unsupported/u,
  );
});

test('allows vendor facts only inside diagnostics', () => {
  const observation = structuredClone(validObservation);
  observation.roles[0].name = 'radix dialog';
  assert.match(validateModalObservation(observation).join('\n'), /candidate|vendor|coupling/u);
  assert.deepEqual(validateModalObservation(validObservation), []);
});

test('rejects vendor identity embedded in normative prose and records', () => {
  const announcement = structuredClone(validObservation);
  announcement.announcements[0].message = 'Radix dialog opened';
  const state = structuredClone(validObservation);
  state.states[0].value = { note: 'Zag dialog active' };
  for (const observation of [announcement, state]) {
    assert.match(validateModalObservation(observation).join('\n'), /candidate|vendor|coupling/u);
  }
});

test('rejects bare vendor identities in normative scalar and nested fields', () => {
  const observations = ['radix', 'base-ui', 'zag', 'incumbent', 'lyra'].map((identity, index) => {
    const observation = structuredClone(validObservation);
    if (index % 2 === 0) observation.announcements[0].message = identity;
    else observation.states[0].value = { note: identity };
    return observation;
  });
  for (const observation of observations) {
    const errors = validateModalObservation(observation).join('\n');
    assert.match(errors, /candidate|vendor|coupling/u);
    assert.match(errors, /normative fields/u);
  }
});

test('accepts neutral prose containing non-identity substrings', () => {
  const observation = structuredClone(validObservation);
  observation.announcements[0].message = 'The radix sort is complete.';
  assert.deepEqual(validateModalObservation(observation), []);
});

test('rejects duplicate resource ids and invalid resource purposes', () => {
  const resourceEntry = {
    id: 1,
    acquiredOperation: 'open',
    acquiredPhase: 'operation',
    boundary: 'modal-panel',
    owner: 'modal-panel',
    purpose: 'focus-loop',
    target: 'document',
    type: 'keydown',
    uses: [],
  };
  const duplicate = structuredClone(validObservation);
  duplicate.trace[0].snapshot.resources = {
    listeners: 2,
    timers: 0,
    claims: [],
    listenerEntries: [resourceEntry, { ...resourceEntry }],
    listenerLifecycles: [],
    timerEntries: [],
    timerLifecycles: [],
  };
  assert.match(
    validateModalObservation(duplicate).join('\n'),
    /listenerEntries\[1\]\.id must be unique/u,
  );

  const invalidPurpose = structuredClone(duplicate);
  invalidPurpose.trace[0].snapshot.resources.listenerEntries = [
    { ...resourceEntry, purpose: 'vendor-specific-purpose' },
  ];
  assert.match(
    validateModalObservation(invalidPurpose).join('\n'),
    /listenerEntries\[0\]\.purpose is invalid/u,
  );

  const invalidClaimId = structuredClone(duplicate);
  invalidClaimId.trace[0].snapshot.resources.listenerEntries = [];
  invalidClaimId.trace[0].snapshot.resources.claims = [
    { id: 0, kind: 'scroll-lock', owner: 'modal-panel' },
  ];
  assert.match(
    validateModalObservation(invalidClaimId).join('\n'),
    /claims\[0\]\.id must be a positive safe integer/u,
  );

  const invalidTimerKind = structuredClone(invalidClaimId);
  invalidTimerKind.trace[0].snapshot.resources.claims = [];
  invalidTimerKind.trace[0].snapshot.resources.timerEntries = [
    {
      id: 1,
      acquiredOperation: 'open',
      acquiredPhase: 'operation',
      kind: 'animation-frame',
      owner: 'modal-panel',
      purpose: 'focus-loop',
      target: 'window',
    },
  ];
  assert.match(
    validateModalObservation(invalidTimerKind).join('\n'),
    /timerEntries\[0\]\.kind is invalid/u,
  );

  const invalidLifecycle = structuredClone(invalidTimerKind);
  invalidLifecycle.trace[0].snapshot.resources.timerEntries = [];
  invalidLifecycle.trace[0].snapshot.resources.listenerLifecycles = [
    { ...resourceEntry, releaseCount: -1 },
  ];
  assert.match(
    validateModalObservation(invalidLifecycle).join('\n'),
    /listenerLifecycles\[0\]\.releaseCount must be a non-negative safe integer/u,
  );

  const invalidUse = structuredClone(invalidLifecycle);
  invalidUse.trace[0].snapshot.resources.listenerLifecycles = [];
  invalidUse.trace[0].snapshot.resources.listenerEntries = [
    {
      ...resourceEntry,
      uses: [
        {
          effects: ['vendor-effect'],
          operation: 'open',
          phase: 'operation',
          purpose: 'focus-loop',
          target: 'document',
          type: 'keydown',
        },
      ],
    },
  ];
  assert.match(
    validateModalObservation(invalidUse).join('\n'),
    /listenerEntries\[0\]\.uses\[0\]\.effects contains an invalid effect/u,
  );
});

test('rejects non-JSON probe facts', () => {
  const observation = structuredClone(validObservation);
  observation.trace[0].snapshot.probes = [{ id: 'focus-1', category: 'focus', fact: undefined }];

  assert.match(
    validateModalObservation(observation).join('\n'),
    /probes\[0\]\.fact must contain JSON values/u,
  );
});

test('characterization: closed request, cell, observation, and snapshot keys remain stable', () => {
  assert.deepEqual(Object.keys(validRequest), ['schemaVersion', 'scenario', 'cell']);
  assert.deepEqual(Object.keys(validRequest.scenario), [
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
  ]);
  assert.deepEqual(Object.keys(validRequest.cell), [
    'id',
    'reactVersion',
    'direction',
    'colorScheme',
    'forcedColors',
    'reducedMotion',
    'coarsePointer',
  ]);
  assert.deepEqual(Object.keys(validObservation), [
    'roles',
    'relationships',
    'states',
    'focus',
    'events',
    'announcements',
    'cleanup',
    'trace',
    'diagnostics',
  ]);
  for (const key of Object.keys(validRequest.cell)) {
    const changed = structuredClone(validRequest);
    delete changed.cell[key];
    assert.notDeepEqual(validateModalFixtureRequest(changed), [], key);
  }
  for (const key of Object.keys(validObservation)) {
    const changed = structuredClone(validObservation);
    delete changed[key];
    assert.notDeepEqual(validateModalObservation(changed), [], key);
  }
  for (const mutate of [
    (v) => (v.extra = true),
    (v) => (v.trace[0].extra = true),
    (v) => (v.trace[0].snapshot.extra = true),
  ]) {
    const changed = structuredClone(validObservation);
    mutate(changed);
    assert.match(validateModalObservation(changed).join(' '), /unsupported/);
  }
  const changed = structuredClone(validRequest);
  changed.scenario.expected = {};
  assert.match(validateModalFixtureRequest(changed).join(' '), /unsupported/);
});

test('characterization: diagnostics accept JSON vendor data but never escape to trace facts', () => {
  for (const value of [undefined, NaN, Infinity, () => {}, new Map()]) {
    const changed = structuredClone(validObservation);
    changed.diagnostics.extra = value;
    assert.match(validateModalObservation(changed).join(' '), /JSON/);
  }
  const changed = structuredClone(validObservation);
  changed.trace[0].snapshot.states.push({
    target: 'modal-panel',
    name: 'implementation',
    value: changed.diagnostics.vendor,
  });
  assert.match(validateModalObservation(changed).join(' '), /trace.*vendor/);
});
