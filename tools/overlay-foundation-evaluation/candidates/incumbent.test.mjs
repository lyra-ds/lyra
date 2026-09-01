import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { promisify } from 'node:util';
import { test } from 'node:test';

import { characterizeIncumbent, incumbentDescriptor } from './incumbent.mjs';

const execFilePromise = promisify(execFile);
const revision = '1234567890abcdef1234567890abcdef12345678';
const packageFixtures = Object.freeze([
  {
    directory: 'packages/styles',
    license: 'MIT',
    name: '@lyra-ds/styles',
    version: '0.5.0',
  },
  {
    directory: 'packages/react',
    license: 'MIT',
    name: '@lyra-ds/react',
    version: '0.5.0',
  },
  {
    directory: 'packages/alpine',
    license: 'MIT',
    name: '@lyra-ds/alpine',
    version: '0.6.0',
  },
]);

function archiveName(name, version) {
  return `${name.replace(/^@/u, '').replace('/', '-')}-${version}.tgz`;
}

async function makeArchive(root, manifest, fileName) {
  const sourceRoot = join(root, `${fileName}.source`);
  const packageRoot = join(sourceRoot, 'package');
  const path = join(root, fileName);
  await mkdir(packageRoot, { recursive: true });
  await writeFile(join(packageRoot, 'package.json'), JSON.stringify(manifest));
  await execFilePromise('tar', ['-czf', path, '-C', sourceRoot, 'package']);
  return path;
}

async function fixture(t, options = {}) {
  const root = await mkdtemp(join(tmpdir(), 'lyra-incumbent-test-'));
  t.after(() => rm(root, { force: true, recursive: true }));
  const repositoryRoot = join(root, 'repository');
  const outputRoot = join(root, 'packs');
  const fixtureRoot = join(root, 'archive-fixtures');
  await mkdir(outputRoot, { recursive: true });
  await mkdir(fixtureRoot, { recursive: true });

  const archivePaths = new Map();
  for (const packageFixture of packageFixtures) {
    const packageRoot = join(repositoryRoot, packageFixture.directory);
    await mkdir(packageRoot, { recursive: true });
    await writeFile(
      join(packageRoot, 'package.json'),
      JSON.stringify({
        ...packageFixture,
        ...(options.sourceOverrides?.[packageFixture.name] ?? {}),
      }),
    );
    const packedManifest = {
      name: packageFixture.name,
      version: packageFixture.version,
      license: packageFixture.license,
      ...(options.archiveOverrides?.[packageFixture.name] ?? {}),
    };
    const fileName = archiveName(packageFixture.name, packageFixture.version);
    archivePaths.set(
      packageFixture.directory,
      await makeArchive(fixtureRoot, packedManifest, fileName),
    );
  }

  const calls = [];
  let statusCount = 0;
  const runCommand = async (command, args, commandOptions) => {
    calls.push({ args, command, options: commandOptions });
    if (command === 'git' && args[0] === 'rev-parse') {
      return { stdout: `${options.revision ?? revision}\n` };
    }
    if (command === 'git' && args[0] === 'status') {
      statusCount += 1;
      return {
        stdout:
          statusCount === 1
            ? (options.initialStatus ?? '')
            : (options.finalStatus ?? options.initialStatus ?? ''),
      };
    }
    if (command === 'pnpm' && args.includes('pack')) {
      const packageDirectory = args[1];
      if (options.missingTarball !== packageDirectory) {
        const source = archivePaths.get(packageDirectory);
        await copyFile(source, join(outputRoot, basename(source)));
        if (options.extraTarball === packageDirectory) {
          await copyFile(source, join(outputRoot, `extra-${basename(source)}`));
        }
      }
      return { stdout: '' };
    }
    if (command === 'pnpm' && args.includes('build')) return { stdout: '' };
    throw new Error(`unexpected command: ${command} ${args.join(' ')}`);
  };

  return { archivePaths, calls, outputRoot, repositoryRoot, runCommand };
}

test('describes incumbent identity without a result or vendor surface', () => {
  assert.deepEqual(incumbentDescriptor, {
    id: 'incumbent',
    supportedContractIds: ['OF-MODAL', 'OF-ANCHORED', 'OF-MENU', 'OF-TOOLTIP', 'OF-COMPOSED'],
    publicPackages: ['@lyra-ds/styles', '@lyra-ds/react', '@lyra-ds/alpine'],
  });
  assert.equal('result' in incumbentDescriptor, false);
  assert.equal(Object.isFrozen(incumbentDescriptor), true);
  assert.equal(Object.isFrozen(incumbentDescriptor.supportedContractIds), true);
  assert.equal(Object.isFrozen(incumbentDescriptor.publicPackages), true);
});

test('builds, packs, verifies, and hashes the three incumbent packages', async (t) => {
  const setup = await fixture(t);
  const result = await characterizeIncumbent(setup);

  assert.deepEqual(
    setup.calls.map(({ command, args }) => [command, ...args]),
    [
      ['git', 'rev-parse', 'HEAD'],
      ['git', 'status', '--porcelain=v1', '--untracked-files=all'],
      ['pnpm', '--filter', '@lyra-ds/react', 'run', 'build'],
      ['pnpm', '--filter', '@lyra-ds/alpine', 'run', 'build'],
      ['pnpm', '--dir', 'packages/styles', 'pack', '--pack-destination', setup.outputRoot],
      ['pnpm', '--dir', 'packages/react', 'pack', '--pack-destination', setup.outputRoot],
      ['pnpm', '--dir', 'packages/alpine', 'pack', '--pack-destination', setup.outputRoot],
      ['git', 'status', '--porcelain=v1', '--untracked-files=all'],
    ],
  );
  assert.equal(result.schemaVersion, 1);
  assert.equal(result.candidateId, 'incumbent');
  assert.equal(result.revision, revision);
  assert.deepEqual(
    result.artifacts.map(({ name, version, license }) => ({ name, version, license })),
    packageFixtures.map(({ name, version, license }) => ({ name, version, license })),
  );
  for (const artifact of result.artifacts) {
    const bytes = await readFile(artifact.path);
    assert.equal(artifact.bytes, bytes.byteLength);
    assert.equal(artifact.sha256, createHash('sha256').update(bytes).digest('hex'));
  }
});

test('rejects a dirty initial worktree before building', async (t) => {
  const setup = await fixture(t, { initialStatus: ' M packages/react/src/dialog.tsx\n' });
  await assert.rejects(
    characterizeIncumbent(setup),
    /incumbent characterization requires a clean worktree/u,
  );
  assert.equal(
    setup.calls.some(({ command }) => command === 'pnpm'),
    false,
  );
});

test('rejects worktree drift after packing', async (t) => {
  const setup = await fixture(t, { finalStatus: '?? generated.txt\n' });
  await assert.rejects(
    characterizeIncumbent(setup),
    /repository worktree changed during incumbent characterization/u,
  );
});

test('rejects a short revision before inspecting repository status', async (t) => {
  const setup = await fixture(t, { revision: revision.slice(1) });
  await assert.rejects(characterizeIncumbent(setup), /full 40-character lowercase Git SHA/u);
  assert.deepEqual(
    setup.calls.map(({ command }) => command),
    ['git'],
  );
});

for (const [description, option, error] of [
  ['missing', { missingTarball: 'packages/styles' }, /exactly one new \.tgz/u],
  ['extra', { extraTarball: 'packages/styles' }, /exactly one new \.tgz/u],
]) {
  test(`rejects a ${description} tarball`, async (t) => {
    const setup = await fixture(t, option);
    await assert.rejects(characterizeIncumbent(setup), error);
  });
}

test('rejects a tarball package-name mismatch against the source manifest', async (t) => {
  const setup = await fixture(t, {
    archiveOverrides: { '@lyra-ds/styles': { name: '@lyra-ds/not-styles' } },
  });
  await assert.rejects(characterizeIncumbent(setup), /package name mismatch/u);
});

test('rejects a tarball version mismatch against the source manifest', async (t) => {
  const setup = await fixture(t, {
    archiveOverrides: { '@lyra-ds/alpine': { version: '9.9.9' } },
  });
  await assert.rejects(characterizeIncumbent(setup), /package version mismatch/u);
});

test('rejects a non-Lyra source package even when its archive matches', async (t) => {
  const replacement = '@vendor/styles';
  const setup = await fixture(t, {
    archiveOverrides: { '@lyra-ds/styles': { name: replacement } },
    sourceOverrides: { '@lyra-ds/styles': { name: replacement } },
  });
  await assert.rejects(characterizeIncumbent(setup), /unexpected source package name/u);
});
