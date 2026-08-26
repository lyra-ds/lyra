import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { readEvidenceArchive } from './archive.mjs';
import {
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
} from './automation.mjs';

const { afterEach, describe, it } = process.env.VITEST
  ? await import('vitest')
  : await import('node:test');

const REVISION = '1234567890abcdef1234567890abcdef12345678';
const DEPLOYMENT_URL = 'https://a1b2c3d4.lyra-ds-docs.pages.dev/en/file-upload-evidence/';
const EXECUTED_AT = '2026-08-26T12:00:00.000Z';
const temporaryRoots = [];

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

function fakePlaywright({
  failingEngine,
  launchFailingEngine,
  missingArtifactsByEngine = {},
  chromiumCoarsePointer = true,
  overflowEngine,
} = {}) {
  const state = { launchAttempts: [], browsers: [], contexts: [], cdpSessions: [], pages: [] };
  const api = {};
  for (const engine of REQUIRED_ENGINES) {
    api[engine] = {
      async launch() {
        state.launchAttempts.push(engine);
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

  it('keeps the normal CLI closed until DF-FU-18 joins the archive', () => {
    assert.deepEqual(resolveRequestedScenarios('DF-FU-17'), ['DF-FU-17']);
    assert.throws(() => resolveRequestedScenarios(undefined), /DF-FU-18/u);
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

  it('maps every failed automation result to a nonzero process exit', () => {
    assert.equal(automationExitCode({ result: 'PASS' }), 0);
    assert.equal(automationExitCode({ result: 'FAIL' }), 1);
  });
});

describe('runAutomation', () => {
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
});
