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
import { build } from 'vite';

const TOOL_DIR = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(TOOL_DIR, '..', '..');
const FIXTURE_SOURCE = join(TOOL_DIR, 'fixture');
const BASELINE_DIR = join(REPO, 'docs', 'superpowers', 'baselines', 'lyra-v1');
const BASELINE_JSON = join(BASELINE_DIR, 'bundles.json');
const BASELINE_MARKDOWN = join(BASELINE_DIR, 'bundles.md');
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

function moduleContributions(result, fixtureRoot) {
  const contributions = new Map();
  for (const output of collectOutput(result)) {
    if (output.type !== 'chunk') continue;
    for (const [id, module] of Object.entries(output.modules)) {
      const normalized = id.replaceAll(fixtureRoot, '<fixture>').replaceAll(REPO, '<repository>');
      contributions.set(normalized, (contributions.get(normalized) ?? 0) + module.renderedLength);
    }
  }
  return [...contributions]
    .map(([module, renderedBytes]) => ({ module, renderedBytes }))
    .sort((left, right) => left.module.localeCompare(right.module));
}

async function viteBuild({ buildFunction, entry, externals, minify, name, root }) {
  return buildFunction({
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

function environment(fixture, tarballs) {
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
    exactCommand: 'pnpm baseline:bundles --write',
    cacheState: 'cold: fresh temporary consumer and pnpm store',
    brotli: {
      mode: 'text',
      quality: 11,
    },
    packages: tarballMetadata(tarballs),
  };
}

async function collectBaseline() {
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
      environment: environment(fixture, tarballs),
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

function markdown(baseline) {
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
  return lines.join('\n');
}

function assertCleanForWrite() {
  const dirty = run('git', ['status', '--porcelain'], { cwd: REPO });
  if (dirty) throw new Error(`refusing --write from a dirty worktree:\n${dirty}`);
}

function compareBaseline(expected, actual) {
  const sections = [
    'schemaVersion',
    'owner',
    'environment',
    'externals',
    'standalone',
    'scenarios',
    'css',
  ];
  const drift = sections.filter(
    (section) => JSON.stringify(expected[section]) !== JSON.stringify(actual[section]),
  );
  if (drift.length > 0) throw new Error(`bundle baseline drift in: ${drift.join(', ')}`);
}

async function main() {
  const mode = process.argv[2];
  if (!['--write', '--check'].includes(mode) || process.argv.length !== 3) {
    throw new Error('usage: node tools/bundle-baseline/measure.mjs --write|--check');
  }
  if (mode === '--write') {
    assertCleanForWrite();
    if (existsSync(BASELINE_JSON) || existsSync(BASELINE_MARKDOWN)) {
      throw new Error('refusing to overwrite immutable bundle baseline evidence');
    }
  } else if (!existsSync(BASELINE_JSON)) {
    throw new Error(`bundle baseline does not exist: ${relative(REPO, BASELINE_JSON)}`);
  }

  const current = await collectBaseline();
  if (mode === '--write') {
    mkdirSync(BASELINE_DIR, { recursive: true });
    writeFileSync(BASELINE_JSON, `${JSON.stringify(current, null, 2)}\n`);
    writeFileSync(BASELINE_MARKDOWN, markdown(current));
    console.log(`Wrote ${relative(REPO, BASELINE_JSON)} and ${relative(REPO, BASELINE_MARKDOWN)}`);
    return;
  }

  compareBaseline(readJson(BASELINE_JSON), current);
  console.log('Bundle baseline check OK: package checksums, environment, and measurements match.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`bundle-baseline FAILED: ${error.message}`);
    process.exitCode = 1;
  });
}
