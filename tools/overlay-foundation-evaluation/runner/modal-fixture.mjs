import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import { lstat, mkdir, open, realpath, rm, unlink } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { promisify } from 'node:util';

import { installExternalCandidate } from './isolation.mjs';

const execFilePromise = promisify(execFile);
const REACT_VERSIONS = new Set(['18.3.1', '19.2.8']);

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function sameFile(left, right) {
  return left.dev === right.dev && left.ino === right.ino && left.size === right.size;
}

function strictDescendant(parent, child) {
  const childRelative = relative(parent, child);
  return childRelative !== '' && !childRelative.startsWith('..') && !isAbsolute(childRelative);
}

function absolutePath(value, name) {
  if (typeof value !== 'string' || !isAbsolute(value)) throw new Error(`${name} must be absolute`);
  return resolve(value);
}

async function readRegularFileOnce(path, readSourceHandle) {
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

async function copySource({ destination, name, readSourceHandle, source }) {
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

async function verifySnapshots(sourceHashes, runRootReal) {
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

async function verifyViteToolchain(repositoryRoot) {
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

function viteConfig({ fixtureRoot, repositoryRoot }) {
  const contractRoot = join(repositoryRoot, 'tools', 'overlay-foundation-evaluation', 'contracts');
  return Buffer.from(`const target = process.env.LYRA_MODAL_BUILD_TARGET;
if (target !== 'client' && target !== 'ssr') throw new Error('invalid modal build target');
export default {
  root: ${JSON.stringify(fixtureRoot)},
  resolve: {
    alias: {
      'axe-core': ${JSON.stringify(join(repositoryRoot, 'node_modules', 'axe-core', 'axe.js'))},
      'node:util': ${JSON.stringify(
        join(fixtureRoot, 'fixtures', 'modal', 'runtime.react-browser-node-util.mjs'),
      )},
      '../../contracts/modal.mjs': ${JSON.stringify(join(contractRoot, 'modal.mjs'))},
      '../../contracts/protocol.mjs': ${JSON.stringify(join(contractRoot, 'protocol.mjs'))}
    }
  },
  build: {
    copyPublicDir: false,
    rollupOptions: {
      output: {
        entryFileNames: target === 'client' ? 'assets/entry-client.js' : 'entry-server.mjs',
        chunkFileNames: 'assets/chunk-[hash].js',
        assetFileNames: 'assets/asset-[hash][extname]'
      }
    }
  }
};
`);
}

async function writeExclusive(path, bytes) {
  const output = await open(path, 'wx', 0o600);
  try {
    await output.writeFile(bytes);
  } finally {
    await output.close();
  }
}

async function verifyOutput(path, label, runRootReal) {
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

async function defaultRemoveModalRoot(paths) {
  for (const path of [...paths].reverse()) await rm(path, { recursive: true, force: true });
}

function fixtureInstallerArtifacts(candidate, artifacts) {
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

export async function prepareModalFixture(
  {
    candidate,
    artifacts,
    adapterEntry,
    reactVersion,
    runRoot,
    repositoryRoot,
    runCommand = execFilePromise,
  },
  {
    installCandidate = installExternalCandidate,
    readSourceHandle = (handle) => handle.readFile(),
    removeModalRoot = defaultRemoveModalRoot,
  } = {},
) {
  const resolvedRunRoot = absolutePath(runRoot, 'runRoot');
  const resolvedRepositoryRoot = absolutePath(repositoryRoot, 'repositoryRoot');
  const resolvedAdapterEntry = absolutePath(adapterEntry, 'adapterEntry');
  const expectedAdapterEntry = join(
    resolvedRepositoryRoot,
    'tools',
    'overlay-foundation-evaluation',
    'candidates',
    'modal',
    `${candidate?.id}.mjs`,
  );
  let canonicalAdapterEntry;
  let canonicalCandidatesDirectory;
  let canonicalExpectedAdapterEntry;
  let canonicalModalDirectory;
  try {
    [
      canonicalAdapterEntry,
      canonicalCandidatesDirectory,
      canonicalExpectedAdapterEntry,
      canonicalModalDirectory,
    ] = await Promise.all([
      realpath(resolvedAdapterEntry),
      realpath(
        join(resolvedRepositoryRoot, 'tools', 'overlay-foundation-evaluation', 'candidates'),
      ),
      realpath(expectedAdapterEntry),
      realpath(dirname(expectedAdapterEntry)),
    ]);
  } catch (error) {
    throw new Error('adapterEntry must resolve to the selected private candidate adapter', {
      cause: error,
    });
  }
  if (canonicalAdapterEntry !== resolvedAdapterEntry) {
    throw new Error('adapterEntry must be a canonical regular file, not a symbolic link');
  }
  if (
    canonicalAdapterEntry !== canonicalExpectedAdapterEntry ||
    !strictDescendant(canonicalCandidatesDirectory, canonicalModalDirectory) ||
    !strictDescendant(canonicalModalDirectory, canonicalAdapterEntry)
  ) {
    throw new Error('adapterEntry must be the selected private candidate adapter');
  }
  if (!REACT_VERSIONS.has(reactVersion)) {
    throw new Error('reactVersion must equal 18.3.1 or 19.2.8');
  }
  const runRootInfo = await lstat(resolvedRunRoot);
  if (!runRootInfo.isDirectory() || runRootInfo.isSymbolicLink()) {
    throw new Error('runRoot must be a real directory');
  }
  const runRootReal = await realpath(resolvedRunRoot);
  const vitePath = await verifyViteToolchain(resolvedRepositoryRoot);
  const createdPaths = [];
  let primaryError;
  try {
    const installation = await installCandidate({
      candidate,
      artifacts: fixtureInstallerArtifacts(candidate, artifacts),
      fixtureDependencies: { react: reactVersion, 'react-dom': reactVersion },
      runRoot: resolvedRunRoot,
      repositoryRoot: resolvedRepositoryRoot,
      runCommand,
    });
    const fixtureRoot = dirname(
      absolutePath(installation.fixtureManifestPath, 'fixtureManifestPath'),
    );
    if (!strictDescendant(resolvedRunRoot, fixtureRoot)) {
      throw new Error('fixture root must be inside the owned run root');
    }
    const fixtureInfo = await lstat(fixtureRoot);
    if (!fixtureInfo.isDirectory() || fixtureInfo.isSymbolicLink()) {
      throw new Error('fixture root must be a real directory');
    }
    const fixtureRootReal = await realpath(fixtureRoot);
    if (!strictDescendant(runRootReal, fixtureRootReal) || fixtureRootReal !== fixtureRoot) {
      throw new Error('fixture root must resolve inside the owned run root');
    }

    const modalRoot = join(fixtureRoot, 'modal-fixture');
    await mkdir(modalRoot, { mode: 0o700 });
    createdPaths.push(modalRoot);
    const candidateSources = join(fixtureRoot, 'candidates');
    const fixtureSources = join(fixtureRoot, 'fixtures');
    const indexPath = join(fixtureRoot, 'index.html');
    await mkdir(candidateSources, { mode: 0o700 });
    createdPaths.push(candidateSources);
    await mkdir(fixtureSources, { mode: 0o700 });
    createdPaths.push(fixtureSources);
    const repositoryFixtureRoot = join(
      resolvedRepositoryRoot,
      'tools',
      'overlay-foundation-evaluation',
      'fixtures',
      'modal',
    );
    const specifications = [
      ['adapter', resolvedAdapterEntry, join(candidateSources, 'modal', 'adapter.mjs')],
      [
        'protocol',
        join(repositoryFixtureRoot, 'protocol.mjs'),
        join(fixtureSources, 'modal', 'protocol.mjs'),
      ],
      [
        'runtime',
        join(repositoryFixtureRoot, 'runtime.mjs'),
        join(fixtureSources, 'modal', 'runtime.mjs'),
      ],
      [
        'runtimeBrowserNodeUtil',
        join(repositoryFixtureRoot, 'runtime.react-browser-node-util.mjs'),
        join(fixtureSources, 'modal', 'runtime.react-browser-node-util.mjs'),
      ],
      [
        'entryClient',
        join(repositoryFixtureRoot, 'entry-client.mjs'),
        join(fixtureSources, 'modal', 'entry-client.mjs'),
      ],
      [
        'entryServer',
        join(repositoryFixtureRoot, 'entry-server.mjs'),
        join(fixtureSources, 'modal', 'entry-server.mjs'),
      ],
      ['indexHtml', join(repositoryFixtureRoot, 'index.html'), indexPath],
    ];
    const sourceHashes = {};
    for (const [name, source, destination] of specifications) {
      sourceHashes[name] = await copySource({
        destination,
        name,
        readSourceHandle,
        source,
      });
      if (destination === indexPath) createdPaths.push(indexPath);
    }

    const configPath = join(modalRoot, 'vite.config.mjs');
    await writeExclusive(
      configPath,
      viteConfig({ fixtureRoot, repositoryRoot: resolvedRepositoryRoot }),
    );
    await verifySnapshots(sourceHashes, runRootReal);

    const clientRoot = join(modalRoot, 'dist-client');
    const ssrRoot = join(modalRoot, 'dist-ssr');
    const commonArgs = [vitePath, 'build', fixtureRoot, '--config', configPath];
    const commandEnvironment = { ...process.env };
    await runCommand(
      process.execPath,
      [...commonArgs, '--outDir', clientRoot, '--emptyOutDir', '--logLevel', 'silent'],
      {
        cwd: fixtureRoot,
        env: { ...commandEnvironment, LYRA_MODAL_BUILD_TARGET: 'client' },
      },
    );
    await verifySnapshots(sourceHashes, runRootReal);
    const clientPath = join(clientRoot, 'assets', 'entry-client.js');
    const clientHtmlPath = join(clientRoot, 'index.html');
    const clientSha256 = await verifyOutput(clientPath, 'client entry', runRootReal);
    const clientHtmlSha256 = await verifyOutput(clientHtmlPath, 'client HTML', runRootReal);

    await runCommand(
      process.execPath,
      [
        ...commonArgs,
        '--outDir',
        ssrRoot,
        '--emptyOutDir',
        '--logLevel',
        'silent',
        '--ssr',
        sourceHashes.entryServer.path,
      ],
      {
        cwd: fixtureRoot,
        env: { ...commandEnvironment, LYRA_MODAL_BUILD_TARGET: 'ssr' },
      },
    );
    await verifySnapshots(sourceHashes, runRootReal);
    const ssrPath = join(ssrRoot, 'entry-server.mjs');
    const ssrSha256 = await verifyOutput(ssrPath, 'SSR entry', runRootReal);

    return Object.freeze({
      ...installation,
      clientHtmlPath,
      clientHtmlSha256,
      clientPath,
      clientSha256,
      cleanup: Object.freeze({ paths: Object.freeze([...createdPaths]), runRoot: resolvedRunRoot }),
      sourceHashes: Object.freeze(sourceHashes),
      ssrPath,
      ssrSha256,
    });
  } catch (error) {
    primaryError = error;
  }

  try {
    await removeModalRoot(createdPaths);
  } catch (cleanupError) {
    throw new AggregateError(
      [primaryError, cleanupError],
      'modal fixture preparation and cleanup both failed',
    );
  }
  throw primaryError;
}
