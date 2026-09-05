import { execFile } from 'node:child_process';
import { lstat, mkdir, realpath, readdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';

import {
  strictDescendant,
  absolutePath,
  verifySnapshots,
  verifyViteToolchain,
  writeExclusive,
  verifyOutput,
  fixtureInstallerArtifacts,
} from './fixture-files.mjs';

import { readRegularFileOnce, sha256 } from './fixture-files.mjs';
import { validateWave2FixtureRequest } from '../fixtures/wave2/protocol.mjs';
import { createRequire, isBuiltin } from 'node:module';
import ts from 'typescript';
import { resolve, isAbsolute } from 'node:path';

import { installExternalCandidate } from './isolation.mjs';

const execFilePromise = promisify(execFile);
const REACT_VERSIONS = new Set(['18.3.1', '19.2.8']);

function viteConfig({ fixtureRoot, request, contractId, sourceHashes }) {
  const config = {
    root: fixtureRoot,
    define: {
      __LYRA_WAVE2_REQUEST__: canonicalJSON(request),
      __LYRA_WAVE2_CONTRACT__: JSON.stringify(contractId),
    },
    ssr: { noExternal: true },
    build: {
      copyPublicDir: false,
      rollupOptions: {
        output: {
          entryFileNames: 'TARGET_ENTRY',
          chunkFileNames: 'assets/chunk-[hash].js',
          assetFileNames: 'assets/asset-[hash][extname]',
        },
      },
    },
  };
  const guard = `import { realpath } from 'node:fs/promises';
import { isAbsolute, relative } from 'node:path';
const allowed = new Set(${JSON.stringify(Object.values(sourceHashes).map((source) => source.path))});
const modules = ${JSON.stringify(join(fixtureRoot, 'node_modules'))};
const fence = { name: 'wave2-source-confinement', enforce: 'pre', async load(id) {
  if (id.startsWith('\\0')) return null;
  const path = id.split('?')[0];
  if (!isAbsolute(path)) return null;
  const resolved = await realpath(path);
  const child = relative(modules, resolved);
  if (!allowed.has(resolved) && (!child || child.startsWith('..') || isAbsolute(child))) throw new Error('build module escapes isolated source closure: ' + path);
  return null;
} };
`;
  config.plugins = ['FENCE'];
  return Buffer.from(
    guard +
      "const target = process.env.LYRA_WAVE2_BUILD_TARGET;\nif (target !== 'client' && target !== 'ssr') throw new Error('invalid Wave2 build target');\nexport default " +
      JSON.stringify(config)
        .replace('"FENCE"', 'fence')
        .replace(
          '"TARGET_ENTRY"',
          "target === 'client' ? 'assets/entry-client.js' : 'entry-server.mjs'",
        ) +
      ';\n',
  );
}

async function defaultRemoveWave2Root(paths) {
  for (const path of [...paths].reverse()) await rm(path, { recursive: true, force: true });
}

export async function prepareWave2Fixture(
  {
    candidate,
    contractId,
    request,
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
    removeWave2Root = defaultRemoveWave2Root,
  } = {},
) {
  const family = { 'OF-ANCHORED': 'anchored', 'OF-MENU': 'menu', 'OF-TOOLTIP': 'tooltip' }[
    contractId
  ];
  const errors = validateWave2FixtureRequest(request);
  if (
    !family ||
    errors.length ||
    !request.scenario.scenarioId.startsWith('of-' + family + '.') ||
    request.cell.reactVersion !== reactVersion
  )
    throw new Error('Wave2 request/contract/reactVersion mismatch: ' + errors.join('; '));
  request = structuredClone(request);
  const resolvedRunRoot = absolutePath(runRoot, 'runRoot');
  const resolvedRepositoryRoot = absolutePath(repositoryRoot, 'repositoryRoot');
  const resolvedAdapterEntry = absolutePath(adapterEntry, 'adapterEntry');
  const expectedAdapterEntry = join(
    resolvedRepositoryRoot,
    'tools',
    'overlay-foundation-evaluation',
    'candidates',
    family,
    `${candidate?.id}.mjs`,
  );
  let canonicalAdapterEntry;
  let canonicalCandidatesDirectory;
  let canonicalExpectedAdapterEntry;
  let canonicalWave2Directory;
  try {
    [
      canonicalAdapterEntry,
      canonicalCandidatesDirectory,
      canonicalExpectedAdapterEntry,
      canonicalWave2Directory,
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
    !strictDescendant(canonicalCandidatesDirectory, canonicalWave2Directory) ||
    !strictDescendant(canonicalWave2Directory, canonicalAdapterEntry)
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
  const repositorySnapshot = async () => ({
    status: Buffer.from(
      (
        await runCommand('git', ['status', '--porcelain=v1', '--untracked-files=all'], {
          cwd: resolvedRepositoryRoot,
        })
      ).stdout,
    ).toString('hex'),
    lock: (
      await readRegularFileOnce(join(resolvedRepositoryRoot, 'pnpm-lock.yaml'), (handle) =>
        handle.readFile(),
      )
    ).sha256,
  });
  const beforeRepository = await repositorySnapshot();
  const verifyRepository = async () => {
    if (JSON.stringify(await repositorySnapshot()) !== JSON.stringify(beforeRepository))
      throw new Error('repository lock or status changed during Wave2 fixture preparation');
  };
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

    const wave2Root = join(fixtureRoot, 'wave2-fixture');
    await mkdir(wave2Root, { mode: 0o700 });
    createdPaths.push(wave2Root);
    const candidateSources = join(fixtureRoot, 'candidates');
    const fixtureSources = join(fixtureRoot, 'fixtures');
    const contractSources = join(fixtureRoot, 'contracts');
    const toolSources = join(fixtureRoot, 'tools');
    const indexPath = join(fixtureRoot, 'index.html');
    await mkdir(candidateSources, { mode: 0o700 });
    createdPaths.push(candidateSources);
    await mkdir(fixtureSources, { mode: 0o700 });
    createdPaths.push(fixtureSources);
    await mkdir(contractSources, { mode: 0o700 });
    createdPaths.push(contractSources);
    await mkdir(toolSources, { mode: 0o700 });
    createdPaths.push(toolSources);
    const repositoryFixtureRoot = join(
      resolvedRepositoryRoot,
      'tools',
      'overlay-foundation-evaluation',
      'fixtures',
      'wave2',
    );
    const specifications = [
      ['adapter', resolvedAdapterEntry, join(candidateSources, 'wave2', 'adapter.mjs')],
      [
        'protocol',
        join(repositoryFixtureRoot, 'protocol.mjs'),
        join(fixtureSources, 'wave2', 'protocol.mjs'),
      ],
      [
        'runtime',
        join(repositoryFixtureRoot, 'runtime.mjs'),
        join(fixtureSources, 'wave2', 'runtime.mjs'),
      ],
      [
        'entryClient',
        join(repositoryFixtureRoot, 'entry-client.mjs'),
        join(fixtureSources, 'wave2', 'entry-client.mjs'),
      ],
      [
        'entryServer',
        join(repositoryFixtureRoot, 'entry-server.mjs'),
        join(fixtureSources, 'wave2', 'entry-server.mjs'),
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
      [
        'contractProtocol',
        join(repositoryFixtureRoot, '../../contracts/protocol.mjs'),
        join(contractSources, 'protocol.mjs'),
      ],
      [
        'reactFixture',
        join(repositoryFixtureRoot, 'react-fixture.mjs'),
        join(fixtureSources, 'wave2/react-fixture.mjs'),
      ],
      [
        'measurements',
        join(repositoryFixtureRoot, 'measurements.mjs'),
        join(fixtureSources, 'wave2/measurements.mjs'),
      ],
      [
        'axeMetadata',
        join(resolvedRepositoryRoot, 'node_modules/axe-core/package.json'),
        join(toolSources, 'axe-package.json'),
      ],
      [
        'axe',
        join(resolvedRepositoryRoot, 'node_modules/axe-core/axe.js'),
        join(toolSources, 'axe.js'),
      ],
    ];
    const sourceHashes = {};
    const sourceBytes = new Map();
    for (const [name, source, destination] of specifications) {
      if (!['axe', 'axeMetadata'].includes(name) && (await realpath(source)) !== source)
        throw new Error('source must be canonical regular file: ' + name);
      const verified = await readRegularFileOnce(source, readSourceHandle);
      sourceBytes.set(destination, verified.bytes);
    }
    const axeMetadata = JSON.parse(
      sourceBytes.get(join(toolSources, 'axe-package.json')).toString('utf8'),
    );
    if (
      axeMetadata.name !== 'axe-core' ||
      axeMetadata.version !== '4.13.0' ||
      axeMetadata.license !== 'MPL-2.0'
    )
      throw new Error('axe tool metadata must match pinned version and MPL-2.0 license');
    await validateClosure(sourceBytes, fixtureRoot, false);
    for (const [name, source, destination] of specifications) {
      const bytes = sourceBytes.get(destination);
      await mkdir(dirname(destination), { recursive: true, mode: 0o700 });
      if ((await realpath(dirname(destination))) !== dirname(destination))
        throw new Error('source destination parent must be canonical');
      await writeExclusive(destination, bytes);
      sourceHashes[name] = Object.freeze({ path: destination, sha256: sha256(bytes) });
      await verifySnapshots({ [name]: sourceHashes[name] }, runRootReal);
      if (destination === indexPath) createdPaths.push(indexPath);
    }

    const configPath = join(wave2Root, 'vite.config.mjs');
    const configBytes = viteConfig({ fixtureRoot, request, contractId, sourceHashes });
    await writeExclusive(configPath, configBytes);
    const buildConfig = Object.freeze({ path: configPath, sha256: sha256(configBytes) });
    await verifyRepository();
    await verifySnapshots({ ...sourceHashes, buildConfig }, runRootReal);
    await validateClosure(sourceBytes, fixtureRoot, true);

    const clientRoot = join(wave2Root, 'dist-client');
    const ssrRoot = join(wave2Root, 'dist-ssr');
    const commonArgs = [vitePath, 'build', fixtureRoot, '--config', configPath];
    const commandEnvironment = { ...process.env };
    await runCommand(
      process.execPath,
      [...commonArgs, '--outDir', clientRoot, '--emptyOutDir', '--logLevel', 'silent'],
      {
        cwd: fixtureRoot,
        env: { ...commandEnvironment, LYRA_WAVE2_BUILD_TARGET: 'client' },
      },
    );
    await verifyRepository();
    await verifySnapshots({ ...sourceHashes, buildConfig }, runRootReal);
    await validateClosure(sourceBytes, fixtureRoot, true);
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
        env: { ...commandEnvironment, LYRA_WAVE2_BUILD_TARGET: 'ssr' },
      },
    );
    await verifyRepository();
    await verifySnapshots({ ...sourceHashes, buildConfig }, runRootReal);
    await validateClosure(sourceBytes, fixtureRoot, true);
    const ssrPath = join(ssrRoot, 'entry-server.mjs');
    const ssrSha256 = await verifyOutput(ssrPath, 'SSR entry', runRootReal);
    const buildOutputs = {};
    const captureOutputs = async (directory) => {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) await captureOutputs(path);
        else buildOutputs[path] = await verifyOutput(path, 'build asset', runRootReal);
      }
    };
    await captureOutputs(clientRoot);
    await captureOutputs(ssrRoot);
    if (
      buildOutputs[clientPath] !== clientSha256 ||
      buildOutputs[clientHtmlPath] !== clientHtmlSha256
    )
      throw new Error('client output changed during SSR build');

    return Object.freeze({
      ...installation,
      contractId,
      buildConfig,
      buildOutputs: Object.freeze(buildOutputs),
      toolEvidence: Object.freeze({
        axe: Object.freeze({
          name: 'axe-core',
          version: '4.13.0',
          license: 'MPL-2.0',
          ...sourceHashes.axe,
        }),
      }),
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
    await verifyRepository();
  } catch (error) {
    if (primaryError.message !== error.message)
      primaryError = new AggregateError(
        [primaryError, error],
        'Wave2 preparation failed and repository verification failed',
      );
  }
  try {
    await removeWave2Root(createdPaths);
  } catch (cleanupError) {
    throw new AggregateError(
      [primaryError, cleanupError],
      'wave2 fixture preparation and cleanup both failed',
    );
  }
  throw primaryError;
}

function canonicalJSON(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalJSON).join(',') + ']';
  if (value && typeof value === 'object')
    return (
      '{' +
      Object.keys(value)
        .sort()
        .map((key) => JSON.stringify(key) + ':' + canonicalJSON(value[key]))
        .join(',') +
      '}'
    );
  return JSON.stringify(value);
}
async function validateClosure(sources, fixtureRoot, copied) {
  if (ts.version !== '5.9.3') throw new Error('source parser must equal TypeScript 5.9.3');
  for (const [path, bytes] of sources) {
    if (!path.endsWith('.mjs')) continue;
    const ast = ts.createSourceFile(
      path,
      bytes.toString('utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.JS,
    );
    const specifiers = [];
    function visit(node) {
      let value;
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
        value = node.moduleSpecifier;
      if (
        ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
      ) {
        value = node.arguments[0];
        if (node.arguments.length !== 1 || !value || !ts.isStringLiteral(value))
          throw new Error('source closure requires literal imports');
      }
      if (value) {
        if (!ts.isStringLiteral(value)) throw new Error('source closure requires literal imports');
        specifiers.push(value.text);
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
    for (const specifier of specifiers) {
      if (isBuiltin(specifier)) continue;
      if (specifier.startsWith('.')) {
        const target = resolve(dirname(path), specifier);
        if (!sources.has(target) || !strictDescendant(fixtureRoot, target))
          throw new Error('local import outside source closure: ' + specifier);
        if (copied && (!(await lstat(target)).isFile() || (await realpath(target)) !== target))
          throw new Error('copied import must resolve to regular file');
      } else {
        if (isAbsolute(specifier) || specifier.includes(':'))
          throw new Error('absolute import is forbidden');
        let target;
        try {
          target = await realpath(createRequire(path).resolve(specifier));
        } catch (cause) {
          throw new Error('bare import cannot resolve in isolated fixture: ' + specifier, {
            cause,
          });
        }
        if (!strictDescendant(join(fixtureRoot, 'node_modules'), target))
          throw new Error('bare import escapes isolated node_modules: ' + specifier);
      }
    }
  }
}
