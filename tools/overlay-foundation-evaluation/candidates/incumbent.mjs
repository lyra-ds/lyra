import { execFile } from 'node:child_process';
import { mkdir, readFile, readdir } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { promisify } from 'node:util';

import { CONTRACT_IDS, isPlainRecord } from '../contracts/protocol.mjs';
import { inspectPackageArchive, sha256 } from '../runner/artifacts.mjs';

const execFilePromise = promisify(execFile);
const FULL_SHA = /^[a-f0-9]{40}$/u;
const PACKAGE_DIRECTORIES = Object.freeze(['packages/styles', 'packages/react', 'packages/alpine']);

export const incumbentDescriptor = Object.freeze({
  id: 'incumbent',
  supportedContractIds: CONTRACT_IDS,
  publicPackages: Object.freeze(['@lyra-ds/styles', '@lyra-ds/react', '@lyra-ds/alpine']),
});

export const adapterDescriptor = Object.freeze({
  candidateId: 'incumbent',
  supportedContractIds: Object.freeze(['OF-MODAL']),
});

export const modalAdapterPath = 'candidates/modal/incumbent.mjs';

function stdout(result) {
  const output = isPlainRecord(result) && Object.hasOwn(result, 'stdout') ? result.stdout : result;
  if (typeof output === 'string') return output;
  if (ArrayBuffer.isView(output)) {
    return Buffer.from(output.buffer, output.byteOffset, output.byteLength).toString('utf8');
  }
  throw new Error('command must return stdout bytes or a string');
}

async function defaultRunCommand(command, args, options = {}) {
  return execFilePromise(command, args, { ...options, maxBuffer: 50_000_000 });
}

function requireFullSha(revision) {
  if (!FULL_SHA.test(revision)) {
    throw new Error('revision must be a full 40-character lowercase Git SHA');
  }
}

async function readStatus(runCommand, repositoryRoot) {
  return stdout(
    await runCommand('git', ['status', '--porcelain=v1', '--untracked-files=all'], {
      cwd: repositoryRoot,
    }),
  );
}

async function readSourceManifest(repositoryRoot, packageDirectory) {
  let manifest;
  try {
    manifest = JSON.parse(
      await readFile(join(repositoryRoot, packageDirectory, 'package.json'), 'utf8'),
    );
  } catch (error) {
    throw new Error(`source package manifest is missing or invalid: ${packageDirectory}`, {
      cause: error,
    });
  }
  if (!isPlainRecord(manifest)) {
    throw new Error(`source package manifest must be a plain JSON object: ${packageDirectory}`);
  }
  for (const field of ['name', 'version', 'license']) {
    if (typeof manifest[field] !== 'string' || manifest[field].trim().length === 0) {
      throw new Error(`source package manifest ${field} must be a non-empty string`);
    }
  }
  return { license: manifest.license, name: manifest.name, version: manifest.version };
}

async function packAndInspect({
  repositoryRoot,
  packageDirectory,
  expectedPackageName,
  outputRoot,
  runCommand,
}) {
  const record = await readSourceManifest(repositoryRoot, packageDirectory);
  if (record.name !== expectedPackageName) {
    throw new Error(
      `unexpected source package name for ${packageDirectory}: expected ${expectedPackageName}`,
    );
  }
  const before = new Set(await readdir(outputRoot));
  await runCommand('pnpm', ['--dir', packageDirectory, 'pack', '--pack-destination', outputRoot], {
    cwd: repositoryRoot,
  });
  const createdTarballs = (await readdir(outputRoot)).filter(
    (name) => name.endsWith('.tgz') && !before.has(name),
  );
  if (createdTarballs.length !== 1) {
    throw new Error(
      `package pack must create exactly one new .tgz for ${record.name}; received ${createdTarballs.length}`,
    );
  }

  const path = join(outputRoot, createdTarballs[0]);
  const archiveBytes = await readFile(path);
  const digest = sha256(archiveBytes);
  const inspected = await inspectPackageArchive({
    artifact: {
      bytes: archiveBytes.byteLength,
      path,
      record: { ...record, sha256: digest },
      sha256: digest,
    },
  });
  return {
    bytes: inspected.bytes,
    license: inspected.license,
    lifecycleScripts: inspected.lifecycleScripts,
    name: inspected.packageName,
    path: inspected.path,
    sha256: inspected.sha256,
    version: inspected.packageVersion,
  };
}

export async function characterizeIncumbent({
  repositoryRoot,
  outputRoot,
  runCommand = defaultRunCommand,
}) {
  if (typeof repositoryRoot !== 'string' || !isAbsolute(repositoryRoot)) {
    throw new Error('repositoryRoot must be absolute');
  }
  if (typeof outputRoot !== 'string' || !isAbsolute(outputRoot)) {
    throw new Error('outputRoot must be absolute');
  }
  const resolvedRepositoryRoot = resolve(repositoryRoot);
  const resolvedOutputRoot = resolve(outputRoot);
  const revision = stdout(
    await runCommand('git', ['rev-parse', 'HEAD'], { cwd: resolvedRepositoryRoot }),
  ).trim();
  requireFullSha(revision);
  const before = await readStatus(runCommand, resolvedRepositoryRoot);
  if (before !== '') throw new Error('incumbent characterization requires a clean worktree');

  await runCommand('pnpm', ['--filter', '@lyra-ds/react', 'run', 'build'], {
    cwd: resolvedRepositoryRoot,
  });
  await runCommand('pnpm', ['--filter', '@lyra-ds/alpine', 'run', 'build'], {
    cwd: resolvedRepositoryRoot,
  });
  await mkdir(resolvedOutputRoot, { recursive: true });
  const artifacts = [];
  for (const [index, packageDirectory] of PACKAGE_DIRECTORIES.entries()) {
    artifacts.push(
      await packAndInspect({
        expectedPackageName: incumbentDescriptor.publicPackages[index],
        outputRoot: resolvedOutputRoot,
        packageDirectory,
        repositoryRoot: resolvedRepositoryRoot,
        runCommand,
      }),
    );
  }

  const after = await readStatus(runCommand, resolvedRepositoryRoot);
  if (after !== before) {
    throw new Error('repository worktree changed during incumbent characterization');
  }
  return { artifacts, candidateId: 'incumbent', revision, schemaVersion: 1 };
}
