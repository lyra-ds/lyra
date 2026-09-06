import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import {
  createBehavioralManifest,
  main,
  writeBehavioralManifest,
} from './create-behavioral-manifest.mjs';
import { writeCandidateManifest } from './manifest-common.mjs';
import { validateCandidateManifest } from '../runner/manifest.mjs';

const revision = '1'.repeat(40);
const contracts = ['OF-MODAL', 'OF-ANCHORED', 'OF-MENU', 'OF-TOOLTIP'];
const execFilePromise = promisify(execFile);
const incumbentArtifacts = [
  ['@lyra-ds/styles', '0.5.0', '2'.repeat(64)],
  ['@lyra-ds/react', '0.5.0', '3'.repeat(64)],
  ['@lyra-ds/alpine', '0.6.0', '4'.repeat(64)],
].map(([name, version, sha256]) => ({ name, version, sha256 }));

function incumbentCharacterization(overrides = {}) {
  return {
    schemaVersion: 1,
    candidateId: 'incumbent',
    revision,
    artifacts: incumbentArtifacts.map((artifact) => ({ ...artifact })),
    ...overrides,
  };
}

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'lyra-behavioral-manifest-test-'));
  t.after(() => rm(root, { force: true, recursive: true }));
  return {
    incumbentPath: join(root, 'incumbent.json'),
    outputPath: join(root, 'candidates.json'),
  };
}

test('creates the cumulative four-contract manifest in canonical candidate and artifact order', () => {
  const manifest = createBehavioralManifest({
    lyraRevision: revision,
    incumbentCharacterization: incumbentCharacterization(),
  });
  assert.equal(manifest.lyraRevision, revision);
  assert.deepEqual(
    manifest.candidates.map(({ id }) => id),
    ['incumbent', 'radix', 'base-ui', 'zag'],
  );
  assert.deepEqual(
    manifest.candidates.map((candidate) => candidate.contracts),
    [contracts, contracts, contracts, contracts],
  );
  assert.deepEqual(
    manifest.candidates.slice(1).map(({ id, artifacts }) => ({
      id,
      packages: artifacts.map(({ name }) => name),
    })),
    [
      {
        id: 'radix',
        packages: [
          '@radix-ui/react-dialog',
          '@radix-ui/react-popover',
          '@radix-ui/react-dropdown-menu',
          '@radix-ui/react-tooltip',
        ],
      },
      { id: 'base-ui', packages: ['@base-ui-components/react'] },
      {
        id: 'zag',
        packages: [
          '@zag-js/dialog',
          '@zag-js/popover',
          '@zag-js/menu',
          '@zag-js/tooltip',
          '@zag-js/react',
        ],
      },
    ],
  );
  assert.deepEqual(validateCandidateManifest(manifest, manifest.toolchain), []);
});

test('rejects an incumbent characterization bound to another revision', () => {
  assert.throws(
    () =>
      createBehavioralManifest({
        lyraRevision: revision,
        incumbentCharacterization: incumbentCharacterization({ revision: 'a'.repeat(40) }),
      }),
    /revision must exactly match Lyra revision/u,
  );
});

test('rejects reordered or missing incumbent package records', () => {
  const reordered = incumbentCharacterization({
    artifacts: [incumbentArtifacts[1], incumbentArtifacts[0], incumbentArtifacts[2]],
  });
  const missing = incumbentCharacterization({ artifacts: incumbentArtifacts.slice(0, 2) });

  assert.throws(
    () =>
      createBehavioralManifest({ lyraRevision: revision, incumbentCharacterization: reordered }),
    /artifacts must be exactly the canonical incumbent package records/u,
  );
  assert.throws(
    () => createBehavioralManifest({ lyraRevision: revision, incumbentCharacterization: missing }),
    /artifacts must be exactly the canonical incumbent package records/u,
  );
});

test('rejects an incumbent artifact with an invalid hash', () => {
  const artifacts = incumbentArtifacts.map((artifact) => ({ ...artifact }));
  artifacts[1].sha256 = 'not-a-sha';
  assert.throws(
    () =>
      createBehavioralManifest({
        lyraRevision: revision,
        incumbentCharacterization: incumbentCharacterization({ artifacts }),
      }),
    /artifact hash must be a lowercase SHA-256/u,
  );
});

test('refuses to replace an existing output', async (t) => {
  const setup = await fixture(t);
  const original = 'preserve me';
  await writeFile(setup.incumbentPath, `${JSON.stringify(incumbentCharacterization())}\n`);
  await writeFile(setup.outputPath, original);

  await assert.rejects(
    writeBehavioralManifest({
      outputPath: setup.outputPath,
      lyraRevision: revision,
      incumbentPath: setup.incumbentPath,
    }),
    /output path must not exist/u,
  );
  assert.equal(await readFile(setup.outputPath, 'utf8'), original);
});

test('refuses to write any manifest rejected by the core validator', async (t) => {
  const setup = await fixture(t);
  await writeFile(setup.incumbentPath, `${JSON.stringify(incumbentCharacterization())}\n`);

  await assert.rejects(
    writeCandidateManifest({
      outputPath: setup.outputPath,
      lyraRevision: revision,
      incumbentPath: setup.incumbentPath,
      createManifest: () => ({ schemaVersion: 1 }),
    }),
    /manifest\.lyraRevision/u,
  );
  await assert.rejects(readFile(setup.outputPath), { code: 'ENOENT' });
});

test('writes one validated canonical manifest with private file permissions', async (t) => {
  const setup = await fixture(t);
  await writeFile(setup.incumbentPath, `${JSON.stringify(incumbentCharacterization())}\n`);

  const manifest = await writeBehavioralManifest({
    outputPath: setup.outputPath,
    lyraRevision: revision,
    incumbentPath: setup.incumbentPath,
  });

  const bytes = await readFile(setup.outputPath, 'utf8');
  assert.deepEqual(JSON.parse(bytes), manifest);
  assert.deepEqual(validateCandidateManifest(manifest, manifest.toolchain), []);
  assert.equal(bytes, `${JSON.stringify(manifest, null, 2)}\n`);
  assert.equal((await stat(setup.outputPath)).mode & 0o777, 0o600);
});

test('rejects a BOM-prefixed incumbent characterization before writing output', async (t) => {
  const setup = await fixture(t);
  await writeFile(setup.incumbentPath, `\uFEFF${JSON.stringify(incumbentCharacterization())}`);

  await assert.rejects(
    writeBehavioralManifest({
      outputPath: setup.outputPath,
      lyraRevision: revision,
      incumbentPath: setup.incumbentPath,
    }),
    /incumbent characterization must not contain a BOM/u,
  );
  await assert.rejects(readFile(setup.outputPath), { code: 'ENOENT' });
});

test('rejects malformed incumbent JSON before writing output', async (t) => {
  const setup = await fixture(t);
  await writeFile(setup.incumbentPath, '{"schemaVersion":1');

  await assert.rejects(
    writeBehavioralManifest({
      outputPath: setup.outputPath,
      lyraRevision: revision,
      incumbentPath: setup.incumbentPath,
    }),
    /incumbent characterization must be valid JSON/u,
  );
  await assert.rejects(readFile(setup.outputPath), { code: 'ENOENT' });
});

test('runs the behavioral manifest CLI when invoked through a symlink', async (t) => {
  const setup = await fixture(t);
  const scriptLink = join(tmpdir(), `create-behavioral-manifest-${process.pid}-${Date.now()}.mjs`);
  t.after(() => rm(scriptLink, { force: true }));
  await symlink(
    fileURLToPath(new URL('./create-behavioral-manifest.mjs', import.meta.url)),
    scriptLink,
  );
  await writeFile(setup.incumbentPath, `${JSON.stringify(incumbentCharacterization())}\n`);

  await execFilePromise(process.execPath, [
    scriptLink,
    '--revision',
    revision,
    '--incumbent',
    setup.incumbentPath,
    '--output',
    setup.outputPath,
  ]);

  assert.deepEqual(
    JSON.parse(await readFile(setup.outputPath, 'utf8')).candidates[0].contracts,
    contracts,
  );
});

for (const [name, argv] of [
  ['unknown argument', ['--revision', revision, '--unknown', 'unused', '--output', 'unused']],
  ['duplicate revision', ['--revision', revision, '--revision', revision, '--output', 'unused']],
]) {
  test(`rejects ${name} before reading or writing a behavioral manifest`, async () => {
    const errors = [];
    const exitCode = await main({ argv, stderr: { write: (message) => errors.push(message) } });
    assert.equal(exitCode, 1);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /usage: create-behavioral-manifest\.mjs/u);
  });
}
