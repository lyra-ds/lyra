import assert from 'node:assert/strict';
import { test } from 'node:test';
import { WAVE_2_SCENARIOS } from '../../contracts/wave2.mjs';
import {
  wave2ExecutionScenario,
  validateWave2FixtureRequest,
  validateWave2Observation,
} from './protocol.mjs';
const cell = {
  id: 'chromium',
  reactVersion: '19.2.8',
  direction: 'ltr',
  colorScheme: 'light',
  forcedColors: false,
  reducedMotion: false,
  coarsePointer: false,
};
const request = () => ({
  schemaVersion: 1,
  scenario: structuredClone(wave2ExecutionScenario(WAVE_2_SCENARIOS[0])),
  cell: { ...cell },
});
const resources = {
  listeners: 0,
  timers: 0,
  claims: [],
  claimLifecycles: [],
  listenerEntries: [],
  listenerLifecycles: [],
  timerEntries: [],
  timerLifecycles: [],
};
const snapshot = () => ({
  direction: 'ltr',
  roles: [],
  relationships: [],
  states: [],
  focus: { target: 'trigger' },
  events: [],
  announcements: [],
  resources: structuredClone(resources),
});
const observation = () => ({
  roles: [],
  relationships: [],
  states: [],
  focus: { target: 'trigger' },
  events: [],
  announcements: [],
  cleanup: [],
  trace: [{ phase: 'before-operations', snapshot: snapshot() }],
  diagnostics: {},
});

test('Wave2 projects every catalog into only execution instructions', () => {
  for (const scenario of WAVE_2_SCENARIOS) {
    const projected = wave2ExecutionScenario(scenario);
    assert.deepEqual(Object.keys(projected), ['scenarioId', 'operations', 'probes']);
    assert.deepEqual(
      validateWave2FixtureRequest({ ...request(), scenario: projected }),
      [],
      scenario.scenarioId,
    );
    assert.notEqual(projected.operations, scenario.operations);
  }
});
test('Wave2 rejects browser request oracle, candidate, coverage and cell flags', () => {
  for (const key of [
    'candidateId',
    'expected',
    'initial',
    'requiredCells',
    'capture',
    'components',
    'contractId',
    'artifact',
  ]) {
    const value = request();
    value.scenario[key] = 'radix';
    assert.notDeepEqual(validateWave2FixtureRequest(value), [], key);
    const top = request();
    top[key] = true;
    assert.notDeepEqual(validateWave2FixtureRequest(top), [], key);
  }
  const value = request();
  value.cell.bundle = true;
  assert.notDeepEqual(validateWave2FixtureRequest(value), []);
  value.cell = cell;
  value.scenario.scenarioId = 'of-modal.open.v1';
  assert.notDeepEqual(validateWave2FixtureRequest(value), []);
});
test('Wave2 validates timing and required execution keys', () => {
  for (const milliseconds of [-1, NaN, Infinity, 0.5, '10', undefined]) {
    const value = request();
    value.scenario.operations = [
      { operation: 'advanceTime', target: 'browser-clock', milliseconds },
    ];
    value.scenario.probes = [];
    assert.match(validateWave2FixtureRequest(value).join(' '), /milliseconds/);
  }
  for (const key of ['scenarioId', 'operations', 'probes']) {
    const value = request();
    delete value.scenario[key];
    assert.notDeepEqual(validateWave2FixtureRequest(value), []);
  }
});
test('Wave2 requires full resource evidence and isolates JSON diagnostics', () => {
  assert.deepEqual(validateWave2Observation(observation()), []);
  for (const key of Object.keys(resources)) {
    const value = observation();
    delete value.trace[0].snapshot.resources[key];
    assert.notDeepEqual(validateWave2Observation(value), [], key);
  }
  const value = observation();
  delete value.trace[0].snapshot.resources;
  assert.notDeepEqual(validateWave2Observation(value), []);
  for (const vendor of [
    '@radix-ui/react-popover',
    '@zag-js/menu',
    'Base UI tooltip',
    '[data-radix-menu-content]',
  ]) {
    const value = observation();
    value.diagnostics.vendor = vendor;
    assert.deepEqual(validateWave2Observation(value), []);
    value.states.push({ target: 'popup', name: 'implementation', value: vendor });
    assert.match(validateWave2Observation(value).join(' '), /vendor|candidate/);
  }
  const invalid = observation();
  invalid.diagnostics.bad = () => {};
  assert.match(validateWave2Observation(invalid).join(' '), /JSON/);
});

test('Wave2 rejects candidate identities in the actual scenario ID', () => {
  for (const id of [
    'of-tooltip.radix.v1',
    'of-menu.base-ui.v1',
    'of-anchored.zag.v1',
    'of-tooltip..v1',
  ]) {
    const value = request();
    value.scenario.scenarioId = id;
    assert.notDeepEqual(validateWave2FixtureRequest(value), [], id);
  }
});

test('Wave2 rejects resource counts and lifecycle identities that do not reconcile', () => {
  for (const mutate of [
    (r) => (r.timers = 1),
    (r) => (r.listeners = 1),
    (r) => r.claims.push({ id: 1, kind: 'portal', owner: 'popup' }),
    (r) =>
      r.timerLifecycles.push({
        id: 1,
        kind: 'timeout',
        owner: 'popup',
        purpose: 'other',
        target: 'window',
        acquiredOperation: 'open',
        acquiredPhase: 'operation',
        releaseCount: 1,
      }),
  ]) {
    const value = observation();
    mutate(value.trace[0].snapshot.resources);
    assert.notDeepEqual(validateWave2Observation(value), []);
  }
});
