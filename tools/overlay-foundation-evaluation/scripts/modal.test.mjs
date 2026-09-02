import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { parse as parseYaml } from 'yaml';

import { createModalManifest } from './create-modal-manifest.mjs';

const modulePath = new URL('./modal.mjs', import.meta.url);
const revision = '1'.repeat(40);

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'lyra-modal-cli-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const repositoryRoot = join(root, 'repository');
  const evidenceRoot = join(root, 'evidence');
  const manifestPath = join(root, 'candidates.json');
  await mkdir(join(repositoryRoot, 'tools', 'overlay-foundation-evaluation', 'candidates'), {
    recursive: true,
  });
  await mkdir(evidenceRoot);
  await writeFile(join(repositoryRoot, '.nvmrc'), '24.18.0\n');
  await writeFile(
    join(repositoryRoot, 'package.json'),
    JSON.stringify({ packageManager: 'pnpm@11.13.1' }),
  );
  for (const id of ['incumbent', 'radix', 'base-ui', 'zag']) {
    await writeFile(
      join(repositoryRoot, 'tools', 'overlay-foundation-evaluation', 'candidates', `${id}.mjs`),
      'export const unused = true;\n',
    );
  }
  const manifest = createModalManifest({
    lyraRevision: revision,
    incumbentCharacterization: {
      schemaVersion: 1,
      candidateId: 'incumbent',
      revision,
      artifacts: [
        { name: '@lyra-ds/styles', version: '0.5.0', sha256: '2'.repeat(64) },
        { name: '@lyra-ds/react', version: '0.5.0', sha256: '3'.repeat(64) },
        { name: '@lyra-ds/alpine', version: '0.6.0', sha256: '4'.repeat(64) },
      ],
    },
  });
  await writeFile(manifestPath, `${JSON.stringify(manifest)}\n`);
  return { evidenceRoot, manifest, manifestPath, repositoryRoot, root };
}

function argv(setup) {
  return [
    '--manifest',
    setup.manifestPath,
    '--repository',
    setup.repositoryRoot,
    '--evidence',
    setup.evidenceRoot,
  ];
}

function dependencies(setup, overrides = {}) {
  const calls = [];
  return {
    calls,
    async runCommand(command, args) {
      calls.push([command, ...args]);
      if (args[0] === 'status') return { stdout: overrides.status ?? '' };
      if (args[0] === 'rev-parse') return { stdout: `${overrides.revision ?? revision}\n` };
      throw new Error(`unexpected command ${command} ${args.join(' ')}`);
    },
    async importPlaywright() {
      calls.push(['import', 'playwright']);
      return { chromium: {}, firefox: {}, webkit: {} };
    },
    ...(overrides.inspectModalEvidence === undefined
      ? {}
      : {
          async inspectModalEvidence(input) {
            calls.push(['inspect-evidence', input.manifest.lyraRevision]);
            return overrides.inspectModalEvidence(input);
          },
        }),
    async runModalWave(input) {
      calls.push(['run-wave', input.repositoryRoot, input.resume]);
      return {
        schemaVersion: 1,
        runId: 'modal-111111111111',
        candidates: [
          { candidateId: 'incumbent', counts: { PASS: 1, FAIL: 0, unavailable: 0 }, retries: 0 },
        ],
      };
    },
  };
}

test('imports without loading Playwright and loads it only after strict validation', async (t) => {
  const setup = await fixture(t);
  const module = await import(modulePath);
  const deps = dependencies(setup);
  assert.deepEqual(deps.calls, []);
  const summary = await module.runModalCli({ argv: argv(setup), ...deps });
  assert.equal(summary.runId, 'modal-111111111111');
  assert.equal(
    deps.calls.findIndex((call) => call[0] === 'import'),
    2,
  );
  assert.equal(deps.calls.at(-1)[0], 'run-wave');
});

for (const [name, mutate, expected] of [
  ['relative manifest', (args) => args.with(1, 'relative.json'), /manifest path must be absolute/u],
  [
    'relative repository',
    (args) => args.with(3, 'repository'),
    /repository path must be absolute/u,
  ],
  ['relative evidence', (args) => args.with(5, 'evidence'), /evidence path must be absolute/u],
  ['missing argument', (args) => args.slice(0, -2), /usage: modal\.mjs/u],
  ['missing value', (args) => args.slice(0, -1), /usage: modal\.mjs/u],
  ['duplicate argument', (args) => [...args, '--manifest', args[1]], /usage: modal\.mjs/u],
  ['unknown argument', (args) => [...args, '--unknown', '/absolute'], /usage: modal\.mjs/u],
]) {
  test(`rejects ${name} before importing Playwright`, async (t) => {
    const setup = await fixture(t);
    const { runModalCli } = await import(modulePath);
    const deps = dependencies(setup);
    await assert.rejects(runModalCli({ argv: mutate(argv(setup)), ...deps }), expected);
    assert.equal(
      deps.calls.some((call) => call[0] === 'import'),
      false,
    );
  });
}

test('rejects dirty and wrong-revision repositories before importing Playwright', async (t) => {
  const setup = await fixture(t);
  const { runModalCli } = await import(modulePath);
  for (const [overrides, expected] of [
    [{ status: ' M tracked\n' }, /clean worktree/u],
    [{ revision: 'a'.repeat(40) }, /revision must equal manifest/u],
  ]) {
    const deps = dependencies(setup, overrides);
    await assert.rejects(runModalCli({ argv: argv(setup), ...deps }), expected);
    assert.equal(
      deps.calls.some((call) => call[0] === 'import'),
      false,
    );
  }
});

test('rejects manifest revision mismatch, BOM, and malformed JSON before importing Playwright', async (t) => {
  const setup = await fixture(t);
  const { runModalCli } = await import(modulePath);
  const cases = [
    {
      bytes: `${JSON.stringify({ ...setup.manifest, candidates: setup.manifest.candidates.map((candidate, index) => (index === 0 ? { ...candidate, revision: 'a'.repeat(40) } : candidate)) })}\n`,
      expected: /incumbent revision must equal manifest/u,
    },
    { bytes: `\uFEFF${JSON.stringify(setup.manifest)}`, expected: /must not contain a BOM/u },
    { bytes: '{not json', expected: /valid JSON|Unexpected token/iu },
  ];
  for (const { bytes, expected } of cases) {
    await writeFile(setup.manifestPath, bytes);
    const deps = dependencies(setup);
    await assert.rejects(runModalCli({ argv: argv(setup), ...deps }), expected);
    assert.equal(
      deps.calls.some((call) => call[0] === 'import'),
      false,
    );
  }
});

test('rejects an existing conflicting evidence attempt before importing Playwright', async (t) => {
  const setup = await fixture(t);
  const conflict = join(
    setup.evidenceRoot,
    'attempts',
    `core-${revision.slice(0, 12)}`,
    'preflight',
    'incumbent',
    'artifact',
  );
  await mkdir(conflict, { recursive: true });
  await writeFile(join(conflict, 'attempt-1.json'), '{}\n');
  const { runModalCli } = await import(modulePath);
  const deps = dependencies(setup);
  await assert.rejects(
    runModalCli({ argv: argv(setup), ...deps }),
    /conflicting evidence attempt/u,
  );
  assert.equal(
    deps.calls.some((call) => call[0] === 'import'),
    false,
  );
});

test('validated resume reaches the wave before Playwright without rerunning core in the CLI', async (t) => {
  const setup = await fixture(t);
  const { runModalCli } = await import(modulePath);
  const deps = dependencies(setup, {
    inspectModalEvidence: async () => ({ resume: true }),
  });
  await runModalCli({ argv: argv(setup), ...deps });
  assert.equal(
    deps.calls.findIndex(([name]) => name === 'inspect-evidence') <
      deps.calls.findIndex(([name]) => name === 'import'),
    true,
  );
  assert.equal(deps.calls.at(-1)[2], true);
});

test('rejects a conflicting resume binding before importing Playwright', async (t) => {
  const setup = await fixture(t);
  const bindingRoot = join(setup.evidenceRoot, 'runs');
  await mkdir(bindingRoot);
  await writeFile(
    join(bindingRoot, `modal-${revision.slice(0, 12)}.json`),
    `${JSON.stringify({
      schemaVersion: 1,
      recordType: 'modal-run-binding',
      runId: `modal-${revision.slice(0, 12)}`,
      coreRunId: `core-${revision.slice(0, 12)}`,
      lyraRevision: revision,
      manifestSha256: 'a'.repeat(64),
    })}\n`,
  );
  const { runModalCli } = await import(modulePath);
  const deps = dependencies(setup);
  await assert.rejects(
    runModalCli({ argv: argv(setup), ...deps }),
    /binding|manifest.*conflict|conflicting evidence/iu,
  );
  assert.equal(
    deps.calls.some(([name]) => name === 'import'),
    false,
  );
});

test('pins an immutable least-privilege Compose service and exact local command', async () => {
  const composePath = new URL('../compose.modal.yml', import.meta.url);
  const source = await readFile(composePath, 'utf8');
  const compose = parseYaml(source);
  const service = compose.services.modal;
  assert.equal(
    service.image,
    'mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e',
  );
  assert.equal(service.init, true);
  assert.equal(service.ipc, 'host');
  assert.equal(service.user, '${UID:?Set UID with id -u}:${GID:?Set GID with id -g}');
  const mounts = Object.fromEntries(service.volumes.map((mount) => [mount.target, mount]));
  assert.equal(mounts['/opt/node'].read_only, true);
  assert.equal(mounts['/input'].read_only, true);
  assert.equal(mounts['/work'].read_only, undefined);
  assert.equal(mounts['/evidence'].read_only, undefined);
  assert.match(mounts['/work'].source, /OWNED.*WORK|WORK.*OWNED/u);
  const command = Array.isArray(service.command) ? service.command.join('\n') : service.command;
  for (const required of [
    'export PATH="/opt/node/bin:/tmp/corepack-shims:$PATH"',
    'corepack enable --install-directory /tmp/corepack-shims',
    'git clone --no-hardlinks /input/repository.bundle /work/repository',
    'git -C /work/repository checkout --detach "$OVERLAY_EVALUATION_REVISION"',
    'test "$(git -C /work/repository rev-parse HEAD)" = "$OVERLAY_EVALUATION_REVISION"',
    'corepack pnpm@11.13.1 install --frozen-lockfile',
    'OVERLAY_MODAL_REACT_BROWSER_TEST=1',
    'OVERLAY_BROWSER_CACHE_ROOT=/work/react-browser-cache',
    'node --test',
    'tools/overlay-foundation-evaluation/fixtures/modal/runtime.react-browser.test.mjs',
    'corepack pnpm@11.13.1 overlay:evaluate:modal',
    '--manifest /input/candidates.json',
    '--repository /work/repository',
    '--evidence /evidence',
  ]) {
    assert.match(command, new RegExp(required.replaceAll(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
  }
  assert.doesNotMatch(
    command,
    /playwright\s+install|install-deps|npm\s+(?:publish|pack)|https?:\/\//iu,
  );
  assert.doesNotMatch(source, /\/home\/(?![^\n]*tmp-builds)/u);
});
