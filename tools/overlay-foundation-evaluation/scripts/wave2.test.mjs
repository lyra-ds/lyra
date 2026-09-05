import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { parse as parseYaml } from 'yaml';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { createModalManifest } from './create-modal-manifest.mjs';

const modulePath = new URL('./wave2.mjs', import.meta.url);
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
  for (const candidate of manifest.candidates)
    candidate.contracts = ['OF-MODAL', 'OF-ANCHORED', 'OF-MENU', 'OF-TOOLTIP'];
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
    ...(overrides.inspectWave2Evidence === undefined
      ? {}
      : {
          async inspectWave2Evidence(input) {
            calls.push(['inspect-evidence', input.manifest.lyraRevision]);
            return overrides.inspectWave2Evidence(input);
          },
        }),
    async runWave2(input) {
      calls.push(['run-wave', input.repositoryRoot, input.resume]);
      return {
        schemaVersion: 1,
        runId: 'wave2-111111111111',
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
  const summary = await module.runWave2Cli({ argv: argv(setup), ...deps });
  assert.equal(summary.runId, 'wave2-111111111111');
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
  ['missing argument', (args) => args.slice(0, -2), /usage: wave2\.mjs/u],
  ['missing value', (args) => args.slice(0, -1), /usage: wave2\.mjs/u],
  ['duplicate argument', (args) => [...args, '--manifest', args[1]], /usage: wave2\.mjs/u],
  ['unknown argument', (args) => [...args, '--unknown', '/absolute'], /usage: wave2\.mjs/u],
]) {
  test(`rejects ${name} before importing Playwright`, async (t) => {
    const setup = await fixture(t);
    const { runWave2Cli } = await import(modulePath);
    const deps = dependencies(setup);
    await assert.rejects(runWave2Cli({ argv: mutate(argv(setup)), ...deps }), expected);
    assert.equal(
      deps.calls.some((call) => call[0] === 'import'),
      false,
    );
  });
}

test('rejects dirty and wrong-revision repositories before importing Playwright', async (t) => {
  const setup = await fixture(t);
  const { runWave2Cli } = await import(modulePath);
  for (const [overrides, expected] of [
    [{ status: ' M tracked\n' }, /clean worktree/u],
    [{ revision: 'a'.repeat(40) }, /revision must equal manifest/u],
  ]) {
    const deps = dependencies(setup, overrides);
    await assert.rejects(runWave2Cli({ argv: argv(setup), ...deps }), expected);
    assert.equal(
      deps.calls.some((call) => call[0] === 'import'),
      false,
    );
  }
});

test('rejects manifest revision mismatch, BOM, and malformed JSON before importing Playwright', async (t) => {
  const setup = await fixture(t);
  const { runWave2Cli } = await import(modulePath);
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
    await assert.rejects(runWave2Cli({ argv: argv(setup), ...deps }), expected);
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
  const { runWave2Cli } = await import(modulePath);
  const deps = dependencies(setup);
  await assert.rejects(runWave2Cli({ argv: argv(setup), ...deps }), /conflicting evidence/u);
  assert.equal(
    deps.calls.some((call) => call[0] === 'import'),
    false,
  );
});

test('validated resume reaches the wave before Playwright without rerunning core in the CLI', async (t) => {
  const setup = await fixture(t);
  const { runWave2Cli } = await import(modulePath);
  const deps = dependencies(setup, {
    inspectWave2Evidence: async () => ({ resume: true }),
  });
  await runWave2Cli({ argv: argv(setup), ...deps });
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
    join(bindingRoot, `wave2-${revision.slice(0, 12)}.json`),
    `${JSON.stringify({
      schemaVersion: 1,
      recordType: 'wave2-run-binding',
      runId: `wave2-${revision.slice(0, 12)}`,
      coreRunId: `core-${revision.slice(0, 12)}`,
      lyraRevision: revision,
      manifestSha256: 'a'.repeat(64),
    })}\n`,
  );
  const { runWave2Cli } = await import(modulePath);
  const deps = dependencies(setup);
  await assert.rejects(
    runWave2Cli({ argv: argv(setup), ...deps }),
    /binding|manifest.*conflict|conflicting evidence/iu,
  );
  assert.equal(
    deps.calls.some(([name]) => name === 'import'),
    false,
  );
});

test('compose pins image private IPC owned mounts and registry-only rendered topology', async () => {
  const path = new URL('../compose.wave2.yml', import.meta.url);
  const source = await readFile(path, 'utf8');
  const config = parseYaml(source),
    service = config.services.wave2,
    proxy = config.services['registry-proxy'];
  const image =
    'mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e';
  assert.equal(service.image, image);
  assert.equal(proxy.image, image);
  assert.equal(service.init, true);
  assert.equal(service.ipc, undefined);
  assert.equal(service.shm_size, '2gb');
  assert.equal(service.user, '${UID:?Set UID with id -u}:${GID:?Set GID with id -g}');
  assert.deepEqual(service.networks, ['wave2-internal']);
  assert.deepEqual(proxy.networks, ['wave2-internal', 'registry-egress']);
  assert.equal(config.networks['wave2-internal'].internal, true);
  assert.equal(config.networks['registry-egress'].driver, 'bridge');
  assert.equal(config.networks.default, undefined);
  const mounts = Object.fromEntries(service.volumes.map((m) => [m.target, m]));
  assert.equal(mounts['/opt/node'].read_only, true);
  assert.equal(mounts['/input'].read_only, true);
  assert.match(mounts['/work'].source, /OWNED_WORK/);
  assert.equal(service.volumes.length, 4);
  assert.equal(service.environment.NODE_USE_ENV_PROXY, '1');
  assert.equal(service.environment.HTTPS_PROXY, 'http://registry-proxy:3128');
  assert.equal(service.environment.NO_PROXY, '127.0.0.1,localhost');
  const shell = service.command.join('\n');
  assert.doesNotMatch(shell, /playwright\s+install|ipc.*host/);
  assert.ok(
    shell.indexOf('registry-proxy.mjs --preflight') < shell.indexOf('pnpm@11.13.1 install'),
  );
  assert.match(shell, /corepack pnpm@11\.13\.1 overlay:evaluate:wave2/);
  assert.match(shell, /corepack --version/);
  assert.match(proxy.command.join('\n'), /git clone --no-hardlinks/);
  assert.match(shell, /corepack enable --install-directory \/work\/corepack-shims/);
  for (const [name, path] of Object.entries({
    COREPACK_HOME: '/work/cache/corepack',
    XDG_CACHE_HOME: '/work/cache',
    XDG_DATA_HOME: '/work/data',
    XDG_CONFIG_HOME: '/work/config',
    PNPM_HOME: '/work/pnpm',
  }))
    assert.ok(shell.includes(`export ${name}=${path}`), `${name} is owned outside checkout`);
  assert.doesNotMatch(shell, /export HOME=|\/root\//);
  assert.match(shell, /mktemp -d \/tmp\/lyra-wave2-checkout-XXXXXX/);
  assert.match(shell, /owned_identity=/);
  assert.match(shell, /stat -c '%d:%i:%u'/);
  assert.match(shell, /rm -rf -- "\$\$owned"/);
  assert.match(shell, /trap .*EXIT/);
  assert.match(shell, /--repository "\$\$repository"/);
  assert.match(shell, /export pnpm_config_store_dir=\/work\/pnpm\/store/);
  assert.doesNotMatch(shell, /safe\.directory|chown|\/work\/repository/);
});
