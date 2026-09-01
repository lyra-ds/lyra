import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { MODAL_WAVE_CELLS } from '../contracts/modal.mjs';

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

if (Object.keys(MODAL_CELL_POLICIES).some((cell, index) => cell !== MODAL_WAVE_CELLS[index])) {
  throw new Error('modal cell policies must match the immutable modal wave order');
}

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

async function defaultStartServer({ fixture }) {
  const clientHtmlPath = resolve(fixture.clientHtmlPath);
  const root = await realpath(dirname(clientHtmlPath));
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', 'http://127.0.0.1');
      const requested = url.pathname === '/' ? clientHtmlPath : resolve(root, `.${url.pathname}`);
      const path = await realpath(requested);
      if (!inside(root, path)) throw new Error('requested fixture path escapes its build root');
      response.writeHead(200, { 'content-type': contentType(path), 'cache-control': 'no-store' });
      response.end(await readFile(path));
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

async function executeBrowserScenario({ scenario, cell }) {
  document.documentElement.dir = cell.direction;
  const bridge = globalThis.__LYRA_MODAL_FIXTURE__;
  if (bridge === undefined || bridge.ready === undefined) {
    throw new Error('modal fixture bridge is unavailable');
  }
  const fixture = await bridge.ready;
  for (const operation of scenario.operations) {
    const execute = fixture.operations?.[operation.operation];
    if (typeof execute !== 'function') throw new Error('modal fixture operation is unavailable');
    if (operation.operation === 'destroy') execute();
    else {
      execute({
        event: { target: operation.target, type: operation.operation },
        prevented: false,
      });
    }
  }
  return fixture.observe();
}

async function cleanupBrowserFixture() {
  const fixture = await globalThis.__LYRA_MODAL_FIXTURE__?.ready;
  return fixture?.destroy?.() ?? false;
}

function browserCell(policy, reactVersion, cellId) {
  return {
    id: cellId,
    reactVersion,
    direction: policy.dir ?? 'ltr',
    colorScheme: policy.context.colorScheme ?? 'light',
    forcedColors: policy.context.forcedColors === 'active',
    reducedMotion: policy.context.reducedMotion === 'reduce',
    coarsePointer: policy.context.hasTouch === true,
  };
}

function withBoundary(error, { classification, scope }) {
  if (error instanceof Error && Object.isExtensible(error)) {
    error.classification = classification;
    error.scope = scope;
    return error;
  }
  return Object.assign(new Error(String(error), { cause: error }), { classification, scope });
}

async function runBrowserVersion(
  { cellId, fixture, playwright, policy, reactVersion, scenario },
  startServer,
) {
  let server;
  let browser;
  let context;
  let page;
  let observation;
  let primaryError;
  const cleanupErrors = [];
  try {
    server = await startServer({ fixture });
    const engine = playwright?.[policy.engine];
    if (engine === undefined || typeof engine.launch !== 'function') {
      throw new Error(`Playwright ${policy.engine} engine is unavailable`);
    }
    browser = await engine.launch();
    context = await browser.newContext(policy.context);
    page = await context.newPage();
    await page.goto(server.url);
    observation = await page.evaluate(executeBrowserScenario, {
      scenario,
      cell: browserCell(policy, reactVersion, cellId),
      hydrate: policy.hydrate === true,
      axe: policy.axe === true,
      synthesizeHover: policy.synthesizeHover !== false,
    });
  } catch (error) {
    primaryError = withBoundary(error, { classification: 'infrastructure', scope: 'candidate' });
  } finally {
    for (const close of [
      () => page?.evaluate(cleanupBrowserFixture),
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
  return observation;
}

async function defaultExecuteSsr({ fixture }) {
  const moduleUrl = `${pathToFileURL(fixture.ssrPath).href}?modal=${Date.now()}-${Math.random()}`;
  const module = await import(moduleUrl);
  if (typeof module.renderModalFixture !== 'function') {
    throw new Error('modal SSR output must export renderModalFixture');
  }
  const html = await module.renderModalFixture();
  if (typeof html !== 'string') throw new Error('modal SSR output must render a string');
  return {
    roles: [],
    relationships: [],
    states: [],
    focus: { target: 'server-document-focus-unchanged' },
    events: [],
    announcements: [],
    cleanup: ['no-browser-resource-claims'],
    diagnostics: { htmlBytes: Buffer.byteLength(html) },
  };
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
    const observation =
      policy.mode === 'ssr'
        ? await executeSsr({ cellId, fixture, reactVersion, scenario })
        : await runBrowserVersion(
            { cellId, fixture, playwright, policy, reactVersion, scenario },
            startServer,
          );
    observations.push({ reactVersion, observation });
  }
  return observations;
}
