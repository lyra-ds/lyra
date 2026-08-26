import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { readEvidenceArchive } from './archive.mjs';
import * as automation from './automation.mjs';

const {
  ARTIFACT_FILE_NAMES,
  DF_FU_17_CHECKS,
  REQUIRED_ENGINES,
  automationExitCode,
  artifactPathsFor,
  deriveDfFu17Checks,
  deriveAutomationResult,
  parseAutomationArgs,
  resolveRequestedScenarios,
  runAutomation,
} = automation;

const { afterEach, describe, it } = process.env.VITEST
  ? await import('vitest')
  : await import('node:test');

const REVISION = '1234567890abcdef1234567890abcdef12345678';
const DEPLOYMENT_URL = 'https://a1b2c3d4.lyra-ds-docs.pages.dev/en/file-upload-evidence/';
const EXECUTED_AT = '2026-08-26T12:00:00.000Z';
const temporaryRoots = [];
const EXPECTED_DF_FU_18_CHECKS = [
  'DF-FU-18-native-js-disabled-form-submitted',
  'DF-FU-18-response-locale-metadata-revision',
  'DF-FU-18-delayed-alpine-filelist-preserved',
  'DF-FU-18-single-enhancement-no-replay',
  'DF-FU-18-removal-focus-recovered',
  'DF-FU-18-reconnect-teardown-clean',
];

function passingChecks() {
  return Object.fromEntries(DF_FU_17_CHECKS.map((check) => [check, true]));
}

function resultRun(engine, overrides = {}) {
  return {
    engine,
    viewport: { width: 320, height: 720, devicePixelRatio: 2 },
    mediaQueries:
      engine === 'chromium'
        ? { '(pointer: coarse)': true, '(any-pointer: coarse)': true }
        : { '(pointer: coarse)': false, '(any-pointer: coarse)': false },
    checks: passingChecks(),
    artifactPaths: artifactPathsFor('DF-FU-17', engine),
    ...overrides,
  };
}

function completeRuns() {
  return REQUIRED_ENGINES.map((engine) => resultRun(engine));
}

function allArtifactPaths(runs) {
  return new Set(runs.flatMap(({ artifactPaths }) => artifactPaths));
}

function passingObservations(engine = 'chromium') {
  return {
    overflow: {
      documentClientWidth: 320,
      documentScrollWidth: 320,
      componentClientWidth: 304,
      componentScrollWidth: 304,
    },
    identity: {
      initialNameVisible: true,
      retainedNameVisible: true,
      retainedActionName: `Cancel ${'résumé-非常に長い-arquivo-de-evidência-com-identidade-preservada-em-refluxo-320px.pdf'}`,
      replacementNameVisible: false,
      replacementActionVisible: false,
    },
    reachability: { cancel: true, retry: true, remove: true },
    replacementAnnouncement: 'File replacement is unavailable while an upload is active.',
    lifecycle: {
      cancelAction: 'Retry',
      cancelAnnouncement:
        'résumé-非常に長い-arquivo-de-evidência-com-identidade-preservada-em-refluxo-320px.pdf canceled.',
      errorAction: 'Retry',
      errorAnnouncement:
        'résumé-非常に長い-arquivo-de-evidência-com-identidade-preservada-em-refluxo-320px.pdf: The upload request is invalid.',
      completionAction: 'Remove',
      completionAnnouncement:
        'résumé-非常に長い-arquivo-de-evidência-com-identidade-preservada-em-refluxo-320px.pdf uploaded.',
      removedNameVisible: false,
      removedActionVisible: false,
      removalAnnouncement:
        'résumé-非常に長い-arquivo-de-evidência-com-identidade-preservada-em-refluxo-320px.pdf removed.',
    },
    focusRecovered: true,
    keyboardTransitions: {
      cancel: 'canceled',
      errorRetry: 'error',
      successRetry: 'success',
      remove: 'removed',
    },
    touchTransitions:
      engine === 'chromium'
        ? { cancel: 'canceled', successRetry: 'success', remove: 'removed' }
        : {
            cancel: 'not-required',
            successRetry: 'not-required',
            remove: 'not-required',
          },
  };
}

function passingDfFu18Observations() {
  return {
    native: {
      submitted: true,
      responseOk: true,
      responseLocale: 'en',
      responseFileName: 'native-no-javascript.bin',
      responseMediaType: 'application/octet-stream',
      responseByteLength: '65536',
      responseRevision: REVISION,
      headerRevision: REVISION,
      payloadMarkerExposed: false,
    },
    delayed: {
      beforeInitialization: {
        name: 'selected-before-alpine.pdf',
        size: 23,
        type: 'application/pdf',
      },
      afterInitialization: {
        name: 'selected-before-alpine.pdf',
        size: 23,
        type: 'application/pdf',
      },
      initializationsAfterInitialization: 1,
      selectionIntentsBeforeEnhancedSelection: 0,
      controlledEchoesBeforeEnhancedSelection: 0,
      connectsAfterInitialization: 1,
      disconnectsAfterInitialization: 0,
      controlTreesAfterInitialization: 1,
      liveMessageAfterInitialization: '',
      selectionIntentsAfterEnhancedSelection: 1,
      controlledEchoesAfterEnhancedSelection: 1,
      renderedItemsAfterEnhancedSelection: 1,
      removalFocusedInput: true,
      renderedItemsAfterRemoval: 0,
      initializationsAfterReconnect: 2,
      connectsAfterReconnect: 2,
      disconnectsAfterReconnect: 1,
      liveMessageAfterReconnect: '',
      selectionIntentsBeforeReconnectSelection: 1,
      selectionIntentsAfterReconnectSelection: 2,
      controlledEchoesBeforeReconnectSelection: 1,
      controlledEchoesAfterReconnectSelection: 2,
      renderedItemsAfterReconnectSelection: 1,
      liveMessageAfterReconnectSelection: 'selected-after-reconnect.pdf selected.',
      connectsAfterTeardown: 2,
      disconnectsAfterTeardown: 2,
      selectionIntentsAfterTeardownEvent: 2,
      controlledEchoesAfterTeardownEvent: 2,
      renderedItemsAfterTeardownEvent: 0,
      liveMessageAfterTeardownEvent: '',
    },
  };
}

class FakeLocator {
  constructor(page, kind, name) {
    this.page = page;
    this.kind = kind;
    this.name = name;
    this.scrolledIntoView = false;
  }

  async boundingBox() {
    return { x: 8, y: this.scrolledIntoView ? 100 : 1000, width: 296, height: 40 };
  }

  async check() {
    this.page.mode = this.name;
  }

  async evaluate() {
    if (this.kind === 'input') return this.page.focused === 'input';
    return true;
  }

  async focus() {
    this.page.focused = this.name;
  }

  async isVisible() {
    if (this.kind === 'text') return this.page.fileName === this.name && this.page.state !== 'idle';
    if (this.kind === 'button') return this.page.actionNames().includes(this.name);
    return true;
  }

  async press(key) {
    assert.match(key, /^(Enter|Space)$/u);
    this.page.keyboardActivations += 1;
    this.page.activate(this.name);
  }

  async setInputFiles(file) {
    if (this.page.state === 'uploading') {
      this.page.liveText = 'File replacement is unavailable while an upload is active.';
      return;
    }
    this.page.fileName = file.name;
    this.page.state = 'uploading';
    this.page.liveText = `${file.name} selected.`;
  }

  async scrollIntoViewIfNeeded() {
    this.scrolledIntoView = true;
  }

  async tap() {
    this.page.touchActivations += 1;
    this.page.touchLabels.push(this.name);
    if (this.kind === 'radio') this.page.mode = this.name;
    else this.page.activate(this.name);
  }

  async textContent() {
    return this.page.liveText;
  }

  async waitFor({ state = 'visible' } = {}) {
    if (this.kind === 'input' && state !== 'attached') {
      throw new Error('The visually hidden native input must be awaited as attached.');
    }
    const visible = await this.isVisible();
    if ((state === 'visible' && !visible) || (state === 'hidden' && visible)) {
      throw new Error(`${this.name ?? this.kind} did not reach ${state}`);
    }
  }
}

class FakePage {
  constructor(engine, videoPath, laneFailure, missingArtifacts, chromiumCoarsePointer, overflow) {
    this.engine = engine;
    this.videoPath = videoPath;
    this.laneFailure = laneFailure;
    this.missingArtifacts = missingArtifacts;
    this.chromiumCoarsePointer = chromiumCoarsePointer;
    this.overflow = overflow;
    this.fileName = '';
    this.focused = null;
    this.liveText = '';
    this.mode = 'Success';
    this.state = 'idle';
    this.keyboardActivations = 0;
    this.touchActivations = 0;
    this.touchLabels = [];
  }

  actionNames() {
    if (this.state === 'uploading') return [`Cancel ${this.fileName}`];
    if (this.state === 'canceled' || this.state === 'error') {
      return [`Retry ${this.fileName}`, `Remove ${this.fileName}`];
    }
    if (this.state === 'success') return [`Remove ${this.fileName}`];
    return [];
  }

  activate(name) {
    if (name === 'Delayed response' || name === 'Retryable error' || name === 'Success') {
      this.mode = name;
      return;
    }
    if (name === `Cancel ${this.fileName}`) {
      this.state = 'canceled';
      this.liveText = `${this.fileName} canceled.`;
      return;
    }
    if (name === `Retry ${this.fileName}`) {
      this.state = this.mode === 'Retryable error' ? 'error' : 'success';
      this.liveText =
        this.state === 'error'
          ? `${this.fileName}: The upload request is invalid.`
          : `${this.fileName} uploaded.`;
      return;
    }
    if (name === `Remove ${this.fileName}`) {
      this.state = 'idle';
      this.focused = 'input';
      this.liveText = `${this.fileName} removed.`;
    }
  }

  async evaluate() {
    if (this.laneFailure) throw new Error(`forced ${this.engine} interaction failure`);
    return {
      documentClientWidth: 320,
      documentScrollWidth: this.overflow ? 321 : 320,
      componentClientWidth: 304,
      componentScrollWidth: 304,
      mediaQueries:
        this.engine === 'chromium'
          ? {
              '(pointer: coarse)': this.chromiumCoarsePointer,
              '(any-pointer: coarse)': this.chromiumCoarsePointer,
            }
          : { '(pointer: coarse)': false, '(any-pointer: coarse)': false },
      viewport: { width: 320, height: 720, devicePixelRatio: 2 },
    };
  }

  getByRole(role, { name }) {
    return new FakeLocator(this, role === 'radio' ? 'radio' : 'button', name);
  }

  getByText(name) {
    return new FakeLocator(this, 'text', name);
  }

  locator(selector) {
    if (selector === '[data-evidence-id="react-file-input"]') {
      return new FakeLocator(this, 'input');
    }
    if (selector === '[data-evidence-id="react-live-region"]') {
      return new FakeLocator(this, 'live');
    }
    return new FakeLocator(this, selector);
  }

  async goto(url) {
    assert.equal(url, DEPLOYMENT_URL);
  }

  async screenshot({ path }) {
    if (this.missingArtifacts.has('final.png')) return;
    await writeFile(path, Buffer.from('fake-png'));
  }

  video() {
    return { path: async () => this.videoPath };
  }
}

class FakeDfFu18Locator {
  constructor(page, selector, name) {
    this.page = page;
    this.selector = selector;
    this.name = name;
  }

  async click() {
    if (this.page.kind === 'no-js') {
      assert.equal(this.selector, '#native-upload-form button[type="submit"]');
      this.page.nativeSubmitted = true;
      return;
    }
    assert.equal(this.name, 'Remove enhanced-after-alpine.pdf');
    this.page.renderedItems = 0;
    this.page.focused = '#alpine-file';
    this.page.liveText = 'enhanced-after-alpine.pdf removed.';
  }

  async count() {
    if (this.selector === '#alpine-file-upload') return 1;
    if (this.selector === '.lyra-upload__item') return this.page.renderedItems;
    return 1;
  }

  async dispatchEvent(eventName) {
    assert.equal(eventName, 'change');
    if (this.page.connected) this.page.recordSelection();
  }

  async evaluate(callback) {
    if (this.selector === '#alpine-file') {
      if (callback.toString().includes('activeElement'))
        return this.page.focused === '#alpine-file';
      return this.page.selectedFile === null
        ? null
        : {
            name: this.page.selectedFile.name,
            size: this.page.selectedFile.buffer.byteLength,
            type: this.page.selectedFile.mimeType,
          };
    }
    if (this.selector === '#alpine-evidence-root') {
      const source = callback.toString();
      if (source.includes('reconnectAlpineFixture')) this.page.reconnect();
      else if (source.includes('teardownAlpineFixture')) this.page.teardown();
      else throw new Error('Expected the private reconnect or teardown boundary.');
      return;
    }
    return true;
  }

  async getAttribute(attribute) {
    assert.equal(this.selector, 'html');
    assert.equal(attribute, 'lang');
    return 'en';
  }

  async setInputFiles(file) {
    this.page.selectedFile = file;
    if (this.page.kind === 'no-js') {
      assert.equal(file.name, 'native-no-javascript.bin');
      assert.equal(file.mimeType, 'application/octet-stream');
      assert.equal(file.buffer.byteLength, 65_536);
      return;
    }
    if (this.page.initializations > 0 && this.page.connected) this.page.recordSelection();
  }

  async textContent() {
    const counters = {
      '#alpine-initializations': this.page.initializations,
      '#alpine-selection-intents': this.page.selectionIntents,
      '#alpine-controlled-echoes': this.page.controlledEchoes,
      '#alpine-connects': this.page.connects,
      '#alpine-disconnects': this.page.disconnects,
    };
    if (this.selector in counters) return String(counters[this.selector]);
    if (this.selector === '.lyra-upload__live') return this.page.liveText;
    return '';
  }

  async waitFor() {}
}

class FakeDfFu18Page {
  constructor(
    kind,
    videoPath,
    missingArtifacts,
    {
      observedViewport = { width: 1280, height: 720, devicePixelRatio: 1 },
      duplicateReconnectSelection = false,
    } = {},
  ) {
    this.kind = kind;
    this.videoPath = videoPath;
    this.missingArtifacts = missingArtifacts;
    this.nativeSubmitted = false;
    this.selectedFile = null;
    this.initializations = 0;
    this.selectionIntents = 0;
    this.controlledEchoes = 0;
    this.connects = 0;
    this.disconnects = 0;
    this.renderedItems = 0;
    this.liveText = '';
    this.connected = false;
    this.focused = null;
    this.observedViewport = observedViewport;
    this.duplicateReconnectSelection = duplicateReconnectSelection;
    this.reconnected = false;
  }

  async content() {
    assert.equal(this.kind, 'no-js');
    assert.equal(this.nativeSubmitted, true);
    return `<!doctype html><html lang="en"><body><dl>
      <dt>File name</dt><dd>native-no-javascript.bin</dd>
      <dt>Media type</dt><dd>application/octet-stream</dd>
      <dt>Byte length</dt><dd>65536</dd>
      <dt>Revision</dt><dd>${REVISION}</dd>
    </dl></body></html>`;
  }

  async evaluate() {
    return {
      mediaQueries: {
        '(pointer: coarse)': false,
        '(prefers-reduced-motion: reduce)': false,
      },
      viewport: this.observedViewport,
    };
  }

  getByRole(role, { name }) {
    assert.equal(role, 'button');
    return new FakeDfFu18Locator(this, 'button', name);
  }

  async goto(url) {
    if (this.kind === 'no-js') assert.equal(url, DEPLOYMENT_URL);
    else assert.equal(url, `${DEPLOYMENT_URL}?alpineDelay=15000`);
  }

  initialize() {
    this.initializations = 1;
    this.connects = 1;
    this.connected = true;
  }

  locator(selector) {
    return new FakeDfFu18Locator(this, selector);
  }

  reconnect() {
    this.disconnects += 1;
    this.initializations += 1;
    this.connects += 1;
    this.connected = true;
    this.reconnected = true;
    this.renderedItems = 0;
    this.liveText = '';
  }

  recordSelection() {
    const increment = this.duplicateReconnectSelection && this.reconnected ? 2 : 1;
    this.selectionIntents += increment;
    this.controlledEchoes += increment;
    this.renderedItems += increment;
    this.liveText = `${this.selectedFile.name} selected.`;
  }

  async screenshot({ path }) {
    if (this.missingArtifacts.has('final.png')) return;
    await writeFile(path, Buffer.from('fake-df-fu-18-png'));
  }

  teardown() {
    this.disconnects += 1;
    this.connected = false;
    this.renderedItems = 0;
    this.liveText = '';
  }

  video() {
    return { path: async () => this.videoPath };
  }

  async waitForFunction() {
    assert.equal(this.kind, 'delayed');
    if (this.initializations === 0) this.initialize();
  }

  async waitForNavigation() {
    assert.equal(this.kind, 'no-js');
    return {
      ok: () => true,
      headers: () => ({ 'x-lyra-evidence-revision': REVISION }),
    };
  }
}

function fakeDfFu18Browser(
  state,
  {
    launchFailure = false,
    missingArtifacts = [],
    observedViewport,
    duplicateReconnectSelection = false,
  } = {},
) {
  if (launchFailure) throw new Error('forced DF-FU-18 chromium launch failure');
  const absent = new Set(missingArtifacts);
  const browser = {
    closed: false,
    async close() {
      this.closed = true;
    },
    async newContext(options) {
      const kind = options.javaScriptEnabled === false ? 'no-js' : 'delayed';
      if (kind === 'no-js') {
        assert.equal(options.recordVideo, undefined);
      } else {
        assert.deepEqual(options.viewport, { width: 1280, height: 720 });
        assert.equal(options.deviceScaleFactor, 1);
      }
      const videoPath =
        kind === 'delayed' ? join(options.recordVideo.dir, 'df-fu-18-chromium.webm') : undefined;
      if (kind === 'delayed') {
        await mkdir(options.recordVideo.dir, { recursive: true });
        if (!absent.has('run.webm')) await writeFile(videoPath, Buffer.from('fake-df-fu-18-video'));
      }
      const page = new FakeDfFu18Page(kind, videoPath, absent, {
        observedViewport,
        duplicateReconnectSelection,
      });
      const context = {
        closed: false,
        tracing: {
          async start(settings) {
            assert.equal(kind, 'delayed');
            assert.deepEqual(settings, { screenshots: true, snapshots: true, sources: true });
          },
          async stop({ path }) {
            assert.equal(kind, 'delayed');
            if (!absent.has('trace.zip')) {
              await writeFile(path, Buffer.from('fake-df-fu-18-trace'));
            }
          },
        },
        async close() {
          this.closed = true;
        },
        async newPage() {
          state.dfFu18Pages.push(page);
          return page;
        },
      };
      state.contexts.push(context);
      state.dfFu18Contexts.push({ kind, options, context });
      return context;
    },
  };
  state.browsers.push(browser);
  return browser;
}

function fakePlaywright({
  failingEngine,
  launchFailingEngine,
  missingArtifactsByEngine = {},
  chromiumCoarsePointer = true,
  overflowEngine,
  includeDfFu18 = false,
  dfFu18Only = false,
  dfFu18LaunchFailure = false,
  dfFu18MissingArtifacts = [],
  dfFu18ObservedViewport,
  dfFu18DuplicateReconnectSelection = false,
} = {}) {
  const state = {
    launchAttempts: [],
    browsers: [],
    contexts: [],
    cdpSessions: [],
    pages: [],
    dfFu18Contexts: [],
    dfFu18Pages: [],
  };
  const api = {};
  for (const engine of REQUIRED_ENGINES) {
    api[engine] = {
      async launch() {
        state.launchAttempts.push(engine);
        const chromiumAttempts = state.launchAttempts.filter(
          (attemptedEngine) => attemptedEngine === 'chromium',
        ).length;
        if (engine === 'chromium' && (dfFu18Only || (includeDfFu18 && chromiumAttempts === 2))) {
          return fakeDfFu18Browser(state, {
            launchFailure: dfFu18LaunchFailure,
            missingArtifacts: dfFu18MissingArtifacts,
            observedViewport: dfFu18ObservedViewport,
            duplicateReconnectSelection: dfFu18DuplicateReconnectSelection,
          });
        }
        if (launchFailingEngine === engine) throw new Error(`forced ${engine} launch failure`);
        const missingArtifacts = new Set(missingArtifactsByEngine[engine] ?? []);
        const browser = {
          closed: false,
          async close() {
            this.closed = true;
          },
          async newContext(options) {
            assert.deepEqual(options.viewport, { width: 320, height: 720 });
            assert.equal(options.deviceScaleFactor, 2);
            assert.equal(options.hasTouch, engine === 'chromium' ? true : undefined);
            const videoPath = join(options.recordVideo.dir, `${engine}.webm`);
            await mkdir(options.recordVideo.dir, { recursive: true });
            if (!missingArtifacts.has('run.webm')) {
              await writeFile(videoPath, Buffer.from(`fake-${engine}-video`));
            }
            const context = {
              closed: false,
              tracing: {
                async start(settings) {
                  assert.deepEqual(settings, { screenshots: true, snapshots: true, sources: true });
                },
                async stop({ path }) {
                  if (missingArtifacts.has('trace.zip')) return;
                  await writeFile(path, Buffer.from(`fake-${engine}-trace`));
                },
              },
              async close() {
                this.closed = true;
              },
              async newCDPSession() {
                assert.equal(engine, 'chromium');
                const session = {
                  detached: false,
                  async detach() {
                    this.detached = true;
                  },
                  async send(method, parameters) {
                    assert.equal(method, 'Emulation.setEmulatedMedia');
                    assert.deepEqual(parameters.features, [
                      { name: 'pointer', value: 'coarse' },
                      { name: 'any-pointer', value: 'coarse' },
                    ]);
                  },
                };
                state.cdpSessions.push(session);
                return session;
              },
              async newPage() {
                const page = new FakePage(
                  engine,
                  videoPath,
                  failingEngine === engine,
                  missingArtifacts,
                  chromiumCoarsePointer,
                  overflowEngine === engine,
                );
                state.pages.push(page);
                return page;
              },
            };
            state.contexts.push(context);
            return context;
          },
        };
        state.browsers.push(browser);
        return browser;
      },
    };
  }
  return { api, state };
}

async function outputFixture() {
  const root = await mkdtemp(join(tmpdir(), 'lyra-automation-test-'));
  temporaryRoots.push(root);
  return { output: join(root, 'evidence.zip'), root };
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true })));
});

describe('automation runner policy', () => {
  it('parses only an immutable English route, exact revision, absolute ZIP, and focused scenario', () => {
    const output = join(tmpdir(), 'evidence.zip');
    assert.deepEqual(
      parseAutomationArgs([
        `--url=${DEPLOYMENT_URL}`,
        `--revision=${REVISION}`,
        `--output=${output}`,
        '--scenario=DF-FU-17',
      ]),
      { url: DEPLOYMENT_URL, revision: REVISION, output, scenario: 'DF-FU-17' },
    );
    assert.deepEqual(
      parseAutomationArgs([
        `--url=${DEPLOYMENT_URL}`,
        `--revision=${REVISION}`,
        `--output=${output}`,
        '--scenario=DF-FU-18',
      ]),
      { url: DEPLOYMENT_URL, revision: REVISION, output, scenario: 'DF-FU-18' },
    );

    for (const args of [
      [
        `--url=${DEPLOYMENT_URL.replace('a1b2c3d4', 'latest')}`,
        `--revision=${REVISION}`,
        `--output=${output}`,
      ],
      [`--url=${DEPLOYMENT_URL}`, '--revision=main', `--output=${output}`],
      [`--url=${DEPLOYMENT_URL}`, `--revision=${REVISION}`, '--output=relative.zip'],
      [`--url=${DEPLOYMENT_URL}`, `--revision=${REVISION}`, `--output=${output}`, '--unknown=yes'],
    ]) {
      assert.throws(() => parseAutomationArgs(args), /automation arguments/u);
    }
  });

  it('requests both automated scenarios normally and permits either focused scenario', () => {
    assert.deepEqual(automation.DF_FU_18_CHECKS, EXPECTED_DF_FU_18_CHECKS);
    assert.deepEqual(resolveRequestedScenarios('DF-FU-17'), ['DF-FU-17']);
    assert.deepEqual(resolveRequestedScenarios('DF-FU-18'), ['DF-FU-18']);
    assert.deepEqual(resolveRequestedScenarios(undefined), ['DF-FU-17', 'DF-FU-18']);
  });

  it('normalizes the exact four artifact paths for every required engine', () => {
    assert.deepEqual(REQUIRED_ENGINES, ['chromium', 'firefox', 'webkit']);
    assert.deepEqual(ARTIFACT_FILE_NAMES, ['final.png', 'run.webm', 'trace.zip', 'events.json']);
    assert.deepEqual(artifactPathsFor('DF-FU-17', 'webkit'), [
      'artifacts/DF-FU-17/webkit/final.png',
      'artifacts/DF-FU-17/webkit/run.webm',
      'artifacts/DF-FU-17/webkit/trace.zip',
      'artifacts/DF-FU-17/webkit/events.json',
    ]);
    assert.deepEqual(artifactPathsFor('DF-FU-18', 'chromium'), [
      'artifacts/DF-FU-18/chromium/final.png',
      'artifacts/DF-FU-18/chromium/run.webm',
      'artifacts/DF-FU-18/chromium/trace.zip',
      'artifacts/DF-FU-18/chromium/events.json',
    ]);
    assert.throws(() => artifactPathsFor('DF-FU-18', 'firefox'), /engine/u);
    assert.throws(() => artifactPathsFor('DF-FU-17', '../webkit'), /engine/u);
  });

  it('derives PASS only from the complete matrix, exact true checks, and present artifacts', () => {
    const passing = completeRuns();
    assert.equal(deriveAutomationResult(passing, allArtifactPaths(passing)), 'PASS');

    const absentLane = passing.slice(0, -1);
    assert.equal(deriveAutomationResult(absentLane, allArtifactPaths(absentLane)), 'FAIL');

    const missingCheck = completeRuns();
    delete missingCheck[0].checks[DF_FU_17_CHECKS[0]];
    assert.equal(deriveAutomationResult(missingCheck, allArtifactPaths(missingCheck)), 'FAIL');

    const falseCheck = completeRuns();
    falseCheck[1].checks[DF_FU_17_CHECKS[1]] = false;
    assert.equal(deriveAutomationResult(falseCheck, allArtifactPaths(falseCheck)), 'FAIL');

    const unobservedMedia = completeRuns();
    unobservedMedia[1].mediaQueries['(pointer: coarse)'] = null;
    assert.equal(
      deriveAutomationResult(unobservedMedia, allArtifactPaths(unobservedMedia)),
      'FAIL',
    );

    for (const fileName of ARTIFACT_FILE_NAMES) {
      const runs = completeRuns();
      const artifacts = allArtifactPaths(runs);
      artifacts.delete(`artifacts/DF-FU-17/chromium/${fileName}`);
      assert.equal(deriveAutomationResult(runs, artifacts), 'FAIL');
    }
  });

  it('derives every DF-FU-17 check from independently falsifiable observations', () => {
    const expectedChecks = passingChecks();
    assert.deepEqual(deriveDfFu17Checks(passingObservations()), expectedChecks);

    const mutations = [
      ['DF-FU-17-no-horizontal-overflow', (value) => (value.overflow.documentScrollWidth = 321)],
      [
        'DF-FU-17-long-file-identity-retained',
        (value) => (value.identity.retainedNameVisible = false),
      ],
      ['DF-FU-17-actions-reachable-at-reflow', (value) => (value.reachability.retry = false)],
      [
        'DF-FU-17-active-replacement-rejected-and-announced',
        (value) => (value.identity.replacementNameVisible = true),
      ],
      [
        'DF-FU-17-cancel-retry-complete-remove',
        (value) => (value.lifecycle.errorAction = 'Remove'),
      ],
      ['DF-FU-17-focus-recovered', (value) => (value.focusRecovered = false)],
      [
        'DF-FU-17-keyboard-activation-equivalent',
        (value) => (value.keyboardTransitions.successRetry = 'error'),
      ],
      [
        'DF-FU-17-keyboard-activation-equivalent',
        (value) => (value.touchTransitions.cancel = 'uploading'),
      ],
    ];

    for (const [check, mutate] of mutations) {
      const observations = structuredClone(passingObservations());
      mutate(observations);
      assert.equal(deriveDfFu17Checks(observations)[check], false, check);
    }
  });

  it('derives every exact DF-FU-18 check from independent native and lifecycle observations', () => {
    const expectedChecks = Object.fromEntries(
      EXPECTED_DF_FU_18_CHECKS.map((check) => [check, true]),
    );
    assert.deepEqual(
      automation.deriveDfFu18Checks(passingDfFu18Observations(), REVISION),
      expectedChecks,
    );

    const mutations = [
      ['DF-FU-18-native-js-disabled-form-submitted', (value) => (value.native.submitted = false)],
      [
        'DF-FU-18-response-locale-metadata-revision',
        (value) => (value.native.responseRevision = 'f'.repeat(40)),
      ],
      [
        'DF-FU-18-delayed-alpine-filelist-preserved',
        (value) => (value.delayed.afterInitialization.size = 0),
      ],
      [
        'DF-FU-18-single-enhancement-no-replay',
        (value) => (value.delayed.selectionIntentsBeforeEnhancedSelection = 1),
      ],
      [
        'DF-FU-18-single-enhancement-no-replay',
        (value) => (value.delayed.renderedItemsAfterEnhancedSelection = 2),
      ],
      ['DF-FU-18-removal-focus-recovered', (value) => (value.delayed.removalFocusedInput = false)],
      [
        'DF-FU-18-reconnect-teardown-clean',
        (value) => (value.delayed.selectionIntentsAfterReconnectSelection = 3),
      ],
      [
        'DF-FU-18-reconnect-teardown-clean',
        (value) => (value.delayed.selectionIntentsAfterTeardownEvent = 3),
      ],
      [
        'DF-FU-18-reconnect-teardown-clean',
        (value) => (value.delayed.liveMessageAfterReconnect = 'replayed'),
      ],
    ];

    for (const [check, mutate] of mutations) {
      const observations = structuredClone(passingDfFu18Observations());
      mutate(observations);
      assert.equal(automation.deriveDfFu18Checks(observations, REVISION)[check], false, check);
    }
  });

  it('maps every failed automation result to a nonzero process exit', () => {
    assert.equal(automationExitCode({ result: 'PASS' }), 0);
    assert.equal(automationExitCode({ result: 'FAIL' }), 1);
  });
});

describe('runAutomation', () => {
  it('runs both scenarios normally and packages the complete validated DF-FU-18 Chromium evidence', async () => {
    const { output } = await outputFixture();
    const { api, state } = fakePlaywright({ includeDfFu18: true });
    const outcome = await runAutomation(
      {
        url: DEPLOYMENT_URL,
        revision: REVISION,
        output,
        now: () => new Date(EXECUTED_AT),
      },
      api,
    );

    assert.deepEqual(
      outcome.results.map(({ scenario, result }) => [scenario, result]),
      [
        ['DF-FU-17', 'PASS'],
        ['DF-FU-18', 'PASS'],
      ],
    );
    assert.deepEqual(state.launchAttempts, ['chromium', 'firefox', 'webkit', 'chromium']);
    assert.deepEqual(
      state.dfFu18Contexts.map(({ kind, options }) => [kind, options.javaScriptEnabled]),
      [
        ['no-js', false],
        ['delayed', undefined],
      ],
    );
    assert.deepEqual(
      state.contexts.map(({ closed }) => closed),
      [true, true, true, true, true],
    );
    assert.deepEqual(
      state.browsers.map(({ closed }) => closed),
      [true, true, true, true],
    );

    const archive = await readEvidenceArchive(output, {
      expectedKind: 'automation',
      expectedRevision: REVISION,
      expectedDeploymentUrl: DEPLOYMENT_URL,
    });
    assert.equal(archive.entries.has('automation/DF-FU-17.json'), true);
    assert.equal(archive.entries.has('automation/DF-FU-18.json'), true);
    for (const path of artifactPathsFor('DF-FU-18', 'chromium')) {
      assert.equal(archive.entries.has(path), true, path);
    }
    const stored = JSON.parse(
      Buffer.from(archive.entries.get('automation/DF-FU-18.json')).toString(),
    );
    assert.equal(stored.result, 'PASS');
    assert.deepEqual(stored.runs[0].checks, {
      'DF-FU-18-native-js-disabled-form-submitted': true,
      'DF-FU-18-response-locale-metadata-revision': true,
      'DF-FU-18-delayed-alpine-filelist-preserved': true,
      'DF-FU-18-single-enhancement-no-replay': true,
      'DF-FU-18-removal-focus-recovered': true,
      'DF-FU-18-reconnect-teardown-clean': true,
    });
    const events = JSON.parse(
      Buffer.from(archive.entries.get('artifacts/DF-FU-18/chromium/events.json')).toString(),
    );
    assert.deepEqual(events.failedChecks, []);
    assert.deepEqual(events.missingArtifacts, []);
    assert.equal(events.observations.delayed.connectsAfterTeardown, 2);
    assert.equal(events.observations.delayed.disconnectsAfterTeardown, 2);
  });

  it('packages valid DF-FU-18 evidence when the observed viewport differs from the requested context', async () => {
    const { output } = await outputFixture();
    const observedViewport = { width: 1279, height: 719, devicePixelRatio: 2 };
    const { api } = fakePlaywright({
      dfFu18Only: true,
      dfFu18ObservedViewport: observedViewport,
    });
    const outcome = await runAutomation(
      {
        url: DEPLOYMENT_URL,
        revision: REVISION,
        output,
        scenario: 'DF-FU-18',
        now: () => new Date(EXECUTED_AT),
      },
      api,
    );

    assert.equal(outcome.result.result, 'PASS');
    assert.equal(automationExitCode(outcome.results), 0);
    assert.equal(outcome.archiveValidated, true);
    const archive = await readEvidenceArchive(output, {
      expectedKind: 'automation',
      expectedRevision: REVISION,
      expectedDeploymentUrl: DEPLOYMENT_URL,
    });
    const stored = JSON.parse(
      Buffer.from(archive.entries.get('automation/DF-FU-18.json')).toString(),
    );
    assert.deepEqual(stored.runs[0].viewport, observedViewport);
    for (const path of artifactPathsFor('DF-FU-18', 'chromium')) {
      assert.equal(archive.entries.has(path), true, path);
    }
  });

  it('packages a complete validated diagnostic for a real DF-FU-18 check failure', async () => {
    const { output } = await outputFixture();
    const { api } = fakePlaywright({
      dfFu18Only: true,
      dfFu18DuplicateReconnectSelection: true,
    });
    const outcome = await runAutomation(
      {
        url: DEPLOYMENT_URL,
        revision: REVISION,
        output,
        scenario: 'DF-FU-18',
        now: () => new Date(EXECUTED_AT),
      },
      api,
    );

    assert.equal(outcome.result.result, 'FAIL');
    assert.equal(automationExitCode(outcome.results), 1);
    assert.equal(outcome.archiveValidated, true);
    const archive = await readEvidenceArchive(output, {
      expectedKind: 'automation',
      expectedRevision: REVISION,
      expectedDeploymentUrl: DEPLOYMENT_URL,
    });
    assert.deepEqual([...archive.entries.keys()].sort(), [
      'artifacts/DF-FU-18/chromium/events.json',
      'artifacts/DF-FU-18/chromium/final.png',
      'artifacts/DF-FU-18/chromium/run.webm',
      'artifacts/DF-FU-18/chromium/trace.zip',
      'automation/DF-FU-18.json',
    ]);
    for (const path of artifactPathsFor('DF-FU-18', 'chromium')) {
      assert.equal(archive.entries.has(path), true, path);
    }
    const events = JSON.parse(
      Buffer.from(archive.entries.get('artifacts/DF-FU-18/chromium/events.json')).toString(),
    );
    assert.match(events.cause, /DF-FU-18-reconnect-teardown-clean/u);
    assert.deepEqual(events.failedChecks, ['DF-FU-18-reconnect-teardown-clean']);
    assert.deepEqual(events.missingArtifacts, []);
    const stored = JSON.parse(
      Buffer.from(archive.entries.get('automation/DF-FU-18.json')).toString(),
    );
    assert.equal(stored.result, 'FAIL');
  });

  it('runs and closes all three lanes and writes a validated revision-bound archive', async () => {
    const { output } = await outputFixture();
    const { api, state } = fakePlaywright();
    const outcome = await runAutomation(
      {
        url: DEPLOYMENT_URL,
        revision: REVISION,
        output,
        scenario: 'DF-FU-17',
        now: () => new Date(EXECUTED_AT),
      },
      api,
    );

    assert.equal(outcome.result.result, 'PASS');
    assert.deepEqual(
      outcome.result.runs.map(({ engine }) => engine),
      REQUIRED_ENGINES,
    );
    assert.deepEqual(state.launchAttempts, REQUIRED_ENGINES);
    assert.equal(state.contexts.length, 3);
    assert.deepEqual(
      state.contexts.map(({ closed }) => closed),
      [true, true, true],
    );
    assert.equal(state.browsers.length, 3);
    assert.deepEqual(
      state.browsers.map(({ closed }) => closed),
      [true, true, true],
    );
    assert.equal(state.cdpSessions.length, 1);
    assert.deepEqual(
      state.cdpSessions.map(({ detached }) => detached),
      [true],
    );
    const chromiumPage = state.pages.find(({ engine }) => engine === 'chromium');
    assert.deepEqual(chromiumPage.touchLabels, [
      'Cancel touch-equivalence.pdf',
      'Retry touch-equivalence.pdf',
      'Remove touch-equivalence.pdf',
    ]);
    await assert.rejects(stat(outcome.temporaryRoot), { code: 'ENOENT' });

    const archive = await readEvidenceArchive(output, {
      expectedKind: 'automation',
      expectedRevision: REVISION,
      expectedDeploymentUrl: DEPLOYMENT_URL,
    });
    assert.equal(archive.manifest.createdAt, EXECUTED_AT);
    assert.deepEqual(
      [...archive.entries.keys()],
      [
        'artifacts/DF-FU-17/chromium/events.json',
        'artifacts/DF-FU-17/chromium/final.png',
        'artifacts/DF-FU-17/chromium/run.webm',
        'artifacts/DF-FU-17/chromium/trace.zip',
        'artifacts/DF-FU-17/firefox/events.json',
        'artifacts/DF-FU-17/firefox/final.png',
        'artifacts/DF-FU-17/firefox/run.webm',
        'artifacts/DF-FU-17/firefox/trace.zip',
        'artifacts/DF-FU-17/webkit/events.json',
        'artifacts/DF-FU-17/webkit/final.png',
        'artifacts/DF-FU-17/webkit/run.webm',
        'artifacts/DF-FU-17/webkit/trace.zip',
        'automation/DF-FU-17.json',
      ],
    );
    const stored = JSON.parse(
      Buffer.from(archive.entries.get('automation/DF-FU-17.json')).toString(),
    );
    assert.equal(stored.result, 'PASS');
    assert.equal(stored.runs.flatMap(({ artifactPaths }) => artifactPaths).length, 12);
  });

  it('still closes every lane and writes diagnostic artifacts and FAIL after one lane fails', async () => {
    const { output } = await outputFixture();
    const { api, state } = fakePlaywright({ failingEngine: 'firefox' });
    const outcome = await runAutomation(
      {
        url: DEPLOYMENT_URL,
        revision: REVISION,
        output,
        scenario: 'DF-FU-17',
        now: () => new Date(EXECUTED_AT),
      },
      api,
    );

    assert.equal(outcome.result.result, 'FAIL');
    assert.deepEqual(state.launchAttempts, REQUIRED_ENGINES);
    assert.equal(state.contexts.length, 3);
    assert.deepEqual(
      state.contexts.map(({ closed }) => closed),
      [true, true, true],
    );
    assert.equal(state.browsers.length, 3);
    assert.deepEqual(
      state.browsers.map(({ closed }) => closed),
      [true, true, true],
    );
    await assert.rejects(stat(outcome.temporaryRoot), { code: 'ENOENT' });

    const archive = await readEvidenceArchive(output, { expectedKind: 'automation' });
    const events = JSON.parse(
      Buffer.from(archive.entries.get('artifacts/DF-FU-17/firefox/events.json')).toString(),
    );
    assert.match(events.cause, /forced firefox interaction failure/u);
    assert.deepEqual(events.failedChecks, DF_FU_17_CHECKS);
    for (const path of artifactPathsFor('DF-FU-17', 'firefox')) {
      assert.ok((await readFile(output)).byteLength > 0, path);
      assert.ok(archive.entries.get(path).byteLength > 0, path);
    }
  });

  it('writes a T2/T3-valid partial diagnostic ZIP when Chromium fails before observation', async () => {
    const { output } = await outputFixture();
    const { api, state } = fakePlaywright({ launchFailingEngine: 'chromium' });
    const outcome = await runAutomation(
      {
        url: DEPLOYMENT_URL,
        revision: REVISION,
        output,
        scenario: 'DF-FU-17',
        now: () => new Date(EXECUTED_AT),
      },
      api,
    );

    assert.equal(outcome.result.result, 'FAIL');
    assert.deepEqual(state.launchAttempts, REQUIRED_ENGINES);
    assert.equal(state.contexts.length, 2);
    assert.deepEqual(
      state.contexts.map(({ closed }) => closed),
      [true, true],
    );
    assert.equal(state.browsers.length, 2);
    assert.deepEqual(
      state.browsers.map(({ closed }) => closed),
      [true, true],
    );
    await assert.rejects(stat(outcome.temporaryRoot), { code: 'ENOENT' });
    const archive = await readEvidenceArchive(output, {
      expectedKind: 'automation',
      expectedRevision: REVISION,
      expectedDeploymentUrl: DEPLOYMENT_URL,
    });
    assert.deepEqual(outcome.result.runs[0].mediaQueries, {
      '(pointer: coarse)': null,
      '(any-pointer: coarse)': null,
    });
    assert.deepEqual(outcome.result.runs[0].artifactPaths, [
      'artifacts/DF-FU-17/chromium/events.json',
    ]);
    const events = JSON.parse(
      Buffer.from(archive.entries.get('artifacts/DF-FU-17/chromium/events.json')).toString(),
    );
    assert.match(events.cause, /forced chromium launch failure/u);
    assert.deepEqual(events.failedChecks, DF_FU_17_CHECKS);
    assert.deepEqual(events.missingArtifacts.sort(), [
      'artifacts/DF-FU-17/chromium/final.png',
      'artifacts/DF-FU-17/chromium/run.webm',
      'artifacts/DF-FU-17/chromium/trace.zip',
    ]);
    assert.equal(outcome.archiveValidated, true);
  });

  it('packages an ingestible FAIL when Chromium observes no coarse pointer', async () => {
    const { output } = await outputFixture();
    const { api } = fakePlaywright({ chromiumCoarsePointer: false });
    const outcome = await runAutomation(
      {
        url: DEPLOYMENT_URL,
        revision: REVISION,
        output,
        scenario: 'DF-FU-17',
        now: () => new Date(EXECUTED_AT),
      },
      api,
    );

    assert.equal(outcome.result.result, 'FAIL');
    assert.deepEqual(outcome.result.runs[0].mediaQueries, {
      '(pointer: coarse)': false,
      '(any-pointer: coarse)': false,
    });
    const archive = await readEvidenceArchive(output, { expectedKind: 'automation' });
    const events = JSON.parse(
      Buffer.from(archive.entries.get('artifacts/DF-FU-17/chromium/events.json')).toString(),
    );
    assert.match(events.cause, /coarse pointer was not observed/u);
    assert.equal(outcome.archiveValidated, true);
  });

  it('derives a nonempty FAIL cause when an observed check is false without an exception', async () => {
    const { output } = await outputFixture();
    const { api } = fakePlaywright({ overflowEngine: 'webkit' });
    const outcome = await runAutomation(
      {
        url: DEPLOYMENT_URL,
        revision: REVISION,
        output,
        scenario: 'DF-FU-17',
        now: () => new Date(EXECUTED_AT),
      },
      api,
    );

    assert.equal(outcome.result.result, 'FAIL');
    const archive = await readEvidenceArchive(output, { expectedKind: 'automation' });
    const events = JSON.parse(
      Buffer.from(archive.entries.get('artifacts/DF-FU-17/webkit/events.json')).toString(),
    );
    assert.deepEqual(events.failedChecks, ['DF-FU-17-no-horizontal-overflow']);
    assert.match(events.cause, /Failed checks: DF-FU-17-no-horizontal-overflow/u);
  });

  it('does not fabricate media when capture APIs resolve without creating files', async () => {
    const { output } = await outputFixture();
    const { api, state } = fakePlaywright({
      missingArtifactsByEngine: {
        chromium: ['final.png', 'run.webm', 'trace.zip'],
        firefox: ['final.png', 'run.webm', 'trace.zip'],
        webkit: ['final.png', 'run.webm', 'trace.zip'],
      },
    });
    const outcome = await runAutomation(
      {
        url: DEPLOYMENT_URL,
        revision: REVISION,
        output,
        scenario: 'DF-FU-17',
        now: () => new Date(EXECUTED_AT),
      },
      api,
    );

    assert.equal(outcome.result.result, 'FAIL');
    assert.deepEqual(state.launchAttempts, REQUIRED_ENGINES);
    assert.deepEqual(
      state.contexts.map(({ closed }) => closed),
      [true, true, true],
    );
    assert.deepEqual(
      state.browsers.map(({ closed }) => closed),
      [true, true, true],
    );
    assert.deepEqual(
      outcome.result.runs.map(({ artifactPaths }) => artifactPaths),
      REQUIRED_ENGINES.map((engine) => [`artifacts/DF-FU-17/${engine}/events.json`]),
    );
    const archive = await readEvidenceArchive(output, { expectedKind: 'automation' });
    for (const engine of REQUIRED_ENGINES) {
      const eventsPath = `artifacts/DF-FU-17/${engine}/events.json`;
      const events = JSON.parse(Buffer.from(archive.entries.get(eventsPath)).toString());
      assert.deepEqual(events.missingArtifacts.sort(), [
        `artifacts/DF-FU-17/${engine}/final.png`,
        `artifacts/DF-FU-17/${engine}/run.webm`,
        `artifacts/DF-FU-17/${engine}/trace.zip`,
      ]);
      assert.match(events.cause, /Missing artifacts/u);
      assert.deepEqual(events.failedChecks, DF_FU_17_CHECKS);
      for (const fileName of ['final.png', 'run.webm', 'trace.zip']) {
        assert.equal(archive.entries.has(`artifacts/DF-FU-17/${engine}/${fileName}`), false);
      }
    }
    assert.equal(outcome.archiveValidated, true);
  });

  it('writes a validated nonzero DF-FU-18 diagnostic ZIP without fabricated media', async () => {
    const { output } = await outputFixture();
    const { api, state } = fakePlaywright({
      dfFu18Only: true,
      dfFu18LaunchFailure: true,
    });
    const outcome = await runAutomation(
      {
        url: DEPLOYMENT_URL,
        revision: REVISION,
        output,
        scenario: 'DF-FU-18',
        now: () => new Date(EXECUTED_AT),
      },
      api,
    );

    assert.equal(outcome.results[0].result, 'FAIL');
    assert.equal(automationExitCode(outcome.results), 1);
    assert.deepEqual(state.launchAttempts, ['chromium']);
    const archive = await readEvidenceArchive(output, {
      expectedKind: 'automation',
      expectedRevision: REVISION,
      expectedDeploymentUrl: DEPLOYMENT_URL,
    });
    assert.deepEqual(
      [...archive.entries.keys()],
      ['artifacts/DF-FU-18/chromium/events.json', 'automation/DF-FU-18.json'],
    );
    const events = JSON.parse(
      Buffer.from(archive.entries.get('artifacts/DF-FU-18/chromium/events.json')).toString(),
    );
    assert.match(events.cause, /forced DF-FU-18 chromium launch failure/u);
    assert.deepEqual(events.failedChecks, EXPECTED_DF_FU_18_CHECKS);
    assert.deepEqual(events.missingArtifacts.sort(), [
      'artifacts/DF-FU-18/chromium/final.png',
      'artifacts/DF-FU-18/chromium/run.webm',
      'artifacts/DF-FU-18/chromium/trace.zip',
    ]);
    assert.equal(outcome.archiveValidated, true);
  });
});
