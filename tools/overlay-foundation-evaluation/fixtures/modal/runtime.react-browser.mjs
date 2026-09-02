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
  return React.createElement('button', { type: 'button' }, 'Characterize listeners');
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
root.unmount();
await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

const snapshot = tracker.snapshot();
globalThis.__LYRA_REACT_TRACKER_RESULT__ = {
  listenerEntries: snapshot.listenerEntries,
  listeners: snapshot.listeners,
  persistentListeners: snapshot.persistentListeners ?? 0,
};
