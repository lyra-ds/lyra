import { isPlainRecord, rejectUnknownKeys, validateScenario } from '../../contracts/protocol.mjs';
import { createFixtureProtocol } from '../shared/protocol.mjs';

const EXECUTION_SCENARIO_KEYS = Object.freeze([
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

const SHAPE_ONLY_EXPECTED = Object.freeze({
  roles: Object.freeze([]),
  relationships: Object.freeze([]),
  states: Object.freeze([]),
  focus: Object.freeze({ target: 'modal-fixture-root' }),
  events: Object.freeze([]),
  announcements: Object.freeze([]),
  cleanup: Object.freeze([]),
});

export function modalExecutionScenario(scenario) {
  if (!isPlainRecord(scenario)) throw new Error('modal execution scenario must be a plain record');
  return Object.freeze(
    Object.fromEntries(
      EXECUTION_SCENARIO_KEYS.flatMap((key) =>
        scenario[key] === undefined ? [] : [[key, structuredClone(scenario[key])]],
      ),
    ),
  );
}

function validateExecutionScenario(value, errors) {
  if (!isPlainRecord(value)) {
    errors.push('fixture request.scenario must be a plain record');
    return;
  }
  rejectUnknownKeys(value, EXECUTION_SCENARIO_KEYS, 'fixture request.scenario', errors);
  const shape = { ...value, expected: SHAPE_ONLY_EXPECTED };
  for (const error of validateScenario(shape)) {
    if (!error.startsWith('scenario.expected')) {
      errors.push(error.replace(/^scenario/u, 'fixture request.scenario'));
    }
  }
}

const protocol = createFixtureProtocol({ validateExecutionScenario });
export const validateModalFixtureRequest = protocol.validateRequest;
export const validateModalObservation = protocol.validateObservation;
