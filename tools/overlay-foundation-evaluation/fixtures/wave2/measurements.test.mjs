import assert from 'node:assert/strict';
import { test } from 'node:test';
import { installMeasurementInstrumentation, placementFacts } from './measurements.mjs';
import { installWave2ResourceTracker } from './runtime.mjs';

test('measurement instrumentation records actual observer ownership, idempotent release and leaks', () => {
  class Observer {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  const scope = { ResizeObserver: Observer };
  const tracker = installWave2ResourceTracker(scope);
  const instrumentation = installMeasurementInstrumentation(scope, tracker);
  const observer = new scope.ResizeObserver(() => {});
  const node = { getAttribute: () => 'popup' };
  observer.observe(node);
  observer.observe(node);
  assert.equal(instrumentation.snapshot().observerCount, 1);
  assert.equal(tracker.snapshot().claims.length, 1);
  observer.unobserve(node);
  observer.disconnect();
  observer.disconnect();
  assert.equal(instrumentation.snapshot().observerCount, 0);
  assert.equal(tracker.snapshot().claimLifecycles[0].releaseCount, 1);
  observer.observe(node);
  instrumentation.restore();
  assert.equal(
    instrumentation.snapshot().observerCount,
    1,
    'restoring instrumentation cannot release a leak',
  );
  assert.equal(tracker.snapshot().claims.length, 1);
  observer.disconnect();
  tracker.restore();
});

test('geometry reads cannot manufacture public placement and measurement probes do not count themselves', () => {
  class Element {
    getBoundingClientRect() {
      return this.box;
    }
    getAttribute() {
      return null;
    }
  }
  const scope = { Element, innerWidth: 800, innerHeight: 600 };
  const instrumentation = installMeasurementInstrumentation(scope);
  const trigger = new Element();
  trigger.box = {
    x: 300,
    y: 200,
    left: 300,
    right: 380,
    top: 200,
    bottom: 240,
    width: 80,
    height: 40,
  };
  const popup = new Element();
  popup.box = {
    x: 300,
    y: 248,
    left: 300,
    right: 500,
    top: 248,
    bottom: 368,
    width: 200,
    height: 120,
  };
  trigger.getBoundingClientRect();
  const facts = instrumentation.read(() => placementFacts(popup, trigger, scope, 'ltr'));
  assert.equal(facts.side, 'bottom');
  assert.equal(facts['public-placement'], null);
  assert.equal(instrumentation.snapshot().measurementCount, 1);
  instrumentation.restore();
});

test('focus instrumentation distinguishes actual JavaScript focus calls from native focus changes', () => {
  class Element {
    focus() {
      this.focused = true;
    }
    getAttribute() {
      return 'trigger';
    }
  }
  const scope = { HTMLElement: Element };
  const instrumentation = installMeasurementInstrumentation(scope);
  const node = new Element();
  node.focus();
  assert.deepEqual(instrumentation.snapshot().focusCalls, ['trigger']);
  instrumentation.restore();
  node.focus();
  assert.deepEqual(instrumentation.snapshot().focusCalls, ['trigger']);
});

test('observer measurement preserves native callback receivers and available methods', () => {
  class Observer {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {}
    disconnect() {}
    emit() {
      this.callback.call(this, [], this);
    }
  }
  const scope = { MutationObserver: Observer };
  const instrumentation = installMeasurementInstrumentation(scope);
  let receiver;
  const observer = new scope.MutationObserver(function () {
    receiver = this;
  });
  observer.emit();
  assert.equal(receiver, observer);
  assert.equal('unobserve' in observer, false);
  instrumentation.restore();
});
