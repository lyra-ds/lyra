import { execFile } from 'node:child_process';
import { lstat, mkdir, realpath, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';

import {
  strictDescendant,
  absolutePath,
  copySource,
  verifySnapshots,
  verifyViteToolchain,
  writeExclusive,
  verifyOutput,
  fixtureInstallerArtifacts,
} from './fixture-files.mjs';

import { installExternalCandidate } from './isolation.mjs';

const execFilePromise = promisify(execFile);
const REACT_VERSIONS = new Set(['18.3.1', '19.2.8']);

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

async function defaultRemoveModalRoot(paths) {
  for (const path of [...paths].reverse()) await rm(path, { recursive: true, force: true });
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
    const contractSources = join(fixtureRoot, 'contracts');
    const indexPath = join(fixtureRoot, 'index.html');
    await mkdir(candidateSources, { mode: 0o700 });
    createdPaths.push(candidateSources);
    await mkdir(fixtureSources, { mode: 0o700 });
    createdPaths.push(fixtureSources);
    await mkdir(contractSources, { mode: 0o700 });
    createdPaths.push(contractSources);
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
      [
        'sharedProtocol',
        join(repositoryFixtureRoot, '..', 'shared', 'protocol.mjs'),
        join(fixtureSources, 'shared', 'protocol.mjs'),
      ],
      [
        'sharedResourceTracker',
        join(repositoryFixtureRoot, '..', 'shared', 'resource-tracker.mjs'),
        join(fixtureSources, 'shared', 'resource-tracker.mjs'),
      ],
      [
        'cells',
        join(repositoryFixtureRoot, '..', '..', 'contracts', 'cells.mjs'),
        join(contractSources, 'cells.mjs'),
      ],
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
