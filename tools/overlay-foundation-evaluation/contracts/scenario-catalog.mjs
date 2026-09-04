import { isDeepStrictEqual } from 'node:util';
import { BEHAVIORAL_WAVE_CELLS } from './cells.mjs';
import { validateScenario } from './protocol.mjs';

// Authoring helper: expected values are literal catalog inputs, never observations.
export function freezeJson(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(freezeJson);
  return Object.freeze(value);
}

export function defineScenario(
  contract,
  {
    id,
    components,
    cells,
    initial = {},
    operations,
    checks,
    focus,
    roles = [],
    relationships = [],
    events = [],
    announcements = [],
    cleanup = [],
  },
) {
  const probes = [];
  const expected = {
    roles: [],
    relationships: [],
    states: [],
    focus: { target: focus[1] },
    events: [],
    announcements: [],
    cleanup: [],
  };
  function probe(category, index, target, property, relatedTarget) {
    const phase =
      index === 'server'
        ? 'server-render'
        : index === 'cleanup'
          ? 'after-cleanup'
          : 'after-operation';
    probes.push({
      id: `${category}-${probes.filter((p) => p.category === category).length + 1}`,
      category,
      phase,
      ...(phase === 'after-operation' ? { operationIndex: index } : {}),
      target,
      property,
      ...(relatedTarget ? { relatedTarget } : {}),
    });
  }
  for (const [index, target, name, value] of checks) {
    probe('states', index, target, name);
    expected.states.push({ target, name, value });
  }
  probe('focus', focus[0], 'document-focus', 'current');
  for (const [index, target, role, name] of roles) {
    probe('roles', index, target, 'accessible-role');
    expected.roles.push({ role, name });
  }
  for (const [index, source, name, target] of relationships) {
    probe('relationships', index, source, name, target);
    expected.relationships.push({ source, name, target });
  }
  for (const [index, target, type] of events) {
    probe('events', index, target, type);
    expected.events.push({ target, type });
  }
  for (const [index, target, message] of announcements) {
    probe('announcements', index, target, 'text');
    expected.announcements.push({ message });
  }
  for (const [index, target, property] of cleanup) {
    probe('cleanup', index, target, property);
    expected.cleanup.push(`${target}-${property}`);
  }
  return freezeJson({
    schemaVersion: 1,
    revision: 1,
    contractId: `OF-${contract.toUpperCase()}`,
    scenarioId: `of-${contract}.${id}.v1`,
    components,
    initial: {
      markup: '<button data-fixture-control="trigger">Workspace</button>',
      state: initial,
    },
    operations,
    probes,
    expected,
    requiredCells: cells,
    capture: ['dom', 'accessibility-tree', 'events', 'focus', 'resources'],
  });
}

export function scenariosForCell(scenarios, cellId) {
  return Object.freeze(scenarios.filter((s) => s.requiredCells.includes(cellId)));
}

export function validateCatalog(scenarios, reference, contractId) {
  if (!Array.isArray(scenarios)) return [`${contractId} scenarios must be an array`];
  const errors = [];
  const ids = new Set();
  for (const [index, scenario] of scenarios.entries()) {
    const path = `${contractId} scenarios[${index}]`;
    errors.push(...validateScenario(scenario).map((error) => `${path}: ${error}`));
    if (scenario?.contractId !== contractId)
      errors.push(`${path}.contractId must equal ${contractId}`);
    if (ids.has(scenario?.scenarioId)) errors.push(`${path}.scenarioId is duplicate`);
    ids.add(scenario?.scenarioId);
    const original = reference.find((s) => s.scenarioId === scenario?.scenarioId);
    if (!original || !isDeepStrictEqual(scenario, original))
      errors.push(`${path} must match the immutable ${contractId} v1 record`);
  }
  if (scenarios.length !== reference.length || reference.some((s) => !ids.has(s.scenarioId)))
    errors.push(`${contractId} scenario ID set must match the immutable v1 inventory`);
  const cells = new Set(
    scenarios.flatMap((s) => (Array.isArray(s?.requiredCells) ? s.requiredCells : [])),
  );
  if (
    cells.size !== BEHAVIORAL_WAVE_CELLS.length ||
    BEHAVIORAL_WAVE_CELLS.some((cell) => !cells.has(cell))
  )
    errors.push(`${contractId} cell set must equal the fifteen behavioral wave cells`);
  return errors;
}
