import React from 'react';
import { createRoot } from 'react-dom/client';

import { installModalResourceTracker } from './runtime.mjs';

const fixtureRoot = document.querySelector('[data-modal-fixture-root]');
const tracker = installModalResourceTracker(globalThis);
const leakCandidateListener = new URL(location.href).searchParams.get('leak') === 'true';
const root =
  typeof tracker.capturePersistentListeners === 'function'
    ? tracker.capturePersistentListeners(
        { owner: 'react-delegated-root', target: fixtureRoot },
        () => createRoot(fixtureRoot),
      )
    : createRoot(fixtureRoot);
const effectReady = Promise.withResolvers();

function CharacterizationFixture() {
  React.useLayoutEffect(() => {
    if (leakCandidateListener) fixtureRoot.addEventListener('keydown', () => {});
    effectReady.resolve();
  }, []);
  return React.createElement(
    'section',
    null,
    React.createElement('button', { 'data-modal-id': 'modal-opener', type: 'button' }, 'Open'),
    React.createElement('div', { 'data-modal-id': 'modal-backdrop' }),
    React.createElement(
      'div',
      { 'data-modal-id': 'modal-panel', 'data-modal-panel': '' },
      React.createElement('button', { 'data-modal-id': 'modal-action', type: 'button' }, 'Action'),
    ),
  );
}

const render = () => root.render(React.createElement(CharacterizationFixture));
if (typeof tracker.capturePersistentListeners === 'function') {
  tracker.capturePersistentListeners(
    { owner: 'react-delegated-root', target: fixtureRoot },
    render,
  );
} else {
  render();
}
await effectReady.promise;
const panel = document.querySelector('[data-modal-panel]');
const opener = document.querySelector('[data-modal-id="modal-opener"]');
const backdrop = document.querySelector('[data-modal-id="modal-backdrop"]');
const focusLoop = (event) => {
  if (event.key === 'Tab') event.preventDefault();
};
const dismiss = (event) => {
  if (event.key === 'Escape') event.preventDefault();
};
const outsideListeners = [opener, backdrop, document, globalThis].map((target) => ({
  listener: focusLoop,
  target,
}));
tracker.runInPhase(
  { operation: 'open', owner: 'modal-opener', phase: 'operation', purpose: 'other' },
  () => {
    panel.addEventListener('keydown', focusLoop);
    panel.addEventListener('keydown', dismiss);
    for (const { listener, target } of outsideListeners) {
      target.addEventListener('keydown', listener);
    }
  },
);
const dispatchKey = (target, key) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { cancelable: true, key }));
tracker.runInPhase(
  { operation: 'press', owner: 'keyboard-tab', phase: 'operation', purpose: 'other' },
  () => {
    dispatchKey(panel, 'Tab');
    for (const { target } of outsideListeners) dispatchKey(target, 'Tab');
  },
);
tracker.runInPhase(
  { operation: 'press', owner: 'keyboard-escape', phase: 'operation', purpose: 'other' },
  () => dispatchKey(panel, 'Escape'),
);
tracker.runInPhase(
  { operation: 'close', owner: 'modal-panel', phase: 'operation', purpose: 'other' },
  () => {
    panel.removeEventListener('keydown', focusLoop);
    panel.removeEventListener('keydown', dismiss);
    for (const { listener, target } of outsideListeners) {
      target.removeEventListener('keydown', listener);
    }
  },
);
root.unmount();
await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

const snapshot = tracker.snapshot();
globalThis.__LYRA_REACT_TRACKER_RESULT__ = {
  listenerEntries: snapshot.listenerEntries,
  listenerLifecycles: snapshot.listenerLifecycles,
  listeners: snapshot.listeners,
  persistentListeners: snapshot.persistentListeners ?? 0,
};
