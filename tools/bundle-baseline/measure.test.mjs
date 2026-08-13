import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
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
  runBundleBaselineCli,
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

test('compareBaseline reports the exact measurement paths and values that drifted', () => {
  const expected = baselineFixture();
  expected.standalone = {
    react: [{ assets: { javascript: { brotliBytes: 529 } } }],
  };
  expected.scenarios = {
    form: { assets: { javascript: { rawBytes: 20_553 } } },
  };
  const actual = structuredClone(expected);
  actual.standalone.react[0].assets.javascript.brotliBytes = 530;
  actual.scenarios.form.assets.javascript.rawBytes = 20_554;

  assert.throws(
    () => compareBaseline(expected, actual),
    (error) => {
      assert.match(
        error.message,
        /standalone\.react\[0\]\.assets\.javascript\.brotliBytes: expected 529, actual 530/,
      );
      assert.match(
        error.message,
        /scenarios\.form\.assets\.javascript\.rawBytes: expected 20553, actual 20554/,
      );
      return true;
    },
  );
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

test('bundle CLI rejects anything except one mode argument', async () => {
  for (const args of [[], ['--unknown'], ['--check', 'extra']]) {
    await assert.rejects(
      () => runBundleBaselineCli(args),
      /usage: node tools\/bundle-baseline\/measure\.mjs --write\|--check/,
    );
  }
});

test('bundle CLI rejects a dirty --write before collection or file creation', async () => {
  const fixture = mkdtempSync(join(tmpdir(), 'lyra-bundle-cli-test-'));
  try {
    const paths = {
      baselineJson: join(fixture, 'bundles.json'),
      baselineMarkdown: join(fixture, 'bundles.md'),
    };
    let collections = 0;

    await assert.rejects(
      () =>
        runBundleBaselineCli(['--write'], {
          paths,
          collect: async () => {
            collections += 1;
            return baselineFixture();
          },
          ensureClean: () => {
            throw new Error('refusing --write from a dirty worktree:\n M tracked-file');
          },
        }),
      /refusing --write from a dirty worktree/,
    );
    assert.equal(collections, 0);
    assert.equal(existsSync(paths.baselineJson), false);
    assert.equal(existsSync(paths.baselineMarkdown), false);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('bundle CLI --write creates immutable artifacts and refuses an overwrite before collection', async () => {
  const fixture = mkdtempSync(join(tmpdir(), 'lyra-bundle-cli-test-'));
  try {
    const paths = {
      baselineJson: join(fixture, 'bundles.json'),
      baselineMarkdown: join(fixture, 'bundles.md'),
    };
    const baseline = baselineFixture();
    let collections = 0;
    const collect = async () => {
      collections += 1;
      return baseline;
    };

    await runBundleBaselineCli(['--write'], {
      paths,
      collect,
      ensureClean: () => {},
    });
    const originalJson = readFileSync(paths.baselineJson, 'utf8');
    const originalMarkdown = readFileSync(paths.baselineMarkdown, 'utf8');

    await assert.rejects(
      () =>
        runBundleBaselineCli(['--write'], {
          paths,
          collect,
          ensureClean: () => {},
        }),
      /refusing to overwrite immutable bundle baseline evidence/,
    );
    assert.equal(collections, 1);
    assert.equal(readFileSync(paths.baselineJson, 'utf8'), originalJson);
    assert.equal(readFileSync(paths.baselineMarkdown, 'utf8'), originalMarkdown);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('bundle CLI --check rejects missing and stale Markdown before collection', async () => {
  const fixture = mkdtempSync(join(tmpdir(), 'lyra-bundle-cli-test-'));
  try {
    const paths = {
      baselineJson: join(fixture, 'bundles.json'),
      baselineMarkdown: join(fixture, 'bundles.md'),
    };
    const baseline = baselineFixture();
    writeFileSync(paths.baselineJson, `${JSON.stringify(baseline, null, 2)}\n`);
    let collections = 0;
    const collect = async () => {
      collections += 1;
      return structuredClone(baseline);
    };

    await assert.rejects(
      () => runBundleBaselineCli(['--check'], { paths, collect }),
      /bundle baseline Markdown does not exist/,
    );
    writeFileSync(paths.baselineMarkdown, 'stale report\n');
    await assert.rejects(
      () => runBundleBaselineCli(['--check'], { paths, collect }),
      /bundle baseline Markdown drift/,
    );
    assert.equal(collections, 0);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('bundle CLI --check compares one collection without modifying artifacts', async () => {
  const fixture = mkdtempSync(join(tmpdir(), 'lyra-bundle-cli-test-'));
  try {
    const paths = {
      baselineJson: join(fixture, 'bundles.json'),
      baselineMarkdown: join(fixture, 'bundles.md'),
    };
    const baseline = baselineFixture();
    await writeBaselineArtifacts(baseline, paths);
    const originalJson = readFileSync(paths.baselineJson, 'utf8');
    const originalMarkdown = readFileSync(paths.baselineMarkdown, 'utf8');
    let collections = 0;

    const message = await runBundleBaselineCli(['--check'], {
      paths,
      collect: async () => {
        collections += 1;
        return structuredClone(baseline);
      },
    });
    assert.match(message, /Bundle baseline check OK/);

    const drift = structuredClone(baseline);
    drift.environment.vite = '9.0.0';
    await assert.rejects(
      () =>
        runBundleBaselineCli(['--check'], {
          paths,
          collect: async () => {
            collections += 1;
            return drift;
          },
        }),
      /bundle baseline drift in: environment/,
    );
    assert.equal(collections, 2);
    assert.equal(readFileSync(paths.baselineJson, 'utf8'), originalJson);
    assert.equal(readFileSync(paths.baselineMarkdown, 'utf8'), originalMarkdown);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
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
