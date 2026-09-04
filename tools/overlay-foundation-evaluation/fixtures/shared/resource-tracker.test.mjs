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
