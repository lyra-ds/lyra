#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { arch, platform, release, tmpdir } from 'node:os';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { constants, brotliCompressSync } from 'node:zlib';
import { format } from 'prettier';
import { build } from 'vite';

const TOOL_DIR = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(TOOL_DIR, '..', '..');
const FIXTURE_SOURCE = join(TOOL_DIR, 'fixture');
const BASELINE_DIR = join(REPO, 'docs', 'superpowers', 'baselines', 'lyra-v1');
const BASELINE_JSON = join(BASELINE_DIR, 'bundles.json');
const BASELINE_MARKDOWN = join(BASELINE_DIR, 'bundles.md');
const COMPARISON_ROOT = join(BASELINE_DIR, 'comparisons');
const CURRENT_JSON = join(BASELINE_DIR, 'current.json');
const EXTERNALS = ['react', 'react-dom', 'react-dom/client'];
const SCENARIO_NAMES = ['form', 'overlays', 'application-shell', 'scheduling', 'files-data'];
const CSS_ENTRIES = {
  root: '@lyra-ds/styles',
  'styles.css': '@lyra-ds/styles/styles.css',
  'tokens/brand.css': '@lyra-ds/styles/tokens/brand.css',
  'compat-shadcn.css': '@lyra-ds/styles/compat-shadcn.css',
};

export function brotliBytes(source) {
  if (typeof source !== 'string') throw new TypeError('brotliBytes expects text input');
  return brotliCompressSync(Buffer.from(source), {
    params: {
      [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
      [constants.BROTLI_PARAM_QUALITY]: 11,
    },
  }).byteLength;
}

function assetType(fileName) {
  const extension = extname(fileName).toLowerCase();
  if (['.js', '.mjs', '.cjs'].includes(extension)) return 'javascript';
  if (extension === '.css') return 'css';
  throw new Error(`unsupported emitted asset extension: ${fileName}`);
}

function textSource(source) {
  if (typeof source === 'string') return source;
  if (source instanceof Uint8Array) return Buffer.from(source).toString('utf8');
  throw new TypeError('asset source must be text or Uint8Array');
}

export function summarizeAssets(assets) {
  const grouped = new Map([
    ['javascript', []],
    ['css', []],
  ]);
  for (const asset of assets) grouped.get(assetType(asset.fileName)).push(asset);

  const summary = {};
  for (const [type, entries] of grouped) {
    if (entries.length === 0) continue;
    summary[type] = {
      rawBytes: entries.reduce(
        (total, asset) => total + Buffer.byteLength(textSource(asset.source)),
        0,
      ),
      minifiedBytes: entries.reduce(
        (total, asset) =>
          total + Buffer.byteLength(textSource(asset.minifiedSource ?? asset.source)),
        0,
      ),
      brotliBytes: entries.reduce(
        (total, asset) => total + brotliBytes(textSource(asset.minifiedSource ?? asset.source)),
        0,
      ),
      files: entries.map((asset) => asset.fileName).sort(),
    };
  }
  return summary;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.error) throw new Error(`could not run ${command}: ${result.error.message}`);
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} exited ${result.status}\n${result.stdout}\n${result.stderr}`.trim(),
    );
  }
  return result.stdout.trim();
}

function sha256(source) {
  return createHash('sha256').update(source).digest('hex');
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function packageVersion(path) {
  return readJson(path).version;
}

function collectOutput(result) {
  const outputs = Array.isArray(result) ? result : [result];
  return outputs.flatMap((output) => output.output);
}

function emittedAssets(result) {
  return collectOutput(result).map((output) => ({
    fileName: output.fileName,
    source: output.type === 'chunk' ? output.code : output.source,
  }));
}

export function normalizeModulePath(moduleId, fixtureRoot, repositoryRoot = REPO) {
  for (const [root, replacement] of [
    [fixtureRoot, '<fixture>'],
    [repositoryRoot, '<repository>'],
  ]) {
    if (moduleId === root) return replacement;
    if (moduleId.startsWith(`${root}/`) || moduleId.startsWith(`${root}\\`)) {
      return `${replacement}${moduleId.slice(root.length)}`;
    }
  }
  return moduleId;
}

function moduleContributions(result, fixtureRoot) {
  const contributions = new Map();
  for (const output of collectOutput(result)) {
    if (output.type !== 'chunk') continue;
    for (const [id, module] of Object.entries(output.modules)) {
      const normalized = normalizeModulePath(id, fixtureRoot);
      contributions.set(normalized, (contributions.get(normalized) ?? 0) + module.renderedLength);
    }
  }
  return [...contributions]
    .map(([module, renderedBytes]) => ({ module, renderedBytes }))
    .sort((left, right) => left.module.localeCompare(right.module));
}

async function viteBuild({ buildFunction, entry, externals, minify, name, root }) {
  const originalWorkingDirectory = process.cwd();
  process.chdir(root);
  try {
    return await buildFunction({
      configFile: false,
      root,
      logLevel: 'silent',
      mode: 'production',
      define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
      build: {
        target: 'es2022',
        minify,
        write: false,
        cssCodeSplit: extname(entry).toLowerCase() === '.css',
        lib: {
          entry,
          formats: ['es'],
          fileName: () => `${name}.js`,
        },
        rolldownOptions: {
          external: (id) => externals.some((peer) => id === peer || id.startsWith(`${peer}/`)),
          output: {
            assetFileNames: `${name}.[ext]`,
            entryFileNames: `${name}.js`,
            chunkFileNames: `${name}-[name].js`,
          },
        },
      },
    });
  } finally {
    process.chdir(originalWorkingDirectory);
  }
}

export async function measureScenario(options) {
  const {
    buildFunction = build,
    entry,
    name = 'scenario',
    root = dirname(entry),
    externals = EXTERNALS,
  } = options;
  const raw = await viteBuild({ buildFunction, entry, externals, minify: false, name, root });
  const minified = await viteBuild({
    buildFunction,
    entry,
    externals,
    minify: 'esbuild',
    name,
    root,
  });
  const rawSummary = summarizeAssets(emittedAssets(raw));
  const minifiedAssets = emittedAssets(minified);
  const minifiedSummary = summarizeAssets(minifiedAssets);
  const modules = moduleContributions(minified, root);
  const developmentRuntime = 'react-jsx-runtime.development.js';
  if (
    modules.some(({ module }) => module.includes(developmentRuntime)) ||
    minifiedAssets.some(({ source }) => textSource(source).includes(developmentRuntime))
  ) {
    throw new Error(`${name} bundled the React development JSX runtime`);
  }
  const assets = {};
  for (const type of ['javascript', 'css']) {
    if (!rawSummary[type] && !minifiedSummary[type]) continue;
    assets[type] = {
      rawBytes: rawSummary[type]?.rawBytes ?? 0,
      minifiedBytes: minifiedSummary[type]?.rawBytes ?? 0,
      brotliBytes: minifiedSummary[type]?.brotliBytes ?? 0,
      files: minifiedSummary[type]?.files ?? [],
    };
  }
  return {
    assets,
    modules,
  };
}

function packPackage(packageDir, packDir) {
  const before = new Set(readdirSync(packDir));
  run('pnpm', ['pack', '--pack-destination', packDir], { cwd: packageDir });
  const created = readdirSync(packDir).filter((file) => file.endsWith('.tgz') && !before.has(file));
  if (created.length !== 1) {
    throw new Error(`pnpm pack in ${packageDir} produced ${created.length} new tarballs`);
  }
  return join(packDir, created[0]);
}

function packArtifacts(tempRoot) {
  run('pnpm', ['--filter', '@lyra-ds/react', 'run', 'build'], { cwd: REPO });
  run('pnpm', ['--filter', '@lyra-ds/alpine', 'run', 'build'], { cwd: REPO });
  const packDir = join(tempRoot, 'tarballs');
  mkdirSync(packDir, { recursive: true });
  return {
    react: packPackage(join(REPO, 'packages', 'react'), packDir),
    alpine: packPackage(join(REPO, 'packages', 'alpine'), packDir),
    styles: packPackage(join(REPO, 'packages', 'styles'), packDir),
  };
}

function installFixture(tempRoot, tarballs) {
  const fixture = join(tempRoot, 'consumer');
  const store = join(tempRoot, 'pnpm-store');
  cpSync(FIXTURE_SOURCE, fixture, { recursive: true });
  const packageManager = readJson(join(fixture, 'package.json')).packageManager;
  const pnpmVersion = run('pnpm', ['--version'], { cwd: REPO });
  if (packageManager !== `pnpm@${pnpmVersion}`) {
    throw new Error(`fixture requires ${packageManager}, current pnpm is ${pnpmVersion}`);
  }
  run(
    'pnpm',
    [
      'install',
      '--frozen-lockfile',
      '--ignore-workspace',
      '--ignore-scripts',
      '--store-dir',
      store,
    ],
    { cwd: fixture },
  );
  const installed = JSON.parse(
    run('pnpm', ['list', '--json', '--depth', 'Infinity', '--ignore-workspace'], { cwd: fixture }),
  );
  const resolvedGraph = normalizeResolvedGraph(installed);
  installPackedArtifacts(fixture, tarballs);
  return {
    artifactInstallation: 'offline tar extraction after frozen external install',
    directory: fixture,
    lockfileSha256: sha256(readFileSync(join(fixture, 'pnpm-lock.yaml'))),
    packageManager,
    resolvedGraph,
    resolvedGraphSha256: sha256(JSON.stringify(resolvedGraph)),
  };
}

export function installPackedArtifacts(fixture, tarballs) {
  const packages = {
    react: '@lyra-ds/react',
    alpine: '@lyra-ds/alpine',
    styles: '@lyra-ds/styles',
  };
  for (const [key, tarball] of Object.entries(tarballs)) {
    const packageName = packages[key];
    if (!packageName) throw new Error(`unknown packed artifact: ${key}`);
    const destination = join(fixture, 'node_modules', ...packageName.split('/'));
    mkdirSync(destination, { recursive: true });
    run('tar', ['-xzf', tarball, '--strip-components=1', '-C', destination]);
    const installedName = readJson(join(destination, 'package.json')).name;
    if (installedName !== packageName) {
      throw new Error(`${key} tarball contains ${installedName}, expected ${packageName}`);
    }
  }
}

function normalizeResolvedDependencies(dependencies = {}) {
  return Object.fromEntries(
    Object.entries(dependencies)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, dependency]) => [
        name,
        {
          version: dependency.version,
          dependencies: normalizeResolvedDependencies(dependency.dependencies),
        },
      ]),
  );
}

function normalizeResolvedGraph(installed) {
  return installed.map((project) => ({
    name: project.name,
    dependencies: normalizeResolvedDependencies(project.dependencies),
  }));
}

async function fixtureViteBuild(fixture) {
  const vitePackage = readJson(join(fixture, 'node_modules', 'vite', 'package.json'));
  const viteEntry = join(fixture, 'node_modules', 'vite', vitePackage.exports['.']);
  return (await import(pathToFileURL(viteEntry).href)).build;
}

function tarballMetadata(tarballs) {
  const metadata = {};
  for (const [key, tarball] of Object.entries(tarballs)) {
    const packageJson = readJson(join(REPO, 'packages', key, 'package.json'));
    metadata[packageJson.name] = {
      version: packageJson.version,
      tarball: basename(tarball),
      sha256: sha256(readFileSync(tarball)),
    };
  }
  return metadata;
}

function publicReactSubpath(entry) {
  const file = basename(entry.path, extname(entry.path));
  return `@lyra-ds/react/${file}`;
}

function standaloneSource(packageName, imported) {
  if (!imported) return `export { default } from '${packageName}';\n`;
  return `export ${imported} from '${packageName}';\n`;
}

function sizeLimitConfiguration(reactEntries, alpineEntries) {
  return [
    ...reactEntries.map((entry) => ({
      ...entry,
      path: join('node_modules', '@lyra-ds', 'react', entry.path),
    })),
    ...alpineEntries.map((entry) => ({
      ...entry,
      path: join('node_modules', '@lyra-ds', 'alpine', entry.path),
    })),
  ];
}

function measureSizeLimit(fixture, reactEntries, alpineEntries) {
  const fixturePackage = readJson(join(fixture, 'package.json'));
  fixturePackage['size-limit'] = sizeLimitConfiguration(reactEntries, alpineEntries);
  writeFileSync(join(fixture, 'package.json'), `${JSON.stringify(fixturePackage, null, 2)}\n`);
  const binary = join(fixture, 'node_modules', '.bin', 'size-limit');
  return JSON.parse(run(binary, ['--json'], { cwd: fixture }));
}

async function measureStandalone(
  fixture,
  reactEntries,
  alpineEntries,
  sizeLimitResults,
  buildFunction,
) {
  const standaloneDir = join(fixture, 'standalone');
  mkdirSync(standaloneDir, { recursive: true });
  const sizeByName = new Map(sizeLimitResults.map((result) => [result.name, result]));
  const react = [];
  for (const [index, entry] of reactEntries.entries()) {
    const packageName = publicReactSubpath(entry);
    const entryPath = join(standaloneDir, `react-${String(index + 1).padStart(2, '0')}.ts`);
    writeFileSync(entryPath, standaloneSource(packageName, entry.import));
    const measurement = await measureScenario({
      buildFunction,
      entry: entryPath,
      externals: EXTERNALS,
      name: `react-${String(index + 1).padStart(2, '0')}`,
      root: fixture,
    });
    react.push({
      name: entry.name,
      publicEntry: packageName,
      configuredLimit: entry.limit,
      sizeLimit: sizeByName.get(entry.name),
      assets: measurement.assets,
      modules: measurement.modules,
    });
  }

  const alpine = [];
  for (const [index, entry] of alpineEntries.entries()) {
    const entryPath = join(standaloneDir, `alpine-${String(index + 1).padStart(2, '0')}.ts`);
    writeFileSync(entryPath, standaloneSource('@lyra-ds/alpine', entry.import));
    const measurement = await measureScenario({
      buildFunction,
      entry: entryPath,
      externals: ['alpinejs'],
      name: `alpine-${String(index + 1).padStart(2, '0')}`,
      root: fixture,
    });
    alpine.push({
      name: entry.name,
      publicEntry: '@lyra-ds/alpine',
      configuredLimit: entry.limit,
      sizeLimit: sizeByName.get(entry.name),
      assets: measurement.assets,
      modules: measurement.modules,
    });
  }
  return { react, alpine };
}

async function measureScenarios(fixture, buildFunction) {
  const scenarioDir = join(fixture, 'scenarios');
  mkdirSync(scenarioDir, { recursive: true });
  const measurements = {};
  for (const name of SCENARIO_NAMES) {
    const entry = join(scenarioDir, `${name}.ts`);
    cpSync(join(TOOL_DIR, 'scenarios', `${name}.ts`), entry);
    measurements[name] = await measureScenario({
      buildFunction,
      entry,
      externals: EXTERNALS,
      name,
      root: fixture,
    });
  }
  return measurements;
}

async function measureCss(fixture, buildFunction) {
  const cssDir = join(fixture, 'css');
  mkdirSync(cssDir, { recursive: true });
  const measurements = {};
  let index = 0;
  for (const [name, publicEntry] of Object.entries(CSS_ENTRIES)) {
    index += 1;
    const entry = join(cssDir, `entry-${index}.css`);
    writeFileSync(entry, `@import '${publicEntry}';\n`);
    const measurement = await measureScenario({
      buildFunction,
      entry,
      externals: [],
      name: `css-${index}`,
      root: fixture,
    });
    if (!measurement.assets.css) throw new Error(`${publicEntry} emitted no CSS`);
    measurements[name] = {
      publicEntry,
      ...measurement.assets.css,
      modules: measurement.modules,
    };
  }
  return measurements;
}

function environment(fixture, tarballs, exactCommand) {
  return {
    operatingSystem: `${platform()} ${release()}`,
    architecture: arch(),
    node: process.version,
    pnpm: run('pnpm', ['--version'], { cwd: REPO }),
    vite: packageVersion(join(fixture.directory, 'node_modules', 'vite', 'package.json')),
    sizeLimit: packageVersion(
      join(fixture.directory, 'node_modules', 'size-limit', 'package.json'),
    ),
    lockfileSha256: sha256(readFileSync(join(REPO, 'pnpm-lock.yaml'))),
    fixture: {
      artifactInstallation: fixture.artifactInstallation,
      packageManager: fixture.packageManager,
      lockfileSha256: fixture.lockfileSha256,
      resolvedGraph: fixture.resolvedGraph,
      resolvedGraphSha256: fixture.resolvedGraphSha256,
    },
    exactCommand,
    cacheState: 'cold: fresh temporary consumer and pnpm store',
    brotli: {
      mode: 'text',
      quality: 11,
    },
    packages: tarballMetadata(tarballs),
  };
}

export async function collectBaseline({ exactCommand = 'pnpm baseline:bundles --write' } = {}) {
  const tempRoot = mkdtempSync(join(tmpdir(), 'lyra-bundle-baseline-'));
  try {
    console.log('Building and packing Lyra packages...');
    const tarballs = packArtifacts(tempRoot);
    console.log('Installing packed artifacts into a cold consumer fixture...');
    const fixture = installFixture(tempRoot, tarballs);
    const buildFunction = await fixtureViteBuild(fixture.directory);
    const reactPackage = readJson(join(REPO, 'packages', 'react', 'package.json'));
    const alpinePackage = readJson(join(REPO, 'packages', 'alpine', 'package.json'));
    console.log('Running Size Limit against installed tarballs...');
    const sizeLimitResults = measureSizeLimit(
      fixture.directory,
      reactPackage['size-limit'],
      alpinePackage['size-limit'],
    );
    console.log(
      `Measuring ${reactPackage['size-limit'].length + alpinePackage['size-limit'].length} standalone entries...`,
    );
    const standalone = await measureStandalone(
      fixture.directory,
      reactPackage['size-limit'],
      alpinePackage['size-limit'],
      sizeLimitResults,
      buildFunction,
    );
    console.log('Measuring five fixed scenarios...');
    const scenarios = await measureScenarios(fixture.directory, buildFunction);
    console.log('Measuring four CSS public entries...');
    const css = await measureCss(fixture.directory, buildFunction);
    return {
      schemaVersion: 1,
      measuredAt: new Date().toISOString(),
      revision: run('git', ['rev-parse', 'HEAD'], { cwd: REPO }),
      owner: 'Lyra maintainers',
      environment: environment(fixture, tarballs, exactCommand),
      externals: EXTERNALS,
      standalone,
      scenarios,
      css,
    };
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

function formatBytes(bytes) {
  return `${bytes.toLocaleString('en-US')} B`;
}

async function markdown(baseline) {
  const lines = [
    '# Lyra v1 bundle baseline',
    '',
    `- Revision: \`${baseline.revision}\``,
    `- Measured at: \`${baseline.measuredAt}\``,
    `- Owner: ${baseline.owner}`,
    `- Exact command: \`${baseline.environment.exactCommand}\``,
    `- Environment: ${baseline.environment.operatingSystem}, ${baseline.environment.architecture}, Node ${baseline.environment.node}, pnpm ${baseline.environment.pnpm}`,
    `- Tools: Vite ${baseline.environment.vite}, Size Limit ${baseline.environment.sizeLimit}`,
    `- Cache: ${baseline.environment.cacheState}`,
    `- Fixture package manager: ${baseline.environment.fixture.packageManager}`,
    `- Fixture lockfile SHA-256: \`${baseline.environment.fixture.lockfileSha256}\``,
    `- Fixture external graph SHA-256: \`${baseline.environment.fixture.resolvedGraphSha256}\``,
    `- Lyra artifact installation: ${baseline.environment.fixture.artifactInstallation}`,
    `- Externals: ${baseline.externals.map((item) => `\`${item}\``).join(', ')}`,
    `- Brotli: mode=${baseline.environment.brotli.mode}, quality=${baseline.environment.brotli.quality}`,
    `- Repository lockfile SHA-256: \`${baseline.environment.lockfileSha256}\``,
    '',
    '## Packed artifacts',
    '',
    '| Package | Version | Tarball | SHA-256 |',
    '| --- | --- | --- | --- |',
  ];
  for (const [name, pkg] of Object.entries(baseline.environment.packages)) {
    lines.push(`| ${name} | ${pkg.version} | \`${pkg.tarball}\` | \`${pkg.sha256}\` |`);
  }
  lines.push(
    '',
    '## Standalone entries',
    '',
    '| Package | Entry | Raw JS | Minified JS | Brotli JS | Size Limit | Limit |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: |',
  );
  for (const [packageName, entries] of Object.entries(baseline.standalone)) {
    for (const entry of entries) {
      const js = entry.assets.javascript;
      lines.push(
        `| ${packageName} | \`${entry.publicEntry}\` | ${formatBytes(js.rawBytes)} | ${formatBytes(js.minifiedBytes)} | ${formatBytes(js.brotliBytes)} | ${formatBytes(entry.sizeLimit.size)} | ${entry.configuredLimit} |`,
      );
    }
  }
  lines.push(
    '',
    '## Scenarios',
    '',
    '| Scenario | Raw JS | Minified JS | Brotli JS | Rolldown modules |',
    '| --- | ---: | ---: | ---: | ---: |',
  );
  for (const [name, scenario] of Object.entries(baseline.scenarios)) {
    const js = scenario.assets.javascript;
    lines.push(
      `| ${name} | ${formatBytes(js.rawBytes)} | ${formatBytes(js.minifiedBytes)} | ${formatBytes(js.brotliBytes)} | ${scenario.modules.length} |`,
    );
  }
  lines.push(
    '',
    '## CSS entries',
    '',
    '| Entry | Raw CSS | Minified CSS | Brotli CSS |',
    '| --- | ---: | ---: | ---: |',
  );
  for (const css of Object.values(baseline.css)) {
    lines.push(
      `| \`${css.publicEntry}\` | ${formatBytes(css.rawBytes)} | ${formatBytes(css.minifiedBytes)} | ${formatBytes(css.brotliBytes)} |`,
    );
  }
  lines.push(
    '',
    'The JSON beside this report is the machine-readable source of truth, including the complete Rolldown module-contribution records.',
    '',
  );
  return format(lines.join('\n'), { parser: 'markdown', printWidth: 100, proseWrap: 'preserve' });
}

function assertCleanForWrite() {
  const dirty = run('git', ['status', '--porcelain'], { cwd: REPO });
  if (dirty) throw new Error(`refusing --write from a dirty worktree:\n${dirty}`);
}

export function portableBaselineProjection(baseline) {
  const { operatingSystem: _operatingSystem, ...environment } = baseline.environment;

  return {
    schemaVersion: baseline.schemaVersion,
    owner: baseline.owner,
    environment,
    externals: baseline.externals,
    standalone: baseline.standalone,
    scenarios: baseline.scenarios,
    css: baseline.css,
  };
}

function baselineDifferences(expected, actual, path, differences = []) {
  if (Object.is(expected, actual)) return differences;

  const expectedIsObject = expected !== null && typeof expected === 'object';
  const actualIsObject = actual !== null && typeof actual === 'object';
  if (!expectedIsObject || !actualIsObject || Array.isArray(expected) !== Array.isArray(actual)) {
    differences.push(
      `${path}: expected ${JSON.stringify(expected)}, actual ${JSON.stringify(actual)}`,
    );
    return differences;
  }

  if (Array.isArray(expected)) {
    const length = Math.max(expected.length, actual.length);
    for (let index = 0; index < length; index += 1) {
      baselineDifferences(expected[index], actual[index], `${path}[${index}]`, differences);
    }
    return differences;
  }

  for (const key of new Set([...Object.keys(expected), ...Object.keys(actual)])) {
    baselineDifferences(expected[key], actual[key], `${path}.${key}`, differences);
  }
  return differences;
}

export function compareBaseline(expected, actual) {
  const sections = [
    'schemaVersion',
    'owner',
    'environment',
    'externals',
    'standalone',
    'scenarios',
    'css',
  ];
  const expectedPortable = portableBaselineProjection(expected);
  const actualPortable = portableBaselineProjection(actual);
  const drift = sections.filter(
    (section) =>
      JSON.stringify(expectedPortable[section]) !== JSON.stringify(actualPortable[section]),
  );
  if (drift.length > 0) {
    const differences = drift.flatMap((section) =>
      baselineDifferences(expectedPortable[section], actualPortable[section], section),
    );
    const visibleDifferences = differences.slice(0, 20);
    const omitted = differences.length - visibleDifferences.length;
    const detail = [
      ...visibleDifferences.map((difference) => `- ${difference}`),
      ...(omitted > 0 ? [`- ${omitted} more difference${omitted === 1 ? '' : 's'} omitted`] : []),
    ].join('\n');
    throw new Error(`bundle baseline drift in: ${drift.join(', ')}\n${detail}`);
  }
}

function requiredEntry(entries, predicate, label) {
  const matches = entries.filter(predicate);
  if (matches.length !== 1) {
    throw new Error(`expected exactly one ${label} measurement, found ${matches.length}`);
  }
  return matches[0];
}

function bundleMetrics(entry, assetTypeName = 'javascript') {
  const assets = assetTypeName === 'css' ? entry : entry.assets?.[assetTypeName];
  if (!assets) throw new Error(`missing ${assetTypeName} bundle measurements`);
  return {
    rawBytes: assets.rawBytes,
    minifiedBytes: assets.minifiedBytes,
    brotliBytes: assets.brotliBytes,
  };
}

function numericDelta(before, after) {
  const absolute = after - before;
  return {
    absolute,
    percentage: before === 0 ? null : Number(((absolute / before) * 100).toFixed(2)),
  };
}

function moduleDelta(beforeModules, afterModules) {
  const beforeAvailable = Array.isArray(beforeModules);
  const afterAvailable = Array.isArray(afterModules);
  const deltaAvailable = beforeAvailable && afterAvailable;
  const normalizedBefore = beforeAvailable ? beforeModules : null;
  const normalizedAfter = afterAvailable ? afterModules : null;
  const beforeByName = new Map((normalizedBefore ?? []).map((entry) => [entry.module, entry]));
  const afterByName = new Map((normalizedAfter ?? []).map((entry) => [entry.module, entry]));
  return {
    moduleTelemetry: {
      before: beforeAvailable ? 'available' : 'unavailable',
      after: afterAvailable ? 'available' : 'unavailable',
      delta: deltaAvailable ? 'available' : 'unavailable',
    },
    removedModules: deltaAvailable
      ? normalizedBefore.filter((entry) => !afterByName.has(entry.module))
      : null,
    addedModules: deltaAvailable
      ? normalizedAfter.filter((entry) => !beforeByName.has(entry.module))
      : null,
    moduleContributions: {
      before: normalizedBefore,
      after: normalizedAfter,
    },
  };
}

function comparisonEntry(beforeSource, afterSource, assetTypeName = 'javascript') {
  const before = bundleMetrics(beforeSource, assetTypeName);
  const after = bundleMetrics(afterSource, assetTypeName);
  const beforeAssets = assetTypeName === 'css' ? beforeSource : beforeSource.assets[assetTypeName];
  const afterAssets = assetTypeName === 'css' ? afterSource : afterSource.assets[assetTypeName];
  const modules = moduleDelta(beforeSource.modules, afterSource.modules);
  return {
    before,
    after,
    deltas: Object.fromEntries(
      Object.keys(before).map((metric) => [metric, numericDelta(before[metric], after[metric])]),
    ),
    ...modules,
    metafiles: {
      before: {
        emittedFiles: beforeAssets.files ?? [],
        modules: modules.moduleContributions.before,
      },
      after: {
        emittedFiles: afterAssets.files ?? [],
        modules: modules.moduleContributions.after,
      },
    },
  };
}

function fileUploadSources(baseline) {
  return {
    reactFileUpload: requiredEntry(
      baseline.standalone.react,
      (entry) => entry.publicEntry === '@lyra-ds/react/file-upload',
      'React FileUpload',
    ),
    alpineAdapter: requiredEntry(
      baseline.standalone.alpine,
      (entry) => entry.publicEntry === '@lyra-ds/alpine',
      'Alpine adapter',
    ),
    css: baseline.css['styles.css'],
    filesData: baseline.scenarios['files-data'],
  };
}

export function createComparison(kind, before, after) {
  if (kind !== 'file-upload') throw new Error(`unsupported bundle comparison: ${kind}`);
  if (before.revision === after.revision) {
    throw new Error('comparison before and after revisions must differ');
  }
  const beforeSources = fileUploadSources(before);
  const afterSources = fileUploadSources(after);
  if (!beforeSources.css || !afterSources.css) throw new Error('missing styles.css measurement');
  if (!beforeSources.filesData || !afterSources.filesData) {
    throw new Error('missing files-data scenario measurement');
  }
  const entries = {
    reactFileUpload: comparisonEntry(beforeSources.reactFileUpload, afterSources.reactFileUpload),
    alpineAdapter: comparisonEntry(beforeSources.alpineAdapter, afterSources.alpineAdapter),
    css: comparisonEntry(beforeSources.css, afterSources.css, 'css'),
    filesData: comparisonEntry(beforeSources.filesData, afterSources.filesData),
  };
  entries.reactFileUpload.sizeLimit = {
    before: beforeSources.reactFileUpload.sizeLimit,
    after: afterSources.reactFileUpload.sizeLimit,
  };
  const reactSizeLimit = afterSources.reactFileUpload.sizeLimit;
  if (reactSizeLimit?.sizeLimit !== 8_000) {
    throw new Error('React FileUpload Size Limit must remain exactly 8 kB');
  }
  const affectedEntries = Object.entries(entries).map(([name, entry]) => ({
    name,
    deltaBytes: entry.deltas.brotliBytes.absolute,
    passed: entry.deltas.brotliBytes.absolute <= 3_000,
  }));
  const budgets = {
    reactFileUploadAbsolute: {
      limitBytes: 8_000,
      actualBytes: reactSizeLimit.size,
      passed: reactSizeLimit.passed === true && reactSizeLimit.size <= 8_000,
    },
    complexDelta: {
      limitBytesPerEntry: 3_000,
      entries: affectedEntries,
      passed: affectedEntries.every((entry) => entry.passed),
    },
  };
  return {
    schemaVersion: 1,
    kind,
    before,
    after,
    entries,
    budgets,
    result: budgets.reactFileUploadAbsolute.passed && budgets.complexDelta.passed ? 'pass' : 'fail',
  };
}

function signedBytes(value) {
  return `${value >= 0 ? '+' : ''}${formatBytes(value)}`;
}

export async function renderComparisonMarkdown(comparison) {
  const lines = [
    '# FileUpload bundle comparison',
    '',
    `- Before revision: \`${comparison.before.revision}\``,
    `- After revision: \`${comparison.after.revision}\``,
    `- Result: **${comparison.result.toUpperCase()}**`,
    `- React FileUpload absolute budget: ${formatBytes(comparison.budgets.reactFileUploadAbsolute.actualBytes)} / ${formatBytes(comparison.budgets.reactFileUploadAbsolute.limitBytes)} (${comparison.budgets.reactFileUploadAbsolute.passed ? 'PASS' : 'FAIL'})`,
    `- Complex migration delta ceiling: ${formatBytes(comparison.budgets.complexDelta.limitBytesPerEntry)} per affected entry (${comparison.budgets.complexDelta.passed ? 'PASS' : 'FAIL'})`,
    '',
    '## Bundle deltas',
    '',
    '| Entry | Before raw | After raw | Delta raw | Before minified | After minified | Delta minified | Before Brotli | After Brotli | Delta Brotli | Result |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
  ];
  const labels = {
    reactFileUpload: 'React FileUpload',
    alpineAdapter: 'Alpine adapter',
    css: 'CSS styles.css',
    filesData: 'Files and Data scenario',
  };
  for (const [name, entry] of Object.entries(comparison.entries)) {
    const budget = comparison.budgets.complexDelta.entries.find((item) => item.name === name);
    lines.push(
      `| ${labels[name]} | ${formatBytes(entry.before.rawBytes)} | ${formatBytes(entry.after.rawBytes)} | ${signedBytes(entry.deltas.rawBytes.absolute)} (${entry.deltas.rawBytes.percentage ?? 'n/a'}%) | ${formatBytes(entry.before.minifiedBytes)} | ${formatBytes(entry.after.minifiedBytes)} | ${signedBytes(entry.deltas.minifiedBytes.absolute)} (${entry.deltas.minifiedBytes.percentage ?? 'n/a'}%) | ${formatBytes(entry.before.brotliBytes)} | ${formatBytes(entry.after.brotliBytes)} | ${signedBytes(entry.deltas.brotliBytes.absolute)} (${entry.deltas.brotliBytes.percentage ?? 'n/a'}%) | ${budget.passed ? 'PASS' : 'FAIL'} |`,
    );
  }
  lines.push(
    '',
    '## Module contributions and removed code',
    '',
    'Added and removed module deltas are available only when both revisions captured module telemetry.',
    '',
    '| Entry | Before telemetry | After telemetry | Added/removed delta |',
    '| --- | --- | --- | --- |',
  );
  for (const [name, entry] of Object.entries(comparison.entries)) {
    lines.push(
      `| ${labels[name]} | ${entry.moduleTelemetry.before} | ${entry.moduleTelemetry.after} | ${entry.moduleTelemetry.delta} |`,
    );
  }
  lines.push(
    '',
    '## Packed artifacts',
    '',
    '| Revision | Package | Version | SHA-256 |',
    '| --- | --- | --- | --- |',
  );
  for (const side of ['before', 'after']) {
    for (const [name, artifact] of Object.entries(comparison[side].environment.packages)) {
      lines.push(
        `| ${side} \`${comparison[side].revision}\` | ${name} | ${artifact.version} | \`${artifact.sha256}\` |`,
      );
    }
  }
  lines.push('');
  return format(lines.join('\n'), { parser: 'markdown', printWidth: 100, proseWrap: 'preserve' });
}

function comparisonArtifactPaths(options = {}) {
  return {
    comparisonJson: options.comparisonJson,
    comparisonMarkdown: options.comparisonMarkdown,
  };
}

export async function writeComparisonArtifacts(comparison, options) {
  const { comparisonJson, comparisonMarkdown } = comparisonArtifactPaths(options);
  if (!comparisonJson || !comparisonMarkdown) throw new Error('comparison artifact paths required');
  if (existsSync(comparisonJson) || existsSync(comparisonMarkdown)) {
    throw new Error('refusing to overwrite immutable FileUpload comparison evidence');
  }
  const report = await renderComparisonMarkdown(comparison);
  const json = await format(`${JSON.stringify(comparison, null, 2)}\n`, { parser: 'json' });
  mkdirSync(dirname(comparisonJson), { recursive: true });
  writeFileSync(comparisonJson, json);
  writeFileSync(comparisonMarkdown, report);
}

export async function validateComparisonArtifacts(options) {
  const { comparisonJson, comparisonMarkdown } = comparisonArtifactPaths(options);
  if (!existsSync(comparisonJson)) throw new Error('comparison JSON does not exist');
  if (!existsSync(comparisonMarkdown)) throw new Error('comparison Markdown does not exist');
  const jsonSource = readFileSync(comparisonJson, 'utf8');
  const comparison = readJson(comparisonJson);
  if (
    jsonSource !== (await format(`${JSON.stringify(comparison, null, 2)}\n`, { parser: 'json' }))
  ) {
    throw new Error('comparison JSON is not canonical');
  }
  if (comparison.kind !== 'file-upload') throw new Error('comparison is not FileUpload evidence');
  if (readFileSync(comparisonMarkdown, 'utf8') !== (await renderComparisonMarkdown(comparison))) {
    throw new Error('comparison Markdown is not the canonical peer');
  }
  const recalculated = createComparison(comparison.kind, comparison.before, comparison.after);
  if (JSON.stringify(recalculated) !== JSON.stringify(comparison)) {
    throw new Error('comparison JSON contains noncanonical or stale calculations');
  }
  return comparison;
}

function baselineArtifactPaths(options = {}) {
  return {
    baselineJson: options.baselineJson ?? BASELINE_JSON,
    baselineMarkdown: options.baselineMarkdown ?? BASELINE_MARKDOWN,
  };
}

function assertBaselineArtifactsWritable(options) {
  const { baselineJson, baselineMarkdown } = baselineArtifactPaths(options);
  if (existsSync(baselineJson) || existsSync(baselineMarkdown)) {
    throw new Error('refusing to overwrite immutable bundle baseline evidence');
  }
}

export async function writeBaselineArtifacts(baseline, options) {
  const { baselineJson, baselineMarkdown } = baselineArtifactPaths(options);
  assertBaselineArtifactsWritable({ baselineJson, baselineMarkdown });
  const report = await markdown(baseline);
  mkdirSync(dirname(baselineJson), { recursive: true });
  mkdirSync(dirname(baselineMarkdown), { recursive: true });
  writeFileSync(baselineJson, `${JSON.stringify(baseline, null, 2)}\n`);
  writeFileSync(baselineMarkdown, report);
}

async function readBaselineArtifacts(options) {
  const { baselineJson, baselineMarkdown } = baselineArtifactPaths(options);
  if (!existsSync(baselineJson)) {
    throw new Error(`bundle baseline does not exist: ${relative(REPO, baselineJson)}`);
  }
  if (!existsSync(baselineMarkdown)) {
    throw new Error(`bundle baseline Markdown does not exist: ${relative(REPO, baselineMarkdown)}`);
  }

  const expected = readJson(baselineJson);
  if (readFileSync(baselineMarkdown, 'utf8') !== (await markdown(expected))) {
    throw new Error(`bundle baseline Markdown drift: ${relative(REPO, baselineMarkdown)}`);
  }
  return expected;
}

function acceptedPointerPaths(options = {}) {
  const baselineJson = options.baselineJson ?? BASELINE_JSON;
  const baselineRoot = dirname(baselineJson);
  return {
    baselineJson,
    baselineMarkdown:
      options.baselineMarkdown ??
      (options.baselineJson ? join(baselineRoot, 'bundles.md') : BASELINE_MARKDOWN),
    comparisonDirectory:
      options.comparisonDirectory ??
      (options.baselineJson ? join(baselineRoot, 'comparisons') : COMPARISON_ROOT),
    currentJson:
      options.currentJson ??
      (options.baselineJson ? join(baselineRoot, 'current.json') : CURRENT_JSON),
  };
}

export async function resolveBaselineReference(options = {}) {
  const paths = acceptedPointerPaths(options);
  if (!existsSync(paths.currentJson)) return readBaselineArtifacts(paths);
  const pointer = readJson(paths.currentJson);
  const revision = pointer.fileUpload?.revision;
  if (pointer.schemaVersion !== 1 || typeof revision !== 'string' || revision.length === 0) {
    throw new Error('invalid FileUpload current baseline pointer');
  }
  const comparison = await validateComparisonArtifacts({
    comparisonJson: join(paths.comparisonDirectory, 'file-upload', `${revision}.json`),
    comparisonMarkdown: join(paths.comparisonDirectory, 'file-upload', `${revision}.md`),
  });
  if (comparison.after.revision !== revision) {
    throw new Error('current pointer revision does not match comparison content');
  }
  return comparison.after;
}

function porcelainPath(line) {
  const path = line.slice(3);
  const renameMarker = ' -> ';
  return path.includes(renameMarker) ? path.slice(path.lastIndexOf(renameMarker) + 4) : path;
}

function currentDirtyPaths() {
  const output = run('git', ['status', '--porcelain=v1', '--untracked-files=all'], { cwd: REPO });
  return output ? output.split('\n') : [];
}

function assertRuntimeArtifactPair(comparison, runtime) {
  for (const [label, packageName, runtimeArtifact] of [
    ['React', '@lyra-ds/react', runtime.environment.reactArtifact],
    ['Styles', '@lyra-ds/styles', runtime.environment.stylesArtifact],
  ]) {
    const bundleSha = comparison.after.environment.packages[packageName]?.sha256;
    if (bundleSha !== runtimeArtifact.sha256) {
      throw new Error(
        `packed ${label} artifact mismatch: bundle=${bundleSha}, runtime=${runtimeArtifact.sha256}`,
      );
    }
  }
}

export async function acceptComparison(
  kind,
  {
    comparisonDirectory = COMPARISON_ROOT,
    currentJson = CURRENT_JSON,
    dirtyPaths = currentDirtyPaths(),
    headRevision = run('git', ['rev-parse', 'HEAD'], { cwd: REPO }),
    repositoryRelativeComparisonDirectory = relative(REPO, join(comparisonDirectory, kind)),
  } = {},
) {
  if (kind !== 'file-upload') throw new Error('only the FileUpload comparison can be accepted');
  const expectedNames = [
    `${headRevision}.json`,
    `${headRevision}.md`,
    `${headRevision}-runtime.json`,
    `${headRevision}-runtime.md`,
  ];
  const expectedDirty = new Set(
    expectedNames.map((name) => `${repositoryRelativeComparisonDirectory}/${name}`),
  );
  const actualPaths = dirtyPaths.map(porcelainPath);
  const unrelated = actualPaths.filter((path) => !expectedDirty.has(path));
  if (unrelated.length > 0) {
    throw new Error(`refusing acceptance with unrelated dirty path: ${unrelated.join(', ')}`);
  }
  if (
    actualPaths.length !== expectedDirty.size ||
    actualPaths.some((path) => !expectedDirty.has(path))
  ) {
    throw new Error('acceptance requires exactly four canonical peers');
  }
  const duplicateCount = new Set(actualPaths).size;
  if (duplicateCount !== expectedDirty.size) {
    throw new Error('ambiguous FileUpload comparison evidence');
  }
  const directory = join(comparisonDirectory, kind);
  const comparison = await validateComparisonArtifacts({
    comparisonJson: join(directory, `${headRevision}.json`),
    comparisonMarkdown: join(directory, `${headRevision}.md`),
  });
  if (comparison.after.revision !== headRevision) {
    throw new Error('comparison revision does not match HEAD');
  }
  if (comparison.result !== 'pass') throw new Error('cannot accept a failed bundle comparison');

  const { validateRuntimeArtifacts } = await import('../file-upload-performance/measure.mjs');
  const runtime = await validateRuntimeArtifacts({
    runtimeJson: join(directory, `${headRevision}-runtime.json`),
    runtimeMarkdown: join(directory, `${headRevision}-runtime.md`),
  });
  if (runtime.revision !== headRevision) throw new Error('runtime revision does not match HEAD');
  assertRuntimeArtifactPair(comparison, runtime);

  const pointer = { schemaVersion: 1, fileUpload: { revision: headRevision } };
  mkdirSync(dirname(currentJson), { recursive: true });
  writeFileSync(currentJson, `${JSON.stringify(pointer, null, 2)}\n`);
  return `Accepted FileUpload bundle and runtime evidence for ${headRevision}.`;
}

export async function checkBaselineArtifacts(actual, options) {
  compareBaseline(await readBaselineArtifacts(options), actual);
}

export async function runBundleBaselineCli(
  args,
  { paths, collect = collectBaseline, ensureClean = assertCleanForWrite } = {},
) {
  const mode = args[0];
  const acceptsComparison = mode === '--accept-comparison' && args.length === 2;
  if ((!['--write', '--check'].includes(mode) || args.length !== 1) && !acceptsComparison) {
    throw new Error(
      'usage: node tools/bundle-baseline/measure.mjs --write|--check|--accept-comparison file-upload',
    );
  }
  if (acceptsComparison) {
    return acceptComparison(args[1], paths);
  }
  if (mode === '--write') {
    ensureClean();
    assertBaselineArtifactsWritable(paths);
  }

  const expected = mode === '--check' ? await resolveBaselineReference(paths) : null;
  const current = await collect({ exactCommand: expected?.environment.exactCommand });
  if (mode === '--write') {
    await writeBaselineArtifacts(current, paths);
    const { baselineJson, baselineMarkdown } = baselineArtifactPaths(paths);
    return `Wrote ${relative(REPO, baselineJson)} and ${relative(REPO, baselineMarkdown)}`;
  }

  compareBaseline(expected, current);
  return 'Bundle baseline check OK: package checksums, environment, and measurements match.';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runBundleBaselineCli(process.argv.slice(2))
    .then((message) => console.log(message))
    .catch((error) => {
      console.error(`bundle-baseline FAILED: ${error.message}`);
      process.exitCode = 1;
    });
}
