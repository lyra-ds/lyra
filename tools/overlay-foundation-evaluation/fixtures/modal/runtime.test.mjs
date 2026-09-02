import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MODAL_SCENARIOS } from '../../contracts/modal.mjs';
import { modalExecutionScenario } from './protocol.mjs';
import { isDeepStrictEqual as isBrowserDeepStrictEqual } from './runtime.react-browser-node-util.mjs';
import {
  createModalRuntime,
  executeModalBrowserScenario,
  installModalResourceTracker,
} from './runtime.mjs';

const validRequest = {
  schemaVersion: 1,
  scenario: modalExecutionScenario(MODAL_SCENARIOS[0]),
  cell: {
    id: 'chromium',
    reactVersion: '19.2.8',
    direction: 'ltr',
    colorScheme: 'light',
    forcedColors: false,
    reducedMotion: false,
    coarsePointer: false,
  },
};

test('browser deep equality compares JSON records independently of insertion order', () => {
  assert.equal(
    isBrowserDeepStrictEqual(
      { cell: { direction: 'ltr', id: 'chromium' }, operations: ['open', 'close'] },
      { operations: ['open', 'close'], cell: { id: 'chromium', direction: 'ltr' } },
    ),
    true,
  );
  assert.equal(
    isBrowserDeepStrictEqual({ operations: ['open'] }, { operations: ['close'] }),
    false,
  );
  assert.equal(isBrowserDeepStrictEqual(['open', 'close'], ['close', 'open']), false);
});

function requestFor(scenario) {
  return {
    ...structuredClone(validRequest),
    scenario: modalExecutionScenario(scenario),
    cell: {
      ...validRequest.cell,
      id: scenario.requiredCells[0],
      direction: scenario.initial.state.direction ?? 'ltr',
      coarsePointer: scenario.initial.state.pointerMode === 'coarse',
      reducedMotion: scenario.initial.state.motionPreference === 'reduced-motion',
    },
  };
}

function fakeElement(attributes = {}, options = {}) {
  const values = new Map(Object.entries(attributes));
  return {
    disabled: options.disabled === true,
    hidden: options.hidden === true,
    inert: options.inert === true,
    isConnected: options.isConnected !== false,
    textContent: options.textContent ?? '',
    value: options.value,
    click() {
      options.actions?.push({ type: 'click', target: values.get('data-modal-control') });
      options.onEvent?.({ type: 'click' });
    },
    dispatchEvent(event) {
      options.actions?.push({
        type: event.type,
        target: values.get('data-modal-control'),
        key: event.key,
      });
      options.onEvent?.(event);
      return event.defaultPrevented !== true;
    },
    getAttribute(name) {
      return values.get(name) ?? null;
    },
    hasAttribute(name) {
      return values.has(name);
    },
    setAttribute(name, value) {
      values.set(name, String(value));
    },
    removeAttribute(name) {
      values.delete(name);
    },
    ...(options.onFocus === undefined
      ? {}
      : {
          focus() {
            options.onFocus(this);
          },
        }),
    remove() {
      this.isConnected = false;
      options.actions?.push({ type: 'remove', target: values.get('data-modal-control') });
    },
  };
}

function behaviorBrowserHarness(
  scenario,
  {
    accessibleName = 'Behavior workspace',
    ariaModal = 'true',
    descriptionId = 'behavior-description',
    titleId = 'behavior-title',
    ignoreOpen = false,
    ignoreOpenFocus = false,
    ignorePointerClose = false,
    layoutShiftOnFinalClose = 0,
    missingControl,
    missingControlledCommit = false,
    missingHydrationInput = false,
    misattributeScrollClaims = false,
    noWrap = false,
    pageScrollChanges = false,
    portalLeak = false,
    prematureScrollClaimRelease = false,
    reacquireScrollClaimForSameOwner = false,
    renderedDescriptionId = descriptionId,
    renderedTitleId = titleId,
    relationshipDescriptionId = renderedDescriptionId,
    relationshipTitleId = renderedTitleId,
    resourceSnapshot,
    semanticContradiction = false,
    semanticEventContradiction = false,
    stuckScrollLock = false,
    trackGuards = false,
    trackScrollClaims = false,
  } = {},
) {
  const actions = [];
  const events = [];
  const body = fakeElement({ 'data-modal-id': 'document-body' });
  body.style = { overflow: '' };
  const opener = fakeElement({
    'data-fixture-control': 'opener',
    'data-modal-id': 'modal-opener',
  });
  const safeTarget = fakeElement({ 'data-modal-id': 'modal-safe-target' });
  const firstTarget = fakeElement({ 'data-modal-id': 'first-eligible-target-after-wrap' });
  const firstEligibleTarget = fakeElement({ 'data-modal-id': 'first-eligible-target' });
  const lastEligibleTarget = fakeElement({ 'data-modal-id': 'last-eligible-target' });
  const middleTarget = fakeElement({ 'data-modal-id': 'middle-focus-target' });
  const nearestTarget = fakeElement({ 'data-modal-id': 'nearest-safe-target' });
  const hiddenTarget = fakeElement({ 'data-modal-id': 'hidden-tab-target' });
  const disabledTarget = fakeElement({ 'data-modal-id': 'disabled-tab-target' });
  const removedTarget = fakeElement({ 'data-modal-id': 'removed-tab-target' });
  const childTarget = fakeElement({ 'data-modal-id': 'child-modal-safe-target' });
  const focusGuard = fakeElement({ 'data-modal-focus-guard': '' });
  let layoutLeft = 0;
  let scrollY = 0;
  const pageScrollTarget = fakeElement(
    { 'data-modal-id': 'page-scroll-surface' },
    {
      onEvent(event) {
        if (event.type === 'pointerup' && pageScrollChanges) scrollY += 12;
      },
    },
  );
  pageScrollTarget.getBoundingClientRect = () => ({
    bottom: 100,
    height: 100,
    left: layoutLeft,
    right: layoutLeft + 100,
    top: 0,
    width: 100,
  });
  const preventedOutsideTarget = fakeElement(
    { 'data-modal-id': 'outside-prevented-default' },
    {
      actions,
      onEvent(event) {
        if (event.type === 'pointerdown') event.preventDefault();
      },
    },
  );
  const background = fakeElement({ 'data-modal-id': 'background' });
  const title = fakeElement(
    { id: renderedTitleId, 'data-modal-id': titleId },
    { textContent: accessibleName },
  );
  const description = fakeElement(
    { id: renderedDescriptionId, 'data-modal-id': descriptionId },
    { textContent: 'Behavior description' },
  );
  const panel = fakeElement({
    role: 'dialog',
    'data-modal-id': 'modal-panel',
    'data-modal-panel': '',
    'data-modal-portal': '',
    'aria-labelledby': relationshipTitleId,
    'aria-describedby': relationshipDescriptionId,
    'aria-modal': ariaModal,
  });
  const contradictoryPanel = fakeElement({
    role: 'dialog',
    'data-modal-id': 'modal-panel',
    'aria-labelledby': relationshipTitleId,
    'aria-describedby': relationshipDescriptionId,
    'aria-modal': ariaModal === 'true' ? 'false' : 'true',
  });
  const childPanel = fakeElement({
    role: 'dialog',
    'aria-label': 'Child workspace',
    'data-modal-id': 'child-modal',
    'data-modal-panel': '',
    'data-modal-portal': '',
    'aria-modal': 'true',
  });
  const live = fakeElement({ 'aria-live': 'polite' });
  let activeElement = body;
  let open = false;
  let nestedOpen = false;
  let pendingControlledClose = false;
  let pointerStartedOutside = false;
  let destroyed = false;
  const scrollClaims = new Map();
  let nextScrollClaimId = 0;
  const scrollClaimOwner = (target) => (misattributeScrollClaims ? `unowned-${target}` : target);
  const acquireScrollClaim = (target) => {
    const owner = scrollClaimOwner(target);
    scrollClaims.set(owner, ++nextScrollClaimId);
  };

  const focus = (element) => {
    activeElement = element;
  };
  safeTarget.focus = () => focus(safeTarget);
  firstTarget.focus = () => focus(firstTarget);
  firstEligibleTarget.focus = () => focus(firstEligibleTarget);
  lastEligibleTarget.focus = () => focus(lastEligibleTarget);
  middleTarget.focus = () => focus(middleTarget);
  opener.focus = () => focus(opener);
  lastEligibleTarget.dispatchEvent = (event) => {
    actions.push({ type: event.type, target: 'last-eligible-target', key: event.key });
    if (event.type === 'keydown' && !noWrap) {
      focus(firstTarget);
      events.push({ target: 'first-eligible-target', type: 'forward-tab-wrapped' });
    }
    return event.defaultPrevented !== true;
  };
  firstEligibleTarget.dispatchEvent = (event) => {
    actions.push({ type: event.type, target: 'first-eligible-target', key: event.key });
    if (event.type === 'keydown' && event.shiftKey === true && !noWrap) {
      focus(lastEligibleTarget);
      events.push({ target: 'last-eligible-target', type: 'reverse-tab-wrapped' });
    } else if (event.type === 'keydown' && !noWrap) {
      focus(firstTarget);
    }
    return event.defaultPrevented !== true;
  };
  const complete = (control) => {
    const previous = Number(control.getAttribute('data-modal-completion-count') ?? '0');
    control.setAttribute('data-modal-completion-count', String(previous + 1));
  };
  const openDialog = (target) => {
    if (ignoreOpen) return;
    if (/child|second/iu.test(target)) {
      nestedOpen = true;
      if (trackScrollClaims) {
        acquireScrollClaim(target);
        if (reacquireScrollClaimForSameOwner) {
          const firstOwner = scrollClaimOwner('first-modal');
          scrollClaims.delete(firstOwner);
          acquireScrollClaim('first-modal');
        }
      }
      focus(childTarget);
      events.push({ target: 'child-modal', type: 'opened' });
      return;
    }
    open = true;
    if (trackScrollClaims) acquireScrollClaim(target);
    body.style.overflow = 'hidden';
    background.inert = true;
    background.setAttribute('inert', '');
    background.setAttribute('aria-hidden', 'true');
    if (!ignoreOpenFocus) focus(safeTarget);
    events.push({ target: 'modal-panel', type: 'opened' });
    if (semanticEventContradiction) {
      events.push({ target: 'modal-panel', type: 'closed' });
    }
    live.textContent = `${accessibleName} dialog opened`;
  };
  const closeDialog = (type = 'closed', target = 'modal-panel') => {
    if (/child|second/iu.test(target)) {
      nestedOpen = false;
      if (trackScrollClaims) {
        if (prematureScrollClaimRelease) scrollClaims.clear();
        else scrollClaims.delete(scrollClaimOwner(target));
      }
      if (prematureScrollClaimRelease) body.style.overflow = '';
      focus(safeTarget);
      events.push({ target: 'child-modal', type });
      return;
    }
    open = false;
    nestedOpen = false;
    if (trackScrollClaims) scrollClaims.clear();
    if (!stuckScrollLock) body.style.overflow = '';
    layoutLeft = layoutShiftOnFinalClose;
    background.inert = false;
    background.removeAttribute('inert');
    background.removeAttribute('aria-hidden');
    focus(opener);
    events.push({ target: 'modal-panel', type });
    live.textContent = `${accessibleName} dialog closed`;
  };
  safeTarget.dispatchEvent = (event) => {
    actions.push({ type: event.type, target: 'modal-safe-target', key: event.key });
    if (event.type === 'keydown' && event.key === 'Escape') {
      if (nestedOpen) closeDialog('closed', 'child-modal');
      else if (scenario.initial.state.controlled === true) {
        pendingControlledClose = true;
        events.push({ target: 'controlled-modal', type: 'close-requested-once' });
      } else closeDialog();
    }
    return event.defaultPrevented !== true;
  };
  childTarget.dispatchEvent = (event) => {
    actions.push({ type: event.type, target: 'child-modal-safe-target', key: event.key });
    if (event.type === 'keydown' && event.key === 'Escape') {
      closeDialog('closed', 'child-modal');
    }
    return event.defaultPrevented !== true;
  };

  const backdrop = fakeElement(
    { 'data-fixture-part': 'backdrop', 'data-modal-id': 'modal-backdrop' },
    {
      actions,
      onEvent(event) {
        if (event.type === 'pointerdown') pointerStartedOutside = true;
        if (event.type === 'pointercancel') pointerStartedOutside = false;
        if (event.type === 'pointerup' && pointerStartedOutside) {
          pointerStartedOutside = false;
          if (!ignorePointerClose) closeDialog('outside-origin-close-requested-once');
        }
      },
    },
  );
  panel.dispatchEvent = (event) => {
    actions.push({ type: event.type, target: 'modal-panel', key: event.key });
    if (event.type === 'pointerup') pointerStartedOutside = false;
    return event.defaultPrevented !== true;
  };

  const controls = new Map();
  for (const { operation, target } of scenario.operations) {
    if (`${operation}:${target}` === missingControl) continue;
    let control;
    control = fakeElement(
      {
        'data-modal-control': target,
        'data-modal-operation': operation,
        'data-modal-id': target,
        'data-modal-completion-count': '0',
      },
      {
        actions,
        onEvent(event) {
          if (operation === 'open') openDialog(target);
          else if (operation === 'close') closeDialog('closed', target);
          else if (operation === 'press' && target === 'tab-from-last-target' && !noWrap) {
            focus(firstTarget);
            events.push({ target: 'first-eligible-target', type: 'forward-tab-wrapped' });
          } else if (operation === 'press' && target === 'dismiss-control') {
            pendingControlledClose = true;
            events.push({ target: 'controlled-modal', type: 'close-requested-once' });
          } else if (operation === 'updateContent' && target === 'controlled-close-commit') {
            if (pendingControlledClose && !missingControlledCommit) {
              pendingControlledClose = false;
              closeDialog('controlled-close-committed');
            } else {
              return;
            }
          } else if (operation === 'destroy') {
            open = false;
            nestedOpen = false;
            scrollClaims.clear();
            body.style.overflow = '';
            focus(opener);
            events.push({ target, type: 'destroyed-once' });
            live.textContent = 'Disposable workspace dialog removed';
          }
          complete(control);
          if (event?.type === 'keydown' && target === 'tab-from-last-target' && noWrap) {
            focus(control);
          }
        },
      },
    );
    controls.set(`${operation}:${target}`, control);
  }

  let rootHasChildren = false;
  let rootMarkup = '<input id="hydrated-input" value="Workspace draft">';
  const hydrationInput = fakeElement(
    { id: 'hydrated-input', 'data-modal-id': 'hydrated-input' },
    { value: 'Workspace draft' },
  );
  const fixtureRoot = fakeElement({ 'data-modal-fixture-root': '' });
  Object.defineProperties(fixtureRoot, {
    hasChildNodes: { value: () => rootHasChildren },
    innerHTML: {
      configurable: true,
      get: () => rootMarkup,
      set: (value) => {
        rootMarkup = value;
      },
    },
    querySelectorAll: {
      value(selector) {
        if (selector === '[id]' || selector === 'input, textarea, select') {
          return rootHasChildren ? [hydrationInput] : [];
        }
        return [];
      },
    },
  });
  const document = {
    body,
    get activeElement() {
      return activeElement;
    },
    documentElement: { dataset: {}, dir: '' },
    defaultView: {
      get scrollX() {
        return 0;
      },
      get scrollY() {
        return scrollY;
      },
      ...(resourceSnapshot === undefined && !trackScrollClaims
        ? {}
        : {
            __LYRA_MODAL_RESOURCE_TRACKER__: {
              restore: () => true,
              snapshot: () => ({
                listeners: 0,
                timers: 0,
                ...(resourceSnapshot === undefined ? {} : structuredClone(resourceSnapshot())),
                ...(trackScrollClaims
                  ? {
                      claims: [...scrollClaims].map(([owner, id]) => ({
                        id,
                        kind: 'scroll-lock',
                        owner,
                      })),
                    }
                  : {}),
              }),
            },
          }),
      Event: class {
        constructor(type, init = {}) {
          this.type = type;
          Object.assign(this, init);
          this.defaultPrevented = false;
        }
        preventDefault() {
          this.defaultPrevented = true;
        }
      },
    },
    getElementById(id) {
      return { [renderedTitleId]: title, [renderedDescriptionId]: description }[id] ?? null;
    },
    querySelector(selector) {
      const operation = /data-modal-operation="([^"]+)"/u.exec(selector)?.[1];
      const target = /data-modal-control="([^"]+)"/u.exec(selector)?.[1];
      if (operation !== undefined && target !== undefined) {
        return controls.get(`${operation}:${target}`) ?? null;
      }
      if (selector === '[data-modal-fixture-root]') return fixtureRoot;
      if (selector === '[data-fixture-control="opener"]') return opener;
      if (selector === '[data-fixture-part="backdrop"]') return backdrop;
      if (selector === '[data-modal-panel]') return nestedOpen ? childPanel : open ? panel : null;
      if (selector === '[data-modal-id="background"]') return background;
      if (selector === '[data-modal-id="child-modal-safe-target"]') return childTarget;
      if (selector === '[data-modal-id="outside-prevented-default"]') {
        return preventedOutsideTarget;
      }
      if (selector === '[data-modal-id="hydrated-input"]') {
        return missingHydrationInput ? null : hydrationInput;
      }
      if (selector === '[data-modal-id="first-eligible-target"]') return firstEligibleTarget;
      if (selector === '[data-modal-id="last-eligible-target"]') return lastEligibleTarget;
      if (selector === '[data-modal-id="middle-focus-target"]') return middleTarget;
      if (selector === '[data-modal-id="nearest-safe-target"]') return nearestTarget;
      if (selector === '[data-modal-id="page-scroll-surface"]') return pageScrollTarget;
      if (selector === '[data-modal-id="hidden-tab-target"]') return hiddenTarget;
      if (selector === '[data-modal-id="disabled-tab-target"]') return disabledTarget;
      if (selector === '[data-modal-id="removed-tab-target"]') return removedTarget;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-modal-panel]') {
        return [...(open ? [panel] : []), ...(nestedOpen ? [childPanel] : [])];
      }
      if (selector === '[role="dialog"], [role="alertdialog"]') {
        return [
          ...(open ? [panel] : []),
          ...(open && semanticContradiction ? [contradictoryPanel] : []),
          ...(nestedOpen ? [childPanel] : []),
        ];
      }
      if (selector === '[data-modal-id]') {
        return [
          background,
          opener,
          safeTarget,
          firstTarget,
          firstEligibleTarget,
          lastEligibleTarget,
          middleTarget,
          nearestTarget,
          hiddenTarget,
          disabledTarget,
          removedTarget,
          childTarget,
          pageScrollTarget,
          preventedOutsideTarget,
          backdrop,
          ...(open || portalLeak ? [panel] : []),
          ...(open && semanticContradiction ? [contradictoryPanel] : []),
          ...(nestedOpen ? [childPanel] : []),
        ];
      }
      if (selector === '[aria-live]') return live.textContent === '' ? [] : [live];
      if (selector === '[data-modal-portal]') {
        return [...(open || portalLeak ? [panel] : []), ...(nestedOpen ? [childPanel] : [])];
      }
      if (selector === '[data-modal-focus-guard], [data-focus-guard], [data-modal-guard]') {
        return trackGuards && open ? [focusGuard] : [];
      }
      return [];
    },
  };
  const fixture = {
    cleanup() {
      if (destroyed) return { status: 'already-destroyed' };
      destroyed = true;
      open = portalLeak;
      nestedOpen = false;
      body.style.overflow = '';
      background.inert = false;
      background.removeAttribute('inert');
      background.removeAttribute('aria-hidden');
      return { status: 'destroyed' };
    },
    destroy() {
      if (destroyed) return false;
      destroyed = true;
      return true;
    },
    isDestroyed: () => destroyed,
    observe: () => ({
      roles: [],
      relationships: [],
      states: [],
      focus: { target: 'modal-fixture-root' },
      events: structuredClone(events),
      announcements: [],
      cleanup: [],
      diagnostics: {},
    }),
  };
  return {
    actions,
    controls,
    document,
    fixture,
    setRootHasChildren(value) {
      rootHasChildren = value;
    },
    setHydrationMarkup(value) {
      rootMarkup = value;
    },
  };
}

function candidateOwnedBrowserHarness(
  scenario,
  {
    ariaModal = 'true',
    acquirePortalOnDestroy = false,
    emptyCandidate = false,
    ignoreOpenFocus = false,
    leakListener = false,
    listenerDuringCleanup = 'none',
    leakPortal = false,
    leakTimer = false,
    modalListenerType = 'keydown',
    semanticContradiction = false,
    semanticEventContradiction = false,
    timerDuringCleanup = false,
    transientListenerDuringOperation = 'none',
  } = {},
) {
  let nextTimerHandle = 0;
  const nativeTimers = new Map();
  class BrowserEventTarget {
    constructor() {
      this.nativeListeners = [];
    }
    addEventListener(type, listener, options) {
      if (options?.signal?.aborted === true) return;
      const capture = typeof options === 'boolean' ? options : options?.capture === true;
      if (
        this.nativeListeners.some(
          (entry) =>
            entry.type === type && entry.listener === listener && entry.capture === capture,
        )
      ) {
        return;
      }
      this.nativeListeners.push({ capture, listener, options, type });
    }
    removeEventListener(type, listener, options) {
      const capture = typeof options === 'boolean' ? options : options?.capture === true;
      this.nativeListeners = this.nativeListeners.filter(
        (entry) => entry.type !== type || entry.listener !== listener || entry.capture !== capture,
      );
    }
    dispatchEvent(event) {
      for (const entry of [...this.nativeListeners]) {
        if (entry.type !== event.type) continue;
        if (typeof entry.listener === 'function') entry.listener.call(this, event);
        else entry.listener.handleEvent(event);
        if (entry.options?.once === true) {
          this.removeEventListener(entry.type, entry.listener, entry.capture);
        }
      }
      return event.defaultPrevented !== true;
    }
  }
  const scope = {
    Event: class {
      constructor(type, init = {}) {
        this.type = type;
        Object.assign(this, init);
        this.defaultPrevented = false;
      }
      preventDefault() {
        this.defaultPrevented = true;
      }
    },
    EventTarget: BrowserEventTarget,
    clearInterval(handle) {
      nativeTimers.delete(handle);
    },
    clearTimeout(handle) {
      nativeTimers.delete(handle);
    },
    setInterval(callback) {
      const handle = ++nextTimerHandle;
      nativeTimers.set(handle, callback);
      return handle;
    },
    setTimeout(callback) {
      const handle = ++nextTimerHandle;
      nativeTimers.set(handle, callback);
      return handle;
    },
    scrollX: 0,
    scrollY: 0,
  };
  const tracker = installModalResourceTracker(scope);
  const elements = [];
  let activeElement;
  class BrowserElement extends BrowserEventTarget {
    constructor(attributes = {}, { connected = true, textContent = '', value } = {}) {
      super();
      this.attributes = new Map(Object.entries(attributes));
      this.disabled = false;
      this.hidden = false;
      this.inert = false;
      this.isConnected = connected;
      this.style = { overflow: '' };
      this.textContent = textContent;
      this.value = value;
      elements.push(this);
    }
    click() {
      this.dispatchEvent(new scope.Event('click', { bubbles: true, cancelable: true }));
    }
    closest(selector) {
      return selector === '[data-modal-panel]' && this.hasAttribute('data-modal-panel')
        ? this
        : null;
    }
    focus() {
      activeElement = this;
    }
    getAttribute(name) {
      return this.attributes.get(name) ?? null;
    }
    hasAttribute(name) {
      return this.attributes.has(name);
    }
    remove() {
      this.isConnected = false;
    }
    removeAttribute(name) {
      this.attributes.delete(name);
    }
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
    }
  }

  const body = new BrowserElement({ 'data-modal-id': 'document-body' });
  const documentElement = new BrowserElement();
  documentElement.dataset = {};
  documentElement.dir = '';
  const root = new BrowserElement({ 'data-modal-fixture-root': '' });
  let rootHasChildren = false;
  let rootMarkup = '';
  root.hasChildNodes = () => rootHasChildren;
  Object.defineProperty(root, 'innerHTML', {
    configurable: true,
    get: () => rootMarkup,
    set: (value) => {
      rootMarkup = value;
    },
  });
  root.querySelectorAll = () => [];
  activeElement = body;
  const connected = () => elements.filter((element) => element.isConnected !== false);
  const document = Object.assign(new BrowserEventTarget(), {
    body,
    defaultView: scope,
    documentElement,
    getElementById(id) {
      return connected().find((element) => element.getAttribute('id') === id) ?? null;
    },
    querySelector(selector) {
      const operation = /data-modal-operation="([^"]+)"/u.exec(selector)?.[1];
      const target = /data-modal-control="([^"]+)"/u.exec(selector)?.[1];
      if (operation !== undefined && target !== undefined) {
        return (
          connected().find(
            (element) =>
              element.getAttribute('data-modal-operation') === operation &&
              element.getAttribute('data-modal-control') === target,
          ) ?? null
        );
      }
      if (selector === '[data-modal-fixture-root]') return root;
      if (selector === '[data-modal-panel]') {
        return connected().find((element) => element.hasAttribute('data-modal-panel')) ?? null;
      }
      if (selector === '[data-fixture-part="backdrop"]') {
        return connected().find((element) => element.hasAttribute('data-fixture-part')) ?? null;
      }
      const modalId = /^\[data-modal-id="([^"]+)"\]$/u.exec(selector)?.[1];
      if (modalId !== undefined) {
        return (
          connected().find((element) => element.getAttribute('data-modal-id') === modalId) ?? null
        );
      }
      return null;
    },
    querySelectorAll(selector) {
      const current = connected();
      if (selector === '[data-modal-panel]') {
        return current.filter((element) => element.hasAttribute('data-modal-panel'));
      }
      if (selector === '[role="dialog"], [role="alertdialog"]') {
        return current.filter((element) =>
          ['dialog', 'alertdialog'].includes(element.getAttribute('role')),
        );
      }
      if (selector === '[data-modal-id]') {
        return current.filter((element) => element.hasAttribute('data-modal-id'));
      }
      if (selector === '[aria-live]') {
        return current.filter((element) => element.hasAttribute('aria-live'));
      }
      if (selector === '[data-modal-portal]') {
        return current.filter((element) => element.hasAttribute('data-modal-portal'));
      }
      if (selector === '[data-modal-focus-guard], [data-focus-guard], [data-modal-guard]') {
        return current.filter(
          (element) =>
            element.hasAttribute('data-modal-focus-guard') ||
            element.hasAttribute('data-focus-guard') ||
            element.hasAttribute('data-modal-guard'),
        );
      }
      if (
        selector ===
        '[data-modal-fixture-root], [data-modal-id="background"], [inert], [aria-hidden="true"]'
      ) {
        return current.filter(
          (element) =>
            element.hasAttribute('data-modal-fixture-root') ||
            element.getAttribute('data-modal-id') === 'background' ||
            element.inert === true ||
            element.hasAttribute('inert') ||
            element.getAttribute('aria-hidden') === 'true',
        );
      }
      return [];
    },
  });
  Object.defineProperty(document, 'activeElement', {
    configurable: true,
    get: () => activeElement,
  });
  scope.document = document;

  const effectCleanups = [];
  const React = {
    createElement(type, props, ...children) {
      return {
        type,
        props: {
          ...(props ?? {}),
          ...(children.length === 0
            ? {}
            : { children: children.length === 1 ? children[0] : children }),
        },
      };
    },
    useEffect(effect) {
      const cleanup = effect();
      if (typeof cleanup === 'function') effectCleanups.push(cleanup);
    },
  };

  let candidateRenderCount = 0;
  let fixture;
  function ModalFixture({ onReady, request }) {
    candidateRenderCount += 1;
    const events = [];
    let destroyed = false;
    let modalListener;
    let modalTimer;
    let scrollClaim;
    const controlListeners = [];
    const title = new BrowserElement(
      { id: 'modal-title', 'data-modal-id': 'modal-title' },
      {
        textContent: scenario.scenarioId.endsWith('.unmount-cleanup.v1')
          ? 'Disposable workspace'
          : 'Workspace details',
      },
    );
    const description = new BrowserElement(
      { id: 'modal-description', 'data-modal-id': 'modal-description' },
      { textContent: 'Candidate-owned modal description' },
    );
    const background = new BrowserElement({ 'data-modal-id': 'background' });
    const opener = new BrowserElement({ 'data-modal-id': 'modal-opener' });
    const safeTarget = new BrowserElement({ 'data-modal-id': 'modal-safe-target' });
    const live = new BrowserElement({
      'aria-live': 'polite',
      'data-modal-id': 'modal-live-region',
    });
    const owner = new BrowserElement(
      { 'aria-owns': 'modal-portal', 'data-modal-id': 'modal-owner' },
      { connected: false },
    );
    const portal = new BrowserElement(
      { id: 'modal-portal', 'data-modal-id': 'modal-portal' },
      { connected: false },
    );
    const guard = new BrowserElement({ 'data-modal-focus-guard': '' }, { connected: false });
    const panel = new BrowserElement(
      {
        'aria-describedby': 'modal-description',
        'aria-labelledby': 'modal-title',
        'aria-modal': ariaModal,
        'data-modal-id': 'modal-panel',
        'data-modal-panel': '',
        'data-modal-portal': '',
        role: 'dialog',
      },
      { connected: false },
    );
    const contradictoryPanel = new BrowserElement(
      {
        'aria-modal': ariaModal === 'true' ? 'false' : 'true',
        'data-modal-id': 'modal-panel',
        'data-modal-panel': '',
        role: 'dialog',
      },
      { connected: false },
    );
    const focusLoop = () => {};
    const addTransientModalListener = () => {
      const transientListener = () => {};
      panel.addEventListener(modalListenerType, transientListener);
      panel.removeEventListener(modalListenerType, transientListener);
    };
    const connectModal = () => {
      if (emptyCandidate) return;
      panel.isConnected = true;
      owner.isConnected = true;
      portal.isConnected = true;
      guard.isConnected = true;
      if (semanticContradiction) contradictoryPanel.isConnected = true;
      body.style.overflow = 'hidden';
      background.inert = true;
      background.setAttribute('inert', '');
      background.setAttribute('aria-hidden', 'true');
      modalListener ??= focusLoop;
      panel.addEventListener(modalListenerType, modalListener);
      modalTimer ??= scope.setInterval(() => {}, 1_000);
      scrollClaim ??= tracker.acquireClaim({ kind: 'scroll-lock', owner: 'modal-panel' });
      if (!ignoreOpenFocus) safeTarget.focus();
      events.push({ target: 'modal-panel', type: 'opened' });
      if (semanticEventContradiction) events.push({ target: 'modal-panel', type: 'closed' });
      live.textContent = `${title.textContent} dialog opened`;
    };
    const releaseModal = () => {
      if (!leakListener && modalListener !== undefined) {
        panel.removeEventListener(modalListenerType, modalListener);
        modalListener = undefined;
      }
      if (!leakTimer && modalTimer !== undefined) {
        scope.clearInterval(modalTimer);
        modalTimer = undefined;
      }
      scrollClaim?.release();
      scrollClaim = undefined;
      if (!leakPortal) {
        panel.isConnected = false;
        contradictoryPanel.isConnected = false;
      }
      owner.isConnected = false;
      portal.isConnected = leakPortal;
      guard.isConnected = false;
      body.style.overflow = '';
      background.inert = false;
      background.removeAttribute('inert');
      background.removeAttribute('aria-hidden');
      opener.focus();
    };
    const complete = (control) => {
      const count = Number(control.getAttribute('data-modal-completion-count') ?? '0');
      control.setAttribute('data-modal-completion-count', String(count + 1));
    };
    if (!emptyCandidate) {
      for (const operation of scenario.operations) {
        const control = new BrowserElement({
          'data-modal-completion-count': '0',
          'data-modal-control': operation.target,
          'data-modal-id': operation.target,
          'data-modal-operation': operation.operation,
        });
        const eventType = operation.operation === 'press' ? 'keydown' : 'click';
        const handler = () => {
          if (operation.operation === 'open') connectModal();
          else if (operation.operation === 'close') {
            releaseModal();
            events.push({ target: 'modal-panel', type: 'closed' });
            live.textContent = `${title.textContent} dialog closed`;
          } else if (operation.operation === 'destroy') {
            releaseModal();
            if (acquirePortalOnDestroy && operation.target === 'exit-phase-modal') {
              panel.isConnected = true;
            }
            events.push({ target: operation.target, type: 'destroyed-once' });
            live.textContent = 'Disposable workspace dialog removed';
          }
          if (transientListenerDuringOperation === operation.operation) {
            addTransientModalListener();
          }
          complete(control);
        };
        control.addEventListener(eventType, handler);
        controlListeners.push({ control, eventType, handler });
      }
    }
    fixture = Object.freeze({
      cleanup() {
        if (destroyed) return { status: 'already-destroyed' };
        destroyed = true;
        return { status: 'destroyed' };
      },
      destroy() {
        if (destroyed) return false;
        destroyed = true;
        return true;
      },
      isDestroyed: () => destroyed,
      observe: () => ({
        announcements: [],
        cleanup: [],
        diagnostics: {},
        events: structuredClone(events),
        focus: { target: 'modal-fixture-root' },
        relationships: [],
        roles: [],
        states: [],
      }),
    });
    React.useEffect(() => {
      onReady(fixture);
    }, [fixture, onReady]);
    React.useEffect(
      () => () => {
        releaseModal();
        for (const { control, eventType, handler } of controlListeners) {
          control.removeEventListener(eventType, handler);
          control.isConnected = false;
        }
        for (const element of [
          title,
          description,
          background,
          opener,
          safeTarget,
          live,
          owner,
          portal,
          guard,
        ]) {
          element.isConnected = false;
        }
      },
      [],
    );
    return React.createElement('section', { 'data-candidate-root': '' });
  }

  return {
    React,
    createModalCandidate: async () => ({ ModalFixture }),
    createRoot: () => ({
      render(element) {
        rootHasChildren = true;
        rootMarkup = '<section data-candidate-root></section>';
        element.type(element.props);
      },
      unmount() {
        for (const cleanup of effectCleanups.splice(0).reverse()) cleanup();
        if (listenerDuringCleanup !== 'none') {
          const cleanupListener = () => {};
          root.addEventListener('keydown', cleanupListener);
          if (listenerDuringCleanup === 'transient') {
            root.removeEventListener('keydown', cleanupListener);
          }
        }
        if (timerDuringCleanup) {
          const cleanupTimer = scope.setTimeout(() => {}, 0);
          scope.clearTimeout(cleanupTimer);
        }
        rootHasChildren = false;
        rootMarkup = '';
      },
    }),
    document,
    get candidateRenderCount() {
      return candidateRenderCount;
    },
    get fixture() {
      return fixture;
    },
    tracker,
  };
}

test('runtime exposes only the eight Lyra-owned fixture operations', () => {
  const runtime = createModalRuntime(validRequest);
  assert.deepEqual(Object.keys(runtime.operations), [
    'open',
    'close',
    'press',
    'point',
    'setDirection',
    'setMotionPreference',
    'updateContent',
    'destroy',
  ]);
  assert.deepEqual(runtime.request, validRequest);
});

test('an accepted action emits one neutral event and snapshots its resource', () => {
  const runtime = createModalRuntime(validRequest);
  assert.equal(
    runtime.operations.open({
      event: { target: 'modal-panel', type: 'opened' },
      resource: 'background-inert',
    }),
    true,
  );
  const observation = runtime.observe();
  assert.deepEqual(observation.events, [{ target: 'modal-panel', type: 'opened' }]);
  assert.deepEqual(observation.cleanup, ['background-inert']);
  observation.events[0].type = 'changed-after-snapshot';
  assert.deepEqual(runtime.observe().events, [{ target: 'modal-panel', type: 'opened' }]);
});

test('a prevented action leaves state and resources unchanged', () => {
  const runtime = createModalRuntime(validRequest);
  runtime.operations.open({
    event: { target: 'modal-panel', type: 'opened' },
    resource: 'background-inert',
  });
  const before = runtime.observe();
  assert.equal(
    runtime.operations.close({
      prevented: true,
      event: { target: 'modal-panel', type: 'closed' },
      resource: 'focus-restore',
    }),
    false,
  );
  assert.deepEqual(runtime.observe(), before);
});

test('destroy is idempotent and stale callbacks cannot append events', () => {
  const runtime = createModalRuntime(validRequest);
  runtime.operations.open({
    event: { target: 'modal-panel', type: 'opened' },
    resource: 'background-inert',
  });
  const staleCallback = () =>
    runtime.operations.close({ event: { target: 'modal-panel', type: 'late-event' } });
  runtime.destroy();
  const afterFirstDestroy = runtime.observe();
  runtime.destroy();
  assert.deepEqual(runtime.observe(), afterFirstDestroy);
  assert.deepEqual(afterFirstDestroy.cleanup, []);
  assert.equal(staleCallback(), false);
  assert.deepEqual(runtime.observe(), afterFirstDestroy);
  assert.deepEqual(runtime.cleanup(), { status: 'already-destroyed' });
});

test('rejects a vendor fact in an accepted normative event', () => {
  const runtime = createModalRuntime(validRequest);
  assert.equal(
    runtime.operations.open({ event: { target: 'modal-panel', type: 'radix-opened' } }),
    false,
  );
  assert.deepEqual(runtime.observe().events, []);
});

test('derives SSR semantics from actual rendered markup without reading expected records', async () => {
  const { observeModalSsrMarkup } = await import('./runtime.mjs');
  const request = structuredClone(validRequest);
  request.scenario = modalExecutionScenario(
    MODAL_SCENARIOS.find(({ scenarioId }) => scenarioId.endsWith('.ssr-open-semantics.v1')),
  );
  request.cell.id = 'ssr';
  const markup =
    '<section role="dialog" data-modal-observation-id="server-rendered-modal" aria-labelledby="server-modal-title"><h2 id="server-modal-title">Server workspace</h2></section>';
  const observation = observeModalSsrMarkup({ request, html: markup });
  assert.deepEqual(
    Object.fromEntries(
      ['roles', 'relationships', 'states', 'focus', 'events', 'announcements', 'cleanup'].map(
        (key) => [key, observation[key]],
      ),
    ),
    {
      roles: [{ role: 'dialog', name: 'Server workspace' }],
      relationships: [
        { source: 'server-rendered-modal', name: 'labelled-by', target: 'server-modal-title' },
      ],
      states: [
        { target: 'server-rendered-modal', name: 'semantically-available', value: true },
        { target: 'browser-globals', name: 'accessed', value: false },
      ],
      focus: { target: 'server-document-focus-unchanged' },
      events: [{ target: 'server-rendered-modal', type: 'rendered-open' }],
      announcements: [{ message: 'Server workspace dialog is available' }],
      cleanup: ['no-browser-resource-claims'],
    },
  );
  const traceWithoutProbes = observation.trace.map(({ snapshot, ...entry }) => {
    const { probes, ...facts } = snapshot;
    return { ...entry, snapshot: facts };
  });
  assert.deepEqual(traceWithoutProbes, [
    {
      phase: 'server-render',
      snapshot: {
        roles: observation.roles,
        relationships: observation.relationships,
        states: observation.states,
        focus: observation.focus,
        events: observation.events,
        announcements: observation.announcements,
      },
    },
  ]);
  assert.equal(observation.trace[0].snapshot.probes.length, request.scenario.probes.length);
  assert.deepEqual(observation.diagnostics, {
    cleanupObserved: true,
    executionCompleted: true,
  });
});

test('derives SSR browser-global and resource facts from the actual execution environment', async () => {
  const { observeModalSsrMarkup } = await import('./runtime.mjs');
  const request = structuredClone(validRequest);
  request.scenario = modalExecutionScenario(
    MODAL_SCENARIOS.find(({ scenarioId }) => scenarioId.endsWith('.ssr-open-semantics.v1')),
  );
  request.cell.id = 'ssr';
  const previousDocument = globalThis.document;
  try {
    globalThis.document = { activeElement: {} };
    const observation = observeModalSsrMarkup({
      request,
      html: '<section role="dialog" data-modal-id="server-rendered-modal" aria-labelledby="server-modal-title"><h2 id="server-modal-title">Server workspace</h2></section>',
    });
    assert.deepEqual(
      observation.states.find(({ target }) => target === 'browser-globals'),
      { target: 'browser-globals', name: 'accessed', value: true },
    );
    assert.equal(observation.cleanup.includes('no-browser-resource-claims'), false);
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});

test('tracks actual browser listeners and timers without claimed release markers', () => {
  let nextTimer = 0;
  const timers = new Map();
  class FakeEventTarget {
    listeners = [];
    addEventListener(type, listener, options) {
      if (options?.signal?.aborted === true) return;
      this.listeners.push({ type, listener, options });
      if (options?.signal !== undefined) {
        options.signal.listeners.push({
          type: 'abort',
          listener: () => {
            this.listeners = this.listeners.filter(
              (entry) => entry.type !== type || entry.listener !== listener,
            );
          },
          options: { once: true },
        });
      }
    }
    removeEventListener(type, listener) {
      this.listeners = this.listeners.filter(
        (entry) => entry.type !== type || entry.listener !== listener,
      );
    }
    dispatchEvent(event) {
      const matching = this.listeners.filter(({ type }) => type === event.type);
      for (const entry of matching) {
        if (typeof entry.listener === 'function') entry.listener.call(this, event);
        else entry.listener.handleEvent(event);
        if (entry.options?.once === true) {
          this.listeners = this.listeners.filter((candidate) => candidate !== entry);
        }
      }
    }
  }
  class FakeAbortSignal extends FakeEventTarget {
    aborted = false;
    abort() {
      this.aborted = true;
      this.dispatchEvent({ type: 'abort' });
    }
  }
  const scope = {
    EventTarget: FakeEventTarget,
    clearInterval(handle) {
      timers.delete(handle);
    },
    clearTimeout(handle) {
      timers.delete(handle);
    },
    setInterval(callback) {
      const handle = ++nextTimer;
      timers.set(handle, callback);
      return handle;
    },
    setTimeout(callback) {
      const handle = ++nextTimer;
      timers.set(handle, callback);
      return handle;
    },
  };
  const tracker = installModalResourceTracker(scope);
  const totals = () => {
    const { listeners, timers } = tracker.snapshot();
    return { listeners, timers };
  };
  const target = new FakeEventTarget();
  const listener = () => {};
  target.addEventListener('keydown', listener);
  const timeout = scope.setTimeout(() => {}, 10);
  const interval = scope.setInterval(() => {}, 10);
  assert.deepEqual(totals(), { listeners: 1, timers: 2 });
  assert.equal(Array.isArray(tracker.snapshot().listenerEntries), true);
  assert.deepEqual(
    tracker.snapshot().listenerEntries.map(({ owner, purpose, type }) => ({
      owner,
      purpose,
      type,
    })),
    [{ owner: 'event-target', purpose: 'other', type: 'keydown' }],
  );
  target.removeEventListener('keydown', listener);
  scope.clearTimeout(timeout);
  scope.clearInterval(interval);
  assert.deepEqual(totals(), { listeners: 0, timers: 0 });

  target.addEventListener('focusin', listener, { once: true });
  assert.deepEqual(totals(), { listeners: 1, timers: 0 });
  target.dispatchEvent({ type: 'focusin' });
  assert.deepEqual(totals(), { listeners: 0, timers: 0 });

  const signal = new FakeAbortSignal();
  target.addEventListener('pointerdown', listener, { signal });
  assert.deepEqual(totals(), { listeners: 1, timers: 0 });
  signal.abort();
  assert.deepEqual(totals(), { listeners: 0, timers: 0 });
  tracker.restore();
});

test('records immutable listener purpose, owner, target, and operation at acquisition', () => {
  class FakeEventTarget {
    constructor(id, owner = undefined) {
      this.id = id;
      this.owner = owner;
      this.listeners = [];
    }
    addEventListener(type, listener) {
      this.listeners.push({ listener, type });
    }
    removeEventListener(type, listener) {
      this.listeners = this.listeners.filter(
        (entry) => entry.type !== type || entry.listener !== listener,
      );
    }
    closest(selector) {
      return selector === '[data-modal-panel]' ? this.owner : null;
    }
    getAttribute(name) {
      return name === 'data-modal-id' ? this.id : null;
    }
  }
  const scope = {
    EventTarget: FakeEventTarget,
    clearInterval() {},
    clearTimeout() {},
    setInterval: () => 1,
    setTimeout: () => 2,
  };
  const tracker = installModalResourceTracker(scope);
  const owner = new FakeEventTarget('original-modal');
  const target = new FakeEventTarget('original-target', owner);
  const focusRestore = () => {};
  const dismiss = () => {};

  tracker.runInPhase(
    {
      operation: 'open',
      owner: 'ignored-operation-target',
      phase: 'operation',
      purpose: 'focus-restore',
    },
    () => target.addEventListener('keydown', focusRestore),
  );
  tracker.runInPhase(
    {
      operation: 'open',
      owner: 'ignored-operation-target',
      phase: 'operation',
      purpose: 'dismiss',
    },
    () => target.addEventListener('keydown', dismiss),
  );
  owner.id = 'mutated-modal';
  target.id = 'mutated-target';

  assert.deepEqual(
    tracker
      .snapshot()
      .listenerEntries.map(
        ({ acquiredOperation, owner: entryOwner, purpose, target: entryTarget, type }) => ({
          acquiredOperation,
          owner: entryOwner,
          purpose,
          target: entryTarget,
          type,
        }),
      ),
    [
      {
        acquiredOperation: 'open',
        owner: 'original-modal',
        purpose: 'focus-restore',
        target: 'original-target',
        type: 'keydown',
      },
      {
        acquiredOperation: 'open',
        owner: 'original-modal',
        purpose: 'dismiss',
        target: 'original-target',
        type: 'keydown',
      },
    ],
  );
  tracker.restore();
});

test('tracks distinct candidate-owned scroll claims until each owner releases', () => {
  class FakeEventTarget {
    addEventListener() {}
    removeEventListener() {}
  }
  const scope = {
    EventTarget: FakeEventTarget,
    clearInterval() {},
    clearTimeout() {},
    setInterval: () => 1,
    setTimeout: () => 2,
  };
  const tracker = installModalResourceTracker(scope);
  assert.equal(typeof tracker.acquireClaim, 'function');
  const first = tracker.acquireClaim({ kind: 'scroll-lock', owner: 'first-modal' });
  const second = tracker.acquireClaim({ kind: 'scroll-lock', owner: 'second-modal' });
  assert.deepEqual(
    tracker.snapshot().claims.map(({ kind, owner }) => ({ kind, owner })),
    [
      { kind: 'scroll-lock', owner: 'first-modal' },
      { kind: 'scroll-lock', owner: 'second-modal' },
    ],
  );
  assert.equal(second.release(), true);
  assert.deepEqual(tracker.snapshot().claims, [
    { id: 1, kind: 'scroll-lock', owner: 'first-modal' },
  ]);
  assert.equal(first.release(), true);
  assert.equal(first.release(), false);
  assert.deepEqual(tracker.snapshot().claims, []);
  tracker.restore();
});

test('the shared driver completes every immutable operation through behavior-bound controls', async (t) => {
  assert.equal(MODAL_SCENARIOS.length, 17);
  for (const scenario of MODAL_SCENARIOS) {
    await t.test(scenario.scenarioId, async () => {
      const request = requestFor(scenario);
      const harness = behaviorBrowserHarness(scenario, {
        resourceSnapshot: scenario.capture.includes('resources')
          ? () => ({ listeners: 0, timers: 0 })
          : undefined,
      });
      const observation = await executeModalBrowserScenario({
        document: harness.document,
        fixture: harness.fixture,
        input: {
          scenario,
          cell: request.cell,
          hydrate: scenario.scenarioId.endsWith('.hydration-stability.v1'),
          synthesizeHover: false,
        },
        request,
      });
      assert.equal(observation.diagnostics.executionCompleted, true);
      assert.deepEqual(
        observation.diagnostics.actions.map(({ operation, target }) => ({ operation, target })),
        scenario.operations,
      );
      assert.equal(
        observation.diagnostics.actions.every(({ completed }) => completed === true),
        true,
      );
      assert.equal(observation.trace.length, scenario.operations.length + 1);
    });
  }
});

test('normalizes candidate-generated ARIA references to neutral fixture targets', async () => {
  const scenario = MODAL_SCENARIOS[0];
  const request = requestFor(scenario);
  const harness = behaviorBrowserHarness(scenario, {
    descriptionId: 'modal-description',
    relationshipDescriptionId: 'radix-_r_2_',
    relationshipTitleId: 'radix-_r_1_',
    titleId: 'modal-title',
  });
  const observation = await executeModalBrowserScenario({
    document: harness.document,
    fixture: harness.fixture,
    input: { scenario, cell: request.cell, hydrate: false, synthesizeHover: false },
    request,
  });
  assert.deepEqual(observation.relationships, [
    { source: 'modal-panel', name: 'labelled-by', target: 'unresolved-reference' },
    { source: 'modal-panel', name: 'described-by', target: 'unresolved-reference' },
  ]);
});

test('does not expose a resolved vendor-generated DOM id as an ARIA relationship target', async () => {
  const scenario = MODAL_SCENARIOS[0];
  const request = requestFor(scenario);
  const harness = behaviorBrowserHarness(scenario, {
    descriptionId: null,
    relationshipDescriptionId: 'base-ui-_r_2_',
    relationshipTitleId: 'base-ui-_r_1_',
    renderedDescriptionId: 'base-ui-_r_2_',
    renderedTitleId: 'base-ui-_r_1_',
    titleId: null,
  });
  const observation = await executeModalBrowserScenario({
    document: harness.document,
    fixture: harness.fixture,
    input: { scenario, cell: request.cell, hydrate: false, synthesizeHover: false },
    request,
  });
  assert.deepEqual(observation.relationships, [
    { source: 'modal-panel', name: 'labelled-by', target: 'unresolved-reference' },
    { source: 'modal-panel', name: 'described-by', target: 'unresolved-reference' },
  ]);
});

test('resource probes are factual in every browser scenario that asserts cleanup', async () => {
  const execute = async (scenario) => {
    const request = requestFor(scenario);
    const harness = behaviorBrowserHarness(scenario, {
      resourceSnapshot: () => ({ listeners: 3, timers: 2 }),
    });
    return executeModalBrowserScenario({
      document: harness.document,
      fixture: harness.fixture,
      input: { scenario, cell: request.cell, hydrate: false, synthesizeHover: false },
      request,
    });
  };
  const ordinary = await execute(MODAL_SCENARIOS[0]);
  const cleanup = await execute(
    MODAL_SCENARIOS.find(({ scenarioId }) => scenarioId.endsWith('.unmount-cleanup.v1')),
  );
  assert.equal(
    ordinary.trace.some(({ snapshot }) => snapshot.resources !== undefined),
    true,
  );
  assert.deepEqual(cleanup.trace[0].snapshot.resources, {
    claims: [],
    listenerEntries: [],
    listenerLifecycles: [],
    listeners: 3,
    timerEntries: [],
    timerLifecycles: [],
    timers: 2,
  });
  for (const scenario of MODAL_SCENARIOS) {
    assert.equal(
      scenario.capture.includes('resources'),
      !scenario.scenarioId.endsWith('.ssr-open-semantics.v1'),
      scenario.scenarioId,
    );
  }
});

test('client hydration keeps factual execution and cleanup traces around the real root lifecycle', async () => {
  const { mountModalFixtureClient } = await import('./runtime.mjs');
  const scenario = MODAL_SCENARIOS.find(({ scenarioId }) =>
    scenarioId.endsWith('.hydration-stability.v1'),
  );
  const request = requestFor(scenario);
  request.cell.id = 'hydration';
  const harness = behaviorBrowserHarness(scenario);
  harness.setRootHasChildren(true);
  const calls = [];
  const bridge = await mountModalFixtureClient({
    React: {
      createElement(_type, props) {
        return { props };
      },
    },
    axe: {
      async run(target) {
        calls.push(['axe', target]);
        return { violations: [] };
      },
    },
    createModalCandidate: async () => ({ ModalFixture() {} }),
    createRoot() {
      throw new Error('createRoot must not run for server markup');
    },
    document: harness.document,
    hydrateRoot(target, element) {
      calls.push(['hydrateRoot', target]);
      element.props.onReady(harness.fixture);
      return {
        unmount() {
          calls.push(['unmount']);
          harness.setRootHasChildren(false);
        },
      };
    },
    request,
  });
  assert.equal(bridge.renderMode, 'hydrateRoot');
  const beforeCleanup = await bridge.runScenario({
    scenario,
    cell: request.cell,
    hydrate: true,
    synthesizeHover: false,
  });
  assert.equal(beforeCleanup.diagnostics.hydrate, true);
  await bridge.runAxe();
  const afterCleanup = await bridge.cleanup();
  assert.equal(afterCleanup.observation.trace.at(-1).phase, 'after-cleanup');
  assert.equal(
    calls.some(([name]) => name === 'hydrateRoot'),
    true,
  );
  assert.equal(
    calls.some(([name]) => name === 'axe'),
    true,
  );
  assert.equal(
    calls.some(([name]) => name === 'unmount'),
    true,
  );
});

test('surfaces an uncaught candidate render error and still unmounts before readiness', async () => {
  const { mountModalFixtureClient } = await import('./runtime.mjs');
  const scenario = MODAL_SCENARIOS[0];
  const request = requestFor(scenario);
  const harness = behaviorBrowserHarness(scenario);
  const renderError = new Error('candidate render failed before readiness');
  let rootOptions;
  let unmounts = 0;
  const mounted = await mountModalFixtureClient({
    React: {
      createElement(_type, props) {
        return { props };
      },
    },
    createModalCandidate: async () => ({ ModalFixture() {} }),
    createRoot(_container, options) {
      rootOptions = options;
      return {
        render() {
          options?.onUncaughtError?.(renderError);
        },
        unmount() {
          unmounts += 1;
          harness.setRootHasChildren(false);
        },
      };
    },
    document: harness.document,
    hydrateRoot() {
      throw new Error('unexpected hydration');
    },
    request,
  });

  assert.equal(typeof rootOptions?.onUncaughtError, 'function');
  assert.equal(mounted.readyStatus, 'failed');
  await assert.rejects(mounted.ready, /candidate render failed before readiness/u);
  assert.deepEqual(await mounted.cleanup(), { status: 'destroyed' });
  assert.equal(unmounts, 1);
});

test('captures hydration stability from the server tree before hydrateRoot and first client tree', async () => {
  const scenario = structuredClone(
    MODAL_SCENARIOS.find(({ scenarioId }) => scenarioId.endsWith('.hydration-stability.v1')),
  );
  scenario.operations = [{ operation: 'open', target: 'server-rendered-modal' }];
  delete scenario.probes;
  const request = requestFor(scenario);
  request.cell.id = 'hydration';
  const harness = behaviorBrowserHarness(scenario);
  harness.setRootHasChildren(true);
  const mounted = await (
    await import('./runtime.mjs')
  ).mountModalFixtureClient({
    React: {
      createElement(_type, props) {
        return { props };
      },
    },
    createModalCandidate: async () => ({ ModalFixture() {} }),
    createRoot() {
      throw new Error('unexpected createRoot');
    },
    document: harness.document,
    hydrateRoot(_target, element) {
      element.props.onReady(harness.fixture);
      return { unmount: () => harness.setRootHasChildren(false) };
    },
    request,
  });
  const observation = await mounted.runScenario({
    scenario,
    cell: request.cell,
    hydrate: true,
    synthesizeHover: false,
  });
  assert.deepEqual(observation.diagnostics.hydration, {
    controlledStateStable: true,
    firstTreeIdentical: true,
    focusMoved: false,
    generatedIdentifiersStable: true,
    inputValuesAfter: ['Workspace draft'],
    inputValuesBefore: ['Workspace draft'],
    modalIdentityStable: false,
    preHydrationFocus: 'document-body',
    recoveryPerformed: false,
    warningCount: 0,
  });
});

test('binds hydration probes to the measured first client tree instead of a success default', async () => {
  const scenario = MODAL_SCENARIOS.find(({ scenarioId }) =>
    scenarioId.endsWith('.hydration-stability.v1'),
  );
  const request = requestFor(scenario);
  request.cell.id = 'hydration';
  const harness = behaviorBrowserHarness(scenario);
  harness.setRootHasChildren(true);
  const mounted = await (
    await import('./runtime.mjs')
  ).mountModalFixtureClient({
    React: {
      createElement(_type, props) {
        return { props };
      },
    },
    createModalCandidate: async () => ({ ModalFixture() {} }),
    createRoot() {
      throw new Error('unexpected createRoot');
    },
    document: harness.document,
    hydrateRoot(_target, element) {
      harness.setHydrationMarkup('<input id="changed-input" value="changed">');
      element.props.onReady(harness.fixture);
      return { unmount: () => harness.setRootHasChildren(false) };
    },
    request,
  });
  const observation = await mounted.runScenario({
    scenario: request.scenario,
    cell: request.cell,
    hydrate: true,
    synthesizeHover: false,
  });
  const operationZero = observation.trace.find(
    ({ operationIndex, phase }) => phase === 'after-operation' && operationIndex === 0,
  );
  const fact = (target, property) => {
    const probe = scenario.probes.find(
      (entry) =>
        entry.category === 'states' && entry.target === target && entry.property === property,
    );
    return operationZero.snapshot.probes.find(({ id }) => id === probe.id).fact;
  };
  assert.deepEqual(fact('first-tree', 'identical'), {
    target: 'first-tree',
    name: 'identical',
    value: false,
  });
  assert.deepEqual(fact('hydration-recovery', 'performed'), {
    target: 'hydration-recovery',
    name: 'performed',
    value: true,
  });
  await mounted.cleanup();
});

test('derives layout, scroll-position, and scroll-resume probes from browser measurements', async () => {
  const scenario = MODAL_SCENARIOS.find(({ scenarioId }) =>
    scenarioId.endsWith('.scroll-lock-reference-count.v1'),
  );
  const request = requestFor(scenario);
  const harness = behaviorBrowserHarness(scenario, {
    layoutShiftOnFinalClose: 8,
    pageScrollChanges: true,
    stuckScrollLock: true,
  });
  const observation = await executeModalBrowserScenario({
    document: harness.document,
    fixture: harness.fixture,
    input: { scenario, cell: request.cell, hydrate: false, synthesizeHover: false },
    request,
  });
  const probeFact = (target, property) => {
    const probe = scenario.probes.find(
      (entry) => entry.target === target && entry.property === property,
    );
    return observation.trace
      .flatMap(({ snapshot }) => snapshot.probes ?? [])
      .find(({ id }) => id === probe.id).fact;
  };
  assert.deepEqual(probeFact('page-layout', 'shift'), {
    target: 'page-layout',
    name: 'shift',
    value: 8,
  });
  assert.deepEqual(probeFact('page-scroll-position', 'changed'), {
    target: 'page-scroll-position',
    name: 'changed',
    value: true,
  });
  assert.notEqual(probeFact('page-scroll', 'resumed'), 'page-scroll-resumed');
});

test('rejects the concrete 1,2,0,0 scroll mutation instead of accepting its maximum', async () => {
  const immutableScenario = MODAL_SCENARIOS.find(({ scenarioId }) =>
    scenarioId.endsWith('.scroll-lock-reference-count.v1'),
  );
  const scenario = structuredClone(immutableScenario);
  if (!scenario.capture.includes('resources')) scenario.capture.push('resources');
  const execute = async ({
    misattributeScrollClaims = false,
    prematureScrollClaimRelease = false,
  }) => {
    const request = requestFor(scenario);
    const harness = behaviorBrowserHarness(scenario, {
      prematureScrollClaimRelease,
      misattributeScrollClaims,
      trackScrollClaims: true,
    });
    return executeModalBrowserScenario({
      document: harness.document,
      fixture: harness.fixture,
      input: { scenario, cell: request.cell, hydrate: false, synthesizeHover: false },
      request,
    });
  };
  const claimHistory = (observation) =>
    observation.trace
      .slice(1, 5)
      .map(
        ({ snapshot }) =>
          snapshot.states.find(
            ({ name, target }) => target === 'page-scroll-claim' && name === 'remaining-count',
          )?.value,
      );
  const fact = (observation, target, property) => {
    const probe = scenario.probes.find(
      (entry) => entry.target === target && entry.property === property,
    );
    return observation.trace
      .flatMap(({ snapshot }) => snapshot.probes ?? [])
      .find(({ id }) => id === probe.id).fact;
  };

  const mutated = await execute({ prematureScrollClaimRelease: true });
  assert.notDeepEqual(fact(mutated, 'page-scroll-lock', 'maximum-claim-count'), {
    target: 'page-scroll-lock',
    name: 'maximum-claim-count',
    value: 2,
  });
  assert.notDeepEqual(fact(mutated, 'page-scroll-lock', 'final-claim-released'), {
    target: 'page-scroll-lock',
    type: 'final-claim-released',
  });
  assert.deepEqual(claimHistory(mutated), [1, 2, 0, 0]);

  const misattributed = await execute({ misattributeScrollClaims: true });
  assert.notDeepEqual(fact(misattributed, 'page-scroll-lock', 'maximum-claim-count'), {
    target: 'page-scroll-lock',
    name: 'maximum-claim-count',
    value: 2,
  });
  assert.notDeepEqual(fact(misattributed, 'page-scroll-lock', 'claim-acquired-per-modal'), {
    target: 'page-scroll-lock',
    type: 'claim-acquired-per-modal',
  });
  assert.notDeepEqual(fact(misattributed, 'page-scroll-lock', 'final-claim-released'), {
    target: 'page-scroll-lock',
    type: 'final-claim-released',
  });

  const correct = await execute({});
  assert.deepEqual(claimHistory(correct), [1, 2, 1, 0]);
  assert.deepEqual(fact(correct, 'page-scroll-lock', 'maximum-claim-count'), {
    target: 'page-scroll-lock',
    name: 'maximum-claim-count',
    value: 2,
  });
  assert.equal(immutableScenario.capture.includes('resources'), true);
});

test('rejects release and reacquisition hidden behind the same scroll-claim owner', async () => {
  const scenario = MODAL_SCENARIOS.find(({ scenarioId }) =>
    scenarioId.endsWith('.scroll-lock-reference-count.v1'),
  );
  const request = requestFor(scenario);
  const harness = behaviorBrowserHarness(scenario, {
    reacquireScrollClaimForSameOwner: true,
    trackScrollClaims: true,
  });
  const observation = await executeModalBrowserScenario({
    document: harness.document,
    fixture: harness.fixture,
    input: { scenario, cell: request.cell, hydrate: false, synthesizeHover: false },
    request,
  });
  const probe = scenario.probes.find(
    ({ property, target }) => target === 'page-scroll-lock' && property === 'maximum-claim-count',
  );
  const fact = observation.trace
    .flatMap(({ snapshot }) => snapshot.probes ?? [])
    .find(({ id }) => id === probe.id).fact;

  assert.deepEqual(
    observation.trace
      .slice(1, 5)
      .map(({ snapshot }) => snapshot.resources.claims.map(({ id, owner }) => ({ id, owner }))),
    [
      [{ id: 1, owner: 'first-modal' }],
      [
        { id: 2, owner: 'second-modal' },
        { id: 3, owner: 'first-modal' },
      ],
      [{ id: 3, owner: 'first-modal' }],
      [],
    ],
  );
  assert.deepEqual(fact, {
    target: 'page-scroll-lock',
    name: 'maximum-claim-count',
    value: 'unobserved',
  });
});

test('captures a factual snapshot after every completed browser operation', async () => {
  const scenario = structuredClone(MODAL_SCENARIOS[0]);
  scenario.operations = [
    { operation: 'open', target: 'modal-opener' },
    { operation: 'close', target: 'modal-panel' },
    { operation: 'open', target: 'modal-opener' },
  ];
  delete scenario.probes;
  const request = requestFor(scenario);
  const harness = behaviorBrowserHarness(scenario);
  const observation = await executeModalBrowserScenario({
    document: harness.document,
    fixture: harness.fixture,
    input: { scenario, cell: request.cell, hydrate: false, synthesizeHover: false },
    request,
  });
  assert.equal(observation.diagnostics.executionCompleted, true);
  assert.deepEqual(
    observation.trace.map(({ phase, operation }) => [phase, operation?.operation ?? null]),
    [
      ['before-operations', null],
      ['after-operation', 'open'],
      ['after-operation', 'close'],
      ['after-operation', 'open'],
    ],
  );
  assert.deepEqual(
    observation.trace.map(({ snapshot }) => snapshot.focus.target),
    ['document-body', 'modal-safe-target', 'modal-opener', 'modal-safe-target'],
  );
  assert.deepEqual(observation.trace[1].snapshot.roles, [
    { role: 'dialog', name: 'Behavior workspace' },
  ]);
  assert.deepEqual(observation.trace[2].snapshot.roles, []);
});

test('fails closed when a neutral control is missing and does not execute later operations', async () => {
  const scenario = structuredClone(MODAL_SCENARIOS[0]);
  scenario.operations = [
    { operation: 'open', target: 'modal-opener' },
    { operation: 'close', target: 'modal-panel' },
    { operation: 'open', target: 'modal-opener' },
  ];
  delete scenario.probes;
  const request = requestFor(scenario);
  const harness = behaviorBrowserHarness(scenario, { missingControl: 'close:modal-panel' });
  const observation = await executeModalBrowserScenario({
    document: harness.document,
    fixture: harness.fixture,
    input: { scenario, cell: request.cell, hydrate: false, synthesizeHover: false },
    request,
  });
  assert.equal(observation.diagnostics.executionCompleted, false);
  assert.deepEqual(
    observation.diagnostics.actions.map(({ operation, completed }) => [operation, completed]),
    [
      ['open', true],
      ['close', false],
    ],
  );
  assert.equal(observation.diagnostics.actions[1].failure, 'control-missing');
  assert.equal(harness.actions.filter(({ type }) => type === 'click').length, 1);
});

test('fails closed when the real hydrated interaction target is missing', async () => {
  const scenario = structuredClone(
    MODAL_SCENARIOS.find(({ scenarioId }) => scenarioId.endsWith('.hydration-stability.v1')),
  );
  scenario.operations = [{ operation: 'press', target: 'hydrated-input' }];
  delete scenario.probes;
  const request = requestFor(scenario);
  const harness = behaviorBrowserHarness(scenario, { missingHydrationInput: true });
  const observation = await executeModalBrowserScenario({
    document: harness.document,
    fixture: harness.fixture,
    input: { scenario, cell: request.cell, hydrate: true, synthesizeHover: false },
    request,
  });
  assert.equal(observation.diagnostics.executionCompleted, false);
  assert.equal(observation.diagnostics.actions[0].dispatched, false);
  assert.equal(observation.diagnostics.actions[0].failure, 'surface-missing');
});

test('disconnects the real scenario opener without deleting the generic fixture opener', async () => {
  const scenario = structuredClone(
    MODAL_SCENARIOS.find(({ scenarioId }) =>
      scenarioId.endsWith('.opener-restoration-successor.v1'),
    ),
  );
  scenario.operations = [
    { operation: 'open', target: 'connected-opener' },
    { operation: 'updateContent', target: 'disconnect-opener' },
  ];
  delete scenario.probes;
  const request = requestFor(scenario);
  const harness = behaviorBrowserHarness(scenario);
  const observation = await executeModalBrowserScenario({
    document: harness.document,
    fixture: harness.fixture,
    input: { scenario, cell: request.cell, hydrate: false, synthesizeHover: false },
    request,
  });
  assert.equal(observation.diagnostics.executionCompleted, true);
  assert.equal(harness.controls.get('open:connected-opener').isConnected, false);
  assert.equal(harness.document.querySelector('[data-fixture-control="opener"]').isConnected, true);
});

test('never removes the document body when candidate focus did not enter the modal', async () => {
  const scenario = structuredClone(MODAL_SCENARIOS[0]);
  scenario.operations = [
    { operation: 'open', target: 'modal-opener' },
    { operation: 'updateContent', target: 'remove-focused-target' },
  ];
  delete scenario.probes;
  const request = requestFor(scenario);
  const harness = behaviorBrowserHarness(scenario, { ignoreOpenFocus: true });
  const observation = await executeModalBrowserScenario({
    document: harness.document,
    fixture: harness.fixture,
    input: { scenario, cell: request.cell, hydrate: false, synthesizeHover: false },
    request,
  });
  assert.equal(harness.document.body.isConnected, true);
  assert.equal(observation.diagnostics.executionCompleted, false);
  assert.equal(observation.diagnostics.actions[1].failure, 'mutation-not-completed');
});

test('captures every pointer-origin variant against its real interaction surface', async () => {
  const scenario = MODAL_SCENARIOS.find(({ scenarioId }) =>
    scenarioId.endsWith('.pointer-origin-dismiss.v1'),
  );
  const request = requestFor(scenario);
  const harness = behaviorBrowserHarness(scenario);
  const observation = await executeModalBrowserScenario({
    document: harness.document,
    fixture: harness.fixture,
    input: { scenario, cell: request.cell, hydrate: false, synthesizeHover: false },
    request,
  });
  assert.equal(observation.diagnostics.executionCompleted, true);
  assert.deepEqual(
    observation.trace.slice(1).map(({ snapshot }) => snapshot.roles.length > 0),
    [true, false, true, true, true, true, true, true],
  );
  assert.equal(observation.diagnostics.actions.at(-1).prevented, true);
  assert.equal(
    observation.diagnostics.actions.at(-1).surfaces.includes('outside-prevented-default'),
    true,
  );
});

test('phase destroy does not disable later operations while fixture teardown remains terminal', () => {
  const runtime = createModalRuntime(validRequest);
  assert.equal(
    runtime.operations.destroy({
      event: { target: 'entry-phase-modal', type: 'destroyed-once' },
    }),
    true,
  );
  assert.equal(runtime.isDestroyed(), false);
  assert.equal(
    runtime.operations.open({ event: { target: 'open-phase-modal', type: 'opened' } }),
    true,
  );
  assert.equal(runtime.destroy(), true);
  assert.equal(runtime.isDestroyed(), true);
  assert.equal(runtime.operations.open({ event: { target: 'late-modal', type: 'opened' } }), false);
});

test('semantic, wrap, pointer-origin, and controlled-commit faults change factual traces', async () => {
  const execute = async (scenario, options) => {
    const request = requestFor(scenario);
    const harness = behaviorBrowserHarness(scenario, options);
    return executeModalBrowserScenario({
      document: harness.document,
      fixture: harness.fixture,
      input: { scenario, cell: request.cell, hydrate: false, synthesizeHover: false },
      request,
    });
  };
  const cases = [
    {
      name: 'semantic open',
      operations: [{ operation: 'open', target: 'modal-opener' }],
      fault: { ignoreOpen: true },
    },
    {
      name: 'focus wrap',
      operations: [
        { operation: 'open', target: 'modal-opener' },
        { operation: 'press', target: 'tab-from-last-target' },
      ],
      fault: { noWrap: true },
    },
    {
      name: 'pointer origin',
      operations: [
        { operation: 'open', target: 'modal-opener' },
        { operation: 'point', target: 'outside-down-up' },
      ],
      fault: { ignorePointerClose: true },
    },
    {
      name: 'controlled commit',
      operations: [
        { operation: 'open', target: 'controlled-modal' },
        { operation: 'press', target: 'dismiss-control' },
        { operation: 'updateContent', target: 'controlled-close-commit' },
      ],
      fault: { missingControlledCommit: true },
    },
  ];
  for (const { name, operations, fault } of cases) {
    const scenario = structuredClone(MODAL_SCENARIOS[0]);
    scenario.operations = operations;
    delete scenario.probes;
    if (operations.some(({ target }) => target === 'controlled-modal')) {
      scenario.initial.state.controlled = true;
    }
    const correct = await execute(scenario);
    const faulty = await execute(scenario, fault);
    assert.notDeepEqual(faulty.trace, correct.trace, `${name} fault must change trace`);
    if (name === 'semantic open') {
      assert.equal(correct.diagnostics.executionCompleted, true);
      assert.equal(faulty.diagnostics.executionCompleted, false);
      assert.equal(faulty.diagnostics.actions[0].failure, 'transition-not-completed');
    }
  }
});

test('returns cleanup evidence only after root unmount and actual resource release', async () => {
  const scenario = MODAL_SCENARIOS.find(({ scenarioId }) =>
    scenarioId.endsWith('.unmount-cleanup.v1'),
  );
  const request = requestFor(scenario);
  const harness = candidateOwnedBrowserHarness(scenario);
  const mounted = await (
    await import('./runtime.mjs')
  ).mountModalFixtureClient({
    React: harness.React,
    createModalCandidate: harness.createModalCandidate,
    createRoot: harness.createRoot,
    document: harness.document,
    hydrateRoot() {
      throw new Error('unexpected hydration');
    },
    request,
  });
  await mounted.runScenario({
    scenario,
    cell: request.cell,
    hydrate: false,
    synthesizeHover: false,
  });
  const result = await mounted.cleanup();
  assert.equal(harness.candidateRenderCount, 1);
  assert.equal(result.status, 'destroyed');
  assert.equal(result.observation.diagnostics.cleanupObserved, true);
  const cleanup = result.observation.trace.at(-1);
  assert.equal(cleanup.phase, 'after-cleanup');
  assert.deepEqual(cleanup.snapshot.resources, {
    claims: [],
    listenerEntries: [],
    listenerLifecycles: [
      {
        acquiredOperation: 'open',
        acquiredPhase: 'operation',
        id: 7,
        owner: 'modal-panel',
        purpose: 'other',
        releaseCount: 1,
        releasedOperation: 'destroy',
        releasedPhase: 'operation',
        target: 'modal-panel',
        type: 'keydown',
      },
      {
        acquiredOperation: 'open',
        acquiredPhase: 'operation',
        id: 8,
        owner: 'modal-panel',
        purpose: 'other',
        releaseCount: 1,
        releasedOperation: 'close',
        releasedPhase: 'operation',
        target: 'modal-panel',
        type: 'keydown',
      },
    ],
    listeners: 0,
    timerEntries: [],
    timerLifecycles: [
      {
        acquiredOperation: 'open',
        acquiredPhase: 'operation',
        id: 1,
        kind: 'interval',
        owner: 'open-phase-modal',
        purpose: 'other',
        releaseCount: 1,
        releasedOperation: 'destroy',
        releasedPhase: 'operation',
        target: 'window',
      },
      {
        acquiredOperation: 'open',
        acquiredPhase: 'operation',
        id: 2,
        kind: 'interval',
        owner: 'exit-phase-modal',
        purpose: 'other',
        releaseCount: 1,
        releasedOperation: 'close',
        releasedPhase: 'operation',
        target: 'window',
      },
    ],
    timers: 0,
  });
  assert.deepEqual(
    result.observation.states.filter(({ name }) => name === 'remaining-count'),
    [
      { target: 'modal-listeners', name: 'remaining-count', value: 0 },
      { target: 'background-inert-claim', name: 'remaining-count', value: 0 },
      { target: 'page-scroll-claim', name: 'remaining-count', value: 0 },
      { target: 'modal-timers', name: 'remaining-count', value: 0 },
      { target: 'modal-guards', name: 'remaining-count', value: 0 },
      { target: 'modal-portals', name: 'remaining-count', value: 0 },
    ],
  );
  assert.deepEqual(result.observation.cleanup, [
    'listeners-released-once',
    'inert-released-once',
    'scroll-released-once',
    'timers-released-once',
    'guards-released-once',
    'portal-released-once',
  ]);
  const { evaluateModalScenario } = await import('../../runner/modal.mjs');
  assert.equal(
    evaluateModalScenario({
      cellId: request.cell.id,
      scenario,
      observations: [{ reactVersion: request.cell.reactVersion, observation: result.observation }],
    }),
    true,
  );
});

test('a leaked candidate-owned focus-loop listener cannot emit released cleanup evidence', async () => {
  const { mountModalFixtureClient } = await import('./runtime.mjs');
  const scenario = MODAL_SCENARIOS.find(({ scenarioId }) =>
    scenarioId.endsWith('.focus-wrap-dynamic.v1'),
  );

  const execute = async (leakFocusLoopListener) => {
    const request = requestFor(scenario);
    const harness = candidateOwnedBrowserHarness(scenario, {
      leakListener: leakFocusLoopListener,
    });
    const mounted = await mountModalFixtureClient({
      React: harness.React,
      createModalCandidate: harness.createModalCandidate,
      createRoot: harness.createRoot,
      document: harness.document,
      hydrateRoot() {
        throw new Error('unexpected hydration');
      },
      request,
    });
    await mounted.runScenario({
      scenario,
      cell: request.cell,
      hydrate: false,
      synthesizeHover: false,
    });
    return (await mounted.cleanup()).observation;
  };

  const released = await execute(false);
  const leaked = await execute(true);
  assert.equal(released.cleanup.includes('focus-loop-listener-released'), true);
  assert.equal(leaked.cleanup.includes('focus-loop-listener-released'), false);
  assert.deepEqual(
    leaked.trace.at(-1).snapshot.resources.listenerEntries.map(({ owner, purpose, type }) => ({
      owner,
      purpose,
      type,
    })),
    [{ owner: 'modal-panel', purpose: 'focus-loop', type: 'keydown' }],
  );
  assert.equal(scenario.capture.includes('resources'), true);
});

test('a matching listener acquired only during cleanup cannot satisfy focus-loop release', async () => {
  const { mountModalFixtureClient } = await import('./runtime.mjs');
  const scenario = MODAL_SCENARIOS.find(({ scenarioId }) =>
    scenarioId.endsWith('.focus-wrap-dynamic.v1'),
  );
  const request = requestFor(scenario);
  const harness = candidateOwnedBrowserHarness(scenario, {
    listenerDuringCleanup: 'persistent',
  });
  const mounted = await mountModalFixtureClient({
    React: harness.React,
    createModalCandidate: harness.createModalCandidate,
    createRoot: harness.createRoot,
    document: harness.document,
    hydrateRoot() {
      throw new Error('unexpected hydration');
    },
    request,
  });
  await mounted.runScenario({
    scenario,
    cell: request.cell,
    hydrate: false,
    synthesizeHover: false,
  });
  const observation = (await mounted.cleanup()).observation;

  assert.deepEqual(
    observation.trace.at(-1).snapshot.resources.listenerEntries.map(({ owner, type }) => ({
      owner,
      type,
    })),
    [{ owner: 'modal-fixture-root', type: 'keydown' }],
  );
  assert.equal(observation.cleanup.includes('focus-loop-listener-released'), false);
});

test('a transient listener acquired and released during cleanup cannot satisfy focus-loop release', async () => {
  const { mountModalFixtureClient } = await import('./runtime.mjs');
  const scenario = MODAL_SCENARIOS.find(({ scenarioId }) =>
    scenarioId.endsWith('.focus-wrap-dynamic.v1'),
  );
  const request = requestFor(scenario);
  const harness = candidateOwnedBrowserHarness(scenario, {
    listenerDuringCleanup: 'transient',
  });
  const mounted = await mountModalFixtureClient({
    React: harness.React,
    createModalCandidate: harness.createModalCandidate,
    createRoot: harness.createRoot,
    document: harness.document,
    hydrateRoot() {
      throw new Error('unexpected hydration');
    },
    request,
  });
  await mounted.runScenario({
    scenario,
    cell: request.cell,
    hydrate: false,
    synthesizeHover: false,
  });
  const observation = (await mounted.cleanup()).observation;

  assert.deepEqual(observation.trace.at(-1).snapshot.resources.listenerEntries, []);
  assert.equal(observation.cleanup.includes('focus-loop-listener-released'), false);
});

test('cleanup facts reject listener identities first acquired during close, destroy, or teardown', async (t) => {
  const { mountModalFixtureClient } = await import('./runtime.mjs');
  const scenario = MODAL_SCENARIOS.find(({ scenarioId }) =>
    scenarioId.endsWith('.unmount-cleanup.v1'),
  );
  for (const acquiredOperation of ['close', 'destroy', 'teardown']) {
    await t.test(acquiredOperation, async () => {
      const request = requestFor(scenario);
      const harness = candidateOwnedBrowserHarness(scenario, {
        ...(acquiredOperation === 'teardown'
          ? { listenerDuringCleanup: 'transient' }
          : { transientListenerDuringOperation: acquiredOperation }),
      });
      const mounted = await mountModalFixtureClient({
        React: harness.React,
        createModalCandidate: harness.createModalCandidate,
        createRoot: harness.createRoot,
        document: harness.document,
        hydrateRoot() {
          throw new Error('unexpected hydration');
        },
        request,
      });
      await mounted.runScenario({
        scenario,
        cell: request.cell,
        hydrate: false,
        synthesizeHover: false,
      });
      const observation = (await mounted.cleanup()).observation;
      const invalidLifecycle = observation.trace
        .at(-1)
        .snapshot.resources.listenerLifecycles.find(
          (entry) => entry.acquiredOperation === acquiredOperation,
        );

      assert.equal(observation.cleanup.includes('listeners-released-once'), false);
      assert.notEqual(invalidLifecycle, undefined);
      assert.equal(invalidLifecycle.releaseCount, 1);
    });
  }
});

test('cleanup facts bind release proof to observed identities without treating allowed transient work as a leak', async () => {
  const { mountModalFixtureClient } = await import('./runtime.mjs');
  const scenario = MODAL_SCENARIOS.find(({ scenarioId }) =>
    scenarioId.endsWith('.focus-wrap-dynamic.v1'),
  );
  const request = requestFor(scenario);
  const harness = candidateOwnedBrowserHarness(scenario, {
    transientListenerDuringOperation: 'open',
  });
  const mounted = await mountModalFixtureClient({
    React: harness.React,
    createModalCandidate: harness.createModalCandidate,
    createRoot: harness.createRoot,
    document: harness.document,
    hydrateRoot() {
      throw new Error('unexpected hydration');
    },
    request,
  });
  await mounted.runScenario({
    scenario,
    cell: request.cell,
    hydrate: false,
    synthesizeHover: false,
  });
  const observation = (await mounted.cleanup()).observation;
  const observedIds = new Set(
    observation.trace
      .slice(0, -1)
      .flatMap(({ snapshot }) => snapshot.resources.listenerEntries.map(({ id }) => id)),
  );
  const unobservedLifecycles = observation.trace
    .at(-1)
    .snapshot.resources.listenerLifecycles.filter(({ id }) => !observedIds.has(id));

  assert.equal(unobservedLifecycles.length > 0, true, JSON.stringify(observation.trace, null, 2));
  assert.equal(
    unobservedLifecycles.every(
      ({ acquiredOperation, releaseCount, releasedOperation }) =>
        acquiredOperation === 'open' && releaseCount === 1 && releasedOperation === 'open',
    ),
    true,
  );
  assert.equal(observation.cleanup.includes('focus-loop-listener-released'), true);
});

test('cleanup listener probes bind purpose independently of the event type', async (t) => {
  const { mountModalFixtureClient } = await import('./runtime.mjs');
  const cases = [
    {
      scenarioSuffix: '.focus-wrap-dynamic.v1',
      listenerType: 'focusin',
      fact: 'focus-loop-listener-released',
      purpose: 'focus-loop',
    },
    {
      scenarioSuffix: '.focused-node-removal.v1',
      listenerType: 'keydown',
      fact: 'focus-recovery-listener-released',
      purpose: 'focus-restore',
    },
    {
      scenarioSuffix: '.pointer-origin-dismiss.v1',
      listenerType: 'click',
      fact: 'pointer-sequence-guard-released',
      purpose: 'pointer',
    },
  ];
  for (const { scenarioSuffix, listenerType, fact, purpose } of cases) {
    await t.test(`${listenerType} is recorded as ${purpose}`, async () => {
      const scenario = MODAL_SCENARIOS.find(({ scenarioId }) =>
        scenarioId.endsWith(scenarioSuffix),
      );
      const request = requestFor(scenario);
      const harness = candidateOwnedBrowserHarness(scenario, { modalListenerType: listenerType });
      const mounted = await mountModalFixtureClient({
        React: harness.React,
        createModalCandidate: harness.createModalCandidate,
        createRoot: harness.createRoot,
        document: harness.document,
        hydrateRoot() {
          throw new Error('unexpected hydration');
        },
        request,
      });
      await mounted.runScenario({
        scenario,
        cell: request.cell,
        hydrate: false,
        synthesizeHover: false,
      });
      const observation = (await mounted.cleanup()).observation;

      assert.equal(observation.cleanup.includes(fact), true);
      assert.equal(
        observation.trace
          .at(-1)
          .snapshot.resources.listenerLifecycles.every((entry) => entry.purpose === purpose),
        true,
      );
    });
  }
});

test('cleanup timer evidence rejects cleanup-only acquisition and records factual ownership', async () => {
  const { mountModalFixtureClient } = await import('./runtime.mjs');
  const scenario = MODAL_SCENARIOS.find(({ scenarioId }) =>
    scenarioId.endsWith('.unmount-cleanup.v1'),
  );
  const request = requestFor(scenario);
  const harness = candidateOwnedBrowserHarness(scenario, { timerDuringCleanup: true });
  const mounted = await mountModalFixtureClient({
    React: harness.React,
    createModalCandidate: harness.createModalCandidate,
    createRoot: harness.createRoot,
    document: harness.document,
    hydrateRoot() {
      throw new Error('unexpected hydration');
    },
    request,
  });
  await mounted.runScenario({
    scenario,
    cell: request.cell,
    hydrate: false,
    synthesizeHover: false,
  });
  const observation = (await mounted.cleanup()).observation;

  assert.equal(observation.cleanup.includes('timers-released-once'), false);
  assert.deepEqual(
    observation.trace
      .at(-1)
      .snapshot.resources.timerLifecycles.map(
        ({
          acquiredOperation,
          acquiredPhase,
          kind,
          owner,
          purpose,
          releaseCount,
          releasedOperation,
          releasedPhase,
          target,
        }) => ({
          acquiredOperation,
          acquiredPhase,
          kind,
          owner,
          purpose,
          releaseCount,
          releasedOperation,
          releasedPhase,
          target,
        }),
      ),
    [
      {
        acquiredOperation: 'open',
        acquiredPhase: 'operation',
        kind: 'interval',
        owner: 'open-phase-modal',
        purpose: 'other',
        releaseCount: 1,
        releasedOperation: 'destroy',
        releasedPhase: 'operation',
        target: 'window',
      },
      {
        acquiredOperation: 'open',
        acquiredPhase: 'operation',
        kind: 'interval',
        owner: 'exit-phase-modal',
        purpose: 'other',
        releaseCount: 1,
        releasedOperation: 'close',
        releasedPhase: 'operation',
        target: 'window',
      },
      {
        acquiredOperation: 'teardown',
        acquiredPhase: 'cleanup',
        kind: 'timeout',
        owner: 'fixture-cleanup',
        purpose: 'other',
        releaseCount: 1,
        releasedOperation: 'teardown',
        releasedPhase: 'cleanup',
        target: 'window',
      },
    ],
  );
});

test('cleanup count evidence rejects a portal acquired in the destroy phase', async () => {
  const { mountModalFixtureClient } = await import('./runtime.mjs');
  const scenario = MODAL_SCENARIOS.find(({ scenarioId }) =>
    scenarioId.endsWith('.unmount-cleanup.v1'),
  );
  const request = requestFor(scenario);
  const harness = candidateOwnedBrowserHarness(scenario, { acquirePortalOnDestroy: true });
  const mounted = await mountModalFixtureClient({
    React: harness.React,
    createModalCandidate: harness.createModalCandidate,
    createRoot: harness.createRoot,
    document: harness.document,
    hydrateRoot() {
      throw new Error('unexpected hydration');
    },
    request,
  });
  await mounted.runScenario({
    scenario,
    cell: request.cell,
    hydrate: false,
    synthesizeHover: false,
  });
  const observation = (await mounted.cleanup()).observation;

  assert.deepEqual(
    observation.trace.map(({ operation, phase, snapshot }) => ({
      count: snapshot.states.find(
        ({ name, target }) => target === 'modal-portals' && name === 'remaining-count',
      )?.value,
      operation: operation?.operation,
      phase,
    })),
    [
      { count: 0, operation: undefined, phase: 'before-operations' },
      { count: 0, operation: 'destroy', phase: 'after-operation' },
      { count: 1, operation: 'open', phase: 'after-operation' },
      { count: 0, operation: 'destroy', phase: 'after-operation' },
      { count: 1, operation: 'open', phase: 'after-operation' },
      { count: 0, operation: 'close', phase: 'after-operation' },
      { count: 1, operation: 'destroy', phase: 'after-operation' },
      { count: 0, operation: undefined, phase: 'after-cleanup' },
    ],
  );
  assert.equal(observation.cleanup.includes('portal-released-once'), false);
});

test('residual inert on the real fixture root survives cleanup and fails the evaluator', async () => {
  const { mountModalFixtureClient } = await import('./runtime.mjs');
  const { evaluateModalScenario } = await import('../../runner/modal.mjs');
  const scenario = MODAL_SCENARIOS.find(({ scenarioId }) =>
    scenarioId.endsWith('.semantics-isolation.v1'),
  );

  const execute = async (leakRootInert) => {
    const request = requestFor(scenario);
    const harness = behaviorBrowserHarness(scenario, {
      accessibleName: 'Workspace details',
      descriptionId: 'modal-description',
      resourceSnapshot: () => ({ listeners: 0, timers: 0 }),
      titleId: 'modal-title',
    });
    const rootElement = harness.document.querySelector('[data-modal-fixture-root]');
    const effectCleanups = [];
    const React = {
      createElement(type, props) {
        return { props: props ?? {}, type };
      },
      useEffect(effect) {
        const cleanup = effect();
        if (typeof cleanup === 'function') effectCleanups.push(cleanup);
      },
    };
    const mounted = await mountModalFixtureClient({
      React,
      createModalCandidate: async () => ({
        ModalFixture({ onReady }) {
          React.useEffect(() => {
            rootElement.inert = true;
            rootElement.setAttribute('inert', '');
            if (leakRootInert) return undefined;
            return () => {
              rootElement.inert = false;
              rootElement.removeAttribute('inert');
            };
          }, []);
          onReady(harness.fixture);
          return React.createElement('section', { 'data-candidate-root': '' });
        },
      }),
      createRoot: () => ({
        render(element) {
          harness.setRootHasChildren(true);
          element.type(element.props);
        },
        unmount() {
          for (const cleanup of effectCleanups.splice(0).reverse()) cleanup();
          harness.setRootHasChildren(false);
        },
      }),
      document: harness.document,
      hydrateRoot() {
        throw new Error('unexpected hydration');
      },
      request,
    });
    await mounted.runScenario({
      scenario,
      cell: request.cell,
      hydrate: false,
      synthesizeHover: false,
    });
    const observation = (await mounted.cleanup()).observation;
    return {
      observation,
      verdict: evaluateModalScenario({
        cellId: request.cell.id,
        scenario,
        observations: [{ reactVersion: request.cell.reactVersion, observation }],
      }),
    };
  };

  const released = await execute(false);
  const leaked = await execute(true);
  assert.equal(released.verdict, true);
  assert.equal(leaked.verdict, false);
  assert.deepEqual(
    leaked.observation.trace
      .at(-1)
      .snapshot.states.find(
        ({ name, target }) => target === 'background-inert-claim' && name === 'remaining-count',
      ),
    { target: 'background-inert-claim', name: 'remaining-count', value: 1 },
  );
  assert.equal(leaked.observation.cleanup.includes('background-interactive'), false);
});

test('feeds actual fake-candidate execution and cleanup into the production runner verdict', async () => {
  const { mountModalFixtureClient } = await import('./runtime.mjs');
  const { evaluateModalScenario } = await import('../../runner/modal.mjs');
  const scenario = MODAL_SCENARIOS.find(({ scenarioId }) =>
    scenarioId.endsWith('.semantics-isolation.v1'),
  );
  const execute = async (options = {}, emptyCandidate = false) => {
    const request = requestFor(scenario);
    const harness = candidateOwnedBrowserHarness(scenario, { ...options, emptyCandidate });
    const mounted = await mountModalFixtureClient({
      React: harness.React,
      createModalCandidate: harness.createModalCandidate,
      createRoot: harness.createRoot,
      document: harness.document,
      hydrateRoot() {
        throw new Error('unexpected hydration');
      },
      request,
    });
    await mounted.runScenario({
      scenario: request.scenario,
      cell: request.cell,
      hydrate: false,
      synthesizeHover: false,
    });
    const observation = (await mounted.cleanup()).observation;
    assert.equal(harness.candidateRenderCount, 1);
    return evaluateModalScenario({
      cellId: request.cell.id,
      scenario,
      observations: [{ reactVersion: request.cell.reactVersion, observation }],
    });
  };

  assert.equal(await execute(), true);
  assert.equal(await execute({ ariaModal: 'false' }), false);
  assert.equal(await execute({ ignoreOpenFocus: true }), false);
  assert.equal(await execute({ semanticContradiction: true }), false);
  assert.equal(await execute({ semanticEventContradiction: true }), false);
  assert.equal(await execute({}, true), false);
});

test('portal, listener, and timer leaks change the post-cleanup factual trace', async () => {
  const execute = async ({ leak }) => {
    const scenario = MODAL_SCENARIOS.find(({ scenarioId }) =>
      scenarioId.endsWith('.unmount-cleanup.v1'),
    );
    const request = requestFor(scenario);
    const harness = candidateOwnedBrowserHarness(scenario, {
      leakListener: leak,
      leakPortal: leak,
      leakTimer: leak,
    });
    const mounted = await (
      await import('./runtime.mjs')
    ).mountModalFixtureClient({
      React: harness.React,
      createModalCandidate: harness.createModalCandidate,
      createRoot: harness.createRoot,
      document: harness.document,
      hydrateRoot() {
        throw new Error('unexpected hydration');
      },
      request,
    });
    await mounted.runScenario({
      scenario,
      cell: request.cell,
      hydrate: false,
      synthesizeHover: false,
    });
    const observation = (await mounted.cleanup()).observation;
    assert.equal(harness.candidateRenderCount, 1);
    return observation;
  };
  const released = await execute({ leak: false });
  const leaked = await execute({ leak: true });
  assert.notDeepEqual(leaked.trace.at(-1), released.trace.at(-1));
  for (const fact of ['portal-released-once', 'listeners-released-once', 'timers-released-once']) {
    assert.equal(released.cleanup.includes(fact), true);
    assert.equal(leaked.cleanup.includes(fact), false);
  }
  assert.deepEqual(
    leaked.states
      .filter(({ target }) => ['modal-portals', 'modal-listeners', 'modal-timers'].includes(target))
      .map(({ target, value }) => [target, value]),
    [
      ['modal-listeners', 1],
      ['modal-timers', 1],
      ['modal-portals', 1],
    ],
  );
  assert.deepEqual(
    leaked.trace.at(-1).snapshot.resources.listenerEntries.map(({ owner, purpose, type }) => ({
      owner,
      purpose,
      type,
    })),
    [{ owner: 'modal-panel', purpose: 'other', type: 'keydown' }],
  );
});
