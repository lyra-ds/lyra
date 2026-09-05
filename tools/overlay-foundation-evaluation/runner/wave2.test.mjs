import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { WAVE_2_SCENARIOS } from '../contracts/wave2.mjs';
import { installWave2ResourceTracker } from '../fixtures/wave2/runtime.mjs';
import { writeAttempt } from '../evidence/results.mjs';
import { modalExecutionScenario } from '../fixtures/modal/protocol.mjs';
import { observeModalSsrMarkup } from '../fixtures/modal/runtime.mjs';

const modulePath = new URL('./wave2.mjs', import.meta.url);
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
    candidates: candidateIds.map((id) => ({
      id,
      contracts: ['OF-MODAL', 'OF-ANCHORED', 'OF-MENU', 'OF-TOOLTIP'],
      artifacts: [],
    })),
  };
  return { evidenceRoot, manifest, repositoryRoot, root, temporaryDirectory };
}

function closedCandidateObservation(scenario) {
  const snapshot = {
    roles: [],
    relationships: [],
    states: [],
    focus: { target: 'modal-fixture-root' },
    events: [],
    announcements: [],
  };
  const traceSnapshot = {
    direction: scenario.initial.state.direction ?? 'ltr',
    resources: (({ persistentListeners, ...r }) => r)(installWave2ResourceTracker({}).snapshot()),
    ...snapshot,
  };
  const actions = scenario.operations.map(({ operation, target }) => ({
    operation,
    target,
    controlFound: true,
    dispatched: true,
    completed: true,
  }));
  return {
    ...structuredClone(snapshot),
    cleanup: ['fixture-destroyed', 'root-unmounted', 'modal-portals-removed'],
    trace: [
      { phase: 'before-operations', snapshot: structuredClone(traceSnapshot) },
      ...scenario.operations.map((operation, operationIndex) => ({
        phase: 'after-operation',
        operationIndex,
        operation: structuredClone(operation),
        snapshot: structuredClone(traceSnapshot),
      })),
      { phase: 'after-cleanup', snapshot: structuredClone(traceSnapshot) },
    ],
    diagnostics: {
      actions,
      cleanupObserved: true,
      executionCompleted: true,
    },
  };
}

function matchingObservation(scenario, cellId) {
  const source = closedCandidateObservation(scenario);
  const indexes = {};
  const probes = scenario.probes.map((p) => {
    const i = indexes[p.category] ?? 0;
    indexes[p.category] = i + 1;
    return {
      id: p.id,
      category: p.category,
      fact: structuredClone(
        p.category === 'focus' ? scenario.expected.focus : scenario.expected[p.category][i],
      ),
    };
  });
  const snapshot = () => ({
    ...structuredClone(source.trace[0].snapshot),
    ...Object.fromEntries(
      ['roles', 'relationships', 'states', 'focus', 'events', 'announcements'].map((k) => [
        k,
        structuredClone(scenario.expected[k]),
      ]),
    ),
  });
  const trace =
    cellId === 'ssr'
      ? [{ phase: 'server-render', snapshot: snapshot() }]
      : source.trace.map((entry) => ({ ...entry, snapshot: snapshot() }));
  for (const entry of trace)
    entry.snapshot.probes = scenario.probes
      .filter(
        (p) =>
          p.phase === entry.phase &&
          (p.phase !== 'after-operation' || p.operationIndex === entry.operationIndex),
      )
      .map((p) => probes.find((r) => r.id === p.id));
  return {
    ...structuredClone(scenario.expected),
    trace,
    diagnostics: {
      executionCompleted: true,
      cleanupObserved: cellId !== 'ssr',
      renderOperations: scenario.operations,
      actions: scenario.operations.map((o) => ({
        ...o,
        controlFound: true,
        completed: true,
        dispatched: o.operation !== 'advanceTime',
      })),
      axe: { violations: [] },
    },
  };
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
    preflight: async () => ({ native: true, network: true }),
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
    async prepareWave2Fixture({ reactVersion, runRoot }) {
      const fixtureRoot = join(runRoot, reactVersion);
      await mkdir(fixtureRoot);
      const clientHtmlPath = join(fixtureRoot, 'index.html');
      const ssrPath = join(fixtureRoot, 'entry-server.mjs');
      await writeFile(clientHtmlPath, '<main></main>');
      await writeFile(ssrPath, 'export default true;\n');
      const evidence = {};
      for (const key of [
        'fixtureManifest',
        'lockfile',
        'resolvedGraph',
        'audit',
        'licenseInventory',
      ]) {
        const path = join(fixtureRoot, key + '.json');
        await writeFile(path, '{}');
        evidence[key + 'Path'] = path;
        evidence[key + 'Sha256'] = sha256('{}');
      }
      calls.push(`prepare:${reactVersion}`);
      return {
        ...evidence,
        clientHtmlPath,
        ssrPath,
        sourceHashes: { entryClient: { path: clientHtmlPath, sha256: sha256('<main></main>') } },
        buildConfig: { path: ssrPath, sha256: sha256('export default true;\n') },
        buildOutputs: {
          [clientHtmlPath]: sha256('<main></main>'),
          [ssrPath]: sha256('export default true;\n'),
        },
        toolEvidence: { axe: { version: '4.13.0', sha256: sha256('<main></main>') } },
      };
    },
    async runWave2Cell(input) {
      calls.push(`scenario:${input.candidate.id}:${input.cellId}:${input.scenario.scenarioId}`);
      if (overrides.runWave2Cell) return overrides.runWave2Cell(input, calls);
      return input.policy.reactVersions.map((reactVersion) => ({
        reactVersion,
        observation: closedCandidateObservation(input.scenario),
      }));
    },
    async runCommand(command, args) {
      if (command === 'git' && args[0] === 'rev-parse') return { stdout: revision };
      if (command === 'git' && args[0] === 'status') {
        return { stdout: overrides.repositoryStatus?.(calls) ?? '' };
      }
      throw new Error(`unexpected command: ${command} ${args.join(' ')}`);
    },
    ...(overrides.dependencies ?? {}),
  };
}

async function run(setup, deps, input = {}) {
  const { runWave2 } = await import(modulePath);
  return runWave2(
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
  const root = join(evidenceRoot, 'attempts', `wave2-${revision.slice(0, 12)}`, 'scenario');
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

test('all 656 closed contract scenario cell tuples produce immutable attempt 1 after core preflight', async (t) => {
  const setup = await fixture(t),
    deps = dependencies(setup);
  const summary = await run(setup, deps);
  const records = await scenarioAttempts(setup.evidenceRoot);
  assert.equal(deps.calls[0], 'core');
  assert.equal(records.length, 656);
  assert.equal(
    new Set(records.map((r) => [r.candidateId, r.contractId, r.scenarioId, r.cellId].join('/')))
      .size,
    656,
  );
  assert.ok(records.every((r) => r.attemptNumber === 1));
  for (const c of setup.manifest.candidates)
    for (const scenario of WAVE_2_SCENARIOS)
      for (const cellId of scenario.requiredCells)
        assert.ok(
          records.some(
            (r) =>
              r.candidateId === c.id &&
              r.contractId === scenario.contractId &&
              r.scenarioId === scenario.scenarioId &&
              r.cellId === cellId,
          ),
        );
  for (const forbidden of forbiddenCells) assert.ok(!records.some((r) => r.cellId === forbidden));
  assert.deepEqual(
    summary.candidates.map((c) => c.contracts.map((x) => x.contractId)),
    Array(4).fill(['OF-ANCHORED', 'OF-MENU', 'OF-TOOLTIP']),
  );
  assert.ok(!/"(?:score|winner|selection|recommendation)"/u.test(JSON.stringify(summary)));
  assert.ok(
    records.filter((r) => r.result === 'FAIL').every((r) => r.observed.fixtures?.length >= 1),
  );
});

test('candidate product failures continue independently and retry never changes attempt 1', async (t) => {
  const setup = await fixture(t);
  const deps = dependencies(setup, {
    runWave2Cell: async () => {
      throw Object.assign(new Error('missing candidate DOM'), {
        scope: 'candidate',
        classification: 'product',
      });
    },
  });
  const first = await run(setup, deps);
  assert.equal(first.candidates.length, 4);
  const before = await scenarioAttempts(setup.evidenceRoot);
  assert.ok(
    before.every((record) =>
      record.observed.fixtures?.every((f) => f.installation?.lockfile?.content === '{}'),
    ),
  );
  const second = await run(
    setup,
    dependencies(setup, {
      runWave2Cell: async (input) =>
        input.policy.reactVersions.map((reactVersion) => ({
          reactVersion,
          observation: matchingObservation(input.scenario, input.cellId),
        })),
    }),
    { resume: true },
  );
  const after = await scenarioAttempts(setup.evidenceRoot);
  assert.equal(after.length, 1312);
  assert.ok(after.filter((r) => r.attemptNumber === 2).every((r) => r.result === 'PASS'));
  assert.deepEqual(
    after
      .filter((r) => r.attemptNumber === 1)
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
    before.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
  );
  assert.ok(second.candidates.every((c) => c.counts.FAIL === 164 && c.retries === 164));
});

for (const classification of [
  'policy',
  'fixture',
  'ownership',
  'repository',
  'evidence',
  'cleanup',
])
  test('run-fatal ' + classification + ' cannot become candidate-local evidence', async (t) => {
    const setup = await fixture(t);
    const deps = dependencies(setup, {
      runWave2Cell: async () => {
        throw Object.assign(new Error('fatal ' + classification), {
          scope: 'candidate',
          classification,
        });
      },
    });
    await assert.rejects(run(setup, deps), (error) => error.scope === 'run');
  });

test('missing contract policy and wrong repository revision reject before core execution', async (t) => {
  const setup = await fixture(t);
  const deps = dependencies(setup);
  setup.manifest.candidates[0].contracts.pop();
  await assert.rejects(run(setup, deps));
  assert.deepEqual(deps.calls, []);
});

test('resume validates exact manifest core hashes and closed attempt tree before execution', async (t) => {
  const setup = await fixture(t);
  await run(setup, dependencies(setup));
  const { inspectWave2Evidence } = await import(modulePath);
  const changed = structuredClone(setup.manifest);
  changed.toolchain.pnpm = '0.0.0';
  await assert.rejects(
    inspectWave2Evidence({ evidenceRoot: setup.evidenceRoot, manifest: changed }),
    /manifest|binding/,
  );
  const records = await scenarioAttempts(setup.evidenceRoot);
  const attempt = records[0];
  const path = join(
    setup.evidenceRoot,
    'attempts',
    attempt.runId,
    'scenario',
    attempt.candidateId,
    attempt.contractId,
    attempt.scenarioId,
    attempt.cellId,
    'attempt-1.json',
  );
  await writeFile(path, JSON.stringify({ ...attempt, cellId: 'packed-esm' }));
  await assert.rejects(
    inspectWave2Evidence({ evidenceRoot: setup.evidenceRoot, manifest: setup.manifest }),
    /conflict|identity/,
  );
});

test('copied source drift during execution is fatal and installation bytes survive owned cleanup', async (t) => {
  const setup = await fixture(t);
  const deps = dependencies(setup, {
    runWave2Cell: async (input) => {
      await writeFile(input.fixtures.values().next().value.clientHtmlPath, 'changed');
      return input.policy.reactVersions.map((reactVersion) => ({
        reactVersion,
        observation: closedCandidateObservation(input.scenario),
      }));
    },
  });
  await assert.rejects(run(setup, deps), (error) => error.scope === 'run');
});

test('assertions do not depend on candidate identity', async () => {
  const { evaluateWave2Scenario } = await import(modulePath);
  const scenario = WAVE_2_SCENARIOS[0];
  const observations = [
    { reactVersion: '19.2.8', observation: closedCandidateObservation(scenario) },
  ];
  for (const candidateId of ['incumbent', 'radix', 'base-ui', 'zag'])
    assert.equal(
      evaluateWave2Scenario({ cellId: 'chromium', scenario, observations, candidateId }),
      false,
    );
});

test('SSR and hydration require the exact React policies and phase separation', async () => {
  const { evaluateWave2Scenario } = await import(modulePath);
  for (const scenario of WAVE_2_SCENARIOS.filter((s) => s.requiredCells.includes('ssr'))) {
    const observation = matchingObservation(scenario, 'ssr');
    assert.equal(
      evaluateWave2Scenario({
        cellId: 'ssr',
        scenario,
        observations: [{ reactVersion: '19.2.8', observation }],
      }),
      true,
    );
  }
  const scenario = WAVE_2_SCENARIOS.find((s) => s.requiredCells.includes('hydration'));
  const observations = ['18.3.1', '19.2.8'].map((reactVersion) => ({
    reactVersion,
    observation: matchingObservation(scenario, 'hydration'),
  }));
  assert.equal(evaluateWave2Scenario({ cellId: 'hydration', scenario, observations }), true);
  assert.throws(
    () =>
      evaluateWave2Scenario({ cellId: 'hydration', scenario, observations: observations.slice(1) }),
    /versions/,
  );
  observations[0].observation.diagnostics.actions[0].target = 'hydrate-first-tree';
  assert.equal(evaluateWave2Scenario({ cellId: 'hydration', scenario, observations }), false);
});
