import { createHash } from 'node:crypto';
import { copyFile, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { strToU8, zipSync } from 'fflate';

import { readEvidenceArchive } from './archive.mjs';
import {
  AUTOMATED_SCENARIO_CHECK_IDS,
  EVIDENCE_SCHEMA_VERSION,
  isImmutableDeploymentRoute,
  validateAutomatedResult,
  validateManifest,
} from '../src/contracts.ts';

export const REQUIRED_ENGINES = Object.freeze(['chromium', 'firefox', 'webkit']);
export const ARTIFACT_FILE_NAMES = Object.freeze([
  'final.png',
  'run.webm',
  'trace.zip',
  'events.json',
]);
export const DF_FU_17_CHECKS = Object.freeze([...AUTOMATED_SCENARIO_CHECK_IDS['DF-FU-17']]);

const VIEWPORT = Object.freeze({ width: 320, height: 720 });
const DEVICE_SCALE_FACTOR = 2;
const LONG_FILE_NAME =
  'résumé-非常に長い-arquivo-de-evidência-com-identidade-preservada-em-refluxo-320px.pdf';
const REPLACEMENT_FILE_NAME = 'replacement-must-be-rejected.pdf';
const TOUCH_FILE_NAME = 'touch-equivalence.pdf';
const ZIP_EPOCH = new Date('1980-01-01T00:00:00.000Z');
const ZIP_MTIME = new Date(ZIP_EPOCH.getTime() + ZIP_EPOCH.getTimezoneOffset() * 60_000);
const gitShaPattern = /^[a-f0-9]{40}$/u;
const mediaTypes = Object.freeze({
  'events.json': 'application/json',
  'final.png': 'image/png',
  'run.webm': 'video/webm',
  'trace.zip': 'application/zip',
});

function automationError(message) {
  return new Error(`Invalid automation arguments: ${message}`);
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function jsonBytes(value) {
  return strToU8(`${JSON.stringify(value, null, 2)}\n`);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function exactKeys(value, expected) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  return actual.length === required.length && required.every((key, index) => key === actual[index]);
}

function sameStrings(actual, expected) {
  return (
    actual.length === expected.length &&
    [...actual].sort().every((value, index) => value === [...expected].sort()[index])
  );
}

function isRequiredEngine(value) {
  return REQUIRED_ENGINES.includes(value);
}

export function artifactPathsFor(scenario, engine) {
  if (scenario !== 'DF-FU-17') throw new TypeError('scenario must be DF-FU-17');
  if (!isRequiredEngine(engine)) throw new TypeError('engine must be chromium, firefox, or webkit');
  return ARTIFACT_FILE_NAMES.map((fileName) => `artifacts/${scenario}/${engine}/${fileName}`);
}

export function parseAutomationArgs(args) {
  const parsed = new Map();
  for (const argument of args) {
    const match = /^--(url|revision|output|scenario)=(.+)$/u.exec(argument);
    if (match === null || parsed.has(match[1]))
      throw automationError(`unsupported option ${argument}`);
    parsed.set(match[1], match[2]);
  }
  const url = parsed.get('url');
  const revision = parsed.get('revision');
  const output = parsed.get('output');
  const scenario = parsed.get('scenario');
  if (url === undefined || !isImmutableDeploymentRoute(url, 'en')) {
    throw automationError('url must be the immutable English evidence route');
  }
  if (revision === undefined || !gitShaPattern.test(revision)) {
    throw automationError('revision must be a lowercase 40-character SHA');
  }
  if (output === undefined || !isAbsolute(output) || !output.endsWith('.zip')) {
    throw automationError('output must be an absolute ZIP path');
  }
  if (scenario !== undefined && scenario !== 'DF-FU-17') {
    throw automationError('scenario must be DF-FU-17');
  }
  return {
    url,
    revision,
    output,
    ...(scenario === undefined ? {} : { scenario }),
  };
}

export function resolveRequestedScenarios(scenario) {
  if (scenario === 'DF-FU-17') return ['DF-FU-17'];
  throw new Error(
    'Normal automation requires DF-FU-17 and DF-FU-18; DF-FU-18 is not implemented yet. Use --scenario=DF-FU-17 only for local development and tests.',
  );
}

export function deriveAutomationResult(runs, presentArtifactPaths) {
  const engines = runs.map(({ engine }) => engine);
  if (!sameStrings(engines, REQUIRED_ENGINES) || new Set(engines).size !== engines.length) {
    return 'FAIL';
  }

  for (const run of runs) {
    if (!isRequiredEngine(run.engine)) return 'FAIL';
    if (
      run.viewport?.width !== VIEWPORT.width ||
      run.viewport?.height !== VIEWPORT.height ||
      run.viewport?.devicePixelRatio !== DEVICE_SCALE_FACTOR
    ) {
      return 'FAIL';
    }
    if (
      !exactKeys(run.checks, DF_FU_17_CHECKS) ||
      Object.values(run.checks).some((value) => value !== true)
    ) {
      return 'FAIL';
    }
    if (
      run.mediaQueries === null ||
      typeof run.mediaQueries !== 'object' ||
      Object.keys(run.mediaQueries).length === 0 ||
      Object.values(run.mediaQueries).some((value) => typeof value !== 'boolean')
    ) {
      return 'FAIL';
    }
    const expectedPaths = artifactPathsFor('DF-FU-17', run.engine);
    if (!Array.isArray(run.artifactPaths) || !sameStrings(run.artifactPaths, expectedPaths)) {
      return 'FAIL';
    }
    if (expectedPaths.some((path) => !presentArtifactPaths.has(path))) return 'FAIL';
    if (
      run.engine === 'chromium' &&
      run.mediaQueries?.['(pointer: coarse)'] !== true &&
      run.mediaQueries?.['(any-pointer: coarse)'] !== true
    ) {
      return 'FAIL';
    }
  }
  return 'PASS';
}

export function automationExitCode(result) {
  return result.result === 'PASS' ? 0 : 1;
}

function emptyChecks() {
  return Object.fromEntries(DF_FU_17_CHECKS.map((check) => [check, false]));
}

export function deriveDfFu17Checks(observations) {
  const { overflow, identity, reachability, lifecycle, keyboardTransitions, touchTransitions } =
    observations;
  const longIdentityRetained =
    identity.initialNameVisible === true &&
    identity.retainedNameVisible === true &&
    identity.retainedActionName === `Cancel ${LONG_FILE_NAME}` &&
    identity.replacementNameVisible === false &&
    identity.replacementActionVisible === false;
  const lifecycleObserved =
    lifecycle.cancelAction === 'Retry' &&
    lifecycle.cancelAnnouncement === `${LONG_FILE_NAME} canceled.` &&
    lifecycle.errorAction === 'Retry' &&
    lifecycle.errorAnnouncement === `${LONG_FILE_NAME}: The upload request is invalid.` &&
    lifecycle.completionAction === 'Remove' &&
    lifecycle.completionAnnouncement === `${LONG_FILE_NAME} uploaded.` &&
    lifecycle.removedNameVisible === false &&
    lifecycle.removedActionVisible === false &&
    lifecycle.removalAnnouncement === `${LONG_FILE_NAME} removed.`;
  const keyboardObserved =
    keyboardTransitions.cancel === 'canceled' &&
    keyboardTransitions.errorRetry === 'error' &&
    keyboardTransitions.successRetry === 'success' &&
    keyboardTransitions.remove === 'removed';
  const touchEquivalent =
    (touchTransitions.cancel === 'not-required' &&
      touchTransitions.successRetry === 'not-required' &&
      touchTransitions.remove === 'not-required') ||
    (touchTransitions.cancel === keyboardTransitions.cancel &&
      touchTransitions.successRetry === keyboardTransitions.successRetry &&
      touchTransitions.remove === keyboardTransitions.remove);

  return {
    'DF-FU-17-no-horizontal-overflow':
      overflow.documentScrollWidth <= overflow.documentClientWidth &&
      overflow.componentScrollWidth <= overflow.componentClientWidth,
    'DF-FU-17-long-file-identity-retained': longIdentityRetained,
    'DF-FU-17-actions-reachable-at-reflow':
      reachability.cancel === true && reachability.retry === true && reachability.remove === true,
    'DF-FU-17-active-replacement-rejected-and-announced':
      longIdentityRetained &&
      observations.replacementAnnouncement ===
        'File replacement is unavailable while an upload is active.',
    'DF-FU-17-cancel-retry-complete-remove': lifecycleObserved,
    'DF-FU-17-focus-recovered': observations.focusRecovered === true,
    'DF-FU-17-keyboard-activation-equivalent': keyboardObserved && touchEquivalent,
  };
}

function recordEvent(events, operation, details = {}) {
  events.push({ operation, ...details });
}

async function observedPageState(page) {
  return page.evaluate(() => {
    const input = document.querySelector('[data-evidence-id="react-file-input"]');
    const list = document.querySelector('[data-evidence-id="react-file-list"]');
    const liveRegion = document.querySelector('[data-evidence-id="react-live-region"]');
    const diagnostics = document.querySelector('[data-evidence-id="react-diagnostics"]');
    if (!(input instanceof HTMLInputElement) || !(list instanceof HTMLElement)) {
      throw new Error('The private React file input/list evidence hooks are missing.');
    }
    if (!(liveRegion instanceof HTMLElement) || !(diagnostics instanceof HTMLElement)) {
      throw new Error('The private React live-region/diagnostics evidence hooks are missing.');
    }
    const component = input.closest('.lyra-upload');
    if (!(component instanceof HTMLElement)) {
      throw new Error('The private React evidence input is outside FileUpload.');
    }
    return {
      documentClientWidth: document.documentElement.clientWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      componentClientWidth: component.clientWidth,
      componentScrollWidth: component.scrollWidth,
      mediaQueries: {
        '(pointer: coarse)': matchMedia('(pointer: coarse)').matches,
        '(any-pointer: coarse)': matchMedia('(any-pointer: coarse)').matches,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
    };
  });
}

async function actionFitsViewport(action) {
  await action.scrollIntoViewIfNeeded();
  const box = await action.boundingBox();
  return (
    box !== null &&
    box.x >= 0 &&
    box.y >= 0 &&
    box.x + box.width <= VIEWPORT.width &&
    box.y + box.height <= VIEWPORT.height
  );
}

async function activateByKeyboard(locator, events, label) {
  await locator.focus();
  await locator.press('Enter');
  recordEvent(events, 'keyboard-activation', { label });
}

async function exerciseDfFu17(page, engine, url, events) {
  await page.goto(url, { waitUntil: 'networkidle' });
  recordEvent(events, 'navigation', { url });

  const input = page.locator('[data-evidence-id="react-file-input"]');
  await input.waitFor({ state: 'attached' });
  await page.locator('[data-evidence-id="react-live-region"]').waitFor({ state: 'attached' });
  await page.locator('[data-evidence-id="react-diagnostics"]').waitFor({ state: 'visible' });

  await page.getByRole('radio', { name: 'Delayed response' }).check();
  await input.setInputFiles({
    name: LONG_FILE_NAME,
    mimeType: 'application/pdf',
    buffer: Buffer.from('Lyra DF-FU-17 long Unicode file identity fixture.'),
  });
  await page.locator('[data-evidence-id="react-file-list"]').waitFor({ state: 'visible' });
  const cancel = page.getByRole('button', { name: `Cancel ${LONG_FILE_NAME}` });
  await cancel.waitFor({ state: 'visible' });

  const observed = await observedPageState(page);
  const longName = page.getByText(LONG_FILE_NAME, { exact: true });
  const initialNameVisible = await longName.isVisible();
  const cancelReachable = await actionFitsViewport(cancel);
  await input.setInputFiles({
    name: REPLACEMENT_FILE_NAME,
    mimeType: 'application/pdf',
    buffer: Buffer.from('This active replacement must be rejected.'),
  });
  const rejectionAnnouncement =
    (await page.locator('[data-evidence-id="react-live-region"]').textContent()) ?? '';
  const retainedNameVisible = await longName.isVisible();
  const retainedActionVisible = await cancel.isVisible();
  const replacementNameVisible = await page
    .getByText(REPLACEMENT_FILE_NAME, { exact: true })
    .isVisible();
  const replacementActionVisible = (
    await Promise.all(
      ['Cancel', 'Retry', 'Remove'].map((action) =>
        page.getByRole('button', { name: `${action} ${REPLACEMENT_FILE_NAME}` }).isVisible(),
      ),
    )
  ).some(Boolean);
  recordEvent(events, 'active-replacement', {
    announcement: rejectionAnnouncement,
    retainedFileName: retainedNameVisible ? LONG_FILE_NAME : null,
    retainedActionName: retainedActionVisible ? `Cancel ${LONG_FILE_NAME}` : null,
    replacementNameVisible,
    replacementActionVisible,
  });

  await activateByKeyboard(cancel, events, `Cancel ${LONG_FILE_NAME}`);
  let retry = page.getByRole('button', { name: `Retry ${LONG_FILE_NAME}` });
  await retry.waitFor({ state: 'visible' });
  const cancelRetryVisible = await retry.isVisible();
  const cancelAnnouncement =
    (await page.locator('[data-evidence-id="react-live-region"]').textContent()) ?? '';
  const retryReachable = await actionFitsViewport(retry);

  await page.getByRole('radio', { name: 'Retryable error' }).check();
  await activateByKeyboard(retry, events, `Retry ${LONG_FILE_NAME}`);
  retry = page.getByRole('button', { name: `Retry ${LONG_FILE_NAME}` });
  await retry.waitFor({ state: 'visible' });
  const errorRetryVisible = await retry.isVisible();
  const errorAnnouncement =
    (await page.locator('[data-evidence-id="react-live-region"]').textContent()) ?? '';

  const successMode = page.getByRole('radio', { name: 'Success' });
  await successMode.focus();
  await successMode.press('Space');
  recordEvent(events, 'keyboard-activation', { label: 'Success' });
  await activateByKeyboard(retry, events, `Retry ${LONG_FILE_NAME}`);
  const remove = page.getByRole('button', { name: `Remove ${LONG_FILE_NAME}` });
  await remove.waitFor({ state: 'visible' });
  const completionRemoveVisible = await remove.isVisible();
  const completionAnnouncement =
    (await page.locator('[data-evidence-id="react-live-region"]').textContent()) ?? '';
  const removeReachable = await actionFitsViewport(remove);
  await activateByKeyboard(remove, events, `Remove ${LONG_FILE_NAME}`);
  await remove.waitFor({ state: 'hidden' });
  const removedNameVisible = await longName.isVisible();
  const removedActionVisible = await remove.isVisible();
  const removalAnnouncement =
    (await page.locator('[data-evidence-id="react-live-region"]').textContent()) ?? '';
  const focusRecovered = await input.evaluate((element) => document.activeElement === element);

  const touchTransitions = {
    cancel: 'not-required',
    successRetry: 'not-required',
    remove: 'not-required',
  };
  if (engine === 'chromium') {
    await page.getByRole('radio', { name: 'Delayed response' }).check();
    await input.setInputFiles({
      name: TOUCH_FILE_NAME,
      mimeType: 'application/pdf',
      buffer: Buffer.from('Lyra DF-FU-17 touch lifecycle fixture.'),
    });
    const touchCancel = page.getByRole('button', { name: `Cancel ${TOUCH_FILE_NAME}` });
    await touchCancel.waitFor({ state: 'visible' });
    await touchCancel.tap();
    recordEvent(events, 'touch-activation', { label: `Cancel ${TOUCH_FILE_NAME}` });
    const touchRetry = page.getByRole('button', { name: `Retry ${TOUCH_FILE_NAME}` });
    await touchRetry.waitFor({ state: 'visible' });
    const touchCancelAnnouncement =
      (await page.locator('[data-evidence-id="react-live-region"]').textContent()) ?? '';
    touchTransitions.cancel =
      touchCancelAnnouncement === `${TOUCH_FILE_NAME} canceled.` ? 'canceled' : 'unexpected';
    await page.getByRole('radio', { name: 'Success' }).check();
    await touchRetry.tap();
    recordEvent(events, 'touch-activation', { label: `Retry ${TOUCH_FILE_NAME}` });
    const touchRemove = page.getByRole('button', { name: `Remove ${TOUCH_FILE_NAME}` });
    await touchRemove.waitFor({ state: 'visible' });
    const touchCompletionAnnouncement =
      (await page.locator('[data-evidence-id="react-live-region"]').textContent()) ?? '';
    touchTransitions.successRetry =
      touchCompletionAnnouncement === `${TOUCH_FILE_NAME} uploaded.` ? 'success' : 'unexpected';
    await touchRemove.tap();
    recordEvent(events, 'touch-activation', { label: `Remove ${TOUCH_FILE_NAME}` });
    await touchRemove.waitFor({ state: 'hidden' });
    const touchRemovalAnnouncement =
      (await page.locator('[data-evidence-id="react-live-region"]').textContent()) ?? '';
    touchTransitions.remove =
      touchRemovalAnnouncement === `${TOUCH_FILE_NAME} removed.` ? 'removed' : 'unexpected';
  }

  const observations = {
    overflow: {
      documentClientWidth: observed.documentClientWidth,
      documentScrollWidth: observed.documentScrollWidth,
      componentClientWidth: observed.componentClientWidth,
      componentScrollWidth: observed.componentScrollWidth,
    },
    identity: {
      initialNameVisible,
      retainedNameVisible,
      retainedActionName: retainedActionVisible ? `Cancel ${LONG_FILE_NAME}` : null,
      replacementNameVisible,
      replacementActionVisible,
    },
    reachability: {
      cancel: cancelReachable,
      retry: retryReachable,
      remove: removeReachable,
    },
    replacementAnnouncement: rejectionAnnouncement,
    lifecycle: {
      cancelAction: cancelRetryVisible ? 'Retry' : 'unexpected',
      cancelAnnouncement,
      errorAction: errorRetryVisible ? 'Retry' : 'unexpected',
      errorAnnouncement,
      completionAction: completionRemoveVisible ? 'Remove' : 'unexpected',
      completionAnnouncement,
      removedNameVisible,
      removedActionVisible,
      removalAnnouncement,
    },
    focusRecovered,
    keyboardTransitions: {
      cancel:
        cancelRetryVisible && cancelAnnouncement === `${LONG_FILE_NAME} canceled.`
          ? 'canceled'
          : 'unexpected',
      errorRetry:
        errorRetryVisible &&
        errorAnnouncement === `${LONG_FILE_NAME}: The upload request is invalid.`
          ? 'error'
          : 'unexpected',
      successRetry:
        completionRemoveVisible && completionAnnouncement === `${LONG_FILE_NAME} uploaded.`
          ? 'success'
          : 'unexpected',
      remove:
        !removedActionVisible && removalAnnouncement === `${LONG_FILE_NAME} removed.`
          ? 'removed'
          : 'unexpected',
    },
    touchTransitions,
  };
  const checks = deriveDfFu17Checks(observations);
  recordEvent(events, 'observations', { observations });
  recordEvent(events, 'checks-derived', { checks });
  return { checks, mediaQueries: observed.mediaQueries, viewport: observed.viewport };
}

async function isNonEmptyFile(path) {
  try {
    const metadata = await stat(path);
    return metadata.isFile() && metadata.size > 0;
  } catch {
    return false;
  }
}

async function runLane({ engine, executedAt, laneRoot, revision, url }, browserType) {
  const events = [];
  const localArtifacts = Object.fromEntries(
    ARTIFACT_FILE_NAMES.map((fileName) => [fileName, join(laneRoot, fileName)]),
  );
  const rawVideoRoot = join(laneRoot, 'raw-video');
  let browser;
  let context;
  let cdpSession;
  let page;
  let video;
  let tracingStarted = false;
  const laneErrors = [];
  let checks = emptyChecks();
  let mediaQueries = { '(pointer: coarse)': null, '(any-pointer: coarse)': null };
  let viewport = { ...VIEWPORT, devicePixelRatio: DEVICE_SCALE_FACTOR };

  try {
    await mkdir(rawVideoRoot, { recursive: true });
    browser = await browserType.launch();
    context = await browser.newContext({
      viewport: { ...VIEWPORT },
      deviceScaleFactor: DEVICE_SCALE_FACTOR,
      recordVideo: { dir: rawVideoRoot },
      ...(engine === 'chromium' ? { hasTouch: true } : {}),
    });
    await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
    tracingStarted = true;
    page = await context.newPage();
    video = page.video();
    if (engine === 'chromium') {
      cdpSession = await context.newCDPSession(page);
      await cdpSession.send('Emulation.setEmulatedMedia', {
        features: [
          { name: 'pointer', value: 'coarse' },
          { name: 'any-pointer', value: 'coarse' },
        ],
      });
    }
    ({ checks, mediaQueries, viewport } = await exerciseDfFu17(page, engine, url, events));
  } catch (error) {
    const message = errorMessage(error);
    laneErrors.push(message);
    recordEvent(events, 'lane-failure', { error: message });
  } finally {
    if (page !== undefined) {
      try {
        await page.screenshot({ path: localArtifacts['final.png'], fullPage: true });
      } catch (error) {
        laneErrors.push(`Screenshot failed: ${errorMessage(error)}`);
      }
    }
    if (tracingStarted) {
      try {
        await context.tracing.stop({ path: localArtifacts['trace.zip'] });
      } catch (error) {
        laneErrors.push(`Tracing failed: ${errorMessage(error)}`);
      }
    }
    if (cdpSession !== undefined) {
      try {
        await cdpSession.detach();
      } catch (error) {
        laneErrors.push(`CDP cleanup failed: ${errorMessage(error)}`);
      }
    }
    if (context !== undefined) {
      try {
        await context.close();
      } catch (error) {
        laneErrors.push(`Context cleanup failed: ${errorMessage(error)}`);
      }
    }
    if (video !== undefined) {
      try {
        await copyFile(await video.path(), localArtifacts['run.webm']);
      } catch (error) {
        laneErrors.push(`Video finalization failed: ${errorMessage(error)}`);
      }
    }
    if (browser !== undefined) {
      try {
        await browser.close();
      } catch (error) {
        laneErrors.push(`Browser cleanup failed: ${errorMessage(error)}`);
      }
    }
  }

  const capturedArtifactNames = [];
  for (const fileName of ['final.png', 'run.webm', 'trace.zip']) {
    if (await isNonEmptyFile(localArtifacts[fileName])) capturedArtifactNames.push(fileName);
  }
  const missingArtifacts = ['final.png', 'run.webm', 'trace.zip']
    .filter((fileName) => !capturedArtifactNames.includes(fileName))
    .map((fileName) => `artifacts/DF-FU-17/${engine}/${fileName}`);
  if (laneErrors.length > 0 || missingArtifacts.length > 0) checks = emptyChecks();
  const failedChecks = DF_FU_17_CHECKS.filter((check) => checks[check] !== true);
  const causes = [...laneErrors];
  if (missingArtifacts.length > 0) {
    causes.push(`Missing artifacts: ${missingArtifacts.join(', ')}`);
  }
  if (failedChecks.length > 0) causes.push(`Failed checks: ${failedChecks.join(', ')}`);
  if (
    engine === 'chromium' &&
    mediaQueries['(pointer: coarse)'] !== true &&
    mediaQueries['(any-pointer: coarse)'] !== true
  ) {
    causes.push('Chromium coarse pointer was not observed.');
  }
  const cause = causes.join(' ');
  await writeFile(
    localArtifacts['events.json'],
    jsonBytes({
      scenario: 'DF-FU-17',
      engine,
      revision,
      deploymentUrl: url,
      executedAt,
      viewport,
      mediaQueries,
      events,
      checks,
      failedChecks,
      missingArtifacts,
      ...(cause.length === 0 ? {} : { cause }),
    }),
  );

  const artifactPaths = [...capturedArtifactNames, 'events.json'].map(
    (fileName) => `artifacts/DF-FU-17/${engine}/${fileName}`,
  );

  return {
    run: { engine, viewport, mediaQueries, checks, artifactPaths },
    localArtifacts,
  };
}

async function packageAutomation({ output, result, laneOutputs, createdAt }) {
  const members = new Map();
  const entries = [];
  for (const { run, localArtifacts } of laneOutputs) {
    for (const path of run.artifactPaths) {
      const fileName = path.slice(path.lastIndexOf('/') + 1);
      const bytes = new Uint8Array(await readFile(localArtifacts[fileName]));
      members.set(path, bytes);
      entries.push({
        path,
        bytes: bytes.length,
        mediaType: mediaTypes[fileName],
        sha256: sha256(bytes),
      });
    }
  }
  const resultPath = 'automation/DF-FU-17.json';
  const resultBytes = jsonBytes(result);
  members.set(resultPath, resultBytes);
  entries.push({
    path: resultPath,
    bytes: resultBytes.length,
    mediaType: 'application/json',
    sha256: sha256(resultBytes),
  });
  entries.sort((left, right) => left.path.localeCompare(right.path, 'en'));
  const manifest = {
    schemaVersion: EVIDENCE_SCHEMA_VERSION,
    kind: 'automation',
    revision: result.revision,
    deploymentUrl: result.deploymentUrl,
    createdAt,
    entries,
  };
  if (!validateManifest(manifest).ok) throw new Error('Generated automation manifest is invalid.');
  members.set('manifest.json', jsonBytes(manifest));

  const zipped = {};
  for (const [path, bytes] of [...members].sort(([left], [right]) =>
    left.localeCompare(right, 'en'),
  )) {
    zipped[path] = [bytes, { mtime: ZIP_MTIME }];
  }
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, zipSync(zipped, { level: 6, mtime: ZIP_MTIME }));
}

export async function runAutomation(options, playwrightApi) {
  const requestedScenarios = resolveRequestedScenarios(options.scenario);
  if (!requestedScenarios.includes('DF-FU-17')) throw new Error('DF-FU-17 was not requested.');
  if (!isImmutableDeploymentRoute(options.url, 'en') || !gitShaPattern.test(options.revision)) {
    throw automationError('run options must bind an immutable English route and exact revision');
  }
  if (!isAbsolute(options.output) || !options.output.endsWith('.zip')) {
    throw automationError('run output must be an absolute ZIP path');
  }
  for (const engine of REQUIRED_ENGINES) {
    if (playwrightApi?.[engine]?.launch === undefined) {
      throw new Error(`Pinned Playwright API is missing the ${engine} engine.`);
    }
  }

  const temporaryRoot = await mkdtemp(join(tmpdir(), 'lyra-file-upload-automation-'));
  try {
    const executedAt = (options.now?.() ?? new Date()).toISOString();
    const laneOutputs = [];
    for (const engine of REQUIRED_ENGINES) {
      const laneRoot = join(temporaryRoot, 'artifacts', 'DF-FU-17', engine);
      await mkdir(laneRoot, { recursive: true });
      laneOutputs.push(
        await runLane(
          {
            engine,
            executedAt,
            laneRoot,
            revision: options.revision,
            url: options.url,
          },
          playwrightApi[engine],
        ),
      );
    }
    const runs = laneOutputs.map(({ run }) => run);
    const presentArtifacts = new Set();
    for (const { run } of laneOutputs) {
      for (const artifactPath of run.artifactPaths) presentArtifacts.add(artifactPath);
    }
    const result = {
      scenario: 'DF-FU-17',
      locale: 'en',
      revision: options.revision,
      deploymentUrl: options.url,
      executedAt,
      runs,
      result: deriveAutomationResult(runs, presentArtifacts),
    };
    const validation = validateAutomatedResult(result, {
      revision: options.revision,
      deploymentUrl: options.url,
    });
    if (!validation.ok) {
      throw new Error(`Generated DF-FU-17 result is invalid: ${validation.errors.join(', ')}`);
    }
    await packageAutomation({ output: options.output, result, laneOutputs, createdAt: executedAt });
    await readEvidenceArchive(options.output, {
      expectedKind: 'automation',
      expectedRevision: options.revision,
      expectedDeploymentUrl: options.url,
    });
    return {
      result,
      output: options.output,
      temporaryRoot,
      archiveValidated: true,
    };
  } finally {
    await rm(temporaryRoot, { recursive: true });
  }
}

async function main() {
  const options = parseAutomationArgs(process.argv.slice(2));
  resolveRequestedScenarios(options.scenario);
  const playwrightApi = await import('playwright');
  const outcome = await runAutomation(options, playwrightApi);
  process.exitCode = automationExitCode(outcome.result);
  if (process.exitCode !== 0) {
    console.error(`DF-FU-17 failed; diagnostic archive written to ${outcome.output}`);
  } else {
    console.log(`DF-FU-17 passed; evidence archive written to ${outcome.output}`);
  }
}

const entryPoint = process.argv[1];
if (entryPoint !== undefined && pathToFileURL(entryPoint).href === import.meta.url) {
  main().catch((error) => {
    process.exitCode = 1;
    console.error(errorMessage(error));
  });
}
