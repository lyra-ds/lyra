import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { verifyRegularFile } from './artifacts.mjs';
import { sameWave2ExecutionRequest } from './wave2-ssr.mjs';
import { MODAL_CELL_POLICIES } from './modal-cells.mjs';
import { BEHAVIORAL_WAVE_CELLS } from '../contracts/cells.mjs';
import { isPlainRecord } from '../contracts/protocol.mjs';
import {
  wave2ExecutionScenario,
  validateWave2FixtureRequest,
  validateWave2Observation,
} from '../fixtures/wave2/protocol.mjs';

export const WAVE_2_CELL_POLICIES = Object.freeze({ ...MODAL_CELL_POLICIES });
if (JSON.stringify(Object.keys(WAVE_2_CELL_POLICIES)) !== JSON.stringify(BEHAVIORAL_WAVE_CELLS))
  throw new Error('Wave2 cell policies must equal the closed behavioral inventory');
const EPOCH = 0;
function fatal(message, cause) {
  return Object.assign(new Error(message, { cause }), { classification: 'fixture', scope: 'run' });
}
function product(message) {
  return Object.assign(new Error(message), { classification: 'product', scope: 'candidate' });
}
function validateObservation(observation) {
  const errors = validateWave2Observation(observation);
  if (errors.length) throw fatal('Wave2 observation is invalid: ' + errors.join('; '));
  return observation;
}

export function wave2FixtureRequest(cellId, reactVersion, scenario) {
  const policy = WAVE_2_CELL_POLICIES[cellId];
  if (!policy || !policy.reactVersions.includes(reactVersion))
    throw fatal('unknown Wave2 cell or React version');
  const context = policy.context ?? {};
  const request = {
    schemaVersion: 1,
    scenario: wave2ExecutionScenario(scenario),
    cell: {
      id: cellId,
      reactVersion,
      direction: policy.dir ?? 'ltr',
      colorScheme: context.colorScheme ?? 'light',
      forcedColors: context.forcedColors === 'active',
      reducedMotion: context.reducedMotion === 'reduce',
      coarsePointer: context.hasTouch === true,
    },
  };
  const errors = validateWave2FixtureRequest(request);
  if (errors.length) throw fatal('Wave2 request is invalid: ' + errors.join('; '));
  return request;
}

async function startFixtureServer({ fixture, initialMarkup, request: fixtureRequest }) {
  const htmlPath = await realpath(fixture.clientHtmlPath);
  const root = dirname(htmlPath);
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', 'http://127.0.0.1');
      const path = await realpath(
        url.pathname === '/' ? htmlPath : resolve(root, '.' + url.pathname),
      );
      const rel = relative(root, path);
      if (isAbsolute(rel) || rel === '..' || rel.startsWith('../'))
        throw new Error('fixture path escape');
      let bytes = await readFile(path);
      if (path === htmlPath) {
        const html = bytes.toString('utf8');
        if (!/<html\s+lang="en">/u.test(html)) throw new Error('fixture shell HTML root missing');
        bytes = Buffer.from(
          html.replace(
            '<html lang="en">',
            '<html lang="en" dir="' + fixtureRequest.cell.direction + '">',
          ),
        );
      }
      if (path === htmlPath && initialMarkup !== undefined) {
        const html = bytes.toString('utf8');
        const marker = /(<main\b[^>]*\bdata-overlay-fixture-root[^>]*>)([\s\S]*?)(<\/main>)/gu;
        if ([...html.matchAll(marker)].length !== 1)
          throw new Error('fixture shell must have one root');
        bytes = html.replace(marker, (_all, start, _old, end) => start + initialMarkup + end);
      }
      response.writeHead(200, {
        'content-type':
          {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.mjs': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
          }[extname(path)] ?? 'application/octet-stream',
        'cache-control': 'no-store',
      });
      response.end(bytes);
    } catch {
      response.writeHead(404);
      response.end();
    }
  });
  await new Promise((yes, no) => {
    server.once('error', no);
    server.listen(0, '127.0.0.1', yes);
  });
  return {
    url: 'http://127.0.0.1:' + server.address().port + '/',
    close: () => new Promise((yes, no) => server.close((error) => (error ? no(error) : yes()))),
  };
}
function initializePage({ request, ssr }) {
  if (ssr !== undefined)
    Object.defineProperty(globalThis, '__LYRA_WAVE2_SSR__', { value: ssr, configurable: true });
  globalThis.__LYRA_WAVE2_NATIVE_EVENTS__ = [];
  for (const type of [
    'pointerdown',
    'pointerup',
    'pointercancel',
    'touchstart',
    'touchend',
    'touchcancel',
    'click',
  ])
    document.addEventListener(
      type,
      (event) =>
        globalThis.__LYRA_WAVE2_NATIVE_EVENTS__.push({
          type: event.type,
          trusted: event.isTrusted,
          pointerType: event.pointerType ?? null,
          target: event.target?.getAttribute?.('data-overlay-id') ?? null,
        }),
      true,
    );
  for (const type of ['keydown', 'keypress', 'beforeinput', 'input', 'keyup'])
    document.addEventListener(
      type,
      (event) => {
        if (event.key !== 'á' && event.data !== 'á') return;
        globalThis.__LYRA_WAVE2_NATIVE_EVENTS__.push({
          type: event.type,
          trusted: event.isTrusted,
          key: event.key ?? null,
          code: event.code ?? null,
          keyCode: event.keyCode ?? null,
          data: event.data ?? null,
          target: event.target?.getAttribute?.('data-overlay-id') ?? null,
        });
      },
      true,
    );
}
function readNativeEvents() {
  return globalThis.__LYRA_WAVE2_NATIVE_EVENTS__ ?? [];
}
function readReady() {
  const bridge = globalThis.__LYRA_WAVE2_FIXTURE__;
  if (bridge?.readyStatus === 'failed')
    throw new Error('Wave2 bootstrap failed: ' + bridge.mountError);
  return bridge?.readyStatus;
}
function readClock() {
  return Date.now();
}
async function executeOperation({ operation, options }) {
  return globalThis.__LYRA_WAVE2_FIXTURE__.runOperation(operation, options);
}
async function cleanupFixture() {
  const bridge = globalThis.__LYRA_WAVE2_FIXTURE__;
  if (!bridge) throw new Error('Wave2 cleanup bridge missing');
  await bridge.destroy();
  return bridge.observe();
}
function readAuditClock() {
  return { date: Date.now(), performance: performance.now() };
}
async function auditLiveDocument() {
  if (globalThis.axe?.version !== '4.13.0') throw new Error('exact axe tool missing');
  const result = await globalThis.axe.run(document);
  return {
    version: globalThis.axe.version,
    violations: result.violations.map(({ id, impact, nodes }) => ({
      id,
      impact,
      nodes: nodes.length,
    })),
  };
}

// axe schedules its own asynchronous rule completion. A Chromium isolated world
// shares the live DOM, but keeps those tool timers separate from the paused
// candidate clock. Never resume or advance the candidate to complete an audit.
export async function runWave2AxeAudit({ page, context, tool }) {
  let session, primary, result;
  const cleanupErrors = [],
    objectGroup = 'lyra-wave2-axe';
  try {
    if (tool?.name !== 'axe-core' || tool.version !== '4.13.0' || tool.license !== 'MPL-2.0')
      throw fatal('invalid pinned axe tool evidence');
    await verifyRegularFile({ path: tool.path, expectedSha256: tool.sha256 });
    const source = await readFile(tool.path, 'utf8');
    if (createHash('sha256').update(source).digest('hex') !== tool.sha256)
      throw fatal('axe source changed during read');
    const before = await page.evaluate(readAuditClock);
    session = await context.newCDPSession(page);
    const { frameTree } = await session.send('Page.getFrameTree');
    if (!frameTree?.frame?.id) throw fatal('axe audit main frame missing');
    const { executionContextId } = await session.send('Page.createIsolatedWorld', {
      frameId: frameTree.frame.id,
      worldName: 'lyra-wave2-axe',
    });
    if (!Number.isInteger(executionContextId)) throw fatal('axe isolated world missing');
    const loaded = await session.send('Runtime.evaluate', {
      expression: source,
      contextId: executionContextId,
      objectGroup,
    });
    if (loaded.exceptionDetails)
      throw fatal('axe isolated source evaluation failed', loaded.exceptionDetails);
    const audited = await bounded(
      session.send('Runtime.evaluate', {
        expression: '(' + auditLiveDocument.toString() + ')()',
        contextId: executionContextId,
        objectGroup,
        awaitPromise: true,
        returnByValue: true,
      }),
      'isolated axe audit',
    );
    if (audited.exceptionDetails)
      throw fatal('axe isolated audit evaluation failed', audited.exceptionDetails);
    const value = audited.result?.value;
    if (
      value?.version !== '4.13.0' ||
      !Array.isArray(value.violations) ||
      value.violations.some(
        (v) =>
          typeof v?.id !== 'string' ||
          !['minor', 'moderate', 'serious', 'critical', null].includes(v.impact) ||
          !Number.isSafeInteger(v.nodes) ||
          v.nodes < 0,
      )
    )
      throw fatal('invalid isolated axe result');
    const after = await page.evaluate(readAuditClock);
    if (before.date !== after.date || before.performance !== after.performance)
      throw fatal('candidate clock advanced during isolated axe audit');
    result = {
      ...value,
      executionWorld: 'chromium-isolated',
      toolSha256: tool.sha256,
      candidateClock: after,
    };
  } catch (error) {
    primary = error.scope ? error : fatal('isolated axe audit failed', error);
  }
  for (const cleanup of [
    () => session?.send('Runtime.releaseObjectGroup', { objectGroup }),
    () => session?.detach(),
    () =>
      tool?.path ? verifyRegularFile({ path: tool.path, expectedSha256: tool.sha256 }) : undefined,
  ])
    try {
      await cleanup();
    } catch (error) {
      cleanupErrors.push(error);
    }
  if (cleanupErrors.length)
    throw Object.assign(
      new AggregateError(
        primary ? [primary, ...cleanupErrors] : cleanupErrors,
        'isolated axe audit cleanup failed',
      ),
      { classification: 'fixture', scope: 'run' },
    );
  if (primary) throw primary;
  return result;
}
async function bounded(promise, label, milliseconds = 30_000) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(fatal(label + ' timed out with candidate clock paused')),
          milliseconds,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function targetPoint(target) {
  const nodes = [...document.querySelectorAll('[data-overlay-id]')].filter(
    (node) => node.isConnected && node.getAttribute('data-overlay-id') === target,
  );
  if (nodes.length !== 1) return { found: false };
  const node = nodes[0],
    rect = node.getBoundingClientRect(),
    style = getComputedStyle(node);
  if (
    !rect.width ||
    !rect.height ||
    node.hidden ||
    style.display === 'none' ||
    style.visibility === 'hidden'
  )
    return { found: false };
  const x = Math.max(0, rect.left) + Math.min(rect.width, innerWidth - Math.max(0, rect.left)) / 2;
  const y = Math.max(0, rect.top) + Math.min(rect.height, innerHeight - Math.max(0, rect.top)) / 2;
  const hit = document.elementFromPoint(x, y);
  return {
    found:
      x >= 0 &&
      y >= 0 &&
      x < innerWidth &&
      y < innerHeight &&
      !!hit &&
      (hit === node || node.contains(hit)),
    x,
    y,
  };
}

// Native methods accept neutral consumer targets only. No candidate selectors or
// manufactured DOM events cross this boundary.
export function createWave2NativeInput({ page, context, policy }) {
  let cdp,
    touch,
    mouseDown = false,
    boundaryError;
  const receipts = [];
  const keys = {
    activate: ['target'],
    close: ['target', 'trigger'],
    press: ['key'],
    hover: ['target'],
    point: ['target', 'phase', 'pointerType', 'button', 'drag'],
    viewport: ['width', 'height'],
    visualViewport: ['width'],
    motion: ['reducedMotion'],
  };
  const point = async (target) => {
    const result = await page.evaluate(targetPoint, target);
    if (!result?.found) throw product('native target is missing, hidden, or obscured: ' + target);
    return result;
  };
  const invoke = async (_source, method, args) => {
    try {
      if (
        !Object.hasOwn(keys, method) ||
        !isPlainRecord(args) ||
        JSON.stringify(Object.keys(args).sort()) !== JSON.stringify([...keys[method]].sort())
      )
        throw fatal('invalid Wave2 native input method or keys');
      if (
        ['activate', 'close', 'hover', 'point'].includes(method) &&
        !/^[-a-z0-9]+$/u.test(args.target)
      )
        throw fatal('invalid neutral input target');
      if (method === 'press') {
        if (typeof args.key !== 'string' || !args.key || args.key.length > 30)
          throw fatal('invalid native key');
        if (args.key === 'á') {
          if (createRequire(import.meta.url)('playwright/package.json').version !== '1.62.1')
            throw fatal('native Unicode bridge requires exact Playwright 1.62.1');
          let session;
          if (policy.engine === 'chromium') {
            cdp ??= await context.newCDPSession(page);
            session = cdp;
          } else if (['firefox', 'webkit'].includes(policy.engine)) {
            const implementation = page._connection?.toImpl?.(page);
            session =
              policy.engine === 'firefox'
                ? implementation?.delegate?._session
                : implementation?.delegate?._pageProxySession;
          }
          if (typeof session?.send !== 'function')
            throw fatal('pinned native Unicode engine capability unavailable');
          const firefox = policy.engine === 'firefox';
          const methodName = firefox ? 'Page.dispatchKeyEvent' : 'Input.dispatchKeyEvent';
          // Exact 1.62.1 RawKeyboard payloads for the catalog's accented KeyA.
          const down = firefox
            ? {
                type: 'keydown',
                keyCode: 65,
                code: 'KeyA',
                key: 'á',
                repeat: false,
                location: 0,
                text: 'á',
              }
            : {
                type: 'keyDown',
                modifiers: 0,
                windowsVirtualKeyCode: 65,
                code: 'KeyA',
                key: 'á',
                text: 'á',
                unmodifiedText: 'á',
                autoRepeat: false,
                isKeypad: false,
                ...(policy.engine === 'chromium' ? { location: 0, commands: [] } : {}),
              };
          const up = firefox
            ? { type: 'keyup', key: 'á', keyCode: 65, code: 'KeyA', location: 0, repeat: false }
            : {
                type: 'keyUp',
                modifiers: 0,
                key: 'á',
                windowsVirtualKeyCode: 65,
                code: 'KeyA',
                isKeypad: false,
                ...(policy.engine === 'chromium' ? { location: 0 } : {}),
              };
          const before = await page.evaluate(readNativeEvents);
          let primary;
          try {
            await session.send(methodName, down);
          } catch (error) {
            primary = error;
          }
          try {
            await session.send(methodName, up);
          } catch (error) {
            if (primary)
              throw new AggregateError([primary, error], 'native Unicode down and release failed');
            throw error;
          }
          if (primary) throw primary;
          const events = (await page.evaluate(readNativeEvents)).slice(before.length);
          if (
            !['keydown', 'keyup'].every((type) =>
              events.some(
                (event) => event.type === type && event.trusted === true && event.key === 'á',
              ),
            )
          )
            throw fatal('native Unicode key did not produce trusted keydown and keyup');
          receipts.push({ method, args, events });
        } else await page.keyboard.press(args.key);
      } else if (method === 'activate') {
        const p = await point(args.target);
        if (policy.synthesizeHover === false) await page.touchscreen.tap(p.x, p.y);
        else {
          await page.mouse.move(p.x, p.y);
          await page.mouse.down();
          await page.mouse.up();
        }
      } else if (method === 'close') await page.keyboard.press('Escape');
      else if (method === 'hover') {
        if (policy.synthesizeHover === false) throw fatal('coarse pointer cannot synthesize hover');
        const p = await point(args.target);
        await page.mouse.move(p.x, p.y);
      } else if (method === 'viewport' || method === 'visualViewport') {
        const size = {
          width: args.width,
          height: method === 'viewport' ? args.height : page.viewportSize().height,
        };
        if (!Object.values(size).every((v) => Number.isSafeInteger(v) && v > 0 && v <= 10000))
          throw fatal('invalid viewport dimensions');
        await page.setViewportSize(size);
        if (
          method === 'visualViewport' &&
          (await page.evaluate(() => visualViewport.width)) !== size.width
        )
          throw fatal('native visual viewport width did not match requested size');
      } else if (method === 'motion') {
        if (!['reduce', 'no-preference'].includes(args.reducedMotion))
          throw fatal('invalid motion preference');
        await page.emulateMedia({ reducedMotion: args.reducedMotion });
      } else if (method === 'point') {
        if (
          !['down', 'up', 'move', 'cancel'].includes(args.phase) ||
          !['mouse', 'touch'].includes(args.pointerType) ||
          !['left', 'right'].includes(args.button) ||
          typeof args.drag !== 'boolean'
        )
          throw fatal('invalid native pointer request');
        const p = await point(args.target);
        if (args.pointerType === 'touch') {
          const version = createRequire(import.meta.url)('playwright/package.json').version;
          if (version !== '1.62.1')
            throw fatal('native touch bridge requires exact Playwright 1.62.1');
          let session;
          if (policy.engine === 'chromium') {
            cdp ??= await context.newCDPSession(page);
            session = cdp;
          } else if (['firefox', 'webkit'].includes(policy.engine)) {
            const implementation = page._connection?.toImpl?.(page);
            session =
              policy.engine === 'webkit'
                ? implementation?.delegate?._pageProxySession
                : implementation?.delegate?._session;
          }
          if (typeof session?.send !== 'function')
            throw fatal('pinned native touch engine capability unavailable');
          if (args.phase === 'down') touch = { x: p.x, y: p.y, id: 1 };
          else if (args.phase === 'move') {
            if (!touch) throw fatal('touch move requires active contact');
            touch = { ...touch, x: p.x, y: p.y - (args.drag ? 40 : 0) };
          }
          const type = {
            down: 'touchStart',
            move: 'touchMove',
            up: 'touchEnd',
            cancel: 'touchCancel',
          }[args.phase];
          if (!touch) throw fatal('native touch requires active contact');
          const active = policy.engine === 'firefox' ? { x: touch.x, y: touch.y } : touch;
          const beforeEvents = await page.evaluate(readNativeEvents);
          await session.send(
            policy.engine === 'firefox' ? 'Page.dispatchTouchEvent' : 'Input.dispatchTouchEvent',
            {
              type,
              modifiers: 0,
              touchPoints:
                policy.engine === 'chromium' && ['up', 'cancel'].includes(args.phase)
                  ? []
                  : [active],
            },
          );
          const afterEvents = await page.evaluate(readNativeEvents);
          const events = afterEvents.slice(beforeEvents.length);
          if (
            args.phase === 'cancel' &&
            !events.some(
              (event) =>
                event.type === 'pointercancel' &&
                event.trusted === true &&
                event.pointerType === 'touch',
            )
          )
            throw fatal('native cancellation did not produce a trusted pointercancel');
          receipts.push({ method, args, events });
          if (['up', 'cancel'].includes(args.phase)) touch = undefined;
        } else {
          if (args.phase === 'cancel')
            throw fatal('trusted cross-engine pointer cancellation capability is not established');
          await page.mouse.move(p.x + (args.drag ? 40 : 0), p.y, { steps: args.drag ? 5 : 1 });
          if (args.phase === 'down') {
            if (mouseDown) throw fatal('mouse contact already active');
            await page.mouse.down({ button: args.button });
            mouseDown = true;
          }
          if (args.phase === 'up') {
            await page.mouse.up({ button: args.button });
            mouseDown = false;
          }
        }
      }
    } catch (error) {
      boundaryError = error;
      throw error;
    }
  };
  return {
    invoke,
    getError: () => boundaryError,
    diagnostics: () => structuredClone(receipts),
    close: async () => {
      await cdp?.detach();
    },
  };
}

async function executeSsr(input) {
  const { executeWave2Ssr } = await import('./wave2-ssr.mjs');
  return executeWave2Ssr(input);
}

export async function preflightWave2BrowserInputs({ playwright }) {
  if (process.platform !== 'linux' || process.env.OVERLAY_WAVE2_CONTAINER !== '1')
    throw fatal('Wave2 browser execution requires the pinned evaluation container');
  const engines = [];
  for (const engine of ['chromium', 'firefox', 'webkit']) {
    let browser, context, page, input, primary;
    const errors = [];
    try {
      browser = await playwright[engine].launch();
      context = await browser.newContext({ viewport: { width: 800, height: 600 } });
      page = await context.newPage();
      await page.clock.install({ time: 0 });
      await page.clock.pauseAt(0);
      await page.setContent(
        '<main><button data-overlay-id="outside-control" style="position:absolute;left:20px;top:20px;width:100px;height:100px">Outside</button><button data-overlay-id="next">Next</button></main>',
      );
      await page.evaluate(initializePage, { request: { cell: { direction: 'ltr' } } });
      input = createWave2NativeInput({ page, context, policy: { engine, context: {} } });
      for (const phase of ['down', 'cancel'])
        await input.invoke({}, 'point', {
          target: 'outside-control',
          phase,
          pointerType: 'touch',
          button: 'left',
          drag: false,
        });
      await input.invoke({}, 'point', {
        target: 'outside-control',
        phase: 'up',
        pointerType: 'mouse',
        button: 'left',
        drag: false,
      });
      await page.evaluate(() =>
        document.querySelector('[data-overlay-id="outside-control"]').focus(),
      );
      await input.invoke({}, 'press', { key: 'Tab' });
      const nativeTab = await page.evaluate(
        () => document.activeElement?.getAttribute('data-overlay-id') === 'next',
      );
      await page.evaluate(() => {
        const editable = document.createElement('input');
        editable.setAttribute('data-overlay-id', 'unicode-editable');
        const menu = document.createElement('button');
        menu.setAttribute('data-overlay-id', 'unicode-menu');
        globalThis.__LYRA_WAVE2_UNICODE_HANDLED__ = [];
        menu.addEventListener('keydown', (event) => {
          globalThis.__LYRA_WAVE2_UNICODE_HANDLED__.push(event.key);
          event.preventDefault();
        });
        document.querySelector('main').append(editable, menu);
        editable.focus();
      });
      await input.invoke({}, 'press', { key: 'á' });
      await page.evaluate(() => document.querySelector('[data-overlay-id="unicode-menu"]').focus());
      await input.invoke({}, 'press', { key: 'á' });
      const unicode = await page.evaluate(() => ({
        text: document.querySelector('[data-overlay-id="unicode-editable"]').value,
        handled: globalThis.__LYRA_WAVE2_UNICODE_HANDLED__,
        events: globalThis.__LYRA_WAVE2_NATIVE_EVENTS__.filter((event) =>
          event.target?.startsWith('unicode-'),
        ),
      }));
      if (
        unicode.text !== 'á' ||
        JSON.stringify(unicode.handled) !== '["á"]' ||
        !['unicode-editable', 'unicode-menu'].every(
          (target) =>
            JSON.stringify(
              unicode.events
                .filter(
                  (event) => event.target === target && ['keydown', 'keyup'].includes(event.type),
                )
                .map((event) => [event.type, event.trusted, event.key]),
            ) ===
            JSON.stringify([
              ['keydown', true, 'á'],
              ['keyup', true, 'á'],
            ]),
        ) ||
        !unicode.events.some(
          (event) =>
            event.target === 'unicode-editable' &&
            event.type === 'input' &&
            event.trusted &&
            event.data === 'á',
        ) ||
        unicode.events.some(
          (event) =>
            event.target === 'unicode-menu' &&
            ['keypress', 'beforeinput', 'input'].includes(event.type),
        )
      )
        throw fatal('native Unicode browser preflight failed');
      await input.invoke({}, 'visualViewport', { width: 480 });
      const clock = await page.evaluate(readClock),
        events = await page.evaluate(readNativeEvents),
        visualViewportWidth = await page.evaluate(() => visualViewport.width);
      const trustedCancellation = events.some(
        (e) => e.type === 'pointercancel' && e.trusted === true,
      );
      if (!nativeTab || !trustedCancellation || clock !== 0 || visualViewportWidth !== 480)
        throw fatal('native browser preflight failed');
      let axeAudit;
      if (engine === 'chromium') {
        const require = createRequire(import.meta.url);
        const metadata = JSON.parse(
          await readFile(require.resolve('axe-core/package.json'), 'utf8'),
        );
        const path = await realpath(require.resolve('axe-core/axe.js'));
        const tool = {
          name: metadata.name,
          version: metadata.version,
          license: metadata.license,
          path,
          sha256: createHash('sha256')
            .update(await readFile(path))
            .digest('hex'),
        };
        await page.setContent(
          '<!doctype html><html lang="en"><head><title>Audit</title></head><body><main><h1>Audit</h1><button></button></main></body></html>',
        );
        axeAudit = await runWave2AxeAudit({ page, context, tool });
        if (axeAudit.violations.length !== 1 || axeAudit.violations[0].id !== 'button-name')
          throw fatal('isolated axe preflight failed known live-DOM audit');
      }
      engines.push({
        engine,
        nativeTab,
        trustedCancellation,
        unicode,
        clock,
        visualViewportWidth,
        events,
        ...(axeAudit ? { axeAudit } : {}),
      });
    } catch (error) {
      primary = error;
    } finally {
      for (const close of [
        () => input?.close(),
        () => page?.close(),
        () => context?.close(),
        () => browser?.close(),
      ])
        try {
          await close();
        } catch (error) {
          errors.push(error);
        }
    }
    if (errors.length)
      throw Object.assign(
        new AggregateError(
          primary ? [primary, ...errors] : errors,
          'native preflight cleanup failed',
        ),
        { classification: 'policy', scope: 'run' },
      );
    if (primary) throw fatal(primary.message, primary);
  }
  return { schemaVersion: 1, playwrightVersion: '1.62.1', engines };
}

export async function runWave2Cell(
  { cellId, fixtures, playwright, scenario },
  { executeSsr: render = executeSsr, startServer = startFixtureServer } = {},
) {
  const policy = WAVE_2_CELL_POLICIES[cellId];
  if (!policy || !(fixtures instanceof Map))
    throw fatal('unknown Wave2 cell or fixture version map');
  for (const version of policy.reactVersions)
    if (!fixtures.has(version)) throw fatal('fixture missing for React ' + version);
  const observations = [];
  for (const reactVersion of policy.reactVersions) {
    const fixture = fixtures.get(reactVersion),
      request = wave2FixtureRequest(cellId, reactVersion, scenario);
    if (policy.mode === 'ssr') {
      const result = await render({ fixture, request });
      observations.push({ reactVersion, observation: validateObservation(result.observation) });
      continue;
    }
    let server, browser, context, page, input, observation, primary, audit;
    const cleanupErrors = [];
    try {
      const hydration = request.scenario.operations.some(
        (op) => op.operation === 'updateContent' && op.target === 'hydrate-first-tree',
      );
      const ssr = hydration
        ? (await render({ fixture, request, renderTarget: request.scenario.operations[0].target }))
            .bootstrap
        : undefined;
      if (
        hydration &&
        (!isPlainRecord(ssr) ||
          typeof ssr.html !== 'string' ||
          !sameWave2ExecutionRequest(ssr.requestJSON, request))
      )
        throw fatal('invalid exact hydration bootstrap');
      server = await startServer({ fixture, request, initialMarkup: ssr?.html });
      browser = await playwright[policy.engine].launch();
      context = await browser.newContext({
        ...policy.context,
        viewport: { width: 800, height: 600 },
      });
      page = await context.newPage();
      await page.clock.install({ time: new Date(EPOCH) });
      await page.clock.pauseAt(new Date(EPOCH));
      input = createWave2NativeInput({ page, context, policy });
      await page.exposeBinding('__LYRA_WAVE2_NATIVE_INPUT__', input.invoke);
      await page.addInitScript(initializePage, { request, ssr });
      await page.goto(server.url);
      const deadline = Date.now() + 30_000;
      while ((await page.evaluate(readReady)) !== 'ready') {
        if (Date.now() > deadline) throw fatal('Wave2 readiness timed out with clock paused');
        await delay(10);
      }
      for (const [operationIndex, operation] of request.scenario.operations.entries()) {
        const before = await page.evaluate(readClock);
        const options = {};
        if (operation.operation === 'advanceTime') {
          await page.clock.runFor(operation.milliseconds);
          const after = await page.evaluate(readClock);
          if (after - before !== operation.milliseconds)
            throw fatal('controlled clock transition drift');
          options.clockTransition = {
            operationIndex,
            before: before - EPOCH,
            after: after - EPOCH,
          };
        }
        await bounded(
          page.evaluate(executeOperation, { operation, options }),
          'Wave2 operation ' + operationIndex,
        );
        const after = await page.evaluate(readClock);
        if (after - before !== (operation.operation === 'advanceTime' ? operation.milliseconds : 0))
          throw fatal('candidate clock advanced outside advanceTime');
      }
      if (policy.axe)
        audit = await runWave2AxeAudit({ page, context, tool: fixture.toolEvidence?.axe });
    } catch (error) {
      primary =
        input?.getError() ?? (error?.scope ? error : fatal(error.message ?? String(error), error));
    } finally {
      for (const cleanup of [
        async () => {
          if (page)
            observation = await bounded(page.evaluate(cleanupFixture), 'fixture cleanup', 5000);
        },
        () => input?.close(),
        () => page?.close(),
        () => context?.close(),
        () => browser?.close(),
        () => server?.close(),
      ])
        try {
          await cleanup();
        } catch (error) {
          cleanupErrors.push(error);
        }
    }
    if (cleanupErrors.length)
      throw Object.assign(
        new AggregateError(
          primary ? [primary, ...cleanupErrors] : cleanupErrors,
          'Wave2 cleanup is uncertain',
        ),
        { classification: 'policy', scope: 'run' },
      );
    if (primary) throw primary;
    observation.diagnostics.nativeInput = input.diagnostics();
    if (audit !== undefined) {
      if (!Array.isArray(audit?.violations)) throw fatal('invalid axe audit evidence');
      observation.diagnostics.axe = audit;
    }
    observations.push({ reactVersion, observation: validateObservation(observation) });
  }
  return observations;
}
