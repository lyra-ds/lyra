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
  'trace',
  'diagnostics',
]);
const SNAPSHOT_KEYS = Object.freeze([
  'roles',
  'relationships',
  'states',
  'focus',
  'events',
  'announcements',
  'probes',
  'resources',
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

export function validateModalFixtureRequest(value) {
  const errors = [];
  if (!isPlainRecord(value)) return ['fixture request must be a plain record'];
  rejectUnknownKeys(value, REQUEST_KEYS, 'fixture request', errors);
  requireExactInteger(value.schemaVersion, 1, 'fixture request.schemaVersion', errors);
  validateExecutionScenario(value.scenario, errors);
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
    return (
      /^(?:incumbent|lyra|radix|base[ -]?ui|zag|vendor)$/iu.test(value.trim()) ||
      /(?:@(?:radix-ui\/react-dialog|base-ui-components\/react|zag-js\/dialog|lyra-ds\/react)|\b(?:incumbent|lyra|radix|base[ -]?ui|zag|vendor)\s+(?:dialog|modal|selector|component|primitive|implementation|adapter)\b)/iu.test(
        value,
      )
    );
  }
  if (Array.isArray(value)) return value.some(containsVendorFact);
  if (!isPlainRecord(value)) return false;
  return Object.entries(value).some(
    ([key, entry]) => containsVendorFact(key) || containsVendorFact(entry),
  );
}

function validateSnapshot(snapshot, path, errors) {
  if (!isPlainRecord(snapshot)) {
    errors.push(`${path} must be a plain record`);
    return;
  }
  rejectUnknownKeys(snapshot, SNAPSHOT_KEYS, path, errors);
  const wrapped = {
    roles: snapshot.roles,
    relationships: snapshot.relationships,
    states: snapshot.states,
    focus: snapshot.focus,
    events: snapshot.events,
    announcements: snapshot.announcements,
    cleanup: [],
  };
  for (const error of validateScenario(expectedScenario(wrapped))) {
    if (error.startsWith('scenario.expected')) {
      errors.push(error.replace(/^scenario\.expected/u, path));
    }
  }
  if (snapshot.resources !== undefined) {
    if (!isPlainRecord(snapshot.resources)) {
      errors.push(`${path}.resources must be a plain record`);
    } else {
      rejectUnknownKeys(snapshot.resources, ['listeners', 'timers'], `${path}.resources`, errors);
      for (const key of ['listeners', 'timers']) {
        if (!Number.isSafeInteger(snapshot.resources[key]) || snapshot.resources[key] < 0) {
          errors.push(`${path}.resources.${key} must be a non-negative safe integer`);
        }
      }
    }
  }
  if (snapshot.probes !== undefined) {
    if (!Array.isArray(snapshot.probes)) {
      errors.push(`${path}.probes must be an array`);
    } else {
      const ids = new Set();
      snapshot.probes.forEach((probe, index) => {
        const probePath = `${path}.probes[${index}]`;
        if (!isPlainRecord(probe)) {
          errors.push(`${probePath} must be a plain record`);
          return;
        }
        rejectUnknownKeys(probe, ['category', 'fact', 'id'], probePath, errors);
        if (typeof probe.id !== 'string' || probe.id.length === 0) {
          errors.push(`${probePath}.id must be a non-empty string`);
        }
        if (ids.has(probe.id)) errors.push(`${probePath}.id must be unique in its phase`);
        ids.add(probe.id);
        if (
          ![
            'roles',
            'relationships',
            'states',
            'focus',
            'events',
            'announcements',
            'cleanup',
          ].includes(probe.category)
        ) {
          errors.push(`${probePath}.category is invalid`);
        }
        if (!isJsonValue(probe.fact)) errors.push(`${probePath}.fact must contain JSON values`);
      });
    }
  }
}

function validateTrace(trace, errors) {
  if (!Array.isArray(trace) || trace.length === 0) {
    errors.push('modal observation.trace must be a non-empty array');
    return;
  }
  for (const [index, entry] of trace.entries()) {
    const path = `modal observation.trace[${index}]`;
    if (!isPlainRecord(entry)) {
      errors.push(`${path} must be a plain record`);
      continue;
    }
    rejectUnknownKeys(entry, ['phase', 'operationIndex', 'operation', 'snapshot'], path, errors);
    if (
      !['before-operations', 'after-operation', 'after-cleanup', 'server-render'].includes(
        entry.phase,
      )
    ) {
      errors.push(`${path}.phase is invalid`);
    }
    if (entry.phase === 'after-operation') {
      if (!Number.isSafeInteger(entry.operationIndex) || entry.operationIndex < 0) {
        errors.push(`${path}.operationIndex must be a non-negative safe integer`);
      }
      if (!isPlainRecord(entry.operation)) {
        errors.push(`${path}.operation must be a plain record`);
      } else {
        rejectUnknownKeys(entry.operation, ['operation', 'target'], `${path}.operation`, errors);
        for (const key of ['operation', 'target']) {
          if (typeof entry.operation[key] !== 'string' || entry.operation[key].length === 0) {
            errors.push(`${path}.operation.${key} must be a non-empty string`);
          }
        }
      }
    } else if (entry.operationIndex !== undefined || entry.operation !== undefined) {
      errors.push(`${path} may identify an operation only after an operation`);
    }
    validateSnapshot(entry.snapshot, `${path}.snapshot`, errors);
  }
  const serverEntries = trace.filter(({ phase }) => phase === 'server-render');
  if (serverEntries.length > 0) {
    if (trace.length !== 1 || serverEntries.length !== 1 || trace[0]?.phase !== 'server-render') {
      errors.push('modal observation server-render trace must contain exactly one entry only');
    }
    return;
  }
  const beforeIndexes = trace.flatMap(({ phase }, index) =>
    phase === 'before-operations' ? [index] : [],
  );
  const cleanupIndexes = trace.flatMap(({ phase }, index) =>
    phase === 'after-cleanup' ? [index] : [],
  );
  if (beforeIndexes.length !== 1 || beforeIndexes[0] !== 0) {
    errors.push('modal observation browser trace must start with one before-operations entry');
  }
  if (
    cleanupIndexes.length > 1 ||
    (cleanupIndexes.length === 1 && cleanupIndexes[0] !== trace.length - 1)
  ) {
    errors.push('modal observation browser cleanup trace must be the final entry');
  }
  const operationEntries = trace.filter(({ phase }) => phase === 'after-operation');
  for (const [index, entry] of operationEntries.entries()) {
    if (entry.operationIndex !== index) {
      errors.push('modal observation browser operation indexes must be contiguous from zero');
      break;
    }
  }
  const allowedLength = 1 + operationEntries.length + cleanupIndexes.length;
  if (trace.length !== allowedLength) {
    errors.push('modal observation browser trace contains an invalid phase mixture');
  }
}

function validateExecutionDiagnostics(diagnostics, trace, errors) {
  if (!isPlainRecord(diagnostics) || !Array.isArray(trace)) return;
  const evidenceTrace = trace.some(({ phase }) =>
    ['after-operation', 'after-cleanup', 'server-render'].includes(phase),
  );
  if (!evidenceTrace) return;
  for (const key of ['executionCompleted', 'cleanupObserved']) {
    if (typeof diagnostics[key] !== 'boolean') {
      errors.push(`modal observation.diagnostics.${key} must be a boolean`);
    }
  }
  const operationCount = trace.filter(({ phase }) => phase === 'after-operation').length;
  if (operationCount === 0) return;
  if (!Array.isArray(diagnostics.actions)) {
    errors.push('modal observation.diagnostics.actions must be an array');
    return;
  }
  if (diagnostics.actions.length !== operationCount) {
    errors.push('modal observation.diagnostics.actions must match the executed trace length');
  }
  for (const [index, action] of diagnostics.actions.entries()) {
    const path = `modal observation.diagnostics.actions[${index}]`;
    if (!isPlainRecord(action)) {
      errors.push(`${path} must be a plain record`);
      continue;
    }
    for (const key of ['operation', 'target']) {
      if (typeof action[key] !== 'string' || action[key].length === 0) {
        errors.push(`${path}.${key} must be a non-empty string`);
      }
    }
    for (const key of ['controlFound', 'dispatched', 'completed']) {
      if (typeof action[key] !== 'boolean') errors.push(`${path}.${key} must be a boolean`);
    }
    if (action.prevented !== undefined && typeof action.prevented !== 'boolean') {
      errors.push(`${path}.prevented must be a boolean`);
    }
    if (action.failure !== undefined && typeof action.failure !== 'string') {
      errors.push(`${path}.failure must be a string`);
    }
    for (const key of ['events', 'surfaces']) {
      if (
        action[key] !== undefined &&
        (!Array.isArray(action[key]) || action[key].some((entry) => typeof entry !== 'string'))
      ) {
        errors.push(`${path}.${key} must be an array of strings`);
      }
    }
  }
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
    OBSERVATION_KEYS.filter((key) => key !== 'diagnostics' && key !== 'trace').map((key) => [
      key,
      value[key],
    ]),
  );
  if (containsVendorFact(normative)) {
    errors.push('modal observation normative fields must not contain candidate or vendor coupling');
  }
  if (!isJsonValue(value.diagnostics))
    errors.push('modal observation.diagnostics must contain JSON values');
  validateTrace(value.trace, errors);
  validateExecutionDiagnostics(value.diagnostics, value.trace, errors);
  if (containsVendorFact(value.trace)) {
    errors.push('modal observation trace must not contain candidate or vendor coupling');
  }
  return errors;
}
