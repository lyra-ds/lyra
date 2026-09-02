import { isPlainRecord } from '../../contracts/protocol.mjs';
import { validateModalFixtureRequest, validateModalObservation } from './protocol.mjs';

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
  return {
    roles: [],
    relationships: [],
    states: [],
    focus: { target: 'modal-fixture-root' },
    events: structuredClone(events),
    announcements: [],
    cleanup: [...resources].sort(),
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

function createOperations({ commit, destroy, isDestroyed, resources }) {
  const perform = (action) => {
    if (isDestroyed() || !validAction(action)) return false;
    if (action.resource !== undefined) resources.add(action.resource);
    commit(action.event);
    return true;
  };
  return Object.fromEntries(
    OPERATION_NAMES.map((name) => [name, name === 'destroy' ? destroy : perform]),
  );
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
  return Object.freeze({
    cleanup,
    isDestroyed: () => destroyed,
    operations: Object.freeze(
      createOperations({ commit, destroy, isDestroyed: () => destroyed, resources }),
    ),
    observe: () => structuredClone(emptyObservation({ destroyed, events, resources })),
    request: Object.freeze(immutableRequest),
    destroy,
  });
}

function part(props, children) {
  return Object.freeze({ children, props: Object.freeze(props) });
}

function presentation(request) {
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
  { commitControlledClose, onOpenChange, openNested, runtime },
) {
  const record = (eventType = operation.operation) => {
    if (operation.operation === 'destroy') return runtime.destroy();
    const accepted = runtime.operations[operation.operation]({
      event: { target: operation.target, type: eventType },
    });
    if (!accepted) return false;
    if (operation.operation === 'open') {
      if (/child|second/iu.test(operation.target)) openNested();
      else onOpenChange(true);
    } else if (operation.operation === 'close') onOpenChange(false);
    else if (
      operation.operation === 'updateContent' &&
      operation.target === 'controlled-close-commit'
    ) {
      commitControlledClose();
    }
    return true;
  };
  const props = {
    type: 'button',
    'data-modal-control': operation.target,
    'data-modal-operation': operation.operation,
    'data-modal-id': operation.target,
    key: `${operation.operation}-${operation.target}-${index}`,
  };
  if (operation.operation === 'press') props.onKeyDown = () => record('keydown');
  else if (operation.operation === 'point') {
    props.onPointerDown = () => record('pointerdown');
    props.onContextMenu = () => record('contextmenu');
  } else props.onClick = () => record();
  return part(props, `${operation.operation} ${operation.target}`);
}

function fixtureParts(
  request,
  onOpenChange,
  openNested,
  runtime,
  announcement,
  commitControlledClose,
) {
  const view = presentation(request);
  const controls = request.scenario.operations.map((operation, index) => ({
    operation,
    part: scenarioControl(operation, index, {
      commitControlledClose,
      onOpenChange,
      openNested,
      runtime,
    }),
  }));
  const belongsInContent = ({ operation, target }) =>
    ['close', 'point', 'press'].includes(operation) ||
    (operation === 'open' && /child|second/iu.test(target));
  return Object.freeze({
    entryControls: Object.freeze(
      controls.filter(({ operation }) => !belongsInContent(operation)).map(({ part }) => part),
    ),
    contentControls: Object.freeze(
      controls.filter(({ operation }) => belongsInContent(operation)).map(({ part }) => part),
    ),
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
        'data-modal-id': 'modal-safe-target',
      },
      'Safe initial target',
    ),
    ordinaryAction: part({ type: 'button', 'data-fixture-action': 'ordinary' }, 'Save workspace'),
    destructiveAction: part(
      { type: 'button', 'data-fixture-action': 'destructive' },
      'Delete workspace',
    ),
    close: part(
      { type: 'button', 'data-fixture-control': 'close', onClick: () => onOpenChange(false) },
      'Close modal',
    ),
    nestedTrigger: part(
      { type: 'button', 'data-fixture-control': 'nested-opener', onClick: openNested },
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
        setAnnouncement(`${presentation(request).title} dialog close requested`);
        return runtime.operations.close({
          event: { target: 'controlled-modal', type: 'close-requested' },
        });
      }
      setOpen(nextOpen);
      if (nextOpen === false && nestedOpen) setNestedOpen(false);
      setAnnouncement(`${presentation(request).title} dialog ${nextOpen ? 'opened' : 'closed'}`);
      return runtime.operations[nextOpen ? 'open' : 'close']({
        event: { target: 'modal-panel', type: nextOpen ? 'opened' : 'closed' },
      });
    },
    [nestedOpen, request, runtime],
  );
  const commitControlledClose = React.useCallback(() => {
    if (pendingControlledClose !== true) return false;
    setOpen(false);
    setPendingControlledClose(false);
    setAnnouncement(`${presentation(request).title} dialog closed`);
    return runtime.operations.updateContent({
      event: { target: 'controlled-modal', type: 'controlled-close-committed' },
    });
  }, [pendingControlledClose, request, runtime]);
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
    diagnostics: {},
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

function executableScenario(scenario) {
  return Object.fromEntries(
    [
      'schemaVersion',
      'revision',
      'contractId',
      'scenarioId',
      'components',
      'initial',
      'operations',
      'requiredCells',
      'capture',
    ].map((key) => [key, scenario[key]]),
  );
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
  if (element === null || element === undefined || typeof element.dispatchEvent !== 'function') {
    return { dispatched: false, prevented: false };
  }
  const event = browserEvent(document, type, init);
  const dispatched = element.dispatchEvent(event);
  return { dispatched, prevented: event.defaultPrevented === true };
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

function mutateContent(document, target) {
  const mutations = [];
  const record = (name, changed) => mutations.push({ name, changed });
  if (target === 'disconnect-opener') {
    record(
      'opener-disconnected',
      removeElement(document.querySelector?.('[data-fixture-control="opener"]')),
    );
  } else if (target === 'remove-focused-target') {
    record('focused-target-removed', removeElement(document.activeElement));
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
  } else if (target === 'enabled-invalid-field-case') {
    const field = document.querySelector?.('[data-modal-control="enabled-invalid-field-case"]');
    field?.setAttribute?.('aria-invalid', 'true');
    record('invalid-field-enabled', field !== null && field !== undefined);
  } else if (target === 'focusable-summary-fallback-case') {
    record(
      'validation-summary-focused',
      focusElement(
        document.querySelector?.('[data-modal-control="focusable-summary-fallback-case"]'),
      ),
    );
  } else if (target === 'declare-safe-initial-focus') {
    record(
      'declared-safe-target-focused',
      focusElement(document.querySelector?.('[data-modal-control="declare-safe-initial-focus"]')),
    );
  } else if (target === 'declare-invalid-initial-focus') {
    const control = document.querySelector?.(
      '[data-modal-control="declare-invalid-initial-focus"]',
    );
    if (control !== null && control !== undefined) control.disabled = true;
    record('declared-target-disabled', control !== null && control !== undefined);
  } else if (target === 'no-tabbable-content') {
    const panel = document.querySelector?.('[data-modal-panel]');
    for (const element of panel?.querySelectorAll?.('button, input, [tabindex]') ?? []) {
      element.disabled = true;
      element.setAttribute?.('tabindex', '-1');
    }
    record('tabbables-disabled', panel !== null && panel !== undefined);
  } else if (target === 'hydrate-first-tree') {
    const root = document.querySelector?.('[data-modal-fixture-root]');
    record('hydration-tree-inspected', root !== null && root !== undefined);
  }
  return mutations;
}

function driveBrowserOperation({ document, fixture, operation, synthesizeHover }) {
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
  };
  const commit = (type, element = control, init) => {
    const result = dispatch(document, element, type, init);
    action.events.push(type);
    action.surfaces.push(observationId(element, 'missing-browser-surface'));
    action.dispatched ||= result.dispatched;
    action.prevented ||= result.prevented;
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
    if (/focus-target|tab-from/iu.test(operation.target)) focusElement(control);
    commit('keydown', control, {
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
      : /page-scroll/iu.test(operation.target)
        ? (document.querySelector?.('[data-modal-id="page-scroll-surface"]') ?? document.body)
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
    if (fixture.isDestroyed?.() !== true) fixture.destroy?.();
  } else if (operation.operation === 'updateContent') {
    Object.assign(action, click(control));
    action.mutations = mutateContent(document, operation.target);
  } else {
    Object.assign(action, click(control));
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

function observeBrowserDocument({ document, fixture, diagnostics }) {
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
  }
  const portals = [...(document.querySelectorAll?.('[data-modal-portal]') ?? [])];
  for (const portal of portals) {
    states.push({
      target: observationId(portal, 'modal-portal'),
      name: 'orphaned',
      value: dialogs.length === 0 && portal.isConnected !== false,
    });
  }
  const resourceSnapshot = document.defaultView?.__LYRA_MODAL_RESOURCE_TRACKER__?.snapshot?.();
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
  const observation = {
    roles,
    relationships,
    states,
    focus: { target: focusTarget },
    events: structuredClone(runtimeObservation.events ?? []),
    announcements: [...(document.querySelectorAll?.('[aria-live]') ?? [])]
      .map((element) => element.textContent?.trim())
      .filter((message) => typeof message === 'string' && message !== '')
      .map((message) => ({ message })),
    cleanup: structuredClone(runtimeObservation.cleanup ?? []),
    diagnostics: {
      ...structuredClone(runtimeObservation.diagnostics ?? {}),
      ...structuredClone(diagnostics),
    },
  };
  const errors = validateModalObservation(observation);
  if (errors.length !== 0) {
    throw new Error(`modal browser observation is invalid: ${errors.join('; ')}`);
  }
  return observation;
}

export async function executeModalBrowserScenario({ document, fixture, input, request }) {
  if (
    !sameLiteral(executableScenario(input.scenario), executableScenario(request.scenario)) ||
    !sameLiteral(input.cell, request.cell)
  ) {
    throw new Error('modal browser scenario does not match its literal fixture request');
  }
  document.documentElement.dir = request.cell.direction;
  const preExecutionFocus = observationId(document.activeElement, 'modal-fixture-root');
  const actions = [];
  for (const operation of request.scenario.operations) {
    actions.push(
      driveBrowserOperation({
        document,
        fixture,
        operation,
        synthesizeHover: input.synthesizeHover,
      }),
    );
    await settleBrowserWork();
  }
  return observeBrowserDocument({
    document,
    fixture,
    diagnostics: {
      executor: 'shared-browser-driver',
      operations: structuredClone(request.scenario.operations),
      actions,
      hydrate: input.hydrate === true,
      preExecutionFocus,
      postExecutionFocus: observationId(document.activeElement, 'modal-fixture-root'),
    },
  });
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
  let root;
  if (renderMode === 'hydrateRoot') root = hydrateRoot(container, element);
  else {
    root = createRoot(container);
    root.render(element);
  }
  let cleaned = false;
  return Object.freeze({
    ready: ready.promise,
    renderMode,
    request: structuredClone(request),
    async runScenario(input) {
      const fixture = await ready.promise;
      return executeModalBrowserScenario({ document, fixture, input, request });
    },
    async runAxe() {
      if (axe === undefined || typeof axe.run !== 'function') {
        throw new Error('axe execution is unavailable');
      }
      return axe.run(document);
    },
    async cleanup() {
      if (cleaned) return Object.freeze({ status: 'already-destroyed' });
      const fixture = await ready.promise;
      let result;
      if (typeof fixture.cleanup === 'function') result = cleanupResult(await fixture.cleanup());
      else if (fixture.isDestroyed?.() === true) result = { status: 'already-destroyed' };
      else if (fixture.destroy?.() === true) result = { status: 'destroyed' };
      else throw new Error('modal fixture cleanup result is uncertain');
      root?.unmount?.();
      resourceTracker?.restore?.();
      cleaned = true;
      return cleanupResult(result);
    },
  });
}
