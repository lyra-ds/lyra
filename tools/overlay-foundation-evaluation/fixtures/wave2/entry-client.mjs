import React from 'react';
import { flushSync } from 'react-dom';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { createWave2Runtime, installWave2ResourceTracker } from './runtime.mjs';
import { installMeasurementInstrumentation } from './measurements.mjs';

const factories = {
  'OF-ANCHORED': ['createAnchoredCandidate', 'AnchoredFixture'],
  'OF-MENU': ['createMenuCandidate', 'MenuFixture'],
  'OF-TOOLTIP': ['createTooltipCandidate', 'TooltipFixture'],
};
const factTypes = {
  'browser-globals:accessed': 'boolean',
  'server-render:deterministic': 'boolean',
  'first-tree:identical': 'boolean',
  'hydration-warnings:count': 'number',
  'trigger:closed-aria-expanded': 'boolean',
  'trigger:open-aria-expanded': 'boolean',
};
const driverKeys = {
  activate: ['target'],
  close: ['target', 'trigger'],
  press: ['key'],
  hover: ['target'],
  point: ['target', 'phase', 'pointerType', 'button', 'drag'],
  viewport: ['width', 'height'],
  visualViewport: ['offsetLeft'],
  motion: ['reducedMotion'],
  lifecycle: ['target'],
};

export async function mountWave2FixtureClient({
  request,
  contractId,
  scope = globalThis,
  React,
  ReactDOM,
  createRoot,
  hydrateRoot,
  axe,
  loadAdapter,
  installTracker = installWave2ResourceTracker,
  installInstrumentation = installMeasurementInstrumentation,
  createRuntime = createWave2Runtime,
}) {
  const runtime = createRuntime(request);
  if (!factories[contractId]) throw new Error('invalid Wave2 client contract');
  const tracker = installTracker(scope);
  let instrumentation, root, handle;
  const facts = {};
  const retainFacts = (incoming) => {
    if (incoming === undefined) return;
    for (const [key, type] of Object.entries(factTypes))
      if (Object.hasOwn(incoming, key)) {
        const value = incoming[key];
        if (
          typeof value !== type ||
          (type === 'number' && (!Number.isSafeInteger(value) || value < 0))
        )
          throw new Error('invalid measured SSR/hydration fact: ' + key);
        facts[key] = value;
      }
  };
  try {
    instrumentation = installInstrumentation(scope, tracker);
    const driver = { facts: () => structuredClone(facts) };
    for (const [method, keys] of Object.entries(driverKeys))
      driver[method] = async (args) => {
        if (
          !args ||
          Object.keys(args).some((key) => !keys.includes(key)) ||
          Object.values(args).some(
            (value) => !['string', 'number', 'boolean', 'undefined'].includes(typeof value),
          )
        )
          throw new Error('invalid native input arguments: ' + method);
        if (typeof scope.__LYRA_WAVE2_NATIVE_INPUT__ !== 'function')
          throw new Error('Wave2 native input binding is unavailable');
        const result = await scope.__LYRA_WAVE2_NATIVE_INPUT__(
          method,
          JSON.parse(JSON.stringify(args)),
        );
        if (method === 'lifecycle') retainFacts(result?.facts);
        return result;
      };
    const measureAccessibility = (element) => {
      try {
        axe.setup(scope.document);
        return {
          role: axe.commons.aria.getRole(element) ?? '',
          name: axe.commons.text.accessibleText(element) ?? '',
        };
      } finally {
        axe.teardown();
      }
    };
    const container = scope.document.querySelector('[data-overlay-fixture-root]');
    if (!container) throw new Error('Wave2 root is missing');
    const server = scope.__LYRA_WAVE2_SSR__;
    if (
      !server &&
      request.scenario.operations.some(
        (op) => op.operation === 'updateContent' && op.target === 'hydrate-first-tree',
      )
    )
      throw new Error('SSR bootstrap is required for declared hydration');
    if (
      server &&
      (!request.scenario.operations.some(
        (op) => op.operation === 'updateContent' && op.target === 'hydrate-first-tree',
      ) ||
        server.renderTarget !== request.scenario.operations[0]?.target)
    )
      throw new Error('SSR bootstrap must match declared hydration controls');
    if (
      server &&
      (server.requestJSON !== JSON.stringify(request) || server.contractId !== contractId)
    )
      throw new Error('SSR bootstrap does not match compiled request and contract');
    retainFacts(server?.facts);
    if (server) {
      const template = scope.document.createElement('template');
      template.innerHTML = server.html;
      if (typeof server.html !== 'string' || template.innerHTML !== container.innerHTML)
        throw new Error('hydration server tree does not match actual root');
    }
    const mount = async (hydrate) => {
      const [factoryName, fixtureName] = factories[contractId];
      const adapter = await loadAdapter();
      const { [fixtureName]: Fixture } = await adapter[factoryName]({
        React,
        ReactDOM,
        environment: scope,
        driver,
        measureAccessibility,
        instrumentation,
      });
      const beforeTree = container.innerHTML;
      let warnings = 0;
      let resolveReady;
      const ready = new Promise((resolve) => {
        resolveReady = resolve;
      });
      const element = React.createElement(Fixture, {
        request,
        renderTarget: server?.renderTarget,
        onReady(value) {
          handle = value;
          resolveReady();
        },
      });
      const originalError = scope.console?.error;
      if (hydrate && originalError)
        scope.console.error = (...args) => {
          if (/hydration|hydrat|server.rendered/i.test(args.map(String).join(' '))) warnings++;
          originalError.apply(scope.console, args);
        };
      try {
        if (hydrate)
          root = hydrateRoot(container, element, {
            onRecoverableError() {
              warnings++;
            },
          });
        else {
          root = createRoot(container);
          ReactDOM.flushSync(() => root.render(element));
        }
        await ready;
        if (hydrate) {
          facts['first-tree:identical'] = beforeTree === container.innerHTML;
          facts['hydration-warnings:count'] = warnings;
        }
      } finally {
        if (hydrate && originalError) scope.console.error = originalError;
      }
    };
    if (!server) await mount(false);
    const find = (target) =>
      [...scope.document.querySelectorAll('[data-overlay-id]')].filter(
        (element) =>
          element.getAttribute('data-overlay-id') === target && element.isConnected !== false,
      );
    const preHydrationOperation = async (operation) => {
      if (operation.operation === 'updateContent' && operation.target === server?.renderTarget)
        return true;
      if (operation.operation === 'focus') {
        const targets = find(operation.target);
        if (targets.length !== 1) return false;
        targets[0].focus();
        return true;
      }
      if (operation.operation === 'updateContent' && operation.target === 'hydrate-first-tree') {
        await mount(true);
        return true;
      }
      throw new Error('operation unavailable before declared hydration');
    };
    const fixture = {
      operations: Object.fromEntries(
        [...new Set(request.scenario.operations.map((op) => op.operation))].map((method) => [
          method,
          (...args) =>
            handle ? handle.operations[method](...args) : preHydrationOperation(...args),
        ]),
      ),
      observe() {
        return handle
          ? handle.observe()
          : {
              direction:
                scope.getComputedStyle?.(container)?.direction ??
                scope.document.documentElement?.dir ??
                'ltr',
              roles: [],
              relationships: [],
              states: [],
              focus: {
                target:
                  scope.document.activeElement?.getAttribute?.('data-overlay-id') ??
                  'outside-fixture',
              },
              events: [],
              announcements: [],
              cleanup: [],
            };
      },
      measureRole: (target) => handle?.measureRole?.(target),
      async destroy() {
        try {
          return handle ? await handle.destroy() : { status: 'destroyed' };
        } finally {
          if (root) ReactDOM.flushSync(() => root.unmount());
          else container.replaceChildren();
        }
      },
    };
    runtime.beginScenario({ fixture, tracker, document: scope.document });
    let cleaned = false;
    const cleanup = async () => {
      if (cleaned) return { status: 'already-destroyed' };
      const errors = [];
      let result;
      try {
        result = await runtime.destroy();
        cleaned = true;
      } catch (error) {
        errors.push(error);
      }
      try {
        instrumentation.restore();
      } catch (error) {
        errors.push(error);
      }
      if (errors.length > 1)
        throw new AggregateError(errors, 'Wave2 runtime and instrumentation cleanup failed');
      if (errors.length === 1) throw errors[0];
      return result;
    };
    return Object.freeze({
      readyStatus: 'ready',
      runOperation: (...args) => runtime.runOperation(...args),
      observe: () => runtime.observe(),
      destroy: cleanup,
      cleanup,
    });
  } catch (primary) {
    const errors = [primary];
    try {
      if (root) ReactDOM.flushSync(() => root.unmount());
    } catch (error) {
      errors.push(error);
    }
    try {
      instrumentation?.restore();
    } catch (error) {
      errors.push(error);
    }
    try {
      tracker.restore();
    } catch (error) {
      errors.push(error);
    }
    throw errors.length > 1
      ? new AggregateError(errors, 'Wave2 mount and cleanup failed')
      : primary;
  }
}

if (typeof __LYRA_WAVE2_REQUEST__ !== 'undefined') {
  // The tracker is installed by mount before importing any candidate module.
  await import('../../tools/axe.js');
  if (globalThis.axe?.version !== '4.13.0') throw new Error('Wave2 axe version must equal 4.13.0');
  try {
    globalThis.__LYRA_WAVE2_FIXTURE__ = await mountWave2FixtureClient({
      request: __LYRA_WAVE2_REQUEST__,
      contractId: __LYRA_WAVE2_CONTRACT__,
      React,
      ReactDOM: { flushSync },
      createRoot,
      hydrateRoot,
      axe: globalThis.axe,
      loadAdapter: () => import('../../candidates/wave2/adapter.mjs'),
    });
  } catch (error) {
    globalThis.__LYRA_WAVE2_FIXTURE__ = { readyStatus: 'failed', mountError: error.message };
    throw error;
  }
}
