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
  return Object.freeze({
    operations: Object.freeze(
      createOperations({ commit, destroy, isDestroyed: () => destroyed, resources }),
    ),
    observe: () => structuredClone(emptyObservation({ destroyed, events, resources })),
    destroy,
  });
}

function part(props, children) {
  return Object.freeze({ children, props: Object.freeze(props) });
}

function fixtureParts(onOpenChange, openNested) {
  return Object.freeze({
    trigger: part(
      { type: 'button', 'data-fixture-control': 'opener', onClick: () => onOpenChange(true) },
      'Open modal',
    ),
    backdrop: part({ 'data-fixture-part': 'backdrop' }),
    panel: part({ 'data-fixture-part': 'panel' }),
    title: part({ 'data-fixture-part': 'title' }, 'Workspace details'),
    description: part(
      { 'data-fixture-part': 'description' },
      'Review the workspace details before continuing.',
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
      destroy: runtime.destroy,
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
    parts: fixtureParts(onOpenChange, openNested),
  });
}
