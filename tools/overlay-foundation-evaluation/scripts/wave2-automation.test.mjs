import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  runWave2Automation,
  parseAutomationArguments,
  validateWaveSummary,
} from './wave2-automation.mjs';

test('automation accepts exactly one absolute new output argument', () => {
  assert.equal(parseAutomationArguments(['--output', '/private/tmp/new']), '/private/tmp/new');
  for (const argv of [
    [],
    ['--output', 'relative'],
    ['--output', '/x', '--force'],
    ['--output', '/x', '--output', '/y'],
    ['--unknown', '/x'],
  ])
    assert.throws(() => parseAutomationArguments(argv), /usage|absolute/);
});
test('automation rejects existing and symlinked output before commands', async (t) => {
  const root = await fs.mkdtemp('/private/tmp/wave2-auto-test-');
  t.after(() => fs.rm(root, { recursive: true }));
  await fs.symlink(root, join(root, 'link'));
  for (const path of [root, join(root, 'link'), join(root, 'link', 'new')]) {
    let commands = 0;
    await assert.rejects(
      runWave2Automation({
        argv: ['--output', path],
        runCommand: async () => {
          commands++;
        },
      }),
      /exist|canonical|symlink/,
    );
    assert.equal(commands, 0);
  }
});
test('automation rejects dirty repositories before Docker or output creation', async (t) => {
  const root = await fs.mkdtemp('/private/tmp/wave2-auto-test-');
  t.after(() => fs.rm(root, { recursive: true }));
  const calls = [];
  await assert.rejects(
    runWave2Automation({
      argv: ['--output', join(root, 'output')],
      runCommand: async (cmd, args) => {
        calls.push([cmd, args]);
        return { stdout: ' M changed\n' };
      },
    }),
    /clean/,
  );
  assert.equal(
    calls.some(([cmd]) => cmd === 'docker'),
    false,
  );
  await assert.rejects(fs.lstat(join(root, 'output')), { code: 'ENOENT' });
});
test('closed Wave2 summaries require exact tuple totals and reject selection metadata', () => {
  assert.throws(
    () =>
      validateWaveSummary(
        { schemaVersion: 1, runId: 'wave2-' + 'a'.repeat(12), candidates: [], winner: 'radix' },
        'a'.repeat(40),
      ),
    /summary/,
  );
});

import { canonicalJson } from '../evidence/results.mjs';
import { createBehavioralManifest } from './create-behavioral-manifest.mjs';
import { BROWSER_IMAGE, NODE_IMAGE } from './wave2-automation.mjs';
import { WAVE_2_CONTRACT_IDS, WAVE_2_SCENARIOS } from '../contracts/wave2.mjs';
import { createHash } from 'node:crypto';
const revision = 'a'.repeat(40),
  helper = 'b'.repeat(64),
  proxyId = 'c'.repeat(64);
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const successfulSummary = () => ({
  schemaVersion: 1,
  runId: 'wave2-' + revision.slice(0, 12),
  candidates: ['incumbent', 'radix', 'base-ui', 'zag'].map((candidateId) => ({
    candidateId,
    counts: { PASS: 0, FAIL: 164, unavailable: 0 },
    retries: 0,
    contracts: WAVE_2_CONTRACT_IDS.map((contractId) => ({
      contractId,
      counts: {
        PASS: 0,
        FAIL: WAVE_2_SCENARIOS.filter((s) => s.contractId === contractId).reduce(
          (a, s) => a + s.requiredCells.length,
          0,
        ),
        unavailable: 0,
      },
      retries: 0,
    })),
  })),
});
async function fixture(t, mutate = () => {}, filesystemOverrides = {}) {
  const root = await fs.mkdtemp('/private/tmp/wave2-auto-test-');
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const output = join(root, 'output'),
    calls = [];
  let config, env, project;
  const fake = async (cmd, args, options) => {
    calls.push({ cmd, args, options });
    env = options.env;
    project = env.OVERLAY_INPUT_ROOT ? undefined : project;
    const context = {
      cmd,
      args,
      options,
      output,
      calls,
      get config() {
        return config;
      },
    };
    const altered = await mutate(context);
    if (altered !== undefined) return altered;
    if (cmd === 'git')
      return {
        stdout:
          args[0] === 'status'
            ? ''
            : args[0] === 'rev-parse'
              ? revision
              : args[0] === 'bundle' && args[1] === 'list-heads'
                ? revision + ' HEAD\n'
                : args[0] === 'bundle' && args[1] === 'create'
                  ? (await fs.writeFile(args[2], 'bundle'), '')
                  : '',
      };
    if (cmd === 'pnpm') {
      if (args[0] === '--version') return { stdout: '11.13.1\n' };
      if (args[0] === 'overlay:evaluate:incumbent')
        await fs.writeFile(
          args[2],
          JSON.stringify({
            schemaVersion: 1,
            candidateId: 'incumbent',
            revision,
            artifacts: [
              ['@lyra-ds/styles', '0.5.0'],
              ['@lyra-ds/react', '0.5.0'],
              ['@lyra-ds/alpine', '0.6.0'],
            ].map(([name, version]) => ({ name, version, sha256: 'd'.repeat(64) })),
          }),
        );
      if (args[0] === 'overlay:evaluate:behavioral:manifest')
        await fs.writeFile(
          args[6],
          JSON.stringify(
            createBehavioralManifest({
              lyraRevision: revision,
              incumbentCharacterization: JSON.parse(await fs.readFile(args[4], 'utf8')),
            }),
          ),
        );
      return { stdout: '' };
    }
    assert.equal(cmd, 'docker', 'unit tests never execute external commands');
    if (args[0] === 'create') return { stdout: helper + '\n' };
    if (args[0] === 'cp') {
      await fs.writeFile(args[2], 'linux-node');
      return { stdout: '' };
    }
    if (args[0] === 'rm') return { stdout: helper };
    if (args[0] === 'run')
      return {
        stdout: JSON.stringify({
          version: '24.18.0',
          arch: 'arm64',
          sha256: digest('linux-node'),
          corepack: '0.35.0',
          selected: 'v24.18.0',
        }),
      };
    if (args[0] === 'inspect')
      return {
        stdout: JSON.stringify(
          args[1] === helper
            ? [
                {
                  Id: helper,
                  Config: {
                    Image: NODE_IMAGE,
                    Labels: {
                      'org.lyra.wave2.owner': calls
                        .find((c) => c.args[0] === 'create')
                        .args[2].split('=')[1],
                    },
                  },
                  State: { Status: 'created' },
                  Mounts: [],
                },
              ]
            : [
                {
                  Config: {
                    Image: BROWSER_IMAGE,
                    Labels: { 'com.docker.compose.project': config.name },
                  },
                  State: { Running: true },
                  NetworkSettings: {
                    Networks: Object.fromEntries(
                      Object.values(config.networks).map((n) => [n.name, {}]),
                    ),
                  },
                },
              ],
        ),
      };
    if (args[0] === 'network' && args[1] === 'inspect')
      return {
        stdout: JSON.stringify([
          {
            Labels: { 'com.docker.compose.project': config.name },
            Internal: args[2] === config.networks['wave2-internal'].name,
          },
        ]),
      };
    if (args[0] === 'ps' || (args[0] === 'network' && args[1] === 'ls')) return { stdout: '' };
    assert.equal(args[0], 'compose');
    project = args[2];
    const sub = args.slice(5);
    if (sub[0] === 'config') {
      const volume = (source, target, read_only) => ({ type: 'bind', source, target, read_only });
      const service = (name) => ({
        image: BROWSER_IMAGE,
        init: true,
        user: '501:20',
        environment: {
          OVERLAY_EVALUATION_REVISION: revision,
          ...(name === 'wave2'
            ? {
                HTTP_PROXY: 'http://registry-proxy:3128',
                HTTPS_PROXY: 'http://registry-proxy:3128',
                NO_PROXY: '127.0.0.1,localhost',
                NODE_USE_ENV_PROXY: '1',
                OVERLAY_WAVE2_CONTAINER: '1',
              }
            : {}),
        },
        networks: Object.fromEntries(
          (name === 'wave2' ? ['wave2-internal'] : ['wave2-internal', 'registry-egress']).map(
            (n) => [n, {}],
          ),
        ),
        volumes: [
          volume(env.OVERLAY_NODE_ROOT, '/opt/node', true),
          volume(env.OVERLAY_INPUT_ROOT, '/input', true),
          ...(name === 'wave2'
            ? [
                volume(env.OVERLAY_EVIDENCE_ROOT, '/evidence', false),
                volume(env.OVERLAY_OWNED_WORK_ROOT, '/work', false),
              ]
            : []),
        ],
      });
      config = {
        name: project,
        services: { wave2: service('wave2'), 'registry-proxy': service('registry-proxy') },
        networks: {
          'wave2-internal': { name: project + '_wave2-internal', internal: true },
          'registry-egress': { name: project + '_registry-egress' },
        },
      };
      return { stdout: JSON.stringify(config) };
    }
    if (sub[0] === 'ps') return { stdout: proxyId };
    if (sub[0] === 'run') {
      for (const candidateId of ['incumbent', 'radix', 'base-ui', 'zag'])
        for (const scenario of WAVE_2_SCENARIOS)
          for (const cellId of scenario.requiredCells) {
            const path = join(
              output,
              'evidence/attempts',
              'wave2-' + revision.slice(0, 12),
              'scenario',
              candidateId,
              scenario.contractId,
              scenario.scenarioId,
              cellId,
            );
            await fs.mkdir(path, { recursive: true });
            await fs.writeFile(
              join(path, 'attempt-1.json'),
              canonicalJson({
                schemaVersion: 1,
                recordType: 'scenario',
                runId: 'wave2-' + revision.slice(0, 12),
                candidateId,
                contractId: scenario.contractId,
                scenarioId: scenario.scenarioId,
                cellId,
                attemptNumber: 1,
                result: 'FAIL',
                classification: 'product',
                expected: scenario.expected,
                observed: { observations: [{}] },
                artifactPaths: [],
              }),
            );
          }
      return {
        stdout:
          JSON.stringify({
            schemaVersion: 1,
            directRegistryBlocked: true,
            registryHttpsSucceeded: true,
            nonAllowlistedTargetsRejected: 7,
          }) +
          '\n' +
          JSON.stringify(successfulSummary(), null, 2) +
          '\n',
      };
    }
    if (sub[0] === 'logs')
      return {
        stdout:
          'cloning\n' +
          JSON.stringify({
            schemaVersion: 1,
            connectAllowed: 2,
            connectRejected: 7,
            methodRejected: 0,
            tunnelFailures: 0,
          }) +
          '\n',
      };
    return { stdout: '' };
  };
  return {
    output,
    calls,
    run: () =>
      runWave2Automation({
        argv: ['--output', output],
        runCommand: fake,
        fs: { ...fs, ...filesystemOverrides },
        platform: 'darwin',
        arch: 'arm64',
        uid: 501,
        gid: 20,
        environment: { PATH: process.env.PATH, HOME: process.env.HOME },
      }),
  };
}
test('injected automation orders exact tools, live preflight, closed summaries and owned cleanup', async (t) => {
  const f = await fixture(t);
  const result = await f.run();
  assert.equal(result.results.candidates.length, 4);
  assert.equal(result.revision, revision);
  assert.equal(result.manifestSha256, digest(await fs.readFile(result.preserved.manifest)));
  assert.equal(result.bundleSha256, digest('bundle'));
  await assert.rejects(fs.lstat(join(f.output, 'work')), { code: 'ENOENT' });
  for (const path of [f.output, join(f.output, 'input'), join(f.output, 'evidence')])
    assert.equal((await fs.stat(path)).mode & 0o777, 0o700);
  assert.deepEqual(
    f.calls.filter((c) => c.cmd === 'pnpm').map((c) => c.args[0]),
    [
      '--version',
      'overlay:evaluate:incumbent',
      'overlay:evaluate:behavioral:manifest',
      'overlay:evaluate:check',
    ],
  );
  const docker = f.calls.filter((c) => c.cmd === 'docker');
  assert.deepEqual(docker.find((c) => c.args[0] === 'rm').args, ['rm', helper]);
  assert.equal(
    docker.some((c) => ['start', 'prune'].includes(c.args[0])),
    false,
  );
  const compose = docker.filter((c) => c.args[0] === 'compose');
  assert.equal(new Set(compose.map((c) => c.args[2])).size, 1);
  assert.match(compose[0].args[2], /^lyra-wave2-[a-f0-9]{32}$/);
  assert.deepEqual(
    compose.map((c) => c.args[5]),
    ['config', 'up', 'ps', 'run', 'stop', 'logs', 'down'],
  );
  for (const call of compose) {
    assert.equal(call.options.env.HOME, process.env.HOME);
    assert.equal(call.options.env.UID, '501');
    assert.equal(call.options.env.GID, '20');
    assert.equal(call.options.env.pnpm_config_store_dir, join(f.output, 'work/pnpm/store'));
    assert.equal(call.options.env.OVERLAY_INPUT_ROOT, join(f.output, 'input'));
    assert.equal(call.options.env.COREPACK_HOME, join(f.output, 'work/cache/corepack'));
  }
  assert.ok(
    f.calls.findIndex((c) => c.args[0] === 'network' && c.args[1] === 'inspect') <
      f.calls.findIndex((c) => c.args[5] === 'run'),
  );
  assert.equal(
    JSON.parse(await fs.readFile(join(f.output, 'report.json'), 'utf8')).schemaVersion,
    1,
  );
});
test('fresh invocations have distinct Compose ownership', async (t) => {
  const first = await fixture(t),
    second = await fixture(t);
  assert.notEqual((await first.run()).project, (await second.run()).project);
});
for (const stage of [
  'helper-copy',
  'helper-identity',
  'helper-cleanup',
  'bundle-head',
  'topology',
  'evaluation',
  'summary',
  'proxy-summary',
  'teardown',
])
  test('automation fails closed at ' + stage + ' and preserves exact owned evidence', async (t) => {
    const f = await fixture(t, async ({ cmd, args, config }) => {
      if (stage === 'helper-copy' && cmd === 'docker' && args[0] === 'cp')
        throw new Error('injected copy failure');
      if (
        stage === 'helper-identity' &&
        cmd === 'docker' &&
        args[0] === 'inspect' &&
        args[1] === helper
      )
        return {
          stdout: JSON.stringify([
            {
              Id: helper,
              Config: { Image: NODE_IMAGE, Labels: { 'org.lyra.wave2.owner': 'unrelated' } },
              State: { Status: 'running' },
              Mounts: [],
            },
          ]),
        };
      if (stage === 'helper-cleanup' && cmd === 'docker' && args[0] === 'rm')
        throw new Error('injected helper cleanup failure');
      if (stage === 'bundle-head' && cmd === 'git' && args[1] === 'list-heads')
        return { stdout: '0'.repeat(40) + ' HEAD' };
      if (
        stage === 'topology' &&
        cmd === 'docker' &&
        args[0] === 'network' &&
        args[1] === 'inspect'
      )
        return {
          stdout: JSON.stringify([
            { Labels: { 'com.docker.compose.project': config.name }, Internal: false },
          ]),
        };
      if (stage === 'evaluation' && args[5] === 'run')
        throw Object.assign(new Error('evaluation failed'), {
          code: 17,
          stdout: 'retained failure',
        });
      if (stage === 'summary' && args[5] === 'run') return { stdout: '{}' };
      if (stage === 'proxy-summary' && args[5] === 'logs') return { stdout: '{}' };
      if (stage === 'teardown' && args[5] === 'down') throw new Error('cleanup failed');
    });
    await assert.rejects(f.run(), /automation failed/);
    await fs.stat(join(f.output, 'failure.json'));
    await fs.stat(join(f.output, 'evidence'));
    await assert.rejects(fs.stat(join(f.output, 'report.json')), { code: 'ENOENT' });
    if (!['helper-copy', 'helper-identity', 'helper-cleanup', 'bundle-head'].includes(stage))
      assert.ok(f.calls.some((c) => c.args[5] === 'down'));
    if (stage === 'helper-copy' || stage === 'helper-identity')
      assert.ok(
        f.calls.some((c) => c.cmd === 'docker' && c.args[0] === 'rm' && c.args[1] === helper),
      );
  });
test('filesystem replacement blocks work removal without deleting another directory', async (t) => {
  let replacements = 0;
  const f = await fixture(t, async ({ args, output }) => {
    if (args[5] === 'run') {
      await fs.rename(join(output, 'work'), join(output, 'original-work'));
      await fs.mkdir(join(output, 'work'));
      await fs.writeFile(join(output, 'work/unrelated'), 'keep');
      replacements++;
    }
  });
  await assert.rejects(f.run(), /identity changed/);
  assert.equal(replacements, 1);
  assert.equal(await fs.readFile(join(f.output, 'work/unrelated'), 'utf8'), 'keep');
});
