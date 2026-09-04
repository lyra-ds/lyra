import { isPlainRecord } from '../../contracts/protocol.mjs';
import { installResourceTracker } from '../shared/resource-tracker.mjs';
import {
  validateWave2FixtureRequest,
  validateWave2Observation,
  validateWave2Snapshot,
} from './protocol.mjs';

export function installWave2ResourceTracker(scope = globalThis) {
  return installResourceTracker(scope, {
    fixtureRootMarker: 'data-overlay-fixture-root',
    layerBoundarySelector: '[data-overlay-panel]',
    targetNameAttributes: ['data-overlay-id'],
    connectedLayerSelector: '[data-overlay-panel]',
    globalTrackerKey: '__LYRA_OVERLAY_RESOURCE_TRACKER__',
  });
}

const CATEGORIES = ['roles', 'relationships', 'states', 'events', 'announcements', 'cleanup'];
const sameLiteral = (a, b) => {
  if (a === b) return true;
  if (Array.isArray(a))
    return Array.isArray(b) && a.length === b.length && a.every((v, i) => sameLiteral(v, b[i]));
  return (
    isPlainRecord(a) &&
    isPlainRecord(b) &&
    Object.keys(a).length === Object.keys(b).length &&
    Object.keys(a).every((key) => Object.hasOwn(b, key) && sameLiteral(a[key], b[key]))
  );
};
function requireValid(errors) {
  if (errors.length) throw new Error(`Wave2 observation is invalid: ${errors.join('; ')}`);
}
function resourceSnapshot(tracker) {
  const { persistentListeners: _persistent, ...resources } = tracker.snapshot();
  return resources;
}
function probeFact(probe, snapshot, cleanup, document, fixture) {
  const matches = [...(document?.querySelectorAll?.('[data-overlay-id]') ?? [])].filter(
    (element) =>
      element.isConnected !== false && element.getAttribute('data-overlay-id') === probe.target,
  );
  const element = matches.length === 1 ? matches[0] : undefined;
  const text = element?.textContent?.trim();
  switch (probe.category) {
    case 'states':
      return structuredClone(
        snapshot.states.find(
          (record) => record.target === probe.target && record.name === probe.property,
        ) ?? { target: probe.target, name: probe.property, value: null },
      );
    case 'focus':
      return structuredClone(snapshot.focus);
    case 'roles': {
      // Accessible names and implicit roles require real accessibility computation.
      // The mounted fixture supplies a measurement for this exact neutral target.
      const measurement = fixture.measureRole?.(probe.target);
      if (measurement === undefined) return { role: 'unobserved', name: 'unobserved' };
      if (
        !isPlainRecord(measurement) ||
        Object.keys(measurement).some((key) => !['role', 'name'].includes(key)) ||
        typeof measurement.role !== 'string' ||
        typeof measurement.name !== 'string'
      )
        throw new Error('target-bound role measurement must contain only role and name strings');
      // The shared closed observation schema requires nonempty role/name strings.
      // Its existing failure sentinel preserves absent names without inventing one.
      return { role: measurement.role || 'unobserved', name: measurement.name || 'unobserved' };
    }
    case 'relationships':
      return structuredClone(
        snapshot.relationships.find(
          (record) => record.source === probe.target && record.name === probe.property,
        ) ?? { source: probe.target, name: probe.property, target: 'unobserved' },
      );
    case 'events':
      return structuredClone(
        snapshot.events.find(
          (record) => record.target === probe.target && record.type === probe.property,
        ) ?? { target: probe.target, type: 'unobserved' },
      );
    case 'announcements':
      return structuredClone(
        snapshot.announcements.find((record) => text && record.message === text) ?? {
          message: 'unobserved',
        },
      );
    case 'cleanup': {
      const fact = `${probe.target}-${probe.property}`;
      return cleanup.includes(fact) ? fact : `${probe.target}-unobserved`;
    }
    default:
      throw new Error('unsupported probe category');
  }
}

// The mounted fixture owns behavior and factual measurements. This coordinator owns
// execution order, observation phases, and callback lifetime, never scenario answers.
export function createWave2Runtime(request) {
  const errors = validateWave2FixtureRequest(request);
  if (errors.length) throw new Error(`Wave2 fixture request is invalid: ${errors.join('; ')}`);
  const execution = structuredClone(request);
  let fixture, tracker, document;
  const ownerEpochs = new Map();
  let started = false,
    destroyed = false,
    ending = false,
    busy = false,
    epoch = 0,
    operationIndex = 0;
  let clock = 0;
  let lastDiagnostics = {},
    finalObservation;
  const trace = [],
    actions = [],
    committedEvents = [];
  const read = () => {
    const raw = fixture.observe();
    if (!isPlainRecord(raw)) throw new Error('mounted fixture must return a factual observation');
    if (Object.hasOwn(raw, 'probes') || Object.hasOwn(raw, 'resources'))
      throw new Error('fixture observation cannot supply coordinator-owned probes or resources');
    const { diagnostics = {}, cleanup = [], ...fields } = raw;
    const snapshot = {
      ...structuredClone(fields),
      events: [...(fields.events ?? []), ...structuredClone(committedEvents)],
      resources: resourceSnapshot(tracker),
    };
    requireValid(validateWave2Snapshot(snapshot));
    // Run the full boundary even when no new operation is captured.
    const candidate = {
      ...Object.fromEntries(
        CATEGORIES.filter((key) => key !== 'cleanup').map((key) => [key, snapshot[key]]),
      ),
      focus: snapshot.focus,
      cleanup,
      trace: [{ phase: 'before-operations', snapshot }],
      diagnostics,
    };
    requireValid(validateWave2Observation(candidate));
    lastDiagnostics = structuredClone(diagnostics);
    return { snapshot, cleanup };
  };
  const capture = (phase, index, operation) => {
    const { snapshot, cleanup } = read();
    const probes = execution.scenario.probes
      .filter(
        (probe) =>
          probe.phase === phase && (phase !== 'after-operation' || probe.operationIndex === index),
      )
      .map((probe) => ({
        id: probe.id,
        category: probe.category,
        fact: probeFact(probe, snapshot, cleanup, document, fixture),
      }));
    if (probes.length) snapshot.probes = probes;
    trace.push({
      phase,
      ...(phase === 'after-operation'
        ? { operationIndex: index, operation: structuredClone(operation) }
        : {}),
      snapshot,
    });
  };
  const assemble = () => {
    const facts = Object.fromEntries(CATEGORIES.map((key) => [key, []]));
    let focus = trace.at(-1)?.snapshot.focus ?? { target: 'unobserved' };
    if (execution.scenario.probes.length) {
      for (const probe of execution.scenario.probes) {
        const result = trace
          .flatMap((entry) => entry.snapshot.probes ?? [])
          .find((result) => result.id === probe.id);
        if (!result) continue;
        if (probe.category === 'focus') focus = result.fact;
        else facts[probe.category].push(result.fact);
      }
    } else {
      for (const key of CATEGORIES.filter((key) => key !== 'cleanup'))
        facts[key] = trace.at(-1)?.snapshot[key] ?? [];
    }
    const observation = {
      ...facts,
      focus,
      trace,
      diagnostics: {
        fixture: lastDiagnostics,
        executionCompleted: operationIndex === execution.scenario.operations.length,
        cleanupObserved: destroyed,
        actions,
      },
    };
    requireValid(validateWave2Observation(observation));
    return structuredClone(observation);
  };
  const context = () => {
    const generation = epoch;
    const ownerGenerations = new Map(ownerEpochs);
    const active = (owner) =>
      !ending &&
      !destroyed &&
      (owner === undefined
        ? generation === epoch
        : (ownerGenerations.get(owner) ?? 0) === (ownerEpochs.get(owner) ?? 0));
    let guardedActive;
    return Object.freeze({
      guard(callback, { owner } = {}) {
        if (typeof callback !== 'function') throw new TypeError('guard requires a callback');
        const ownerGeneration = ownerEpochs.get(owner) ?? 0;
        const callbackActive = () =>
          !ending &&
          !destroyed &&
          (owner === undefined ? active() : ownerGeneration === (ownerEpochs.get(owner) ?? 0));
        return (...args) => {
          if (!callbackActive()) return false;
          const previous = guardedActive;
          guardedActive = callbackActive;
          try {
            return callback(...args);
          } finally {
            guardedActive = previous;
          }
        };
      },
      invalidate(owner) {
        ownerEpochs.set(owner, (ownerEpochs.get(owner) ?? 0) + 1);
      },
      commit({ prevented = false, event, apply, owner }) {
        const canCommit = owner === undefined ? (guardedActive ?? active)() : active(owner);
        if (!canCommit || prevented) return false;
        if (typeof prevented !== 'boolean' || typeof apply !== 'function')
          throw new TypeError('commit requires an apply callback and boolean prevention');
        const snapshot = read().snapshot;
        const trial = {
          roles: [],
          relationships: [],
          states: [],
          focus: snapshot.focus,
          events: [event],
          announcements: [],
          cleanup: [],
          trace: [{ phase: 'before-operations', snapshot }],
          diagnostics: {},
        };
        requireValid(validateWave2Observation(trial));
        apply();
        committedEvents.push(structuredClone(event));
        return true;
      },
    });
  };
  const destroyFixture = async () => {
    if (destroyed) return { status: 'already-destroyed' };
    ending = true;
    epoch++;
    const result = await tracker.runInPhase(
      { operation: 'destroy', owner: 'fixture-cleanup', phase: 'cleanup', purpose: 'other' },
      () => fixture.destroy(),
    );
    if (!isPlainRecord(result) || !['destroyed', 'already-destroyed'].includes(result.status))
      throw new Error('Wave2 fixture cleanup result is uncertain');
    destroyed = true;
    return { status: result.status };
  };
  return Object.freeze({
    beginScenario(input) {
      if (started) throw new Error('Wave2 scenario already begun');
      if (
        !isPlainRecord(input) ||
        typeof input.fixture?.observe !== 'function' ||
        typeof input.fixture?.destroy !== 'function' ||
        typeof input.tracker?.snapshot !== 'function' ||
        typeof input.tracker?.runInPhase !== 'function'
      )
        throw new Error('mounted fixture and resource tracker are required');
      ({ fixture, tracker, document } = input);
      started = true;
      capture('before-operations');
      return assemble();
    },
    async runOperation(operation, options = {}) {
      if (!started) throw new Error('beginScenario must run first');
      if (busy) throw new Error('Wave2 operation already in progress');
      if (!sameLiteral(operation, execution.scenario.operations[operationIndex]))
        throw new Error('Wave2 operation order drift');
      if (destroyed || ending) throw new Error('Wave2 fixture is destroyed');
      const index = operationIndex;
      let receipt;
      if (operation.operation === 'advanceTime') {
        receipt = options.clockTransition;
        if (
          !isPlainRecord(receipt) ||
          Object.keys(receipt).some(
            (key) => !['operationIndex', 'before', 'after'].includes(key),
          ) ||
          receipt.operationIndex !== index ||
          receipt.before !== clock ||
          !Number.isSafeInteger(receipt.after) ||
          receipt.after - receipt.before !== operation.milliseconds
        )
          throw new Error('advanceTime requires the runner browser-clock transition');
      } else if (options.clockTransition !== undefined)
        throw new Error('clock transition is only valid for advanceTime');
      busy = true;
      try {
        let result;
        if (receipt) clock = receipt.after;
        else {
          const method = fixture.operations?.[operation.operation];
          if (typeof method !== 'function')
            throw new Error(`mounted fixture operation is unavailable: ${operation.operation}`);
          if (['close', 'destroy', 'updateContent'].includes(operation.operation)) {
            epoch++;
            ownerEpochs.set(operation.target, (ownerEpochs.get(operation.target) ?? 0) + 1);
          }
          result = await tracker.runInPhase(
            {
              operation: operation.operation,
              owner: operation.target,
              phase: 'operation',
              purpose: 'other',
            },
            () => method.call(fixture.operations, structuredClone(operation), context()),
          );
        }
        operationIndex++;
        actions.push({
          ...structuredClone(operation),
          controlFound: true,
          dispatched: !receipt,
          completed: true,
          ...(result === false ? { prevented: true } : {}),
        });
        capture('after-operation', index, operation);
        return assemble();
      } finally {
        busy = false;
      }
    },
    observe() {
      if (!started) throw new Error('beginScenario must run first');
      if (finalObservation) return structuredClone(finalObservation);
      read();
      return assemble();
    },
    async destroy() {
      if (!started) throw new Error('beginScenario must run first');
      if (busy) throw new Error('cannot destroy during an operation');
      if (finalObservation) return { status: 'already-destroyed' };
      busy = true;
      try {
        const result = await destroyFixture();
        capture('after-cleanup');
        finalObservation = assemble();
        tracker.restore();
        return result;
      } finally {
        busy = false;
      }
    },
  });
}
