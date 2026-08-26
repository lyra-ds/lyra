import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { strFromU8, unzipSync } from 'fflate';

import { readEvidenceArchive } from './archive.mjs';
import {
  ARTIFACT_FILE_NAMES,
  DF_FU_17_CHECKS,
  REQUIRED_ENGINES,
  automationExitCode,
  artifactPathsFor,
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
    if (this.kind === 'button') return this.page.actionName() === this.name;
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
  constructor(engine, videoPath, laneFailure) {
    this.engine = engine;
    this.videoPath = videoPath;
    this.laneFailure = laneFailure;
    this.fileName = '';
    this.focused = null;
    this.liveText = '';
    this.mode = 'Success';
    this.state = 'idle';
    this.keyboardActivations = 0;
    this.touchActivations = 0;
  }

  actionName() {
    if (this.state === 'uploading') return `Cancel ${this.fileName}`;
    if (this.state === 'canceled' || this.state === 'error') return `Retry ${this.fileName}`;
    if (this.state === 'success') return `Remove ${this.fileName}`;
    return null;
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
      documentScrollWidth: 320,
      componentClientWidth: 304,
      componentScrollWidth: 304,
      mediaQueries:
        this.engine === 'chromium'
          ? { '(pointer: coarse)': true, '(any-pointer: coarse)': true }
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
    await writeFile(path, Buffer.from('fake-png'));
  }

  video() {
    return { path: async () => this.videoPath };
  }
}

function fakePlaywright({ failingEngine, launchFailingEngine } = {}) {
  const state = { browsers: [], contexts: [], cdpSessions: [] };
  const api = {};
  for (const engine of REQUIRED_ENGINES) {
    api[engine] = {
      async launch() {
        if (launchFailingEngine === engine) throw new Error(`forced ${engine} launch failure`);
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
            await writeFile(videoPath, Buffer.from(`fake-${engine}-video`));
            const context = {
              closed: false,
              tracing: {
                async start(settings) {
                  assert.deepEqual(settings, { screenshots: true, snapshots: true, sources: true });
                },
                async stop({ path }) {
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
                return new FakePage(engine, videoPath, failingEngine === engine);
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

    for (const fileName of ARTIFACT_FILE_NAMES) {
      const runs = completeRuns();
      const artifacts = allArtifactPaths(runs);
      artifacts.delete(`artifacts/DF-FU-17/chromium/${fileName}`);
      assert.equal(deriveAutomationResult(runs, artifacts), 'FAIL');
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
    assert.equal(
      state.contexts.every(({ closed }) => closed),
      true,
    );
    assert.equal(
      state.browsers.every(({ closed }) => closed),
      true,
    );
    assert.equal(
      state.cdpSessions.every(({ detached }) => detached),
      true,
    );
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
    assert.equal(
      state.contexts.every(({ closed }) => closed),
      true,
    );
    assert.equal(
      state.browsers.every(({ closed }) => closed),
      true,
    );
    await assert.rejects(stat(outcome.temporaryRoot), { code: 'ENOENT' });

    const archive = await readEvidenceArchive(output, { expectedKind: 'automation' });
    const events = JSON.parse(
      Buffer.from(archive.entries.get('artifacts/DF-FU-17/firefox/events.json')).toString(),
    );
    assert.match(events.error, /forced firefox interaction failure/u);
    assert.deepEqual(events.failedChecks, DF_FU_17_CHECKS);
    for (const path of artifactPathsFor('DF-FU-17', 'firefox')) {
      assert.ok((await readFile(output)).byteLength > 0, path);
      assert.ok(archive.entries.get(path).byteLength > 0, path);
    }
  });

  it('finishes a non-ingestible diagnostic ZIP when Chromium fails before media observation', async () => {
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
    assert.equal(
      state.contexts.every(({ closed }) => closed),
      true,
    );
    await assert.rejects(stat(outcome.temporaryRoot), { code: 'ENOENT' });
    const members = unzipSync(await readFile(output));
    assert.ok(members['manifest.json'].byteLength > 0);
    for (const path of artifactPathsFor('DF-FU-17', 'chromium')) {
      assert.ok(members[path].byteLength > 0, path);
    }
    const events = JSON.parse(strFromU8(members['artifacts/DF-FU-17/chromium/events.json']));
    assert.match(events.error, /forced chromium launch failure/u);
    assert.deepEqual(events.failedChecks, DF_FU_17_CHECKS);
    await assert.rejects(readEvidenceArchive(output), /invalid automation result record/u);
  });
});
