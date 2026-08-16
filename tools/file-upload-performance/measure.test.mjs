import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { format } from 'prettier';
import { validateEvidencePair } from './evidence.mjs';
import {
  operationResult,
  percentile,
  selectLongTaskDurations,
  renderRuntimeMarkdown,
  runPerformanceCli,
  validateRuntimeArtifacts,
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

test('confirmed removal requires focus on the deterministic fallback action', async () => {
  const focusContract = await import('./fixture/removal-focus.mjs').catch(() => ({}));
  assert.equal(typeof focusContract.isConfirmedRemovalFocusRecovery, 'function');

  const removedControl = { isConnected: false };
  const expectedTarget = { isConnected: true, disabled: false };
  const incidentalTarget = { isConnected: true, disabled: false };

  assert.equal(
    focusContract.isConfirmedRemovalFocusRecovery({
      removedControl,
      expectedTarget,
      activeElement: incidentalTarget,
    }),
    false,
  );
  assert.equal(
    focusContract.isConfirmedRemovalFocusRecovery({
      removedControl,
      expectedTarget,
      activeElement: expectedTarget,
    }),
    true,
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
      readFileSync(paths.runtimeJson, 'utf8'),
      await format(`${JSON.stringify(evidence, null, 2)}\n`, { parser: 'json' }),
    );
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

test('runtime artifact validation rejects reformatted or reordered JSON', async () => {
  const fixture = mkdtempSync(join(tmpdir(), 'lyra-runtime-canonical-test-'));
  try {
    const evidence = passingRuntimeFixture();
    const paths = {
      runtimeJson: join(fixture, 'candidate-revision-runtime.json'),
      runtimeMarkdown: join(fixture, 'candidate-revision-runtime.md'),
    };
    await writeRuntimeArtifacts(evidence, paths);

    const { revision, ...rest } = evidence;
    writeFileSync(
      paths.runtimeJson,
      await format(`${JSON.stringify({ revision, ...rest }, null, 2)}\n`, { parser: 'json' }),
    );
    await assert.rejects(() => validateRuntimeArtifacts(paths), /runtime JSON is not canonical/);

    writeFileSync(paths.runtimeJson, JSON.stringify(evidence));
    await assert.rejects(() => validateRuntimeArtifacts(paths), /runtime JSON is not canonical/);
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

test('performance --check rejects fresh React or Styles artifacts that differ from accepted peers', async () => {
  const expected = passingRuntimeFixture();

  for (const [mutate, message] of [
    [
      (evidence) => (evidence.environment.reactArtifact.sha256 = 'different-react-artifact'),
      /accepted packed React artifact mismatch/,
    ],
    [
      (evidence) => (evidence.environment.stylesArtifact.sha256 = 'different-styles-artifact'),
      /accepted packed Styles artifact mismatch/,
    ],
  ]) {
    const actual = passingRuntimeFixture({ revision: 'later-documentation-revision' });
    mutate(actual);

    await assert.rejects(
      () =>
        runPerformanceCli(['--check'], {
          collect: async () => actual,
          readAccepted: async () => expected,
        }),
      message,
    );
  }
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

test('runtime cleanup attempts browser, server, and temp removal while preserving primary errors', async () => {
  const performanceMeasure = await import('./measure.mjs');
  assert.equal(typeof performanceMeasure.cleanupRuntimeResources, 'function');
  assert.equal(typeof performanceMeasure.runWithCleanup, 'function');

  const calls = [];
  const browserFailure = new Error('browser close failed');
  await assert.rejects(
    () =>
      performanceMeasure.cleanupRuntimeResources({
        browser: {
          close: async () => {
            calls.push('browser');
            throw browserFailure;
          },
        },
        server: {
          close: async () => {
            calls.push('server');
          },
        },
        tempRoot: '/tmp/runtime-cleanup-fixture',
        remove: () => {
          calls.push('temp');
        },
      }),
    (error) => {
      assert.match(error.message, /browser cleanup failed/);
      assert.deepEqual(error.errors, [browserFailure]);
      return true;
    },
  );
  assert.deepEqual(calls, ['browser', 'server', 'temp']);

  const primary = new Error('collection failed');
  const cleanup = new Error('cleanup also failed');
  await assert.rejects(
    () =>
      performanceMeasure.runWithCleanup(
        async () => {
          throw primary;
        },
        async () => {
          throw cleanup;
        },
      ),
    (error) => {
      assert.equal(error, primary);
      assert.equal(error.cleanupError, cleanup);
      assert.match(error.message, /collection failed/);
      return true;
    },
  );
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
