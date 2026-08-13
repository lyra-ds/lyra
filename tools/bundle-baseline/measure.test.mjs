import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  brotliBytes,
  checkBaselineArtifacts,
  compareBaseline,
  installPackedArtifacts,
  measureScenario,
  summarizeAssets,
  writeBaselineArtifacts,
} from './measure.mjs';

const toolDirectory = dirname(fileURLToPath(import.meta.url));

test('brotliBytes is deterministic and uses text input', () => {
  assert.equal(brotliBytes('export const value = 1;'), brotliBytes('export const value = 1;'));
});

test('summarizeAssets keeps JavaScript and CSS separate', () => {
  assert.deepEqual(
    Object.keys(
      summarizeAssets([
        { fileName: 'entry.js', source: 'export{}' },
        { fileName: 'style.css', source: ':root{}' },
      ]),
    ),
    ['javascript', 'css'],
  );
});

test('summarizeAssets rejects an unknown emitted extension', () => {
  assert.throws(
    () => summarizeAssets([{ fileName: 'asset.svg', source: '<svg />' }]),
    /unsupported emitted asset extension: asset\.svg/,
  );
});

function baselineFixture() {
  return {
    schemaVersion: 1,
    measuredAt: '2026-08-13T00:00:00.000Z',
    revision: 'baseline-revision',
    owner: 'Lyra maintainers',
    environment: {
      operatingSystem: 'linux 6.12.41-1-MANJARO',
      architecture: 'x64',
      node: 'v24.5.0',
      pnpm: '11.13.1',
      vite: '8.2.1',
      sizeLimit: '12.1.0',
      lockfileSha256: 'repository-lock',
      fixture: {
        artifactInstallation: 'offline tar extraction after frozen external install',
        packageManager: 'pnpm@11.13.1',
        lockfileSha256: 'fixture-lock',
        resolvedGraph: [{ name: 'fixture', dependencies: {} }],
        resolvedGraphSha256: 'fixture-graph',
      },
      exactCommand: 'pnpm baseline:bundles --write',
      cacheState: 'cold: fresh temporary consumer and pnpm store',
      brotli: { mode: 'text', quality: 11 },
      packages: {
        '@lyra-ds/react': {
          version: '0.4.2',
          tarball: 'lyra-ds-react-0.4.2.tgz',
          sha256: 'react-tarball',
        },
      },
    },
    externals: ['react'],
    standalone: {},
    scenarios: {},
    css: {},
  };
}

test('compareBaseline ignores operating-system release evidence alone', () => {
  const expected = baselineFixture();
  const actual = structuredClone(expected);
  actual.environment.operatingSystem = 'linux 6.11.0-1018-azure Ubuntu';

  assert.doesNotThrow(() => compareBaseline(expected, actual));
});

test('compareBaseline rejects reproducibility-critical tool and checksum drift', () => {
  for (const [field, mutate] of [
    ['Vite version', (baseline) => (baseline.environment.vite = '8.2.2')],
    [
      'fixture lockfile checksum',
      (baseline) => (baseline.environment.fixture.lockfileSha256 = 'different-fixture-lock'),
    ],
    [
      'tarball checksum',
      (baseline) => (baseline.environment.packages['@lyra-ds/react'].sha256 = 'changed-tarball'),
    ],
  ]) {
    const actual = structuredClone(baselineFixture());
    mutate(actual);

    assert.throws(
      () => compareBaseline(baselineFixture(), actual),
      /bundle baseline drift in: environment/,
      field,
    );
  }
});

test('baseline artifact writes are immutable', async () => {
  const fixture = mkdtempSync(join(tmpdir(), 'lyra-bundle-test-'));
  try {
    const paths = {
      baselineJson: join(fixture, 'bundles.json'),
      baselineMarkdown: join(fixture, 'bundles.md'),
    };
    const baseline = baselineFixture();
    await writeBaselineArtifacts(baseline, paths);
    const originalJson = readFileSync(paths.baselineJson, 'utf8');
    const originalMarkdown = readFileSync(paths.baselineMarkdown, 'utf8');

    const replacement = structuredClone(baseline);
    replacement.environment.vite = '9.0.0';
    await assert.rejects(
      () => writeBaselineArtifacts(replacement, paths),
      /refusing to overwrite immutable bundle baseline evidence/,
    );
    assert.equal(readFileSync(paths.baselineJson, 'utf8'), originalJson);
    assert.equal(readFileSync(paths.baselineMarkdown, 'utf8'), originalMarkdown);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('baseline artifact checks validate canonical files without changing them', async () => {
  const fixture = mkdtempSync(join(tmpdir(), 'lyra-bundle-test-'));
  try {
    const paths = {
      baselineJson: join(fixture, 'bundles.json'),
      baselineMarkdown: join(fixture, 'bundles.md'),
    };
    const baseline = baselineFixture();
    await writeBaselineArtifacts(baseline, paths);
    const originalJson = readFileSync(paths.baselineJson, 'utf8');
    const originalMarkdown = readFileSync(paths.baselineMarkdown, 'utf8');

    await checkBaselineArtifacts(structuredClone(baseline), paths);

    assert.equal(readFileSync(paths.baselineJson, 'utf8'), originalJson);
    assert.equal(readFileSync(paths.baselineMarkdown, 'utf8'), originalMarkdown);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('baseline artifact checks reject a missing or stale Markdown report', async () => {
  const fixture = mkdtempSync(join(tmpdir(), 'lyra-bundle-test-'));
  try {
    const paths = {
      baselineJson: join(fixture, 'bundles.json'),
      baselineMarkdown: join(fixture, 'bundles.md'),
    };
    const baseline = baselineFixture();
    await writeBaselineArtifacts(baseline, paths);

    rmSync(paths.baselineMarkdown);
    await assert.rejects(
      () => checkBaselineArtifacts(structuredClone(baseline), paths),
      /bundle baseline Markdown does not exist/,
    );

    writeFileSync(paths.baselineMarkdown, 'stale report\n');
    await assert.rejects(
      () => checkBaselineArtifacts(structuredClone(baseline), paths),
      /bundle baseline Markdown drift/,
    );
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('committed baseline JSON and Markdown are canonical peers', async () => {
  const baselineRoot = join(
    toolDirectory,
    '..',
    '..',
    'docs',
    'superpowers',
    'baselines',
    'lyra-v1',
  );
  const paths = {
    baselineJson: join(baselineRoot, 'bundles.json'),
    baselineMarkdown: join(baselineRoot, 'bundles.md'),
  };
  const baseline = JSON.parse(readFileSync(paths.baselineJson, 'utf8'));

  await assert.doesNotReject(() => checkBaselineArtifacts(baseline, paths));
});

test('measureScenario builds a CSS library entry', async () => {
  const fixture = mkdtempSync(join(tmpdir(), 'lyra-bundle-test-'));
  try {
    const entry = join(fixture, 'entry.css');
    writeFileSync(entry, ':root { --accent: blue; }\n');

    const result = await measureScenario({ entry, name: 'css-entry', root: fixture });

    assert.ok(result.assets.css.rawBytes > result.assets.css.minifiedBytes);
    assert.ok(result.assets.css.brotliBytes > 0);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('measureScenario keeps the React JSX runtime external', async () => {
  const fixture = mkdtempSync(join(tmpdir(), 'lyra-bundle-test-'));
  try {
    const entry = join(fixture, 'entry.ts');
    const button = pathToFileURL(
      join(toolDirectory, '..', '..', 'packages', 'react', 'dist', 'button.js'),
    ).href;
    writeFileSync(entry, `export { Button } from '${button}';\n`);
    const result = await measureScenario({ entry, name: 'button', root: fixture });

    assert.ok(
      result.modules.every(({ module }) => !module.includes('react-jsx-runtime.development.js')),
    );
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('changed Lyra tarballs install independently of the external lock', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'lyra-bundle-test-'));
  try {
    const packageDirectory = join(fixture, 'package-source');
    const packDirectory = join(fixture, 'packed');
    mkdirSync(packageDirectory);
    mkdirSync(packDirectory);
    writeFileSync(
      join(packageDirectory, 'package.json'),
      `${JSON.stringify({ name: '@lyra-ds/react', version: '9.9.9', exports: './index.js' })}\n`,
    );
    writeFileSync(join(packageDirectory, 'index.js'), "export const artifactMarker = 'changed';\n");
    const packed = spawnSync('npm', ['pack', '--pack-destination', packDirectory], {
      cwd: packageDirectory,
      encoding: 'utf8',
    });
    assert.equal(packed.status, 0, packed.stderr);
    const tarball = join(packDirectory, readdirSync(packDirectory)[0]);

    installPackedArtifacts(fixture, { react: tarball });

    const installed = join(fixture, 'node_modules', '@lyra-ds', 'react');
    assert.equal(
      JSON.parse(readFileSync(join(installed, 'package.json'), 'utf8')).version,
      '9.9.9',
    );
    assert.match(readFileSync(join(installed, 'index.js'), 'utf8'), /artifactMarker = 'changed'/);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
