import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { BEHAVIORAL_WAVE_CELLS } from '../contracts/cells.mjs';
import { MODAL_CELL_POLICIES } from './modal-cells.mjs';
import { canonicalJson } from '../evidence/results.mjs';
import { createWave2Runtime, installWave2ResourceTracker } from '../fixtures/wave2/runtime.mjs';

const moduleURL = new URL('./wave2-cells.mjs', import.meta.url);
async function axeTool() {
  const path = await realpath(createRequire(import.meta.url).resolve('axe-core/axe.js'));
  return {
    name: 'axe-core',
    version: '4.13.0',
    license: 'MPL-2.0',
    path,
    sha256: createHash('sha256')
      .update(await readFile(path))
      .digest('hex'),
  };
}

test('axe isolated-world audit verifies tool bytes and detaches after success or protocol failure', async () => {
  const { runWave2AxeAudit } = await import(moduleURL);
  for (const failure of [
    'none',
    'source',
    'invalid',
    'audit',
    'release',
    'detach',
    'audit-and-detach',
    'clock',
  ]) {
    const calls = [];
    const context = {
      newCDPSession: async () => ({
        send: async (method, args) => {
          calls.push([method, args]);
          if (method === 'Page.getFrameTree') return { frameTree: { frame: { id: 'main' } } };
          if (method === 'Page.createIsolatedWorld') return { executionContextId: 17 };
          if (method === 'Runtime.releaseObjectGroup' && failure === 'release')
            throw new Error('release failed');
          if (args.awaitPromise) {
            if (failure.includes('audit')) return { exceptionDetails: { text: 'audit failed' } };
            if (failure === 'invalid')
              return { result: { value: { version: '4.13.0', violations: [{}] } } };
            return { result: { value: { version: '4.13.0', violations: [] } } };
          }
          if (method === 'Runtime.evaluate' && failure === 'source')
            return { exceptionDetails: { text: 'source failed' } };
          return {};
        },
        detach: async () => {
          calls.push(['detach']);
          if (failure.includes('detach')) throw new Error('detach failed');
        },
      }),
    };
    let readings = 0;
    const page = {
      evaluate: async () => ({ date: 0, performance: failure === 'clock' ? readings++ : 0 }),
    };
    const task = runWave2AxeAudit({ page, context, tool: await axeTool() });
    if (failure === 'none') assert.deepEqual((await task).violations, []);
    else
      await assert.rejects(task, (error) => {
        assert.equal(error.scope, 'run');
        if (failure === 'audit-and-detach') {
          assert.match(error.errors[0].message, /audit evaluation failed/);
          assert.match(error.errors[1].message, /detach failed/);
        }
        return true;
      });
    assert.equal(calls.at(-1)[0], 'detach');
    assert.ok(
      calls
        .filter(([name]) => name === 'Runtime.evaluate')
        .every(([, args]) => args.contextId === 17),
    );
  }
  let opened = false;
  await assert.rejects(
    runWave2AxeAudit({
      page: {},
      context: {
        newCDPSession: async () => {
          opened = true;
        },
      },
      tool: { ...(await axeTool()), sha256: '0'.repeat(64) },
    }),
  );
  assert.equal(opened, false);
});

test('axe harness failure still cleans fixture page context browser and server', async () => {
  const { runWave2Cell } = await import(moduleURL),
    f = fakeBrowser();
  await assert.rejects(
    runWave2Cell(
      {
        cellId: 'axe-light',
        fixtures: new Map([['19.2.8', {}]]),
        playwright: f.playwright,
        scenario: scenario(),
      },
      f.dependencies,
    ),
    (error) => error.scope === 'run',
  );
  assert.ok(f.calls.some((c) => Array.isArray(c) && c[1] === 'cleanupFixture'));
  assert.deepEqual(f.calls.slice(-4), [
    'page.close',
    'context.close',
    'browser.close',
    'server.close',
  ]);
});

test(
  'real pinned axe audit keeps candidate timers and globals frozen in light and dark',
  { skip: process.env.OVERLAY_WAVE2_NATIVE_TEST !== '1' },
  async () => {
    const { runWave2AxeAudit } = await import(moduleURL);
    const playwright = await import('playwright');
    for (const colorScheme of ['light', 'dark']) {
      const browser = await playwright.chromium.launch();
      try {
        const context = await browser.newContext({ colorScheme }),
          page = await context.newPage();
        await page.clock.install({ time: 0 });
        await page.clock.pauseAt(0);
        await page.setContent(
          '<!doctype html><html lang="en"><head><title>Audit</title></head><body><main><h1>Audit</h1><button></button></main></body></html>',
        );
        await page.evaluate(() => {
          globalThis.pendingProbe = 0;
          globalThis.originals = [setTimeout, clearTimeout, Date, performance.now];
          setTimeout(() => pendingProbe++, 0);
        });
        const result = await runWave2AxeAudit({ page, context, tool: await axeTool() });
        assert.deepEqual(
          result.violations.map((v) => v.id),
          ['button-name'],
        );
        assert.deepEqual(
          await page.evaluate(() => ({
            date: Date.now(),
            performance: performance.now(),
            pending: pendingProbe,
            globalsUnchanged: originals.every(
              (v, i) => v === [setTimeout, clearTimeout, Date, performance.now][i],
            ),
            axeInCandidate: typeof axe,
          })),
          {
            date: 0,
            performance: 0,
            pending: 0,
            globalsUnchanged: true,
            axeInCandidate: 'undefined',
          },
        );
      } finally {
        await browser.close();
      }
    }
  },
);
function scenario() {
  return {
    scenarioId: 'of-tooltip.clock.v1',
    operations: [
      { operation: 'hover', target: 'trigger' },
      ...[499, 1, 299, 1, 99, 1].map((milliseconds) => ({
        operation: 'advanceTime',
        target: 'browser-clock',
        milliseconds,
      })),
      { operation: 'blur', target: 'trigger' },
    ],
    probes: [],
  };
}
function fakeBrowser({ failOperation, failCleanup, cleanupTransport, observeTransform } = {}) {
  const wire = [];
  const calls = [];
  let runtime;
  let now = 0;
  let binding;
  const scope = { addEventListener() {}, removeEventListener() {} };
  const tracker = installWave2ResourceTracker(scope);
  const fixture = {
    observe: () => ({
      roles: [],
      relationships: [],
      states: [],
      focus: { target: 'trigger' },
      events: [],
      announcements: [],
      direction: 'ltr',
      diagnostics: { raw: { negativeZero: -0, text: 'á\\quoted', order: [3, null, true] } },
    }),
    destroy: async () => ({ status: 'destroyed' }),
    operations: { hover() {}, blur() {}, updateContent() {}, focus() {}, point() {}, press() {} },
  };
  const page = {
    clock: {
      install: async () => calls.push('install'),
      pauseAt: async () => calls.push('pause'),
      runFor: async (ms) => {
        calls.push(['runFor', ms]);
        now += ms;
      },
      resume: async () => calls.push('resume'),
    },
    addInitScript: async (fn, value) => {
      calls.push('init');
      calls.push(['initScript', fn, value]);
      runtime = createWave2Runtime(value.request);
      runtime.beginScenario({ fixture, tracker, document: {} });
    },
    exposeBinding: async (_, callback) => {
      binding = callback;
      calls.push('binding');
    },
    goto: async () => calls.push('goto'),
    evaluate: async (fn, args) => {
      calls.push(['evaluate', fn.name, args]);
      if (fn.name === 'readReady') return 'ready';
      if (fn.name === 'readClock') return now;
      if (fn.name === 'executeOperation') {
        if (args.operation.operation === failOperation) throw new Error('operation failed');
        const value = await runInNewContext('(' + fn.toString() + ')(args)', {
          __LYRA_WAVE2_FIXTURE__: runtime,
          args,
        });
        wire.push({ method: fn.name, value });
        return value;
      }
      if (fn.name === 'cleanupFixture') {
        if (failCleanup) throw new Error('fixture cleanup failed');
        const bridge = observeTransform
          ? { ...runtime, observe: () => observeTransform(runtime.observe()) }
          : runtime;
        const value = await runInNewContext('(' + fn.toString() + ')()', {
          __LYRA_WAVE2_FIXTURE__: bridge,
        });
        wire.push({ method: fn.name, value });
        return cleanupTransport ? cleanupTransport(value) : value;
      }
      if (fn.name === 'readObservation') return runtime.observe();
      throw new Error('unexpected evaluate ' + fn.name);
    },
    close: async () => calls.push('page.close'),
  };
  const context = { newPage: async () => page, close: async () => calls.push('context.close') };
  const browser = {
    newContext: async (options) => {
      calls.push(['context', options]);
      return context;
    },
    close: async () => calls.push('browser.close'),
  };
  return {
    calls,
    wire,
    finalObservation: () => runtime.observe(),
    page,
    get binding() {
      return binding;
    },
    playwright: Object.fromEntries(
      ['chromium', 'firefox', 'webkit'].map((engine) => [
        engine,
        {
          launch: async () => {
            calls.push(engine);
            return browser;
          },
        },
      ]),
    ),
    dependencies: {
      startServer: async () => ({
        url: 'http://127.0.0.1:7777/',
        close: async () => calls.push('server.close'),
      }),
    },
  };
}

test('exact closed fifteen policies preserve engines React and media without decision cells', async () => {
  const { WAVE_2_CELL_POLICIES } = await import(moduleURL);
  assert.deepEqual(Object.keys(WAVE_2_CELL_POLICIES), BEHAVIORAL_WAVE_CELLS);
  assert.deepEqual(WAVE_2_CELL_POLICIES, MODAL_CELL_POLICIES);
  assert.ok(Object.isFrozen(WAVE_2_CELL_POLICIES));
  for (const p of Object.values(WAVE_2_CELL_POLICIES)) {
    assert.ok(Object.isFrozen(p));
    assert.ok(Object.isFrozen(p.reactVersions));
  }
  for (const cell of [
    'bundle-standalone',
    'bundle-composition',
    'packed-esm',
    'packed-cjs',
    'packed-types',
    'consumer-vite',
    'consumer-next',
    'consumer-commonjs',
  ])
    assert.equal(WAVE_2_CELL_POLICIES[cell], undefined);
});

test('controlled clock installs and pauses before navigation and only timing operations advance exact boundaries', async () => {
  const { runWave2Cell } = await import(moduleURL);
  const f = fakeBrowser();
  const result = await runWave2Cell(
    {
      cellId: 'chromium',
      fixtures: new Map([['19.2.8', {}]]),
      playwright: f.playwright,
      scenario: scenario(),
    },
    f.dependencies,
  );
  assert.equal(result.length, 1);
  assert.ok(f.calls.indexOf('install') < f.calls.indexOf('pause'));
  assert.ok(f.calls.indexOf('pause') < f.calls.indexOf('goto'));
  assert.deepEqual(
    f.calls.filter((c) => Array.isArray(c) && c[0] === 'runFor').map((c) => c[1]),
    [499, 1, 299, 1, 99, 1],
  );
  const operations = f.calls
    .filter((c) => Array.isArray(c) && c[1] === 'executeOperation')
    .map((c) => c[2]);
  assert.deepEqual(
    operations.map((c) => c.operation),
    scenario().operations,
  );
  assert.deepEqual(
    operations.filter((c) => c.options.clockTransition).map((c) => c.options.clockTransition),
    [
      { operationIndex: 1, before: 0, after: 499 },
      { operationIndex: 2, before: 499, after: 500 },
      { operationIndex: 3, before: 500, after: 799 },
      { operationIndex: 4, before: 799, after: 800 },
      { operationIndex: 5, before: 800, after: 899 },
      { operationIndex: 6, before: 899, after: 900 },
    ],
  );
  assert.ok(!f.calls.includes('resume'));
});
for (const failCleanup of [false, true])
  test(
    'clock page context browser server and fixture cleanup survive operation failure ' +
      failCleanup,
    async () => {
      const { runWave2Cell } = await import(moduleURL);
      const f = fakeBrowser({ failOperation: 'hover', failCleanup });
      await assert.rejects(
        runWave2Cell(
          {
            cellId: 'chromium',
            fixtures: new Map([['19.2.8', {}]]),
            playwright: f.playwright,
            scenario: scenario(),
          },
          f.dependencies,
        ),
        (error) => {
          assert.equal(error.scope, 'run');
          return true;
        },
      );
      assert.ok(f.calls.some((c) => Array.isArray(c) && c[1] === 'cleanupFixture'));
      assert.deepEqual(f.calls.slice(-4), [
        'page.close',
        'context.close',
        'browser.close',
        'server.close',
      ]);
    },
  );

test('unknown cells and incomplete version maps fail closed before launch', async () => {
  const { runWave2Cell } = await import(moduleURL);
  const f = fakeBrowser();
  for (const cellId of ['packed-esm', 'hydration'])
    await assert.rejects(
      runWave2Cell(
        {
          cellId,
          fixtures: new Map([['19.2.8', {}]]),
          playwright: f.playwright,
          scenario: scenario(),
        },
        f.dependencies,
      ),
    );
  assert.deepEqual(f.calls, []);
});

test('approved viewport width and cancellation controls preserve exact catalog checkpoints', async () => {
  const { ANCHORED_SCENARIOS } = await import('../contracts/anchored.mjs');
  const placement = ANCHORED_SCENARIOS.find((s) =>
    s.operations.some((o) => o.target.startsWith('visual-viewport')),
  );
  assert.ok(placement.operations.some((o) => o.target === 'visual-viewport-width-480'));
  const nested = ANCHORED_SCENARIOS.find((s) =>
    s.scenarioId.includes('nested-child-pointer-origin'),
  );
  assert.deepEqual(
    nested.operations
      .filter((o) => o.operation !== 'advanceTime')
      .slice(11, 14)
      .map((o) => o.target),
    ['touch-outside-down', 'touch-outside-pointer-cancel', 'outside-up'],
  );
});

test('native partial touch uses actual pinned engine protocols and requires trusted cancellation', async () => {
  const { createWave2NativeInput } = await import(moduleURL);
  for (const engine of ['chromium', 'firefox', 'webkit']) {
    const calls = [],
      events = [];
    const session = {
      send: async (method, args) => {
        calls.push({ method, args });
        if (args.type === 'touchCancel')
          events.push({ type: 'pointercancel', trusted: true, pointerType: 'touch' });
      },
      detach: async () => {},
    };
    const page = {
      _connection: {
        toImpl: () => ({ delegate: { _session: session, _pageProxySession: session } }),
      },
      evaluate: async (fn) =>
        fn.name === 'targetPoint' ? { found: true, x: 50, y: 50 } : structuredClone(events),
    };
    const input = createWave2NativeInput({
      page,
      context: { newCDPSession: async () => session },
      policy: { engine, context: {} },
    });
    for (const phase of ['down', 'cancel'])
      await input.invoke({}, 'point', {
        target: 'outside-control',
        phase,
        pointerType: 'touch',
        button: 'left',
        drag: false,
      });
    assert.deepEqual(
      calls.map((c) => c.args.type),
      ['touchStart', 'touchCancel'],
    );
    assert.equal(
      calls[1].method,
      engine === 'firefox' ? 'Page.dispatchTouchEvent' : 'Input.dispatchTouchEvent',
    );
    assert.equal(calls[1].args.touchPoints.length, engine === 'chromium' ? 0 : 1);
    await input.close();
  }
});

test(
  'real pinned browser input preflight verifies trusted native touch keyboard clock and visual viewport',
  { skip: process.env.OVERLAY_WAVE2_NATIVE_TEST !== '1' },
  async () => {
    const { preflightWave2BrowserInputs } = await import(moduleURL);
    const playwright = await import('playwright');
    const result = await preflightWave2BrowserInputs({ playwright });
    assert.deepEqual(
      result.engines.map((e) => e.engine),
      ['chromium', 'firefox', 'webkit'],
    );
    assert.ok(
      result.engines.every(
        (e) =>
          e.trustedCancellation &&
          e.nativeTab &&
          e.clock === 0 &&
          e.visualViewportWidth === 480 &&
          e.unicode.text === 'á' &&
          JSON.stringify(e.unicode.handled) === '["á"]',
      ),
    );
  },
);

test('explicit settlement changes only approved non-timed operation checkpoints and preserves all literal answers', async () => {
  const { WAVE_2_SCENARIOS } = await import('../contracts/wave2.mjs');
  const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
  assert.equal(
    hash(WAVE_2_SCENARIOS.map((s) => s.expected)),
    'e5aa67082b9ef8086bd500f21735af1a53f883b25dec9804d79cbf4b5034e3e4',
  );
  const protectedScenarios = WAVE_2_SCENARIOS.filter(
    (s) =>
      s.contractId === 'OF-TOOLTIP' ||
      s.operations.some((o) => o.operation === 'advanceTime' && o.milliseconds !== 16) ||
      s.scenarioId.includes('ssr') ||
      s.scenarioId.includes('hydration'),
  );
  assert.equal(
    hash(protectedScenarios),
    '1bd79b8473102783d1fa06b34bb2c9b1f168a1fe6ff8cb6ea0d7638bb311634d',
  );
  const changed = WAVE_2_SCENARIOS.filter((s) =>
    s.operations.some((o) => o.operation === 'advanceTime' && o.milliseconds === 16),
  );
  assert.equal(changed.length, 16);
  for (const scenario of changed)
    for (const [i, operation] of scenario.operations.entries())
      if (operation.operation === 'advanceTime') {
        assert.equal(operation.milliseconds, 16);
        assert.ok(
          ['open', 'close', 'press', 'resize', 'scroll', 'setDirection'].includes(
            scenario.operations[i - 1]?.operation,
          ),
        );
        assert.ok(
          !scenario.probes.some((p) => p.phase === 'after-operation' && p.operationIndex === i - 1),
        );
      }
});

test('native media input consumes the literal common-fixture preference strings', async () => {
  const { createWave2NativeInput } = await import(moduleURL);
  const calls = [];
  const input = createWave2NativeInput({
    page: { emulateMedia: async (value) => calls.push(value) },
    context: {},
    policy: {},
  });
  await input.invoke({}, 'motion', { reducedMotion: 'reduce' });
  await input.invoke({}, 'motion', { reducedMotion: 'no-preference' });
  assert.deepEqual(calls, [{ reducedMotion: 'reduce' }, { reducedMotion: 'no-preference' }]);
  await assert.rejects(input.invoke({}, 'motion', { reducedMotion: true }), /motion/);
});

test('declared hydration bootstraps exact SSR and preserves focus before hydration in both React versions', async () => {
  const { runWave2Cell } = await import(moduleURL);
  const { ANCHORED_SCENARIOS } = await import('../contracts/anchored.mjs');
  const hydration = ANCHORED_SCENARIOS.find((s) => s.scenarioId.includes('hydration-stability'));
  for (const cellId of ['react-18', 'react-19', 'hydration']) {
    const f = fakeBrowser(),
      renders = [],
      served = [];
    const result = await runWave2Cell(
      {
        cellId,
        fixtures: new Map([
          ['18.3.1', {}],
          ['19.2.8', {}],
        ]),
        playwright: f.playwright,
        scenario: hydration,
      },
      {
        ...f.dependencies,
        executeSsr: async ({ request, renderTarget }) => {
          renders.push({ request, renderTarget });
          f.calls.push('SSR');
          return {
            bootstrap: {
              html: '<button data-overlay-id="trigger">SSR</button>',
              repeatHtml: '<button data-overlay-id="trigger">SSR</button>',
              requestJSON: canonicalJson(request),
              contractId: 'OF-ANCHORED',
              renderTarget,
              facts: { 'browser-globals:accessed': false },
            },
          };
        },
        startServer: async (input) => {
          served.push(input);
          return f.dependencies.startServer(input);
        },
      },
    );
    assert.equal(result.length, cellId === 'hydration' ? 2 : 1);
    assert.equal(renders.length, result.length);
    assert.ok(f.calls.indexOf('SSR') < f.calls.indexOf('goto'));
    assert.ok(served.every((s) => s.initialMarkup.includes('SSR')));
    for (const render of renders) {
      assert.deepEqual(Object.keys(render.request.scenario), [
        'scenarioId',
        'operations',
        'probes',
      ]);
      assert.equal(render.renderTarget, 'server-render-open');
    }
    const operations = f.calls
      .filter((c) => Array.isArray(c) && c[1] === 'executeOperation')
      .map((c) => c[2].operation);
    for (let i = 0; i < operations.length; i += hydration.operations.length)
      assert.deepEqual(operations.slice(i, i + 3), hydration.operations.slice(0, 3));
  }
});

test('navigation bootstrap is safe before the document element exists', async () => {
  const { runWave2Cell } = await import(moduleURL);
  const f = fakeBrowser();
  await runWave2Cell(
    {
      cellId: 'chromium',
      fixtures: new Map([['19.2.8', {}]]),
      playwright: f.playwright,
      scenario: scenario(),
    },
    f.dependencies,
  );
  const [, initialize, value] = f.calls.find((c) => Array.isArray(c) && c[0] === 'initScript');
  const original = Object.getOwnPropertyDescriptor(globalThis, 'document');
  try {
    globalThis.document = { documentElement: null, addEventListener() {} };
    assert.doesNotThrow(() => initialize(value));
  } finally {
    if (original) Object.defineProperty(globalThis, 'document', original);
    else delete globalThis.document;
    delete globalThis.__LYRA_WAVE2_NATIVE_EVENTS__;
  }
});

for (const engine of ['chromium', 'firefox', 'webkit']) {
  test(
    'native catalog Unicode key uses pinned ' + engine + ' key protocols and actual receipts',
    async () => {
      const { createWave2NativeInput } = await import(moduleURL);
      const calls = [],
        events = [];
      let detached = false;
      const session = {
        send: async (method, args) => {
          calls.push({ method, args });
          events.push({
            type: args.type.toLowerCase(),
            trusted: true,
            key: args.key,
            code: args.code,
            keyCode: 65,
          });
        },
        detach: async () => {
          detached = true;
        },
      };
      const page = {
        _connection: {
          toImpl: () => ({ delegate: { _session: session, _pageProxySession: session } }),
        },
        keyboard: {
          press: async () => {
            throw new Error('Unicode must not use US keyboard layout');
          },
        },
        evaluate: async () => structuredClone(events),
      };
      const input = createWave2NativeInput({
        page,
        context: { newCDPSession: async () => session },
        policy: { engine },
      });
      await input.invoke({}, 'press', { key: 'á' });
      assert.deepEqual(
        calls.map((c) => c.args.type),
        engine === 'firefox' ? ['keydown', 'keyup'] : ['keyDown', 'keyUp'],
      );
      assert.ok(
        calls.every(
          (c) =>
            c.method ===
            (engine === 'firefox' ? 'Page.dispatchKeyEvent' : 'Input.dispatchKeyEvent'),
        ),
      );
      assert.ok(
        calls.every(
          (c) =>
            c.args.key === 'á' &&
            c.args.code === 'KeyA' &&
            (c.args.keyCode ?? c.args.windowsVirtualKeyCode) === 65,
        ),
      );
      assert.equal(calls[0].args.text, 'á');
      assert.deepEqual(input.diagnostics()[0].events, events);
      await input.close();
      assert.equal(detached, engine === 'chromium');
    },
  );
}

test('native Unicode boundary preserves down and up failures, detaches and rejects unavailable or untrusted capabilities', async () => {
  const { createWave2NativeInput } = await import(moduleURL);
  for (const failure of ['down', 'up', 'both', 'untrusted', 'missing']) {
    const calls = [];
    let detached = false;
    const session = {
      send: async (_method, args) => {
        calls.push(args.type);
        if (
          (args.type === 'keyDown' && failure === 'down') ||
          (args.type === 'keyUp' && failure === 'up') ||
          failure === 'both'
        )
          throw new Error(args.type + ' failed');
      },
      detach: async () => {
        detached = true;
      },
    };
    const input = createWave2NativeInput({
      page: { evaluate: async () => [] },
      context: { newCDPSession: async () => (failure === 'missing' ? {} : session) },
      policy: { engine: 'chromium' },
    });
    await assert.rejects(input.invoke({}, 'press', { key: 'á' }), (error) => {
      if (failure === 'both')
        assert.match(String(error.errors?.map((e) => e.message)), /keyDown failed.*keyUp failed/);
      return true;
    });
    assert.ok(input.getError());
    if (failure !== 'missing') assert.deepEqual(calls, ['keyDown', 'keyUp']);
    if (failure === 'missing') await assert.rejects(input.close());
    else await input.close();
    assert.equal(detached, failure !== 'missing');
  }
});

test('hydration rejects altered execution bindings before serving or launching the browser', async () => {
  const { runWave2Cell } = await import(moduleURL);
  const { ANCHORED_SCENARIOS } = await import('../contracts/anchored.mjs');
  const scenario = ANCHORED_SCENARIOS.find((s) => s.scenarioId.includes('hydration-stability'));
  for (const mutate of [
    (r) => {
      r.cell.direction = 'rtl';
    },
    (r) => {
      r.scenario.operations.reverse();
    },
    (r) => {
      r.expected = {};
    },
  ]) {
    const f = fakeBrowser();
    await assert.rejects(
      runWave2Cell(
        {
          cellId: 'react-19',
          fixtures: new Map([['19.2.8', {}]]),
          playwright: f.playwright,
          scenario,
        },
        {
          ...f.dependencies,
          executeSsr: async ({ request }) => {
            const altered = structuredClone(request);
            mutate(altered);
            return {
              bootstrap: { html: '<button>Neutral</button>', requestJSON: canonicalJson(altered) },
            };
          },
        },
      ),
      (error) => error.scope === 'run' && /hydration bootstrap/.test(error.message),
    );
    assert.deepEqual(f.calls, []);
  }
});

test('browser transport awaits operations without bulk results and preserves exact final observation', async () => {
  const { runWave2Cell } = await import(moduleURL),
    f = fakeBrowser();
  const result = await runWave2Cell(
    {
      cellId: 'chromium',
      fixtures: new Map([['19.2.8', {}]]),
      playwright: f.playwright,
      scenario: scenario(),
    },
    f.dependencies,
  );
  assert.equal(f.wire.filter((entry) => entry.method === 'executeOperation').length, 8);
  assert.ok(
    f.wire
      .filter((entry) => entry.method === 'executeOperation')
      .every((entry) => entry.value === undefined),
  );
  const wire = f.wire.find((entry) => entry.method === 'cleanupFixture').value;
  assert.equal(typeof wire, 'string');
  assert.deepEqual(JSON.parse(wire), f.finalObservation());
  const observed = structuredClone(result[0].observation);
  delete observed.diagnostics.nativeInput;
  assert.deepEqual(observed, f.finalObservation());
  assert.ok(Object.is(observed.diagnostics.fixture.raw.negativeZero, -0));
  assert.equal(observed.diagnostics.cleanupObserved, true);
  assert.ok(!f.calls.includes('resume'));
});

for (const [name, transport] of [
  ['object', () => ({})],
  ['malformed', () => '{invalid'],
  ['invalid schema', () => JSON.stringify({ diagnostics: {} })],
  ['non-JSON values', () => '{"diagnostics":{"value":1e999}}'],
])
  test(
    'browser cleanup rejects ' + name + ' transport and still disposes all owned resources',
    async () => {
      const { runWave2Cell } = await import(moduleURL),
        f = fakeBrowser({ cleanupTransport: transport });
      await assert.rejects(
        runWave2Cell(
          {
            cellId: 'chromium',
            fixtures: new Map([['19.2.8', {}]]),
            playwright: f.playwright,
            scenario: scenario(),
          },
          f.dependencies,
        ),
        (error) => error.scope === 'run',
      );
      assert.deepEqual(f.calls.slice(-4), [
        'page.close',
        'context.close',
        'browser.close',
        'server.close',
      ]);
    },
  );

test('observation transport capability fails closed when negative zero cannot be preserved', async () => {
  const { assertWave2ObservationTransport } = await import(moduleURL);
  for (const rawJSON of [undefined, () => 0]) {
    assert.throws(
      () =>
        runInNewContext('(' + assertWave2ObservationTransport.toString() + ')()', {
          JSON: { stringify: JSON.stringify, parse: JSON.parse, rawJSON },
        }),
      /observation transport capability/,
    );
  }
  assert.doesNotThrow(() => assertWave2ObservationTransport());
});

for (const value of [undefined, NaN, Infinity, () => {}])
  test('browser transport rejects lossy JSON value ' + String(value), async () => {
    const { runWave2Cell } = await import(moduleURL),
      f = fakeBrowser({
        observeTransform: (observation) => ({
          ...observation,
          diagnostics: { ...observation.diagnostics, invalid: value },
        }),
      });
    await assert.rejects(
      runWave2Cell(
        {
          cellId: 'chromium',
          fixtures: new Map([['19.2.8', {}]]),
          playwright: f.playwright,
          scenario: scenario(),
        },
        f.dependencies,
      ),
      (error) => error.scope === 'run',
    );
    assert.deepEqual(f.calls.slice(-4), [
      'page.close',
      'context.close',
      'browser.close',
      'server.close',
    ]);
  });

for (const elapsed of [4999, 5000, 5100])
  test(
    'cleanup monotonic deadline accounts for synchronous parse and validation at ' + elapsed + 'ms',
    async (t) => {
      const { runWave2Cell } = await import(moduleURL);
      let now = 100,
        cleanupWire;
      const f = fakeBrowser({
        cleanupTransport: (wire) => {
          cleanupWire = wire;
          return wire;
        },
      });
      const parse = JSON.parse;
      t.mock.method(JSON, 'parse', (wire, ...args) => {
        const parsed = parse(wire, ...args);
        if (wire === cleanupWire) now += elapsed;
        return parsed;
      });
      const task = runWave2Cell(
        {
          cellId: 'chromium',
          fixtures: new Map([['19.2.8', {}]]),
          playwright: f.playwright,
          scenario: scenario(),
        },
        {
          ...f.dependencies,
          monotonicNow: () => now,
        },
      );
      if (elapsed < 5000)
        assert.equal((await task)[0].observation.diagnostics.cleanupObserved, true);
      else
        await assert.rejects(
          task,
          (error) => error.scope === 'run' && /cleanup.*timed out/.test(error.errors?.[0]?.message),
        );
      assert.deepEqual(f.calls.slice(-4), [
        'page.close',
        'context.close',
        'browser.close',
        'server.close',
      ]);
      assert.ok(!f.calls.includes('resume'));
    },
  );

test('synchronous cleanup overrun preserves the primary operation error before cleanup error', async () => {
  const { runWave2Cell } = await import(moduleURL),
    f = fakeBrowser({ failOperation: 'hover' });
  let reads = 0;
  await assert.rejects(
    runWave2Cell(
      {
        cellId: 'chromium',
        fixtures: new Map([['19.2.8', {}]]),
        playwright: f.playwright,
        scenario: scenario(),
      },
      { ...f.dependencies, monotonicNow: () => (reads++ === 0 ? 0 : 5100) },
    ),
    (error) => {
      assert.equal(error.errors?.length, 2);
      assert.equal(error.errors[0].message, 'operation failed');
      assert.match(error.errors[1].message, /fixture cleanup timed out/);
      return error.scope === 'run';
    },
  );
  assert.deepEqual(f.calls.slice(-4), [
    'page.close',
    'context.close',
    'browser.close',
    'server.close',
  ]);
});

test('asynchronous cleanup still times out and disposes resources while its promise is pending', async (t) => {
  const { runWave2Cell } = await import(moduleURL);
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let enter, finish;
  const entered = new Promise((resolve) => {
    enter = resolve;
  });
  const f = fakeBrowser({
    cleanupTransport: (wire) => {
      enter();
      return new Promise((resolve) => {
        finish = () => resolve(wire);
      });
    },
  });
  const task = runWave2Cell(
    {
      cellId: 'chromium',
      fixtures: new Map([['19.2.8', {}]]),
      playwright: f.playwright,
      scenario: scenario(),
    },
    { ...f.dependencies, monotonicNow: () => 0 },
  );
  const rejected = assert.rejects(
    task,
    (error) =>
      error.scope === 'run' && /fixture cleanup timed out/.test(error.errors?.[0]?.message),
  );
  await entered;
  t.mock.timers.tick(5000);
  await rejected;
  finish();
  assert.deepEqual(f.calls.slice(-4), [
    'page.close',
    'context.close',
    'browser.close',
    'server.close',
  ]);
  assert.ok(!f.calls.includes('resume'));
});
