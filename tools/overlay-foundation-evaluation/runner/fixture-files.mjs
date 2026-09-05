import { createHash } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import { lstat, mkdir, open, realpath, unlink } from 'node:fs/promises';
import { dirname, join, isAbsolute, relative, resolve } from 'node:path';

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function sameFile(left, right) {
  return left.dev === right.dev && left.ino === right.ino && left.size === right.size;
}

export function strictDescendant(parent, child) {
  const childRelative = relative(parent, child);
  return childRelative !== '' && !childRelative.startsWith('..') && !isAbsolute(childRelative);
}

export function absolutePath(value, name) {
  if (typeof value !== 'string' || !isAbsolute(value)) throw new Error(`${name} must be absolute`);
  return resolve(value);
}

export async function readRegularFileOnce(path, readSourceHandle) {
  let handle;
  try {
    handle = await open(path, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
  } catch (error) {
    if (error?.code === 'ELOOP') {
      throw new Error(`source must be a regular file, not a symbolic link: ${path}`, {
        cause: error,
      });
    }
    throw error;
  }
  try {
    const before = await handle.stat({ bigint: true });
    if (!before.isFile()) throw new Error(`source must be a regular file: ${path}`);
    const bytes = Buffer.from(await readSourceHandle(handle, path));
    const after = await handle.stat({ bigint: true });
    if (!sameFile(before, after) || BigInt(bytes.byteLength) !== before.size) {
      throw new Error(`source identity or size changed while reading: ${path}`);
    }
    const named = await lstat(path, { bigint: true });
    if (named.isSymbolicLink() || !named.isFile() || !sameFile(before, named)) {
      throw new Error(`source path identity changed while reading: ${path}`);
    }
    return { bytes, sha256: sha256(bytes) };
  } finally {
    await handle.close();
  }
}

export async function copySource({ destination, name, readSourceHandle, source }) {
  const verified = await readRegularFileOnce(source, readSourceHandle);
  await mkdir(dirname(destination), { recursive: true, mode: 0o700 });
  let output;
  let created = false;
  try {
    output = await open(destination, 'wx', 0o600);
    created = true;
    await output.writeFile(verified.bytes);
    await output.close();
    output = undefined;
    const copied = await readRegularFileOnce(destination, (handle) => handle.readFile());
    if (copied.sha256 !== verified.sha256) {
      throw new Error(`copied source checksum changed: ${name}`);
    }
    return Object.freeze({ path: destination, sha256: verified.sha256 });
  } catch (error) {
    await output?.close().catch(() => {});
    if (created) await unlink(destination).catch(() => {});
    throw error;
  }
}

export async function verifySnapshots(sourceHashes, runRootReal) {
  for (const [name, source] of Object.entries(sourceHashes)) {
    const sourceReal = await realpath(source.path);
    if (!strictDescendant(runRootReal, sourceReal)) {
      throw new Error(`copied source escapes the owned run root: ${name}`);
    }
    const verified = await readRegularFileOnce(source.path, (handle) => handle.readFile());
    if (verified.sha256 !== source.sha256) {
      throw new Error(`copied source checksum changed: ${name}`);
    }
  }
}

export async function verifyViteToolchain(repositoryRoot) {
  const read = (path) => readRegularFileOnce(path, (handle) => handle.readFile());
  let repositoryManifest;
  let viteManifest;
  try {
    repositoryManifest = JSON.parse(
      (await read(join(repositoryRoot, 'package.json'))).bytes.toString('utf8'),
    );
    viteManifest = JSON.parse(
      (await read(join(repositoryRoot, 'node_modules', 'vite', 'package.json'))).bytes.toString(
        'utf8',
      ),
    );
  } catch (error) {
    throw new Error('repository Vite toolchain metadata is invalid', { cause: error });
  }
  if (
    repositoryManifest?.devDependencies?.vite !== '8.2.1' ||
    viteManifest?.name !== 'vite' ||
    viteManifest?.version !== '8.2.1'
  ) {
    throw new Error('repository Vite version must equal 8.2.1');
  }
  const vitePath = join(repositoryRoot, 'node_modules', 'vite', 'bin', 'vite.js');
  await read(vitePath);
  let axeManifest;
  try {
    axeManifest = JSON.parse(
      (await read(join(repositoryRoot, 'node_modules', 'axe-core', 'package.json'))).bytes.toString(
        'utf8',
      ),
    );
    await read(join(repositoryRoot, 'node_modules', 'axe-core', 'axe.js'));
  } catch (error) {
    throw new Error('repository axe toolchain metadata is invalid', { cause: error });
  }
  if (axeManifest?.name !== 'axe-core' || axeManifest?.version !== '4.13.0') {
    throw new Error('repository axe-core version must equal 4.13.0');
  }
  return vitePath;
}

export async function writeExclusive(path, bytes) {
  const output = await open(path, 'wx', 0o600);
  try {
    await output.writeFile(bytes);
  } finally {
    await output.close();
  }
}

export async function verifyOutput(path, label, runRootReal) {
  let outputReal;
  try {
    outputReal = await realpath(path);
  } catch (error) {
    throw new Error(`${label} output is missing or invalid`, { cause: error });
  }
  if (!strictDescendant(runRootReal, outputReal)) {
    throw new Error(`${label} output escapes the owned run root`);
  }
  let verified;
  try {
    verified = await readRegularFileOnce(path, (handle) => handle.readFile());
  } catch (error) {
    throw new Error(`${label} output is missing or invalid`, { cause: error });
  }
  return verified.sha256;
}

export function fixtureInstallerArtifacts(candidate, artifacts) {
  if (candidate?.id !== 'incumbent') return artifacts;
  return artifacts.map((artifact) => ({
    ...artifact,
    packageName: artifact.name,
    packageVersion: artifact.version,
    record: {
      source: 'workspace-pack',
      name: artifact.name,
      version: artifact.version,
      sha256: artifact.sha256,
      license: artifact.license,
    },
  }));
}
