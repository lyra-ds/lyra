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
