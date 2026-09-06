import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { copyFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { promisify } from 'node:util';

import { BEHAVIORAL_EXTERNAL_ARTIFACTS } from './candidates/catalog.mjs';
import { MODAL_WAVE_CELLS } from './contracts/modal.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const immutableCheckoutObjects = Object.freeze({
  '.github/workflows': 'ce01db38c96a8dfcf78b2737258ef6d653121355',
  'docs/superpowers/baselines/lyra-v1/program.json': '0765f0339c2e11e0c18e1b9ae67ad3296877f91f',
  packages: '62f0c9bad9608f67c380ed45f862fd4eee53809e',
  'pnpm-lock.yaml': '9a5a4470cfd63f3b9c2db2a86112e445cf0f5245',
});
const rootDependencySnapshot = Object.freeze({
  devDependencies: {
    '@arethetypeswrong/cli': '0.18.5',
    '@changesets/changelog-github': '0.7.0',
    '@changesets/cli': '2.31.1',
    '@size-limit/preset-small-lib': '12.1.0',
    '@types/react': '19.2.18',
    '@types/react-dom': '19.2.4',
    '@vitest/browser-playwright': '4.1.10',
    'axe-core': '4.13.0',
    eslint: '10.8.1',
    'eslint-plugin-jsx-a11y': '6.10.2',
    'eslint-plugin-react-hooks': '7.1.1',
    playwright: '1.62.1',
    prettier: '3.9.6',
    publint: '0.3.23',
    react: '19.2.8',
    'react-dom': '19.2.8',
    'size-limit': '12.1.0',
    stylelint: '17.14.1',
    'stylelint-config-standard': '40.0.0',
    tsdown: '0.22.14',
    typescript: '5.9.3',
    'typescript-eslint': '8.66.0',
    vite: '8.2.1',
    vitest: '4.1.10',
    'vitest-browser-react': '2.2.0',
    wrangler: '4.120.0',
    yaml: '2.9.0',
  },
});
const modalScripts = Object.freeze({
  'overlay:evaluate:modal:test':
    'node --test tools/overlay-foundation-evaluation/contracts/modal.test.mjs tools/overlay-foundation-evaluation/fixtures/modal/*.test.mjs tools/overlay-foundation-evaluation/candidates/modal/*.test.mjs tools/overlay-foundation-evaluation/runner/modal*.test.mjs tools/overlay-foundation-evaluation/scripts/create-modal-manifest.test.mjs tools/overlay-foundation-evaluation/scripts/modal.test.mjs',
  'overlay:evaluate:modal:manifest':
    'node tools/overlay-foundation-evaluation/scripts/create-modal-manifest.mjs',
  'overlay:evaluate:modal': 'node tools/overlay-foundation-evaluation/scripts/modal.mjs',
});
const wave2Scripts = Object.freeze({
  'overlay:evaluate:wave2:test':
    'node --test tools/overlay-foundation-evaluation/contracts/anchored.test.mjs tools/overlay-foundation-evaluation/contracts/menu.test.mjs tools/overlay-foundation-evaluation/contracts/tooltip.test.mjs tools/overlay-foundation-evaluation/contracts/wave2.test.mjs tools/overlay-foundation-evaluation/fixtures/shared/*.test.mjs tools/overlay-foundation-evaluation/fixtures/wave2/*.test.mjs tools/overlay-foundation-evaluation/candidates/anchored/*.test.mjs tools/overlay-foundation-evaluation/candidates/menu/*.test.mjs tools/overlay-foundation-evaluation/candidates/tooltip/*.test.mjs tools/overlay-foundation-evaluation/runner/wave2*.test.mjs tools/overlay-foundation-evaluation/scripts/create-behavioral-manifest.test.mjs tools/overlay-foundation-evaluation/scripts/registry-proxy.test.mjs tools/overlay-foundation-evaluation/scripts/wave2.test.mjs tools/overlay-foundation-evaluation/scripts/wave2-automation.test.mjs tools/overlay-foundation-evaluation/scripts/wave2-command.test.mjs tools/overlay-foundation-evaluation/scripts/characterize-linux.test.mjs',
  'overlay:evaluate:behavioral:manifest':
    'node tools/overlay-foundation-evaluation/scripts/create-behavioral-manifest.mjs',
  'overlay:evaluate:wave2': 'node tools/overlay-foundation-evaluation/scripts/wave2.mjs',
  'overlay:evaluate:wave2:auto':
    'node tools/overlay-foundation-evaluation/scripts/wave2-automation.mjs',
});
const incumbentArtifacts = Object.freeze([
  Object.freeze({ source: 'workspace-pack', name: '@lyra-ds/styles', version: '0.5.0' }),
  Object.freeze({ source: 'workspace-pack', name: '@lyra-ds/react', version: '0.5.0' }),
  Object.freeze({ source: 'workspace-pack', name: '@lyra-ds/alpine', version: '0.6.0' }),
]);
const overlayComponentIds = new Set([
  'dialog',
  'drawer',
  'bottom-sheet',
  'popover',
  'dropdown',
  'tooltip',
  'command-palette',
  'workspace-switcher',
  'create-workspace-dialog',
]);
const decisionEvidenceCells = Object.freeze([
  'bundle-standalone',
  'bundle-composition',
  'packed-esm',
  'packed-cjs',
  'packed-types',
  'consumer-vite',
  'consumer-next',
  'consumer-commonjs',
]);
const threatModelDocuments = [
  'docs/superpowers/specs/2026-08-31-overlay-foundation-evaluation-design.md',
  'tools/overlay-foundation-evaluation/README.md',
];
const threatModelClauses = [
  'Hostile archives, pre-existing symlinks and path replacements, observed identity or containment changes, and uncertain cleanup are in scope and MUST fail closed.',
  'A non-cooperating same-UID process concurrently renaming already-open evidence directories is out of scope.',
  'The harness makes no namespace-isolation claim.',
  'If this boundary changes, a Linux-native namespace/openat2 design MUST be adopted before external candidates are executed.',
];
const execFilePromise = promisify(execFile);
const repositoryGitConfig = ['-c', `safe.directory=${repositoryRoot}`];

async function documentedPnpmCommand(scriptName) {
  const readme = await readFile(
    resolve(repositoryRoot, 'tools/overlay-foundation-evaluation/README.md'),
    'utf8',
  );
  const line = readme.split('\n').find((value) => value.startsWith(`\`pnpm ${scriptName}`));
  assert.notEqual(line, undefined);
  return line.slice(1, line.indexOf('`', 1)).split(' ');
}

async function runRejectedPnpm(args) {
  assert.equal((await execFilePromise('pnpm', ['--version'])).stdout.trim(), '11.13.1');
  try {
    await execFilePromise('pnpm', args, { cwd: repositoryRoot });
  } catch (error) {
    return `${error.stdout ?? ''}${error.stderr ?? ''}`;
  }
  assert.fail(`pnpm ${args.join(' ')} unexpectedly succeeded`);
}

test('wires core and modal commands without putting the live diagnostic in ordinary tests', async () => {
  const rootPackage = JSON.parse(await readFile(resolve(repositoryRoot, 'package.json'), 'utf8'));
  assert.equal(
    rootPackage.scripts['overlay:evaluate:core:test'],
    'node --test tools/overlay-foundation-evaluation/*.test.mjs tools/overlay-foundation-evaluation/*/*.test.mjs',
  );
  assert.equal(
    rootPackage.scripts['overlay:evaluate:check'],
    'node tools/overlay-foundation-evaluation/scripts/check.mjs',
  );
  assert.equal(
    rootPackage.scripts['overlay:evaluate:incumbent'],
    'node tools/overlay-foundation-evaluation/scripts/incumbent.mjs',
  );
  for (const [name, command] of Object.entries({ ...modalScripts, ...wave2Scripts })) {
    assert.equal(rootPackage.scripts[name], command);
  }
  assert.match(rootPackage.scripts.test, /pnpm overlay:evaluate:core:test/u);
  assert.doesNotMatch(
    rootPackage.scripts.test,
    /pnpm overlay:evaluate:(?:modal|wave2)(?::auto)?(?:\s|$)/u,
  );
  assert.doesNotMatch(rootPackage.scripts.test, /docker|wave2(?:-automation)?\.mjs/u);
});

test('keeps dependencies, lockfile, packages, workflows, and the V1 ledger immutable', async () => {
  const rootPackage = JSON.parse(await readFile(resolve(repositoryRoot, 'package.json'), 'utf8'));
  const currentDependencies = Object.fromEntries(
    ['dependencies', 'devDependencies', 'optionalDependencies']
      .filter((section) => rootPackage[section] !== undefined)
      .map((section) => [section, rootPackage[section]]),
  );
  assert.deepEqual(currentDependencies, rootDependencySnapshot);

  await execFilePromise(
    'git',
    [
      ...repositoryGitConfig,
      'diff',
      '--exit-code',
      'HEAD',
      '--',
      ...Object.keys(immutableCheckoutObjects),
    ],
    { cwd: repositoryRoot },
  );
  for (const [path, expectedObject] of Object.entries(immutableCheckoutObjects)) {
    const { stdout } = await execFilePromise(
      'git',
      [...repositoryGitConfig, 'rev-parse', `HEAD:${path}`],
      { cwd: repositoryRoot },
    );
    assert.equal(stdout.trim(), expectedObject, `${path} must match its checkout snapshot`);
  }

  const program = JSON.parse(
    await readFile(
      resolve(repositoryRoot, 'docs/superpowers/baselines/lyra-v1/program.json'),
      'utf8',
    ),
  );
  const overlays = program.components.filter(({ id }) => overlayComponentIds.has(id));
  assert.equal(overlays.length, overlayComponentIds.size);
  assert.equal(
    overlays.every(({ implementationStatus }) =>
      ['specified', 'planned'].includes(implementationStatus),
    ),
    true,
  );
});

test(
  'checks immutable checkout snapshots in a one-commit shallow clone',
  { skip: process.env.OVERLAY_POLICY_SHALLOW_PROBE === '1' },
  async (t) => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'overlay-policy-shallow-'));
    t.after(() => rm(temporaryRoot, { recursive: true }));
    const shallowRoot = join(temporaryRoot, 'repository');
    await execFilePromise(
      'git',
      ['clone', '--quiet', '--depth', '1', '--no-local', repositoryRoot, shallowRoot],
      { cwd: temporaryRoot },
    );
    assert.equal(
      (
        await execFilePromise('git', ['rev-list', '--count', 'HEAD'], { cwd: shallowRoot })
      ).stdout.trim(),
      '1',
    );
    await copyFile(
      resolve(repositoryRoot, 'tools/overlay-foundation-evaluation/repository-policy.test.mjs'),
      resolve(shallowRoot, 'tools/overlay-foundation-evaluation/repository-policy.test.mjs'),
    );
    const childEnvironment = { ...process.env, OVERLAY_POLICY_SHALLOW_PROBE: '1' };
    delete childEnvironment.NODE_TEST_CONTEXT;

    const { stdout } = await execFilePromise(
      process.execPath,
      [
        '--test',
        '--test-name-pattern=keeps dependencies, lockfile, packages, workflows, and the V1 ledger immutable',
        'tools/overlay-foundation-evaluation/repository-policy.test.mjs',
      ],
      {
        cwd: shallowRoot,
        env: childEnvironment,
      },
    );
    assert.match(stdout, /pass 1\b/u);
  },
);

test('tracks the four exact behavioral candidate records without selection metadata', async () => {
  const manifest = JSON.parse(
    await readFile(
      resolve(repositoryRoot, 'tools/overlay-foundation-evaluation/candidates.json'),
      'utf8',
    ),
  );
  assert.deepEqual(Object.keys(manifest).sort(), [
    'candidates',
    'lyraRevision',
    'schemaVersion',
    'toolchain',
  ]);
  assert.equal(manifest.schemaVersion, 1);
  assert.match(manifest.lyraRevision, /^[a-f0-9]{40}$/u);
  assert.deepEqual(manifest.toolchain, { node: '24.18.0', pnpm: '11.13.1' });
  assert.deepEqual(
    manifest.candidates.map(({ id }) => id),
    ['incumbent', 'radix', 'base-ui', 'zag'],
  );

  const [incumbent, ...external] = manifest.candidates;
  assert.deepEqual(
    {
      ...incumbent,
      artifacts: incumbent.artifacts.map(({ sha256: ignoredSha256, ...artifact }) => artifact),
    },
    {
      id: 'incumbent',
      adapter: 'candidates/incumbent.mjs',
      contracts: ['OF-MODAL', 'OF-ANCHORED', 'OF-MENU', 'OF-TOOLTIP'],
      revision: manifest.lyraRevision,
      artifacts: incumbentArtifacts,
    },
  );
  assert.equal(incumbent.revision, manifest.lyraRevision);
  for (const artifact of incumbent.artifacts) assert.match(artifact.sha256, /^[a-f0-9]{64}$/u);
  for (const candidate of external) {
    assert.deepEqual(candidate, {
      id: candidate.id,
      adapter: `candidates/${candidate.id}.mjs`,
      contracts: ['OF-MODAL', 'OF-ANCHORED', 'OF-MENU', 'OF-TOOLTIP'],
      artifacts: structuredClone(BEHAVIORAL_EXTERNAL_ARTIFACTS[candidate.id]),
    });
  }

  const serializedKeys = [];
  JSON.stringify(manifest, (key, value) => {
    serializedKeys.push(key.toLowerCase());
    return value;
  });
  for (const forbidden of ['winner', 'score', 'selected', 'recommendation']) {
    assert.equal(serializedKeys.includes(forbidden), false);
  }
});

test('documents the cumulative local diagnostic boundary', async () => {
  const documents = await Promise.all(
    [
      'tools/overlay-foundation-evaluation/README.md',
      'docs/superpowers/baselines/lyra-v1/README.md',
    ].map((path) => readFile(resolve(repositoryRoot, path), 'utf8')),
  );
  const combined = documents.join('\n');
  for (const cell of MODAL_WAVE_CELLS) assert.match(combined, new RegExp(`\\b${cell}\\b`, 'u'));
  for (const cell of decisionEvidenceCells) {
    assert.match(combined, new RegExp(`\\b${cell}\\b`, 'u'));
  }
  for (const artifacts of Object.values(BEHAVIORAL_EXTERNAL_ARTIFACTS)) {
    for (const artifact of artifacts) {
      for (const fact of Object.values(artifact)) assert.ok(combined.includes(String(fact)));
    }
  }
  for (const required of [
    'OF-ANCHORED',
    'OF-MENU',
    'OF-TOOLTIP',
    '11 anchored',
    '14 menu',
    '13 tooltip',
    'overlay:evaluate:wave2:auto',
    'pre-manifest revision',
    'external manifest',
    'external evidence',
    'attempt 1',
    'local diagnostic',
    'does not authorize production use',
    'mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e',
    'OVERLAY_NODE_ROOT',
    'OVERLAY_INPUT_ROOT',
    'OVERLAY_EVIDENCE_ROOT',
    'OVERLAY_OWNED_WORK_ROOT',
    'OVERLAY_EVALUATION_REVISION',
  ]) {
    assert.ok(combined.includes(required), `documentation must retain: ${required}`);
  }
});

test('keeps executable plan snippets aligned with the implemented core protocol', async () => {
  const plan = await readFile(
    resolve(
      repositoryRoot,
      'docs/superpowers/plans/2026-08-31-overlay-foundation-core-protocol.md',
    ),
    'utf8',
  );

  assert.match(plan, /await mkdir\(destinationRoot, \{ recursive: true, mode: 0o700 \}\);/u);
  assert.match(plan, /'attempts',\s+attempt\.runId,\s+attempt\.recordType,/u);
  assert.match(plan, /attempt\.recordType === 'scenario'/u);
  assert.match(
    plan,
    /const x=p\.components\.filter\(c=>\['dialog','drawer','bottom-sheet','popover','dropdown','tooltip','command-palette','workspace-switcher','create-workspace-dialog'\]\.includes\(c\.id\)\)/u,
  );
});

for (const documentPath of threatModelDocuments) {
  test(`pins the fail-closed filesystem threat boundary in ${documentPath}`, async () => {
    const document = await readFile(resolve(repositoryRoot, documentPath), 'utf8');
    const normalizedDocument = document.replace(/\s+/gu, ' ');
    for (const clause of threatModelClauses) {
      assert.ok(normalizedDocument.includes(clause), `${documentPath} must retain: ${clause}`);
    }
  });
}

test('forwards a documented manifest path through pnpm to the checker', async () => {
  const command = await documentedPnpmCommand('overlay:evaluate:check');
  assert.deepEqual(command, ['pnpm', 'overlay:evaluate:check', '--manifest', '<path>']);
  const manifestPath = resolve(
    repositoryRoot,
    'tools/overlay-foundation-evaluation/missing-forwarding-manifest.json',
  );

  const output = await runRejectedPnpm([command[1], command[2], manifestPath]);

  assert.doesNotMatch(output, /usage: check\.mjs/u);
  assert.match(output, /ENOENT|no such file or directory/u);
});

test('forwards a documented output path through pnpm before incumbent build', async (t) => {
  const command = await documentedPnpmCommand('overlay:evaluate:incumbent');
  assert.deepEqual(command, ['pnpm', 'overlay:evaluate:incumbent', '--output', '<path>']);
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'overlay-root-forwarding-'));
  t.after(() => rm(temporaryRoot, { recursive: true }));
  const outputPath = join(temporaryRoot, 'incumbent.json');
  await writeFile(outputPath, 'existing output\n');

  const output = await runRejectedPnpm([command[1], command[2], outputPath]);

  assert.doesNotMatch(output, /usage: incumbent\.mjs/u);
  assert.match(output, /output path must not exist/u);
});
