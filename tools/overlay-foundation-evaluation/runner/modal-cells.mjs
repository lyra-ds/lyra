import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { MODAL_WAVE_CELLS } from '../contracts/modal.mjs';
import { isPlainRecord } from '../contracts/protocol.mjs';
import {
  modalExecutionScenario,
  validateModalFixtureRequest,
  validateModalObservation,
} from '../fixtures/modal/protocol.mjs';
import { observeModalSsrMarkup } from '../fixtures/modal/runtime.mjs';

const REACT_18 = '18.3.1';
const REACT_19 = '19.2.8';

function policy(value) {
  const copy = structuredClone(value);
  Object.freeze(copy.reactVersions);
  if (copy.context !== undefined) Object.freeze(copy.context);
  return Object.freeze(copy);
}

export const MODAL_CELL_POLICIES = Object.freeze({
  chromium: policy({ mode: 'browser', engine: 'chromium', reactVersions: [REACT_19], context: {} }),
  firefox: policy({ mode: 'browser', engine: 'firefox', reactVersions: [REACT_19], context: {} }),
  webkit: policy({ mode: 'browser', engine: 'webkit', reactVersions: [REACT_19], context: {} }),
  'react-18': policy({
    mode: 'browser',
    engine: 'chromium',
    reactVersions: [REACT_18],
    context: {},
  }),
  'react-19': policy({
    mode: 'browser',
    engine: 'chromium',
    reactVersions: [REACT_19],
    context: {},
  }),
  ssr: policy({ mode: 'ssr', reactVersions: [REACT_19] }),
  hydration: policy({
    mode: 'browser',
    engine: 'chromium',
    reactVersions: [REACT_18, REACT_19],
    context: {},
    hydrate: true,
  }),
  'keyboard-focus': policy({
    mode: 'browser',
    engine: 'chromium',
    reactVersions: [REACT_19],
    context: {},
  }),
  'axe-light': policy({
    mode: 'browser',
    engine: 'chromium',
    reactVersions: [REACT_19],
    context: { colorScheme: 'light' },
    axe: true,
  }),
  'axe-dark': policy({
    mode: 'browser',
    engine: 'chromium',
    reactVersions: [REACT_19],
    context: { colorScheme: 'dark' },
    axe: true,
  }),
  'forced-colors': policy({
    mode: 'browser',
    engine: 'chromium',
    reactVersions: [REACT_19],
    context: { forcedColors: 'active' },
  }),
  'reduced-motion': policy({
    mode: 'browser',
    engine: 'chromium',
    reactVersions: [REACT_19],
    context: { reducedMotion: 'reduce' },
  }),
  ltr: policy({
    mode: 'browser',
    engine: 'chromium',
    reactVersions: [REACT_19],
    context: {},
    dir: 'ltr',
  }),
  rtl: policy({
    mode: 'browser',
    engine: 'chromium',
    reactVersions: [REACT_19],
    context: {},
    dir: 'rtl',
  }),
  'coarse-pointer': policy({
    mode: 'browser',
    engine: 'chromium',
    reactVersions: [REACT_19],
    context: { hasTouch: true },
    synthesizeHover: false,
  }),
});

export function assertModalCellPolicies(policyCells, waveCells) {
  if (
    policyCells.length !== waveCells.length ||
    policyCells.some((cell, index) => cell !== waveCells[index])
  ) {
    throw new Error('modal cell policies must match the immutable modal wave order');
  }
}

assertModalCellPolicies(Object.keys(MODAL_CELL_POLICIES), MODAL_WAVE_CELLS);

function contentType(path) {
  return (
    {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.mjs': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
    }[extname(path)] ?? 'application/octet-stream'
  );
}

function inside(parent, child) {
  const childRelative = relative(parent, child);
  return childRelative === '' || (!childRelative.startsWith('..') && !isAbsolute(childRelative));
}

function injectInitialMarkup(html, initialMarkup) {
  if (initialMarkup === undefined) return html;
  if (typeof initialMarkup !== 'string') throw new Error('hydration markup must be a string');
  const marker =
    /(<main\b[^>]*\bdata-modal-fixture-root(?:=(?:"[^"]*"|'[^']*'))?[^>]*>)([\s\S]*?)(<\/main>)/iu;
  const matches = [...html.matchAll(new RegExp(marker.source, `${marker.flags}g`))];
  if (matches.length !== 1) throw new Error('client HTML must contain one modal fixture root');
  return html.replace(marker, `$1${initialMarkup}$3`);
}

async function defaultStartServer({ fixture, initialMarkup }) {
  const clientHtmlPath = await realpath(resolve(fixture.clientHtmlPath));
  const root = dirname(clientHtmlPath);
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', 'http://127.0.0.1');
      const requested = url.pathname === '/' ? clientHtmlPath : resolve(root, `.${url.pathname}`);
      const path = await realpath(requested);
      if (!inside(root, path)) throw new Error('requested fixture path escapes its build root');
      response.writeHead(200, { 'content-type': contentType(path), 'cache-control': 'no-store' });
      const bytes = await readFile(path);
      response.end(
        path === clientHtmlPath
          ? injectInitialMarkup(bytes.toString('utf8'), initialMarkup)
          : bytes,
      );
    } catch {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('not found\n');
    }
  });
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  if (address === null || typeof address === 'string') {
    server.close();
    throw new Error('modal fixture server did not expose a TCP address');
  }
  return {
    url: `http://127.0.0.1:${address.port}/`,
    close: () =>
      new Promise((resolveClose, reject) => {
        server.close((error) => (error === undefined ? resolveClose() : reject(error)));
      }),
  };
}

async function installFixtureRequest(request) {
  Object.defineProperty(globalThis, '__LYRA_MODAL_FIXTURE_REQUEST__', {
    configurable: true,
    enumerable: false,
    value: request,
    writable: false,
  });
}

async function executeBrowserScenario({ scenario, cell, hydrate, axe, synthesizeHover }) {
  document.documentElement.dir = cell.direction;
  const bridge = globalThis.__LYRA_MODAL_FIXTURE__;
  if (bridge?.readyStatus === 'failed') {
    const details =
      typeof bridge.mountError === 'string' && bridge.mountError.length > 0
        ? `: ${bridge.mountError}`
        : '';
    throw new Error(`modal fixture mount failed${details}`);
  }
  if (bridge === undefined || typeof bridge.runScenario !== 'function') {
    throw new Error('modal fixture bridge is unavailable');
  }
  if (JSON.stringify(bridge.request) !== JSON.stringify({ schemaVersion: 1, scenario, cell })) {
    throw new Error('modal fixture bridge request does not match the scenario cell');
  }
  const expectedMode = hydrate ? 'hydrateRoot' : 'createRoot';
  if (bridge.renderMode !== expectedMode) {
    throw new Error(`modal fixture rendered with ${bridge.renderMode}; expected ${expectedMode}`);
  }
  const observation = await bridge.runScenario({ scenario, cell, hydrate, synthesizeHover });
  if (!axe) return observation;
  if (typeof bridge.runAxe !== 'function') throw new Error('modal axe bridge is unavailable');
  const audit = await bridge.runAxe();
  if (
    audit === null ||
    typeof audit !== 'object' ||
    Array.isArray(audit) ||
    !Array.isArray(audit.violations)
  ) {
    return { axeResultValid: false, observation };
  }
  return {
    axeResultValid: true,
    axeViolations: audit.violations.length,
    observation,
  };
}

async function cleanupBrowserFixture() {
  const plainRecord = (value) => {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  };
  const bridge = globalThis.__LYRA_MODAL_FIXTURE__;
  if (bridge === undefined || typeof bridge.cleanup !== 'function') {
    throw new Error('modal fixture cleanup bridge is unavailable');
  }
  const result = await bridge.cleanup();
  if (
    result === null ||
    typeof result !== 'object' ||
    Array.isArray(result) ||
    (result.status !== 'destroyed' && result.status !== 'already-destroyed')
  ) {
    throw new Error('modal fixture cleanup result is uncertain');
  }
  if (result.observation !== undefined && !plainRecord(result.observation)) {
    throw new Error('modal fixture cleanup observation is invalid');
  }
  return result;
}

function browserCell(policy, reactVersion, cellId) {
  const context = policy.context ?? {};
  return {
    id: cellId,
    reactVersion,
    direction: policy.dir ?? 'ltr',
    colorScheme: context.colorScheme ?? 'light',
    forcedColors: context.forcedColors === 'active',
    reducedMotion: context.reducedMotion === 'reduce',
    coarsePointer: context.hasTouch === true,
  };
}

function modalFixtureRequest(policy, reactVersion, cellId, scenario) {
  const request = {
    schemaVersion: 1,
    scenario: modalExecutionScenario(scenario),
    cell: browserCell(policy, reactVersion, cellId),
  };
  const errors = validateModalFixtureRequest(request);
  if (errors.length !== 0)
    throw new Error(`modal fixture request is invalid: ${errors.join('; ')}`);
  return request;
}

function withBoundary(error, { classification, scope }) {
  if (
    error !== null &&
    (typeof error === 'object' || typeof error === 'function') &&
    (Object.hasOwn(error, 'classification') || Object.hasOwn(error, 'scope'))
  ) {
    return error;
  }
  if (error instanceof Error && Object.isExtensible(error)) {
    error.classification = classification;
    error.scope = scope;
    return error;
  }
  return Object.assign(new Error(String(error), { cause: error }), { classification, scope });
}

async function runBrowserVersion(
  { cellId, fixture, playwright, policy, reactVersion, scenario },
  { executeSsr, startServer },
) {
  let server;
  let browser;
  let context;
  let page;
  let observation;
  let cleanupOutput;
  let axeViolations;
  let primaryError;
  const cleanupErrors = [];
  try {
    const request = modalFixtureRequest(policy, reactVersion, cellId, scenario);
    const ssr =
      policy.hydrate === true
        ? await executeSsr({
            cellId,
            fixture,
            reactVersion,
            request,
            scenario: request.scenario,
          })
        : undefined;
    if (
      ssr !== undefined &&
      (!isPlainRecord(ssr) || typeof ssr.html !== 'string' || !isPlainRecord(ssr.observation))
    ) {
      throw withBoundary(new Error('modal hydration SSR evidence is invalid'), {
        classification: 'policy',
        scope: 'run',
      });
    }
    if (ssr !== undefined) {
      const ssrObservationErrors = validateModalObservation(ssr.observation);
      if (ssrObservationErrors.length !== 0) {
        throw withBoundary(
          new Error(
            `modal hydration SSR observation is invalid: ${ssrObservationErrors.join('; ')}`,
          ),
          { classification: 'policy', scope: 'run' },
        );
      }
    }
    server = await startServer({ fixture, initialMarkup: ssr?.html, request });
    const engine = playwright?.[policy.engine];
    if (engine === undefined || typeof engine.launch !== 'function') {
      throw new Error(`Playwright ${policy.engine} engine is unavailable`);
    }
    browser = await engine.launch();
    context = await browser.newContext(policy.context);
    page = await context.newPage();
    if (typeof page.addInitScript !== 'function') {
      throw new Error('Playwright page cannot install a modal fixture request');
    }
    await page.addInitScript(installFixtureRequest, request);
    await page.goto(server.url);
    if (typeof page.waitForFunction !== 'function') {
      throw new Error('Playwright page cannot await modal fixture initialization');
    }
    await page.waitForFunction(() => {
      const bridge = globalThis.__LYRA_MODAL_FIXTURE__;
      return (
        bridge?.readyStatus === 'failed' ||
        (bridge?.readyStatus === 'ready' && typeof bridge.runScenario === 'function')
      );
    });
    const execution = await page.evaluate(executeBrowserScenario, {
      scenario: request.scenario,
      cell: request.cell,
      hydrate: policy.hydrate === true,
      axe: policy.axe === true,
      synthesizeHover: policy.synthesizeHover !== false,
    });
    if (policy.axe === true) {
      if (!isPlainRecord(execution) || execution.axeResultValid !== true) {
        throw withBoundary(new Error('modal axe result is invalid'), {
          classification: 'policy',
          scope: 'run',
        });
      }
      if (!Number.isSafeInteger(execution.axeViolations) || execution.axeViolations < 0) {
        throw withBoundary(new Error('modal axe violation count is invalid'), {
          classification: 'policy',
          scope: 'run',
        });
      }
      if (execution.axeViolations !== 0) {
        throw withBoundary(new Error(`modal axe found ${execution.axeViolations} violation(s)`), {
          classification: 'product',
          scope: 'candidate',
        });
      }
      axeViolations = execution.axeViolations;
    } else {
      const observationErrors = validateModalObservation(execution);
      if (observationErrors.length !== 0) {
        throw withBoundary(
          new Error(`modal browser observation is invalid: ${observationErrors.join('; ')}`),
          { classification: 'policy', scope: 'run' },
        );
      }
    }
  } catch (error) {
    primaryError = withBoundary(error, { classification: 'infrastructure', scope: 'candidate' });
  } finally {
    for (const close of [
      async () => {
        if (page !== undefined) cleanupOutput = await page.evaluate(cleanupBrowserFixture);
      },
      () => page?.close(),
      () => context?.close(),
      () => browser?.close(),
      () => server?.close(),
    ]) {
      try {
        await close();
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
  }
  if (cleanupErrors.length > 0) {
    const error = new AggregateError(
      primaryError === undefined ? cleanupErrors : [primaryError, ...cleanupErrors],
      'modal browser execution cleanup is uncertain',
    );
    throw withBoundary(error, { classification: 'policy', scope: 'run' });
  }
  if (primaryError !== undefined) throw primaryError;
  if (!isPlainRecord(cleanupOutput?.observation)) {
    throw withBoundary(new Error('modal cleanup did not return a post-cleanup observation'), {
      classification: 'policy',
      scope: 'run',
    });
  }
  observation = cleanupOutput.observation;
  if (axeViolations !== undefined) {
    observation = {
      ...observation,
      diagnostics: { ...observation.diagnostics, axeViolations },
    };
  }
  const observationErrors = validateModalObservation(observation);
  if (observationErrors.length !== 0) {
    throw withBoundary(
      new Error(`modal browser observation is invalid: ${observationErrors.join('; ')}`),
      { classification: 'policy', scope: 'run' },
    );
  }
  return observation;
}

async function defaultExecuteSsr({ fixture, request }) {
  const moduleUrl = `${pathToFileURL(fixture.ssrPath).href}?modal=${Date.now()}-${Math.random()}`;
  const module = await import(moduleUrl);
  if (typeof module.renderModalFixture !== 'function') {
    throw new Error('modal SSR output must export renderModalFixture');
  }
  const html = await module.renderModalFixture(request);
  if (typeof html !== 'string') throw new Error('modal SSR output must render a string');
  const observation = observeModalSsrMarkup({ request, html });
  return { html, observation };
}

export async function runModalCell(
  { cellId, fixtures, playwright, scenario },
  { executeSsr = defaultExecuteSsr, startServer = defaultStartServer } = {},
) {
  const policy = MODAL_CELL_POLICIES[cellId];
  if (policy === undefined) throw new Error(`unknown modal cell: ${cellId}`);
  if (!(fixtures instanceof Map)) throw new Error('fixtures must be a React-version map');
  const observations = [];
  for (const reactVersion of policy.reactVersions) {
    const fixture = fixtures.get(reactVersion);
    if (fixture === undefined) throw new Error(`fixture is missing for React ${reactVersion}`);
    const request = modalFixtureRequest(policy, reactVersion, cellId, scenario);
    let observation;
    if (policy.mode === 'ssr') {
      const result = await executeSsr({
        cellId,
        fixture,
        reactVersion,
        request,
        scenario: request.scenario,
      });
      if (
        !isPlainRecord(result) ||
        typeof result.html !== 'string' ||
        !isPlainRecord(result.observation)
      ) {
        throw withBoundary(
          new Error('modal SSR executor must return rendered HTML and an observation'),
          { classification: 'policy', scope: 'run' },
        );
      }
      observation = result.observation;
      const observationErrors = validateModalObservation(observation);
      if (observationErrors.length !== 0) {
        throw withBoundary(
          new Error(`modal SSR observation is invalid: ${observationErrors.join('; ')}`),
          { classification: 'policy', scope: 'run' },
        );
      }
    } else {
      observation = await runBrowserVersion(
        { cellId, fixture, playwright, policy, reactVersion, scenario },
        { executeSsr, startServer },
      );
    }
    observations.push({ reactVersion, observation });
  }
  return observations;
}
