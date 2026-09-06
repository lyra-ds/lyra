import assert from 'node:assert/strict';
import { test } from 'node:test';
import { installResourceTracker } from './resource-tracker.mjs';
const markers = {
  fixtureRootMarker: 'data-overlay-fixture-root',
  layerBoundarySelector: '[data-overlay-panel]',
  targetNameAttributes: ['data-overlay-id'],
  connectedLayerSelector: '[data-overlay-panel]',
  globalTrackerKey: '__LYRA_OVERLAY_RESOURCE_TRACKER__',
};
test('shared tracker configures neutral ownership and retains real claim lifecycle evidence', () => {
  class Target {
    addEventListener() {}
    removeEventListener() {}
  }
  const scope = { EventTarget: Target };
  const tracker = installResourceTracker(scope, markers);
  const target = Object.assign(new Target(), {
    getAttribute: (name) => (name === 'data-overlay-id' ? 'popup' : null),
    closest: () => target,
  });
  target.addEventListener('keydown', () => {});
  assert.equal(tracker.snapshot().listenerEntries[0].owner, 'popup');
  assert.equal(Object.keys(scope).includes(markers.globalTrackerKey), false);
  const claims = tracker.runInPhase(
    { operation: 'open', phase: 'operation', owner: 'popup', purpose: 'other' },
    () =>
      ['observer', 'pointer', 'portal'].map((kind) =>
        tracker.acquireClaim({ kind, owner: 'popup' }),
      ),
  );
  assert.equal(tracker.snapshot().claims.length, 3);
  tracker.runInPhase(
    { operation: 'destroy', phase: 'cleanup', owner: 'popup', purpose: 'other' },
    () =>
      claims.forEach((claim) => {
        assert.equal(claim.release(), true);
        assert.equal(claim.release(), false);
      }),
  );
  assert.deepEqual(tracker.snapshot().claims, []);
  assert.equal(tracker.snapshot().claimLifecycles.length, 3);
  for (const entry of tracker.snapshot().claimLifecycles) {
    assert.equal(entry.acquiredOperation, 'open');
    assert.equal(entry.releasedOperation, 'destroy');
    assert.equal(entry.releaseCount, 1);
  }
  assert.equal(tracker.restore(), true);
  assert.equal(tracker.restore(), false);
});

function createTimerScope() {
  let nextHandle = 0;
  const pendingCallbacks = new Map();
  return {
    pendingCallbacks,
    scope: {
      setTimeout: (callback, delay, ...args) => {
        const handle = ++nextHandle;
        pendingCallbacks.set(handle, () => callback(...args));
        return handle;
      },
      clearTimeout: (handle) => {
        pendingCallbacks.delete(handle);
      },
    },
  };
}

test('tracker can be reinstalled after restore and accounts subsequent activity', () => {
  class Target {
    addEventListener() {}
    removeEventListener() {}
  }
  const { scope, pendingCallbacks } = createTimerScope();
  scope.EventTarget = Target;
  const originalAdd = Target.prototype.addEventListener;
  const originalRemove = Target.prototype.removeEventListener;
  const originalSetTimeout = scope.setTimeout;
  const originalClearTimeout = scope.clearTimeout;
  const firstTracker = installResourceTracker(scope, markers);
  const firstTarget = Object.assign(new Target(), {
    getAttribute: (name) => (name === 'data-overlay-id' ? 'popup' : null),
    closest: () => firstTarget,
  });
  firstTarget.addEventListener('keydown', () => {});
  scope.setTimeout(() => {}, 10);
  assert.equal(firstTracker.snapshot().listenerEntries.length, 1);
  assert.equal(firstTracker.snapshot().timers, 1);

  assert.equal(firstTracker.restore(), true);
  assert.equal(Target.prototype.addEventListener, originalAdd);
  assert.equal(Target.prototype.removeEventListener, originalRemove);
  assert.equal(scope.setTimeout, originalSetTimeout);
  assert.equal(scope.clearTimeout, originalClearTimeout);

  const secondTracker = installResourceTracker(scope, markers);
  assert.notEqual(secondTracker, firstTracker);
  const secondTarget = Object.assign(new Target(), {
    getAttribute: (name) => (name === 'data-overlay-id' ? 'dialog' : null),
    closest: () => secondTarget,
  });
  secondTarget.addEventListener('keydown', () => {});
  scope.setTimeout(() => {}, 20);
  const secondSnapshot = secondTracker.snapshot();
  assert.equal(secondSnapshot.listenerEntries.length, 1);
  assert.equal(secondSnapshot.listenerEntries[0].target, 'dialog');
  assert.equal(secondSnapshot.timers, 1);
  assert.equal(secondSnapshot.timerEntries[0].kind, 'timeout');
  assert.equal(firstTracker.snapshot().listenerEntries.length, 1);
  assert.equal(firstTracker.snapshot().timers, 1);

  pendingCallbacks.get(1)();
  assert.equal(firstTracker.snapshot().timers, 0);
  assert.equal(firstTracker.snapshot().timerLifecycles[0].releaseCount, 1);

  assert.equal(secondTracker.restore(), true);
  assert.equal(Target.prototype.addEventListener, originalAdd);
  assert.equal(scope.setTimeout, originalSetTimeout);
  assert.equal(secondTracker.restore(), false);
  assert.equal(firstTracker.restore(), false);
});

test('a stale restore after reinstall stays inert and leaves the newer tracker intact', () => {
  class Target {
    addEventListener() {}
    removeEventListener() {}
  }
  const { scope } = createTimerScope();
  scope.EventTarget = Target;
  const originalAdd = Target.prototype.addEventListener;
  const originalSetTimeout = scope.setTimeout;
  const firstTracker = installResourceTracker(scope, markers);
  assert.equal(firstTracker.restore(), true);
  const secondTracker = installResourceTracker(scope, markers);
  assert.notEqual(secondTracker, firstTracker);
  const target = Object.assign(new Target(), {
    getAttribute: (name) => (name === 'data-overlay-id' ? 'popup' : null),
    closest: () => target,
  });
  target.addEventListener('keydown', () => {});
  assert.equal(secondTracker.snapshot().listenerEntries.length, 1);

  assert.equal(firstTracker.restore(), false);
  assert.notEqual(Target.prototype.addEventListener, originalAdd);
  const handle = scope.setTimeout(() => {}, 5);
  assert.equal(secondTracker.snapshot().timers, 1);
  scope.clearTimeout(handle);
  assert.equal(secondTracker.snapshot().timers, 0);
  assert.equal(secondTracker.snapshot().timerLifecycles[0].releaseCount, 1);

  assert.equal(secondTracker.restore(), true);
  assert.equal(Target.prototype.addEventListener, originalAdd);
  assert.equal(scope.setTimeout, originalSetTimeout);
  assert.equal(secondTracker.restore(), false);
  assert.equal(firstTracker.restore(), false);
});
