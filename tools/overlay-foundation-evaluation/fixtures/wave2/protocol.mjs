import { isPlainRecord, rejectUnknownKeys, validateScenario } from '../../contracts/protocol.mjs';
import { createFixtureProtocol } from '../shared/protocol.mjs';

const EXECUTION_KEYS = Object.freeze(['scenarioId', 'operations', 'probes']);
export function wave2ExecutionScenario(scenario) {
  if (!isPlainRecord(scenario))
    throw new TypeError('Wave2 execution scenario must be a plain record');
  return Object.freeze(
    Object.fromEntries(EXECUTION_KEYS.map((key) => [key, structuredClone(scenario[key])])),
  );
}
function validateExecutionScenario(value, errors) {
  if (!isPlainRecord(value)) {
    errors.push('fixture request.scenario must be a plain record');
    return;
  }
  rejectUnknownKeys(value, EXECUTION_KEYS, 'fixture request.scenario', errors);
  if (!/^of-(?:anchored|menu|tooltip)\.[a-z0-9.-]+\.v1$/u.test(value.scenarioId ?? ''))
    errors.push('fixture request.scenario.scenarioId must identify a Wave2 contract');
  if (!Array.isArray(value.probes)) errors.push('fixture request.scenario.probes must be an array');
  // The generic schema checks operation/probe syntax only. No catalog or oracle is imported.
  const shape = {
    schemaVersion: 1,
    revision: 1,
    contractId: 'OF-ANCHORED',
    scenarioId: value.scenarioId,
    components: ['Popover'],
    initial: { markup: '<button>Open</button>', state: {} },
    operations: value.operations,
    ...(value.probes?.length === 0 ? {} : { probes: value.probes }),
    expected: {
      roles: [],
      relationships: [],
      states: [],
      focus: { target: 'trigger' },
      events: [],
      announcements: [],
      cleanup: [],
    },
    requiredCells: ['chromium'],
    capture: ['dom'],
  };
  errors.push(
    ...validateScenario(shape)
      .filter((error) => /^scenario\.(?:scenarioId|operations|probes)/u.test(error))
      .map((error) => error.replace(/^scenario/u, 'fixture request.scenario')),
  );
}
const protocol = createFixtureProtocol({
  validateExecutionScenario,
  label: 'Wave2',
  allowTiming: true,
  requireResources: true,
});
export const validateWave2FixtureRequest = protocol.validateRequest;
export const validateWave2Observation = protocol.validateObservation;
export function validateWave2Snapshot(snapshot) {
  const errors = [];
  protocol.validateSnapshot(snapshot, 'Wave2 snapshot', errors);
  return errors;
}
