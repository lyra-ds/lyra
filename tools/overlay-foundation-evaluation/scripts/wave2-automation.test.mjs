import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { test } from 'node:test';
import { runOwnedCommand } from './wave2-command.mjs';
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
  const root = await fs.mkdtemp(join(tmpdir(), 'wave2-auto-test-'));
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
  const root = await fs.mkdtemp(join(tmpdir(), 'wave2-auto-test-'));
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
  const root = await fs.mkdtemp(join(tmpdir(), 'wave2-auto-test-'));
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
      assert.notEqual(
        args[0],
        'overlay:evaluate:incumbent',
        'initial characterization must run in pinned Linux',
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
                OVERLAY_WAVE2_PHASE: 'evaluate',
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
      const characterizing = sub.includes('OVERLAY_WAVE2_PHASE=characterize');
      if (characterizing) {
        await fs.stat(join(output, 'input/repository.bundle'));
        await assert.rejects(fs.stat(join(output, 'input/candidates.json')), { code: 'ENOENT' });
        const directory = join(output, 'work/characterization');
        await fs.mkdir(directory);
        const artifacts = [];
        for (const [i, [name, version]] of [
          ['@lyra-ds/styles', '0.5.0'],
          ['@lyra-ds/react', '0.5.0'],
          ['@lyra-ds/alpine', '0.6.0'],
        ].entries()) {
          const bytes = Buffer.from('linux packed ' + name);
          await fs.writeFile(join(directory, i + '.tgz'), bytes);
          artifacts.push({
            name,
            version,
            sha256: digest(bytes),
            bytes: bytes.length,
            license: 'MIT',
            lifecycleScripts: [],
          });
        }
        await fs.writeFile(
          join(directory, 'incumbent.json'),
          JSON.stringify({ schemaVersion: 1, candidateId: 'incumbent', revision, artifacts }),
        );
      } else
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
        stderr: ['before', 'after']
          .map(
            (phase) =>
              'LYRA_WAVE2_RESOURCES ' +
              JSON.stringify({
                phase,
                proof: {
                  schemaVersion: 1,
                  procSelfCgroup: '0::/\n',
                  memoryEventsPath: '/sys/fs/cgroup/memory.events',
                  memoryEvents: 'oom_kill 0\n',
                  oomKills: 0,
                },
              }),
          )
          .join('\n'),
        stdout:
          JSON.stringify({
            schemaVersion: 1,
            directRegistryBlocked: true,
            registryHttpsSucceeded: true,
            nonAllowlistedTargetsRejected: 7,
          }) +
          '\n' +
          JSON.stringify(characterizing ? { characterized: true } : successfulSummary(), null, 2) +
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
    run: (overrides = {}) =>
      runWave2Automation({
        argv: ['--output', output],
        runCommand: fake,
        fs: { ...fs, ...filesystemOverrides },
        platform: 'darwin',
        arch: 'arm64',
        uid: 501,
        gid: 20,
        environment: { PATH: process.env.PATH, HOME: process.env.HOME },
        ...overrides,
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
  assert.equal(result.characterizationResources.length, 2);
  const characterized = JSON.parse(await fs.readFile(result.preserved.incumbent, 'utf8'));
  for (const [index, path] of result.preserved.incumbentArchives.entries())
    assert.equal(digest(await fs.readFile(path)), characterized.artifacts[index].sha256);
  await assert.rejects(fs.lstat(join(f.output, 'work')), { code: 'ENOENT' });
  for (const path of [f.output, join(f.output, 'input'), join(f.output, 'evidence')])
    assert.equal((await fs.stat(path)).mode & 0o777, 0o700);
  assert.deepEqual(
    f.calls.filter((c) => c.cmd === 'pnpm').map((c) => c.args[0]),
    ['--version', 'overlay:evaluate:behavioral:manifest', 'overlay:evaluate:check'],
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
    ['config', 'up', 'ps', 'run', 'run', 'stop', 'logs', 'down'],
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

for (const phase of ['characterize', 'evaluate'])
  test('resource failure blocks ' + phase + ' phase', async (t) => {
    const f = await fixture(t, async ({ cmd, args }) => {
      if (
        cmd === 'docker' &&
        args[5] === 'run' &&
        args.includes('OVERLAY_WAVE2_PHASE=characterize') === (phase === 'characterize')
      )
        return { stdout: '', stderr: '' };
    });
    await assert.rejects(f.run(), /resource proof/);
    assert.equal(
      f.calls.filter((c) => c.args[5] === 'run').length,
      phase === 'characterize' ? 1 : 2,
    );
  });
test('host rejects changed characterized archives before manifest creation', async (t) => {
  const f = await fixture(t, () => {}, {
    readFile: async (path, ...options) =>
      String(path).endsWith('/characterization/0.tgz')
        ? Buffer.from('corrupt')
        : fs.readFile(path, ...options),
  });
  await assert.rejects(f.run(), /archive size|archive hash/);
  assert.equal(
    f.calls.some((c) => c.args[0] === 'overlay:evaluate:behavioral:manifest'),
    false,
  );
});
test('retained characterization archives stay immutable through evaluation', async (t) => {
  const f = await fixture(t, async ({ cmd, args, output }) => {
    if (cmd === 'docker' && args[5] === 'run' && !args.includes('OVERLAY_WAVE2_PHASE=characterize'))
      await fs.writeFile(join(output, 'input/incumbent-0.tgz'), 'changed');
  });
  await assert.rejects(f.run(), /incumbent archive changed/);
});

test('uncertain final host command disposal retains work and primary failure evidence', async (t) => {
  let statusCalls = 0;
  const f = await fixture(t, async ({ cmd, args }) => {
    if (cmd === 'git' && args[0] === 'status' && ++statusCalls > 1)
      throw Object.assign(new Error('host descendant shutdown unproven'), {
        disposalVerified: false,
      });
  });
  await assert.rejects(f.run(), /host descendant shutdown unproven/);
  await fs.stat(join(f.output, 'work/.owner'));
  const failure = JSON.parse(await fs.readFile(join(f.output, 'failure.json'), 'utf8'));
  assert.match(failure.errors[0], /host descendant shutdown unproven/);
  assert.ok(failure.errors.some((e) => e.includes('host command disposal uncertain')));
});

test('real delayed host child finishes before automation removes its work', async (t) => {
  const controller = new AbortController();
  const f = await fixture(t, async ({ cmd, args, options, output }) => {
    if (cmd !== 'docker' || !args.includes('OVERLAY_WAVE2_PHASE=characterize')) return;
    const ready = join(output, 'ready'),
      proof = join(output, 'shutdown-proof');
    const source = `const fs=require('node:fs');process.on('SIGTERM',()=>setTimeout(()=>{fs.writeFileSync(process.argv[2],String(fs.existsSync(process.argv[3])));process.exit(0)},300));fs.writeFileSync(process.argv[1],'ready');setInterval(()=>{},1000)`;
    const pending = runOwnedCommand(
      process.execPath,
      ['-e', source, ready, proof, join(output, 'work/.owner')],
      options,
    );
    for (let i = 0; i < 200; i++) {
      try {
        await fs.stat(ready);
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 10));
      }
    }
    controller.abort();
    return pending;
  });
  await assert.rejects(f.run({ signal: controller.signal }), /host command aborted/);
  assert.equal(await fs.readFile(join(f.output, 'shutdown-proof'), 'utf8'), 'true');
  await assert.rejects(fs.stat(join(f.output, 'work')), { code: 'ENOENT' });
  const failure = JSON.parse(await fs.readFile(join(f.output, 'failure.json'), 'utf8'));
  const record = failure.commands.find((c) => c.args.includes('OVERLAY_WAVE2_PHASE=characterize'));
  assert.equal(record.disposalVerified, true);
  assert.equal(record.processProof.leaderClosed, true);
});

test('helper copy failure remains primary when verified cleanup also fails', async (t) => {
  const f = await fixture(t, async ({ cmd, args }) => {
    if (cmd === 'docker' && args[0] === 'cp') throw new Error('primary copy failure');
    if (cmd === 'docker' && args[0] === 'rm') throw new Error('secondary helper cleanup failure');
  });
  await assert.rejects(f.run(), (error) => {
    assert.match(error.errors[0].errors[0].message, /primary copy failure/);
    assert.match(error.errors[0].errors[1].message, /secondary helper cleanup failure/);
    return true;
  });
  await fs.stat(join(f.output, 'work/.owner'));
});

for (const field of ['Id', 'owner', 'image', 'state', 'mounts', 'cleanup-owner'])
  test('helper destructive cleanup rejects ' + field + ' mismatch', async (t) => {
    let inspections = 0;
    const f = await fixture(t, async ({ cmd, args, calls }) => {
      if (cmd !== 'docker' || args[0] !== 'inspect' || args[1] !== helper) return;
      inspections++;
      if (field === 'cleanup-owner' && inspections === 1) return;
      const info = {
        Id: helper,
        Config: {
          Image: NODE_IMAGE,
          Labels: {
            'org.lyra.wave2.owner': calls.find((c) => c.args[0] === 'create').args[2].split('=')[1],
          },
        },
        State: { Status: 'created' },
        Mounts: [],
      };
      if (field === 'Id') info.Id = 'f'.repeat(64);
      if (field === 'owner' || field === 'cleanup-owner')
        info.Config.Labels['org.lyra.wave2.owner'] = 'unrelated';
      if (field === 'image') info.Config.Image = 'other';
      if (field === 'state') info.State.Status = 'running';
      if (field === 'mounts') info.Mounts = [{ Destination: '/unrelated' }];
      return { stdout: JSON.stringify([info]) };
    });
    await assert.rejects(f.run(), /automation failed/);
    assert.equal(
      f.calls.some((c) => c.cmd === 'docker' && c.args[0] === 'rm'),
      false,
    );
    await fs.stat(join(f.output, 'work/.owner'));
    const failure = JSON.parse(await fs.readFile(join(f.output, 'failure.json'), 'utf8'));
    assert.equal(failure.helper.id, helper);
    assert.equal(failure.helper.removed, false);
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
    if (stage === 'helper-identity') {
      assert.equal(
        f.calls.some((c) => c.cmd === 'docker' && c.args[0] === 'rm' && c.args[1] === helper),
        false,
      );
      const failure = JSON.parse(await fs.readFile(join(f.output, 'failure.json'), 'utf8'));
      assert.deepEqual(failure.helper, { id: helper, verified: false, removed: false });
      await fs.stat(join(f.output, 'work/.owner'));
    }
    if (stage === 'helper-copy')
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

test('uncertain Docker teardown retains owned work intact', async (t) => {
  let removals = 0;
  const f = await fixture(
    t,
    async ({ args }) => {
      if (args[5] === 'down') throw new Error('uncertain teardown');
    },
    {
      rm: async (...args) => {
        removals++;
        return fs.rm(...args);
      },
    },
  );
  await assert.rejects(f.run(), /uncertain teardown/);
  assert.equal(removals, 0);
  await fs.stat(join(f.output, 'work/.owner'));
});

test('owned delayed one-off shutdown is awaited before removal', async () => {
  const { stopProjectContainers } = await import('./wave2-automation.mjs');
  const calls = [],
    project = 'lyra-wave2-test';
  let running = true,
    removed = false;
  await stopProjectContainers({
    project,
    run: async (cmd, args) => {
      calls.push(args);
      if (args[0] === 'ps') return removed ? '' : helper;
      if (args[0] === 'inspect')
        return JSON.stringify([
          {
            Id: helper,
            Config: {
              Labels: {
                'com.docker.compose.project': project,
                'com.docker.compose.service': 'wave2',
              },
            },
            State: { Running: running },
          },
        ]);
      if (args[0] === 'stop') {
        await new Promise((resolve) => setTimeout(resolve, 20));
        running = false;
        return helper;
      }
      if (args[0] === 'rm') {
        assert.equal(running, false);
        removed = true;
        return helper;
      }
      throw new Error('unexpected command');
    },
  });
  assert.equal(removed, true);
  assert.ok(calls.findIndex((a) => a[0] === 'stop') < calls.findIndex((a) => a[0] === 'rm'));
});
test('owned teardown rejects mismatched owner and tolerates only verified vanished IDs', async () => {
  const { stopProjectContainers } = await import('./wave2-automation.mjs');
  let stopped = false;
  await assert.rejects(
    stopProjectContainers({
      project: 'lyra-wave2-test',
      run: async (cmd, args) => {
        if (args[0] === 'ps') return helper;
        if (args[0] === 'inspect')
          return JSON.stringify([
            {
              Id: helper,
              Config: {
                Labels: {
                  'com.docker.compose.project': 'unrelated',
                  'com.docker.compose.service': 'wave2',
                },
              },
              State: { Running: true },
            },
          ]);
        stopped = true;
      },
    }),
  );
  assert.equal(stopped, false);
  let queried = 0;
  await stopProjectContainers({
    project: 'lyra-wave2-test',
    run: async (cmd, args) => {
      if (args[0] === 'ps') return queried++ === 0 ? helper : '';
      if (args[0] === 'inspect') throw new Error('already removed');
      throw new Error('must not mutate vanished container');
    },
  });
});
test('auto-removed one-off may vanish between final lookup and inspection', async () => {
  const { stopProjectContainers } = await import('./wave2-automation.mjs');
  let inspections = 0,
    lists = 0;
  await stopProjectContainers({
    project: 'lyra-wave2-test',
    run: async (cmd, args) => {
      if (args[0] === 'ps') return lists++ < 2 ? helper : '';
      if (args[0] === 'inspect') {
        if (inspections++ > 0) throw new Error('already removed');
        return JSON.stringify([
          {
            Id: helper,
            Config: {
              Labels: {
                'com.docker.compose.project': 'lyra-wave2-test',
                'com.docker.compose.service': 'wave2',
              },
            },
            State: { Running: true },
          },
        ]);
      }
      if (args[0] === 'stop') return helper;
      throw new Error('must not remove vanished container');
    },
  });
});
test('AutoRemove shutdown waits for asynchronous deletion and fails closed on timeout', async () => {
  const { stopProjectContainers } = await import('./wave2-automation.mjs');
  for (const disappears of [true, false]) {
    let stopped = false,
      polls = 0,
      removed = false;
    const run = () =>
      stopProjectContainers({
        project: 'lyra-wave2-test',
        removalTimeoutMs: 20,
        pollIntervalMs: 1,
        run: async (cmd, args) => {
          if (args[0] === 'ps') {
            if (stopped && disappears && ++polls >= 3) return '';
            return helper;
          }
          if (args[0] === 'inspect')
            return JSON.stringify([
              {
                Id: helper,
                Config: {
                  Labels: {
                    'com.docker.compose.project': 'lyra-wave2-test',
                    'com.docker.compose.service': 'wave2',
                  },
                },
                State: { Running: !stopped },
                HostConfig: { AutoRemove: true },
              },
            ]);
          if (args[0] === 'stop') {
            stopped = true;
            return helper;
          }
          if (args[0] === 'rm') {
            removed = true;
            throw new Error('must never compete with AutoRemove');
          }
        },
      });
    if (disappears) await run();
    else await assert.rejects(run(), /disappearance/);
    assert.equal(removed, false);
  }
});
test('owned cgroup resource evidence rejects missing, malformed, foreign and OOM facts', async () => {
  const { readEvaluatorResources, validateResourceLog } = await import('./wave2-automation.mjs');
  const proof = await readEvaluatorResources({
    fs: {
      readFile: async (path) =>
        path === '/proc/self/cgroup'
          ? '0::/\n'
          : 'low 0\nhigh 0\nmax 0\noom 0\noom_kill 0\noom_group_kill 0\n',
    },
  });
  assert.equal(proof.oomKills, 0);
  const log = ['before', 'after']
    .map((phase) => 'LYRA_WAVE2_RESOURCES ' + JSON.stringify({ phase, proof }))
    .join('\n');
  assert.equal(validateResourceLog(log).length, 2);
  for (const raw of ['oom_kill nope\n', 'oom 0\n', 'oom_kill 0\noom_kill 1\n'])
    await assert.rejects(
      readEvaluatorResources({
        fs: { readFile: async (path) => (path === '/proc/self/cgroup' ? '0::/\n' : raw) },
      }),
    );
  await assert.rejects(
    readEvaluatorResources({
      fs: {
        readFile: async () => {
          throw new Error('missing cgroup');
        },
      },
    }),
    /missing cgroup/,
  );
  await assert.rejects(
    readEvaluatorResources({ fs: { readFile: async () => '0::/foreign\n' } }),
    /current cgroup/,
  );
  assert.throws(() => validateResourceLog(''), /resource proof/);
  const killedProof = { ...proof, memoryEvents: 'oom_kill 1\n', oomKills: 1 };
  assert.throws(
    () =>
      validateResourceLog(
        ['before', 'after']
          .map(
            (phase) =>
              'LYRA_WAVE2_RESOURCES ' +
              JSON.stringify({ phase, proof: phase === 'before' ? proof : killedProof }),
          )
          .join('\n'),
      ),
    /evaluator OOM kill/,
  );
  assert.throws(
    () => validateResourceLog(log.replaceAll('"oomKills":0', '"oomKills":1')),
    /OOM|resource/,
  );
});

test('post-command log replacement cannot redirect stdout stderr or exit writes', async (t) => {
  let target;
  const f = await fixture(t, async ({ cmd, args, output }) => {
    if (cmd === 'pnpm' && args[0] === '--version') {
      target = join(output, 'unrelated');
      await fs.mkdir(target);
      await fs.writeFile(join(target, 'keep'), 'original');
      await fs.rename(join(output, 'logs'), join(output, 'original-logs'));
      await fs.symlink(target, join(output, 'logs'));
      return { stdout: '11.13.1\n', stderr: 'must not escape' };
    }
  });
  await assert.rejects(f.run(), /directory|identity|symlink/);
  assert.deepEqual(await fs.readdir(target), ['keep']);
  assert.equal(await fs.readFile(join(target, 'keep'), 'utf8'), 'original');
});
