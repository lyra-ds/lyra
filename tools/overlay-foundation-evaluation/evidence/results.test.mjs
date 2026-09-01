import assert from 'node:assert/strict';
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, test } from 'node:test';

import { sha256 } from '../runner/artifacts.mjs';
import { canonicalJson, summarizeAttempts, validateAttempt, writeAttempt } from './results.mjs';

const temporaryRoots = [];

const firstAttempt = {
  schemaVersion: 1,
  recordType: 'scenario',
  runId: '20260831T120000Z-core-001',
  candidateId: 'incumbent',
  contractId: 'OF-MODAL',
  scenarioId: 'of-modal.initial-focus.v1',
  cellId: 'chromium-react18-default',
  attemptNumber: 1,
  result: 'FAIL',
  classification: 'product',
  expected: { focus: 'first-focusable' },
  observed: { focus: 'body' },
  artifactPaths: ['raw/focus.json'],
};

function passingRetry(overrides = {}) {
  const { classification: ignoredClassification, ...passingBase } = firstAttempt;
  return {
    ...passingBase,
    attemptNumber: 2,
    result: 'PASS',
    observed: { focus: 'first-focusable' },
    ...overrides,
  };
}

async function makeEvidenceRoot() {
  const path = await mkdtemp(join(tmpdir(), 'lyra-overlay-results-'));
  temporaryRoots.push(path);
  return path;
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map(async (path) => {
      const { rm } = await import('node:fs/promises');
      await rm(path, { recursive: true, force: true });
    }),
  );
});

test('accepts a complete attempt and rejects unknown keys', () => {
  assert.deepEqual(validateAttempt(firstAttempt), []);
  assert.match(validateAttempt({ ...firstAttempt, score: 91 }).join('\n'), /unsupported key/u);
});

for (const classification of ['unknown', 'flaky', 'vendor']) {
  test(`rejects classification ${classification}`, () => {
    assert.match(
      validateAttempt({ ...firstAttempt, classification }).join('\n'),
      /classification is invalid/u,
    );
  });
}

test('requires classifications for failures and omits them for passes', () => {
  const unavailable = { ...firstAttempt, result: 'unavailable', classification: 'infrastructure' };
  assert.deepEqual(validateAttempt(unavailable), []);
  assert.match(
    validateAttempt({ ...firstAttempt, classification: undefined }).join('\n'),
    /classification is required/u,
  );
  assert.match(
    validateAttempt({ ...passingRetry(), classification: 'product' }).join('\n'),
    /PASS.*omit classification/u,
  );
});

test('accepts preflight evidence without inventing a contract result', () => {
  assert.deepEqual(
    validateAttempt({
      schemaVersion: 1,
      recordType: 'preflight',
      runId: '20260831T120000Z-core-001',
      candidateId: 'incumbent',
      stage: 'artifact',
      attemptNumber: 1,
      result: 'PASS',
      observed: { artifacts: 3 },
      artifactPaths: ['incumbent.json'],
    }),
    [],
  );
});

test('keeps scenario and preflight schemas closed and discriminated', () => {
  assert.match(
    validateAttempt({ ...firstAttempt, stage: 'artifact' }).join('\n'),
    /stage is an unsupported key/u,
  );
  const preflight = {
    schemaVersion: 1,
    recordType: 'preflight',
    runId: firstAttempt.runId,
    candidateId: firstAttempt.candidateId,
    stage: 'artifact',
    attemptNumber: 1,
    result: 'PASS',
    observed: {},
    artifactPaths: [],
    contractId: 'OF-MODAL',
  };
  assert.match(validateAttempt(preflight).join('\n'), /contractId is an unsupported key/u);
  assert.match(
    validateAttempt({ ...preflight, recordType: 'score' }).join('\n'),
    /recordType is invalid/u,
  );
});

test('rejects invalid preflight stages and non-JSON observations', () => {
  const preflight = {
    schemaVersion: 1,
    recordType: 'preflight',
    runId: firstAttempt.runId,
    candidateId: firstAttempt.candidateId,
    stage: 'download',
    attemptNumber: 1,
    result: 'PASS',
    observed: { bytes: Number.POSITIVE_INFINITY },
    artifactPaths: [],
  };
  const errors = validateAttempt(preflight).join('\n');
  assert.match(errors, /stage is invalid/u);
  assert.match(errors, /observed.*JSON/u);
});

for (const [label, mutate] of [
  [
    'run ID parent traversal',
    (attempt) => {
      attempt.runId = '..';
    },
  ],
  [
    'scenario ID parent traversal',
    (attempt) => {
      attempt.scenarioId = '../escape';
    },
  ],
  [
    'cell ID separator',
    (attempt) => {
      attempt.cellId = 'chromium/react18';
    },
  ],
  [
    'artifact parent traversal',
    (attempt) => {
      attempt.artifactPaths = ['raw/../secret.json'];
    },
  ],
  [
    'artifact absolute path',
    (attempt) => {
      attempt.artifactPaths = ['/etc/passwd'];
    },
  ],
  [
    'artifact Windows separator',
    (attempt) => {
      attempt.artifactPaths = ['raw\\secret.json'];
    },
  ],
]) {
  test(`rejects ${label}`, () => {
    const attempt = structuredClone(firstAttempt);
    mutate(attempt);
    assert.match(validateAttempt(attempt).join('\n'), /invalid|traversal-safe/u);
  });
}

test('canonicalizes nested JSON objects without reordering arrays', () => {
  const value = { z: 1, a: { y: 2, x: [{ b: true, a: false }, 3] } };
  assert.equal(
    canonicalJson(value),
    '{\n  "a": {\n    "x": [\n      {\n        "a": false,\n        "b": true\n      },\n      3\n    ],\n    "y": 2\n  },\n  "z": 1\n}\n',
  );
  assert.throws(() => canonicalJson({ invalid: undefined }), /JSON/u);
});

test('retains own __proto__ properties in canonical written evidence', async () => {
  const evidenceRoot = await makeEvidenceRoot();
  const payload = JSON.parse('{"__proto__":{"polluted":true},"a":1}');
  const canonicalPayload = canonicalJson(payload);
  assert.equal(canonicalPayload, '{\n  "__proto__": {\n    "polluted": true\n  },\n  "a": 1\n}\n');
  assert.notEqual(canonicalPayload, canonicalJson({ a: 1 }));
  assert.equal(Object.prototype.polluted, undefined);

  const attempt = { ...firstAttempt, expected: payload, observed: payload };
  assert.deepEqual(validateAttempt(attempt), []);
  const written = await writeAttempt({ evidenceRoot, attempt });
  const bytes = await readFile(written.path);
  const stored = JSON.parse(bytes.toString('utf8'));
  assert.equal(Object.hasOwn(stored.expected, '__proto__'), true);
  assert.equal(Object.hasOwn(stored.observed, '__proto__'), true);
  assert.equal(written.sha256, sha256(bytes));
  const withoutProto = { ...attempt, expected: { a: 1 }, observed: { a: 1 } };
  assert.notEqual(written.sha256, sha256(Buffer.from(canonicalJson(withoutProto))));
  assert.equal(Object.prototype.polluted, undefined);
});

test('writes canonical immutable scenario evidence with a reusable checksum', async () => {
  const evidenceRoot = await makeEvidenceRoot();
  const written = await writeAttempt({ evidenceRoot, attempt: firstAttempt });
  assert.equal(
    written.path,
    join(
      evidenceRoot,
      'attempts',
      'scenario',
      'incumbent',
      'OF-MODAL',
      'of-modal.initial-focus.v1',
      'chromium-react18-default',
      'attempt-1.json',
    ),
  );
  const bytes = await readFile(written.path);
  assert.equal(bytes.toString('utf8'), canonicalJson(firstAttempt));
  assert.equal(written.sha256, sha256(bytes));
  assert.equal((await stat(written.path)).mode & 0o777, 0o600);
});

test('uses a separate preflight attempt path layout', async () => {
  const evidenceRoot = await makeEvidenceRoot();
  const preflight = {
    schemaVersion: 1,
    recordType: 'preflight',
    runId: firstAttempt.runId,
    candidateId: 'incumbent',
    stage: 'repository',
    attemptNumber: 1,
    result: 'PASS',
    observed: { clean: true },
    artifactPaths: [],
  };
  const written = await writeAttempt({ evidenceRoot, attempt: preflight });
  assert.equal(
    written.path,
    join(evidenceRoot, 'attempts', 'preflight', 'incumbent', 'repository', 'attempt-1.json'),
  );
});

test('preserves first attempt when a retry passes', async () => {
  const evidenceRoot = await makeEvidenceRoot();
  const first = await writeAttempt({ evidenceRoot, attempt: firstAttempt });
  const retryAttempt = passingRetry();
  const retry = await writeAttempt({ evidenceRoot, attempt: retryAttempt });
  assert.notEqual(first.path, retry.path);
  const summary = summarizeAttempts([retryAttempt, firstAttempt]);
  assert.equal(summary.effectiveResult, 'FAIL');
  assert.equal(summary.effectiveClassification, 'product');
  assert.equal(summary.firstAttemptNumber, 1);
  assert.equal(summary.retryCount, 1);
  assert.equal(summary.firstAttemptSha256, sha256(Buffer.from(canonicalJson(firstAttempt))));
  assert.equal(Object.hasOwn(summary, 'score'), false);
  assert.equal(Object.hasOwn(summary, 'winner'), false);
});

test('cannot overwrite an existing attempt', async () => {
  const evidenceRoot = await makeEvidenceRoot();
  await writeAttempt({ evidenceRoot, attempt: firstAttempt });
  await assert.rejects(writeAttempt({ evidenceRoot, attempt: firstAttempt }), /already exists/u);
});

for (const descendant of [['attempts'], ['attempts', 'scenario', 'incumbent']]) {
  test(`rejects an evidence descendant symlink at ${descendant.join('/')}`, async () => {
    const evidenceRoot = await makeEvidenceRoot();
    const foreignRoot = await makeEvidenceRoot();
    const foreignSentinel = join(foreignRoot, 'sentinel.txt');
    const sentinelBytes = Buffer.from('foreign evidence target must remain unchanged\n');
    await writeFile(foreignSentinel, sentinelBytes);
    await mkdir(join(evidenceRoot, ...descendant.slice(0, -1)), { recursive: true });
    await symlink(foreignRoot, join(evidenceRoot, ...descendant), 'dir');
    const foreignBefore = await readdir(foreignRoot);

    await assert.rejects(
      writeAttempt({ evidenceRoot, attempt: firstAttempt }),
      /symbolic link|containment/u,
    );

    assert.deepEqual(await readFile(foreignSentinel), sentinelBytes);
    assert.deepEqual(await readdir(foreignRoot), foreignBefore);
  });
}

test('anchors the final write against deterministic parent replacement', async () => {
  const evidenceRoot = await makeEvidenceRoot();
  const foreignRoot = await makeEvidenceRoot();
  const foreignSentinel = join(foreignRoot, 'sentinel.txt');
  const sentinelBytes = Buffer.from('foreign evidence target must remain unchanged\n');
  const displacedAttempts = join(evidenceRoot, 'displaced-attempts');
  await writeFile(foreignSentinel, sentinelBytes);
  await mkdir(
    join(
      foreignRoot,
      'scenario',
      'incumbent',
      'OF-MODAL',
      'of-modal.initial-focus.v1',
      'chromium-react18-default',
    ),
    { recursive: true },
  );
  const foreignBefore = await readdir(foreignRoot, { recursive: true });
  let seamCalls = 0;

  let failure;
  try {
    await writeAttempt(
      { evidenceRoot, attempt: firstAttempt },
      {
        async beforeFinalOpen() {
          seamCalls += 1;
          await rename(join(evidenceRoot, 'attempts'), displacedAttempts);
          await symlink(foreignRoot, join(evidenceRoot, 'attempts'), 'dir');
        },
      },
    );
  } catch (error) {
    failure = error;
  }

  assert.notEqual(failure, undefined);
  const failureMessages =
    failure instanceof AggregateError
      ? failure.errors.map((error) => error.message).join('\n')
      : failure.message;
  assert.match(failureMessages, /identity changed|symbolic link|containment/u);
  assert.equal(seamCalls, 1);
  assert.deepEqual(await readFile(foreignSentinel), sentinelBytes);
  assert.deepEqual(await readdir(foreignRoot, { recursive: true }), foreignBefore);
  assert.equal(
    (await readdir(displacedAttempts, { recursive: true })).some((path) =>
      path.endsWith('attempt-1.json'),
    ),
    false,
  );
});

for (const [label, attempts, pattern] of [
  ['an attempt sequence gap', [firstAttempt, passingRetry({ attemptNumber: 3 })], /contiguous/u],
  ['duplicate attempt numbers', [firstAttempt, passingRetry({ attemptNumber: 1 })], /duplicate/u],
  ['a missing attempt 1', [passingRetry()], /start at 1/u],
  [
    'a changed candidate identity',
    [firstAttempt, passingRetry({ candidateId: 'radix' })],
    /identity/u,
  ],
  [
    'a changed scenario identity',
    [firstAttempt, passingRetry({ scenarioId: 'of-modal.escape.v1' })],
    /identity/u,
  ],
  [
    'a changed run identity',
    [firstAttempt, passingRetry({ runId: '20260831T130000Z-core-002' })],
    /identity/u,
  ],
]) {
  test(`rejects ${label}`, () => {
    assert.throws(() => summarizeAttempts(attempts), pattern);
  });
}
