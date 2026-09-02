import { isPlainRecord } from '../../contracts/protocol.mjs';
import {
  modalExecutionScenario,
  validateModalFixtureRequest,
  validateModalObservation,
} from './protocol.mjs';

const OPERATION_NAMES = Object.freeze([
  'open',
  'close',
  'press',
  'point',
  'setDirection',
  'setMotionPreference',
  'updateContent',
  'destroy',
]);
const RESOURCE_PURPOSES = Object.freeze([
  'dismiss',
  'focus-loop',
  'focus-restore',
  'pointer',
  'other',
]);
const RESOURCE_ACQUISITION_OPERATIONS = new Set(['open', 'press', 'point', 'updateContent']);
const RESOURCE_RELEASE_OPERATIONS = new Set([
  'open',
  'close',
  'destroy',
  'press',
  'point',
  'updateContent',
]);

export function installModalResourceTracker(scope = globalThis) {
  if (scope.__LYRA_MODAL_RESOURCE_TRACKER__ !== undefined) {
    return scope.__LYRA_MODAL_RESOURCE_TRACKER__;
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
      target?.getAttribute?.('data-modal-id') ??
      target?.getAttribute?.('id') ??
      (target?.hasAttribute?.('data-modal-fixture-root') ? 'modal-fixture-root' : 'event-target')
    );
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
      const ownerTarget = this?.closest?.('[data-modal-panel]') ?? this;
      const identity = Object.freeze({
        acquiredOperation: resourceContext.operation,
        acquiredPhase: resourceContext.phase,
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
        registeredListener: listener,
        releaseCount: 0,
      };
      if (typeof options === 'object' && options?.once === true) {
        entry.registeredListener = function trackedOnce(event) {
          removeTrackedListener(entry, { native: false });
          if (typeof listener === 'function') return listener.call(this, event);
          return listener.handleEvent.call(listener, event);
        };
      }
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
      let released = false;
      return Object.freeze({
        release() {
          if (released) return false;
          released = true;
          return claims.delete(claim.id);
        },
      });
    },
    snapshot: () => {
      const candidateListeners = listeners.filter(
        ({ identity }) => !persistentListenerIds.has(identity.id),
      );
      const listenerRecord = (entry) => {
        return { ...entry.identity };
      };
      return {
        listeners: candidateListeners.length,
        persistentListeners: listeners.length - candidateListeners.length,
        timers: timers.size,
        claims: [...claims.values()].map((claim) => ({ ...claim })),
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
      return true;
    },
  });
  Object.defineProperty(scope, '__LYRA_MODAL_RESOURCE_TRACKER__', {
    configurable: true,
    enumerable: false,
    value: tracker,
  });
  return tracker;
}

export function useModalResourceClaim({ React, active, kind, owner }) {
  React.useEffect(() => {
    if (!active) return undefined;
    const handle = globalThis.__LYRA_MODAL_RESOURCE_TRACKER__?.acquireClaim?.({ kind, owner });
    return typeof handle?.release === 'function' ? () => handle.release() : undefined;
  }, [active, kind, owner]);
}

function emptyObservation({ destroyed, events, resources }) {
  const snapshot = {
    roles: [],
    relationships: [],
    states: [],
    focus: { target: 'modal-fixture-root' },
    events: structuredClone(events),
    announcements: [],
  };
  return {
    ...snapshot,
    cleanup: [...resources].sort(),
    trace: [{ phase: 'before-operations', snapshot: structuredClone(snapshot) }],
    diagnostics: { destroyed },
  };
}

function validEvent(event) {
  return (
    validateModalObservation({
      ...emptyObservation({ destroyed: false, events: [event], resources: new Set() }),
    }).length === 0
  );
}

function validResource(resource) {
  return (
    typeof resource === 'string' &&
    validateModalObservation({
      ...emptyObservation({ destroyed: false, events: [], resources: new Set([resource]) }),
    }).length === 0
  );
}

function validAction(action) {
  if (!isPlainRecord(action)) return false;
  const allowed = new Set(['event', 'resource', 'prevented']);
  if (Object.keys(action).some((key) => !allowed.has(key))) return false;
  if (action.prevented === true) return false;
  if (action.prevented !== undefined && action.prevented !== false) return false;
  if (!validEvent(action.event)) return false;
  if (action.resource !== undefined && !validResource(action.resource)) return false;
  return true;
}

function createOperations({ commit, isDestroyed, resources }) {
  const perform = (action) => {
    if (isDestroyed() || !validAction(action)) return false;
    if (action.resource !== undefined) resources.add(action.resource);
    commit(action.event);
    return true;
  };
  return Object.fromEntries(OPERATION_NAMES.map((name) => [name, perform]));
}

export function createModalRuntime(request) {
  const requestErrors = validateModalFixtureRequest(request);
  if (requestErrors.length !== 0) throw new Error(requestErrors.join('\n'));
  const immutableRequest = structuredClone(request);
  let destroyed = false;
  const events = [];
  const resources = new Set();
  const commit = (event) => {
    if (destroyed || !validEvent(event)) return false;
    events.push(structuredClone(event));
    return true;
  };
  const destroy = () => {
    if (destroyed) return false;
    destroyed = true;
    resources.clear();
    return true;
  };
  const cleanup = () => {
    if (destroyed) return Object.freeze({ status: 'already-destroyed' });
    if (destroy() !== true) throw new Error('modal fixture cleanup result is uncertain');
    return Object.freeze({ status: 'destroyed' });
  };
  const acceptInput = (operation, target, eventType) =>
    !destroyed && OPERATION_NAMES.includes(operation) && validEvent({ target, type: eventType });
  return Object.freeze({
    acceptInput,
    cleanup,
    isDestroyed: () => destroyed,
    operations: Object.freeze(
      createOperations({ commit, isDestroyed: () => destroyed, resources }),
    ),
    observe: () => structuredClone(emptyObservation({ destroyed, events, resources })),
    request: Object.freeze(immutableRequest),
    destroy,
  });
}

function part(props, children) {
  return Object.freeze({ children, props: Object.freeze(props) });
}

function presentation(request, contentMode) {
  const state = request.scenario.initial.state;
  if (contentMode === 'destructive-confirmation') {
    return Object.freeze({
      description: 'Deleting this workspace cannot be undone.',
      descriptionId: 'destructive-warning',
      panelId: 'modal-panel',
      title: 'Delete workspace',
      titleId: 'modal-title',
    });
  }
  if (contentMode === 'no-tabbable-content') {
    return Object.freeze({
      description: 'Workspace processing is in progress.',
      descriptionId: 'modal-description',
      panelId: 'modal-panel',
      title: 'Processing workspace',
      titleId: 'modal-title',
    });
  }
  if (
    contentMode === 'enabled-invalid-field-case' ||
    contentMode === 'focusable-summary-fallback-case'
  ) {
    return Object.freeze({
      description: 'Correct the workspace validation errors.',
      descriptionId: 'field-error',
      panelId: 'modal-panel',
      title: 'Correct workspace details',
      titleId: 'modal-title',
    });
  }
  if (request.scenario.scenarioId.endsWith('.ssr-open-semantics.v1')) {
    return Object.freeze({
      description: 'Server workspace is ready.',
      descriptionId: 'server-modal-description',
      panelId: 'server-rendered-modal',
      title: 'Server workspace',
      titleId: 'server-modal-title',
    });
  }
  if (request.scenario.scenarioId.endsWith('.hydration-stability.v1')) {
    return Object.freeze({
      description: 'Hydrated workspace is ready.',
      descriptionId: 'hydrated-modal-description',
      panelId: 'hydrated-modal',
      title: 'Hydrated workspace',
      titleId: 'hydrated-modal-title',
    });
  }
  if (state.controlled === true) {
    return Object.freeze({
      description: 'Controlled workspace is ready.',
      descriptionId: 'modal-description',
      panelId: 'controlled-modal',
      title: 'Controlled workspace',
      titleId: 'modal-title',
    });
  }
  if (state.declaredTarget !== undefined) {
    return Object.freeze({
      description: 'Create a workspace.',
      descriptionId: 'modal-description',
      panelId: 'modal-panel',
      title: 'Create workspace',
      titleId: 'modal-title',
    });
  }
  if (state.dynamicTargets === true) {
    return Object.freeze({
      description: 'Choose a workspace command.',
      descriptionId: 'modal-description',
      panelId: 'modal-panel',
      title: 'Workspace commands',
      titleId: 'modal-title',
    });
  }
  if (state.focusedNodeRemovable === true) {
    return Object.freeze({
      description: 'Manage workspace members.',
      descriptionId: 'modal-description',
      panelId: 'modal-panel',
      title: 'Workspace members',
      titleId: 'modal-title',
    });
  }
  if (state.nested === true) {
    return Object.freeze({
      description: 'Parent workspace is ready.',
      descriptionId: 'modal-description',
      panelId: 'parent-modal',
      title: 'Parent workspace',
      titleId: 'modal-title',
    });
  }
  if (state.pointerMode === 'coarse') {
    return Object.freeze({
      description: 'Choose a workspace option.',
      descriptionId: 'modal-description',
      panelId: 'modal-panel',
      title: 'Workspace options',
      titleId: 'modal-title',
    });
  }
  if (state.openerConnected === true) {
    return Object.freeze({
      description: 'Change workspace settings.',
      descriptionId: 'modal-description',
      panelId: 'modal-panel',
      title: 'Workspace settings',
      titleId: 'modal-title',
    });
  }
  if (state.pageScrollPosition === 'preserved') {
    return Object.freeze({
      description: 'First workspace modal is ready.',
      descriptionId: 'modal-description',
      panelId: 'first-modal',
      title: 'First workspace modal',
      titleId: 'modal-title',
    });
  }
  if (
    request.scenario.operations.some(
      ({ operation, target }) => operation === 'destroy' && target === 'entry-phase-modal',
    )
  ) {
    return Object.freeze({
      description: 'Disposable workspace is ready.',
      descriptionId: 'modal-description',
      panelId: 'modal-panel',
      title: 'Disposable workspace',
      titleId: 'modal-title',
    });
  }
  if (state.motionPreference === 'reduced-motion') {
    return Object.freeze({
      description: 'Reopened workspace is ready.',
      descriptionId: 'modal-description',
      panelId: 'reopened-modal',
      title: 'Reopened workspace',
      titleId: 'modal-title',
    });
  }
  return Object.freeze({
    description: 'Review the workspace details before continuing.',
    descriptionId: 'modal-description',
    panelId: 'modal-panel',
    title: 'Workspace details',
    titleId: 'modal-title',
  });
}

function nestedPresentation(request) {
  const secondModal = request.scenario.operations.some(({ target }) => target === 'second-modal');
  return Object.freeze({
    panelId: secondModal ? 'second-modal' : 'child-modal',
    safeTargetId: secondModal ? 'second-modal-safe-target' : 'child-modal-safe-target',
    title: secondModal ? 'Second workspace modal' : 'Child workspace',
  });
}

function scenarioControl(
  operation,
  index,
  { commitControlledClose, destroyPhase, prepareContent, runtime },
) {
  const record = (event, eventType = operation.operation) => {
    let accepted = runtime.acceptInput(operation.operation, operation.target, eventType);
    if (!accepted) return false;
    if (operation.operation === 'updateContent' && operation.target === 'controlled-close-commit') {
      accepted = commitControlledClose();
    } else if (operation.operation === 'updateContent') {
      accepted = prepareContent(operation.target);
    } else if (operation.operation === 'destroy') {
      accepted = destroyPhase(operation.target);
    }
    if (!accepted) return false;
    const control = event?.currentTarget;
    const previous = Number(control?.getAttribute?.('data-modal-completion-count') ?? '0');
    control?.setAttribute?.('data-modal-completion-count', String(previous + 1));
    return true;
  };
  const props = {
    type: 'button',
    'data-modal-control': operation.target,
    'data-modal-operation': operation.operation,
    'data-modal-id': operation.target,
    'data-modal-completion-count': '0',
    key: `${operation.operation}-${operation.target}-${index}`,
  };
  if (operation.operation === 'press') props.onKeyDown = (event) => record(event, 'keydown');
  else if (operation.operation === 'point') {
    props.onPointerDown = (event) => record(event, 'pointerdown');
    props.onContextMenu = (event) => record(event, 'contextmenu');
  } else props.onClick = (event) => record(event);
  return part(props, `${operation.operation} ${operation.target}`);
}

function fixtureParts(
  request,
  onOpenChange,
  runtime,
  announcement,
  commitControlledClose,
  contentMode,
  destroyPhase,
  prepareContent,
) {
  const view = presentation(request, contentMode);
  const nestedView = nestedPresentation(request);
  const state = request.scenario.initial.state;
  const controls = request.scenario.operations.map((operation, index) => ({
    operation,
    part: scenarioControl(operation, index, {
      commitControlledClose,
      destroyPhase,
      prepareContent,
      runtime,
    }),
  }));
  const belongsInContent = ({ operation, target }) =>
    ['close', 'point', 'press'].includes(operation) ||
    (operation === 'open' && /child|second/iu.test(target));
  const supportingActions = [];
  if (
    contentMode === 'enabled-invalid-field-case' ||
    contentMode === 'focusable-summary-fallback-case'
  ) {
    supportingActions.push(
      part(
        {
          type: 'button',
          disabled: true,
          'aria-invalid': 'true',
          'data-modal-id': 'disabled-invalid-field',
        },
        'Disabled invalid field',
      ),
    );
  }
  if (state.dynamicTargets === true) {
    supportingActions.push(
      part({ type: 'button', 'data-modal-id': 'last-eligible-target' }, 'Last eligible target'),
      part({ type: 'button', 'data-modal-id': 'hidden-tab-target' }, 'Hidden target'),
      part({ type: 'button', 'data-modal-id': 'disabled-tab-target' }, 'Disabled target'),
      part({ type: 'button', 'data-modal-id': 'removed-tab-target' }, 'Removed target'),
    );
  }
  if (state.focusedNodeRemovable === true) {
    supportingActions.push(
      part({ type: 'button', 'data-modal-id': 'middle-focus-target' }, 'Middle focus target'),
      part({ type: 'button', 'data-modal-id': 'nearest-safe-target' }, 'Nearest safe target'),
    );
  }
  if (state.pointerMode === 'coarse') {
    supportingActions.push(
      part({ type: 'button', 'data-modal-id': 'child-modal-safe-target' }, 'Child interaction'),
    );
  }
  const externalTargets = [];
  if (state.openerConnected === true) {
    externalTargets.push(
      part({ type: 'button', 'data-modal-id': 'documented-successor' }, 'Workspace successor'),
    );
  }
  if (state.pageScrollPosition === 'preserved') {
    externalTargets.push(
      part({ 'data-modal-id': 'page-scroll-surface' }, 'Scrollable page surface'),
    );
  }
  if (state.pointerMode === 'coarse') {
    externalTargets.push(
      part(
        {
          type: 'button',
          'data-modal-id': 'outside-prevented-default',
          onPointerDown: (event) => event.preventDefault(),
        },
        'Prevented outside interaction',
      ),
    );
  }
  return Object.freeze({
    entryControls: Object.freeze(
      controls.filter(({ operation }) => !belongsInContent(operation)).map(({ part }) => part),
    ),
    contentControls: Object.freeze(
      controls.filter(({ operation }) => belongsInContent(operation)).map(({ part }) => part),
    ),
    externalTargets: Object.freeze(externalTargets),
    hydrationInput:
      typeof state.inputValue === 'string'
        ? part(
            {
              'data-modal-id': 'hydrated-input',
              defaultValue: state.inputValue,
            },
            undefined,
          )
        : undefined,
    supportingActions: Object.freeze(supportingActions),
    trigger: part(
      { type: 'button', 'data-fixture-control': 'opener', onClick: () => onOpenChange(true) },
      'Open modal',
    ),
    backdrop: part({ 'data-fixture-part': 'backdrop', 'data-modal-id': 'modal-backdrop' }),
    panel: part({
      'data-fixture-part': 'panel',
      'data-modal-id': view.panelId,
      'data-modal-panel': '',
      'data-modal-portal': '',
      ...(contentMode === 'no-tabbable-content' ? { tabIndex: -1 } : {}),
      ...(contentMode === 'destructive-confirmation' ? { role: 'alertdialog' } : {}),
    }),
    title: part(
      { 'data-fixture-part': 'title', 'data-modal-id': view.titleId, id: view.titleId },
      view.title,
    ),
    description: part(
      {
        'data-fixture-part': 'description',
        'data-modal-id': view.descriptionId,
        id: view.descriptionId,
      },
      view.description,
    ),
    initialTarget: part(
      {
        type: 'button',
        'data-fixture-part': 'initial-target',
        'data-modal-id':
          contentMode === 'declare-safe-initial-focus'
            ? 'safe-declared-target'
            : contentMode === 'declare-invalid-initial-focus'
              ? 'invalid-declared-target'
              : state.dynamicTargets === true
                ? 'first-eligible-target'
                : 'modal-safe-target',
        ...(contentMode === 'declare-safe-initial-focus' ? { autoFocus: true } : {}),
        ...(contentMode === 'declare-invalid-initial-focus'
          ? { disabled: true, tabIndex: -1 }
          : {}),
        ...(contentMode === 'no-tabbable-content' ? { disabled: true, tabIndex: -1 } : {}),
      },
      'Safe initial target',
    ),
    ordinaryAction: part(
      {
        type: 'button',
        'data-fixture-action': 'ordinary',
        ...(contentMode === 'no-tabbable-content' ? { disabled: true } : {}),
        ...(contentMode === 'destructive-confirmation' ? { autoFocus: true } : {}),
        ...(contentMode === 'destructive-confirmation'
          ? { 'data-modal-id': 'least-destructive-action' }
          : {}),
        ...(contentMode === 'enabled-invalid-field-case'
          ? {
              'aria-describedby': 'field-error',
              'aria-invalid': 'true',
              autoFocus: true,
              'data-modal-id': 'first-invalid-enabled-field',
            }
          : {}),
        ...(contentMode === 'focusable-summary-fallback-case'
          ? { autoFocus: true, 'data-modal-id': 'focusable-validation-summary' }
          : {}),
        ...(contentMode === 'declare-invalid-initial-focus'
          ? { autoFocus: true, 'data-modal-id': 'safe-fallback-target' }
          : {}),
      },
      contentMode === 'destructive-confirmation' ? 'Cancel' : 'Save workspace',
    ),
    destructiveAction: part(
      {
        type: 'button',
        'data-fixture-action': 'destructive',
        ...(contentMode === 'no-tabbable-content' ? { disabled: true } : {}),
        ...(contentMode === 'destructive-confirmation'
          ? { 'data-modal-id': 'destructive-action' }
          : {}),
      },
      'Delete workspace',
    ),
    close: part(
      {
        type: 'button',
        'data-fixture-control': 'close',
        onClick: () => onOpenChange(false),
        ...(contentMode === 'no-tabbable-content' ? { disabled: true, tabIndex: -1 } : {}),
      },
      'Close modal',
    ),
    nestedTrigger: part(
      {
        type: 'button',
        'data-fixture-control': 'nested-opener',
        ...(contentMode === 'no-tabbable-content' ? { disabled: true, tabIndex: -1 } : {}),
      },
      'Open nested modal',
    ),
    nestedView,
    liveRegion: part({ 'aria-live': 'polite', 'data-modal-id': 'modal-live-region' }, announcement),
  });
}

function observedWithDiagnostics(runtime, diagnostics) {
  const observation = runtime.observe();
  return {
    ...observation,
    diagnostics: { ...observation.diagnostics, ...structuredClone(diagnostics) },
  };
}

export function useModalFixtureRuntime({ React, request, diagnostics, onReady }) {
  const [open, setOpen] = React.useState(() => request.scenario.initial.state.open === true);
  const [nestedOpen, setNestedOpen] = React.useState(false);
  const [contentMode, setContentMode] = React.useState('default');
  const [announcement, setAnnouncement] = React.useState(() => {
    const view = presentation(request);
    return `${view.title} dialog ${request.scenario.initial.state.open === true ? 'available' : 'ready'}`;
  });
  const [pendingControlledClose, setPendingControlledClose] = React.useState(false);
  const runtimeRef = React.useRef();
  if (runtimeRef.current === undefined) runtimeRef.current = createModalRuntime(request);
  const runtime = runtimeRef.current;
  const nestedView = nestedPresentation(request);
  const onOpenChange = React.useCallback(
    (nextOpen) => {
      if (typeof nextOpen !== 'boolean') return false;
      if (nextOpen === false && request.scenario.initial.state.controlled === true) {
        setPendingControlledClose(true);
        setAnnouncement(`${presentation(request, contentMode).title} dialog close requested`);
        return runtime.operations.close({
          event: { target: 'controlled-modal', type: 'close-requested' },
        });
      }
      setOpen(nextOpen);
      setAnnouncement(
        `${presentation(request, contentMode).title} dialog ${nextOpen ? 'opened' : 'closed'}`,
      );
      return runtime.operations[nextOpen ? 'open' : 'close']({
        event: { target: 'modal-panel', type: nextOpen ? 'opened' : 'closed' },
      });
    },
    [contentMode, request, runtime],
  );
  const commitControlledClose = React.useCallback(() => {
    if (pendingControlledClose !== true) return false;
    setOpen(false);
    setPendingControlledClose(false);
    setAnnouncement(`${presentation(request, contentMode).title} dialog closed`);
    return runtime.operations.updateContent({
      event: { target: 'controlled-modal', type: 'controlled-close-committed' },
    });
  }, [contentMode, pendingControlledClose, request, runtime]);
  const prepareContent = React.useCallback(
    (target) => {
      if (
        !request.scenario.operations.some(
          (operation) => operation.operation === 'updateContent' && operation.target === target,
        )
      ) {
        return false;
      }
      setContentMode(target);
      return true;
    },
    [request],
  );
  const destroyPhase = React.useCallback(
    (target) => {
      if (
        !request.scenario.operations.some(
          (operation) => operation.operation === 'destroy' && operation.target === target,
        )
      ) {
        return false;
      }
      setNestedOpen(false);
      setOpen(false);
      setAnnouncement('Disposable workspace dialog removed');
      return runtime.operations.destroy({ event: { target, type: 'destroyed-once' } });
    },
    [request],
  );
  const onNestedOpenChange = React.useCallback(
    (nextOpen) => {
      if (typeof nextOpen !== 'boolean') return false;
      setNestedOpen(nextOpen);
      setAnnouncement(`${nestedView.title} dialog ${nextOpen ? 'opened' : 'closed'}`);
      return runtime.operations[nextOpen ? 'open' : 'close']({
        event: { target: nestedView.panelId, type: nextOpen ? 'opened' : 'closed' },
      });
    },
    [nestedView, runtime],
  );
  const fixtureRef = React.useRef();
  if (fixtureRef.current === undefined) {
    fixtureRef.current = Object.freeze({
      cleanup: runtime.cleanup,
      destroy: runtime.destroy,
      isDestroyed: runtime.isDestroyed,
      observe: () => observedWithDiagnostics(runtime, diagnostics),
      operations: runtime.operations,
    });
  }
  const fixture = fixtureRef.current;
  React.useEffect(() => {
    onReady?.(fixture);
  }, [fixture, onReady]);
  React.useEffect(() => runtime.destroy, [runtime]);
  return Object.freeze({
    fixture,
    nestedOpen,
    onNestedOpenChange,
    onOpenChange,
    open,
    parts: fixtureParts(
      request,
      onOpenChange,
      runtime,
      announcement,
      commitControlledClose,
      contentMode,
      destroyPhase,
      prepareContent,
    ),
  });
}

function decodeHtml(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

function attributes(source) {
  const values = {};
  const pattern = /([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gu;
  for (const match of source.matchAll(pattern)) values[match[1]] = decodeHtml(match[2] ?? match[3]);
  return values;
}

function elementTextById(html, id) {
  for (const match of html.matchAll(/<([a-z][\w:-]*)\b([^>]*)>/giu)) {
    const elementAttributes = attributes(match[2]);
    if (elementAttributes.id !== id) continue;
    const contentStart = match.index + match[0].length;
    const close = new RegExp(`<\\/${match[1]}\\s*>`, 'iu').exec(html.slice(contentStart));
    if (close === null) return undefined;
    return decodeHtml(
      html
        .slice(contentStart, contentStart + close.index)
        .replaceAll(/<[^>]+>/gu, '')
        .trim(),
    );
  }
  return undefined;
}

function ssrProbeResults(scenario, snapshot) {
  return (scenario.probes ?? [])
    .filter(({ phase }) => phase === 'server-render')
    .map((probe) => {
      let fact = fallbackProbeFact(probe);
      if (probe.category === 'roles' && snapshot.roles.length === 1) fact = snapshot.roles[0];
      else if (probe.category === 'relationships') {
        fact =
          snapshot.relationships.find(
            ({ source, name }) => source === probe.target && name === probe.property,
          ) ?? fact;
      } else if (probe.category === 'states') {
        fact =
          snapshot.states.find(
            ({ target, name }) => target === probe.target && name === probe.property,
          ) ?? fact;
      } else if (probe.category === 'focus') fact = snapshot.focus;
      else if (probe.category === 'events') {
        fact =
          snapshot.events.find(
            ({ target, type }) => target === probe.target && type === probe.property,
          ) ?? fact;
      } else if (probe.category === 'announcements' && snapshot.announcements.length === 1) {
        fact = snapshot.announcements[0];
      } else if (
        probe.category === 'cleanup' &&
        probe.target === 'browser-resource-claims' &&
        probe.property === 'none'
      ) {
        const browserGlobalsAccessed = snapshot.states.some(
          ({ target, name, value }) =>
            target === 'browser-globals' && name === 'accessed' && value === true,
        );
        fact = browserGlobalsAccessed
          ? 'browser-resource-claims-observed'
          : 'no-browser-resource-claims';
      }
      return { id: probe.id, category: probe.category, fact };
    });
}

export function observeModalSsrMarkup({ request, html }) {
  const requestErrors = validateModalFixtureRequest(request);
  if (requestErrors.length !== 0) {
    throw new Error(`modal SSR request is invalid: ${requestErrors.join('; ')}`);
  }
  if (typeof html !== 'string') throw new Error('modal SSR output must render a string');
  let dialog;
  for (const match of html.matchAll(/<([a-z][\w:-]*)\b([^>]*)>/giu)) {
    const elementAttributes = attributes(match[2]);
    if (elementAttributes.role === 'dialog') {
      dialog = elementAttributes;
      break;
    }
  }
  const source = dialog?.['data-modal-id'] ?? dialog?.['data-modal-observation-id'];
  const labelTarget = dialog?.['aria-labelledby'];
  const name =
    dialog?.['aria-label'] ??
    (labelTarget === undefined ? undefined : elementTextById(html, labelTarget));
  const semanticallyAvailable =
    typeof source === 'string' && typeof labelTarget === 'string' && typeof name === 'string';
  const browserGlobalsAccessed =
    typeof globalThis.document !== 'undefined' || typeof globalThis.window !== 'undefined';
  const snapshot = {
    roles: semanticallyAvailable ? [{ role: 'dialog', name }] : [],
    relationships: semanticallyAvailable
      ? [{ source, name: 'labelled-by', target: labelTarget }]
      : [],
    states: semanticallyAvailable
      ? [
          { target: source, name: 'semantically-available', value: true },
          { target: 'browser-globals', name: 'accessed', value: browserGlobalsAccessed },
        ]
      : [{ target: 'browser-globals', name: 'accessed', value: browserGlobalsAccessed }],
    focus: {
      target: browserGlobalsAccessed
        ? observationId(globalThis.document?.activeElement, 'browser-document-focus-observed')
        : 'server-document-focus-unchanged',
    },
    events: semanticallyAvailable ? [{ target: source, type: 'rendered-open' }] : [],
    announcements: semanticallyAvailable ? [{ message: `${name} dialog is available` }] : [],
  };
  snapshot.probes = ssrProbeResults(request.scenario, snapshot);
  const trace = [{ phase: 'server-render', snapshot }];
  const normalized = fieldsFromProbeTrace(request.scenario, trace);
  const observation = {
    ...normalized,
    trace,
    diagnostics: { cleanupObserved: true, executionCompleted: true },
  };
  const errors = validateModalObservation(observation);
  if (errors.length !== 0) {
    throw new Error(`modal SSR observation is invalid: ${errors.join('; ')}`);
  }
  return observation;
}

function sameLiteral(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function cleanupResult(value) {
  if (
    !isPlainRecord(value) ||
    (value.status !== 'destroyed' && value.status !== 'already-destroyed')
  ) {
    throw new Error('modal fixture cleanup result is uncertain');
  }
  return Object.freeze({ status: value.status });
}

function browserEvent(document, type, init = {}) {
  const view = document.defaultView ?? globalThis;
  const EventConstructor =
    (type.startsWith('key') ? view.KeyboardEvent : undefined) ??
    (type.startsWith('pointer') ? view.PointerEvent : undefined) ??
    (type === 'contextmenu' || type === 'click' ? view.MouseEvent : undefined) ??
    view.Event ??
    globalThis.Event;
  if (typeof EventConstructor === 'function') {
    const event = new EventConstructor(type, { bubbles: true, cancelable: true, ...init });
    for (const [key, value] of Object.entries(init)) {
      if (!(key in event)) Object.defineProperty(event, key, { value });
    }
    return event;
  }
  return {
    type,
    ...init,
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
  };
}

function dispatch(document, element, type, init) {
  if (
    element === null ||
    element === undefined ||
    element.isConnected === false ||
    typeof element.dispatchEvent !== 'function'
  ) {
    return { dispatched: false, prevented: false };
  }
  const event = browserEvent(document, type, init);
  element.dispatchEvent(event);
  return { dispatched: true, prevented: event.defaultPrevented === true };
}

function click(element) {
  if (element === null || element === undefined || typeof element.click !== 'function') {
    return { dispatched: false, prevented: false };
  }
  element.click();
  return { dispatched: true, prevented: false };
}

function removeElement(element) {
  if (element === null || element === undefined || typeof element.remove !== 'function')
    return false;
  element.remove();
  return true;
}

function focusElement(element) {
  if (element === null || element === undefined || typeof element.focus !== 'function')
    return false;
  element.focus();
  return true;
}

function connectedPanelCount(document) {
  return [...(document.querySelectorAll?.('[data-modal-panel]') ?? [])].filter(
    (panel) => panel.isConnected !== false,
  ).length;
}

function mutateContent(document, target) {
  const mutations = [];
  const record = (name, changed) => mutations.push({ name, changed });
  if (target === 'disconnect-opener') {
    record(
      'opener-disconnected',
      removeElement(
        document.querySelector?.(
          '[data-modal-operation="open"][data-modal-control="connected-opener"]',
        ),
      ),
    );
  } else if (target === 'remove-focused-target') {
    const focused = document.activeElement;
    record(
      'focused-target-removed',
      focused === document.body || focused === document.documentElement
        ? false
        : removeElement(focused),
    );
  } else if (target === 'remove-nearest-safe-target') {
    record(
      'nearest-safe-target-removed',
      removeElement(document.querySelector?.('[data-modal-id="nearest-safe-target"]')),
    );
  } else if (target === 'hide-disable-remove-tab-targets') {
    const hidden = document.querySelector?.('[data-modal-id="hidden-tab-target"]');
    const disabled = document.querySelector?.('[data-modal-id="disabled-tab-target"]');
    const removed = document.querySelector?.('[data-modal-id="removed-tab-target"]');
    if (hidden !== null && hidden !== undefined) hidden.hidden = true;
    if (disabled !== null && disabled !== undefined) disabled.disabled = true;
    record('hidden-tab-target-hidden', hidden !== null && hidden !== undefined);
    record('disabled-tab-target-disabled', disabled !== null && disabled !== undefined);
    record('removed-tab-target-removed', removeElement(removed));
  } else if (target === 'hydrate-first-tree') {
    const root = document.querySelector?.('[data-modal-fixture-root]');
    record('hydration-tree-inspected', root !== null && root !== undefined);
  }
  return mutations;
}

async function driveBrowserOperation({ document, operation, synthesizeHover }) {
  const control = document.querySelector?.(
    `[data-modal-operation="${operation.operation}"][data-modal-control="${operation.target}"]`,
  );
  const action = {
    operation: operation.operation,
    target: operation.target,
    controlFound: control !== null && control !== undefined,
    events: [],
    surfaces: [],
    dispatched: false,
    prevented: false,
    completed: false,
  };
  if (!action.controlFound || control.isConnected === false) {
    action.failure = 'control-missing';
    return action;
  }
  const panelCountBefore = connectedPanelCount(document);
  const completionBefore = Number(control.getAttribute?.('data-modal-completion-count') ?? '0');
  const commit = (type, element = control, init) => {
    const result = dispatch(document, element, type, init);
    action.events.push(type);
    action.surfaces.push(observationId(element, 'missing-browser-surface'));
    action.dispatched ||= result.dispatched;
    action.prevented ||= result.prevented;
    if (!result.dispatched && action.failure === undefined) action.failure = 'surface-missing';
  };
  if (operation.operation === 'setDirection') {
    document.documentElement.dir = operation.target;
    Object.assign(action, click(control));
  } else if (operation.operation === 'setMotionPreference') {
    if (document.documentElement.dataset !== undefined) {
      document.documentElement.dataset.motionPreference = operation.target;
    }
    Object.assign(action, click(control));
  } else if (operation.operation === 'press') {
    let pressSurface = control;
    if (operation.target === 'tab-from-last-target') {
      pressSurface = document.querySelector?.('[data-modal-id="last-eligible-target"]');
    } else if (/shift-tab-from-first-target|tab-from-first-target/iu.test(operation.target)) {
      pressSurface = document.querySelector?.('[data-modal-id="first-eligible-target"]');
    } else if (operation.target === 'middle-focus-target') {
      pressSurface = document.querySelector?.('[data-modal-id="middle-focus-target"]');
    } else if (/escape-key|dismiss-control/iu.test(operation.target)) {
      pressSurface = document.activeElement;
    } else if (operation.target === 'hydrated-input') {
      pressSurface = document.querySelector?.('[data-modal-id="hydrated-input"]');
    }
    if (/focus-target|tab-from/iu.test(operation.target)) focusElement(pressSurface);
    commit('keydown', pressSurface, {
      key: /escape|dismiss/iu.test(operation.target)
        ? 'Escape'
        : /input/iu.test(operation.target)
          ? 'Enter'
          : 'Tab',
      shiftKey: /shift/iu.test(operation.target),
    });
  } else if (operation.operation === 'point') {
    const origin = /child-interaction/iu.test(operation.target)
      ? document.querySelector?.('[data-modal-id="child-modal-safe-target"]')
      : operation.target === 'outside-prevented-default'
        ? document.querySelector?.('[data-modal-id="outside-prevented-default"]')
        : /page-scroll/iu.test(operation.target)
          ? document.querySelector?.('[data-modal-id="page-scroll-surface"]')
          : document.querySelector?.('[data-fixture-part="backdrop"]');
    if (/context-menu/iu.test(operation.target)) {
      commit('contextmenu', origin);
    } else {
      if (synthesizeHover === true) dispatch(document, origin, 'pointerover');
      commit('pointerdown', origin);
      if (/cancel/iu.test(operation.target)) commit('pointercancel', origin);
      else if (/drag-inside/iu.test(operation.target)) {
        commit('pointerup', document.querySelector?.('[data-modal-panel]'));
      } else commit('pointerup', origin);
    }
  } else if (operation.operation === 'destroy') {
    Object.assign(action, click(control));
  } else if (operation.operation === 'updateContent') {
    Object.assign(action, click(control));
    action.mutations = mutateContent(document, operation.target);
  } else {
    Object.assign(action, click(control));
  }
  await settleBrowserWork();
  const panelCountAfter = connectedPanelCount(document);
  const directMutationTargets = new Set([
    'disconnect-opener',
    'remove-focused-target',
    'remove-nearest-safe-target',
    'hide-disable-remove-tab-targets',
    'hydrate-first-tree',
  ]);
  const mutationsCompleted =
    !directMutationTargets.has(operation.target) ||
    (action.mutations?.length > 0 && action.mutations.every(({ changed }) => changed === true));
  const completionAfter = Number(control.getAttribute?.('data-modal-completion-count') ?? '0');
  const handlerCompleted =
    operation.operation === 'point' || operation.operation === 'press'
      ? action.dispatched
      : completionAfter > completionBefore;
  const transitionCompleted =
    operation.operation === 'open'
      ? panelCountAfter > panelCountBefore ||
        (operation.target === 'server-rendered-modal' && panelCountAfter > 0)
      : operation.operation === 'close' || operation.target === 'controlled-close-commit'
        ? panelCountAfter < panelCountBefore
        : true;
  action.completed =
    action.failure === undefined &&
    action.dispatched &&
    handlerCompleted &&
    mutationsCompleted &&
    transitionCompleted;
  if (!action.completed && action.failure === undefined) {
    action.failure = !mutationsCompleted
      ? 'mutation-not-completed'
      : !transitionCompleted
        ? 'transition-not-completed'
        : 'operation-not-completed';
  }
  return action;
}

function settleBrowserWork() {
  return new Promise((resolve) => {
    if (typeof globalThis.requestAnimationFrame === 'function') {
      globalThis.requestAnimationFrame(() => resolve());
    } else queueMicrotask(resolve);
  });
}

function observationId(element, fallback) {
  return (
    element?.getAttribute?.('data-modal-id') ??
    element?.getAttribute?.('data-modal-observation-id') ??
    element?.getAttribute?.('id') ??
    fallback
  );
}

function relationshipTarget(document, value) {
  return value
    .trim()
    .split(/\s+/u)
    .map((identifier) => {
      const referenced = document.getElementById?.(identifier);
      return (
        referenced?.getAttribute?.('data-modal-id') ??
        referenced?.getAttribute?.('data-modal-observation-id') ??
        'unresolved-reference'
      );
    })
    .join(' ');
}

function accessibleName(document, element) {
  const direct = element.getAttribute?.('aria-label');
  if (typeof direct === 'string' && direct.trim() !== '') return direct.trim();
  const labelledBy = element.getAttribute?.('aria-labelledby');
  if (typeof labelledBy !== 'string') return undefined;
  const value = document.getElementById?.(labelledBy)?.textContent?.trim();
  return typeof value === 'string' && value !== '' ? value : undefined;
}

function matchingElements(document, target) {
  const matches = [...(document.querySelectorAll?.('[data-modal-id]') ?? [])].filter(
    (element) => observationId(element, '') === target,
  );
  const byId = document.getElementById?.(target);
  if (byId !== null && byId !== undefined && !matches.includes(byId)) matches.push(byId);
  if (target === 'background' && matches.length === 0) {
    const fixtureRoot = document.querySelector?.('[data-modal-fixture-root]');
    if (fixtureRoot !== null && fixtureRoot !== undefined) matches.push(fixtureRoot);
  }
  return matches;
}

function backgroundClaimElements(document) {
  const elements = [...matchingElements(document, 'background')];
  const fixtureRoot = document.querySelector?.('[data-modal-fixture-root]');
  if (fixtureRoot !== null && fixtureRoot !== undefined) elements.push(fixtureRoot);
  elements.push(
    ...(document.querySelectorAll?.(
      '[data-modal-fixture-root], [data-modal-id="background"], [inert], [aria-hidden="true"]',
    ) ?? []),
  );
  return [...new Set(elements)].filter((element) => element.isConnected !== false);
}

function uniqueValues(values) {
  const seen = new Set();
  return values.filter((value) => {
    const key = JSON.stringify(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function ambiguousValue(values) {
  const unique = uniqueValues(values);
  if (unique.length === 0) return 'unobserved';
  return unique.length === 1 ? unique[0] : unique;
}

function operationSnapshot(trace, operationIndex) {
  return trace.find(
    (entry) => entry.phase === 'after-operation' && entry.operationIndex === operationIndex,
  )?.snapshot;
}

function connectedDialogCount(snapshot) {
  return (
    snapshot?.roles?.filter(({ role }) => role === 'dialog' || role === 'alertdialog').length ?? 0
  );
}

function directState(snapshot, target, name) {
  return snapshot.states.filter((state) => state.target === target && state.name === name);
}

function singleStateValue(snapshot, target, name) {
  const matches = directState(snapshot, target, name);
  return matches.length === 1 ? matches[0].value : undefined;
}

function observedScrollClaimCount(snapshot) {
  const count = singleStateValue(snapshot, 'page-scroll-claim', 'remaining-count');
  return Number.isSafeInteger(count) && count >= 0 ? count : undefined;
}

function observedScrollClaims(snapshot) {
  const claims = snapshot?.resources?.claims;
  if (!Array.isArray(claims)) return undefined;
  const scrollClaims = claims.filter(({ kind }) => kind === 'scroll-lock');
  return scrollClaims.every(
    ({ id, owner }) =>
      Number.isSafeInteger(id) && id > 0 && typeof owner === 'string' && owner.length > 0,
  ) &&
    new Set(scrollClaims.map(({ id }) => id)).size === scrollClaims.length &&
    new Set(scrollClaims.map(({ owner }) => owner)).size === scrollClaims.length
    ? scrollClaims.map(({ id, owner }) => ({ id, owner }))
    : undefined;
}

function observedScrollClaimOwners(snapshot) {
  return observedScrollClaims(snapshot)?.map(({ owner }) => owner);
}

function scrollClaimsMatchLock(snapshot) {
  const count = observedScrollClaimCount(snapshot);
  const active = singleStateValue(snapshot, 'page-scroll-lock', 'active');
  return count !== undefined && active === count > 0;
}

function validScrollClaimSequence(probe, scenario, trace) {
  const baseline = trace[0]?.snapshot;
  let previousClaims = observedScrollClaims(baseline);
  if (
    previousClaims === undefined ||
    previousClaims.length !== 0 ||
    !scrollClaimsMatchLock(baseline)
  ) {
    return false;
  }
  for (const index of probe.operationIndexes ?? []) {
    const snapshot = operationSnapshot(trace, index);
    const currentClaims = observedScrollClaims(snapshot);
    const operation = scenario.operations[index];
    if (currentClaims === undefined || !scrollClaimsMatchLock(snapshot)) return false;
    const previousById = new Map(previousClaims.map((claim) => [claim.id, claim]));
    const currentById = new Map(currentClaims.map((claim) => [claim.id, claim]));
    const retainedClaimsStable = currentClaims.every(
      (claim) => previousById.get(claim.id)?.owner === claim.owner || !previousById.has(claim.id),
    );
    const added = currentClaims.filter(({ id }) => !previousById.has(id));
    const removed = previousClaims.filter(({ id }) => !currentById.has(id));
    if (
      !retainedClaimsStable ||
      (operation?.operation === 'open' &&
        (added.length !== 1 || added[0].owner !== operation.target || removed.length !== 0)) ||
      (operation?.operation === 'close' &&
        (added.length !== 0 || removed.length !== 1 || removed[0].owner !== operation.target)) ||
      (!['open', 'close'].includes(operation?.operation) &&
        (added.length !== 0 || removed.length !== 0))
    ) {
      return false;
    }
    previousClaims = currentClaims;
  }
  return true;
}

function fallbackProbeFact(probe) {
  if (probe.category === 'roles') return { role: 'unobserved', name: 'unobserved' };
  if (probe.category === 'relationships') {
    return {
      source: probe.target ?? 'unobserved',
      name: probe.property,
      target: 'unobserved',
    };
  }
  if (probe.category === 'states') {
    return { target: probe.target ?? 'unobserved', name: probe.property, value: 'unobserved' };
  }
  if (probe.category === 'focus') return { target: 'unobserved' };
  if (probe.category === 'events') {
    return { target: probe.target ?? 'unobserved', type: 'unobserved' };
  }
  if (probe.category === 'announcements') return { message: 'unobserved' };
  return `unobserved-${probe.id}`;
}

function roleProbeFact(probe, document) {
  const facts = matchingElements(document, probe.target).flatMap((element) => {
    const role = element.getAttribute?.('role');
    const name = accessibleName(document, element);
    return typeof role === 'string' && name !== undefined ? [{ role, name }] : [];
  });
  const unique = uniqueValues(facts);
  if (unique.length === 1) return unique[0];
  if (unique.length > 1) return { role: 'ambiguous', name: 'ambiguous' };
  return fallbackProbeFact(probe);
}

function relationshipProbeFact(probe, document, snapshot, trace) {
  const direct = snapshot.relationships.filter(
    ({ source, name }) => source === probe.target && name === probe.property,
  );
  if (direct.length === 1) return direct[0];
  if (direct.length > 1) {
    return { source: probe.target, name: probe.property, target: 'ambiguous-targets' };
  }
  const related = probe.relatedTarget;
  const currentDialogs = connectedDialogCount(snapshot);
  const previousDialogs = connectedDialogCount(trace.at(-1)?.snapshot);
  const active = snapshot.focus.target;
  const measured =
    probe.property === 'contains-focus'
      ? active !== 'document-body' && currentDialogs > 0
      : probe.property === 'topmost-over' || probe.property === 'owned-by'
        ? currentDialogs >= 2
        : probe.property === 'shares-scroll-owner-with'
          ? (observedScrollClaimOwners(snapshot)?.length ?? 0) >= 2 &&
            scrollClaimsMatchLock(snapshot)
          : probe.property === 'restores-focus-inside'
            ? previousDialogs >= 2 && currentDialogs === 1 && active !== 'document-body'
            : probe.property === 'outside-of'
              ? matchingElements(document, 'modal-backdrop').length > 0 && currentDialogs > 0
              : probe.property === 'opened-by'
                ? currentDialogs > 0
                : probe.property === 'succeeds-to'
                  ? matchingElements(document, related).some(
                      (element) => element.isConnected !== false,
                    )
                  : probe.property === 'same-identity-as'
                    ? false
                    : probe.property === 'owns'
                      ? currentDialogs > 0 ||
                        [...(document.querySelectorAll?.('[data-modal-portal]') ?? [])].some(
                          (portal) => portal.isConnected !== false,
                        )
                      : false;
  return measured && typeof related === 'string'
    ? { source: probe.target, name: probe.property, target: related }
    : fallbackProbeFact(probe);
}

function stateProbeFact(probe, document, snapshot, trace, action, scenario) {
  const direct = directState(snapshot, probe.target, probe.property);
  if (direct.length > 0) {
    return {
      target: probe.target,
      name: probe.property,
      value: ambiguousValue(direct.map(({ value }) => value)),
    };
  }
  const elements = matchingElements(document, probe.target);
  const element = elements[0];
  const active = snapshot.focus.target;
  let value = 'unobserved';
  if (probe.property === 'inert') {
    value =
      elements.length > 0 &&
      elements.every((candidate) => candidate.inert === true || candidate.hasAttribute?.('inert'));
  } else if (
    probe.property === 'initial-focus-received' ||
    probe.property === 'fallback-received'
  ) {
    value = active === probe.target;
  } else if (probe.property === 'accessibility-branch') {
    value = elements.some(
      (candidate) => candidate.inert === true || candidate.getAttribute?.('aria-hidden') === 'true',
    )
      ? 'absent'
      : 'present';
  } else if (probe.property === 'named') {
    value = elements.length === 1 && accessibleName(document, element) !== undefined;
  } else if (probe.property === 'tab-eligible') {
    value =
      elements.length === 1 &&
      element.isConnected !== false &&
      element.hidden !== true &&
      element.disabled !== true &&
      element.getAttribute?.('tabindex') !== '-1';
  } else if (probe.property === 'focus-escaped') {
    value = active === 'document-body';
  } else if (probe.property === 'owns-escape' || probe.property === 'owns-focus') {
    value =
      connectedDialogCount(snapshot) >= 2 &&
      ['child-modal-safe-target', 'second-modal-safe-target'].includes(active);
  } else if (probe.property === 'owns-inert-branch') {
    value =
      connectedDialogCount(snapshot) >= 2 &&
      matchingElements(document, 'background').some(
        (candidate) =>
          candidate.inert === true || candidate.getAttribute?.('aria-hidden') === 'true',
      );
  } else if (probe.property === 'owns-scroll-claim') {
    value =
      (observedScrollClaimOwners(snapshot)?.length ?? 0) >= 2 && scrollClaimsMatchLock(snapshot);
  } else if (probe.property === 'logical-open') {
    value = elements.some((candidate) => candidate.isConnected !== false);
  } else if (probe.property === 'dismisses') {
    value = connectedDialogCount(trace.at(-2)?.snapshot) > connectedDialogCount(snapshot);
  } else if (probe.property === 'close-request-count') {
    value = snapshot.events.filter(
      ({ target, type }) => target === probe.target && /close-request/iu.test(type),
    ).length;
  } else if (probe.property === 'logical-open-before-commit') {
    value = connectedDialogCount(snapshot) > 0;
  } else if (probe.property === 'logical-open-after-commit') {
    value = connectedDialogCount(snapshot) > 0;
  } else if (probe.property === 'maximum-claim-count') {
    const counts = (probe.operationIndexes ?? []).map((index) =>
      observedScrollClaimCount(operationSnapshot(trace, index)),
    );
    value =
      counts.some((count) => count === undefined) ||
      !validScrollClaimSequence(probe, scenario, trace)
        ? 'unobserved'
        : Math.max(0, ...counts);
  } else if (probe.property === 'final-claim-count') {
    value = observedScrollClaimCount(snapshot) ?? 'unobserved';
  } else if (probe.property === 'resource-claim-count') {
    const portalCount = [...(document.querySelectorAll?.('[data-modal-portal]') ?? [])].filter(
      (portal) => portal.isConnected !== false,
    ).length;
    const scrollClaims = observedScrollClaimCount(snapshot);
    value = Math.max(connectedDialogCount(snapshot), portalCount, scrollClaims ?? 0);
  } else if (probe.property === 'shift') {
    const before = singleStateValue(trace[0]?.snapshot, 'page-layout', 'measured-position');
    const after = singleStateValue(snapshot, 'page-layout', 'measured-position');
    value =
      isPlainRecord(before) &&
      isPlainRecord(after) &&
      Number.isFinite(before.left) &&
      Number.isFinite(before.top) &&
      Number.isFinite(after.left) &&
      Number.isFinite(after.top)
        ? Math.max(Math.abs(after.left - before.left), Math.abs(after.top - before.top))
        : 'unobserved';
  } else if (probe.property === 'changed') {
    const before = singleStateValue(
      trace[0]?.snapshot,
      'page-scroll-position',
      'measured-position',
    );
    const after = singleStateValue(snapshot, 'page-scroll-position', 'measured-position');
    value =
      isPlainRecord(before) &&
      isPlainRecord(after) &&
      Number.isFinite(before.x) &&
      Number.isFinite(before.y) &&
      Number.isFinite(after.x) &&
      Number.isFinite(after.y)
        ? before.x !== after.x || before.y !== after.y
        : 'unobserved';
  } else if (probe.property === 'semantics-active') {
    value = connectedDialogCount(snapshot) > 0;
  } else if (probe.property === 'owner-count') {
    value = connectedDialogCount(snapshot);
  } else if (probe.property === 'restoration-wins') {
    value =
      active === probe.target ||
      (probe.target === 'connected-meaningful-opener' && active === 'connected-opener');
  } else if (probe.property === 'connected') {
    value = elements.some((candidate) => candidate.isConnected !== false);
  } else if (probe.property === 'focus-received') {
    value = active === probe.target;
  } else if (probe.property === 'orphaned') {
    value =
      [...(document.querySelectorAll?.('[data-modal-portal]') ?? [])].some(
        (portal) => portal.isConnected !== false,
      ) && connectedDialogCount(snapshot) === 0;
  } else if (probe.property === 'duplicate-count') {
    const activationCount = action?.surfaces?.filter(
      (surface) => surface === 'hydrated-input',
    ).length;
    value = Number.isSafeInteger(activationCount) ? Math.max(0, activationCount - 1) : 'unobserved';
  }
  return { target: probe.target, name: probe.property, value };
}

function focusProbeFact(probe, snapshot, trace) {
  const current = snapshot.focus.target;
  if (probe.property === 'current') return { target: current };
  const history = (probe.operationIndexes ?? []).map(
    (index) => operationSnapshot(trace, index)?.focus.target ?? 'unobserved',
  );
  if (probe.property === 'ordered-history') return { target: history.join('-then-') };
  if (probe.property === 'directional-parent-target') {
    const direction = snapshot.direction ?? 'ltr';
    return {
      target: current === 'document-body' ? current : `${direction}-parent-modal-safe-target`,
    };
  }
  if (probe.property === 'opener-after-outside-gesture') {
    return {
      target: /opener/iu.test(current) ? 'modal-opener-after-complete-outside-gesture' : current,
    };
  }
  if (probe.property === 'open-until-commit') {
    const counts = (probe.operationIndexes ?? []).map((index) =>
      connectedDialogCount(operationSnapshot(trace, index)),
    );
    return {
      target:
        counts.length === 3 && counts[0] > 0 && counts[1] > 0 && counts[2] === 0
          ? 'controlled-modal-until-close-commit'
          : 'controlled-modal-transition-observed-otherwise',
    };
  }
  if (probe.property === 'first-opener-after-release') {
    return {
      target: /opener/iu.test(current) ? 'first-modal-opener-after-final-release' : current,
    };
  }
  if (probe.property === 'reopened-safe-target') {
    return { target: current === 'modal-safe-target' ? 'reopened-modal-safe-target' : current };
  }
  if (probe.property === 'parent-successor') {
    return { target: /opener|successor/iu.test(current) ? 'parent-modal-successor' : current };
  }
  if (probe.property === 'meaningful-opener-or-successor') {
    return {
      target: /opener|successor/iu.test(current)
        ? 'meaningful-opener-or-documented-successor'
        : current,
    };
  }
  if (probe.property === 'server-unchanged') return { target: current };
  if (probe.property === 'pre-hydration') {
    const baseline = singleStateValue(snapshot, 'document-focus', 'pre-hydration-target');
    const moved = singleStateValue(snapshot, 'focus', 'moved-during-hydration');
    return typeof baseline === 'string' && moved === false
      ? { target: 'pre-hydration-focus-target' }
      : { target: current };
  }
  return fallbackProbeFact(probe);
}

function eventProbeFact(probe, snapshot, action, trace) {
  const previousEvents = trace.at(-2)?.snapshot.events ?? [];
  const cumulative = previousEvents.every((event, index) =>
    sameLiteral(event, snapshot.events[index]),
  );
  const phaseEvents = cumulative ? snapshot.events.slice(previousEvents.length) : snapshot.events;
  const targetEvents = phaseEvents.filter(({ target }) => target === probe.target);
  const exact = targetEvents.filter(
    ({ target, type }) => target === probe.target && type === probe.property,
  );
  if (exact.length === 1 && targetEvents.length === 1) return exact[0];
  if (probe.property === 'activated-once') {
    const count = action?.surfaces?.filter((surface) => surface === probe.target).length;
    if (action?.dispatched === true && action.prevented !== true && count === 1) {
      return { target: probe.target, type: probe.property };
    }
  }
  if (probe.property.startsWith('directional-')) {
    const type = probe.property.slice('directional-'.length);
    const source = phaseEvents.find(
      (event) => event.target === probe.target && event.type === type,
    );
    if (source !== undefined) {
      const direction = snapshot.direction ?? 'ltr';
      return {
        target:
          probe.target === 'parent-modal-safe-target'
            ? `${direction}-parent-modal-safe-target`
            : `${direction}-${probe.target}`,
        type,
      };
    }
    const previousDialogs = connectedDialogCount(trace.at(-2)?.snapshot);
    const currentDialogs = connectedDialogCount(snapshot);
    const direction = snapshot.direction ?? 'ltr';
    if (
      type === 'escape-owned' &&
      action?.operation === 'press' &&
      /escape/iu.test(action.target) &&
      previousDialogs >= 2 &&
      currentDialogs === 1
    ) {
      return { target: `${direction}-child-modal`, type };
    }
    if (
      type === 'focus-restored' &&
      previousDialogs >= 2 &&
      currentDialogs === 1 &&
      ['modal-safe-target', 'parent-modal-safe-target'].includes(snapshot.focus.target)
    ) {
      return { target: `${direction}-parent-modal-safe-target`, type };
    }
  }
  const previousSnapshot = trace.at(-2)?.snapshot;
  const previousDialogs = connectedDialogCount(previousSnapshot);
  const currentDialogs = connectedDialogCount(snapshot);
  if (
    probe.property === 'initial-focus-skipped' &&
    snapshot.focus.target !== probe.target &&
    currentDialogs > 0
  ) {
    return { target: probe.target, type: probe.property };
  }
  if (
    probe.property === 'forward-tab-wrapped' &&
    action?.operation === 'press' &&
    action.target === 'tab-from-last-target' &&
    action.surfaces?.includes('last-eligible-target') &&
    ['first-eligible-target', 'first-eligible-target-after-wrap'].includes(snapshot.focus.target)
  ) {
    return { target: probe.target, type: probe.property };
  }
  if (
    probe.property === 'reverse-tab-wrapped' &&
    action?.operation === 'press' &&
    /shift-tab-from-first-target/iu.test(action.target) &&
    action.surfaces?.includes('first-eligible-target') &&
    snapshot.focus.target === 'last-eligible-target'
  ) {
    return { target: probe.target, type: probe.property };
  }
  if (
    probe.property === 'dynamic-targets-recomputed' &&
    action?.operation === 'updateContent' &&
    action.target === 'hide-disable-remove-tab-targets' &&
    action.mutations?.length === 3 &&
    action.mutations.every(({ changed }) => changed === true)
  ) {
    return { target: probe.target, type: probe.property };
  }
  if (
    probe.property === 'outside-origin-close-requested-once' &&
    action?.operation === 'point' &&
    action.target === 'outside-down-up' &&
    action.prevented !== true &&
    sameLiteral(action.events, ['pointerdown', 'pointerup']) &&
    previousDialogs === 1 &&
    currentDialogs === 0
  ) {
    return { target: probe.target, type: probe.property };
  }
  if (probe.property === 'incomplete-pointer-sequences-ignored') {
    const counts = (probe.operationIndexes ?? []).map((index) =>
      connectedDialogCount(operationSnapshot(trace, index)),
    );
    if (counts.length > 0 && counts.every((count) => count === 1)) {
      return { target: probe.target, type: probe.property };
    }
  }
  if (
    probe.property === 'close-requested-once' &&
    phaseEvents.filter(
      ({ target, type }) => target === probe.target && /^close-requested(?:-once)?$/u.test(type),
    ).length === 1 &&
    currentDialogs > 0
  ) {
    return { target: probe.target, type: probe.property };
  }
  if (
    probe.property === 'controlled-close-committed' &&
    action?.target === 'controlled-close-commit' &&
    previousDialogs === 1 &&
    currentDialogs === 0
  ) {
    return { target: probe.target, type: probe.property };
  }
  if (
    probe.property === 'claim-acquired-per-modal' &&
    action?.operation === 'open' &&
    observedScrollClaimOwners(trace.at(-2)?.snapshot)?.length === 1 &&
    observedScrollClaimOwners(snapshot)?.length === 2 &&
    observedScrollClaimOwners(snapshot).filter(
      (owner) =>
        owner === action.target &&
        !observedScrollClaimOwners(trace.at(-2)?.snapshot).includes(owner),
    ).length === 1 &&
    scrollClaimsMatchLock(trace.at(-2)?.snapshot) &&
    scrollClaimsMatchLock(snapshot)
  ) {
    return { target: probe.target, type: probe.property };
  }
  if (
    probe.property === 'final-claim-released' &&
    action?.operation === 'close' &&
    observedScrollClaimOwners(trace.at(-2)?.snapshot)?.length === 1 &&
    observedScrollClaimOwners(trace.at(-2)?.snapshot)?.[0] === action.target &&
    observedScrollClaimOwners(snapshot)?.length === 0 &&
    scrollClaimsMatchLock(trace.at(-2)?.snapshot) &&
    scrollClaimsMatchLock(snapshot)
  ) {
    return { target: probe.target, type: probe.property };
  }
  if (
    probe.property === 'scroll-resumed' &&
    action?.operation === 'point' &&
    action.target === 'page-scroll-surface' &&
    action.dispatched === true &&
    action.prevented !== true &&
    singleStateValue(snapshot, 'page-scroll-lock', 'active') === false
  ) {
    return { target: probe.target, type: probe.property };
  }
  if (
    probe.property === 'close-committed' &&
    action?.operation === 'close' &&
    previousDialogs === 1 &&
    currentDialogs === 0
  ) {
    return { target: probe.target, type: probe.property };
  }
  if (
    probe.property === 'single-owner-created' &&
    action?.operation === 'open' &&
    previousDialogs === 0 &&
    currentDialogs === 1
  ) {
    return { target: probe.target, type: probe.property };
  }
  if (
    probe.property === 'closed-or-transferred-before-parent-close' ||
    probe.property === 'closed-by-single-explicit-operation'
  ) {
    const childCloseIndex = phaseEvents.findIndex(
      ({ target, type }) => target === 'child-modal' && type === 'closed',
    );
    const parentCloseIndex = phaseEvents.findIndex(
      ({ target, type }) => ['modal-panel', 'parent-modal'].includes(target) && type === 'closed',
    );
    if (
      action?.operation === 'close' &&
      action.target === 'parent-modal' &&
      previousDialogs >= 2 &&
      currentDialogs === 0 &&
      childCloseIndex !== -1 &&
      parentCloseIndex > childCloseIndex
    ) {
      return { target: probe.target, type: probe.property };
    }
  }
  const active = snapshot.focus.target;
  const focusAliases = {
    'connected-meaningful-opener': ['connected-opener'],
    'parent-modal-safe-target': ['modal-safe-target', 'parent-modal-safe-target'],
  };
  const focusOutcome =
    /focus-applied|focus-recovered|focus-restored/iu.test(probe.property) &&
    (active === probe.target || focusAliases[probe.target]?.includes(active) === true);
  if (focusOutcome) return { target: probe.target, type: probe.property };
  return fallbackProbeFact(probe);
}

function announcementProbeFact(probe, snapshot) {
  const messages = uniqueValues(snapshot.announcements.map(({ message }) => message));
  return messages.length === 1 ? { message: messages[0] } : fallbackProbeFact(probe);
}

function measuredResourceCount(snapshot, target) {
  const value = singleStateValue(snapshot, target, 'remaining-count');
  return Number.isSafeInteger(value) && value >= 0 ? value : undefined;
}

function resourceEntries(snapshot, key) {
  const entries = snapshot?.resources?.[key];
  return Array.isArray(entries) ? entries : [];
}

function resourceEntriesReleased(trace, key, matches) {
  const seen = new Set();
  for (const { snapshot } of trace.slice(0, -1)) {
    for (const entry of resourceEntries(snapshot, key).filter(matches)) seen.add(entry.id);
  }
  const finalSnapshot = trace.at(-1)?.snapshot;
  if (seen.size === 0 || resourceEntries(finalSnapshot, key).some(matches)) return false;
  const lifecycleKey =
    key === 'listenerEntries'
      ? 'listenerLifecycles'
      : key === 'timerEntries'
        ? 'timerLifecycles'
        : undefined;
  if (lifecycleKey === undefined) return true;
  const matchingLifecycles = resourceEntries(finalSnapshot, lifecycleKey).filter(matches);
  return (
    matchingLifecycles.length === seen.size &&
    matchingLifecycles.every(({ id }) => seen.has(id)) &&
    matchingLifecycles.every(
      ({ acquiredOperation, acquiredPhase, releaseCount, releasedOperation, releasedPhase }) =>
        acquiredPhase === 'operation' &&
        RESOURCE_ACQUISITION_OPERATIONS.has(acquiredOperation) &&
        releaseCount === 1 &&
        ((releasedPhase === 'operation' && RESOURCE_RELEASE_OPERATIONS.has(releasedOperation)) ||
          (releasedPhase === 'cleanup' && releasedOperation === 'teardown')),
    )
  );
}

function resourceCountReleased(trace, target) {
  const observations = trace.map((entry) => ({
    count: measuredResourceCount(entry.snapshot, target),
    operation: entry.operation?.operation,
    phase: entry.phase,
  }));
  if (observations.some(({ count }) => count === undefined)) return false;
  let acquired = observations[0].count;
  let released = 0;
  for (let index = 1; index < observations.length; index += 1) {
    const current = observations[index];
    const delta = current.count - observations[index - 1].count;
    if (delta > 0) {
      if (current.phase !== 'after-operation' || current.operation !== 'open') return false;
      acquired += delta;
    } else if (delta < 0) {
      if (
        current.phase !== 'after-cleanup' &&
        (current.phase !== 'after-operation' || !['close', 'destroy'].includes(current.operation))
      ) {
        return false;
      }
      released -= delta;
    }
  }
  return acquired > 0 && observations.at(-1).count === 0 && released === acquired;
}

function listenerOwnedByModal(entry) {
  return /modal/iu.test(entry.owner) || ['document', 'window'].includes(entry.owner);
}

function listenerOfPurpose(purpose) {
  return (entry) => entry.purpose === purpose && listenerOwnedByModal(entry);
}

function measuredListenerPurpose(scenario) {
  const purposeByTarget = {
    'destructive-focus-guard': 'focus-restore',
    'focus-loop-listener': 'focus-loop',
    'focus-recovery-listener': 'focus-restore',
    'initial-focus-guard': 'focus-restore',
    'pointer-sequence-guard': 'pointer',
    'restoration-guard': 'focus-restore',
    'validation-focus-guard': 'focus-restore',
  };
  const purposes = new Set(
    scenario.probes
      .filter(({ category, phase }) => category === 'cleanup' && phase === 'after-cleanup')
      .map(({ target }) => purposeByTarget[target])
      .filter((purpose) => purpose !== undefined),
  );
  return purposes.size === 1 ? [...purposes][0] : 'other';
}

function allMeasuredResourcesReleased(snapshot) {
  return (
    [
      'modal-listeners',
      'background-inert-claim',
      'page-scroll-claim',
      'modal-timers',
      'modal-guards',
      'modal-portals',
    ].every((target) => measuredResourceCount(snapshot, target) === 0) &&
    resourceEntries(snapshot, 'listenerEntries').length === 0 &&
    resourceEntries(snapshot, 'timerEntries').length === 0 &&
    resourceEntries(snapshot, 'claims').length === 0
  );
}

function targetObservedBeforeCleanup(trace, target) {
  return trace.slice(0, -1).some(({ snapshot }) => snapshotObservedTarget(snapshot, target));
}

function snapshotObservedTarget(snapshot, target) {
  return snapshot.states.some((state) => state.target === target);
}

function cleanupProbeFact(probe, document, snapshot, action, trace) {
  const portals = [...(document.querySelectorAll?.('[data-modal-portal]') ?? [])].filter(
    (portal) => portal.isConnected !== false,
  );
  const guards = [
    ...(document.querySelectorAll?.(
      '[data-modal-focus-guard], [data-focus-guard], [data-modal-guard]',
    ) ?? []),
  ].filter((guard) => guard.isConnected !== false);
  const fixtureRoot = document.querySelector?.('[data-modal-fixture-root]');
  const rootUnmounted = fixtureRoot?.hasChildNodes?.() === false;
  const backgrounds = backgroundClaimElements(document);
  const backgroundRestored =
    backgrounds.length > 0 &&
    backgrounds.every(
      (element) => element.inert !== true && element.getAttribute?.('aria-hidden') !== 'true',
    );
  if (probe.target === 'background' && probe.property === 'interactive') {
    if (backgroundRestored) return 'background-interactive';
  } else if (probe.target === 'background-accessibility-branch' && probe.property === 'restored') {
    if (backgroundRestored) return 'background-accessibility-branch-restored';
  } else if (probe.target === 'focus-loop-listener' && probe.property === 'released') {
    if (resourceEntriesReleased(trace, 'listenerEntries', listenerOfPurpose('focus-loop'))) {
      return 'focus-loop-listener-released';
    }
  } else if (probe.target === 'focus-recovery-listener' && probe.property === 'released') {
    if (resourceEntriesReleased(trace, 'listenerEntries', listenerOfPurpose('focus-restore'))) {
      return 'focus-recovery-listener-released';
    }
  } else if (probe.target === 'restoration-guard' && probe.property === 'released') {
    if (resourceEntriesReleased(trace, 'listenerEntries', listenerOfPurpose('focus-restore'))) {
      return 'restoration-guard-released';
    }
  } else if (probe.target === 'pointer-sequence-guard' && probe.property === 'released') {
    if (resourceEntriesReleased(trace, 'listenerEntries', listenerOfPurpose('pointer'))) {
      return 'pointer-sequence-guard-released';
    }
  } else if (
    ['initial-focus-guard', 'validation-focus-guard', 'destructive-focus-guard'].includes(
      probe.target,
    ) &&
    probe.property === 'released'
  ) {
    if (
      rootUnmounted &&
      guards.length === 0 &&
      (resourceCountReleased(trace, 'modal-guards') ||
        resourceEntriesReleased(trace, 'listenerEntries', listenerOfPurpose('focus-restore')))
    ) {
      if (probe.target === 'initial-focus-guard') return 'initial-focus-guard-released';
      if (probe.target === 'validation-focus-guard') return 'validation-focus-guard-released';
      return 'destructive-focus-guard-released';
    }
  } else if (probe.target === 'panel-fallback-focus' && probe.property === 'released') {
    if (rootUnmounted && targetObservedBeforeCleanup(trace, 'modal-panel')) {
      return 'panel-fallback-focus-released';
    }
  } else if (probe.target === 'controlled-layer-resources' && probe.property === 'released') {
    if (rootUnmounted && allMeasuredResourcesReleased(snapshot)) {
      return 'controlled-layer-resources-released';
    }
  } else if (probe.target === 'committed-close-semantics' && probe.property === 'released') {
    if (connectedDialogCount(snapshot) === 0 && portals.length === 0) {
      return 'committed-close-semantics-released';
    }
  } else if (probe.target === 'committed-close-resources' && probe.property === 'released') {
    if (rootUnmounted && allMeasuredResourcesReleased(snapshot)) {
      return 'committed-close-resources-released';
    }
  } else if (probe.target === 'child-ownership' && probe.property === 'released') {
    if (
      targetObservedBeforeCleanup(trace, 'child-modal') &&
      !snapshotObservedTarget(snapshot, 'child-modal') &&
      !resourceEntries(snapshot, 'claims').some(({ owner }) => owner === 'child-modal')
    ) {
      return 'child-ownership-released';
    }
  } else if (probe.target === 'parent-ownership' && probe.property === 'released') {
    if (
      targetObservedBeforeCleanup(trace, 'parent-modal') &&
      !snapshotObservedTarget(snapshot, 'parent-modal') &&
      !resourceEntries(snapshot, 'claims').some(({ owner }) => owner === 'parent-modal')
    ) {
      return 'parent-ownership-released';
    }
  } else if (probe.target === 'portal' && probe.property === 'no-orphan') {
    if (resourceCountReleased(trace, 'modal-portals') && portals.length === 0) {
      return 'no-orphan-portal';
    }
  } else if (probe.target === 'modal-portal' && probe.property === 'removed') {
    if (resourceCountReleased(trace, 'modal-portals') && portals.length === 0) {
      return 'modal-portal-removed';
    }
  } else if (probe.property === 'retained') {
    if (probe.target === 'single-event-owner') {
      if (
        action?.dispatched === true &&
        action.prevented !== true &&
        action.surfaces?.filter((surface) => surface === 'hydrated-input').length === 1
      ) {
        return 'single-event-owner-retained';
      }
    } else if (probe.target === 'single-modal-owner') {
      if (connectedDialogCount(snapshot) === 1) return 'single-modal-owner-retained';
    } else if (probe.target === 'parent-scroll-claim') {
      if (observedScrollClaimOwners(snapshot)?.length === 1 && scrollClaimsMatchLock(snapshot)) {
        return 'parent-scroll-claim-retained';
      }
    }
  } else if (probe.property === 'released') {
    if (probe.target === 'child-scroll-claim') {
      const previous = trace.at(-2)?.snapshot;
      if (
        observedScrollClaimOwners(previous)?.length === 2 &&
        observedScrollClaimOwners(snapshot)?.length === 1 &&
        observedScrollClaimOwners(previous).filter(
          (owner) => !observedScrollClaimOwners(snapshot).includes(owner),
        ).length === 1 &&
        scrollClaimsMatchLock(previous) &&
        scrollClaimsMatchLock(snapshot)
      ) {
        return 'child-scroll-claim-released';
      }
    } else if (probe.target === 'page-scroll-lock') {
      if (
        connectedDialogCount(snapshot) === 0 &&
        observedScrollClaimOwners(snapshot)?.length === 0 &&
        scrollClaimsMatchLock(snapshot)
      ) {
        return 'page-scroll-lock-released';
      }
    }
  } else if (probe.property === 'resumed') {
    if (
      probe.target === 'page-scroll' &&
      singleStateValue(snapshot, 'page-scroll-lock', 'active') === false &&
      action?.operation === 'point' &&
      action.target === 'page-scroll-surface' &&
      action.dispatched === true &&
      action.prevented !== true
    ) {
      return 'page-scroll-resumed';
    }
  } else if (probe.property === 'released-once') {
    if (
      probe.target === 'listeners' &&
      resourceEntriesReleased(trace, 'listenerEntries', () => true)
    ) {
      return 'listeners-released-once';
    }
    if (probe.target === 'inert' && resourceCountReleased(trace, 'background-inert-claim')) {
      return 'inert-released-once';
    }
    if (probe.target === 'scroll' && resourceCountReleased(trace, 'page-scroll-claim')) {
      return 'scroll-released-once';
    }
    if (probe.target === 'timers' && resourceEntriesReleased(trace, 'timerEntries', () => true)) {
      return 'timers-released-once';
    }
    if (probe.target === 'guards' && resourceCountReleased(trace, 'modal-guards')) {
      return 'guards-released-once';
    }
    if (probe.target === 'portal' && resourceCountReleased(trace, 'modal-portals')) {
      return 'portal-released-once';
    }
  }
  return `cleanup-not-observed-${probe.target}`;
}

function observeProbeResults({
  action,
  document,
  phase,
  operationIndex,
  scenario,
  snapshot,
  trace,
}) {
  const currentTrace = [
    ...trace,
    {
      phase,
      ...(phase === 'after-operation' ? { operationIndex } : {}),
      snapshot,
    },
  ];
  return (scenario.probes ?? [])
    .filter(
      (probe) =>
        probe.phase === phase &&
        (phase !== 'after-operation' || probe.operationIndex === operationIndex),
    )
    .map((probe) => {
      let fact;
      if (probe.category === 'roles') fact = roleProbeFact(probe, document);
      else if (probe.category === 'relationships') {
        fact = relationshipProbeFact(probe, document, snapshot, currentTrace.slice(0, -1));
      } else if (probe.category === 'states') {
        fact = stateProbeFact(probe, document, snapshot, currentTrace, action, scenario);
      } else if (probe.category === 'focus') {
        fact = focusProbeFact(probe, snapshot, currentTrace);
      } else if (probe.category === 'events') {
        fact = eventProbeFact(probe, snapshot, action, currentTrace);
      } else if (probe.category === 'announcements') fact = announcementProbeFact(probe, snapshot);
      else fact = cleanupProbeFact(probe, document, snapshot, action, currentTrace);
      return { id: probe.id, category: probe.category, fact };
    });
}

function observeBrowserSnapshot({ document, fixture, captureResources }) {
  const dialogs = [...(document.querySelectorAll?.('[role="dialog"], [role="alertdialog"]') ?? [])];
  const roles = dialogs.flatMap((dialog) => {
    const role = dialog.getAttribute?.('role');
    const name = accessibleName(document, dialog);
    return typeof role === 'string' && name !== undefined ? [{ role, name }] : [];
  });
  const relationships = [];
  const states = [];
  const observedElements = [...(document.querySelectorAll?.('[data-modal-id]') ?? [])];
  for (const element of observedElements) {
    const target = observationId(element, 'modal-element');
    for (const [attribute, name] of [
      ['aria-labelledby', 'labelled-by'],
      ['aria-describedby', 'described-by'],
      ['aria-controls', 'controls'],
      ['aria-owns', 'owns'],
    ]) {
      const value = element.getAttribute?.(attribute);
      if (typeof value === 'string' && value !== '') {
        relationships.push({
          source: target,
          name,
          target: relationshipTarget(document, value),
        });
      }
    }
    const role = element.getAttribute?.('role');
    if (role === 'dialog' || role === 'alertdialog') {
      states.push({
        target,
        name: 'aria-modal',
        value: element.getAttribute?.('aria-modal') === 'true',
      });
    }
    if (element.hasAttribute?.('aria-invalid')) {
      states.push({
        target,
        name: 'invalid',
        value: element.getAttribute?.('aria-invalid') === 'true',
      });
    }
    if (element.hasAttribute?.('inert') || element.inert === true) {
      states.push({ target, name: 'inert', value: element.inert === true });
    }
    if (element.disabled === true) states.push({ target, name: 'disabled', value: true });
    if (element.hidden === true) states.push({ target, name: 'hidden', value: true });
    const tabIndex = element.getAttribute?.('tabindex');
    if (typeof tabIndex === 'string' && /^-?\d+$/u.test(tabIndex)) {
      states.push({ target, name: 'tabindex', value: Number(tabIndex) });
    }
  }
  const portals = [...(document.querySelectorAll?.('[data-modal-portal]') ?? [])];
  for (const portal of portals) {
    states.push({
      target: observationId(portal, 'modal-portal'),
      name: 'orphaned',
      value: dialogs.length === 0 && portal.isConnected !== false,
    });
  }
  const pageScrollSurface = document.querySelector?.('[data-modal-id="page-scroll-surface"]');
  const pageLayout = pageScrollSurface?.getBoundingClientRect?.();
  if (Number.isFinite(pageLayout?.left) && Number.isFinite(pageLayout?.top)) {
    states.push({
      target: 'page-layout',
      name: 'measured-position',
      value: { left: pageLayout.left, top: pageLayout.top },
    });
  }
  const scrollX = document.defaultView?.scrollX;
  const scrollY = document.defaultView?.scrollY;
  if (Number.isFinite(scrollX) && Number.isFinite(scrollY)) {
    states.push({
      target: 'page-scroll-position',
      name: 'measured-position',
      value: { x: scrollX, y: scrollY },
    });
  }
  const scrollLockActive = [document.body, document.documentElement].some(
    (element) =>
      element?.style?.overflow === 'hidden' ||
      element?.getAttribute?.('data-modal-scroll-lock') === 'true',
  );
  states.push({
    target: 'page-scroll-lock',
    name: 'active',
    value: scrollLockActive,
  });
  const resourceSnapshot = captureResources
    ? document.defaultView?.__LYRA_MODAL_RESOURCE_TRACKER__?.snapshot?.()
    : undefined;
  if (
    isPlainRecord(resourceSnapshot) &&
    Number.isInteger(resourceSnapshot.listeners) &&
    Number.isInteger(resourceSnapshot.timers)
  ) {
    states.push({
      target: 'modal-listeners',
      name: 'remaining-count',
      value: resourceSnapshot.listeners,
    });
    states.push({
      target: 'background-inert-claim',
      name: 'remaining-count',
      value: backgroundClaimElements(document).filter(
        (element) =>
          element.isConnected !== false &&
          (element.inert === true ||
            element.hasAttribute?.('inert') ||
            element.getAttribute?.('aria-hidden') === 'true'),
      ).length,
    });
    const resourceClaims = Array.isArray(resourceSnapshot.claims) ? resourceSnapshot.claims : [];
    const scrollClaimCount = resourceClaims.filter(({ kind }) => kind === 'scroll-lock').length;
    states.push({
      target: 'page-scroll-claim',
      name: 'remaining-count',
      value: scrollClaimCount,
    });
    states.push({
      target: 'modal-timers',
      name: 'remaining-count',
      value: resourceSnapshot.timers,
    });
    states.push({
      target: 'modal-guards',
      name: 'remaining-count',
      value: [
        ...(document.querySelectorAll?.(
          '[data-modal-focus-guard], [data-focus-guard], [data-modal-guard]',
        ) ?? []),
      ].filter((element) => element.isConnected !== false).length,
    });
    states.push({
      target: 'modal-portals',
      name: 'remaining-count',
      value: portals.filter((portal) => portal.isConnected !== false).length,
    });
  }
  const active = document.activeElement;
  const focusTarget =
    active === document.body ? 'document-body' : observationId(active, 'modal-fixture-root');
  const runtimeObservation = fixture.observe?.() ?? {
    events: [],
    cleanup: [],
    diagnostics: {},
  };
  return {
    roles,
    relationships,
    states,
    focus: { target: focusTarget },
    events: structuredClone(runtimeObservation.events ?? []),
    announcements: [...(document.querySelectorAll?.('[aria-live]') ?? [])]
      .map((element) => element.textContent?.trim())
      .filter((message) => typeof message === 'string' && message !== '')
      .map((message) => ({ message })),
    ...(resourceSnapshot === undefined
      ? {}
      : {
          resources: {
            claims: Array.isArray(resourceSnapshot.claims)
              ? structuredClone(resourceSnapshot.claims)
              : [],
            listenerEntries: Array.isArray(resourceSnapshot.listenerEntries)
              ? structuredClone(resourceSnapshot.listenerEntries)
              : [],
            listenerLifecycles: Array.isArray(resourceSnapshot.listenerLifecycles)
              ? structuredClone(resourceSnapshot.listenerLifecycles)
              : [],
            listeners: resourceSnapshot.listeners,
            timerEntries: Array.isArray(resourceSnapshot.timerEntries)
              ? structuredClone(resourceSnapshot.timerEntries)
              : [],
            timerLifecycles: Array.isArray(resourceSnapshot.timerLifecycles)
              ? structuredClone(resourceSnapshot.timerLifecycles)
              : [],
            timers: resourceSnapshot.timers,
          },
        }),
  };
}

function uniqueRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    const key = JSON.stringify(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fieldsFromProbeTrace(scenario, trace) {
  const results = trace.flatMap(({ snapshot }) => snapshot.probes ?? []);
  const facts = Object.fromEntries(
    ['roles', 'relationships', 'states', 'events', 'announcements', 'cleanup'].map((category) => [
      category,
      [],
    ]),
  );
  let focus = { target: 'unobserved' };
  for (const probe of scenario.probes) {
    const matches = results.filter(
      (result) => result.id === probe.id && result.category === probe.category,
    );
    const fact = matches.length === 1 ? matches[0].fact : fallbackProbeFact(probe);
    if (probe.category === 'focus') focus = structuredClone(fact);
    else facts[probe.category].push(structuredClone(fact));
  }
  return { ...facts, focus };
}

function observationFromTrace({ cleanup, diagnostics, scenario, trace }) {
  const operationEntries = trace.filter(({ phase }) => phase !== 'after-cleanup');
  const finalEntry = operationEntries.at(-1) ?? trace.at(-1);
  const normalized =
    Array.isArray(scenario?.probes) && scenario.probes.length > 0
      ? fieldsFromProbeTrace(scenario, trace)
      : {
          roles: uniqueRecords(trace.flatMap(({ snapshot }) => snapshot.roles)),
          relationships: uniqueRecords(trace.flatMap(({ snapshot }) => snapshot.relationships)),
          states: uniqueRecords(trace.flatMap(({ snapshot }) => snapshot.states)),
          focus: structuredClone(finalEntry?.snapshot.focus ?? { target: 'modal-fixture-root' }),
          events: structuredClone(finalEntry?.snapshot.events ?? []),
          announcements: uniqueRecords(
            operationEntries.flatMap(({ snapshot }) => snapshot.announcements),
          ),
          cleanup: structuredClone(cleanup),
        };
  const observation = {
    ...normalized,
    trace: structuredClone(trace),
    diagnostics: structuredClone(diagnostics),
  };
  const errors = validateModalObservation(observation);
  if (errors.length !== 0) {
    throw new Error(`modal browser observation is invalid: ${errors.join('; ')}`);
  }
  return observation;
}

export async function executeModalBrowserScenario({ document, fixture, input, request }) {
  if (
    !sameLiteral(modalExecutionScenario(input.scenario), request.scenario) ||
    !sameLiteral(input.cell, request.cell)
  ) {
    throw new Error('modal browser scenario does not match its literal fixture request');
  }
  document.documentElement.dir = request.cell.direction;
  const preExecutionFocus = observationId(document.activeElement, 'modal-fixture-root');
  const captureResources = request.scenario.capture.includes('resources');
  const actions = [];
  const trace = [];
  const captureSnapshot = (phase, operationIndex, action) => {
    const snapshot = observeBrowserSnapshot({ document, fixture, captureResources });
    const probes = observeProbeResults({
      document,
      action,
      phase,
      operationIndex,
      scenario: request.scenario,
      snapshot,
      trace,
    });
    return { ...snapshot, ...(probes.length === 0 ? {} : { probes }) };
  };
  trace.push({ phase: 'before-operations', snapshot: captureSnapshot('before-operations') });
  for (const [operationIndex, operation] of request.scenario.operations.entries()) {
    const resourceTracker = document.defaultView?.__LYRA_MODAL_RESOURCE_TRACKER__;
    const executeOperation = () =>
      driveBrowserOperation({
        document,
        operation,
        synthesizeHover: input.synthesizeHover,
      });
    const action =
      typeof resourceTracker?.runInPhase === 'function'
        ? await resourceTracker.runInPhase(
            {
              operation: operation.operation,
              owner: operation.target,
              phase: 'operation',
              purpose: measuredListenerPurpose(request.scenario),
            },
            executeOperation,
          )
        : await executeOperation();
    actions.push(action);
    trace.push({
      phase: 'after-operation',
      operationIndex,
      operation: structuredClone(operation),
      snapshot: captureSnapshot('after-operation', operationIndex, action),
    });
    if (!action.completed) break;
  }
  return observationFromTrace({
    cleanup: [],
    scenario: request.scenario,
    trace,
    diagnostics: {
      executor: 'shared-browser-driver',
      operations: structuredClone(request.scenario.operations),
      actions,
      executionCompleted:
        actions.length === request.scenario.operations.length &&
        actions.every(({ completed }) => completed === true),
      cleanupObserved: false,
      captureResources,
      hydrate: input.hydrate === true,
      preExecutionFocus,
      postExecutionFocus: observationId(document.activeElement, 'modal-fixture-root'),
    },
  });
}

function finalizeBrowserObservation({
  document,
  execution,
  fixture,
  fixtureStatus,
  rootUnmounted,
  scenario,
}) {
  const captureResources = execution.diagnostics.captureResources === true;
  const rawCleanupSnapshot = observeBrowserSnapshot({ document, fixture, captureResources });
  const cleanupProbes = observeProbeResults({
    document,
    phase: 'after-cleanup',
    scenario,
    snapshot: rawCleanupSnapshot,
    trace: execution.trace,
  });
  const cleanupSnapshot = {
    ...rawCleanupSnapshot,
    ...(cleanupProbes.length === 0 ? {} : { probes: cleanupProbes }),
  };
  const portalCount = [...(document.querySelectorAll?.('[data-modal-portal]') ?? [])].filter(
    (portal) => portal.isConnected !== false,
  ).length;
  const cleanup = [
    'fixture-destroyed',
    ...(rootUnmounted ? ['root-unmounted'] : ['root-still-mounted']),
    ...(portalCount === 0 ? ['modal-portals-removed'] : ['modal-portals-remaining']),
  ];
  if (captureResources) {
    cleanup.push(
      cleanupSnapshot.resources?.listeners === 0
        ? 'modal-listeners-released'
        : 'modal-listeners-remaining',
      cleanupSnapshot.resources?.timers === 0 ? 'modal-timers-released' : 'modal-timers-remaining',
    );
  }
  const trace = [...execution.trace, { phase: 'after-cleanup', snapshot: cleanupSnapshot }];
  return observationFromTrace({
    cleanup,
    scenario,
    trace,
    diagnostics: {
      ...execution.diagnostics,
      cleanupObserved: true,
      fixtureStatus,
      rootUnmounted,
    },
  });
}

function captureHydrationTree(container, document) {
  return {
    dialogs: [
      ...(container.querySelectorAll?.(
        '[data-modal-panel], [role="dialog"], [role="alertdialog"]',
      ) ?? []),
    ],
    focus: observationId(document.activeElement, 'modal-fixture-root'),
    identifiers: [...(container.querySelectorAll?.('[id]') ?? [])].map((element) =>
      element.getAttribute?.('id'),
    ),
    inputValues: [...(container.querySelectorAll?.('input, textarea, select') ?? [])].map(
      (element) => element.value,
    ),
    markup: typeof container.innerHTML === 'string' ? container.innerHTML : '',
  };
}

function hydrationDiagnostics(before, after, warningCount) {
  const recoveryPerformed = before.markup !== after.markup || warningCount > 0;
  return {
    controlledStateStable: sameLiteral(before.inputValues, after.inputValues),
    firstTreeIdentical: before.markup === after.markup,
    focusMoved: before.focus !== after.focus,
    generatedIdentifiersStable: sameLiteral(before.identifiers, after.identifiers),
    inputValuesAfter: structuredClone(after.inputValues),
    inputValuesBefore: structuredClone(before.inputValues),
    modalIdentityStable:
      before.dialogs.length > 0 &&
      before.dialogs.length === after.dialogs.length &&
      before.dialogs.every((dialog, index) => dialog === after.dialogs[index]),
    preHydrationFocus: before.focus,
    recoveryPerformed,
    warningCount,
  };
}

export async function mountModalFixtureClient({
  React,
  axe,
  createModalCandidate,
  createRoot,
  document,
  hydrateRoot,
  request,
}) {
  const requestErrors = validateModalFixtureRequest(request);
  if (requestErrors.length !== 0) {
    throw new Error(`modal client request is invalid: ${requestErrors.join('; ')}`);
  }
  const container = document.querySelector('[data-modal-fixture-root]');
  if (container === null || container === undefined)
    throw new Error('modal fixture root is missing');
  const { ModalFixture } = await createModalCandidate({ React });
  const ready = Promise.withResolvers();
  let readyStatus = 'pending';
  void ready.promise.catch(() => {});
  const resolveReady = (fixture) => {
    if (readyStatus !== 'pending') return;
    readyStatus = 'ready';
    ready.resolve(fixture);
  };
  const rejectReady = (error) => {
    if (readyStatus !== 'pending') return;
    readyStatus = 'failed';
    ready.reject(error instanceof Error ? error : new Error(String(error)));
  };
  const element = React.createElement(ModalFixture, {
    request,
    onReady: resolveReady,
  });
  const renderMode = container.hasChildNodes() ? 'hydrateRoot' : 'createRoot';
  const resourceTracker = document.defaultView?.__LYRA_MODAL_RESOURCE_TRACKER__;
  const hydrationBefore =
    renderMode === 'hydrateRoot' ? captureHydrationTree(container, document) : undefined;
  const hydrationWarnings = [];
  const browserConsole = document.defaultView?.console;
  const originalConsoleError = browserConsole?.error;
  let hydrationConsoleRestored = false;
  if (renderMode === 'hydrateRoot' && typeof originalConsoleError === 'function') {
    browserConsole.error = (...args) => {
      hydrationWarnings.push(args.map(String).join(' '));
      return originalConsoleError.apply(browserConsole, args);
    };
  }
  const restoreHydrationConsole = () => {
    if (hydrationConsoleRestored) return;
    if (renderMode === 'hydrateRoot' && typeof originalConsoleError === 'function') {
      browserConsole.error = originalConsoleError;
    }
    hydrationConsoleRestored = true;
  };
  let root;
  const rootOptions = { onUncaughtError: rejectReady };
  const createReactRoot = () =>
    renderMode === 'hydrateRoot'
      ? hydrateRoot(container, element, rootOptions)
      : createRoot(container, rootOptions);
  root =
    typeof resourceTracker?.capturePersistentListeners === 'function'
      ? resourceTracker.capturePersistentListeners(
          { owner: 'react-delegated-root', target: container },
          createReactRoot,
        )
      : createReactRoot();
  if (renderMode !== 'hydrateRoot') {
    const render = () => root.render(element);
    if (typeof resourceTracker?.capturePersistentListeners === 'function') {
      resourceTracker.capturePersistentListeners(
        { owner: 'react-delegated-root', target: container },
        render,
      );
    } else {
      render();
    }
  }
  let cleaned = false;
  let cleanupOutput;
  let execution;
  return Object.freeze({
    ready: ready.promise,
    get readyStatus() {
      return readyStatus;
    },
    renderMode,
    request: structuredClone(request),
    async runScenario(input) {
      const fixture = await ready.promise;
      const hydrationAfter =
        hydrationBefore === undefined ? undefined : captureHydrationTree(container, document);
      if (hydrationAfter !== undefined) restoreHydrationConsole();
      execution = await executeModalBrowserScenario({ document, fixture, input, request });
      if (hydrationAfter !== undefined) {
        const hydration = hydrationDiagnostics(
          hydrationBefore,
          hydrationAfter,
          hydrationWarnings.length,
        );
        const trace = structuredClone(execution.trace);
        const hydrationEntryIndex = trace.findIndex(
          ({ operationIndex, phase }) => phase === 'after-operation' && operationIndex === 0,
        );
        if (hydrationEntryIndex === -1) {
          throw new Error('modal hydration execution did not capture operation zero');
        }
        const hydrationSnapshot = trace[hydrationEntryIndex].snapshot;
        hydrationSnapshot.states.push(
          { target: 'first-tree', name: 'identical', value: hydration.firstTreeIdentical },
          {
            target: 'generated-identifiers',
            name: 'stable',
            value: hydration.generatedIdentifiersStable,
          },
          {
            target: 'controlled-state',
            name: 'stable',
            value: hydration.controlledStateStable,
          },
          {
            target: 'hydration-warning',
            name: 'emitted',
            value: hydration.warningCount > 0,
          },
          {
            target: 'hydration-recovery',
            name: 'performed',
            value: hydration.recoveryPerformed,
          },
          {
            target: 'hydrated-input',
            name: 'value-lost',
            value: !hydration.controlledStateStable,
          },
          { target: 'focus', name: 'moved-during-hydration', value: hydration.focusMoved },
          {
            target: 'document-focus',
            name: 'pre-hydration-target',
            value: hydration.preHydrationFocus,
          },
        );
        if (hydration.modalIdentityStable) {
          hydrationSnapshot.relationships.push({
            source: 'hydrated-modal',
            name: 'same-identity-as',
            target: 'server-rendered-modal',
          });
        }
        for (const [traceIndex, entry] of trace.entries()) {
          if (entry.phase !== 'after-operation') continue;
          delete entry.snapshot.probes;
          const probes = observeProbeResults({
            action: execution.diagnostics.actions[entry.operationIndex],
            document,
            phase: entry.phase,
            operationIndex: entry.operationIndex,
            scenario: request.scenario,
            snapshot: entry.snapshot,
            trace: trace.slice(0, traceIndex),
          });
          if (probes.length > 0) entry.snapshot.probes = probes;
        }
        execution = observationFromTrace({
          cleanup: execution.cleanup,
          scenario: request.scenario,
          trace,
          diagnostics: {
            ...execution.diagnostics,
            hydration,
          },
        });
      }
      return execution;
    },
    async runAxe() {
      if (axe === undefined || typeof axe.run !== 'function') {
        throw new Error('axe execution is unavailable');
      }
      return axe.run(document);
    },
    async cleanup() {
      if (cleaned) {
        return Object.freeze({
          status: 'already-destroyed',
          ...(cleanupOutput?.observation === undefined
            ? {}
            : { observation: cleanupOutput.observation }),
        });
      }
      restoreHydrationConsole();
      const fixture = readyStatus === 'ready' ? await ready.promise : undefined;
      const performCleanup = async () => {
        let result;
        if (fixture === undefined) result = { status: 'destroyed' };
        else if (typeof fixture.cleanup === 'function') {
          result = cleanupResult(await fixture.cleanup());
        } else if (fixture.isDestroyed?.() === true) result = { status: 'already-destroyed' };
        else if (fixture.destroy?.() === true) result = { status: 'destroyed' };
        else throw new Error('modal fixture cleanup result is uncertain');
        if (typeof root?.unmount !== 'function') {
          throw new Error('modal fixture root cleanup is unavailable');
        }
        root.unmount();
        await settleBrowserWork();
        return result;
      };
      const result =
        typeof resourceTracker?.runInPhase === 'function'
          ? await resourceTracker.runInPhase(
              {
                operation: 'teardown',
                owner: 'fixture-cleanup',
                phase: 'cleanup',
                purpose: measuredListenerPurpose(request.scenario),
              },
              performCleanup,
            )
          : await performCleanup();
      const rootUnmounted = container.hasChildNodes() === false;
      if (!rootUnmounted) throw new Error('modal fixture root cleanup is uncertain');
      const observation =
        execution === undefined
          ? undefined
          : finalizeBrowserObservation({
              document,
              execution,
              fixture,
              fixtureStatus: result.status,
              rootUnmounted,
              scenario: request.scenario,
            });
      resourceTracker?.restore?.();
      cleaned = true;
      cleanupOutput = Object.freeze({
        status: result.status,
        ...(observation === undefined ? {} : { observation }),
      });
      return cleanupOutput;
    },
  });
}
