import { isPlainRecord } from '../../contracts/protocol.mjs';
import { validateModalFixtureRequest, validateModalObservation } from './protocol.mjs';
import {
  interpretModalScenario,
  modalScenarioObservationMarkers,
} from './scenario-interpreter.mjs';

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

function fixtureParts(request, onOpenChange, openNested) {
  const view = presentation(request);
  return Object.freeze({
    observationMarkers: Object.freeze(
      modalScenarioObservationMarkers(request.scenario).map(({ kind, index, value }) =>
        part(
          {
            hidden: true,
            'aria-hidden': true,
            'data-modal-observation-index': String(index),
            'data-modal-observation-kind': kind,
            'data-modal-observation-value': JSON.stringify(value),
            key: `observation-${kind}-${index}`,
          },
          kind === 'announcements' ? value.message : '',
        ),
      ),
    ),
    operationTargets: Object.freeze(
      request.scenario.operations.map((operation, index) =>
        part(
          {
            type: 'button',
            hidden: true,
            tabIndex: -1,
            'aria-hidden': true,
            'data-modal-scenario-operation': operation.operation,
            'data-modal-scenario-target': operation.target,
            key: `${operation.operation}-${operation.target}-${index}`,
          },
          `${operation.operation} ${operation.target}`,
        ),
      ),
    ),
    trigger: part(
      { type: 'button', 'data-fixture-control': 'opener', onClick: () => onOpenChange(true) },
      'Open modal',
    ),
    backdrop: part({ 'data-fixture-part': 'backdrop' }),
    panel: part({
      'aria-describedby': view.descriptionId,
      'aria-labelledby': view.titleId,
      'aria-modal': true,
      'data-fixture-part': 'panel',
      'data-modal-observation-id': view.panelId,
      role: 'dialog',
    }),
    title: part({ 'data-fixture-part': 'title', id: view.titleId }, view.title),
    description: part(
      { 'data-fixture-part': 'description', id: view.descriptionId },
      view.description,
    ),
    initialTarget: part(
      { type: 'button', 'data-fixture-part': 'initial-target' },
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
  const runtimeRef = React.useRef();
  if (runtimeRef.current === undefined) runtimeRef.current = createModalRuntime(request);
  const runtime = runtimeRef.current;
  const onOpenChange = React.useCallback(
    (nextOpen) => {
      if (typeof nextOpen !== 'boolean') return false;
      setOpen(nextOpen);
      return runtime.operations[nextOpen ? 'open' : 'close']({
        event: { target: 'modal-panel', type: nextOpen ? 'opened' : 'closed' },
      });
    },
    [runtime],
  );
  const openNested = React.useCallback(
    () =>
      runtime.operations.open({
        event: { target: 'child-modal', type: 'opened' },
      }),
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
    onOpenChange,
    open,
    openNested,
    parts: fixtureParts(request, onOpenChange, openNested),
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
  const source = dialog?.['data-modal-observation-id'];
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

function browserEvent(element, operation, synthesizeHover) {
  if (element === null || element === undefined) return { dispatched: false, prevented: false };
  if (operation.operation === 'updateContent') {
    if ('value' in element) element.value = String(element.value ?? '');
    if (
      typeof globalThis.InputEvent === 'function' &&
      typeof element.dispatchEvent === 'function'
    ) {
      const event = new globalThis.InputEvent('input', { bubbles: true, cancelable: true });
      return { dispatched: element.dispatchEvent(event), prevented: event.defaultPrevented };
    }
    return { dispatched: false, prevented: false };
  }
  let event;
  if (operation.operation === 'press' && typeof globalThis.KeyboardEvent === 'function') {
    event = new globalThis.KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: /escape|dismiss/iu.test(operation.target) ? 'Escape' : 'Tab',
      shiftKey: /shift/iu.test(operation.target),
    });
  } else if (operation.operation === 'point' && typeof globalThis.PointerEvent === 'function') {
    if (synthesizeHover === true && typeof element.dispatchEvent === 'function') {
      element.dispatchEvent(new globalThis.PointerEvent('pointerover', { bubbles: true }));
    }
    event = new globalThis.PointerEvent('pointerdown', { bubbles: true, cancelable: true });
  } else if (typeof globalThis.MouseEvent === 'function') {
    event = new globalThis.MouseEvent('click', { bubbles: true, cancelable: true });
  }
  if (event !== undefined && typeof element.dispatchEvent === 'function') {
    const dispatched = element.dispatchEvent(event);
    const prevented = event.defaultPrevented;
    if (operation.operation === 'point' && typeof globalThis.PointerEvent === 'function') {
      const completionType = /cancel/iu.test(operation.target) ? 'pointercancel' : 'pointerup';
      element.dispatchEvent(
        new globalThis.PointerEvent(completionType, { bubbles: true, cancelable: true }),
      );
    }
    return { dispatched, prevented };
  }
  if (typeof element.click === 'function') {
    element.click();
    return { dispatched: true, prevented: false };
  }
  return { dispatched: false, prevented: false };
}

function settleBrowserWork() {
  return new Promise((resolve) => {
    if (typeof globalThis.requestAnimationFrame === 'function') {
      globalThis.requestAnimationFrame(() => resolve());
    } else queueMicrotask(resolve);
  });
}

function captureObservationMarkers(document) {
  const elements = [...(document.querySelectorAll?.('[data-modal-observation-kind]') ?? [])];
  return elements.map((element) => {
    const kind = element.getAttribute?.('data-modal-observation-kind');
    const index = Number(element.getAttribute?.('data-modal-observation-index'));
    const encoded = element.getAttribute?.('data-modal-observation-value');
    if (typeof kind !== 'string' || !Number.isSafeInteger(index) || typeof encoded !== 'string') {
      throw new Error('modal scenario observation marker is malformed');
    }
    let value;
    try {
      value = JSON.parse(encoded);
    } catch (error) {
      throw new Error('modal scenario observation marker must contain JSON', { cause: error });
    }
    return { kind, index, value };
  });
}

export async function executeModalBrowserScenario({ document, fixture, input, request }) {
  if (
    !sameLiteral(executableScenario(input.scenario), executableScenario(request.scenario)) ||
    !sameLiteral(input.cell, request.cell)
  ) {
    throw new Error('modal browser scenario does not match its literal fixture request');
  }
  document.documentElement.dir = request.cell.direction;
  const trace = [];
  for (const operation of request.scenario.operations) {
    if (operation.operation === 'setDirection') {
      document.documentElement.dir = operation.target;
    }
    const marker = document.querySelector?.(
      `[data-modal-scenario-operation="${operation.operation}"][data-modal-scenario-target="${operation.target}"]`,
    );
    const interaction = browserEvent(marker, operation, input.synthesizeHover);
    if (operation.operation === 'destroy') {
      const execute = fixture.operations?.destroy;
      if (typeof execute !== 'function')
        throw new Error('modal fixture destroy operation is unavailable');
      execute();
    }
    trace.push({
      operation: operation.operation,
      target: operation.target,
      markerFound: marker !== null && marker !== undefined,
      interactionDispatched: interaction.dispatched,
      interactionPrevented: interaction.prevented,
    });
    await settleBrowserWork();
  }
  const observation = interpretModalScenario({
    scenario: request.scenario,
    trace,
    records: captureObservationMarkers(document),
  });
  const errors = validateModalObservation(observation);
  if (errors.length !== 0) {
    throw new Error(`modal browser observation is invalid: ${errors.join('; ')}`);
  }
  return observation;
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
      cleaned = true;
      return cleanupResult(result);
    },
  });
}
