import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { promisify } from 'node:util';
import { test } from 'node:test';

import { acquireExternalArtifact, inspectPackageArchive, sha256 } from './artifacts.mjs';

const execFilePromise = promisify(execFile);
const packageManifest = {
  name: '@radix-ui/react-dialog',
  version: '1.2.3',
  license: 'MIT',
};

function externalArtifact(overrides = {}) {
  return {
    source: 'registry',
    name: packageManifest.name,
    version: packageManifest.version,
    tarballUrl: 'https://registry.example.invalid/react-dialog-1.2.3.tgz',
    sha256: '0'.repeat(64),
    license: packageManifest.license,
    repositoryUrl: 'https://github.com/example/react-dialog',
    ...overrides,
  };
}

async function testDirectory(t) {
  const directory = await mkdtemp(join(tmpdir(), 'lyra-overlay-artifacts-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

async function createArchive(
  t,
  manifest,
  { duplicateManifest = false, missingManifest = false } = {},
) {
  const directory = await testDirectory(t);
  const sourceRoot = join(directory, 'source');
  const packageRoot = join(sourceRoot, 'package');
  const archivePath = join(directory, 'candidate.tgz');
  await mkdir(packageRoot, { recursive: true });
  if (missingManifest) {
    await writeFile(join(packageRoot, 'README.md'), 'missing package manifest');
  } else {
    const contents = typeof manifest === 'string' ? manifest : JSON.stringify(manifest);
    await writeFile(join(packageRoot, 'package.json'), contents);
  }
  const members = duplicateManifest ? ['package', 'package/package.json'] : ['package'];
  await execFilePromise('tar', ['-czf', archivePath, '-C', sourceRoot, ...members]);
  const archiveBytes = await readFile(archivePath);
  const digest = sha256(archiveBytes);
  return {
    record: externalArtifact({ sha256: digest }),
    path: archivePath,
    sha256: digest,
    bytes: archiveBytes.byteLength,
  };
}

test('computes an exact lowercase SHA-256 digest', () => {
  assert.equal(
    sha256(new TextEncoder().encode('verified artifact')),
    '2127de9293abf1503418b9f78b3d530cdd2263417064815ee46b7ecdf1215ddc',
  );
});

test('writes an exact artifact only after size and SHA verification', async (t) => {
  const destinationRoot = join(await testDirectory(t), 'downloads');
  await mkdir(destinationRoot);
  const bytes = new TextEncoder().encode('verified artifact');
  const record = externalArtifact({ sha256: sha256(bytes) });
  const result = await acquireExternalArtifact({
    record,
    destinationRoot,
    fetchImpl: async (url, options) => {
      assert.equal(url, record.tarballUrl);
      assert.deepEqual(options, { redirect: 'error' });
      return new Response(bytes, { status: 200 });
    },
    maxBytes: 1024,
  });
  assert.equal(result.sha256, record.sha256);
  assert.equal(result.bytes, bytes.byteLength);
  assert.equal(basename(result.path), `${record.sha256}.tgz`);
  assert.deepEqual(await readFile(result.path), Buffer.from(bytes));
  assert.equal((await stat(result.path)).mode & 0o777, 0o600);
});

test('removes partial output on checksum mismatch', async (t) => {
  const destinationRoot = join(await testDirectory(t), 'downloads');
  await mkdir(destinationRoot);
  const record = externalArtifact({ sha256: '0'.repeat(64) });
  await assert.rejects(
    acquireExternalArtifact({
      record,
      destinationRoot,
      fetchImpl: async () => new Response('wrong', { status: 200 }),
      maxBytes: 1024,
    }),
    /checksum mismatch/u,
  );
  assert.deepEqual(await readdir(destinationRoot), []);
});

test('rejects a checksum with only an altered suffix', async (t) => {
  const destinationRoot = join(await testDirectory(t), 'downloads');
  await mkdir(destinationRoot);
  const bytes = new TextEncoder().encode('verified artifact');
  const digest = sha256(bytes);
  const suffix = digest.endsWith('0') ? '1' : '0';
  const record = externalArtifact({ sha256: `${digest.slice(0, -1)}${suffix}` });
  await assert.rejects(
    acquireExternalArtifact({
      record,
      destinationRoot,
      fetchImpl: async () => new Response(bytes, { status: 200 }),
      maxBytes: 1024,
    }),
    /checksum mismatch/u,
  );
  assert.deepEqual(await readdir(destinationRoot), []);
});

test('rejects redirect, non-200, declared oversize, and streamed oversize responses', async (t) => {
  const destinationRoot = join(await testDirectory(t), 'downloads');
  await mkdir(destinationRoot);
  for (const response of [
    new Response('', { status: 302, headers: { location: 'https://example.invalid/x' } }),
    new Response('', { status: 404 }),
    new Response('tiny', { status: 200, headers: { 'content-length': '2048' } }),
    new Response(new Uint8Array(2048), { status: 200 }),
  ]) {
    await assert.rejects(
      acquireExternalArtifact({
        record: externalArtifact(),
        destinationRoot,
        fetchImpl: async () => response,
        maxBytes: 1024,
      }),
    );
  }
  assert.deepEqual(await readdir(destinationRoot), []);
});

test('uses exclusive output and preserves an existing artifact', async (t) => {
  const destinationRoot = join(await testDirectory(t), 'downloads');
  await mkdir(destinationRoot);
  const bytes = new TextEncoder().encode('verified artifact');
  const record = externalArtifact({ sha256: sha256(bytes) });
  const acquire = () =>
    acquireExternalArtifact({
      record,
      destinationRoot,
      fetchImpl: async () => new Response(bytes, { status: 200 }),
      maxBytes: 1024,
    });
  const first = await acquire();
  await assert.rejects(acquire(), { code: 'EEXIST' });
  assert.deepEqual(await readFile(first.path), Buffer.from(bytes));
});

test('accepts an archive with exact package metadata', async (t) => {
  const artifact = await createArchive(t, packageManifest);
  const result = await inspectPackageArchive({ artifact, runCommand: execFilePromise });
  assert.equal(result.packageName, packageManifest.name);
  assert.equal(result.packageVersion, packageManifest.version);
  assert.equal(result.license, packageManifest.license);
  assert.deepEqual(result.lifecycleScripts, []);
});

test('rejects approved archive bytes replaced between inspection steps', async (t) => {
  const artifact = await createArchive(t, packageManifest);
  const replacement = await createArchive(t, { ...packageManifest, padding: 'different bytes' });
  const replacementBytes = await readFile(replacement.path);
  let tarCalls = 0;

  await assert.rejects(
    inspectPackageArchive({
      artifact,
      runCommand: async (...args) => {
        const result = await execFilePromise(...args);
        tarCalls += 1;
        if (tarCalls === 1) await writeFile(artifact.path, replacementBytes);
        return result;
      },
    }),
    /checksum|identity|size/u,
  );
});

test('rejects a symlink substituted for approved archive bytes', async (t) => {
  const artifact = await createArchive(t, packageManifest);
  const replacement = await createArchive(t, packageManifest);
  await rm(artifact.path);
  await symlink(replacement.path, artifact.path);

  await assert.rejects(
    inspectPackageArchive({ artifact, runCommand: execFilePromise }),
    /symbolic link|regular file|ELOOP/u,
  );
});

test('rejects an archive whose matching license is not a valid SPDX expression', async (t) => {
  const license = 'Definitely-Not-SPDX';
  const artifact = await createArchive(t, { ...packageManifest, license });
  artifact.record.license = license;
  await assert.rejects(
    inspectPackageArchive({ artifact, runCommand: execFilePromise }),
    /SPDX license/u,
  );
});

for (const [field, value] of [
  ['name', '@example/wrong-name'],
  ['version', '1.2.4'],
  ['license', 'Apache-2.0'],
]) {
  test(`rejects an archive with a mismatched ${field}`, async (t) => {
    const artifact = await createArchive(t, { ...packageManifest, [field]: value });
    await assert.rejects(
      inspectPackageArchive({ artifact, runCommand: execFilePromise }),
      new RegExp(`package ${field} mismatch`, 'u'),
    );
  });
}

for (const lifecycleScript of ['preinstall', 'install', 'postinstall', 'prepare']) {
  test(`rejects the forbidden ${lifecycleScript} lifecycle script by itself`, async (t) => {
    const artifact = await createArchive(t, {
      ...packageManifest,
      scripts: { [lifecycleScript]: 'node write-marker.mjs' },
    });
    await assert.rejects(
      inspectPackageArchive({ artifact, runCommand: execFilePromise }),
      new RegExp(lifecycleScript, 'u'),
    );
  });
}

test('rejects duplicate package manifests', async (t) => {
  const artifact = await createArchive(t, packageManifest, { duplicateManifest: true });
  await assert.rejects(
    inspectPackageArchive({ artifact, runCommand: execFilePromise }),
    /exactly one package\/package\.json/u,
  );
});

test('rejects an archive without a package manifest', async (t) => {
  const artifact = await createArchive(t, undefined, { missingManifest: true });
  await assert.rejects(
    inspectPackageArchive({ artifact, runCommand: execFilePromise }),
    /exactly one package\/package\.json/u,
  );
});

test('rejects invalid package manifest JSON', async (t) => {
  const artifact = await createArchive(t, '{invalid');
  await assert.rejects(
    inspectPackageArchive({ artifact, runCommand: execFilePromise }),
    /valid JSON/u,
  );
});

test('rejects a package manifest that is not a plain JSON object', async (t) => {
  const artifact = await createArchive(t, '[]');
  await assert.rejects(
    inspectPackageArchive({ artifact, runCommand: execFilePromise }),
    /plain JSON object/u,
  );
});

test('rejects package manifest output larger than 1 MiB', async (t) => {
  const artifact = await createArchive(t, {
    ...packageManifest,
    padding: 'x'.repeat(1_048_576),
  });
  await assert.rejects(
    inspectPackageArchive({ artifact, runCommand: execFilePromise }),
    /1 MiB|stdout maxBuffer length exceeded/u,
  );
});
