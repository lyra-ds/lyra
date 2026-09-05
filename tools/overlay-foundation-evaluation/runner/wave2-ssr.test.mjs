import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { WAVE_2_SCENARIOS } from '../contracts/wave2.mjs';
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
