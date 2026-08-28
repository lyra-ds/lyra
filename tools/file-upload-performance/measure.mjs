#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { arch, platform, release, tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { format } from 'prettier';
import { chromium } from 'playwright';
import { build, preview } from 'vite';

const TOOL_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY = resolve(TOOL_DIRECTORY, '..', '..');
const FIXTURE_SOURCE = join(TOOL_DIRECTORY, 'fixture');
const BASELINE_ROOT = join(REPOSITORY, 'docs', 'superpowers', 'baselines', 'lyra-v1');
const CURRENT_JSON = join(BASELINE_ROOT, 'current.json');
const COMPARISON_ROOT = join(BASELINE_ROOT, 'comparisons', 'file-upload');
const REQUIRE = createRequire(import.meta.url);
const REACT_REQUIRE = createRequire(join(REPOSITORY, 'packages', 'react', 'package.json'));

export const OPERATION_NAMES = [
  'selectionIntentDispatch',
  'controlledProgressReconciliation',
  'cancelIntent',
  'retryIntent',
  'confirmedRemovalFocusRecovery',
  'teardown',
];

const THRESHOLDS = {
  p95Ms: 100,
  worstMsExclusive: 250,
  longTaskMsExclusive: 50,
};
const PROFILE = {
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  locale: 'en-US',
  colorScheme: 'light',
};
const WARMUP_ITERATIONS = 3;
const RECORDED_ITERATIONS = 30;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.error) throw new Error(`could not run ${command}: ${result.error.message}`);
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} exited ${result.status}\n${result.stdout}\n${result.stderr}`.trim(),
    );
  }
  return result.stdout.trim();
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function sha256(source) {
  return createHash('sha256').update(source).digest('hex');
}

export function percentile(samples, percentileValue) {
  if (!Array.isArray(samples) || samples.length === 0) {
    throw new TypeError('percentile requires at least one sample');
  }
  if (percentileValue <= 0 || percentileValue > 100) {
    throw new RangeError('percentile must be greater than 0 and at most 100');
  }
  const sorted = [...samples].sort((left, right) => left - right);
  return sorted[Math.ceil((percentileValue / 100) * sorted.length) - 1];
}

export function operationResult(samples, longTasks) {
  return {
    iterations: samples.length,
    medianMs: percentile(samples, 50),
    p95Ms: percentile(samples, 95),
    worstMs: Math.max(...samples),
    longestTaskMs: Math.max(0, ...longTasks),
  };
}

export function selectLongTaskDurations(entries, startTime, endTime) {
  return entries
    .filter((entry) => entry.startTime < endTime && entry.startTime + entry.duration > startTime)
    .map((entry) => entry.duration);
}

export function withDeadline(
  operation,
  { label, timeoutMs = 10_000, schedule = setTimeout, cancel = clearTimeout },
) {
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = schedule(
      () => reject(new Error(`${label} did not reach its semantic completion marker`)),
      timeoutMs,
    );
  });
  return Promise.race([operation, deadline]).finally(() => cancel(timer));
}

export function validateRuntimeEvidence(evidence) {
  if (evidence.schemaVersion !== 1 || evidence.scenario !== 'DF-FU-15') {
    throw new Error('invalid FileUpload runtime evidence schema');
  }
  if (typeof evidence.revision !== 'string' || evidence.revision.length === 0) {
    throw new Error('runtime evidence requires a revision');
  }
  const names = Object.keys(evidence.operations);
  if (
    names.length !== OPERATION_NAMES.length ||
    OPERATION_NAMES.some((name) => !Object.hasOwn(evidence.operations, name))
  ) {
    throw new Error('runtime evidence requires exactly six operations');
  }
  if (evidence.environment.itemCount !== 100 || evidence.environment.activeAttemptCount !== 20) {
    throw new Error('runtime fixture must use 100 items with 20 active attempts');
  }
  if (JSON.stringify(evidence.thresholds) !== JSON.stringify(THRESHOLDS)) {
    throw new Error('runtime evidence must use the fixed thresholds');
  }
  const expectedViewport = { ...PROFILE.viewport, deviceScaleFactor: PROFILE.deviceScaleFactor };
  if (
    JSON.stringify(evidence.environment.viewport) !== JSON.stringify(expectedViewport) ||
    evidence.environment.locale !== PROFILE.locale ||
    evidence.environment.colorScheme !== PROFILE.colorScheme ||
    evidence.environment.warmupIterations !== WARMUP_ITERATIONS ||
    evidence.environment.recordedIterations !== RECORDED_ITERATIONS
  ) {
    throw new Error('runtime evidence must use the fixed production profile');
  }
  for (const name of OPERATION_NAMES) {
    const result = evidence.operations[name];
    if (result.iterations < 30) throw new Error(`${name} requires at least 30 iterations`);
    if (result.p95Ms > evidence.thresholds.p95Ms) {
      throw new Error(`${name} p95 ${result.p95Ms} ms exceeds 100 ms`);
    }
    if (result.worstMs >= evidence.thresholds.worstMsExclusive) {
      throw new Error(`${name} worst ${result.worstMs} ms must be below 250 ms`);
    }
    if (result.longestTaskMs >= evidence.thresholds.longTaskMsExclusive) {
      throw new Error(`${name} longest task ${result.longestTaskMs} ms must be below 50 ms`);
    }
  }
  return evidence;
}

function formatMilliseconds(value) {
  return `${value.toFixed(3)} ms`;
}

export async function renderRuntimeMarkdown(evidence) {
  const lines = [
    '# FileUpload runtime responsiveness evidence',
    '',
    `- Revision: \`${evidence.revision}\``,
    `- Measured at: \`${evidence.measuredAt}\``,
    `- Scenario: \`${evidence.scenario}\``,
    `- Exact command: \`${evidence.environment.exactCommand}\``,
    `- Chromium: ${evidence.environment.chromium.version}`,
    `- Chromium executable: \`${evidence.environment.chromium.executablePath}\``,
    `- Profile: ${evidence.environment.viewport.width}x${evidence.environment.viewport.height} at ${evidence.environment.viewport.deviceScaleFactor}x, ${evidence.environment.locale}, ${evidence.environment.colorScheme}`,
    `- Fixture: ${evidence.environment.itemCount} controlled items, ${evidence.environment.activeAttemptCount} active attempts`,
    `- Iterations: ${evidence.environment.warmupIterations} warm-up plus ${evidence.environment.recordedIterations} recorded per operation`,
    `- Packed React artifact: \`${evidence.environment.reactArtifact.tarball}\` (${evidence.environment.reactArtifact.sha256})`,
    `- Packed Styles artifact: \`${evidence.environment.stylesArtifact.tarball}\` (${evidence.environment.stylesArtifact.sha256})`,
    '',
    '## Results',
    '',
    '| Operation | Iterations | Median | p95 | Worst | Longest task | Result |',
    '| --- | ---: | ---: | ---: | ---: | ---: | --- |',
  ];
  for (const name of OPERATION_NAMES) {
    const result = evidence.operations[name];
    lines.push(
      `| ${name} | ${result.iterations} | ${formatMilliseconds(result.medianMs)} | ${formatMilliseconds(result.p95Ms)} | ${formatMilliseconds(result.worstMs)} | ${formatMilliseconds(result.longestTaskMs)} | PASS |`,
    );
  }
  lines.push(
    '',
    'Thresholds: p95 <= 100 ms, worst < 250 ms, and longest task < 50 ms. Operations complete on fixture-owned semantic markers; no arbitrary readiness sleep is used.',
    '',
  );
  return format(lines.join('\n'), { parser: 'markdown', printWidth: 100, proseWrap: 'preserve' });
}

function runtimeArtifactPaths(options = {}) {
  return {
    runtimeJson: options.runtimeJson,
    runtimeMarkdown: options.runtimeMarkdown,
  };
}

function canonicalRuntimeEvidence(evidence) {
  const environment = evidence.environment;
  return {
    schemaVersion: evidence.schemaVersion,
    scenario: evidence.scenario,
    revision: evidence.revision,
    measuredAt: evidence.measuredAt,
    environment: {
      operatingSystem: environment.operatingSystem,
      architecture: environment.architecture,
      node: environment.node,
      playwright: environment.playwright,
      vite: environment.vite,
      chromium: {
        version: environment.chromium.version,
        executablePath: environment.chromium.executablePath,
      },
      viewport: {
        width: environment.viewport.width,
        height: environment.viewport.height,
        deviceScaleFactor: environment.viewport.deviceScaleFactor,
      },
      locale: environment.locale,
      colorScheme: environment.colorScheme,
      warmupIterations: environment.warmupIterations,
      recordedIterations: environment.recordedIterations,
      itemCount: environment.itemCount,
      activeAttemptCount: environment.activeAttemptCount,
      exactCommand: environment.exactCommand,
      reactArtifact: {
        version: environment.reactArtifact.version,
        tarball: environment.reactArtifact.tarball,
        sha256: environment.reactArtifact.sha256,
      },
      stylesArtifact: {
        version: environment.stylesArtifact.version,
        tarball: environment.stylesArtifact.tarball,
        sha256: environment.stylesArtifact.sha256,
      },
    },
    thresholds: {
      p95Ms: evidence.thresholds.p95Ms,
      worstMsExclusive: evidence.thresholds.worstMsExclusive,
      longTaskMsExclusive: evidence.thresholds.longTaskMsExclusive,
    },
    operations: Object.fromEntries(
      OPERATION_NAMES.map((name) => {
        const result = evidence.operations[name];
        return [
          name,
          {
            iterations: result.iterations,
            medianMs: result.medianMs,
            p95Ms: result.p95Ms,
            worstMs: result.worstMs,
            longestTaskMs: result.longestTaskMs,
          },
        ];
      }),
    ),
  };
}

async function renderRuntimeJson(evidence) {
  return format(`${JSON.stringify(canonicalRuntimeEvidence(evidence), null, 2)}\n`, {
    parser: 'json',
  });
}

export async function writeRuntimeArtifacts(evidence, options) {
  validateRuntimeEvidence(evidence);
  const { runtimeJson, runtimeMarkdown } = runtimeArtifactPaths(options);
  if (!runtimeJson || !runtimeMarkdown) throw new Error('runtime artifact paths required');
  if (existsSync(runtimeJson) || existsSync(runtimeMarkdown)) {
    throw new Error('refusing to overwrite immutable FileUpload runtime evidence');
  }
  const report = await renderRuntimeMarkdown(evidence);
  const json = await renderRuntimeJson(evidence);
  mkdirSync(dirname(runtimeJson), { recursive: true });
  writeFileSync(runtimeJson, json);
  writeFileSync(runtimeMarkdown, report);
}

export async function validateRuntimeArtifacts(options) {
  const { runtimeJson, runtimeMarkdown } = runtimeArtifactPaths(options);
  if (!existsSync(runtimeJson)) throw new Error('runtime JSON does not exist');
  if (!existsSync(runtimeMarkdown)) throw new Error('runtime Markdown does not exist');
  const jsonSource = readFileSync(runtimeJson, 'utf8');
  const evidence = validateRuntimeEvidence(readJson(runtimeJson));
  if (jsonSource !== (await renderRuntimeJson(evidence))) {
    throw new Error('runtime JSON is not canonical');
  }
  if (readFileSync(runtimeMarkdown, 'utf8') !== (await renderRuntimeMarkdown(evidence))) {
    throw new Error('runtime Markdown is not the canonical peer');
  }
  return evidence;
}

function packageDirectory(name, resolver = REQUIRE) {
  return dirname(resolver.resolve(`${name}/package.json`));
}

function linkPackage(nodeModules, name, resolver) {
  const destination = join(nodeModules, ...name.split('/'));
  mkdirSync(dirname(destination), { recursive: true });
  symlinkSync(packageDirectory(name, resolver), destination, 'dir');
}

function packArtifact(tempRoot, packageKey) {
  const packDirectory = join(tempRoot, 'tarballs');
  mkdirSync(packDirectory, { recursive: true });
  const before = new Set(readdirSync(packDirectory));
  const packageSource = join(REPOSITORY, 'packages', packageKey);
  run('pnpm', ['pack', '--pack-destination', packDirectory], {
    cwd: packageSource,
  });
  const created = readdirSync(packDirectory).filter(
    (file) => file.endsWith('.tgz') && !before.has(file),
  );
  if (created.length !== 1) {
    throw new Error(`${packageKey} pack produced ${created.length} tarballs`);
  }
  const tarball = join(packDirectory, created[0]);
  const expectedName = `@lyra-ds/${packageKey}`;
  const installed = join(tempRoot, 'fixture', 'node_modules', ...expectedName.split('/'));
  mkdirSync(installed, { recursive: true });
  run('tar', ['-xzf', tarball, '--strip-components=1', '-C', installed]);
  const packageJson = readJson(join(installed, 'package.json'));
  if (packageJson.name !== expectedName) {
    throw new Error(`packed artifact contains ${packageJson.name}, expected ${expectedName}`);
  }
  return {
    installed,
    metadata: {
      version: packageJson.version,
      tarball: basename(tarball),
      sha256: sha256(readFileSync(tarball)),
    },
  };
}

async function prepareProductionFixture(tempRoot) {
  const fixture = join(tempRoot, 'fixture');
  cpSync(FIXTURE_SOURCE, fixture, { recursive: true });
  run('pnpm', ['--filter', '@lyra-ds/react', 'run', 'build'], { cwd: REPOSITORY });
  const reactArtifact = packArtifact(tempRoot, 'react');
  const stylesArtifact = packArtifact(tempRoot, 'styles');
  const nodeModules = join(fixture, 'node_modules');
  for (const dependency of ['react', 'react-dom', 'lucide-react']) {
    linkPackage(nodeModules, dependency, REACT_REQUIRE);
  }
  const output = join(fixture, 'dist');
  await build({
    configFile: false,
    root: fixture,
    logLevel: 'silent',
    mode: 'production',
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    build: { outDir: output, emptyOutDir: true, target: 'es2022', minify: 'esbuild' },
  });
  return {
    fixture,
    output,
    reactArtifact: reactArtifact.metadata,
    stylesArtifact: stylesArtifact.metadata,
  };
}

function previewUrl(server) {
  const address = server.httpServer.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Vite preview did not expose a TCP address');
  }
  return `http://127.0.0.1:${address.port}`;
}

async function measurePage(page) {
  const operationResults = {};
  for (const name of OPERATION_NAMES) {
    console.log(`Measuring FileUpload ${name}...`);
    for (let iteration = 0; iteration < WARMUP_ITERATIONS; iteration += 1) {
      await withDeadline(
        page.evaluate((operation) => window.fileUploadPerformance.run(operation), name),
        { label: name },
      );
    }
    const samples = [];
    const longTasks = [];
    for (let iteration = 0; iteration < RECORDED_ITERATIONS; iteration += 1) {
      const sample = await withDeadline(
        page.evaluate((operation) => window.fileUploadPerformance.run(operation), name),
        { label: name },
      );
      samples.push(sample.durationMs);
      longTasks.push(
        ...selectLongTaskDurations(sample.longTasks, sample.startTime, sample.endTime),
      );
    }
    operationResults[name] = operationResult(samples, longTasks);
  }
  return operationResults;
}

export async function cleanupRuntimeResources({ browser, server, tempRoot, remove = rmSync }) {
  const failures = [];
  for (const [label, cleanup] of [
    ['browser', browser ? () => browser.close() : null],
    ['server', server ? () => server.close() : null],
    ['temporary directory', () => remove(tempRoot, { recursive: true, force: true })],
  ]) {
    if (cleanup === null) continue;
    try {
      await cleanup();
    } catch (error) {
      failures.push({ label, error });
    }
  }
  if (failures.length > 0) {
    throw new AggregateError(
      failures.map(({ error }) => error),
      `runtime cleanup failed: ${failures
        .map(
          ({ label, error }) =>
            `${label} cleanup failed: ${error instanceof Error ? error.message : String(error)}`,
        )
        .join('; ')}`,
    );
  }
}

export async function runWithCleanup(operation, cleanup) {
  let result;
  let primaryError;
  let operationFailed = false;
  try {
    result = await operation();
  } catch (error) {
    operationFailed = true;
    primaryError = error;
  }

  let cleanupError;
  try {
    await cleanup();
  } catch (error) {
    cleanupError = error;
  }

  if (operationFailed) {
    if (cleanupError && primaryError instanceof Error) {
      Object.defineProperty(primaryError, 'cleanupError', {
        configurable: true,
        enumerable: false,
        value: cleanupError,
      });
      primaryError.message = `${primaryError.message}\nRuntime cleanup also failed: ${cleanupError.message}`;
    }
    throw primaryError;
  }
  if (cleanupError) throw cleanupError;
  return result;
}

export async function collectRuntimeEvidence({
  exactCommand = 'pnpm performance:file-upload',
} = {}) {
  const tempRoot = mkdtempSync(join(tmpdir(), 'lyra-file-upload-performance-'));
  let server;
  let browser;
  return runWithCleanup(
    async () => {
      const fixture = await prepareProductionFixture(tempRoot);
      server = await preview({
        configFile: false,
        root: fixture.fixture,
        logLevel: 'silent',
        preview: { host: '127.0.0.1', port: 0, strictPort: false },
      });
      const executablePath = chromium.executablePath();
      browser = await chromium.launch({ headless: true });
      const chromiumVersion = browser.version();
      const context = await browser.newContext(PROFILE);
      const page = await context.newPage();
      await page.goto(previewUrl(server), { waitUntil: 'load' });
      await page.evaluate(() => window.fileUploadPerformance.ready());
      const operations = await measurePage(page);
      const evidence = {
        schemaVersion: 1,
        scenario: 'DF-FU-15',
        revision: run('git', ['rev-parse', 'HEAD'], { cwd: REPOSITORY }),
        measuredAt: new Date().toISOString(),
        environment: {
          operatingSystem: `${platform()} ${release()}`,
          architecture: arch(),
          node: process.version,
          playwright: readJson(join(packageDirectory('playwright'), 'package.json')).version,
          vite: readJson(join(packageDirectory('vite'), 'package.json')).version,
          chromium: { version: chromiumVersion, executablePath },
          viewport: { ...PROFILE.viewport, deviceScaleFactor: PROFILE.deviceScaleFactor },
          locale: PROFILE.locale,
          colorScheme: PROFILE.colorScheme,
          warmupIterations: WARMUP_ITERATIONS,
          recordedIterations: RECORDED_ITERATIONS,
          itemCount: 100,
          activeAttemptCount: 20,
          exactCommand,
          reactArtifact: fixture.reactArtifact,
          stylesArtifact: fixture.stylesArtifact,
        },
        thresholds: THRESHOLDS,
        operations,
      };
      return validateRuntimeEvidence(evidence);
    },
    () => cleanupRuntimeResources({ browser, server, tempRoot }),
  );
}

function assertCleanWorktree() {
  const dirty = run('git', ['status', '--porcelain'], { cwd: REPOSITORY });
  if (dirty) throw new Error(`refusing runtime collection from a dirty worktree:\n${dirty}`);
}

async function readAcceptedRuntime() {
  if (!existsSync(CURRENT_JSON)) throw new Error('no accepted FileUpload runtime evidence');
  const pointer = readJson(CURRENT_JSON);
  const revision = pointer.fileUpload?.revision;
  if (typeof revision !== 'string' || revision.length === 0) {
    throw new Error('invalid FileUpload current baseline pointer');
  }
  return validateRuntimeArtifacts({
    runtimeJson: join(COMPARISON_ROOT, `${revision}-runtime.json`),
    runtimeMarkdown: join(COMPARISON_ROOT, `${revision}-runtime.md`),
  });
}

function assertAcceptedArtifactPair(expected, actual) {
  for (const [label, expectedArtifact, actualArtifact] of [
    ['React', expected.environment.reactArtifact, actual.environment.reactArtifact],
    ['Styles', expected.environment.stylesArtifact, actual.environment.stylesArtifact],
  ]) {
    if (expectedArtifact.sha256 !== actualArtifact.sha256) {
      throw new Error(
        `accepted packed ${label} artifact mismatch: accepted=${expectedArtifact.sha256}, fresh=${actualArtifact.sha256}`,
      );
    }
  }
}

export async function runPerformanceCli(
  args,
  {
    collect = collectRuntimeEvidence,
    ensureClean = assertCleanWorktree,
    readAccepted = readAcceptedRuntime,
  } = {},
) {
  if (args.length > 1 || (args.length === 1 && args[0] !== '--check')) {
    throw new Error('usage: node tools/file-upload-performance/measure.mjs [--check]');
  }
  if (args[0] === '--check') {
    const expected = await readAccepted();
    const actual = await collect({ exactCommand: expected.environment.exactCommand });
    validateRuntimeEvidence(actual);
    assertAcceptedArtifactPair(expected, actual);
    return `FileUpload runtime check OK at ${actual.revision} against accepted ${expected.revision}.`;
  }

  ensureClean();
  const evidence = await collect();
  validateRuntimeEvidence(evidence);
  return JSON.stringify(evidence, null, 2);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runPerformanceCli(process.argv.slice(2))
    .then((message) => console.log(message))
    .catch((error) => {
      console.error(`file-upload-performance FAILED: ${error.message}`);
      process.exitCode = 1;
    });
}
