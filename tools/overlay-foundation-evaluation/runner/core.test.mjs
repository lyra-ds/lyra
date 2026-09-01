import assert from 'node:assert/strict';
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { writeAttempt } from '../evidence/results.mjs';
import { sha256 } from './artifacts.mjs';
import { cleanupOwnedRunRoot, createOwnedRunRoot } from './isolation.mjs';
import { runCorePreflight } from './core.mjs';

const revision = 'b'.repeat(40);
const alternateRevision = 'c'.repeat(40);
const incumbentPackedBytes = Object.freeze({
  alpine: Buffer.from('incumbent alpine packed bytes'),
  react: Buffer.from('incumbent react packed bytes'),
  styles: Buffer.from('incumbent styles packed bytes'),
});
const hashes = Object.freeze({
  alpine: sha256(incumbentPackedBytes.alpine),
  react: sha256(incumbentPackedBytes.react),
  styles: sha256(incumbentPackedBytes.styles),
});

function externalArchiveBytes(id) {
  return Buffer.from(`${id} approved archive bytes`);
}

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
        sha256: sha256(externalArchiveBytes(id)),
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

function incumbentCharacterization(outputRoot = '/owned/incumbent') {
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
        path: join(outputRoot, `${hashes.alpine}.tgz`),
      },
      {
        name: '@lyra-ds/styles',
        version: '0.5.0',
        sha256: hashes.styles,
        bytes: 10,
        license: 'MIT',
        lifecycleScripts: [],
        path: join(outputRoot, `${hashes.styles}.tgz`),
      },
      {
        name: '@lyra-ds/react',
        version: '0.5.0',
        sha256: hashes.react,
        bytes: 20,
        license: 'MIT',
        lifecycleScripts: [],
        path: join(outputRoot, `${hashes.react}.tgz`),
      },
    ],
  };
}

async function writeIncumbentCharacterization(outputRoot) {
  await mkdir(outputRoot, { recursive: true });
  const characterization = incumbentCharacterization(outputRoot);
  for (const artifact of characterization.artifacts) {
    const key = artifact.name.slice('@lyra-ds/'.length);
    await writeFile(artifact.path, incumbentPackedBytes[key]);
  }
  return characterization;
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
  const root = await mkdtemp(join(process.env.TMPDIR ?? tmpdir(), 'overlay-core-test-'));
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
  const trackedFile = join(repositoryRoot, 'tracked.txt');
  await writeFile(trackedFile, 'original repository bytes\n');
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
    trackedFile,
  };
}

test('creates core fixtures when TMPDIR is unset', async (t) => {
  const originalTmpdir = process.env.TMPDIR;
  delete process.env.TMPDIR;
  t.after(() => {
    if (originalTmpdir === undefined) delete process.env.TMPDIR;
    else process.env.TMPDIR = originalTmpdir;
  });

  const fixture = await createFixture(t);

  assert.match(fixture.root, /overlay-core-test-/u);
});

function inspectedArtifact(record, path) {
  return {
    record,
    path,
    sha256: record.sha256,
    bytes: 123,
    packageName: record.name,
    packageVersion: record.version,
    license: record.license,
    lifecycleScripts: [],
  };
}

async function writeAcquiredArtifact(record, destinationRoot) {
  const candidateId = record.tarballUrl.match(/\/(radix|base-ui|zag)-/u)?.[1];
  const bytes = externalArchiveBytes(candidateId);
  await mkdir(destinationRoot, { recursive: true });
  const path = join(destinationRoot, `${record.sha256}.tgz`);
  await writeFile(path, bytes);
  return { record, path, sha256: record.sha256, bytes: bytes.byteLength };
}

async function writeInstallEvidence(
  candidate,
  runRoot,
  includedPrefixes = ['fixtureManifest', 'lockfile', 'resolvedGraph', 'audit', 'licenseInventory'],
) {
  const fixtureRoot = join(runRoot, `candidate-${candidate.id}`, 'fixture');
  await mkdir(fixtureRoot, { recursive: true });
  const files = {
    fixtureManifest: ['package.json', Buffer.from(`package ${candidate.id}`)],
    lockfile: ['pnpm-lock.yaml', Buffer.from(`lock ${candidate.id}`)],
    resolvedGraph: ['resolved-graph.json', Buffer.from(`graph ${candidate.id}`)],
    audit: ['audit.json', Buffer.from(`audit ${candidate.id}`)],
    licenseInventory: ['license-inventory.json', Buffer.from(`licenses ${candidate.id}`)],
  };
  const evidence = { candidateId: candidate.id };
  for (const [prefix, [name, bytes]] of Object.entries(files)) {
    if (!includedPrefixes.includes(prefix)) continue;
    const path = join(fixtureRoot, name);
    await writeFile(path, bytes);
    evidence[`${prefix}Path`] = path;
    evidence[`${prefix}Sha256`] = sha256(bytes);
  }
  return evidence;
}

function successfulDependencies(events, overrides = {}) {
  return {
    event: (event) => events.push(event),
    characterizeIncumbent: async ({ outputRoot }) => writeIncumbentCharacterization(outputRoot),
    acquireExternalArtifact: async ({ record, destinationRoot }) =>
      writeAcquiredArtifact(record, destinationRoot),
    inspectPackageArchive: async ({ artifact }) =>
      inspectedArtifact(artifact.record, artifact.path),
    installExternalCandidate: async ({ candidate, runRoot }) =>
      writeInstallEvidence(candidate, runRoot),
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

function fileBackedRepositoryCommand(fixture) {
  return async (command, args) => {
    assert.equal(command, 'git');
    assert.deepEqual(args, ['status', '--porcelain=v1', '--untracked-files=all']);
    const trackedBytes = await readFile(fixture.trackedFile, 'utf8');
    return {
      stdout: trackedBytes === 'original repository bytes\n' ? '' : ' M tracked.txt\n',
    };
  };
}

async function readAttempt(evidenceRoot, candidateId, stage) {
  return JSON.parse(
    await readFile(
      join(evidenceRoot, 'attempts', 'preflight', candidateId, stage, 'attempt-1.json'),
      'utf8',
    ),
  );
}

async function repositoryAttemptPaths(evidenceRoot) {
  const attemptRoot = join(evidenceRoot, 'attempts', 'preflight');
  return (await readdir(attemptRoot, { recursive: true })).filter((path) =>
    path.endsWith(join('repository', 'attempt-1.json')),
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

test('preserves verified preflight files and hashes after owned-root cleanup', async (t) => {
  const fixture = await createFixture(t);
  const events = [];
  const incumbentBytes = new Map([
    ['@lyra-ds/styles', Buffer.from('styles packed bytes')],
    ['@lyra-ds/react', Buffer.from('react packed bytes')],
    ['@lyra-ds/alpine', Buffer.from('alpine packed bytes')],
  ]);
  for (const artifact of fixture.manifest.candidates[0].artifacts) {
    artifact.sha256 = sha256(incumbentBytes.get(artifact.name));
  }
  const externalBytes = new Map();
  for (const candidate of fixture.manifest.candidates.slice(1)) {
    const bytes = Buffer.from(`${candidate.id} approved archive bytes`);
    candidate.artifacts[0].sha256 = sha256(bytes);
    externalBytes.set(candidate.id, bytes);
  }

  const dependencies = successfulDependencies(events, {
    characterizeIncumbent: async ({ outputRoot }) => {
      await mkdir(outputRoot, { recursive: true });
      return {
        schemaVersion: 1,
        candidateId: 'incumbent',
        revision,
        artifacts: await Promise.all(
          fixture.manifest.candidates[0].artifacts.map(async (record) => {
            const bytes = incumbentBytes.get(record.name);
            const path = join(outputRoot, `${record.sha256}.tgz`);
            await writeFile(path, bytes);
            return {
              name: record.name,
              version: record.version,
              sha256: record.sha256,
              bytes: bytes.byteLength,
              license: 'MIT',
              lifecycleScripts: [],
              path,
            };
          }),
        ),
      };
    },
    acquireExternalArtifact: async ({ record, destinationRoot }) => {
      const candidateId = fixture.manifest.candidates.find((candidate) =>
        candidate.artifacts.includes(record),
      ).id;
      const bytes = externalBytes.get(candidateId);
      await mkdir(destinationRoot, { recursive: true });
      const path = join(destinationRoot, `${record.sha256}.tgz`);
      await writeFile(path, bytes);
      return { record, path, sha256: record.sha256, bytes: bytes.byteLength };
    },
    inspectPackageArchive: async ({ artifact }) => ({
      ...artifact,
      packageName: artifact.record.name,
      packageVersion: artifact.record.version,
      license: artifact.record.license,
      lifecycleScripts: [],
    }),
    installExternalCandidate: async ({ candidate, runRoot }) => {
      const directory = join(runRoot, `candidate-${candidate.id}`, 'fixture');
      await mkdir(directory, { recursive: true });
      const files = {
        fixtureManifest: ['package.json', Buffer.from(`package ${candidate.id}`)],
        lockfile: ['pnpm-lock.yaml', Buffer.from(`lock ${candidate.id}`)],
        resolvedGraph: ['resolved-graph.json', Buffer.from(`graph ${candidate.id}`)],
        audit: ['audit.json', Buffer.from(`audit ${candidate.id}`)],
        licenseInventory: ['license-inventory.json', Buffer.from(`licenses ${candidate.id}`)],
      };
      const evidence = {};
      for (const [prefix, [name, bytes]] of Object.entries(files)) {
        const path = join(directory, name);
        await writeFile(path, bytes);
        evidence[`${prefix}Path`] = path;
        evidence[`${prefix}Sha256`] = sha256(bytes);
      }
      return evidence;
    },
  });

  await runFixture(fixture, dependencies);

  for (const [candidateId, stage] of [
    ['incumbent', 'artifact'],
    ['radix', 'installation'],
    ['base-ui', 'installation'],
    ['zag', 'installation'],
  ]) {
    const attempt = await readAttempt(fixture.evidenceRoot, candidateId, stage);
    assert.notDeepEqual(attempt.artifactPaths, []);
    for (const relativePath of attempt.artifactPaths) {
      assert.equal(relativePath.startsWith('/'), false);
      const bytes = await readFile(join(fixture.evidenceRoot, relativePath));
      const recorded =
        attempt.observed.artifacts?.find(({ path }) => path === relativePath)?.sha256 ??
        Object.entries(attempt.observed)
          .filter(([key]) => key.endsWith('Path'))
          .find(([, path]) => path === relativePath)
          ?.at(0)
          ?.replace(/Path$/u, 'Sha256');
      const digest =
        typeof recorded === 'string' && recorded.length === 64
          ? recorded
          : attempt.observed[recorded];
      assert.equal(sha256(bytes), digest);
    }
  }
  await assertOwnedRootsRemoved(fixture.temporaryDirectory);
});

test('uses candidate-owned acquisition roots when candidates share an artifact name', async (t) => {
  const fixture = await createFixture(t);
  fixture.manifest.candidates[2].artifacts[0].name =
    fixture.manifest.candidates[1].artifacts[0].name;
  const events = [];
  const acquisitionRoots = new Map();
  const dependencies = successfulDependencies(events, {
    acquireExternalArtifact: async ({ record, destinationRoot }) => {
      const candidate = fixture.manifest.candidates
        .slice(1)
        .find(({ artifacts }) => artifacts.includes(record));
      acquisitionRoots.set(candidate.id, destinationRoot);
      return writeAcquiredArtifact(record, destinationRoot);
    },
  });

  await runFixture(fixture, dependencies);

  assert.equal(new Set(acquisitionRoots.values()).size, 3);
  for (const [candidateId, root] of acquisitionRoots) {
    assert.match(root, new RegExp(`candidate-${candidateId}.+artifacts`, 'u'));
  }
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
      return writeAcquiredArtifact(record, destinationRoot);
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
      return inspectedArtifact(artifact.record, artifact.path);
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

test('preserves verified artifact and partial install evidence through an audit failure', async (t) => {
  const fixture = await createFixture(t);
  const events = [];
  const auditFailure = new Error('audit report rejected: audit reports 1 high vulnerabilities');
  const partialByError = new WeakMap();
  const dependencies = successfulDependencies(events, {
    installExternalCandidate: async ({ candidate, runRoot }) => {
      if (candidate.id !== 'base-ui') return writeInstallEvidence(candidate, runRoot);
      const partialEvidence = await writeInstallEvidence(candidate, runRoot, [
        'fixtureManifest',
        'lockfile',
        'resolvedGraph',
        'audit',
      ]);
      partialByError.set(auditFailure, partialEvidence);
      throw auditFailure;
    },
    readPartialInstallationEvidence: (error) => {
      assert.equal(error, auditFailure);
      return partialByError.get(error);
    },
  });

  const summary = await runFixture(fixture, dependencies);

  assert.equal(summary.result, 'FAIL');
  assert.equal(auditFailure.classification, 'security');
  assert.equal(auditFailure.scope, 'candidate');
  assert.equal(auditFailure.stage, 'audit');
  const failure = await readAttempt(fixture.evidenceRoot, 'base-ui', 'audit');
  assert.equal(failure.result, 'FAIL');
  assert.equal(failure.classification, 'security');
  assert.equal(failure.observed.scope, 'candidate');
  assert.equal(failure.artifactPaths.length, 5);
  assert.equal(failure.observed.artifacts.length, 1);
  assert.equal(Object.hasOwn(failure.observed, 'licenseInventoryPath'), false);
  assert.equal(Object.hasOwn(failure.observed, 'licenseInventorySha256'), false);
  for (const relativePath of failure.artifactPaths) {
    const bytes = await readFile(join(fixture.evidenceRoot, relativePath));
    const artifact = failure.observed.artifacts.find(({ path }) => path === relativePath);
    if (artifact !== undefined) {
      assert.equal(sha256(bytes), artifact.sha256);
      continue;
    }
    const pathKey = Object.keys(failure.observed).find(
      (key) => key.endsWith('Path') && failure.observed[key] === relativePath,
    );
    assert.notEqual(pathKey, undefined);
    assert.equal(sha256(bytes), failure.observed[pathKey.replace(/Path$/u, 'Sha256')]);
  }
  assert.equal(events.includes('acquire:zag'), true);
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

test('forces adapter failures to candidate-local policy metadata despite valid run-scoped caller fields', async (t) => {
  const fixture = await createFixture(t);
  const events = [];
  await writeFile(
    join(
      fixture.repositoryRoot,
      'tools',
      'overlay-foundation-evaluation',
      'candidates',
      'base-ui.mjs',
    ),
    `const error = Object.assign(new Error('adversarial adapter failure'), {
  classification: 'security',
  scope: 'run',
  stage: 'repository',
});
throw error;
`,
  );

  const summary = await runFixture(fixture, successfulDependencies(events));

  assert.equal(summary.result, 'FAIL');
  assert.equal(events.includes('acquire:base-ui'), false);
  assert.equal(events.includes('acquire:zag'), true);
  const failure = await readAttempt(fixture.evidenceRoot, 'base-ui', 'adapter');
  assert.equal(failure.classification, 'policy');
  assert.equal(failure.observed.scope, 'candidate');
  assert.equal(failure.observed.message, 'adversarial adapter failure');
  await assertOwnedRootsRemoved(fixture.temporaryDirectory);
});

test('re-enforces candidate-local metadata when a caller reuses and mutates a normalized Error', async (t) => {
  const fixture = await createFixture(t);
  const events = [];
  const reusedError = new Error('artifact checksum mismatch');
  const dependencies = successfulDependencies(events, {
    acquireExternalArtifact: async ({ record }) => {
      if (record.name === '@base-ui-components/react') {
        reusedError.classification = 'security';
        reusedError.scope = 'run';
        reusedError.stage = 'repository';
      }
      throw reusedError;
    },
  });

  const summary = await runFixture(fixture, dependencies);

  assert.equal(summary.result, 'FAIL');
  assert.equal(events.includes('acquire:zag'), true);
  for (const candidateId of ['radix', 'base-ui', 'zag']) {
    const failure = await readAttempt(fixture.evidenceRoot, candidateId, 'artifact');
    assert.equal(failure.classification, 'security');
    assert.equal(failure.observed.scope, 'candidate');
  }
  await assertOwnedRootsRemoved(fixture.temporaryDirectory);
});

test('detects a real top-level adapter repository mutation before loading the next adapter', async (t) => {
  const fixture = await createFixture(t);
  const events = [];
  await writeFile(
    join(
      fixture.repositoryRoot,
      'tools',
      'overlay-foundation-evaluation',
      'candidates',
      'base-ui.mjs',
    ),
    `import { writeFileSync } from 'node:fs';
writeFileSync(${JSON.stringify(fixture.trackedFile)}, 'mutated during adapter import\\n');
export const adapterDescriptor = ${JSON.stringify({
      candidateId: 'base-ui',
      supportedContractIds: ['OF-MODAL'],
    })};
`,
  );

  await assert.rejects(
    runFixture(fixture, successfulDependencies(events), fileBackedRepositoryCommand(fixture)),
    /repository worktree changed/u,
  );

  assert.equal(events.includes('load-adapter:zag'), false);
  assert.equal(events.includes('characterize:incumbent'), false);
  assert.equal(events.includes('cleanup-owned-root'), false);
  const failure = await readAttempt(fixture.evidenceRoot, 'base-ui', 'repository');
  assert.equal(failure.result, 'FAIL');
  assert.equal(failure.classification, 'policy');
  assert.equal(failure.observed.scope, 'run');
  assert.equal((await repositoryAttemptPaths(fixture.evidenceRoot)).length, 1);
  await assert.rejects(readAttempt(fixture.evidenceRoot, 'incumbent', 'artifact'), {
    code: 'ENOENT',
  });
  await assertOwnedRootsRemoved(fixture.temporaryDirectory);
});

test('preserves deferred adapter metadata when incumbent characterization reuses the same Error', async (t) => {
  const fixture = await createFixture(t);
  const events = [];
  const sharedError = new Error('shared adapter and incumbent failure');
  const sharedKey = `overlay-core-shared-error:${fixture.root}`;
  const sharedSymbol = Symbol.for(sharedKey);
  globalThis[sharedSymbol] = sharedError;
  t.after(() => {
    delete globalThis[sharedSymbol];
  });
  await writeFile(
    join(
      fixture.repositoryRoot,
      'tools',
      'overlay-foundation-evaluation',
      'candidates',
      'radix.mjs',
    ),
    `throw globalThis[Symbol.for(${JSON.stringify(sharedKey)})];\n`,
  );

  const summary = await runFixture(
    fixture,
    successfulDependencies(events, {
      characterizeIncumbent: async () => {
        throw sharedError;
      },
    }),
  );

  assert.equal(summary.result, 'FAIL');
  assert.equal(events.includes('acquire:radix'), false);
  assert.equal(events.includes('acquire:base-ui'), true);
  assert.equal(events.includes('acquire:zag'), true);
  const incumbentFailure = await readAttempt(fixture.evidenceRoot, 'incumbent', 'artifact');
  assert.equal(incumbentFailure.classification, 'packaging');
  assert.equal(incumbentFailure.observed.scope, 'candidate');
  const radixFailure = await readAttempt(fixture.evidenceRoot, 'radix', 'adapter');
  assert.equal(radixFailure.classification, 'policy');
  assert.equal(radixFailure.observed.scope, 'candidate');
  assert.equal(radixFailure.observed.message, 'shared adapter and incumbent failure');
  assert.equal((await readAttempt(fixture.evidenceRoot, 'base-ui', 'installation')).result, 'PASS');
  assert.equal((await readAttempt(fixture.evidenceRoot, 'zag', 'installation')).result, 'PASS');
  await assertOwnedRootsRemoved(fixture.temporaryDirectory);
});

test('assigns fresh metadata snapshots when external stages reuse the same Error', async (t) => {
  const fixture = await createFixture(t);
  const events = [];
  const sharedError = new Error('shared external candidate failure');
  const dependencies = successfulDependencies(events, {
    acquireExternalArtifact: async ({ record, destinationRoot }) => {
      if (record.name === '@radix-ui/react-dialog') throw sharedError;
      return writeAcquiredArtifact(record, destinationRoot);
    },
    installExternalCandidate: async ({ candidate, runRoot }) => {
      if (candidate.id === 'base-ui') throw sharedError;
      return writeInstallEvidence(candidate, runRoot);
    },
  });

  const summary = await runFixture(fixture, dependencies);

  assert.equal(summary.result, 'FAIL');
  const radixFailure = await readAttempt(fixture.evidenceRoot, 'radix', 'artifact');
  assert.equal(radixFailure.classification, 'packaging');
  assert.equal(radixFailure.observed.scope, 'candidate');
  const baseFailure = await readAttempt(fixture.evidenceRoot, 'base-ui', 'installation');
  assert.equal(baseFailure.classification, 'infrastructure');
  assert.equal(baseFailure.observed.scope, 'candidate');
  assert.equal(events.includes('install:radix'), false);
  assert.equal(events.includes('acquire:zag'), true);
  assert.equal((await readAttempt(fixture.evidenceRoot, 'zag', 'installation')).result, 'PASS');
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

  const summary = await runFixture(
    fixture,
    successfulDependencies(events, {
      characterizeIncumbent: async ({ outputRoot }) => {
        const characterization = await writeIncumbentCharacterization(outputRoot);
        characterization.artifacts.reverse();
        return characterization;
      },
    }),
  );

  assert.equal(summary.result, 'PASS');
  assert.equal((await readAttempt(fixture.evidenceRoot, 'incumbent', 'artifact')).result, 'PASS');
});

test('detects an actual repository mutation before recording or continuing an incumbent failure', async (t) => {
  const fixture = await createFixture(t);
  const events = [];
  const dependencies = successfulDependencies(events, {
    characterizeIncumbent: async () => {
      await writeFile(fixture.trackedFile, 'mutated during incumbent characterization\n');
      throw new Error('synthetic incumbent characterization failure');
    },
  });

  await assert.rejects(
    runFixture(fixture, dependencies, fileBackedRepositoryCommand(fixture)),
    /repository worktree changed/u,
  );

  assert.equal(events.includes('acquire:radix'), false);
  const failure = await readAttempt(fixture.evidenceRoot, 'incumbent', 'repository');
  assert.equal(failure.result, 'FAIL');
  assert.equal(failure.classification, 'policy');
  assert.equal(failure.observed.scope, 'run');
  await assert.rejects(readAttempt(fixture.evidenceRoot, 'incumbent', 'artifact'), {
    code: 'ENOENT',
  });
  await assertOwnedRootsRemoved(fixture.temporaryDirectory);
});

test('detects an actual repository mutation before continuing a candidate-local acquisition failure', async (t) => {
  const fixture = await createFixture(t);
  const events = [];
  const dependencies = successfulDependencies(events, {
    acquireExternalArtifact: async ({ record, destinationRoot }) => {
      if (record.name === '@base-ui-components/react') {
        await writeFile(fixture.trackedFile, 'mutated during candidate acquisition\n');
        throw new Error('artifact checksum mismatch');
      }
      return writeAcquiredArtifact(record, destinationRoot);
    },
  });

  await assert.rejects(
    runFixture(fixture, dependencies, fileBackedRepositoryCommand(fixture)),
    /repository worktree changed/u,
  );

  assert.equal(events.includes('acquire:zag'), false);
  const failure = await readAttempt(fixture.evidenceRoot, 'base-ui', 'repository');
  assert.equal(failure.result, 'FAIL');
  assert.equal(failure.classification, 'policy');
  assert.equal(failure.observed.scope, 'run');
  assert.equal(events.at(-1), 'cleanup-owned-root');
  await assertOwnedRootsRemoved(fixture.temporaryDirectory);
});

test('rechecks repository integrity after writing a candidate-local failure and before continuing', async (t) => {
  const fixture = await createFixture(t);
  const events = [];
  const dependencies = successfulDependencies(events, {
    acquireExternalArtifact: async ({ record, destinationRoot }) => {
      if (record.name === '@base-ui-components/react') {
        throw new Error('artifact checksum mismatch');
      }
      return writeAcquiredArtifact(record, destinationRoot);
    },
    writeAttempt: async (input) => {
      await writeAttempt(input);
      if (input.attempt.candidateId === 'base-ui') {
        await writeFile(fixture.trackedFile, 'mutated while recording local failure\n');
      }
    },
  });

  await assert.rejects(
    runFixture(fixture, dependencies, fileBackedRepositoryCommand(fixture)),
    /repository worktree changed/u,
  );

  assert.equal(events.includes('acquire:zag'), false);
  const failure = await readAttempt(fixture.evidenceRoot, 'base-ui', 'repository');
  assert.equal(failure.result, 'FAIL');
  assert.equal(failure.observed.scope, 'run');
  await assertOwnedRootsRemoved(fixture.temporaryDirectory);
});

test('rechecks repository integrity after a PASS write before starting the next candidate', async (t) => {
  const fixture = await createFixture(t);
  const events = [];
  const dependencies = successfulDependencies(events, {
    writeAttempt: async (input) => {
      await writeAttempt(input);
      if (input.attempt.candidateId === 'radix' && input.attempt.result === 'PASS') {
        await writeFile(fixture.trackedFile, 'mutated while recording PASS evidence\n');
      }
    },
  });

  await assert.rejects(
    runFixture(fixture, dependencies, fileBackedRepositoryCommand(fixture)),
    /repository worktree changed/u,
  );

  assert.equal(events.includes('acquire:base-ui'), false);
  assert.equal(events.includes('acquire:zag'), false);
  assert.equal((await readAttempt(fixture.evidenceRoot, 'radix', 'installation')).result, 'PASS');
  const failure = await readAttempt(fixture.evidenceRoot, 'radix', 'repository');
  assert.equal(failure.result, 'FAIL');
  assert.equal(failure.classification, 'policy');
  assert.equal(failure.observed.scope, 'run');
  assert.equal((await repositoryAttemptPaths(fixture.evidenceRoot)).length, 1);
  await assert.rejects(readAttempt(fixture.evidenceRoot, 'base-ui', 'installation'), {
    code: 'ENOENT',
  });
  await assertOwnedRootsRemoved(fixture.temporaryDirectory);
});

test('detects an actual repository mutation before writing a candidate installation PASS', async (t) => {
  const fixture = await createFixture(t);
  const events = [];
  const dependencies = successfulDependencies(events, {
    installExternalCandidate: async ({ candidate }) => {
      if (candidate.id === 'radix') {
        await writeFile(fixture.trackedFile, 'mutated during candidate installation\n');
      }
      return { candidateId: candidate.id };
    },
  });

  await assert.rejects(
    runFixture(fixture, dependencies, fileBackedRepositoryCommand(fixture)),
    /repository worktree changed/u,
  );

  assert.equal(events.includes('acquire:base-ui'), false);
  const failure = await readAttempt(fixture.evidenceRoot, 'radix', 'repository');
  assert.equal(failure.result, 'FAIL');
  assert.equal(failure.observed.scope, 'run');
  await assert.rejects(readAttempt(fixture.evidenceRoot, 'radix', 'installation'), {
    code: 'ENOENT',
  });
  await assertOwnedRootsRemoved(fixture.temporaryDirectory);
});

test('writes an immutable repository failure when the final status check detects mutation', async (t) => {
  const fixture = await createFixture(t);
  const events = [];
  let mutateOnStatus = false;
  const dependencies = successfulDependencies(events, {
    event: (event) => {
      events.push(event);
      if (event === 'verify-repository-unchanged') mutateOnStatus = true;
    },
  });
  const repositoryCommand = fileBackedRepositoryCommand(fixture);
  const runCommand = async (...args) => {
    if (mutateOnStatus) {
      mutateOnStatus = false;
      await writeFile(fixture.trackedFile, 'mutated before final status\n');
    }
    return repositoryCommand(...args);
  };

  await assert.rejects(
    runFixture(fixture, dependencies, runCommand),
    /repository worktree changed/u,
  );

  const failure = await readAttempt(fixture.evidenceRoot, 'zag', 'repository');
  assert.equal(failure.result, 'FAIL');
  assert.equal(failure.classification, 'policy');
  assert.equal(failure.observed.scope, 'run');
  assert.equal(events.at(-1), 'cleanup-owned-root');
  await assertOwnedRootsRemoved(fixture.temporaryDirectory);
});

test('ownership corruption is run-fatal and prevents the next candidate from starting', async (t) => {
  const fixture = await createFixture(t);
  const events = [];
  const ownershipError = Object.assign(new Error('run-root ownership mismatch'), {
    classification: 'infrastructure',
    scope: 'candidate',
    stage: 'installation',
  });
  const dependencies = successfulDependencies(events, {
    installExternalCandidate: async ({ candidate }) => {
      if (candidate.id === 'radix') throw ownershipError;
      return { candidateId: candidate.id };
    },
  });

  await assert.rejects(runFixture(fixture, dependencies), (error) => {
    assert.equal(error, ownershipError);
    assert.equal(error.classification, 'policy');
    assert.equal(error.scope, 'run');
    assert.equal(error.stage, 'repository');
    return true;
  });

  assert.equal(events.includes('acquire:base-ui'), false);
  const failure = await readAttempt(fixture.evidenceRoot, 'radix', 'repository');
  assert.equal(failure.classification, 'policy');
  assert.equal(failure.observed.scope, 'run');
  await assertOwnedRootsRemoved(fixture.temporaryDirectory);
});

test('an evidence-write failure is run-fatal and prevents Zag from starting', async (t) => {
  const fixture = await createFixture(t);
  const events = [];
  const evidenceError = Object.assign(new Error('synthetic evidence write failure'), {
    classification: 'security',
    scope: 'candidate',
    stage: 'artifact',
  });
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
    assert.equal(error.stage, 'installation');
    return true;
  });

  assert.equal(events.includes('acquire:zag'), false);
  assert.equal(events.at(-1), 'cleanup-owned-root');
  await assertOwnedRootsRemoved(fixture.temporaryDirectory);
});

test('wraps a frozen evidence failure with its cause while forcing run-fatal metadata', async (t) => {
  const fixture = await createFixture(t);
  const events = [];
  const evidenceError = Object.freeze(
    Object.assign(new Error('frozen evidence write failure'), {
      classification: 'security',
      scope: 'candidate',
      stage: 'artifact',
    }),
  );
  const dependencies = successfulDependencies(events, {
    writeAttempt: async (input) => {
      if (input.attempt.candidateId === 'base-ui') throw evidenceError;
      return writeAttempt(input);
    },
  });

  await assert.rejects(runFixture(fixture, dependencies), (error) => {
    assert.notEqual(error, evidenceError);
    assert.equal(error.cause, evidenceError);
    assert.equal(error.classification, 'policy');
    assert.equal(error.scope, 'run');
    assert.equal(error.stage, 'installation');
    return true;
  });
  assert.equal(events.includes('acquire:zag'), false);
  await assertOwnedRootsRemoved(fixture.temporaryDirectory);
});

test('re-normalizes a prior run-fatal wrapper at the incumbent boundary despite forged preservation fields', async (t) => {
  const priorFixture = await createFixture(t);
  const priorEvents = [];
  const frozenEvidenceError = Object.freeze(new Error('prior frozen evidence failure'));
  let priorRunFatalWrapper;
  await assert.rejects(
    runFixture(
      priorFixture,
      successfulDependencies(priorEvents, {
        writeAttempt: async (input) => {
          if (input.attempt.candidateId === 'base-ui') throw frozenEvidenceError;
          return writeAttempt(input);
        },
      }),
    ),
    (error) => {
      priorRunFatalWrapper = error;
      assert.equal(error.cause, frozenEvidenceError);
      assert.equal(error.scope, 'run');
      return true;
    },
  );
  priorRunFatalWrapper.code = 'INCUMBENT_MANIFEST_MISMATCH';
  priorRunFatalWrapper.incumbentManifestMismatch = true;

  const fixture = await createFixture(t);
  const events = [];
  const summary = await runFixture(
    fixture,
    successfulDependencies(events, {
      characterizeIncumbent: async () => {
        throw priorRunFatalWrapper;
      },
    }),
  );

  assert.equal(summary.result, 'FAIL');
  assert.equal(events.includes('acquire:radix'), true);
  assert.equal(events.includes('acquire:zag'), true);
  const failure = await readAttempt(fixture.evidenceRoot, 'incumbent', 'artifact');
  assert.equal(failure.classification, 'packaging');
  assert.equal(failure.observed.scope, 'candidate');
  assert.equal(failure.observed.message, 'prior frozen evidence failure');
  await assert.rejects(readAttempt(fixture.evidenceRoot, 'incumbent', 'installation'), {
    code: 'ENOENT',
  });
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
      assert.equal(error, invalid);
      assert.equal(error.classification, 'policy');
      assert.equal(error.scope, 'run');
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
  const cleanupError = Object.assign(new Error('synthetic cleanup failure'), {
    classification: 'security',
    scope: 'candidate',
    stage: 'artifact',
  });
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
    assert.equal(error.errors[1].classification, 'policy');
    assert.equal(error.errors[1].scope, 'run');
    assert.equal(error.errors[1].stage, 'repository');
    return true;
  });
  await assertOwnedRootsRemoved(fixture.temporaryDirectory);
});

test('normalizes an invalid evidence root before creating an owned run root', async (t) => {
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
  assert.equal(events.includes('cleanup-owned-root'), false);
  await assertOwnedRootsRemoved(fixture.temporaryDirectory);
});

test('rejects an evidence-root symlink into a foreign owned root before writing or cleanup', async (t) => {
  const fixture = await createFixture(t);
  const events = [];
  let writes = 0;
  const foreignOwned = await createOwnedRunRoot({
    tmpdir: fixture.temporaryDirectory,
    runId: 'foreign-evidence-owner',
  });
  const foreignEvidence = join(foreignOwned.runRoot, 'foreign-evidence');
  const foreignSentinel = join(foreignEvidence, 'preserve.txt');
  await mkdir(foreignEvidence);
  await writeFile(foreignSentinel, 'foreign evidence must survive\n');
  await symlink(foreignEvidence, fixture.evidenceRoot, 'dir');

  try {
    await assert.rejects(
      runFixture(
        fixture,
        successfulDependencies(events, {
          writeAttempt: async () => {
            writes += 1;
            throw new Error('evidence writer must not run');
          },
        }),
      ),
      (error) => {
        assert.equal(error.classification, 'policy');
        assert.equal(error.scope, 'run');
        assert.equal(error.stage, 'repository');
        assert.match(error.message, /evidenceRoot.*symbolic link/u);
        return true;
      },
    );

    assert.equal(writes, 0);
    assert.equal(events.includes('cleanup-owned-root'), false);
    assert.equal(await readFile(foreignSentinel, 'utf8'), 'foreign evidence must survive\n');
  } finally {
    await cleanupOwnedRunRoot({ tmpdir: fixture.temporaryDirectory, ...foreignOwned });
  }
  await assertOwnedRootsRemoved(fixture.temporaryDirectory);
});

test('rejects a canonical evidence directory contained by the current owned run root', async (t) => {
  const fixture = await createFixture(t);
  const events = [];
  let writes = 0;
  const precreatedOwned = await createOwnedRunRoot({
    tmpdir: fixture.temporaryDirectory,
    runId: 'precreated-current-owner',
  });
  fixture.evidenceRoot = join(precreatedOwned.runRoot, 'evidence');

  try {
    await assert.rejects(
      runFixture(
        fixture,
        successfulDependencies(events, {
          createOwnedRunRoot: async () => precreatedOwned,
          writeAttempt: async () => {
            writes += 1;
            throw new Error('evidence writer must not run');
          },
        }),
      ),
      /evidenceRoot must be outside the owned run root/u,
    );
    assert.equal(writes, 0);
    assert.equal(events.at(-1), 'cleanup-owned-root');
  } finally {
    try {
      await access(precreatedOwned.runRoot);
      await cleanupOwnedRunRoot({ tmpdir: fixture.temporaryDirectory, ...precreatedOwned });
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
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
