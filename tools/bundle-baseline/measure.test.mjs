import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { format } from 'prettier';
import { writeRuntimeArtifacts } from '../file-upload-performance/measure.mjs';
import {
  acceptComparison,
  brotliBytes,
  checkBaselineArtifacts,
  compareBaseline,
  fixtureSourceSha256,
  createComparison,
  environment,
  installPackedArtifacts,
  measureScenario,
  normalizeModulePath,
  resolvePnpmInvocation,
  renderComparisonMarkdown,
  resolveBaselineReference,
  runBundleBaselineCli,
  summarizeAssets,
  validateComparisonArtifacts,
  writeBaselineArtifacts,
  writeComparisonArtifacts,
} from './measure.mjs';
import {
  APPROVED_ABSOLUTE_CAPS,
  APPROVED_FIXTURE_SOURCE_SHA256,
  checkBundleBudgets,
} from './budgets.mjs';

const toolDirectory = dirname(fileURLToPath(import.meta.url));

test('pnpm invocation executes a native program without parsing its binary as JavaScript', () => {
  const invocation = resolvePnpmInvocation(['--version'], { npmExecPath: process.execPath });
  const result = spawnSync(invocation.command, invocation.args, { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), process.version);
});

test('environment preserves historical fixture fields outside the budget command', () => {
  const directory = mkdtempSync(join(tmpdir(), 'lyra-budget-environment-'));
  try {
    for (const [name, version] of [
      ['vite', '8.2.1'],
      ['size-limit', '12.1.0'],
    ]) {
      const destination = join(directory, 'node_modules', name);
      mkdirSync(destination, { recursive: true });
      writeFileSync(join(destination, 'package.json'), JSON.stringify({ name, version }));
    }
    const fixture = {
      directory,
      artifactInstallation: 'offline tar extraction after frozen external install',
      packageManager: 'pnpm@11.13.1',
      lockfileSha256: 'a'.repeat(64),
      resolvedGraph: [],
      resolvedGraphSha256: 'b'.repeat(64),
      sourceSha256: APPROVED_FIXTURE_SOURCE_SHA256,
      artifacts: {},
    };
    const historicalFields = [
      'artifactInstallation',
      'packageManager',
      'lockfileSha256',
      'resolvedGraph',
      'resolvedGraphSha256',
    ];
    for (const command of ['pnpm evidence:file-upload', 'pnpm baseline:bundles --write']) {
      assert.deepEqual(Object.keys(environment(fixture, command).fixture), historicalFields);
    }
    assert.equal(
      environment(fixture, 'pnpm baseline:bundles --check-budgets').fixture.sourceSha256,
      fixture.sourceSha256,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('brotliBytes is deterministic and uses text input', () => {
  assert.equal(brotliBytes('export const value = 1;'), brotliBytes('export const value = 1;'));
});

test('fixture source fingerprint uses portable protocol paths and LF text', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'lyra-fixture-fingerprint-'));
  try {
    const lf = join(fixture, 'lf.ts');
    const crlf = join(fixture, 'crlf.ts');
    writeFileSync(lf, 'export const fixture = true;\n');
    writeFileSync(crlf, 'export const fixture = true;\r\n');

    assert.equal(
      fixtureSourceSha256({
        files: [lf],
        relativePath: () => 'tools/bundle-baseline/scenarios/form.ts',
      }),
      fixtureSourceSha256({
        files: [crlf],
        relativePath: () => 'tools\\bundle-baseline\\scenarios\\form.ts',
      }),
    );
    assert.equal(fixtureSourceSha256(), APPROVED_FIXTURE_SOURCE_SHA256);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('pnpm uses its current JavaScript entry without a shell when available', () => {
  assert.deepEqual(
    resolvePnpmInvocation(['pack'], {
      npmExecPath: '/tooling/pnpm.cjs',
      nodeExecutable: '/node/bin/node',
      platformName: 'win32',
    }),
    { command: '/node/bin/node', args: ['/tooling/pnpm.cjs', 'pack'] },
  );
  assert.deepEqual(
    resolvePnpmInvocation(['--version'], { npmExecPath: '', platformName: 'win32' }),
    { command: 'pnpm.cmd', args: ['--version'] },
  );
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

test('normalizeModulePath only replaces complete path prefixes', () => {
  assert.equal(
    normalizeModulePath(
      '/tmp/consumer/node_modules/@lyra-ds/react/dist/workspace-switcher.js',
      '/tmp/consumer',
      '/workspace',
    ),
    '<fixture>/node_modules/@lyra-ds/react/dist/workspace-switcher.js',
  );
  assert.equal(
    normalizeModulePath('/workspace/packages/react/src/index.ts', '/tmp/consumer', '/workspace'),
    '<repository>/packages/react/src/index.ts',
  );
});

test('normalizeModulePath uses protocol separators for Windows root-relative IDs', () => {
  assert.equal(
    normalizeModulePath(
      'C:\\consumer\\node_modules\\@lyra-ds\\react\\dist\\workspace-switcher.js',
      'C:\\consumer',
      'C:\\repository',
    ),
    '<fixture>/node_modules/@lyra-ds/react/dist/workspace-switcher.js',
  );
  assert.equal(
    normalizeModulePath('C:\\consumer-sibling\\index.js', 'C:\\consumer', 'C:\\repository'),
    'C:\\consumer-sibling\\index.js',
  );
});

test('normalizeModulePath resolves symlinked fixture and repository roots without rewriting outside IDs', () => {
  const temporaryRoot = mkdtempSync(join(tmpdir(), 'lyra-normalize-module-path-'));
  try {
    const repositoryRoot = join(temporaryRoot, 'repository');
    const fixtureRoot = join(repositoryRoot, 'consumer');
    const repositoryAlias = join(temporaryRoot, 'repository-alias');
    const fixtureAlias = join(repositoryAlias, 'consumer');
    const directFixtureAlias = join(temporaryRoot, 'fixture-alias');
    const nestedModule = join(
      fixtureRoot,
      'node_modules',
      '@lyra-ds',
      'react',
      'dist',
      'workspace-switcher.js',
    );
    const standaloneModule = join(fixtureRoot, 'standalone', 'react-02.ts');
    const repositoryModule = join(repositoryRoot, 'packages', 'react', 'src', 'index.ts');
    const similarlyPrefixedSibling = join(temporaryRoot, 'repository-sibling', 'index.ts');

    for (const modulePath of [
      nestedModule,
      standaloneModule,
      repositoryModule,
      similarlyPrefixedSibling,
    ]) {
      mkdirSync(dirname(modulePath), { recursive: true });
      writeFileSync(modulePath, 'export {};\n');
    }
    symlinkSync(repositoryRoot, repositoryAlias, 'dir');
    symlinkSync(fixtureRoot, directFixtureAlias, 'dir');

    assert.equal(
      normalizeModulePath(nestedModule, fixtureAlias, repositoryAlias),
      '<fixture>/node_modules/@lyra-ds/react/dist/workspace-switcher.js',
    );
    assert.equal(
      normalizeModulePath(
        join(fixtureAlias, 'standalone', 'react-02.ts'),
        fixtureRoot,
        repositoryRoot,
      ),
      '<fixture>/standalone/react-02.ts',
    );
    assert.equal(
      normalizeModulePath(standaloneModule, directFixtureAlias, repositoryRoot),
      '<fixture>/standalone/react-02.ts',
    );
    assert.equal(
      normalizeModulePath(repositoryModule, fixtureAlias, repositoryAlias),
      '<repository>/packages/react/src/index.ts',
    );
    assert.equal(
      normalizeModulePath(similarlyPrefixedSibling, fixtureAlias, repositoryAlias),
      similarlyPrefixedSibling,
    );
    assert.equal(
      normalizeModulePath('virtual:lyra-module', fixtureAlias, repositoryAlias),
      'virtual:lyra-module',
    );
    assert.equal(
      normalizeModulePath(`${nestedModule}?used`, fixtureAlias, repositoryAlias),
      `${nestedModule}?used`,
    );
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
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
        '@lyra-ds/styles': {
          version: '0.4.2',
          tarball: 'lyra-ds-styles-0.4.2.tgz',
          sha256: 'styles-tarball',
        },
      },
    },
    externals: ['react'],
    standalone: {},
    scenarios: {},
    css: {},
  };
}

function budgetReferenceFixture() {
  return JSON.parse(
    readFileSync(
      join(
        toolDirectory,
        '..',
        '..',
        'docs',
        'superpowers',
        'baselines',
        'lyra-v1',
        'comparisons',
        'file-upload',
        'f688716c16bf6f3f1584ae618f926d0376e65d44.json',
      ),
      'utf8',
    ),
  ).after;
}

function approvedBudgetCandidate() {
  const candidate = structuredClone(budgetReferenceFixture());
  candidate.environment.operatingSystem = 'linux 6.11.0-1018-azure Ubuntu';
  candidate.environment.architecture = 'x64';
  candidate.environment.lockfileSha256 =
    '1dd543e240aa7038cc2db2267c87d668ad9ebe8ffcb8f6c2001279beba4c4ecf';
  candidate.environment.exactCommand = 'pnpm baseline:bundles --check-budgets';
  candidate.environment.fixture.sourceSha256 = APPROVED_FIXTURE_SOURCE_SHA256;
  for (const entries of Object.values(candidate.standalone)) {
    for (const entry of entries) {
      const cap = APPROVED_ABSOLUTE_CAPS[entry.publicEntry];
      if (cap) {
        entry.configuredLimit = cap.configuredLimit;
        entry.sizeLimit.sizeLimit = cap.bytes;
        entry.sizeLimit.size = Math.min(entry.sizeLimit.size, cap.bytes);
      }
    }
  }
  return candidate;
}

function ledgerCandidateFor(candidate) {
  return {
    sourceRevision: 'a'.repeat(40),
    packages: Object.fromEntries(
      ['styles', 'react', 'alpine'].map((key) => {
        const artifact = candidate.environment.packages[`@lyra-ds/${key}`];
        return [key, { name: `@lyra-ds/${key}`, ...artifact, path: null }];
      }),
    ),
  };
}

test('native budget check accepts the 1.0.0 candidate reference on a different platform', () => {
  const result = checkBundleBudgets(budgetReferenceFixture(), approvedBudgetCandidate());

  assert.equal(result.result, 'pass');
  assert.equal(result.environment.architecture, 'x64');
  assert.equal(result.artifacts['@lyra-ds/react'].version, '1.0.0');
  const drawer = result.entries.react.find(
    (entry) => entry.publicEntry === '@lyra-ds/react/drawer',
  );
  assert.equal(drawer.migration.approvedException, null);
  assert.equal(drawer.migration.limitBytes, 3000);
  assert.equal(drawer.deltas.brotliBytes, 0);
  assert.equal(result.entries.css.length, 4);
});

test('native budget check binds packed artifacts to a candidate ledger only when requested', () => {
  const candidate = approvedBudgetCandidate();
  const ledgerCandidate = ledgerCandidateFor(candidate);
  const withoutBinding = checkBundleBudgets(budgetReferenceFixture(), candidate);
  assert.deepEqual(
    checkBundleBudgets(budgetReferenceFixture(), candidate, { ledgerCandidate: null }),
    withoutBinding,
  );
  const result = checkBundleBudgets(budgetReferenceFixture(), candidate, { ledgerCandidate });

  assert.equal(withoutBinding.candidateBinding, null);
  assert.deepEqual(result.candidateBinding, {
    result: 'pass',
    sourceRevision: ledgerCandidate.sourceRevision,
    packages: Object.fromEntries(
      ['styles', 'react', 'alpine'].map((key) => [
        key,
        (({ name, version, tarball, sha256 }) => ({ name, version, tarball, sha256 }))(
          ledgerCandidate.packages[key],
        ),
      ]),
    ),
  });

  ledgerCandidate.packages.react.sha256 = 'f'.repeat(64);
  assert.throws(
    () => checkBundleBudgets(budgetReferenceFixture(), candidate, { ledgerCandidate }),
    /candidate artifact binding mismatch for @lyra-ds\/react/,
  );

  ledgerCandidate.packages.react.sha256 = candidate.environment.packages['@lyra-ds/react'].sha256;
  ledgerCandidate.packages.react.version = '2.0.0';
  assert.throws(
    () => checkBundleBudgets(budgetReferenceFixture(), candidate, { ledgerCandidate }),
    /candidate artifact binding mismatch for @lyra-ds\/react/,
  );

  ledgerCandidate.packages.react.version = candidate.environment.packages['@lyra-ds/react'].version;
  ledgerCandidate.packages.react.tarball = 'wrong.tgz';
  assert.throws(
    () => checkBundleBudgets(budgetReferenceFixture(), candidate, { ledgerCandidate }),
    /candidate artifact binding mismatch for @lyra-ds\/react/,
  );

  ledgerCandidate.packages.react.tarball = candidate.environment.packages['@lyra-ds/react'].tarball;
  ledgerCandidate.packages.react.name = '@lyra-ds/styles';
  assert.throws(
    () => checkBundleBudgets(budgetReferenceFixture(), candidate, { ledgerCandidate }),
    /candidate artifact binding mismatch for @lyra-ds\/react/,
  );
});

test('native budget check rejects migration and absolute-cap breaches without trusting Size Limit passed', () => {
  const candidate = approvedBudgetCandidate();
  const drawer = candidate.standalone.react.find(
    (entry) => entry.publicEntry === '@lyra-ds/react/drawer',
  );
  drawer.assets.javascript.brotliBytes += 3001;
  drawer.sizeLimit.passed = true;
  assert.throws(
    () => checkBundleBudgets(budgetReferenceFixture(), candidate),
    /drawer Brotli increase exceeds migration ceiling/,
  );

  const cappedGrowth = approvedBudgetCandidate();
  cappedGrowth.standalone.react.find(
    (entry) => entry.publicEntry === '@lyra-ds/react/time-picker',
  ).assets.javascript.brotliBytes += 3001;
  assert.throws(
    () => checkBundleBudgets(budgetReferenceFixture(), cappedGrowth),
    /time-picker Brotli increase exceeds migration ceiling/,
  );

  const cappedScenario = approvedBudgetCandidate();
  cappedScenario.scenarios.overlays.assets.javascript.brotliBytes += 3001;
  assert.throws(
    () => checkBundleBudgets(budgetReferenceFixture(), cappedScenario),
    /scenario overlays Brotli increase exceeds migration ceiling/,
  );

  const overCap = approvedBudgetCandidate();
  overCap.standalone.react.find(
    (entry) => entry.publicEntry === '@lyra-ds/react/tooltip',
  ).sizeLimit.size = 2101;
  assert.throws(
    () => checkBundleBudgets(budgetReferenceFixture(), overCap),
    /tooltip exceeds absolute cap/,
  );

  const newAbsoluteCap = approvedBudgetCandidate();
  newAbsoluteCap.standalone.react.find(
    (entry) => entry.publicEntry === '@lyra-ds/react/dropdown',
  ).sizeLimit.size = 2441;
  assert.throws(
    () => checkBundleBudgets(budgetReferenceFixture(), newAbsoluteCap),
    /dropdown exceeds absolute cap/,
  );
});

test('native budget check rejects malformed, duplicate, and missing measurements', () => {
  for (const [label, mutate, message] of [
    [
      'negative metric',
      (candidate) => (candidate.standalone.react[0].assets.javascript.brotliBytes = -1),
      /finite nonnegative integer/,
    ],
    ['missing candidate revision', (candidate) => delete candidate.revision, /candidate revision/],
    ['invalid schema version', (candidate) => (candidate.schemaVersion = 999), /schema version/],
    [
      'missing module list',
      (candidate) => delete candidate.standalone.react[0].modules,
      /modules must be an array/,
    ],
    [
      'negative module contribution',
      (candidate) => (candidate.standalone.react[0].modules[0].renderedBytes = -1),
      /renderedBytes must be a finite nonnegative integer/,
    ],
    [
      'missing emitted file list',
      (candidate) => delete candidate.standalone.react[0].assets.javascript.files,
      /files must be an array/,
    ],
  ]) {
    const invalid = approvedBudgetCandidate();
    mutate(invalid);
    assert.throws(() => checkBundleBudgets(budgetReferenceFixture(), invalid), message, label);
  }

  const duplicate = approvedBudgetCandidate();
  duplicate.standalone.react.push(structuredClone(duplicate.standalone.react[0]));
  assert.throws(
    () => checkBundleBudgets(budgetReferenceFixture(), duplicate),
    /duplicate candidate React standalone/,
  );

  const missing = approvedBudgetCandidate();
  delete missing.scenarios.form;
  assert.throws(
    () => checkBundleBudgets(budgetReferenceFixture(), missing),
    /scenario measurements differ/,
  );
});

test('native budget check rejects unapproved import, protocol, and configured-cap changes', () => {
  const importChanged = approvedBudgetCandidate();
  importChanged.standalone.react.find((entry) => entry.publicEntry === '@lyra-ds/react/tabs').name =
    "import { Tabs } from '@lyra-ds/react/tabs'";
  assert.throws(
    () => checkBundleBudgets(budgetReferenceFixture(), importChanged),
    /unapproved import/,
  );

  const protocolChanged = approvedBudgetCandidate();
  protocolChanged.externals = ['react'];
  assert.throws(() => checkBundleBudgets(budgetReferenceFixture(), protocolChanged), /externals/);

  const capChanged = approvedBudgetCandidate();
  capChanged.standalone.react.find(
    (entry) => entry.publicEntry === '@lyra-ds/react/drawer',
  ).sizeLimit.sizeLimit = 5301;
  assert.throws(
    () => checkBundleBudgets(budgetReferenceFixture(), capChanged),
    /unapproved Size Limit cap/,
  );
});

function fileUploadBaselineFixture({
  revision = 'before-revision',
  react = 7_900,
  alpine = 18_000,
  css = 12_000,
  filesData = 11_000,
} = {}) {
  const baseline = baselineFixture();
  baseline.revision = revision;
  baseline.standalone = {
    react: [
      {
        name: "import { FileUpload } from '@lyra-ds/react/file-upload'",
        publicEntry: '@lyra-ds/react/file-upload',
        configuredLimit: '8 kB',
        sizeLimit: { passed: react <= 8_000, size: react, sizeLimit: 8_000 },
        assets: {
          javascript: { rawBytes: react * 6, minifiedBytes: react * 4, brotliBytes: react },
        },
      },
    ],
    alpine: [
      {
        name: "import lyra from '@lyra-ds/alpine'",
        publicEntry: '@lyra-ds/alpine',
        configuredLimit: '21.2 kB',
        sizeLimit: { passed: true, size: alpine, sizeLimit: 21_200 },
        assets: {
          javascript: { rawBytes: alpine * 6, minifiedBytes: alpine * 4, brotliBytes: alpine },
        },
      },
    ],
  };
  baseline.css = {
    'styles.css': {
      publicEntry: '@lyra-ds/styles/styles.css',
      rawBytes: css * 8,
      minifiedBytes: css * 5,
      brotliBytes: css,
      modules: [{ module: '<fixture>/styles.css', renderedBytes: css * 5 }],
    },
  };
  baseline.scenarios = {
    'files-data': {
      assets: {
        javascript: {
          rawBytes: filesData * 7,
          minifiedBytes: filesData * 4,
          brotliBytes: filesData,
        },
      },
      modules: [{ module: '<fixture>/file-upload.js', renderedBytes: filesData * 2 }],
    },
  };
  return baseline;
}

function runtimeEvidenceFixture({
  revision = 'after-revision',
  reactSha = 'react-tarball',
  stylesSha = 'styles-tarball',
} = {}) {
  const result = {
    iterations: 30,
    medianMs: 10,
    p95Ms: 10,
    worstMs: 10,
    longestTaskMs: 0,
  };
  return {
    schemaVersion: 1,
    scenario: 'DF-FU-15',
    revision,
    measuredAt: '2026-08-16T00:00:00.000Z',
    environment: {
      chromium: { version: 'Chromium 140.0.0', executablePath: '/pinned/chromium' },
      viewport: { width: 1280, height: 720, deviceScaleFactor: 1 },
      locale: 'en-US',
      colorScheme: 'light',
      warmupIterations: 3,
      recordedIterations: 30,
      itemCount: 100,
      activeAttemptCount: 20,
      exactCommand: 'pnpm evidence:file-upload',
      reactArtifact: {
        version: '0.4.2',
        tarball: 'lyra-ds-react-0.4.2.tgz',
        sha256: reactSha,
      },
      stylesArtifact: {
        version: '0.4.2',
        tarball: 'lyra-ds-styles-0.4.2.tgz',
        sha256: stylesSha,
      },
    },
    thresholds: { p95Ms: 100, worstMsExclusive: 250, longTaskMsExclusive: 50 },
    operations: Object.fromEntries(
      [
        'selectionIntentDispatch',
        'controlledProgressReconciliation',
        'cancelIntent',
        'retryIntent',
        'confirmedRemovalFocusRecovery',
        'teardown',
      ].map((name) => [name, { ...result }]),
    ),
  };
}

test('FileUpload comparison reports separate deltas and enforces both budgets', () => {
  const before = fileUploadBaselineFixture();
  const after = fileUploadBaselineFixture({
    revision: 'after-revision',
    react: 8_050,
    alpine: 21_001,
    css: 12_500,
    filesData: 14_001,
  });

  const comparison = createComparison('file-upload', before, after);

  assert.equal(comparison.entries.reactFileUpload.deltas.brotliBytes.absolute, 150);
  assert.equal(comparison.entries.alpineAdapter.deltas.brotliBytes.absolute, 3_001);
  assert.equal(comparison.entries.css.deltas.brotliBytes.absolute, 500);
  assert.equal(comparison.entries.filesData.deltas.brotliBytes.absolute, 3_001);
  assert.equal(comparison.budgets.reactFileUploadAbsolute.passed, false);
  assert.equal(comparison.budgets.complexDelta.passed, false);
  assert.equal(comparison.result, 'fail');
});

test('React absolute budget uses the packed Size Limit result', () => {
  const before = fileUploadBaselineFixture();
  const after = fileUploadBaselineFixture({ revision: 'after-revision', react: 7_900 });
  after.standalone.react[0].sizeLimit = {
    passed: false,
    size: 8_001,
    sizeLimit: 8_000,
  };

  const comparison = createComparison('file-upload', before, after);

  assert.deepEqual(comparison.budgets.reactFileUploadAbsolute, {
    limitBytes: 8_000,
    actualBytes: 8_001,
    passed: false,
  });
});

test('FileUpload comparison preserves module contributions and removed code', () => {
  const before = fileUploadBaselineFixture();
  const after = fileUploadBaselineFixture({ revision: 'after-revision' });
  after.scenarios['files-data'].modules = [
    { module: '<fixture>/file-upload-next.js', renderedBytes: 22_000 },
  ];

  const comparison = createComparison('file-upload', before, after);

  assert.deepEqual(comparison.entries.filesData.removedModules, [
    { module: '<fixture>/file-upload.js', renderedBytes: 22_000 },
  ]);
  assert.deepEqual(comparison.entries.filesData.addedModules, [
    { module: '<fixture>/file-upload-next.js', renderedBytes: 22_000 },
  ]);
  assert.deepEqual(comparison.entries.filesData.metafiles.after.modules, [
    { module: '<fixture>/file-upload-next.js', renderedBytes: 22_000 },
  ]);
});

test('module deltas stay unavailable when either side lacks module telemetry', async () => {
  const before = fileUploadBaselineFixture();
  const after = fileUploadBaselineFixture({ revision: 'after-revision' });
  after.standalone.react[0].modules = [
    { module: '<fixture>/file-upload.js', renderedBytes: 16_000 },
  ];

  const comparison = createComparison('file-upload', before, after);
  const entry = comparison.entries.reactFileUpload;

  assert.deepEqual(entry.moduleTelemetry, {
    before: 'unavailable',
    after: 'available',
    delta: 'unavailable',
  });
  assert.equal(entry.moduleContributions.before, null);
  assert.deepEqual(entry.moduleContributions.after, [
    { module: '<fixture>/file-upload.js', renderedBytes: 16_000 },
  ]);
  assert.equal(entry.removedModules, null);
  assert.equal(entry.addedModules, null);
  assert.equal(entry.metafiles.before.modules, null);

  const report = await renderComparisonMarkdown(comparison);
  assert.match(report, /React FileUpload\s+\| unavailable\s+\| available\s+\| unavailable/);
});

test('comparison artifacts are immutable canonical JSON and Markdown peers', async () => {
  const fixture = mkdtempSync(join(tmpdir(), 'lyra-comparison-test-'));
  try {
    const comparison = createComparison(
      'file-upload',
      fileUploadBaselineFixture(),
      fileUploadBaselineFixture({ revision: 'after-revision' }),
    );
    const paths = {
      comparisonJson: join(fixture, 'after-revision.json'),
      comparisonMarkdown: join(fixture, 'after-revision.md'),
    };

    await writeComparisonArtifacts(comparison, paths);
    assert.equal(
      readFileSync(paths.comparisonJson, 'utf8'),
      await format(`${JSON.stringify(comparison, null, 2)}\n`, { parser: 'json' }),
    );
    assert.equal(
      readFileSync(paths.comparisonMarkdown, 'utf8'),
      await renderComparisonMarkdown(comparison),
    );
    await assert.doesNotReject(() => validateComparisonArtifacts(paths));
    await assert.rejects(
      () => writeComparisonArtifacts(comparison, paths),
      /refusing to overwrite immutable FileUpload comparison evidence/,
    );

    rmSync(paths.comparisonMarkdown);
    await assert.rejects(
      () => validateComparisonArtifacts(paths),
      /comparison Markdown does not exist/,
    );
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('current reference selects the exact accepted comparison and otherwise falls back', async () => {
  const fixture = mkdtempSync(join(tmpdir(), 'lyra-current-test-'));
  try {
    const baseline = fileUploadBaselineFixture();
    const baselinePaths = {
      baselineJson: join(fixture, 'bundles.json'),
      baselineMarkdown: join(fixture, 'bundles.md'),
    };
    await writeBaselineArtifacts(baseline, baselinePaths);

    const fallback = await resolveBaselineReference({
      ...baselinePaths,
      currentJson: join(fixture, 'current.json'),
      comparisonDirectory: join(fixture, 'comparisons'),
    });
    assert.equal(fallback.revision, 'before-revision');

    const comparison = createComparison(
      'file-upload',
      baseline,
      fileUploadBaselineFixture({ revision: 'after-revision' }),
    );
    const comparisonDirectory = join(fixture, 'comparisons', 'file-upload');
    const comparisonPaths = {
      comparisonJson: join(comparisonDirectory, 'after-revision.json'),
      comparisonMarkdown: join(comparisonDirectory, 'after-revision.md'),
    };
    await writeComparisonArtifacts(comparison, comparisonPaths);
    writeFileSync(
      join(fixture, 'current.json'),
      `${JSON.stringify({ schemaVersion: 1, fileUpload: { revision: 'after-revision' } }, null, 2)}\n`,
    );

    const accepted = await resolveBaselineReference({
      ...baselinePaths,
      currentJson: join(fixture, 'current.json'),
      comparisonDirectory: join(fixture, 'comparisons'),
    });
    assert.equal(accepted.revision, 'after-revision');
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('acceptance rejects unrelated dirt, missing peers, revision mismatch, and ambiguity', async () => {
  const fixture = mkdtempSync(join(tmpdir(), 'lyra-accept-test-'));
  try {
    const revision = 'after-revision';
    const comparisonDirectory = join(fixture, 'comparisons', 'file-upload');
    mkdirSync(comparisonDirectory, { recursive: true });
    const paths = {
      comparisonDirectory: join(fixture, 'comparisons'),
      currentJson: join(fixture, 'current.json'),
    };

    for (const [dirty, message] of [
      [[`?? comparisons/file-upload/${revision}.json`, ' M package.json'], /unrelated dirty path/],
      [[`?? comparisons/file-upload/${revision}.json`], /exactly four canonical peers/],
    ]) {
      await assert.rejects(
        () =>
          acceptComparison('file-upload', {
            ...paths,
            headRevision: revision,
            dirtyPaths: dirty,
            repositoryRelativeComparisonDirectory: 'comparisons/file-upload',
          }),
        message,
      );
    }

    const comparison = createComparison(
      'file-upload',
      fileUploadBaselineFixture(),
      fileUploadBaselineFixture({ revision: 'different-revision' }),
    );
    await writeComparisonArtifacts(comparison, {
      comparisonJson: join(comparisonDirectory, `${revision}.json`),
      comparisonMarkdown: join(comparisonDirectory, `${revision}.md`),
    });
    writeFileSync(join(comparisonDirectory, `${revision}-runtime.json`), '{}\n');
    writeFileSync(join(comparisonDirectory, `${revision}-runtime.md`), 'runtime\n');
    const canonicalDirty = [
      `?? comparisons/file-upload/${revision}.json`,
      `?? comparisons/file-upload/${revision}.md`,
      `?? comparisons/file-upload/${revision}-runtime.json`,
      `?? comparisons/file-upload/${revision}-runtime.md`,
    ];
    await assert.rejects(
      () =>
        acceptComparison('file-upload', {
          ...paths,
          headRevision: revision,
          dirtyPaths: canonicalDirty,
          repositoryRelativeComparisonDirectory: 'comparisons/file-upload',
        }),
      /revision does not match HEAD/,
    );

    writeFileSync(join(comparisonDirectory, 'another.json'), '{}\n');
    await assert.rejects(
      () =>
        acceptComparison('file-upload', {
          ...paths,
          headRevision: revision,
          dirtyPaths: [...canonicalDirty, '?? comparisons/file-upload/another.json'],
          repositoryRelativeComparisonDirectory: 'comparisons/file-upload',
        }),
      /ambiguous|unrelated dirty path/,
    );
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('acceptance rejects runtime peers packed from different React or Styles artifacts', async () => {
  const fixture = mkdtempSync(join(tmpdir(), 'lyra-accept-artifact-test-'));
  try {
    const revision = 'after-revision';
    const dirtyPaths = [
      `?? comparisons/file-upload/${revision}.json`,
      `?? comparisons/file-upload/${revision}.md`,
      `?? comparisons/file-upload/${revision}-runtime.json`,
      `?? comparisons/file-upload/${revision}-runtime.md`,
    ];
    for (const [name, runtime, message] of [
      [
        'styles',
        runtimeEvidenceFixture({ stylesSha: 'different-styles-tarball' }),
        /packed Styles artifact mismatch/,
      ],
      [
        'react',
        runtimeEvidenceFixture({ reactSha: 'different-react-tarball' }),
        /packed React artifact mismatch/,
      ],
    ]) {
      const caseRoot = join(fixture, name);
      const comparisonDirectory = join(caseRoot, 'comparisons', 'file-upload');
      const currentJson = join(caseRoot, 'current.json');
      const comparison = createComparison(
        'file-upload',
        fileUploadBaselineFixture(),
        fileUploadBaselineFixture({ revision }),
      );
      await writeComparisonArtifacts(comparison, {
        comparisonJson: join(comparisonDirectory, `${revision}.json`),
        comparisonMarkdown: join(comparisonDirectory, `${revision}.md`),
      });
      await writeRuntimeArtifacts(runtime, {
        runtimeJson: join(comparisonDirectory, `${revision}-runtime.json`),
        runtimeMarkdown: join(comparisonDirectory, `${revision}-runtime.md`),
      });

      await assert.rejects(
        () =>
          acceptComparison('file-upload', {
            comparisonDirectory: join(caseRoot, 'comparisons'),
            currentJson,
            dirtyPaths,
            headRevision: revision,
            repositoryRelativeComparisonDirectory: 'comparisons/file-upload',
          }),
        message,
      );
      assert.equal(existsSync(currentJson), false);
    }
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('compareBaseline ignores operating-system release evidence alone', () => {
  const expected = baselineFixture();
  const actual = structuredClone(expected);
  actual.environment.operatingSystem = 'linux 6.11.0-1018-azure Ubuntu';

  assert.doesNotThrow(() => compareBaseline(expected, actual));
});

test('compareBaseline retains the historical packed-artifact metadata order', () => {
  const expected = budgetReferenceFixture();
  const actual = structuredClone(expected);
  actual.environment.packages = Object.fromEntries(
    Object.entries(expected.environment.packages).map(([name, artifact]) => [
      name,
      { version: artifact.version, tarball: artifact.tarball, sha256: artifact.sha256 },
    ]),
  );

  assert.deepEqual(Object.keys(actual.environment.packages['@lyra-ds/react']), [
    'version',
    'tarball',
    'sha256',
  ]);
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

test('bundle CLI --check-budgets returns the native budget result without writing evidence', async () => {
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
    currentJson: join(baselineRoot, 'current.json'),
    comparisonDirectory: join(baselineRoot, 'comparisons'),
  };
  const originalPointer = readFileSync(paths.currentJson, 'utf8');
  const originalBaseline = readFileSync(paths.baselineJson, 'utf8');

  const report = await runBundleBaselineCli(['--check-budgets'], {
    paths,
    collect: async ({ exactCommand }) => {
      const candidate = approvedBudgetCandidate();
      assert.equal(exactCommand, 'pnpm baseline:bundles --check-budgets');
      return candidate;
    },
  });

  assert.equal(report.kind, 'bundle-budget');
  assert.equal(report.result, 'pass');
  assert.equal(report.candidateRevision, approvedBudgetCandidate().revision);
  assert.equal(report.environment.fixture.sourceSha256, APPROVED_FIXTURE_SOURCE_SHA256);
  assert.deepEqual(report.environment.brotli, { mode: 'text', quality: 11 });
  assert.equal(report.externals[0], 'react');
  assert.equal(report.entries.react.length + report.entries.alpine.length, 72);
  assert.ok(Array.isArray(report.entries.react[0].modules.after));
  assert.equal(readFileSync(paths.currentJson, 'utf8'), originalPointer);
  assert.equal(readFileSync(paths.baselineJson, 'utf8'), originalBaseline);
});

test('bundle CLI reads a candidate ledger only for the budget gate', async () => {
  const fixture = mkdtempSync(join(tmpdir(), 'lyra-candidate-ledger-'));
  const measured = approvedBudgetCandidate();
  const ledgerJson = join(fixture, 'program.json');
  writeFileSync(
    ledgerJson,
    `${JSON.stringify(
      {
        schemaVersion: 2,
        releaseStatus: 'candidate',
        candidate: ledgerCandidateFor(measured),
      },
      null,
      2,
    )}\n`,
  );
  try {
    const report = await runBundleBaselineCli(['--check-budgets'], {
      paths: { ledgerJson },
      collect: async () => measured,
      isAncestorOfHead: () => true,
    });
    assert.equal(report.candidateBinding.result, 'pass');
    assert.deepEqual(Object.keys(report.candidateBinding.packages), ['styles', 'react', 'alpine']);
    await assert.rejects(
      runBundleBaselineCli(['--check-budgets'], {
        paths: { ledgerJson },
        collect: async () => measured,
        isAncestorOfHead: () => false,
      }),
      /candidate sourceRevision is not an ancestor of HEAD/,
    );
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

test('measureScenario is independent of the invoking working-directory depth', async () => {
  const fixture = mkdtempSync(join(tmpdir(), 'lyra-bundle-cwd-'));
  const entry = join(fixture, 'entry.ts');
  writeFileSync(entry, 'export const value = 1;\n');
  const originalWorkingDirectory = process.cwd();

  try {
    process.chdir('/');
    const fromRoot = await measureScenario({ entry, root: fixture });
    process.chdir(originalWorkingDirectory);
    const fromRepository = await measureScenario({ entry, root: fixture });

    assert.deepEqual(fromRoot, fromRepository);
  } finally {
    process.chdir(originalWorkingDirectory);
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
    const packed = spawnSync(
      process.platform === 'win32' ? 'npm.cmd' : 'npm',
      [
        'pack',
        process.platform === 'win32'
          ? `--pack-destination="${packDirectory}"`
          : '--pack-destination',
        ...(process.platform === 'win32' ? [] : [packDirectory]),
      ],
      {
        cwd: packageDirectory,
        encoding: 'utf8',
        env: { ...process.env, npm_config_cache: join(fixture, 'npm-cache') },
        shell: process.platform === 'win32',
      },
    );
    assert.equal(packed.status, 0, packed.stderr);
    const tarball = join(packDirectory, readdirSync(packDirectory)[0]);

    const artifacts = installPackedArtifacts(fixture, { react: tarball });
    assert.deepEqual(Object.keys(artifacts['@lyra-ds/react']), ['version', 'tarball', 'sha256']);

    const installed = join(fixture, 'node_modules', '@lyra-ds', 'react');
    assert.equal(
      JSON.parse(readFileSync(join(installed, 'package.json'), 'utf8')).version,
      '9.9.9',
    );
    assert.match(readFileSync(join(installed, 'index.js'), 'utf8'), /artifactMarker = 'changed'/);
    writeFileSync(tarball, `${readFileSync(tarball)}mutated`);
    assert.throws(
      () => installPackedArtifacts(fixture, { react: tarball }, { expectedArtifacts: artifacts }),
      /tarball identity does not match the archive selected for measurement/,
    );
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
