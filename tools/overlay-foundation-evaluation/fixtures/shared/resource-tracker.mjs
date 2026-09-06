import { isPlainRecord } from '../../contracts/protocol.mjs';

const RESOURCE_PURPOSES = Object.freeze([
  'dismiss',
  'focus-loop',
  'focus-restore',
  'pointer',
  'other',
]);
export function installResourceTracker(
  scope = globalThis,
  {
    fixtureRootMarker,
    layerBoundarySelector,
    targetNameAttributes,
    connectedLayerSelector,
    globalTrackerKey,
  },
) {
  if (scope[globalTrackerKey] !== undefined) {
    return scope[globalTrackerKey];
  }
  const targetPrototype = scope.EventTarget?.prototype;
  const originalAdd = targetPrototype?.addEventListener;
  const originalRemove = targetPrototype?.removeEventListener;
  const originalSetTimeout = scope.setTimeout;
  const originalClearTimeout = scope.clearTimeout;
  const originalSetInterval = scope.setInterval;
  const originalClearInterval = scope.clearInterval;
  const listeners = [];
  const listenerLifecycles = [];
  const persistentListenerIds = new Set();
  const timers = new Map();
  const timerLifecycles = [];
  const claims = new Map();
  const claimLifecycles = [];
  let nextClaimId = 0;
  let nextListenerId = 0;
  let nextTimerId = 0;
  let resourceContext = Object.freeze({
    operation: 'setup',
    owner: 'unattributed',
    phase: 'setup',
    purpose: 'other',
  });
  const capture = (options) => (typeof options === 'boolean' ? options : options?.capture === true);
  const targetName = (target) => {
    if (target === scope) return 'window';
    if (target === scope.document) return 'document';
    return (
      targetNameAttributes
        .map((attribute) => target?.getAttribute?.(attribute))
        .find((value) => value !== null && value !== undefined) ??
      (target?.hasAttribute?.(fixtureRootMarker)
        ? fixtureRootMarker.replace(/^data-/u, '')
        : 'event-target')
    );
  };
  const connectedModalCount = () =>
    [...(scope.document?.querySelectorAll?.(connectedLayerSelector) ?? [])].filter(
      (panel) => panel.isConnected !== false,
    ).length;
  const listenerEffectSnapshot = (event) => ({
    defaultPrevented: event?.defaultPrevented === true,
    focus: scope.document?.activeElement,
    modalCount: connectedModalCount(),
  });
  const listenerPurpose = (event, effects) => {
    const type = event?.type;
    if (type === 'keydown' && event?.key === 'Tab') {
      return effects.some((effect) => ['default-prevented', 'focus-moved'].includes(effect))
        ? 'focus-loop'
        : undefined;
    }
    if (type === 'keydown' && event?.key === 'Escape') {
      return effects.length > 0 ? 'dismiss' : undefined;
    }
    if (
      resourceContext.operation === 'point' &&
      /^(?:click|contextmenu|mouse|pointer)/u.test(type ?? '')
    ) {
      return effects.length > 0 ? 'pointer' : undefined;
    }
    if (effects.includes('focus-moved')) return 'focus-restore';
    return undefined;
  };
  if (typeof originalAdd === 'function' && typeof originalRemove === 'function') {
    const removeTrackedListener = (entry, { native = false, detachAbort = true } = {}) => {
      const index = listeners.indexOf(entry);
      if (index !== -1) {
        listeners.splice(index, 1);
        entry.releaseCount += 1;
        entry.releasedOperation = resourceContext.operation;
        entry.releasedPhase = resourceContext.phase;
      }
      if (native) {
        originalRemove.call(
          entry.eventTarget,
          entry.identity.type,
          entry.registeredListener,
          entry.capture,
        );
      }
      if (detachAbort && entry.signal !== undefined && entry.abortHandler !== undefined) {
        originalRemove.call(entry.signal, 'abort', entry.abortHandler, false);
      }
    };
    targetPrototype.addEventListener = function trackedAdd(type, listener, options) {
      if (listener === null || listener === undefined) {
        return originalAdd.call(this, type, listener, options);
      }
      const captured = capture(options);
      const existing = listeners.find(
        (entry) =>
          entry.eventTarget === this &&
          entry.identity.type === type &&
          entry.listener === listener &&
          entry.capture === captured,
      );
      if (existing !== undefined) {
        return originalAdd.call(this, type, existing.registeredListener, options);
      }
      const signal = typeof options === 'object' && options !== null ? options.signal : undefined;
      if (signal?.aborted === true) return originalAdd.call(this, type, listener, options);
      const boundaryTarget = this?.closest?.(layerBoundarySelector);
      const ownerTarget = boundaryTarget ?? this;
      const identity = Object.freeze({
        acquiredOperation: resourceContext.operation,
        acquiredPhase: resourceContext.phase,
        boundary:
          boundaryTarget === null || boundaryTarget === undefined
            ? `outside-${fixtureRootMarker === 'data-modal-fixture-root' ? 'modal' : 'overlay'}-boundary`
            : targetName(boundaryTarget),
        id: ++nextListenerId,
        owner: targetName(ownerTarget),
        purpose: resourceContext.purpose,
        target: targetName(this),
        type,
      });
      const entry = {
        eventTarget: this,
        identity,
        listener,
        capture: captured,
        signal,
        registeredListener: undefined,
        releaseCount: 0,
        uses: [],
      };
      entry.registeredListener = function trackedListener(event) {
        if (typeof options === 'object' && options?.once === true) {
          removeTrackedListener(entry, { native: false });
        }
        const before = listenerEffectSnapshot(event);
        try {
          if (typeof listener === 'function') return listener.call(this, event);
          return listener.handleEvent.call(listener, event);
        } finally {
          const after = listenerEffectSnapshot(event);
          const effects = [];
          if (!before.defaultPrevented && after.defaultPrevented) {
            effects.push('default-prevented');
          }
          if (before.focus !== after.focus) effects.push('focus-moved');
          if (after.modalCount < before.modalCount) effects.push('modal-closed');
          const purpose = listenerPurpose(event, effects);
          if (purpose !== undefined) {
            entry.uses.push(
              Object.freeze({
                effects: Object.freeze(effects),
                operation: resourceContext.operation,
                phase: resourceContext.phase,
                purpose,
                target: targetName(event?.target ?? this),
                type: event?.type ?? entry.identity.type,
              }),
            );
          }
        }
      };
      const result = originalAdd.call(this, type, entry.registeredListener, options);
      listeners.push(entry);
      listenerLifecycles.push(entry);
      if (signal !== undefined && typeof signal.addEventListener === 'function') {
        entry.abortHandler = () =>
          removeTrackedListener(entry, { native: false, detachAbort: false });
        originalAdd.call(signal, 'abort', entry.abortHandler, { once: true });
      }
      return result;
    };
    targetPrototype.removeEventListener = function trackedRemove(type, listener, options) {
      const entry = listeners.find(
        (entry) =>
          entry.eventTarget === this &&
          entry.identity.type === type &&
          entry.listener === listener &&
          entry.capture === capture(options),
      );
      if (entry === undefined) return originalRemove.call(this, type, listener, options);
      removeTrackedListener(entry, { native: true });
      return undefined;
    };
  }
  const releaseTimer = (handle) => {
    const timer = timers.get(handle);
    if (timer === undefined) return false;
    timers.delete(handle);
    timer.releaseCount += 1;
    timer.releasedOperation = resourceContext.operation;
    timer.releasedPhase = resourceContext.phase;
    return true;
  };
  if (typeof originalSetTimeout === 'function' && typeof originalClearTimeout === 'function') {
    scope.setTimeout = (callback, delay, ...args) => {
      let handle;
      const wrapped = (...callbackArgs) => {
        releaseTimer(handle);
        if (typeof callback === 'function') return callback(...callbackArgs);
        return undefined;
      };
      handle = originalSetTimeout.call(scope, wrapped, delay, ...args);
      const timer = {
        identity: Object.freeze({
          acquiredOperation: resourceContext.operation,
          acquiredPhase: resourceContext.phase,
          id: ++nextTimerId,
          kind: 'timeout',
          owner: resourceContext.owner,
          purpose: resourceContext.purpose,
          target: 'window',
        }),
        releaseCount: 0,
      };
      timers.set(handle, timer);
      timerLifecycles.push(timer);
      return handle;
    };
    scope.clearTimeout = (handle) => {
      releaseTimer(handle);
      return originalClearTimeout.call(scope, handle);
    };
  }
  if (typeof originalSetInterval === 'function' && typeof originalClearInterval === 'function') {
    scope.setInterval = (callback, delay, ...args) => {
      const handle = originalSetInterval.call(scope, callback, delay, ...args);
      const timer = {
        identity: Object.freeze({
          acquiredOperation: resourceContext.operation,
          acquiredPhase: resourceContext.phase,
          id: ++nextTimerId,
          kind: 'interval',
          owner: resourceContext.owner,
          purpose: resourceContext.purpose,
          target: 'window',
        }),
        releaseCount: 0,
      };
      timers.set(handle, timer);
      timerLifecycles.push(timer);
      return handle;
    };
    scope.clearInterval = (handle) => {
      releaseTimer(handle);
      return originalClearInterval.call(scope, handle);
    };
  }
  let restored = false;
  const tracker = Object.freeze({
    capturePersistentListeners({ owner, target }, operation) {
      if (
        typeof owner !== 'string' ||
        owner.length === 0 ||
        target === null ||
        target === undefined ||
        typeof operation !== 'function'
      ) {
        throw new TypeError('persistent listener owner, target, and operation are required');
      }
      const existingIds = new Set(listeners.map(({ identity }) => identity.id));
      const result = operation();
      for (const entry of listeners) {
        if (!existingIds.has(entry.identity.id)) {
          entry.persistentOwner = owner;
          entry.persistentRoot = target;
          persistentListenerIds.add(entry.identity.id);
        }
      }
      return result;
    },
    runInPhase(context, operation) {
      if (
        !isPlainRecord(context) ||
        typeof context.owner !== 'string' ||
        context.owner.length === 0 ||
        typeof context.phase !== 'string' ||
        context.phase.length === 0 ||
        typeof context.operation !== 'string' ||
        context.operation.length === 0 ||
        !RESOURCE_PURPOSES.includes(context.purpose) ||
        typeof operation !== 'function'
      ) {
        throw new TypeError(
          'modal resource phase, owner, operation, purpose, and callback are required',
        );
      }
      const previousContext = resourceContext;
      resourceContext = Object.freeze({
        operation: context.operation,
        owner: context.owner,
        phase: context.phase,
        purpose: context.purpose,
      });
      let result;
      try {
        result = operation();
      } catch (error) {
        resourceContext = previousContext;
        throw error;
      }
      if (result !== null && typeof result === 'object' && typeof result.then === 'function') {
        return Promise.resolve(result).finally(() => {
          resourceContext = previousContext;
        });
      }
      resourceContext = previousContext;
      return result;
    },
    acquireClaim({ kind, owner }) {
      if (
        typeof kind !== 'string' ||
        kind.length === 0 ||
        typeof owner !== 'string' ||
        owner.length === 0
      ) {
        throw new TypeError('modal resource claim kind and owner must be non-empty strings');
      }
      const claim = Object.freeze({ id: ++nextClaimId, kind, owner });
      claims.set(claim.id, claim);
      const lifecycle = {
        ...claim,
        acquiredOperation: resourceContext.operation,
        acquiredPhase: resourceContext.phase,
        releaseCount: 0,
      };
      claimLifecycles.push(lifecycle);
      let released = false;
      return Object.freeze({
        release() {
          if (released) return false;
          released = true;
          Object.assign(lifecycle, {
            releaseCount: 1,
            releasedOperation: resourceContext.operation,
            releasedPhase: resourceContext.phase,
          });
          return claims.delete(claim.id);
        },
      });
    },
    snapshot: () => {
      const candidateListeners = listeners.filter(
        ({ identity }) => !persistentListenerIds.has(identity.id),
      );
      const listenerRecord = (entry) => {
        return {
          ...entry.identity,
          uses: entry.uses.map((use) => ({ ...use, effects: [...use.effects] })),
        };
      };
      return {
        listeners: candidateListeners.length,
        persistentListeners: listeners.length - candidateListeners.length,
        timers: timers.size,
        claims: [...claims.values()].map((claim) => ({ ...claim })),
        ...(fixtureRootMarker === 'data-modal-fixture-root'
          ? {}
          : { claimLifecycles: claimLifecycles.map((entry) => ({ ...entry })) }),
        listenerEntries: candidateListeners.map(listenerRecord),
        listenerLifecycles: listenerLifecycles
          .filter(({ identity }) => !persistentListenerIds.has(identity.id))
          .map((entry) => ({
            ...listenerRecord(entry),
            releaseCount: entry.releaseCount,
            ...(entry.releasedOperation === undefined
              ? {}
              : { releasedOperation: entry.releasedOperation }),
            ...(entry.releasedPhase === undefined ? {} : { releasedPhase: entry.releasedPhase }),
          })),
        timerEntries: [...timers.values()].map(({ identity }) => ({ ...identity })),
        timerLifecycles: timerLifecycles.map((timer) => ({
          ...timer.identity,
          releaseCount: timer.releaseCount,
          ...(timer.releasedOperation === undefined
            ? {}
            : { releasedOperation: timer.releasedOperation }),
          ...(timer.releasedPhase === undefined ? {} : { releasedPhase: timer.releasedPhase }),
        })),
      };
    },
    restore() {
      if (restored) return false;
      if (scope[globalTrackerKey] !== tracker) return false;
      if (targetPrototype !== undefined && typeof originalAdd === 'function') {
        targetPrototype.addEventListener = originalAdd;
      }
      if (targetPrototype !== undefined && typeof originalRemove === 'function') {
        targetPrototype.removeEventListener = originalRemove;
      }
      if (typeof originalSetTimeout === 'function') scope.setTimeout = originalSetTimeout;
      if (typeof originalClearTimeout === 'function') scope.clearTimeout = originalClearTimeout;
      if (typeof originalSetInterval === 'function') scope.setInterval = originalSetInterval;
      if (typeof originalClearInterval === 'function') scope.clearInterval = originalClearInterval;
      restored = true;
      delete scope[globalTrackerKey];
      return true;
    },
  });
  Object.defineProperty(scope, globalTrackerKey, {
    configurable: true,
    enumerable: false,
    value: tracker,
  });
  return tracker;
}
