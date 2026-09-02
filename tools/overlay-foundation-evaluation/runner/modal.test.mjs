import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { MODAL_SCENARIOS, MODAL_WAVE_CELLS, modalScenariosForCell } from '../contracts/modal.mjs';
import { writeAttempt } from '../evidence/results.mjs';

const modulePath = new URL('./modal.mjs', import.meta.url);
const revision = '1'.repeat(40);
const forbiddenCells = [
  'bundle-standalone',
  'bundle-composition',
  'packed-esm',
  'packed-cjs',
  'packed-types',
  'consumer-vite',
  'consumer-next',
  'consumer-commonjs',
];

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function fixture(t, candidateIds = ['incumbent', 'radix', 'base-ui', 'zag']) {
  const root = await mkdtemp(join(tmpdir(), 'lyra-modal-runner-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const repositoryRoot = join(root, 'repository');
  const evidenceRoot = join(root, 'evidence');
  const temporaryDirectory = join(root, 'tmp');
  await mkdir(repositoryRoot);
  await mkdir(evidenceRoot);
  await mkdir(temporaryDirectory);
  const manifest = {
    schemaVersion: 1,
    lyraRevision: revision,
    toolchain: { node: '24.18.0', pnpm: '11.13.1' },
    candidates: candidateIds.map((id) => ({ id, artifacts: [] })),
  };
  return { evidenceRoot, manifest, repositoryRoot, root, temporaryDirectory };
}

function expectedObservation(scenario) {
  return { ...structuredClone(scenario.expected), diagnostics: {} };
}

async function seedCoreAttempt(
  setup,
  candidate,
  result = 'PASS',
  classification,
  mutateAttempt = (attempt) => attempt,
) {
  const runId = `core-${revision.slice(0, 12)}`;
  const bytes = Buffer.from(`artifact:${candidate.id}`);
  const digest = sha256(bytes);
  const relativePath = `files/${runId}/${candidate.id}/artifacts/${digest}.tgz`;
  if (result === 'PASS') {
    const artifactPath = join(setup.evidenceRoot, relativePath);
    await mkdir(join(artifactPath, '..'), { recursive: true });
    await writeFile(artifactPath, bytes);
  }
  const attempt = mutateAttempt({
    schemaVersion: 1,
    recordType: 'preflight',
    runId,
    candidateId: candidate.id,
    stage: 'artifact',
    attemptNumber: 1,
    result,
    ...(result === 'PASS' ? {} : { classification }),
    observed:
      result === 'PASS'
        ? {
            artifacts: [
              {
                bytes: bytes.length,
                license: 'MIT',
                lifecycleScripts: {},
                packageName: `synthetic-${candidate.id}`,
                packageVersion: '1.0.0',
                path: relativePath,
                record: {
                  source: candidate.id === 'incumbent' ? 'workspace-pack' : 'registry',
                  name: `synthetic-${candidate.id}`,
                  version: '1.0.0',
                  sha256: digest,
                  ...(candidate.id === 'incumbent' ? {} : { license: 'MIT' }),
                },
                sha256: digest,
              },
            ],
          }
        : { message: 'synthetic preflight failure', scope: 'candidate' },
    artifactPaths: result === 'PASS' ? [relativePath] : [],
  });
  await writeAttempt({ evidenceRoot: setup.evidenceRoot, attempt });
  return attempt;
}

function dependencies(setup, overrides = {}) {
  const calls = overrides.calls ?? [];
  return {
    calls,
    async runCorePreflight() {
      calls.push('core');
      const candidates = [];
      for (const candidate of setup.manifest.candidates) {
        const state = overrides.preflight?.[candidate.id] ?? { result: 'PASS' };
        const attempt = await seedCoreAttempt(
          setup,
          candidate,
          state.result,
          state.classification ?? 'fixture',
          overrides.mutateCoreAttempt ?? ((value) => value),
        );
        await overrides.afterSeedCoreAttempt?.({ attempt, candidate });
        candidates.push({
          candidateId: candidate.id,
          stage: attempt.stage,
          result: attempt.result,
          ...(attempt.classification === undefined
            ? {}
            : { classification: attempt.classification }),
        });
      }
      return {
        schemaVersion: 1,
        runId: `core-${revision.slice(0, 12)}`,
        result: candidates.every(({ result }) => result === 'PASS') ? 'PASS' : 'FAIL',
        candidates,
      };
    },
    async resolveCandidateEntry({ candidate }) {
      return `/repository/candidates/modal/${candidate.id}.mjs`;
    },
    async prepareModalFixture({ reactVersion, runRoot }) {
      const fixtureRoot = join(runRoot, reactVersion);
      await mkdir(fixtureRoot);
      const clientHtmlPath = join(fixtureRoot, 'index.html');
      const ssrPath = join(fixtureRoot, 'entry-server.mjs');
      await writeFile(clientHtmlPath, '<main></main>');
      await writeFile(ssrPath, 'export default true;\n');
      calls.push(`prepare:${reactVersion}`);
      return { clientHtmlPath, ssrPath };
    },
    async runModalCell(input) {
      calls.push(`scenario:${input.candidate.id}:${input.cellId}:${input.scenario.scenarioId}`);
      if (overrides.runModalCell) return overrides.runModalCell(input, calls);
      return input.policy.reactVersions.map((reactVersion) => ({
        reactVersion,
        observation: expectedObservation(input.scenario),
      }));
    },
    async runCommand(command, args) {
      if (command === 'git' && args[0] === 'status') {
        return { stdout: overrides.repositoryStatus?.(calls) ?? '' };
      }
      throw new Error(`unexpected command: ${command} ${args.join(' ')}`);
    },
    ...(overrides.dependencies ?? {}),
  };
}

async function run(setup, deps, input = {}) {
  const { runModalWave } = await import(modulePath);
  return runModalWave(
    {
      manifest: setup.manifest,
      repositoryRoot: setup.repositoryRoot,
      tmpdir: setup.temporaryDirectory,
      evidenceRoot: setup.evidenceRoot,
      playwright: {},
      fetchImpl: async () => {
        throw new Error('unexpected fetch');
      },
      runCommand: deps.runCommand,
      ...input,
    },
    deps,
  );
}

async function scenarioAttempts(evidenceRoot) {
  const root = join(evidenceRoot, 'attempts', `modal-${revision.slice(0, 12)}`, 'scenario');
  const records = [];
  async function visit(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const target = join(path, entry.name);
      if (entry.isDirectory()) await visit(target);
      else records.push(JSON.parse(await readFile(target, 'utf8')));
    }
  }
  await visit(root);
  return records;
}

test('runs core before scenarios and records failed preflight cells unavailable without blocking candidates', async (t) => {
  const setup = await fixture(t, ['incumbent', 'radix']);
  const calls = [];
  const deps = dependencies(setup, {
    calls,
    preflight: { incumbent: { result: 'FAIL', classification: 'packaging' } },
  });
  const summary = await run(setup, deps);
  assert.equal(calls[0], 'core');
  assert.equal(
    calls.some((call) => call.startsWith('scenario:incumbent:')),
    false,
  );
  assert.equal(
    calls.some((call) => call.startsWith('scenario:radix:')),
    true,
  );
  assert.equal(summary.candidates[0].counts.unavailable > 0, true);
  assert.equal(summary.candidates[1].counts.PASS > 0, true);
});

test('writes attempt 1 exactly once for every required modal scenario and cell', async (t) => {
  const setup = await fixture(t);
  const summary = await run(setup, dependencies(setup));
  const records = await scenarioAttempts(setup.evidenceRoot);
  const pairsPerCandidate = MODAL_SCENARIOS.reduce(
    (total, scenario) => total + scenario.requiredCells.length,
    0,
  );
  assert.equal(records.length, pairsPerCandidate * setup.manifest.candidates.length);
  assert.equal(
    records.every(({ attemptNumber }) => attemptNumber === 1),
    true,
  );
  assert.equal(
    new Set(records.map((record) => `${record.candidateId}/${record.scenarioId}/${record.cellId}`))
      .size,
    records.length,
  );
  for (const candidate of setup.manifest.candidates) {
    assert.equal(
      records.some((record) => record.candidateId === candidate.id && record.cellId === 'webkit'),
      true,
    );
  }
  for (const forbidden of forbiddenCells) {
    assert.equal(
      records.some(({ cellId }) => cellId === forbidden),
      false,
    );
  }
  assert.equal(
    summary.candidates.every(({ counts }) => counts.PASS === pairsPerCandidate),
    true,
  );
});

test('continues later scenarios and candidates after a candidate-local product failure', async (t) => {
  const setup = await fixture(t, ['incumbent', 'radix']);
  let failed = false;
  const deps = dependencies(setup, {
    runModalCell(input) {
      const observation = expectedObservation(input.scenario);
      if (!failed) {
        failed = true;
        observation.focus = { target: 'wrong-but-neutral-focus' };
      }
      return input.policy.reactVersions.map((reactVersion) => ({ reactVersion, observation }));
    },
  });
  const summary = await run(setup, deps);
  assert.equal(summary.candidates[0].counts.FAIL, 1);
  assert.equal(summary.candidates[0].counts.PASS > 0, true);
  assert.equal(summary.candidates[1].counts.PASS > 0, true);
});

test('uses the same literal assertion for every candidate identity', async (t) => {
  const setup = await fixture(t);
  const summary = await run(setup, dependencies(setup), {});
  assert.deepEqual(
    summary.candidates.map(({ counts }) => counts),
    Array.from({ length: 4 }, () => ({
      PASS: summary.candidates[0].counts.PASS,
      FAIL: 0,
      unavailable: 0,
    })),
  );
});

test('compares an independent observation against the supplied literal expected record', async (t) => {
  const setup = await fixture(t, ['incumbent']);
  const immutable = MODAL_SCENARIOS.find(({ scenarioId }) =>
    scenarioId.endsWith('.validation-initial-focus.v1'),
  );
  const changedExpected = structuredClone(immutable);
  changedExpected.expected.focus.target = 'deliberately-wrong-focus-target';
  const deps = dependencies(setup, {
    dependencies: {
      cellPolicies: {
        chromium: {
          mode: 'browser',
          engine: 'chromium',
          reactVersions: ['19.2.8'],
          context: {},
        },
      },
      scenariosForCell: () => [changedExpected],
    },
    runModalCell: async () => [
      { reactVersion: '19.2.8', observation: expectedObservation(immutable) },
    ],
  });
  const summary = await run(setup, deps);
  assert.deepEqual(summary.candidates[0].counts, { PASS: 0, FAIL: 1, unavailable: 0 });
});

test('treats an unknown observation or classification as run-fatal', async (t) => {
  const malformed = await fixture(t, ['incumbent', 'radix']);
  const malformedCalls = [];
  await assert.rejects(
    run(
      malformed,
      dependencies(malformed, {
        calls: malformedCalls,
        runModalCell: async (input) => [
          {
            reactVersion: '19.2.8',
            observation: { ...expectedObservation(input.scenario), unsupported: true },
          },
        ],
      }),
    ),
    /modal observation/u,
  );
  assert.equal(
    malformedCalls.some((call) => call.startsWith('scenario:radix:')),
    false,
  );

  const unknown = await fixture(t, ['incumbent', 'radix']);
  await assert.rejects(
    run(
      unknown,
      dependencies(unknown, {
        runModalCell: async () => {
          throw Object.assign(new Error('unknown classification'), {
            classification: 'flaky',
            scope: 'candidate',
          });
        },
      }),
    ),
    /unknown classification/u,
  );
});

test('requires one verified checksum mapping for every core path and prepares only verified artifacts', async (t) => {
  const setup = await fixture(t, ['incumbent']);
  const calls = [];
  const deps = dependencies(setup, {
    calls,
    mutateCoreAttempt(attempt) {
      if (attempt.result !== 'PASS') return attempt;
      const unverified = structuredClone(attempt.observed.artifacts[0]);
      unverified.path = `files/${attempt.runId}/${attempt.candidateId}/artifacts/unverified.tgz`;
      unverified.sha256 = 'a'.repeat(64);
      return {
        ...attempt,
        observed: { ...attempt.observed, artifacts: [...attempt.observed.artifacts, unverified] },
      };
    },
  });
  await assert.rejects(run(setup, deps), /one-to-one|verified.*artifact|path mapping/iu);
  assert.equal(
    calls.some((call) => call.startsWith('prepare:')),
    false,
  );
});

test('rejects duplicate or traversal-bearing core evidence paths before fixture preparation', async (t) => {
  for (const kind of ['duplicate', 'traversal']) {
    const setup = await fixture(t, ['incumbent']);
    const calls = [];
    const deps = dependencies(setup, {
      calls,
      async afterSeedCoreAttempt({ attempt, candidate }) {
        if (attempt.result !== 'PASS') return attempt;
        let corrupted;
        if (kind === 'duplicate') {
          corrupted = {
            ...attempt,
            artifactPaths: [...attempt.artifactPaths, attempt.artifactPaths[0]],
          };
        } else {
          const artifact = { ...attempt.observed.artifacts[0], path: '../outside.tgz' };
          corrupted = {
            ...attempt,
            observed: { ...attempt.observed, artifacts: [artifact] },
            artifactPaths: ['../outside.tgz'],
          };
        }
        const path = join(
          setup.evidenceRoot,
          'attempts',
          attempt.runId,
          'preflight',
          candidate.id,
          attempt.stage,
          'attempt-1.json',
        );
        await writeFile(path, `${JSON.stringify(corrupted)}\n`);
      },
    });
    await assert.rejects(run(setup, deps), /duplicate|unique|relative|traversal|evidence path/iu);
    assert.equal(
      calls.some((call) => call.startsWith('prepare:')),
      false,
    );
  }
});

for (const [name, setupFailure, expected] of [
  [
    'repository drift',
    (setup) =>
      dependencies(setup, {
        repositoryStatus: (calls) =>
          calls.some((call) => call.startsWith('scenario:')) ? ' M tracked\n' : '',
      }),
    /repository worktree changed/u,
  ],
  [
    'evidence failure',
    (setup) =>
      dependencies(setup, {
        dependencies: {
          writeAttempt: async () => {
            throw new Error('synthetic evidence failure');
          },
        },
      }),
    /synthetic evidence failure/u,
  ],
  [
    'ownership failure',
    (setup) =>
      dependencies(setup, {
        dependencies: {
          createOwnedRunRoot: async () => {
            throw new Error('synthetic ownership failure');
          },
        },
      }),
    /synthetic ownership failure/u,
  ],
  [
    'cleanup uncertainty',
    (setup) =>
      dependencies(setup, {
        dependencies: {
          cleanupOwnedRunRoot: async () => {
            throw new Error('synthetic cleanup uncertainty');
          },
        },
      }),
    /synthetic cleanup uncertainty/u,
  ],
]) {
  test(`${name} is run-fatal`, async (t) => {
    const setup = await fixture(t, ['incumbent']);
    await assert.rejects(run(setup, setupFailure(setup)), expected);
  });
}

test('resume reuses exact core attempt 1 and writes attempt 2 while attempt 1 remains effective', async (t) => {
  const setup = await fixture(t, ['incumbent']);
  const scenario = modalScenariosForCell('ssr')[0];
  const common = {
    dependencies: {
      cellPolicies: { ssr: { mode: 'ssr', reactVersions: ['19.2.8'] } },
      scenariosForCell: () => [scenario],
    },
  };
  const firstCalls = [];
  await run(
    setup,
    dependencies(setup, {
      ...common,
      calls: firstCalls,
      runModalCell(input) {
        return [
          {
            reactVersion: '19.2.8',
            observation: {
              ...expectedObservation(input.scenario),
              focus: { target: 'wrong-neutral-focus' },
            },
          },
        ];
      },
    }),
  );
  assert.equal(firstCalls.filter((call) => call === 'core').length, 1);

  const resumeCalls = [];
  const deps = dependencies(setup, {
    ...common,
    calls: resumeCalls,
    dependencies: {
      ...common.dependencies,
      async runCorePreflight() {
        throw new Error('core preflight must not rerun during resume');
      },
    },
  });
  const summary = await run(setup, deps, { resume: true });
  const records = await scenarioAttempts(setup.evidenceRoot);
  assert.deepEqual(records.map(({ attemptNumber }) => attemptNumber).sort(), [1, 2]);
  assert.equal(summary.candidates[0].counts.FAIL, 1);
  assert.equal(summary.candidates[0].counts.PASS, 0);
  assert.equal(summary.candidates[0].retries, 1);
  assert.equal(resumeCalls.includes('core'), false);
});

test('resume rejects a manifest or revision that conflicts with the immutable run binding', async (t) => {
  const setup = await fixture(t, ['incumbent']);
  const scenario = modalScenariosForCell('ssr')[0];
  const reduced = {
    dependencies: {
      cellPolicies: { ssr: { mode: 'ssr', reactVersions: ['19.2.8'] } },
      scenariosForCell: () => [scenario],
    },
  };
  await run(setup, dependencies(setup, reduced));
  const changedManifest = structuredClone(setup.manifest);
  changedManifest.candidates[0].artifacts = [
    { name: 'changed', version: '1.0.0', sha256: 'a'.repeat(64) },
  ];
  await assert.rejects(
    run(setup, dependencies(setup, reduced), { manifest: changedManifest, resume: true }),
    /manifest.*conflict|run binding/iu,
  );
});

test('resume rejects conflicting modal evidence before any core or scenario execution', async (t) => {
  const setup = await fixture(t, ['incumbent']);
  const scenario = modalScenariosForCell('ssr')[0];
  const reduced = {
    dependencies: {
      cellPolicies: { ssr: { mode: 'ssr', reactVersions: ['19.2.8'] } },
      scenariosForCell: () => [scenario],
    },
  };
  await run(setup, dependencies(setup, reduced));
  const path = join(
    setup.evidenceRoot,
    'attempts',
    `modal-${revision.slice(0, 12)}`,
    'scenario',
    'incumbent',
    'OF-MODAL',
    scenario.scenarioId,
    'ssr',
    'attempt-1.json',
  );
  const attempt = JSON.parse(await readFile(path, 'utf8'));
  attempt.expected.focus = { target: 'conflicting-neutral-focus' };
  await writeFile(path, `${JSON.stringify(attempt)}\n`);
  const calls = [];
  await assert.rejects(
    run(
      setup,
      dependencies(setup, {
        calls,
        dependencies: {
          ...reduced.dependencies,
          async runCorePreflight() {
            calls.push('unexpected-core');
          },
        },
      }),
      { resume: true },
    ),
    /resume attempt conflicts|manifest or core attempt/iu,
  );
  assert.deepEqual(calls, []);
});

test('keeps SSR and hydration failures as distinct scenario-cell records', async (t) => {
  const setup = await fixture(t, ['incumbent']);
  const deps = dependencies(setup, {
    runModalCell(input) {
      const observation = expectedObservation(input.scenario);
      observation.focus = { target: `wrong-${input.cellId}-focus` };
      return input.policy.reactVersions.map((reactVersion) => ({ reactVersion, observation }));
    },
    dependencies: {
      cellPolicies: {
        ssr: { mode: 'ssr', reactVersions: ['19.2.8'] },
        hydration: {
          mode: 'browser',
          engine: 'chromium',
          reactVersions: ['18.3.1', '19.2.8'],
          context: {},
          hydrate: true,
        },
      },
      scenariosForCell: modalScenariosForCell,
    },
  });
  await run(setup, deps);
  const failures = (await scenarioAttempts(setup.evidenceRoot)).filter(
    ({ result }) => result === 'FAIL',
  );
  assert.deepEqual(new Set(failures.map(({ cellId }) => cellId)), new Set(['ssr', 'hydration']));
  assert.notEqual(failures[0].scenarioId, failures[1].scenarioId);
});

test('returns factual counts only and no selection language at any depth', async (t) => {
  const setup = await fixture(t, ['incumbent']);
  const summary = await run(setup, dependencies(setup));
  const serializedKeys = [];
  JSON.stringify(summary, (key, value) => {
    serializedKeys.push(key.toLowerCase());
    return value;
  });
  for (const forbidden of ['winner', 'score', 'selected', 'recommendation']) {
    assert.equal(serializedKeys.includes(forbidden), false);
  }
  assert.deepEqual(Object.keys(summary.candidates[0].counts), ['PASS', 'FAIL', 'unavailable']);
});
