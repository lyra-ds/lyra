export const CONTRACT_IDS = Object.freeze([
  'OF-MODAL',
  'OF-ANCHORED',
  'OF-MENU',
  'OF-TOOLTIP',
  'OF-COMPOSED',
]);

export const CANDIDATE_IDS = Object.freeze(['incumbent', 'radix', 'base-ui', 'zag']);
export const RESULTS = Object.freeze(['PASS', 'FAIL', 'unavailable']);
export const FAILURE_CLASSIFICATIONS = Object.freeze([
  'product',
  'fixture',
  'infrastructure',
  'security',
  'packaging',
  'measurement',
  'policy',
]);
export const FIXTURE_OPERATIONS = Object.freeze([
  'open',
  'close',
  'press',
  'point',
  'setDirection',
  'setMotionPreference',
  'updateContent',
  'destroy',
]);

export function isPlainRecord(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function rejectUnknownKeys(value, allowedKeys, path, errors) {
  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) errors.push(`${path}.${key} is an unsupported key`);
  }
}

export function requireExactInteger(value, expected, path, errors) {
  if (value !== expected) errors.push(`${path} must equal ${expected}`);
}

export function requirePositiveInteger(value, path, errors) {
  if (!Number.isSafeInteger(value) || value < 1) errors.push(`${path} must be a positive integer`);
}

export function requireMember(value, members, path, errors) {
  if (!members.includes(value)) errors.push(`${path} is invalid`);
}

export function requirePattern(value, pattern, path, errors) {
  if (typeof value !== 'string' || !pattern.test(value)) errors.push(`${path} is invalid`);
}

export function requireUniqueStrings(value, path, errors) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || item.length === 0)) {
    errors.push(`${path} must be an array of non-empty strings`);
  } else if (new Set(value).size !== value.length) {
    errors.push(`${path} must be unique`);
  }
}

const EXACT_COUPLED_IDENTITIES = new Set([
  'incumbent',
  'lyra',
  '@lyra-ds/react',
  'radix',
  '@radix-ui/react-dialog',
  'base-ui',
  'base ui',
  '@base-ui-components/react',
  'zag',
  '@zag-js/dialog',
  'vendor',
]);
const IDENTIFIER_COUPLING_TOKENS = new Set(['incumbent', 'lyra', 'radix', 'zag', 'vendor']);

function isExactCoupledIdentity(value) {
  return EXACT_COUPLED_IDENTITIES.has(value.trim().toLowerCase());
}

function hasCoupledIdentifierToken(value) {
  const tokens = value.toLowerCase().split(/[^a-z0-9]+/u).filter(Boolean);
  return tokens.some((token, index) =>
    IDENTIFIER_COUPLING_TOKENS.has(token) ||
    [tokens[index], tokens[index + 1]].join('-') === 'base-ui',
  );
}

function requireCandidateNeutralIdentifier(value, path, errors) {
  if (typeof value === 'string' && (isExactCoupledIdentity(value) || hasCoupledIdentifierToken(value))) {
    errors.push(`${path} contains candidate or vendor coupling`);
  }
}

function requireCandidateNeutralIdentifierArray(value, path, errors) {
  if (!Array.isArray(value)) return;
  value.forEach((entry, index) => requireCandidateNeutralIdentifier(entry, `${path}[${index}]`, errors));
}

function rejectCandidateVendorCoupling(value, path, errors) {
  if (typeof value === 'string') {
    if (isExactCoupledIdentity(value)) {
      errors.push(`${path} contains candidate or vendor coupling`);
    }
    return;
  }
  if (value === null || typeof value === 'boolean' || typeof value === 'number') return;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      rejectCandidateVendorCoupling(entry, `${path}[${index}]`, errors);
    });
    return;
  }
  if (!isPlainRecord(value)) {
    errors.push(`${path} must contain only JSON values`);
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase().replaceAll(/[-_]/gu, '');
    if (normalizedKey.includes('candidate') || normalizedKey.includes('vendor')) {
      errors.push(`${path}.${key} contains candidate or vendor coupling`);
    }
    rejectCandidateVendorCoupling(entry, `${path}.${key}`, errors);
  }
}

function validateInitial(value, errors) {
  if (!isPlainRecord(value)) {
    errors.push('scenario.initial must be a plain record');
    return;
  }
  rejectUnknownKeys(value, ['markup', 'state'], 'scenario.initial', errors);
  if (typeof value.markup !== 'string') errors.push('scenario.initial.markup must be a string');
  if (!isPlainRecord(value.state)) errors.push('scenario.initial.state must be a plain record');
}

function validateOperations(value, errors) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push('scenario.operations must be a non-empty array');
    return;
  }
  value.forEach((operation, index) => {
    const path = `scenario.operations[${index}]`;
    if (!isPlainRecord(operation)) {
      errors.push(`${path} must be a plain record`);
      return;
    }
    rejectUnknownKeys(operation, ['operation', 'target'], path, errors);
    requireMember(operation.operation, FIXTURE_OPERATIONS, `${path}.operation`, errors);
    requireCandidateNeutralIdentifier(operation.operation, `${path}.operation`, errors);
    if (typeof operation.target !== 'string' || operation.target.length === 0) {
      errors.push(`${path}.target must be a non-empty string`);
    }
    requireCandidateNeutralIdentifier(operation.target, `${path}.target`, errors);
  });
}

function validateExpected(value, errors) {
  if (!isPlainRecord(value)) {
    errors.push('scenario.expected must be a plain record');
    return;
  }
  rejectUnknownKeys(
    value,
    ['roles', 'relationships', 'states', 'focus', 'events', 'announcements', 'cleanup'],
    'scenario.expected',
    errors,
  );
  for (const key of ['roles', 'relationships', 'states', 'events', 'announcements']) {
    if (!Array.isArray(value[key])) errors.push(`scenario.expected.${key} must be an array`);
  }
  requireUniqueStrings(value.cleanup, 'scenario.expected.cleanup', errors);
  validateRoles(value.roles, errors);
  validateRelationships(value.relationships, errors);
  validateStates(value.states, errors);
  validateEvents(value.events, errors);
  validateAnnouncements(value.announcements, errors);
  if (!isPlainRecord(value.focus)) {
    errors.push('scenario.expected.focus must be a plain record');
  } else {
    rejectUnknownKeys(value.focus, ['target'], 'scenario.expected.focus', errors);
    if (typeof value.focus.target !== 'string' || value.focus.target.length === 0) {
      errors.push('scenario.expected.focus.target must be a non-empty string');
    }
    requireCandidateNeutralIdentifier(value.focus.target, 'scenario.expected.focus.target', errors);
  }
}

function validateRelationships(value, errors) {
  validateNamedRecords(value, 'scenario.expected.relationships', ['source', 'name', 'target'], ['source', 'name', 'target'], errors);
}

function validateEvents(value, errors) {
  validateNamedRecords(value, 'scenario.expected.events', ['target', 'type'], ['target', 'type'], errors);
}

function validateAnnouncements(value, errors) {
  validateNamedRecords(value, 'scenario.expected.announcements', ['message'], [], errors);
}

function validateNamedRecords(value, path, keys, identifierKeys, errors) {
  if (!Array.isArray(value)) return;
  value.forEach((entry, index) => {
    const entryPath = `${path}[${index}]`;
    if (!isPlainRecord(entry)) return errors.push(`${entryPath} must be a plain record`);
    rejectUnknownKeys(entry, keys, entryPath, errors);
    for (const key of keys) {
      if (typeof entry[key] !== 'string' || entry[key].length === 0) {
        errors.push(`${entryPath}.${key} must be a non-empty string`);
      }
      if (identifierKeys.includes(key)) {
        requireCandidateNeutralIdentifier(entry[key], `${entryPath}.${key}`, errors);
      }
    }
  });
}

function validateRoles(value, errors) {
  if (!Array.isArray(value)) return;
  value.forEach((role, index) => {
    const path = `scenario.expected.roles[${index}]`;
    if (!isPlainRecord(role)) return errors.push(`${path} must be a plain record`);
    rejectUnknownKeys(role, ['role', 'name'], path, errors);
    for (const key of ['role', 'name']) {
      if (typeof role[key] !== 'string' || role[key].length === 0) {
        errors.push(`${path}.${key} must be a non-empty string`);
      }
    }
    requireCandidateNeutralIdentifier(role.role, `${path}.role`, errors);
  });
}

function validateStates(value, errors) {
  if (!Array.isArray(value)) return;
  value.forEach((state, index) => {
    const path = `scenario.expected.states[${index}]`;
    if (!isPlainRecord(state)) return errors.push(`${path} must be a plain record`);
    rejectUnknownKeys(state, ['target', 'name', 'value'], path, errors);
    for (const key of ['target', 'name']) {
      if (typeof state[key] !== 'string' || state[key].length === 0) {
        errors.push(`${path}.${key} must be a non-empty string`);
      }
      requireCandidateNeutralIdentifier(state[key], `${path}.${key}`, errors);
    }
    if (!Object.hasOwn(state, 'value')) errors.push(`${path}.value is required`);
  });
}

export function validateScenario(value) {
  const errors = [];
  if (!isPlainRecord(value)) return ['scenario must be a plain record'];
  rejectUnknownKeys(
    value,
    [
      'schemaVersion',
      'revision',
      'contractId',
      'scenarioId',
      'components',
      'initial',
      'operations',
      'expected',
      'requiredCells',
      'capture',
    ],
    'scenario',
    errors,
  );
  requireExactInteger(value.schemaVersion, 1, 'scenario.schemaVersion', errors);
  requirePositiveInteger(value.revision, 'scenario.revision', errors);
  requireMember(value.contractId, CONTRACT_IDS, 'scenario.contractId', errors);
  requirePattern(
    value.scenarioId,
    /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9-]+)+\.v\d+$/u,
    'scenario.scenarioId',
    errors,
  );
  requireCandidateNeutralIdentifier(value.scenarioId, 'scenario.scenarioId', errors);
  requireUniqueStrings(value.components, 'scenario.components', errors);
  requireCandidateNeutralIdentifierArray(value.components, 'scenario.components', errors);
  validateInitial(value.initial, errors);
  validateOperations(value.operations, errors);
  validateExpected(value.expected, errors);
  requireUniqueStrings(value.requiredCells, 'scenario.requiredCells', errors);
  requireCandidateNeutralIdentifierArray(value.requiredCells, 'scenario.requiredCells', errors);
  requireUniqueStrings(value.capture, 'scenario.capture', errors);
  requireCandidateNeutralIdentifierArray(value.capture, 'scenario.capture', errors);
  rejectCandidateVendorCoupling(value, 'scenario', errors);
  return errors;
}
