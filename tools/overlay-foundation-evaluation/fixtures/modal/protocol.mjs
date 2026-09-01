import { MODAL_WAVE_CELLS } from '../../contracts/modal.mjs';
import {
  isPlainRecord,
  rejectUnknownKeys,
  requireExactInteger,
  validateScenario,
} from '../../contracts/protocol.mjs';

const REACT_VERSIONS = Object.freeze(['18.3.1', '19.2.8']);
const DIRECTIONS = Object.freeze(['ltr', 'rtl']);
const COLOR_SCHEMES = Object.freeze(['light', 'dark']);
const REQUEST_KEYS = Object.freeze(['schemaVersion', 'scenario', 'cell']);
const CELL_KEYS = Object.freeze([
  'id',
  'reactVersion',
  'direction',
  'colorScheme',
  'forcedColors',
  'reducedMotion',
  'coarsePointer',
]);
const OBSERVATION_KEYS = Object.freeze([
  'roles',
  'relationships',
  'states',
  'focus',
  'events',
  'announcements',
  'cleanup',
  'diagnostics',
]);

function validateCell(cell, errors) {
  if (!isPlainRecord(cell)) {
    errors.push('fixture request.cell must be a plain record');
    return;
  }
  rejectUnknownKeys(cell, CELL_KEYS, 'fixture request.cell', errors);
  if (!MODAL_WAVE_CELLS.includes(cell.id)) errors.push('fixture request.cell.id is invalid');
  if (!REACT_VERSIONS.includes(cell.reactVersion)) {
    errors.push('fixture request.cell.reactVersion is invalid');
  }
  if (!DIRECTIONS.includes(cell.direction))
    errors.push('fixture request.cell.direction is invalid');
  if (!COLOR_SCHEMES.includes(cell.colorScheme)) {
    errors.push('fixture request.cell.colorScheme is invalid');
  }
  for (const key of ['forcedColors', 'reducedMotion', 'coarsePointer']) {
    if (typeof cell[key] !== 'boolean')
      errors.push(`fixture request.cell.${key} must be a boolean`);
  }
}

export function validateModalFixtureRequest(value) {
  const errors = [];
  if (!isPlainRecord(value)) return ['fixture request must be a plain record'];
  rejectUnknownKeys(value, REQUEST_KEYS, 'fixture request', errors);
  requireExactInteger(value.schemaVersion, 1, 'fixture request.schemaVersion', errors);
  for (const error of validateScenario(value.scenario)) {
    errors.push(error.replace(/^scenario/u, 'fixture request.scenario'));
  }
  validateCell(value.cell, errors);
  return errors;
}

function isJsonValue(value, seen = new Set()) {
  if (value === null || ['boolean', 'number', 'string'].includes(typeof value)) {
    return Number.isFinite(value) || typeof value !== 'number';
  }
  if (typeof value !== 'object' || seen.has(value)) return false;
  seen.add(value);
  const valid = Array.isArray(value)
    ? value.every((entry) => isJsonValue(entry, seen))
    : isPlainRecord(value) && Object.values(value).every((entry) => isJsonValue(entry, seen));
  seen.delete(value);
  return valid;
}

function expectedScenario(observation) {
  return {
    schemaVersion: 1,
    revision: 1,
    contractId: 'OF-MODAL',
    scenarioId: 'of-modal.fixture-observation.v1',
    components: ['Dialog'],
    initial: { markup: '<button>Open</button>', state: {} },
    operations: [{ operation: 'open', target: 'modal-opener' }],
    expected: {
      roles: observation.roles,
      relationships: observation.relationships,
      states: observation.states,
      focus: observation.focus,
      events: observation.events,
      announcements: observation.announcements,
      cleanup: observation.cleanup,
    },
    requiredCells: ['chromium'],
    capture: ['dom'],
  };
}

function containsVendorFact(value) {
  if (typeof value === 'string') {
    return /(?:^|\s)(?:incumbent|lyra|radix|base[ -]?ui|zag|vendor)(?:\s+(?:dialog|modal|selector|component|primitive|implementation))?(?:\s*$)/iu.test(
      value,
    );
  }
  if (Array.isArray(value)) return value.some(containsVendorFact);
  if (!isPlainRecord(value)) return false;
  return Object.entries(value).some(
    ([key, entry]) => containsVendorFact(key) || containsVendorFact(entry),
  );
}

export function validateModalObservation(value) {
  const errors = [];
  if (!isPlainRecord(value)) return ['modal observation must be a plain record'];
  rejectUnknownKeys(value, OBSERVATION_KEYS, 'modal observation', errors);
  for (const error of validateScenario(expectedScenario(value))) {
    if (error.startsWith('scenario.expected')) {
      errors.push(error.replace(/^scenario\.expected/u, 'modal observation'));
    }
  }
  const normative = Object.fromEntries(
    OBSERVATION_KEYS.filter((key) => key !== 'diagnostics').map((key) => [key, value[key]]),
  );
  if (containsVendorFact(normative)) {
    errors.push('modal observation normative fields must not contain candidate or vendor coupling');
  }
  if (!isJsonValue(value.diagnostics))
    errors.push('modal observation.diagnostics must contain JSON values');
  return errors;
}
