import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';

import { writeAttempt } from '../evidence/results.mjs';
import { cleanupOwnedRunRoot } from './isolation.mjs';
import { runCorePreflight } from './core.mjs';

const revision = 'b'.repeat(40);
const alternateRevision = 'c'.repeat(40);
const hashes = Object.freeze({
  alpine: 'a'.repeat(64),
  react: 'b'.repeat(64),
  styles: 'c'.repeat(64),
});

function externalCandidate(id, name) {
  return {
    id,
    adapter: `candidates/${id}.mjs`,
    contracts: ['OF-MODAL'],
    artifacts: [
      {
        source: 'registry',
        name,
        version: '1.2.3',
        tarballUrl: `https://registry.example.invalid/${id}-1.2.3.tgz`,
        sha256:
          id === 'radix' ? 'd'.repeat(64) : id === 'base-ui' ? 'e'.repeat(64) : 'f'.repeat(64),
        license: 'MIT',
        repositoryUrl: `https://github.com/example/${id}`,
      },
    ],
  };
}

function candidateManifest() {
  return {
    schemaVersion: 1,
    lyraRevision: revision,
    toolchain: { node: '24.18.0', pnpm: '11.13.1' },
    candidates: [
      {
        id: 'incumbent',
        adapter: 'candidates/incumbent.mjs',
        contracts: ['OF-MODAL'],
        revision,
        artifacts: [
          {
            source: 'workspace-pack',
            name: '@lyra-ds/styles',
            version: '0.5.0',
            sha256: hashes.styles,
          },
          {
            source: 'workspace-pack',
            name: '@lyra-ds/react',
            version: '0.5.0',
            sha256: hashes.react,
          },
          {
            source: 'workspace-pack',
            name: '@lyra-ds/alpine',
            version: '0.6.0',
            sha256: hashes.alpine,
          },
        ],
      },
      externalCandidate('radix', '@radix-ui/react-dialog'),
      externalCandidate('base-ui', '@base-ui-components/react'),
      externalCandidate('zag', '@zag-js/dialog'),
    ],
  };
}

function incumbentCharacterization() {
  return {
    schemaVersion: 1,
    candidateId: 'incumbent',
    revision,
    artifacts: [
      {
        name: '@lyra-ds/alpine',
        version: '0.6.0',
        sha256: hashes.alpine,
        bytes: 30,
        license: 'MIT',
        lifecycleScripts: [],
        path: '/owned/incumbent/alpine.tgz',
      },
      {
        name: '@lyra-ds/styles',
        version: '0.5.0',
        sha256: hashes.styles,
        bytes: 10,
        license: 'MIT',
        lifecycleScripts: [],
        path: '/owned/incumbent/styles.tgz',
      },
      {
        name: '@lyra-ds/react',
        version: '0.5.0',
        sha256: hashes.react,
        bytes: 20,
        license: 'MIT',
        lifecycleScripts: [],
        path: '/owned/incumbent/react.tgz',
      },
    ],
  };
}

async function writeAdapter(path, candidateId, supportedContractIds = ['OF-MODAL']) {
  await writeFile(
    path,
    `export const adapterDescriptor = ${JSON.stringify({
      candidateId,
      supportedContractIds,
    })};\nexport async function runAdapter() { throw new Error('adapter runtime must not run during preflight'); }\n`,
  );
}

async function createFixture(t, mutateAdapter = () => {}) {
  const root = await mkdtemp(join(process.env.TMPDIR, 'overlay-core-test-'));
  t.after(() => rm(root, { recursive: true }));
  const repositoryRoot = join(root, 'repository');
  const candidateRoot = join(
    repositoryRoot,
    'tools',
    'overlay-foundation-evaluation',
    'candidates',
  );
  const temporaryDirectory = join(root, 'tmp');
  const evidenceRoot = join(root, 'evidence');
  await mkdir(candidateRoot, { recursive: true });
  await mkdir(temporaryDirectory);
  await writeFile(join(repositoryRoot, '.nvmrc'), '24.18.0\n');
  await writeFile(
    join(repositoryRoot, 'package.json'),
    `${JSON.stringify({ name: 'synthetic-repository', private: true, packageManager: 'pnpm@11.13.1' })}\n`,
  );
  const descriptorIds = {
    incumbent: 'incumbent',
    radix: 'radix',
    'base-ui': 'base-ui',
    zag: 'zag',
  };
  mutateAdapter(descriptorIds);
  for (const [id, descriptorId] of Object.entries(descriptorIds)) {
    if (id === 'incumbent') {
      await writeFile(
        join(candidateRoot, 'incumbent.mjs'),
        `export const incumbentDescriptor = ${JSON.stringify({
          id: descriptorId,
          supportedContractIds: ['OF-MODAL'],
          publicPackages: ['@lyra-ds/styles', '@lyra-ds/react', '@lyra-ds/alpine'],
        })};\n`,
      );
    } else {
      await writeAdapter(join(candidateRoot, `${id}.mjs`), descriptorId);
    }
  }
  return {
    evidenceRoot,
    manifest: candidateManifest(),
    repositoryRoot,
    root,
    temporaryDirectory,
  };
}

function inspectedArtifact(record, destinationRoot) {
  return {
    record,
    path: join(destinationRoot, `${record.name.replaceAll('/', '-')}.tgz`),
    sha256: record.sha256,
    bytes: 123,
    packageName: record.name,
    packageVersion: record.version,
    license: record.license,
    lifecycleScripts: [],
  };
}

function successfulDependencies(events, overrides = {}) {
  return {
    event: (event) => events.push(event),
    characterizeIncumbent: async () => incumbentCharacterization(),
    acquireExternalArtifact: async ({ record, destinationRoot }) => ({
      record,
      path: join(destinationRoot, `${record.name.replaceAll('/', '-')}.tgz`),
      sha256: record.sha256,
      bytes: 123,
    }),
    inspectPackageArchive: async ({ artifact }) =>
      inspectedArtifact(artifact.record, artifact.path.slice(0, artifact.path.lastIndexOf('/'))),
    installExternalCandidate: async ({ candidate }) => ({
      candidateId: candidate.id,
      fixtureManifestSha256: '1'.repeat(64),
      lockfileSha256: '2'.repeat(64),
      resolvedGraphSha256: '3'.repeat(64),
      auditSha256: '4'.repeat(64),
      licenseInventorySha256: '5'.repeat(64),
    }),
    ...overrides,
  };
}

async function runFixture(fixture, dependencies, runCommand = cleanRepositoryCommand) {
  return runCorePreflight(
    {
      manifest: fixture.manifest,
      repositoryRoot: fixture.repositoryRoot,
      tmpdir: fixture.temporaryDirectory,
      evidenceRoot: fixture.evidenceRoot,
      fetchImpl: async () => {
        throw new Error('synthetic fetch must be replaced by the acquisition seam');
      },
      runCommand,
    },
    dependencies,
  );
}

async function cleanRepositoryCommand(command, args) {
  assert.equal(command, 'git');
  assert.deepEqual(args, ['status', '--porcelain=v1', '--untracked-files=all']);
  return { stdout: '' };
}

async function readAttempt(evidenceRoot, candidateId, stage) {
  return JSON.parse(
    await readFile(
      join(evidenceRoot, 'attempts', 'preflight', candidateId, stage, 'attempt-1.json'),
      'utf8',
    ),
  );
}

async function assertOwnedRootsRemoved(temporaryDirectory) {
  assert.deepEqual(await readdir(temporaryDirectory), []);
}

test('composes validation, adapter loading, preflight, evidence, repository proof, and cleanup in order', async (t) => {
  const fixture = await createFixture(t);
  const events = [];

  const summary = await runFixture(fixture, successfulDependencies(events));

  assert.deepEqual(events, [
    'validate-manifest',
    'verify-repository-clean',
    'load-adapter:incumbent',
    'load-adapter:radix',
    'load-adapter:base-ui',
    'load-adapter:zag',
    'characterize:incumbent',
    'write-preflight:incumbent',
    'acquire:radix',
    'inspect:radix',
    'install:radix',
    'write-preflight:radix',
    'acquire:base-ui',
    'inspect:base-ui',
    'install:base-ui',
    'write-preflight:base-ui',
    'acquire:zag',
    'inspect:zag',
    'install:zag',
    'write-preflight:zag',
    'verify-repository-unchanged',
    'cleanup-owned-root',
  ]);
  assert.equal(summary.result, 'PASS');
  assert.deepEqual(
    summary.candidates.map(({ candidateId, result }) => [candidateId, result]),
    [
      ['incumbent', 'PASS'],
      ['radix', 'PASS'],
      ['base-ui', 'PASS'],
      ['zag', 'PASS'],
    ],
  );
  for (const [candidateId, stage] of [
    ['incumbent', 'artifact'],
    ['radix', 'installation'],
    ['base-ui', 'installation'],
    ['zag', 'installation'],
  ]) {
    const attempt = await readAttempt(fixture.evidenceRoot, candidateId, stage);
    assert.equal(attempt.recordType, 'preflight');
    assert.equal(attempt.result, 'PASS');
    assert.equal('contractId' in attempt, false);
    assert.equal('scenarioId' in attempt, false);
    assert.equal('cellId' in attempt, false);
  }
  await assertOwnedRootsRemoved(fixture.temporaryDirectory);
});

test('records a checksum failure as candidate-local security evidence, continues to Zag, and cleans only owned data', async (t) => {
  const fixture = await createFixture(t);
  const sibling = join(fixture.temporaryDirectory, 'foreign-sibling.txt');
  await writeFile(sibling, 'preserve me');
  const events = [];
  const dependencies = successfulDependencies(events, {
    acquireExternalArtifact: async ({ record, destinationRoot }) => {
      if (record.name === '@base-ui-components/react') {
        throw new Error('artifact checksum mismatch');
      }
      return {
        record,
        path: join(destinationRoot, `${record.name.replaceAll('/', '-')}.tgz`),
        sha256: record.sha256,
        bytes: 123,
      };
    },
  });

  const summary = await runFixture(fixture, dependencies);

  assert.equal(summary.result, 'FAIL');
  assert.equal(events.includes('inspect:base-ui'), false);
  assert.equal(events.includes('install:base-ui'), false);
  assert.equal(events.includes('acquire:zag'), true);
  assert.equal(events.at(-1), 'cleanup-owned-root');
  const failure = await readAttempt(fixture.evidenceRoot, 'base-ui', 'artifact');
  assert.equal(failure.result, 'FAIL');
  assert.equal(failure.classification, 'security');
  assert.equal(failure.observed.scope, 'candidate');
  assert.equal(await readFile(sibling, 'utf8'), 'preserve me');
  assert.deepEqual(await readdir(fixture.temporaryDirectory), ['foreign-sibling.txt']);
  await access(
    join(fixture.evidenceRoot, 'attempts', 'preflight', 'zag', 'installation', 'attempt-1.json'),
  );
});

test('records license, lifecycle, and audit failures locally and continues independent candidates', async (t) => {
  const fixture = await createFixture(t);
  const events = [];
  const dependencies = successfulDependencies(events, {
    inspectPackageArchive: async ({ artifact }) => {
      if (artifact.record.name === '@radix-ui/react-dialog') {
        throw new Error('package license mismatch');
      }
      if (artifact.record.name === '@zag-js/dialog') {
        throw new Error(
          'artifact package manifest contains forbidden lifecycle scripts: postinstall',
        );
      }
      return inspectedArtifact(
        artifact.record,
        artifact.path.slice(0, artifact.path.lastIndexOf('/')),
      );
    },
    installExternalCandidate: async ({ candidate }) => {
      if (candidate.id === 'base-ui') {
        throw new Error('audit report rejected: audit reports 1 high vulnerabilities');
      }
      return { candidateId: candidate.id };
    },
  });

  const summary = await runFixture(fixture, dependencies);

  assert.equal(summary.result, 'FAIL');
  assert.equal(events.includes('acquire:base-ui'), true);
  assert.equal(events.includes('acquire:zag'), true);
  assert.equal(events.includes('install:radix'), false);
  assert.equal(events.includes('install:zag'), false);
  for (const [candidateId, stage] of [
    ['radix', 'artifact'],
    ['base-ui', 'audit'],
    ['zag', 'artifact'],
  ]) {
    const attempt = await readAttempt(fixture.evidenceRoot, candidateId, stage);
    assert.equal(attempt.result, 'FAIL');
    assert.equal(attempt.classification, 'security');
    assert.equal(attempt.observed.scope, 'candidate');
  }
  await assertOwnedRootsRemoved(fixture.temporaryDirectory);
});

test('records an adapter mismatch as candidate-local policy evidence and continues to Zag', async (t) => {
  const fixture = await createFixture(t, (descriptorIds) => {
    descriptorIds['base-ui'] = 'zag';
  });
  const events = [];

  const summary = await runFixture(fixture, successfulDependencies(events));

  assert.equal(summary.result, 'FAIL');
  assert.equal(events.includes('acquire:base-ui'), false);
  assert.equal(events.includes('acquire:zag'), true);
  const failure = await readAttempt(fixture.evidenceRoot, 'base-ui', 'adapter');
  assert.equal(failure.result, 'FAIL');
  assert.equal(failure.classification, 'policy');
  assert.match(failure.observed.message, /candidate ID/u);
  assert.equal(failure.observed.scope, 'candidate');
  await assertOwnedRootsRemoved(fixture.temporaryDirectory);
});

for (const [name, mutate] of [
  ['revision', (characterization) => (characterization.revision = alternateRevision)],
  ['artifact name', (characterization) => (characterization.artifacts[0].name = '@lyra-ds/other')],
  ['artifact version', (characterization) => (characterization.artifacts[0].version = '9.9.9')],
  [
    'artifact SHA-256',
    (characterization) => (characterization.artifacts[0].sha256 = '0'.repeat(64)),
  ],
  ['missing artifact', (characterization) => characterization.artifacts.pop()],
  [
    'extra artifact',
    (characterization) =>
      characterization.artifacts.push({
        name: '@lyra-ds/extra',
        version: '1.0.0',
        sha256: '9'.repeat(64),
      }),
  ],
]) {
  test(`never writes incumbent PASS when the characterized ${name} differs from its manifest record`, async (t) => {
    const fixture = await createFixture(t);
    const events = [];
    const characterization = incumbentCharacterization();
    mutate(characterization);

    const summary = await runFixture(
      fixture,
      successfulDependencies(events, {
        characterizeIncumbent: async () => characterization,
      }),
    );

    assert.equal(summary.result, 'FAIL');
    assert.equal(events.includes('acquire:radix'), true);
    assert.equal(events.includes('acquire:zag'), true);
    const failure = await readAttempt(fixture.evidenceRoot, 'incumbent', 'artifact');
    assert.equal(failure.result, 'FAIL');
    assert.equal(failure.classification, 'policy');
    assert.match(failure.observed.message, /incumbent characterization does not exactly match/u);
    await assert.rejects(
      access(
        join(
          fixture.evidenceRoot,
          'attempts',
          'preflight',
          'incumbent',
          'artifact',
          'attempt-2.json',
        ),
      ),
      { code: 'ENOENT' },
    );
  });
}

test('accepts a reordered incumbent artifact set when every canonical identity is exact', async (t) => {
  const fixture = await createFixture(t);
  const events = [];
  const characterization = incumbentCharacterization();
  characterization.artifacts.reverse();

  const summary = await runFixture(
    fixture,
    successfulDependencies(events, {
      characterizeIncumbent: async () => characterization,
    }),
  );

  assert.equal(summary.result, 'PASS');
  assert.equal((await readAttempt(fixture.evidenceRoot, 'incumbent', 'artifact')).result, 'PASS');
});

test('repository mutation is run-fatal after its failure record and prevents Zag from starting', async (t) => {
  const fixture = await createFixture(t);
  const events = [];
  const dependencies = successfulDependencies(events, {
    installExternalCandidate: async ({ candidate }) => {
      if (candidate.id === 'base-ui') {
        throw new Error('repository worktree changed during candidate installation');
      }
      return { candidateId: candidate.id };
    },
  });

  await assert.rejects(runFixture(fixture, dependencies), /repository worktree changed/u);

  assert.equal(events.includes('acquire:zag'), false);
  const failure = await readAttempt(fixture.evidenceRoot, 'base-ui', 'repository');
  assert.equal(failure.result, 'FAIL');
  assert.equal(failure.classification, 'policy');
  assert.equal(failure.observed.scope, 'run');
  assert.equal(events.at(-1), 'cleanup-owned-root');
  await assertOwnedRootsRemoved(fixture.temporaryDirectory);
});

test('ownership corruption is run-fatal and prevents the next candidate from starting', async (t) => {
  const fixture = await createFixture(t);
  const events = [];
  const dependencies = successfulDependencies(events, {
    installExternalCandidate: async ({ candidate }) => {
      if (candidate.id === 'radix') throw new Error('run-root ownership mismatch');
      return { candidateId: candidate.id };
    },
  });

  await assert.rejects(runFixture(fixture, dependencies), /ownership mismatch/u);

  assert.equal(events.includes('acquire:base-ui'), false);
  const failure = await readAttempt(fixture.evidenceRoot, 'radix', 'repository');
  assert.equal(failure.classification, 'policy');
  assert.equal(failure.observed.scope, 'run');
  await assertOwnedRootsRemoved(fixture.temporaryDirectory);
});

test('an evidence-write failure is run-fatal and prevents Zag from starting', async (t) => {
  const fixture = await createFixture(t);
  const events = [];
  const evidenceError = new Error('synthetic evidence write failure');
  const dependencies = successfulDependencies(events, {
    writeAttempt: async (input) => {
      if (input.attempt.candidateId === 'base-ui') throw evidenceError;
      return writeAttempt(input);
    },
  });

  await assert.rejects(runFixture(fixture, dependencies), (error) => {
    assert.equal(error, evidenceError);
    assert.equal(error.scope, 'run');
    assert.equal(error.classification, 'policy');
    return true;
  });

  assert.equal(events.includes('acquire:zag'), false);
  assert.equal(events.at(-1), 'cleanup-owned-root');
  await assertOwnedRootsRemoved(fixture.temporaryDirectory);
});

for (const [name, metadata] of [
  ['classification', { classification: 'flaky', scope: 'candidate' }],
  ['scope', { classification: 'security', scope: 'scenario' }],
]) {
  test(`an unknown error ${name} becomes a run-fatal policy record`, async (t) => {
    const fixture = await createFixture(t);
    const events = [];
    const invalid = Object.assign(new Error(`invalid ${name}`), metadata);
    const dependencies = successfulDependencies(events, {
      acquireExternalArtifact: async () => {
        throw invalid;
      },
    });

    await assert.rejects(runFixture(fixture, dependencies), (error) => {
      assert.equal(error.classification, 'policy');
      assert.equal(error.scope, 'run');
      assert.equal(error.cause, invalid);
      return true;
    });

    const failure = await readAttempt(fixture.evidenceRoot, 'radix', 'artifact');
    assert.equal(failure.classification, 'policy');
    assert.equal(failure.observed.scope, 'run');
    assert.equal(events.includes('acquire:base-ui'), false);
    await assertOwnedRootsRemoved(fixture.temporaryDirectory);
  });
}

test('preserves the primary and cleanup failures in order with AggregateError', async (t) => {
  const fixture = await createFixture(t);
  const events = [];
  const primaryError = new Error('repository worktree changed during candidate installation');
  const cleanupError = new Error('synthetic cleanup failure');
  const dependencies = successfulDependencies(events, {
    installExternalCandidate: async () => {
      throw primaryError;
    },
    cleanupOwnedRunRoot: async (owned) => {
      await cleanupOwnedRunRoot(owned);
      throw cleanupError;
    },
  });

  await assert.rejects(runFixture(fixture, dependencies), (error) => {
    assert.equal(error instanceof AggregateError, true);
    assert.equal(error.message, 'core preflight and cleanup both failed');
    assert.equal(error.errors.length, 2);
    assert.equal(error.errors[0], primaryError);
    assert.equal(error.errors[0].classification, 'policy');
    assert.equal(error.errors[0].scope, 'run');
    assert.equal(error.errors[1], cleanupError);
    assert.equal(error.errors[1].scope, 'run');
    return true;
  });
  await assertOwnedRootsRemoved(fixture.temporaryDirectory);
});

test('normalizes an invalid evidence root to an allowed run-fatal policy error and still cleans up', async (t) => {
  const fixture = await createFixture(t);
  const events = [];

  await assert.rejects(
    runCorePreflight(
      {
        manifest: fixture.manifest,
        repositoryRoot: fixture.repositoryRoot,
        tmpdir: fixture.temporaryDirectory,
        evidenceRoot: 'relative-evidence',
        runCommand: cleanRepositoryCommand,
      },
      successfulDependencies(events),
    ),
    (error) => {
      assert.equal(error.classification, 'policy');
      assert.equal(error.scope, 'run');
      assert.equal(error.stage, 'repository');
      assert.match(error.message, /evidenceRoot must be absolute/u);
      return true;
    },
  );
  assert.equal(events.at(-1), 'cleanup-owned-root');
  await assertOwnedRootsRemoved(fixture.temporaryDirectory);
});

test('normalizes a relative repository root to an allowed run-fatal policy error before side effects', async () => {
  await assert.rejects(
    runCorePreflight({
      manifest: candidateManifest(),
      repositoryRoot: 'relative-repository',
      tmpdir: '/must/not/be/used',
      evidenceRoot: '/must/not/be/used',
      runCommand: async () => {
        throw new Error('command must not run');
      },
    }),
    (error) => {
      assert.equal(error.classification, 'policy');
      assert.equal(error.scope, 'run');
      assert.equal(error.stage, 'repository');
      assert.match(error.message, /repositoryRoot must be absolute/u);
      return true;
    },
  );
});
