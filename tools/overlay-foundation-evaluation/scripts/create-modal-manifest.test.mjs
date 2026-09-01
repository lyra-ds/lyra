import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { createModalManifest, main, writeModalManifest } from './create-modal-manifest.mjs';
import { validateCandidateManifest } from '../runner/manifest.mjs';

const revision = '1'.repeat(40);
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
  const root = await mkdtemp(join(tmpdir(), 'lyra-modal-manifest-test-'));
  t.after(() => rm(root, { force: true, recursive: true }));
  return {
    incumbentPath: join(root, 'incumbent.json'),
    outputPath: join(root, 'candidates.json'),
  };
}

test('binds one manifest to the exact incumbent characterization revision', () => {
  const manifest = createModalManifest({
    lyraRevision: revision,
    incumbentCharacterization: incumbentCharacterization(),
  });
  assert.equal(manifest.lyraRevision, revision);
  assert.equal(manifest.candidates[0].revision, revision);
  assert.deepEqual(
    manifest.candidates.map(({ id }) => id),
    ['incumbent', 'radix', 'base-ui', 'zag'],
  );
  assert.deepEqual(
    manifest.candidates.map(({ contracts }) => contracts),
    [['OF-MODAL'], ['OF-MODAL'], ['OF-MODAL'], ['OF-MODAL']],
  );
  assert.deepEqual(manifest.candidates[0].artifacts, [
    { source: 'workspace-pack', ...incumbentArtifacts[0] },
    { source: 'workspace-pack', ...incumbentArtifacts[1] },
    { source: 'workspace-pack', ...incumbentArtifacts[2] },
  ]);
});

test('rejects an incumbent characterization bound to another revision', () => {
  assert.throws(
    () =>
      createModalManifest({
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
    () => createModalManifest({ lyraRevision: revision, incumbentCharacterization: reordered }),
    /artifacts must be exactly the canonical incumbent package records/u,
  );
  assert.throws(
    () => createModalManifest({ lyraRevision: revision, incumbentCharacterization: missing }),
    /artifacts must be exactly the canonical incumbent package records/u,
  );
});

test('rejects an incumbent artifact with an invalid hash', () => {
  const artifacts = incumbentArtifacts.map((artifact) => ({ ...artifact }));
  artifacts[1].sha256 = 'not-a-sha';
  assert.throws(
    () =>
      createModalManifest({
        lyraRevision: revision,
        incumbentCharacterization: incumbentCharacterization({ artifacts }),
      }),
    /artifact hash must be a lowercase SHA-256/u,
  );
});

test('produces a manifest accepted by the core validator and rejects a tampered manifest', () => {
  const manifest = createModalManifest({
    lyraRevision: revision,
    incumbentCharacterization: incumbentCharacterization(),
  });
  assert.deepEqual(validateCandidateManifest(manifest, { node: '24.18.0', pnpm: '11.13.1' }), []);
  manifest.candidates[1].artifacts[0].sha256 = 'invalid';
  assert.match(
    validateCandidateManifest(manifest, { node: '24.18.0', pnpm: '11.13.1' }).join('\n'),
    /sha256 must be a lowercase SHA-256/iu,
  );
});

test('writes one canonical manifest exclusively and reuses no mutable characterization fields', async (t) => {
  const setup = await fixture(t);
  await writeFile(setup.incumbentPath, `${JSON.stringify(incumbentCharacterization())}\n`);

  const manifest = await writeModalManifest({
    outputPath: setup.outputPath,
    lyraRevision: revision,
    incumbentPath: setup.incumbentPath,
  });

  const bytes = await readFile(setup.outputPath, 'utf8');
  assert.deepEqual(JSON.parse(bytes), manifest);
  assert.equal(bytes.endsWith('\n'), true);
  await assert.rejects(
    writeModalManifest({
      outputPath: setup.outputPath,
      lyraRevision: revision,
      incumbentPath: setup.incumbentPath,
    }),
    /output path must not exist/u,
  );
});

test('rejects a BOM-prefixed incumbent characterization before writing output', async (t) => {
  const setup = await fixture(t);
  await writeFile(setup.incumbentPath, `\uFEFF${JSON.stringify(incumbentCharacterization())}`);

  await assert.rejects(
    writeModalManifest({
      outputPath: setup.outputPath,
      lyraRevision: revision,
      incumbentPath: setup.incumbentPath,
    }),
    /incumbent characterization must not contain a BOM/u,
  );
  await assert.rejects(readFile(setup.outputPath), { code: 'ENOENT' });
});

for (const [name, argv] of [
  ['unknown argument', ['--unknown', revision]],
  ['duplicate revision', ['--revision', revision, '--revision', revision]],
]) {
  test(`rejects ${name} before reading or writing a manifest`, async () => {
    const errors = [];
    const exitCode = await main({ argv, stderr: { write: (message) => errors.push(message) } });
    assert.equal(exitCode, 1);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /usage: create-modal-manifest\.mjs/u);
  });
}
