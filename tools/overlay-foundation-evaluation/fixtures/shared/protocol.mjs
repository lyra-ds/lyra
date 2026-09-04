import { BEHAVIORAL_WAVE_CELLS as MODAL_WAVE_CELLS } from '../../contracts/cells.mjs';
import {
  isPlainRecord,
  rejectUnknownKeys,
  requireExactInteger,
  validateScenario,
} from '../../contracts/protocol.mjs';

const REACT_VERSIONS = Object.freeze(['18.3.1', '19.2.8']);
const DIRECTIONS = Object.freeze(['ltr', 'rtl']);
const COLOR_SCHEMES = Object.freeze(['light', 'dark']);
const RESOURCE_PURPOSES = Object.freeze([
  'dismiss',
  'focus-loop',
  'focus-restore',
  'pointer',
  'other',
]);
const LISTENER_EFFECTS = Object.freeze(['default-prevented', 'focus-moved', 'modal-closed']);
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
  'trace',
  'diagnostics',
]);
const SNAPSHOT_KEYS = Object.freeze([
  'direction',
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

export function createFixtureProtocol({
  validateExecutionScenario,
  label = 'modal',
  allowTiming = false,
  requireResources = false,
} = {}) {
  function validateRequest(value) {
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
      if (
        requireResources &&
        /@(?:radix-ui|base-ui-components|zag-js)\/|data-(?:radix|base-ui|zag)|\b(?:radix|base[ -]?ui|zag|incumbent|vendor)\s+(?:popover|popup|menu|tooltip|overlay)\b/iu.test(
          value,
        )
      )
        return true;
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

  function validateListenerUses(uses, path, errors) {
    if (!Array.isArray(uses)) {
      errors.push(`${path} must be an array`);
      return;
    }
    uses.forEach((use, index) => {
      const usePath = `${path}[${index}]`;
      if (!isPlainRecord(use)) {
        errors.push(`${usePath} must be a plain record`);
        return;
      }
      rejectUnknownKeys(
        use,
        ['effects', 'operation', 'phase', 'purpose', 'target', 'type'],
        usePath,
        errors,
      );
      if (!Array.isArray(use.effects) || use.effects.length === 0) {
        errors.push(`${usePath}.effects must be a non-empty array`);
      } else {
        for (const effect of use.effects) {
          if (!LISTENER_EFFECTS.includes(effect)) {
            errors.push(`${usePath}.effects contains an invalid effect`);
          }
        }
      }
      if (!RESOURCE_PURPOSES.includes(use.purpose) || use.purpose === 'other') {
        errors.push(`${usePath}.purpose must be a demonstrated listener purpose`);
      }
      for (const key of ['operation', 'phase', 'target', 'type']) {
        if (typeof use[key] !== 'string' || use[key].length === 0) {
          errors.push(`${usePath}.${key} must be a non-empty string`);
        }
      }
    });
  }

  function validateSnapshot(snapshot, path, errors) {
    if (!isPlainRecord(snapshot)) {
      errors.push(`${path} must be a plain record`);
      return;
    }
    rejectUnknownKeys(snapshot, SNAPSHOT_KEYS, path, errors);
    if (!DIRECTIONS.includes(snapshot.direction)) {
      errors.push(`${path}.direction must equal ltr or rtl`);
    }
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
    if (requireResources) {
      if (!isPlainRecord(snapshot.resources)) errors.push(`${path}.resources is required`);
      else {
        for (const [entriesKey, lifecycleKey, countKey] of [
          ['listenerEntries', 'listenerLifecycles', 'listeners'],
          ['timerEntries', 'timerLifecycles', 'timers'],
          ['claims', 'claimLifecycles', undefined],
        ]) {
          const entries = snapshot.resources[entriesKey],
            lifecycles = snapshot.resources[lifecycleKey];
          if (!Array.isArray(entries) || !Array.isArray(lifecycles)) continue;
          if (countKey && snapshot.resources[countKey] !== entries.length)
            errors.push(`${path}.resources.${countKey} must match active entries`);
          for (const entry of entries) {
            if (!isPlainRecord(entry)) continue;
            const lifecycle = lifecycles.find((lifecycle) => lifecycle?.id === entry.id);
            if (
              !lifecycle ||
              lifecycle.releaseCount !== 0 ||
              Object.keys(entry).some(
                (key) => JSON.stringify(entry[key]) !== JSON.stringify(lifecycle[key]),
              )
            )
              errors.push(
                `${path}.resources.${entriesKey} must match an unreleased lifecycle identity`,
              );
          }
          for (const lifecycle of lifecycles) {
            if (!isPlainRecord(lifecycle)) continue;
            if (![0, 1].includes(lifecycle.releaseCount))
              errors.push(`${path}.resources.${lifecycleKey}.releaseCount must equal zero or one`);
            if (
              lifecycle.releaseCount === 0 &&
              !entries.some((entry) => entry?.id === lifecycle.id)
            )
              errors.push(`${path}.resources.${lifecycleKey} unreleased identity must be active`);
            for (const key of ['releasedOperation', 'releasedPhase']) {
              if (
                lifecycle.releaseCount === 1 &&
                (typeof lifecycle[key] !== 'string' || !lifecycle[key])
              )
                errors.push(`${path}.resources.${lifecycleKey}.${key} is required after release`);
              if (lifecycle.releaseCount === 0 && lifecycle[key] !== undefined)
                errors.push(`${path}.resources.${lifecycleKey}.${key} requires release`);
            }
          }
        }
        for (const key of [
          'claims',
          'claimLifecycles',
          'listenerEntries',
          'listenerLifecycles',
          'timerEntries',
          'timerLifecycles',
        ]) {
          if (!Array.isArray(snapshot.resources[key]))
            errors.push(`${path}.resources.${key} must be an array`);
        }
        if (Array.isArray(snapshot.resources.claimLifecycles)) {
          const ids = new Set();
          snapshot.resources.claimLifecycles.forEach((entry, index) => {
            const claimPath = `${path}.resources.claimLifecycles[${index}]`;
            if (!isPlainRecord(entry)) {
              errors.push(`${claimPath} must be a plain record`);
              return;
            }
            rejectUnknownKeys(
              entry,
              [
                'id',
                'kind',
                'owner',
                'acquiredOperation',
                'acquiredPhase',
                'releaseCount',
                'releasedOperation',
                'releasedPhase',
              ],
              claimPath,
              errors,
            );
            if (!Number.isSafeInteger(entry.id) || entry.id < 1 || ids.has(entry.id))
              errors.push(`${claimPath}.id must be a unique positive safe integer`);
            ids.add(entry.id);
            for (const key of ['kind', 'owner', 'acquiredOperation', 'acquiredPhase'])
              if (typeof entry[key] !== 'string' || !entry[key])
                errors.push(`${claimPath}.${key} must be a non-empty string`);
            if (![0, 1].includes(entry.releaseCount))
              errors.push(`${claimPath}.releaseCount must equal zero or one`);
            if (entry.releaseCount === 1)
              for (const key of ['releasedOperation', 'releasedPhase'])
                if (typeof entry[key] !== 'string' || !entry[key])
                  errors.push(`${claimPath}.${key} must be a non-empty string`);
          });
        }
      }
    }
    if (snapshot.resources !== undefined) {
      if (!isPlainRecord(snapshot.resources)) {
        errors.push(`${path}.resources must be a plain record`);
      } else {
        rejectUnknownKeys(
          snapshot.resources,
          [
            'claims',
            ...(requireResources ? ['claimLifecycles'] : []),
            'listenerEntries',
            'listenerLifecycles',
            'listeners',
            'timerEntries',
            'timerLifecycles',
            'timers',
          ],
          `${path}.resources`,
          errors,
        );
        for (const key of ['listeners', 'timers']) {
          if (!Number.isSafeInteger(snapshot.resources[key]) || snapshot.resources[key] < 0) {
            errors.push(`${path}.resources.${key} must be a non-negative safe integer`);
          }
        }
        if (snapshot.resources.claims !== undefined) {
          if (!Array.isArray(snapshot.resources.claims)) {
            errors.push(`${path}.resources.claims must be an array`);
          } else {
            const ids = new Set();
            snapshot.resources.claims.forEach((claim, index) => {
              const claimPath = `${path}.resources.claims[${index}]`;
              if (!isPlainRecord(claim)) {
                errors.push(`${claimPath} must be a plain record`);
                return;
              }
              rejectUnknownKeys(claim, ['id', 'kind', 'owner'], claimPath, errors);
              if (!Number.isSafeInteger(claim.id) || claim.id < 1) {
                errors.push(`${claimPath}.id must be a positive safe integer`);
              } else if (ids.has(claim.id)) {
                errors.push(`${claimPath}.id must be unique`);
              }
              ids.add(claim.id);
              for (const key of ['kind', 'owner']) {
                if (typeof claim[key] !== 'string' || claim[key].length === 0) {
                  errors.push(`${claimPath}.${key} must be a non-empty string`);
                }
              }
            });
          }
        }
        if (snapshot.resources.listenerEntries !== undefined) {
          if (!Array.isArray(snapshot.resources.listenerEntries)) {
            errors.push(`${path}.resources.listenerEntries must be an array`);
          } else {
            const ids = new Set();
            snapshot.resources.listenerEntries.forEach((entry, index) => {
              const entryPath = `${path}.resources.listenerEntries[${index}]`;
              if (!isPlainRecord(entry)) {
                errors.push(`${entryPath} must be a plain record`);
                return;
              }
              rejectUnknownKeys(
                entry,
                [
                  'acquiredOperation',
                  'acquiredPhase',
                  'boundary',
                  'id',
                  'owner',
                  'purpose',
                  'target',
                  'type',
                  'uses',
                ],
                entryPath,
                errors,
              );
              if (!Number.isSafeInteger(entry.id) || entry.id < 1) {
                errors.push(`${entryPath}.id must be a positive safe integer`);
              } else if (ids.has(entry.id)) {
                errors.push(`${entryPath}.id must be unique`);
              }
              ids.add(entry.id);
              if (!RESOURCE_PURPOSES.includes(entry.purpose)) {
                errors.push(`${entryPath}.purpose is invalid`);
              }
              for (const key of [
                'acquiredOperation',
                'acquiredPhase',
                'boundary',
                'owner',
                'target',
                'type',
              ]) {
                if (typeof entry[key] !== 'string' || entry[key].length === 0) {
                  errors.push(`${entryPath}.${key} must be a non-empty string`);
                }
              }
              validateListenerUses(entry.uses, `${entryPath}.uses`, errors);
            });
          }
        }
        if (snapshot.resources.listenerLifecycles !== undefined) {
          if (!Array.isArray(snapshot.resources.listenerLifecycles)) {
            errors.push(`${path}.resources.listenerLifecycles must be an array`);
          } else {
            const ids = new Set();
            snapshot.resources.listenerLifecycles.forEach((entry, index) => {
              const entryPath = `${path}.resources.listenerLifecycles[${index}]`;
              if (!isPlainRecord(entry)) {
                errors.push(`${entryPath} must be a plain record`);
                return;
              }
              rejectUnknownKeys(
                entry,
                [
                  'acquiredPhase',
                  'acquiredOperation',
                  'boundary',
                  'id',
                  'owner',
                  'purpose',
                  'releaseCount',
                  'releasedOperation',
                  'releasedPhase',
                  'target',
                  'type',
                  'uses',
                ],
                entryPath,
                errors,
              );
              if (!Number.isSafeInteger(entry.id) || entry.id < 1) {
                errors.push(`${entryPath}.id must be a positive safe integer`);
              } else if (ids.has(entry.id)) {
                errors.push(`${entryPath}.id must be unique`);
              }
              ids.add(entry.id);
              if (!RESOURCE_PURPOSES.includes(entry.purpose)) {
                errors.push(`${entryPath}.purpose is invalid`);
              }
              for (const key of [
                'acquiredOperation',
                'acquiredPhase',
                'boundary',
                'owner',
                'target',
                'type',
              ]) {
                if (typeof entry[key] !== 'string' || entry[key].length === 0) {
                  errors.push(`${entryPath}.${key} must be a non-empty string`);
                }
              }
              validateListenerUses(entry.uses, `${entryPath}.uses`, errors);
              if (!Number.isSafeInteger(entry.releaseCount) || entry.releaseCount < 0) {
                errors.push(`${entryPath}.releaseCount must be a non-negative safe integer`);
              }
              if (
                entry.releasedOperation !== undefined &&
                (typeof entry.releasedOperation !== 'string' ||
                  entry.releasedOperation.length === 0)
              ) {
                errors.push(
                  `${entryPath}.releasedOperation must be a non-empty string when present`,
                );
              }
              if (
                entry.releasedPhase !== undefined &&
                (typeof entry.releasedPhase !== 'string' || entry.releasedPhase.length === 0)
              ) {
                errors.push(`${entryPath}.releasedPhase must be a non-empty string when present`);
              }
            });
          }
        }
        if (snapshot.resources.timerEntries !== undefined) {
          if (!Array.isArray(snapshot.resources.timerEntries)) {
            errors.push(`${path}.resources.timerEntries must be an array`);
          } else {
            const ids = new Set();
            snapshot.resources.timerEntries.forEach((entry, index) => {
              const entryPath = `${path}.resources.timerEntries[${index}]`;
              if (!isPlainRecord(entry)) {
                errors.push(`${entryPath} must be a plain record`);
                return;
              }
              rejectUnknownKeys(
                entry,
                ['acquiredOperation', 'acquiredPhase', 'id', 'kind', 'owner', 'purpose', 'target'],
                entryPath,
                errors,
              );
              if (!Number.isSafeInteger(entry.id) || entry.id < 1) {
                errors.push(`${entryPath}.id must be a positive safe integer`);
              } else if (ids.has(entry.id)) {
                errors.push(`${entryPath}.id must be unique`);
              }
              ids.add(entry.id);
              if (!['interval', 'timeout'].includes(entry.kind)) {
                errors.push(`${entryPath}.kind is invalid`);
              }
              if (!RESOURCE_PURPOSES.includes(entry.purpose)) {
                errors.push(`${entryPath}.purpose is invalid`);
              }
              for (const key of ['acquiredOperation', 'acquiredPhase', 'owner', 'target']) {
                if (typeof entry[key] !== 'string' || entry[key].length === 0) {
                  errors.push(`${entryPath}.${key} must be a non-empty string`);
                }
              }
            });
          }
        }
        if (snapshot.resources.timerLifecycles !== undefined) {
          if (!Array.isArray(snapshot.resources.timerLifecycles)) {
            errors.push(`${path}.resources.timerLifecycles must be an array`);
          } else {
            const ids = new Set();
            snapshot.resources.timerLifecycles.forEach((entry, index) => {
              const entryPath = `${path}.resources.timerLifecycles[${index}]`;
              if (!isPlainRecord(entry)) {
                errors.push(`${entryPath} must be a plain record`);
                return;
              }
              rejectUnknownKeys(
                entry,
                [
                  'acquiredOperation',
                  'acquiredPhase',
                  'id',
                  'kind',
                  'owner',
                  'purpose',
                  'releaseCount',
                  'releasedOperation',
                  'releasedPhase',
                  'target',
                ],
                entryPath,
                errors,
              );
              if (!Number.isSafeInteger(entry.id) || entry.id < 1) {
                errors.push(`${entryPath}.id must be a positive safe integer`);
              } else if (ids.has(entry.id)) {
                errors.push(`${entryPath}.id must be unique`);
              }
              ids.add(entry.id);
              if (!['interval', 'timeout'].includes(entry.kind)) {
                errors.push(`${entryPath}.kind is invalid`);
              }
              if (!RESOURCE_PURPOSES.includes(entry.purpose)) {
                errors.push(`${entryPath}.purpose is invalid`);
              }
              for (const key of ['acquiredOperation', 'acquiredPhase', 'owner', 'target']) {
                if (typeof entry[key] !== 'string' || entry[key].length === 0) {
                  errors.push(`${entryPath}.${key} must be a non-empty string`);
                }
              }
              if (!Number.isSafeInteger(entry.releaseCount) || entry.releaseCount < 0) {
                errors.push(`${entryPath}.releaseCount must be a non-negative safe integer`);
              }
              if (
                entry.releasedOperation !== undefined &&
                (typeof entry.releasedOperation !== 'string' ||
                  entry.releasedOperation.length === 0)
              ) {
                errors.push(
                  `${entryPath}.releasedOperation must be a non-empty string when present`,
                );
              }
              if (
                entry.releasedPhase !== undefined &&
                (typeof entry.releasedPhase !== 'string' || entry.releasedPhase.length === 0)
              ) {
                errors.push(`${entryPath}.releasedPhase must be a non-empty string when present`);
              }
            });
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
          rejectUnknownKeys(
            entry.operation,
            allowTiming && entry.operation.operation === 'advanceTime'
              ? ['operation', 'target', 'milliseconds']
              : ['operation', 'target'],
            `${path}.operation`,
            errors,
          );
          for (const key of ['operation', 'target']) {
            if (typeof entry.operation[key] !== 'string' || entry.operation[key].length === 0) {
              errors.push(`${path}.operation.${key} must be a non-empty string`);
            }
          }
        }
      } else if (entry.operationIndex !== undefined || entry.operation !== undefined) {
        errors.push(`${path} may identify an operation only after an operation`);
      }
      if (
        allowTiming &&
        entry.operation?.operation === 'advanceTime' &&
        (!Number.isSafeInteger(entry.operation.milliseconds) || entry.operation.milliseconds < 0)
      )
        errors.push(`${path}.operation.milliseconds must be a non-negative safe integer`);
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

  function validateObservation(value) {
    const errors = [];
    if (!isPlainRecord(value)) return ['modal observation must be a plain record'];
    if (requireResources && !isJsonValue(value))
      return [`${label} observation must contain JSON values`];
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
      errors.push(
        'modal observation normative fields must not contain candidate or vendor coupling',
      );
    }
    if (!isJsonValue(value.diagnostics))
      errors.push('modal observation.diagnostics must contain JSON values');
    validateTrace(value.trace, errors);
    validateExecutionDiagnostics(value.diagnostics, value.trace, errors);
    if (requireResources && isPlainRecord(value.diagnostics) && Array.isArray(value.trace)) {
      const cleanupObserved = value.trace.some((entry) => entry?.phase === 'after-cleanup');
      if (
        value.diagnostics.cleanupObserved !== undefined &&
        value.diagnostics.cleanupObserved !== cleanupObserved
      )
        errors.push(`${label} observation cleanup diagnostics must match its lifecycle trace`);
    }
    if (containsVendorFact(value.trace)) {
      errors.push('modal observation trace must not contain candidate or vendor coupling');
    }
    return label === 'modal'
      ? errors
      : errors.map((error) => error.replaceAll('modal observation', `${label} observation`));
  }

  return Object.freeze({ validateRequest, validateObservation, validateSnapshot });
}
