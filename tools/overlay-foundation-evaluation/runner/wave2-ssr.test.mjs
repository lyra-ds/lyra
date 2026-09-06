import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { EventEmitter } from 'node:events';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { WAVE_2_SCENARIOS } from '../contracts/wave2.mjs';
import { canonicalJson } from '../evidence/results.mjs';
import { wave2FixtureRequest } from './wave2-cells.mjs';
import { installWave2ResourceTracker } from '../fixtures/wave2/runtime.mjs';
import { validateWave2Observation } from '../fixtures/wave2/protocol.mjs';
const moduleURL = new URL('./wave2-ssr.mjs', import.meta.url);
function setup(contractId) {
  const scenario = WAVE_2_SCENARIOS.find(
    (s) => s.contractId === contractId && s.requiredCells.includes('ssr'),
  );
  return { scenario, request: wave2FixtureRequest('ssr', '19.2.8', scenario) };
}
function rendered(request, contractId, html, renderTarget) {
  return {
    html,
    repeatHtml: html,
    requestJSON: JSON.stringify(request),
    contractId,
    renderTarget,
    facts: { 'browser-globals:accessed': false, 'server-render:deterministic': true },
  };
}
const resources = () => {
  const { persistentListeners, ...r } = installWave2ResourceTracker({}).snapshot();
  return r;
};
test('SSR parser uses exact pinned Node-only chain and decodes actual accessible text and relationships', async () => {
  const { observeWave2SsrMarkup, loadWave2HtmlParser } = await import(moduleURL);
  const { parse, provenance } = await loadWave2HtmlParser();
  assert.deepEqual(
    provenance.map((p) => [p.name, p.version]),
    [
      ['@arethetypeswrong/cli', '0.18.5'],
      ['marked-terminal', '7.3.0'],
      ['cli-highlight', '2.1.11'],
      ['parse5', '5.1.1'],
    ],
  );
  const { request } = setup('OF-MENU');
  const html =
    '<button data-overlay-id="trigger" aria-controls="generated" aria-expanded="true">A &amp; B</button><div data-overlay-id="menu" id="generated" role="menu" aria-label="A &amp; B"><button data-overlay-id="alpha" role="menuitem">Álpha</button></div>';
  const renders = request.scenario.operations.map((op) =>
    rendered(request, 'OF-MENU', html, op.target),
  );
  const observation = observeWave2SsrMarkup({ request, renders, parse, resources: resources() });
  assert.deepEqual(validateWave2Observation(observation), []);
  assert.deepEqual(observation.roles, [
    { role: 'button', name: 'A & B' },
    { role: 'menu', name: 'A & B' },
  ]);
  assert.deepEqual(observation.relationships, [
    { source: 'trigger', name: 'aria-controls', target: 'menu-id' },
  ]);
  assert.deepEqual(observation.states.find((s) => s.name === 'item-roles').value, ['menuitem']);
  assert.equal(observation.focus.target, 'server-focus-unchanged');
});
test('SSR missing content and changed generated identity remain missing evidence, never inferred from probes', async () => {
  const { observeWave2SsrMarkup, loadWave2HtmlParser } = await import(moduleURL);
  const { parse } = await loadWave2HtmlParser();
  const { request } = setup('OF-ANCHORED');
  const renders = request.scenario.operations.map((op, i) =>
    rendered(
      request,
      'OF-ANCHORED',
      i
        ? '<button data-overlay-id="trigger" aria-controls="new"></button><div data-overlay-id="popup" id="new" role="dialog"></div>'
        : '<button data-overlay-id="trigger" aria-controls="first"></button>',
      op.target,
    ),
  );
  const observation = observeWave2SsrMarkup({ request, renders, parse, resources: resources() });
  assert.notEqual(observation.states.find((s) => s.name === 'stable-id').value, 'popup-id');
  assert.equal(observation.states.find((s) => s.name === 'named').value, false);
  const empty = renders.map((r) => ({ ...r, html: '', repeatHtml: '' }));
  const absent = observeWave2SsrMarkup({ request, renders: empty, parse, resources: resources() });
  assert.equal(absent.states.find((s) => s.name === 'stable-id').value, null);
  assert.equal(absent.relationships[0].target, 'unobserved');
});
test('SSR render binding and deterministic claims are derived from actual bytes', async () => {
  const { observeWave2SsrMarkup, loadWave2HtmlParser } = await import(moduleURL);
  const { parse } = await loadWave2HtmlParser();
  const { request } = setup('OF-TOOLTIP');
  const renders = request.scenario.operations.map((op) =>
    rendered(
      request,
      'OF-TOOLTIP',
      '<button data-overlay-id="trigger" aria-describedby="t">Help</button><span data-overlay-id="tooltip" role="tooltip" id="t" hidden>Actual description</span>',
      op.target,
    ),
  );
  renders[1].repeatHtml = 'changed';
  const observation = observeWave2SsrMarkup({ request, renders, parse, resources: resources() });
  assert.equal(observation.states.find((s) => s.name === 'deterministic').value, false);
  assert.equal(
    observation.states.find((s) => s.name === 'described-text').value,
    'Actual description',
  );
  assert.equal(observation.states.find((s) => s.name === 'open').value, false);
  renders[0].requestJSON = '{}';
  assert.throws(
    () => observeWave2SsrMarkup({ request, renders, parse, resources: resources() }),
    /binding/,
  );
});

test('default SSR executor renders actual React HTML in Node without ever launching a browser', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'wave2-ssr-node-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const ssrPath = join(root, 'server.mjs');
  const { request, scenario } = setup('OF-MENU');
  const require = createRequire(import.meta.url);
  const source = `import React from ${JSON.stringify(pathToFileURL(require.resolve('react')).href)};
 import {renderToString} from ${JSON.stringify(pathToFileURL(require.resolve('react-dom/server')).href)};
 const request=${JSON.stringify(request)};
 export function renderWave2Fixture({renderTarget}){
 if(typeof document!=='undefined'||typeof window!=='undefined')throw new Error('browser globals present');
 const open=renderTarget.includes('open');const element=React.createElement(React.Fragment,null,
 React.createElement('button',{'data-overlay-id':'trigger','aria-controls':'real-menu','aria-expanded':open},'Actual workspace'),
 open?React.createElement('div',{'data-overlay-id':'menu',id:'real-menu',role:'menu','aria-label':'Actual workspace'},React.createElement('button',{'data-overlay-id':'alpha',role:'menuitem'},'Alpha')):null);
 return {html:renderToString(element),repeatHtml:renderToString(element),requestJSON:JSON.stringify(request),contractId:'OF-MENU',renderTarget,facts:{'browser-globals:accessed':false}};
 }`;
  await writeFile(ssrPath, source);
  const { runWave2Cell } = await import('./wave2-cells.mjs');
  const observations = await runWave2Cell({
    cellId: 'ssr',
    fixtures: new Map([['19.2.8', { ssrPath }]]),
    playwright: new Proxy(
      {},
      {
        get() {
          throw new Error('SSR tried browser');
        },
      },
    ),
    scenario,
  });
  assert.deepEqual(observations[0].observation.roles, [
    { role: 'button', name: 'Actual workspace' },
    { role: 'menu', name: 'Actual workspace' },
  ]);
  assert.equal(observations[0].observation.diagnostics.rawRenders.length, 2);
  assert.equal(observations[0].observation.trace[0].phase, 'server-render');
  assert.equal(observations[0].observation.diagnostics.cleanupObserved, false);
});

test('actual Node browser-global dereference remains a candidate render failure without success facts', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'wave2-ssr-failure-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const ssrPath = join(root, 'server.mjs');
  await writeFile(
    ssrPath,
    'export function renderWave2Fixture(){return document.createElement("div");}',
  );
  const { executeWave2Ssr } = await import(moduleURL);
  const { request } = setup('OF-MENU');
  await assert.rejects(
    executeWave2Ssr({ fixture: { ssrPath }, request }),
    (error) =>
      error instanceof ReferenceError &&
      error.scope === 'candidate' &&
      error.classification === 'product',
  );
});

test('SSR executions use fresh instrumentation and dispose pending timers before returning', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'wave2-ssr-isolation-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const ssrPath = join(root, 'server.mjs'),
    timerPath = join(root, 'timer-fired');
  const { request } = setup('OF-MENU');
  await writeFile(
    ssrPath,
    `import {writeFileSync} from 'node:fs';
const request=${JSON.stringify(request)};
globalThis.__SSR_CALLS__=(globalThis.__SSR_CALLS__??0)+1;
export function renderWave2Fixture({renderTarget}) {
  setTimeout(()=>writeFileSync(${JSON.stringify(timerPath)},'fired'),500);
  const html='<button data-overlay-id="trigger">'+process.pid+':'+globalThis.__SSR_CALLS__+'</button>';
  return {html,repeatHtml:html,requestJSON:JSON.stringify(request),contractId:'OF-MENU',renderTarget,facts:{'browser-globals:accessed':false}};
}`,
  );
  const { executeWave2Ssr } = await import(moduleURL);
  const originalTimeout = globalThis.setTimeout,
    originalTracker = globalThis.__LYRA_OVERLAY_RESOURCE_TRACKER__;
  const first = await executeWave2Ssr({ fixture: { ssrPath }, request });
  const second = await executeWave2Ssr({ fixture: { ssrPath }, request });
  for (const result of [first, second]) {
    assert.equal(result.observation.trace[0].snapshot.resources.timers, 2);
    assert.match(result.observation.diagnostics.rawRenders[0].html, /:1<\/button>/);
    assert.equal(result.observation.diagnostics.ssrProcess.disposed, true);
  }
  assert.notEqual(
    first.observation.diagnostics.ssrProcess.pid,
    second.observation.diagnostics.ssrProcess.pid,
  );
  assert.equal(globalThis.setTimeout, originalTimeout);
  assert.equal(globalThis.__LYRA_OVERLAY_RESOURCE_TRACKER__, originalTracker);
  assert.equal(globalThis.__SSR_CALLS__, undefined);
  await delay(600);
  await assert.rejects(readFile(timerPath), { code: 'ENOENT' });
});

test('SSR worker protocol and disposal failures stay run-fatal and preserve primary errors', async () => {
  const { executeWave2Ssr, observeWave2SsrMarkup, loadWave2HtmlParser } = await import(moduleURL),
    { request } = setup('OF-MENU');
  const { parse } = await loadWave2HtmlParser();
  const validObservation = observeWave2SsrMarkup({
    request,
    parse,
    resources: resources(),
    renders: request.scenario.operations.map((op) =>
      rendered(request, 'OF-MENU', '<button data-overlay-id="trigger">Neutral</button>', op.target),
    ),
  });
  for (const mode of [
    'invalid',
    'duplicate-after-error',
    'disconnect',
    'timeout',
    'large',
    'invalid-result',
    'invalid-request',
    'invalid-error',
    'output',
    'output-then-error',
    'kill-error',
    'no-close',
    'send-error',
  ]) {
    const child = new EventEmitter();
    child.pid = 98765;
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    const kills = [];
    child.kill = (signal) => {
      kills.push(signal);
      if (mode === 'kill-error' && signal === 'SIGTERM') throw new Error('cleanup kill failed');
      if (mode !== 'no-close') queueMicrotask(() => child.emit('close', null, signal));
      return true;
    };
    child.send = (input, callback) =>
      queueMicrotask(() => {
        assert.equal(input.type, 'execute');
        if (mode === 'send-error') return callback(new Error('send failed'));
        callback();
        const error = {
          schemaVersion: 1,
          type: 'error',
          pid: child.pid,
          error: {
            name: 'ReferenceError',
            message: 'candidate render failed',
            scope: 'candidate',
            classification: 'product',
            ssrDiagnostics: { resources: resources() },
          },
        };
        if (mode === 'timeout') return;
        if (mode === 'disconnect') return child.emit('disconnect');
        if (mode === 'output') return child.stderr.emit('data', Buffer.alloc(65537));
        if (mode === 'output-then-error') child.stderr.emit('data', Buffer.alloc(65537));
        if (mode === 'invalid') return child.emit('message', { unknown: true });
        if (mode === 'large')
          return child.emit('message', { ...error, extra: 'a'.repeat(16 * 1024 * 1024) });
        if (mode === 'invalid-request')
          return child.emit('message', {
            schemaVersion: 1,
            type: 'result',
            pid: child.pid,
            result: {
              observation: validObservation,
              bootstrap: { requestJSON: JSON.stringify({ ...request, expected: {} }) },
            },
          });
        if (mode === 'invalid-result')
          return child.emit('message', {
            schemaVersion: 1,
            type: 'result',
            pid: child.pid,
            result: {},
          });
        if (mode === 'invalid-error')
          return child.emit('message', { ...error, error: { message: 'missing scope' } });
        child.emit('message', error);
        if (mode === 'duplicate-after-error') child.emit('message', error);
      });
    await assert.rejects(
      executeWave2Ssr(
        { fixture: { ssrPath: '/absolute/server.mjs' }, request },
        {
          forkWorker: (url, args, options) => {
            assert.equal(options.execPath, process.execPath);
            assert.deepEqual(options.execArgv, []);
            assert.match(url.pathname, /wave2-ssr-worker.mjs$/);
            return child;
          },
          timeoutMs: 5,
          terminationMs: 5,
        },
      ),
      (error) => {
        assert.equal(error.scope, 'run', mode);
        if (['kill-error', 'no-close'].includes(mode)) {
          assert.equal(error.errors[0] instanceof ReferenceError, true);
          assert.equal(error.errors[0].ssrDiagnostics.resources.timers, 0);
        }
        return true;
      },
    );
    assert.equal(
      kills.at(-1),
      ['kill-error', 'no-close'].includes(mode) ? 'SIGKILL' : 'SIGTERM',
      mode,
    );
  }
});

test('SSR render failure retains live timer evidence while owned child disposal prevents later callbacks', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'wave2-ssr-error-timer-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const ssrPath = join(root, 'server.mjs'),
    timerPath = join(root, 'timer-fired');
  await writeFile(
    ssrPath,
    `import {writeFileSync} from 'node:fs';setTimeout(()=>writeFileSync(${JSON.stringify(timerPath)},'fired'),500);throw new ReferenceError('actual import failure');`,
  );
  const { executeWave2Ssr } = await import(moduleURL),
    { request } = setup('OF-MENU');
  await assert.rejects(executeWave2Ssr({ fixture: { ssrPath }, request }), (error) => {
    assert.equal(error.scope, 'candidate');
    assert.equal(error instanceof ReferenceError, true);
    assert.equal(error.ssrDiagnostics.resources.timers, 1);
    return true;
  });
  await delay(600);
  await assert.rejects(readFile(timerPath), { code: 'ENOENT' });
});

test('real Vite React hook chunks share SSR and hydration bootstrap identity in fresh workers', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'wave2-ssr-bundled-hooks-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const require = createRequire(import.meta.url);
  const react = require.resolve('react');
  const server = require.resolve('react-dom/server');
  const { request } = setup('OF-ANCHORED');
  const entry = join(root, 'entry.mjs');
  await writeFile(join(root, 'package.json'), '{"type":"module"}');
  await writeFile(
    join(root, 'adapter.mjs'),
    `import ImportedReact from ${JSON.stringify(react)};
export function createFixture(React) {
 return function Fixture() {
   const injectedId=React.useId(), importedId=ImportedReact.useId();
   return React.createElement('button', {'data-overlay-id':'trigger','data-same-react':String(React===ImportedReact),'data-injected-id':injectedId,'data-imported-id':importedId},'Hooks');
 };
}`,
  );
  await writeFile(
    entry,
    `import React from ${JSON.stringify(react)};
import {renderToString} from ${JSON.stringify(server)};
const request=${canonicalJson(request)};
export async function renderWave2Fixture({renderTarget}) {
 const {createFixture}=await import('./adapter.mjs');
 const Fixture=createFixture(React);
 const html=renderToString(React.createElement(Fixture));
 return {html,repeatHtml:renderToString(React.createElement(Fixture)),requestJSON:JSON.stringify(request),contractId:'OF-ANCHORED',renderTarget,facts:{'browser-globals:accessed':false}};
}`,
  );
  const { build } = await import('vite');
  await build({
    configFile: false,
    root,
    logLevel: 'silent',
    ssr: { noExternal: true },
    build: {
      ssr: entry,
      outDir: join(root, 'dist'),
      rollupOptions: {
        output: { entryFileNames: 'entry-server.mjs', chunkFileNames: 'assets/chunk-[hash].js' },
      },
    },
  });
  const { executeWave2Ssr } = await import(moduleURL);
  const fixture = { ssrPath: join(root, 'dist/entry-server.mjs') };
  const first = await executeWave2Ssr({ fixture, request });
  const bootstrap = await executeWave2Ssr({ fixture, request, renderTarget: 'server-render-open' });
  for (const result of [first, bootstrap]) {
    assert.match(result.bootstrap.html, /data-same-react="true"/);
    assert.match(result.bootstrap.html, /data-injected-id="[^"]+"/);
    assert.match(result.bootstrap.html, /data-imported-id="[^"]+"/);
    assert.equal(result.observation.diagnostics.ssrProcess.disposed, true);
  }
  assert.equal(bootstrap.bootstrap.renderTarget, 'server-render-open');
  assert.notEqual(
    first.observation.diagnostics.ssrProcess.pid,
    bootstrap.observation.diagnostics.ssrProcess.pid,
  );
});

test('SSR binding accepts canonical key order but rejects malformed or altered execution requests', async () => {
  const { observeWave2SsrMarkup, loadWave2HtmlParser } = await import(moduleURL);
  const { parse } = await loadWave2HtmlParser();
  const { request } = setup('OF-ANCHORED');
  const renders = request.scenario.operations.map((op) =>
    rendered(
      request,
      'OF-ANCHORED',
      '<button data-overlay-id="trigger">Neutral</button>',
      op.target,
    ),
  );
  for (const render of renders) render.requestJSON = canonicalJson(request);
  assert.notEqual(renders[0].requestJSON, JSON.stringify(request));
  assert.doesNotThrow(() =>
    observeWave2SsrMarkup({ request, renders, parse, resources: resources() }),
  );
  for (const change of [
    (value) => {
      value.cell.direction = 'rtl';
    },
    (value) => {
      value.scenario.operations.reverse();
    },
    (value) => {
      value.expected = {};
    },
    (value) => {
      delete value.cell;
    },
  ]) {
    const altered = structuredClone(request);
    change(altered);
    const changed = structuredClone(renders);
    changed[0].requestJSON = JSON.stringify(altered);
    assert.throws(
      () => observeWave2SsrMarkup({ request, renders: changed, parse, resources: resources() }),
      (error) =>
        error.scope === 'run' && error.classification === 'policy' && /binding/.test(error.message),
    );
  }
  for (const invalid of ['{', 'null', '[]']) {
    const changed = structuredClone(renders);
    changed[0].requestJSON = invalid;
    assert.throws(
      () => observeWave2SsrMarkup({ request, renders: changed, parse, resources: resources() }),
      /binding/,
    );
  }
});
