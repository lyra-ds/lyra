import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { validateEvidencePair } from './evidence.mjs';
import {
  operationResult,
  percentile,
  selectLongTaskDurations,
  renderRuntimeMarkdown,
  runPerformanceCli,
  validateRuntimeEvidence,
  withDeadline,
  writeRuntimeArtifacts,
} from './measure.mjs';

const operations = [
  'selectionIntentDispatch',
  'controlledProgressReconciliation',
  'cancelIntent',
  'retryIntent',
  'confirmedRemovalFocusRecovery',
  'teardown',
];

function passingRuntimeFixture({ revision = 'candidate-revision', duration = 10 } = {}) {
  return {
    schemaVersion: 1,
    scenario: 'DF-FU-15',
    revision,
    measuredAt: '2026-08-16T00:00:00.000Z',
    environment: {
      chromium: { version: 'Chromium 140.0.0', executablePath: '/pinned/chromium' },
      viewport: { width: 1280, height: 720, deviceScaleFactor: 1 },
      locale: 'en-US',
      colorScheme: 'light',
      warmupIterations: 3,
      recordedIterations: 30,
      itemCount: 100,
      activeAttemptCount: 20,
      exactCommand: 'pnpm performance:file-upload',
      reactArtifact: {
        version: '0.5.0',
        tarball: 'lyra-ds-react-0.5.0.tgz',
        sha256: 'react-artifact-sha256',
      },
      stylesArtifact: {
        version: '0.5.0',
        tarball: 'lyra-ds-styles-0.5.0.tgz',
        sha256: 'styles-artifact-sha256',
      },
    },
    thresholds: { p95Ms: 100, worstMsExclusive: 250, longTaskMsExclusive: 50 },
    operations: Object.fromEntries(
      operations.map((name) => [
        name,
        operationResult(
          Array.from({ length: 30 }, () => duration),
          [],
        ),
      ]),
    ),
  };
}

test('percentile and operation statistics use sorted nearest-rank values', () => {
  const samples = [40, 1, 20, 10, 30];

  assert.equal(percentile(samples, 50), 20);
  assert.equal(percentile(samples, 95), 40);
  assert.deepEqual(operationResult(samples, [12, 48, 7]), {
    iterations: 5,
    medianMs: 20,
    p95Ms: 40,
    worstMs: 40,
    longestTaskMs: 48,
  });
});

test('long-task attribution includes entries that overlap the measured operation', () => {
  assert.deepEqual(
    selectLongTaskDurations(
      [
        { startTime: 90, duration: 30 },
        { startTime: 125, duration: 10 },
        { startTime: 140, duration: 20 },
      ],
      100,
      130,
    ),
    [30, 10],
  );
});

test('semantic operation deadlines fail instead of hanging the runner', async () => {
  await assert.rejects(
    () =>
      withDeadline(new Promise(() => {}), {
        label: 'cancelIntent',
        schedule: (callback) => {
          queueMicrotask(callback);
          return 1;
        },
        cancel: () => {},
      }),
    /cancelIntent did not reach its semantic completion marker/,
  );
});

test('runtime validation requires exactly six operations and at least 30 iterations', () => {
  const missingOperation = passingRuntimeFixture();
  delete missingOperation.operations.teardown;
  assert.throws(() => validateRuntimeEvidence(missingOperation), /exactly six operations/);

  const tooFewSamples = passingRuntimeFixture();
  tooFewSamples.operations.cancelIntent.iterations = 29;
  assert.throws(() => validateRuntimeEvidence(tooFewSamples), /at least 30 iterations/);
});

test('runtime validation rejects p95, worst, and long-task threshold failures', () => {
  for (const [field, value, message] of [
    ['p95Ms', 100.01, /p95/],
    ['worstMs', 250, /worst/],
    ['longestTaskMs', 50, /longest task/],
  ]) {
    const evidence = passingRuntimeFixture();
    evidence.operations.retryIntent[field] = value;
    assert.throws(() => validateRuntimeEvidence(evidence), message);
  }

  const belowBoundary = passingRuntimeFixture();
  belowBoundary.operations.retryIntent.longestTaskMs = 49.99;
  assert.doesNotThrow(() => validateRuntimeEvidence(belowBoundary));
});

test('runtime validation refuses weakened thresholds or a changed production profile', () => {
  const weakened = passingRuntimeFixture();
  weakened.thresholds.p95Ms = 101;
  assert.throws(() => validateRuntimeEvidence(weakened), /fixed thresholds/);

  const changedProfile = passingRuntimeFixture();
  changedProfile.environment.viewport.width = 1024;
  assert.throws(() => validateRuntimeEvidence(changedProfile), /fixed production profile/);
});

test('runtime JSON and Markdown are immutable canonical peers', async () => {
  const fixture = mkdtempSync(join(tmpdir(), 'lyra-runtime-test-'));
  try {
    const evidence = passingRuntimeFixture();
    const paths = {
      runtimeJson: join(fixture, 'candidate-revision-runtime.json'),
      runtimeMarkdown: join(fixture, 'candidate-revision-runtime.md'),
    };

    await writeRuntimeArtifacts(evidence, paths);
    assert.equal(
      readFileSync(paths.runtimeMarkdown, 'utf8'),
      await renderRuntimeMarkdown(evidence),
    );
    assert.match(readFileSync(paths.runtimeMarkdown, 'utf8'), /longest task < 50 ms/);
    await assert.rejects(
      () => writeRuntimeArtifacts(evidence, paths),
      /refusing to overwrite immutable FileUpload runtime evidence/,
    );
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('performance --check recollects once against the accepted profile without writes', async () => {
  const expected = passingRuntimeFixture();
  let collections = 0;

  const message = await runPerformanceCli(['--check'], {
    collect: async () => {
      collections += 1;
      return passingRuntimeFixture();
    },
    readAccepted: async () => expected,
  });

  assert.match(message, /runtime check OK/);
  assert.equal(collections, 1);

  const afterEvidenceCommit = await runPerformanceCli(['--check'], {
    collect: async () => passingRuntimeFixture({ revision: 'evidence-commit-revision' }),
    readAccepted: async () => expected,
  });
  assert.match(afterEvidenceCommit, /accepted candidate-revision/);
});

test('performance collection mode refuses a dirty worktree before launching Chromium', async () => {
  let collections = 0;
  await assert.rejects(
    () =>
      runPerformanceCli([], {
        ensureClean: () => {
          throw new Error('refusing runtime collection from a dirty worktree');
        },
        collect: async () => {
          collections += 1;
          return passingRuntimeFixture();
        },
      }),
    /dirty worktree/,
  );
  assert.equal(collections, 0);
});

test('evidence pairing requires one revision and the identical packed React artifact', () => {
  const runtime = passingRuntimeFixture();
  const bundle = {
    revision: 'candidate-revision',
    environment: {
      packages: {
        '@lyra-ds/react': { sha256: 'react-artifact-sha256' },
        '@lyra-ds/styles': { sha256: 'styles-artifact-sha256' },
      },
    },
  };

  assert.doesNotThrow(() =>
    validateEvidencePair({ headRevision: 'candidate-revision', bundle, runtime }),
  );

  runtime.environment.reactArtifact.sha256 = 'different-artifact';
  assert.throws(
    () => validateEvidencePair({ headRevision: 'candidate-revision', bundle, runtime }),
    /packed React artifact mismatch/,
  );

  runtime.environment.reactArtifact.sha256 = 'react-artifact-sha256';
  runtime.environment.stylesArtifact.sha256 = 'different-artifact';
  assert.throws(
    () => validateEvidencePair({ headRevision: 'candidate-revision', bundle, runtime }),
    /packed Styles artifact mismatch/,
  );
});
