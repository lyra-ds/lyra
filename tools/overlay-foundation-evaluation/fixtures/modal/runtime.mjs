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
  const timers = new Map();
  const capture = (options) => (typeof options === 'boolean' ? options : options?.capture === true);
  if (typeof originalAdd === 'function' && typeof originalRemove === 'function') {
    targetPrototype.addEventListener = function trackedAdd(type, listener, options) {
      const result = originalAdd.call(this, type, listener, options);
      if (
        listener !== null &&
        listener !== undefined &&
        !listeners.some(
          (entry) =>
            entry.target === this &&
            entry.type === type &&
            entry.listener === listener &&
            entry.capture === capture(options),
        )
      ) {
        listeners.push({ target: this, type, listener, capture: capture(options) });
      }
      return result;
    };
    targetPrototype.removeEventListener = function trackedRemove(type, listener, options) {
      const result = originalRemove.call(this, type, listener, options);
      const index = listeners.findIndex(
        (entry) =>
          entry.target === this &&
          entry.type === type &&
          entry.listener === listener &&
          entry.capture === capture(options),
      );
      if (index !== -1) listeners.splice(index, 1);
      return result;
    };
  }
  if (typeof originalSetTimeout === 'function' && typeof originalClearTimeout === 'function') {
    scope.setTimeout = (callback, delay, ...args) => {
      let handle;
      const wrapped = (...callbackArgs) => {
        timers.delete(handle);
        if (typeof callback === 'function') return callback(...callbackArgs);
        return undefined;
      };
      handle = originalSetTimeout.call(scope, wrapped, delay, ...args);
      timers.set(handle, 'timeout');
      return handle;
    };
    scope.clearTimeout = (handle) => {
      timers.delete(handle);
      return originalClearTimeout.call(scope, handle);
    };
  }
  if (typeof originalSetInterval === 'function' && typeof originalClearInterval === 'function') {
    scope.setInterval = (callback, delay, ...args) => {
      const handle = originalSetInterval.call(scope, callback, delay, ...args);
      timers.set(handle, 'interval');
      return handle;
    };
    scope.clearInterval = (handle) => {
      timers.delete(handle);
      return originalClearInterval.call(scope, handle);
    };
  }
  let restored = false;
  const tracker = Object.freeze({
    snapshot: () => ({ listeners: listeners.length, timers: timers.size }),
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

function scenarioControl(
  operation,
  index,
  { commitControlledClose, destroyPhase, onOpenChange, openNested, prepareContent, runtime },
) {
  const record = (event, eventType = operation.operation) => {
    let accepted = runtime.acceptInput(operation.operation, operation.target, eventType);
    if (!accepted) return false;
    if (operation.operation === 'open') {
      if (/child|second/iu.test(operation.target)) accepted = openNested();
    } else if (
      operation.operation === 'updateContent' &&
      operation.target === 'controlled-close-commit'
    ) {
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
  openNested,
  runtime,
  announcement,
  commitControlledClose,
  contentMode,
  destroyPhase,
  prepareContent,
) {
  const view = presentation(request, contentMode);
  const state = request.scenario.initial.state;
  const controls = request.scenario.operations.map((operation, index) => ({
    operation,
    part: scenarioControl(operation, index, {
      commitControlledClose,
      destroyPhase,
      onOpenChange,
      openNested,
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
    title: part({ 'data-fixture-part': 'title', id: view.titleId }, view.title),
    description: part(
      { 'data-fixture-part': 'description', id: view.descriptionId },
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
        onClick: openNested,
        ...(contentMode === 'no-tabbable-content' ? { disabled: true, tabIndex: -1 } : {}),
      },
      'Open nested modal',
    ),
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
      if (nextOpen === false && nestedOpen) setNestedOpen(false);
      setAnnouncement(
        `${presentation(request, contentMode).title} dialog ${nextOpen ? 'opened' : 'closed'}`,
      );
      return runtime.operations[nextOpen ? 'open' : 'close']({
        event: { target: 'modal-panel', type: nextOpen ? 'opened' : 'closed' },
      });
    },
    [contentMode, nestedOpen, request, runtime],
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
  const openNested = React.useCallback(() => {
    setNestedOpen(true);
    setAnnouncement('Child workspace dialog opened');
    return runtime.operations.open({
      event: { target: 'child-modal', type: 'opened' },
    });
  }, [runtime]);
  const onNestedOpenChange = React.useCallback(
    (nextOpen) => {
      if (typeof nextOpen !== 'boolean') return false;
      setNestedOpen(nextOpen);
      setAnnouncement(`Child workspace dialog ${nextOpen ? 'opened' : 'closed'}`);
      return runtime.operations[nextOpen ? 'open' : 'close']({
        event: { target: 'child-modal', type: nextOpen ? 'opened' : 'closed' },
      });
    },
    [runtime],
  );
  const fixtureRef = React.useRef();
  if (fixtureRef.current === undefined) {
    fixtureRef.current = Object.freeze({
      cleanup: runtime.cleanup,
      destroy: runtime.destroy,
      isDestroyed: runtime.isDestroyed,
      observe: () => observedWithDiagnostics(runtime, diagnostics),
      openNested,
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
    openNested,
    parts: fixtureParts(
      request,
      onOpenChange,
      openNested,
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
  const observation = {
    roles: semanticallyAvailable ? [{ role: 'dialog', name }] : [],
    relationships: semanticallyAvailable
      ? [{ source, name: 'labelled-by', target: labelTarget }]
      : [],
    states: semanticallyAvailable
      ? [
          { target: source, name: 'semantically-available', value: true },
          { target: 'browser-globals', name: 'accessed', value: false },
        ]
      : [{ target: 'browser-globals', name: 'accessed', value: false }],
    focus: { target: 'server-document-focus-unchanged' },
    events: semanticallyAvailable ? [{ target: source, type: 'rendered-open' }] : [],
    announcements: semanticallyAvailable ? [{ message: `${name} dialog is available` }] : [],
    cleanup: ['no-browser-resource-claims'],
    trace: [
      {
        phase: 'server-render',
        snapshot: {
          roles: semanticallyAvailable ? [{ role: 'dialog', name }] : [],
          relationships: semanticallyAvailable
            ? [{ source, name: 'labelled-by', target: labelTarget }]
            : [],
          states: semanticallyAvailable
            ? [
                { target: source, name: 'semantically-available', value: true },
                { target: 'browser-globals', name: 'accessed', value: false },
              ]
            : [{ target: 'browser-globals', name: 'accessed', value: false }],
          focus: { target: 'server-document-focus-unchanged' },
          events: semanticallyAvailable ? [{ target: source, type: 'rendered-open' }] : [],
          announcements: semanticallyAvailable ? [{ message: `${name} dialog is available` }] : [],
        },
      },
    ],
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

function accessibleName(document, element) {
  const direct = element.getAttribute?.('aria-label');
  if (typeof direct === 'string' && direct.trim() !== '') return direct.trim();
  const labelledBy = element.getAttribute?.('aria-labelledby');
  if (typeof labelledBy !== 'string') return undefined;
  const value = document.getElementById?.(labelledBy)?.textContent?.trim();
  return typeof value === 'string' && value !== '' ? value : undefined;
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
        relationships.push({ source: target, name, target: value });
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
      target: 'modal-timers',
      name: 'remaining-count',
      value: resourceSnapshot.timers,
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
            listeners: resourceSnapshot.listeners,
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

function observationFromTrace({ cleanup, diagnostics, trace }) {
  const operationEntries = trace.filter(({ phase }) => phase !== 'after-cleanup');
  const finalEntry = operationEntries.at(-1) ?? trace.at(-1);
  const observation = {
    roles: uniqueRecords(trace.flatMap(({ snapshot }) => snapshot.roles)),
    relationships: uniqueRecords(trace.flatMap(({ snapshot }) => snapshot.relationships)),
    states: uniqueRecords(trace.flatMap(({ snapshot }) => snapshot.states)),
    focus: structuredClone(finalEntry?.snapshot.focus ?? { target: 'modal-fixture-root' }),
    events: structuredClone(finalEntry?.snapshot.events ?? []),
    announcements: uniqueRecords(
      operationEntries.flatMap(({ snapshot }) => snapshot.announcements),
    ),
    cleanup: structuredClone(cleanup),
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
  const trace = [
    {
      phase: 'before-operations',
      snapshot: observeBrowserSnapshot({ document, fixture, captureResources }),
    },
  ];
  for (const [operationIndex, operation] of request.scenario.operations.entries()) {
    const action = await driveBrowserOperation({
      document,
      operation,
      synthesizeHover: input.synthesizeHover,
    });
    actions.push(action);
    trace.push({
      phase: 'after-operation',
      operationIndex,
      operation: structuredClone(operation),
      snapshot: observeBrowserSnapshot({ document, fixture, captureResources }),
    });
    if (!action.completed) break;
  }
  return observationFromTrace({
    cleanup: [],
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
}) {
  const captureResources = execution.diagnostics.captureResources === true;
  const cleanupSnapshot = observeBrowserSnapshot({ document, fixture, captureResources });
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
  return {
    controlledStateStable: sameLiteral(before.inputValues, after.inputValues),
    firstTreeIdentical: before.markup === after.markup,
    focusMoved: before.focus !== after.focus,
    generatedIdentifiersStable: sameLiteral(before.identifiers, after.identifiers),
    inputValuesAfter: structuredClone(after.inputValues),
    inputValuesBefore: structuredClone(before.inputValues),
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
  const element = React.createElement(ModalFixture, {
    request,
    onReady: (fixture) => ready.resolve(fixture),
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
  if (renderMode === 'hydrateRoot') root = hydrateRoot(container, element);
  else {
    root = createRoot(container);
    root.render(element);
  }
  let cleaned = false;
  let cleanupOutput;
  let execution;
  return Object.freeze({
    ready: ready.promise,
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
        trace[0].snapshot.states.push(
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
            value: !hydration.firstTreeIdentical,
          },
          {
            target: 'hydrated-input',
            name: 'value-lost',
            value: !hydration.controlledStateStable,
          },
          { target: 'focus', name: 'moved-during-hydration', value: hydration.focusMoved },
        );
        execution = observationFromTrace({
          cleanup: execution.cleanup,
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
      const fixture = await ready.promise;
      let result;
      if (typeof fixture.cleanup === 'function') result = cleanupResult(await fixture.cleanup());
      else if (fixture.isDestroyed?.() === true) result = { status: 'already-destroyed' };
      else if (fixture.destroy?.() === true) result = { status: 'destroyed' };
      else throw new Error('modal fixture cleanup result is uncertain');
      if (typeof root?.unmount !== 'function') {
        throw new Error('modal fixture root cleanup is unavailable');
      }
      root.unmount();
      await settleBrowserWork();
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
