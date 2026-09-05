#!/usr/bin/env node
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import * as filesystem from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { canonicalJson, validateAttempt } from '../evidence/results.mjs';
import { createBehavioralManifest } from './create-behavioral-manifest.mjs';
import { WAVE_2_CONTRACT_IDS, WAVE_2_SCENARIOS } from '../contracts/wave2.mjs';

export const BROWSER_IMAGE =
  'mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e';
export const NODE_IMAGE =
  'node:24.18.0-bookworm@sha256:5711a0d445a1af54af9589066c646df387d1831a608226f4cd694fc59e745059';
const command = promisify(execFile);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const keys = (value, expected) =>
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), 'closed summary/config keys');
const ids = ['incumbent', 'radix', 'base-ui', 'zag'];
const outputText = (result) => (typeof result === 'string' ? result : String(result.stdout ?? ''));
const inside = (parent, child) => {
  const p = relative(parent, child);
  return !p || (p !== '..' && !p.startsWith('../') && !isAbsolute(p));
};
export function parseAutomationArguments(argv) {
  if (
    !Array.isArray(argv) ||
    argv.length !== 2 ||
    argv[0] !== '--output' ||
    typeof argv[1] !== 'string' ||
    !isAbsolute(argv[1])
  )
    throw new Error('usage: wave2-automation.mjs --output <absolute-new-directory>');
  if (resolve(argv[1]) !== argv[1]) throw new Error('output must be canonical absolute path');
  return argv[1];
}
export function validateWaveSummary(summary, revision) {
  keys(summary, ['schemaVersion', 'runId', 'candidates']);
  assert.equal(summary.schemaVersion, 1, 'summary schema');
  assert.equal(summary.runId, 'wave2-' + revision.slice(0, 12), 'summary revision');
  assert.deepEqual(
    summary.candidates.map((c) => c.candidateId),
    ids,
    'summary candidate order',
  );
  const checkCounts = (counts, total) => {
    keys(counts, ['PASS', 'FAIL', 'unavailable']);
    assert.ok(
      Object.values(counts).every((n) => Number.isSafeInteger(n) && n >= 0),
      'summary counts',
    );
    assert.equal(
      Object.values(counts).reduce((a, b) => a + b, 0),
      total,
      'summary tuple count',
    );
  };
  for (const candidate of summary.candidates) {
    keys(candidate, ['candidateId', 'counts', 'retries', 'contracts']);
    assert.equal(candidate.retries, 0, 'fresh diagnostic has no retries');
    assert.deepEqual(
      candidate.contracts.map((c) => c.contractId),
      WAVE_2_CONTRACT_IDS,
    );
    for (const contract of candidate.contracts) {
      keys(contract, ['contractId', 'counts', 'retries']);
      assert.equal(contract.retries, 0);
      checkCounts(
        contract.counts,
        WAVE_2_SCENARIOS.filter((s) => s.contractId === contract.contractId).reduce(
          (sum, s) => sum + s.requiredCells.length,
          0,
        ),
      );
    }
    checkCounts(candidate.counts, 164);
    for (const result of ['PASS', 'FAIL', 'unavailable'])
      assert.equal(
        candidate.counts[result],
        candidate.contracts.reduce((sum, c) => sum + c.counts[result], 0),
      );
  }
  return summary;
}
export function validateProxySummary(summary) {
  keys(summary, [
    'schemaVersion',
    'connectAllowed',
    'connectRejected',
    'methodRejected',
    'tunnelFailures',
  ]);
  assert.equal(summary.schemaVersion, 1);
  for (const key of ['connectAllowed', 'connectRejected', 'methodRejected', 'tunnelFailures'])
    assert.ok(Number.isSafeInteger(summary[key]) && summary[key] >= 0, 'proxy counts');
  assert.ok(
    summary.connectAllowed >= 2 && summary.connectRejected >= 7,
    'proxy live preflight counts',
  );
  assert.equal(summary.tunnelFailures, 0, 'proxy tunnel failure');
  return summary;
}
export function validateCompose(
  config,
  { project, input, work, evidence, node, revision, uid, gid },
) {
  keys(config.services, ['wave2', 'registry-proxy']);
  keys(config.networks, ['wave2-internal', 'registry-egress']);
  assert.equal(config.name, project);
  assert.equal(config.networks['wave2-internal'].internal, true);
  assert.notEqual(config.networks['registry-egress'].internal, true);
  for (const name of ['wave2', 'registry-proxy']) {
    const service = config.services[name];
    assert.equal(service.image, BROWSER_IMAGE);
    assert.equal(service.init, true);
    assert.equal(service.user, `${uid}:${gid}`);
    assert.ok(
      !service.privileged &&
        !service.network_mode &&
        !service.ports &&
        !service.ipc &&
        !service.pid,
      'no host namespace or ports',
    );
    assert.deepEqual(
      Object.keys(service.networks).sort(),
      name === 'wave2' ? ['wave2-internal'] : ['registry-egress', 'wave2-internal'],
    );
    const expected = [
      ['/opt/node', node, true],
      ['/input', input, true],
      ...(name === 'wave2'
        ? [
            ['/evidence', evidence, false],
            ['/work', work, false],
          ]
        : []),
    ];
    assert.equal(service.volumes.length, expected.length);
    for (const [target, source, readonly] of expected) {
      const volume = service.volumes.find((v) => v.target === target);
      assert.equal(volume?.type, 'bind');
      assert.equal(volume.source, source);
      assert.equal(volume.read_only ?? false, readonly);
    }
    assert.equal(service.environment.OVERLAY_EVALUATION_REVISION, revision);
  }
  const env = config.services.wave2.environment;
  assert.equal(env.HTTPS_PROXY, 'http://registry-proxy:3128');
  assert.equal(env.HTTP_PROXY, env.HTTPS_PROXY);
  assert.equal(env.NO_PROXY, '127.0.0.1,localhost');
  assert.equal(env.NODE_USE_ENV_PROXY, '1');
  assert.equal(env.OVERLAY_WAVE2_CONTAINER, '1');
  return config;
}
export async function inspectAttemptCoverage({ evidence, revision, summary, fs = filesystem }) {
  const attempts = [],
    counts = {
      scenarioAttempts: 0,
      completedTuples: 0,
      completedUnderlyingExecutions: 0,
      coreUnavailableTuples: 0,
      preparationFailureTuples: 0,
      executionFailureTuples: 0,
    };
  for (const candidateId of ids) {
    const actual = { PASS: 0, FAIL: 0, unavailable: 0 };
    for (const scenario of WAVE_2_SCENARIOS)
      for (const cellId of scenario.requiredCells) {
        const path = join(
          evidence,
          'attempts',
          'wave2-' + revision.slice(0, 12),
          'scenario',
          candidateId,
          scenario.contractId,
          scenario.scenarioId,
          cellId,
          'attempt-1.json',
        );
        const stat = await fs.lstat(path);
        assert.ok(stat.isFile() && !stat.isSymbolicLink(), 'attempt must be a regular file');
        assert.equal(await fs.realpath(path), path, 'attempt containment changed');
        const bytes = await fs.readFile(path),
          attempt = JSON.parse(bytes);
        assert.deepEqual(validateAttempt(attempt), [], 'attempt schema');
        assert.equal(bytes.toString(), canonicalJson(attempt), 'canonical attempt bytes');
        for (const [key, value] of Object.entries({
          candidateId,
          contractId: scenario.contractId,
          scenarioId: scenario.scenarioId,
          cellId,
          attemptNumber: 1,
          runId: 'wave2-' + revision.slice(0, 12),
        }))
          assert.equal(attempt[key], value, 'attempt identity');
        assert.deepEqual(attempt.expected, scenario.expected);
        actual[attempt.result]++;
        counts.scenarioAttempts++;
        if (Array.isArray(attempt.observed.observations)) {
          counts.completedTuples++;
          counts.completedUnderlyingExecutions += attempt.observed.observations.length;
        } else if (attempt.observed.preflightResult === 'FAIL') counts.coreUnavailableTuples++;
        else if (attempt.observed.failure?.stage === 'prepare') counts.preparationFailureTuples++;
        else if (attempt.observed.failure?.stage === 'execute') counts.executionFailureTuples++;
        else throw new Error('attempt execution provenance missing');
        attempts.push({ path: relative(evidence, path), sha256: sha256(bytes) });
      }
    assert.deepEqual(
      actual,
      summary.candidates.find((c) => c.candidateId === candidateId).counts,
      'summary differs from immutable attempt 1',
    );
  }
  assert.equal(counts.scenarioAttempts, 656);
  return { counts, attempts };
}
export async function stopProjectContainers({ project, run }) {
  const list = async (filter) =>
    (
      await run('docker', ['ps', '--all', '--quiet', '--no-trunc', '--filter', filter], {
        cleanup: true,
      })
    ).trim();
  const captured = (await list('label=com.docker.compose.project=' + project))
    .split('\n')
    .filter(Boolean);
  for (const id of captured) {
    assert.match(id, /^[a-f0-9]{64}$/u, 'captured container ID');
    const exists = async () => {
      const found = await list('id=' + id);
      assert.ok(found === '' || found === id, 'container lookup identity');
      return found !== '';
    };
    let info;
    try {
      [info] = JSON.parse(await run('docker', ['inspect', id], { cleanup: true }));
    } catch (error) {
      if (await exists()) throw error;
      continue;
    }
    assert.equal(info.Id, id);
    assert.equal(
      info.Config.Labels['com.docker.compose.project'],
      project,
      'container owner mismatch',
    );
    assert.ok(
      ['wave2', 'registry-proxy'].includes(info.Config.Labels['com.docker.compose.service']),
      'owned service mismatch',
    );
    if (info.State.Running) {
      try {
        await run('docker', ['stop', '--timeout', '30', id], { cleanup: true });
      } catch (error) {
        if (await exists()) throw error;
        continue;
      }
    }
    if (await exists()) {
      let stopped;
      try {
        [stopped] = JSON.parse(await run('docker', ['inspect', id], { cleanup: true }));
      } catch (error) {
        if (await exists()) throw error;
        continue;
      }
      assert.equal(stopped.Id, id);
      assert.equal(stopped.State.Running, false, 'owned container did not stop');
      try {
        await run('docker', ['rm', id], { cleanup: true });
      } catch (error) {
        if (await exists()) throw error;
      }
    }
  }
}
function trailingJson(stdout) {
  const text = stdout.trim();
  for (
    let index = text.lastIndexOf('\n{');
    index >= 0;
    index = text.lastIndexOf('\n{', index - 1)
  ) {
    try {
      return JSON.parse(text.slice(index + 1));
    } catch {}
  }
  return JSON.parse(text);
}
export async function runWave2Automation({
  argv = process.argv.slice(2),
  repositoryRoot = resolve(import.meta.dirname, '../../..'),
  runCommand = (cmd, args, options) => command(cmd, args, { ...options, maxBuffer: 100_000_000 }),
  fs = filesystem,
  platform = process.platform,
  arch = process.arch,
  uid = process.getuid(),
  gid = process.getgid(),
  environment = process.env,
  signal,
} = {}) {
  if (process.versions.node !== '24.18.0') throw new Error('Node version must equal 24.18.0');
  const output = parseAutomationArguments(argv);
  if ((await fs.realpath(dirname(output))) !== dirname(output))
    throw new Error('output parent must be canonical, without symlinks');
  try {
    await fs.lstat(output);
    throw new Error('output path must not exist');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const repository = await fs.realpath(repositoryRoot);
  if (inside(repository, output) || inside(output, repository))
    throw new Error('output must be outside checkout');
  const raw = (cmd, args, options = {}) =>
    runCommand(cmd, args, { cwd: repository, env: environment, ...options });
  const clean = async (revision) => {
    if (outputText(await raw('git', ['status', '--porcelain=v1', '--untracked-files=all'])) !== '')
      throw new Error('automation requires a clean worktree');
    const head = outputText(await raw('git', ['rev-parse', 'HEAD'])).trim();
    assert.match(head, /^[a-f0-9]{40}$/u);
    if (revision) assert.equal(head, revision, 'repository revision changed');
    return head;
  };
  const revision = await clean();
  const project = 'lyra-wave2-' + randomUUID().replaceAll('-', '');
  const input = join(output, 'input'),
    work = join(output, 'work'),
    evidence = join(output, 'evidence'),
    logs = join(output, 'logs'),
    node = join(input, 'toolchain');
  const identities = new Map();
  const capture = async (path) => {
    const stat = await fs.lstat(path);
    assert.ok(stat.isDirectory() && !stat.isSymbolicLink());
    identities.set(path, { dev: stat.dev, ino: stat.ino });
  };
  const verify = async (path) => {
    const stat = await fs.lstat(path);
    assert.ok(stat.isDirectory() && !stat.isSymbolicLink(), 'owned path must remain a directory');
    assert.deepEqual(
      { dev: stat.dev, ino: stat.ino },
      identities.get(path),
      'owned directory identity changed',
    );
    assert.equal(await fs.realpath(path), path, 'owned canonical path changed');
  };
  await fs.mkdir(output, { mode: 0o700 });
  await capture(output);
  let sequence = 0,
    composeStarted = false,
    primary,
    report,
    composeEnv;
  const records = [];
  const logged = async (cmd, args, { cleanup = false, ...options } = {}) => {
    await verify(output);
    await verify(logs);
    const index = String(++sequence).padStart(3, '0');
    await fs.writeFile(
      join(logs, index + '.started.json'),
      JSON.stringify({ command: cmd, args }) + '\n',
      { flag: 'wx', mode: 0o600 },
    );
    let result, error;
    try {
      result = await raw(cmd, args, {
        env: composeEnv ?? environment,
        ...options,
        ...(!cleanup && signal ? { signal } : {}),
      });
    } catch (e) {
      error = e;
      result = e;
    }
    const record = {
      command: cmd,
      args,
      exitCode: error ? (Number.isInteger(error.code) ? error.code : 1) : 0,
      stdout: join(logs, index + '.stdout'),
      stderr: join(logs, index + '.stderr'),
    };
    await fs.writeFile(record.stdout, outputText(result), { flag: 'wx', mode: 0o600 });
    await fs.writeFile(record.stderr, String(result?.stderr ?? ''), { flag: 'wx', mode: 0o600 });
    records.push(record);
    await fs.writeFile(join(logs, index + '.json'), JSON.stringify(record, null, 2) + '\n', {
      flag: 'wx',
      mode: 0o600,
    });
    if (error) throw error;
    return outputText(result);
  };
  const compose = [
    'compose',
    '--project-name',
    project,
    '--file',
    join(repository, 'tools/overlay-foundation-evaluation/compose.wave2.yml'),
  ];
  const dc = (args, options) => logged('docker', [...compose, ...args], options);
  try {
    for (const path of [input, work, evidence, logs]) {
      await fs.mkdir(path, { mode: 0o700 });
      await capture(path);
    }
    await fs.writeFile(join(work, '.owner'), project, { flag: 'wx', mode: 0o600 });
    for (const path of ['cache', 'data', 'config', 'pnpm', 'tmp'])
      await fs.mkdir(join(work, path), { mode: 0o700 });
    composeEnv = {
      ...environment,
      COREPACK_HOME: join(work, 'cache/corepack'),
      XDG_CACHE_HOME: join(work, 'cache'),
      XDG_DATA_HOME: join(work, 'data'),
      XDG_CONFIG_HOME: join(work, 'config'),
      PNPM_HOME: join(work, 'pnpm'),
      pnpm_config_store_dir: join(work, 'pnpm/store'),
      TMPDIR: join(work, 'tmp'),
      UID: String(uid),
      GID: String(gid),
      OVERLAY_EVALUATION_REVISION: revision,
      OVERLAY_NODE_ROOT: node,
      OVERLAY_INPUT_ROOT: input,
      OVERLAY_EVIDENCE_ROOT: evidence,
      OVERLAY_OWNED_WORK_ROOT: work,
    };
    assert.equal((await logged('pnpm', ['--version'])).trim(), '11.13.1');
    await fs.mkdir(node, { mode: 0o700 });
    await fs.mkdir(join(node, 'bin'), { mode: 0o700 });
    let helper;
    try {
      if (platform === 'darwin') {
        helper = (
          await logged('docker', [
            'create',
            '--label',
            `org.lyra.wave2.owner=${project}`,
            NODE_IMAGE,
          ])
        ).trim();
        assert.match(helper, /^[a-f0-9]{64}$/u, 'captured helper ID');
        const [info] = JSON.parse(await logged('docker', ['inspect', helper]));
        assert.equal(info.Id, helper);
        assert.equal(info.Config.Labels['org.lyra.wave2.owner'], project);
        assert.equal(info.Config.Image, NODE_IMAGE);
        assert.equal(info.State.Status, 'created');
        assert.deepEqual(info.Mounts, []);
        await logged('docker', ['cp', helper + ':/usr/local/bin/node', join(node, 'bin/node')]);
      } else if (platform === 'linux') {
        const binary = await fs.realpath(process.execPath);
        await fs.copyFile(binary, join(node, 'bin/node'));
      } else throw new Error('automation supports Darwin and Linux only');
    } finally {
      if (helper) {
        assert.match(helper, /^[a-f0-9]{64}$/u);
        await logged('docker', ['rm', helper], { cleanup: true });
      }
    }
    await fs.chmod(join(node, 'bin/node'), 0o700);
    const binaryStat = await fs.lstat(join(node, 'bin/node'));
    assert.ok(binaryStat.isFile() && !binaryStat.isSymbolicLink(), 'copied Node must be regular');
    const nodeSha256 = sha256(await fs.readFile(join(node, 'bin/node')));
    const toolProof = JSON.parse(
      await logged('docker', [
        'run',
        '--rm',
        '--network',
        'none',
        '--read-only',
        '--label',
        `org.lyra.wave2.owner=${project}`,
        '--user',
        `${uid}:${gid}`,
        '--mount',
        `type=bind,source=${node},target=/opt/node,readonly`,
        '--entrypoint',
        '/opt/node/bin/node',
        BROWSER_IMAGE,
        '-e',
        "const fs=require('node:fs'),cp=require('node:child_process');process.env.PATH='/opt/node/bin:'+process.env.PATH;console.log(JSON.stringify({version:process.versions.node,arch:process.arch,sha256:require('node:crypto').createHash('sha256').update(fs.readFileSync(process.execPath)).digest('hex'),corepack:cp.execFileSync('corepack',['--version'],{encoding:'utf8'}).trim(),selected:cp.execFileSync('node',['--version'],{encoding:'utf8'}).trim()}))",
      ]),
    );
    assert.deepEqual(toolProof, {
      version: '24.18.0',
      arch,
      sha256: nodeSha256,
      corepack: '0.35.0',
      selected: 'v24.18.0',
    });
    const incumbent = join(input, 'incumbent.json'),
      manifestPath = join(input, 'candidates.json'),
      bundle = join(input, 'repository.bundle');
    await logged('pnpm', ['overlay:evaluate:incumbent', '--output', incumbent]);
    await logged('pnpm', [
      'overlay:evaluate:behavioral:manifest',
      '--revision',
      revision,
      '--incumbent',
      incumbent,
      '--output',
      manifestPath,
    ]);
    await logged('pnpm', ['overlay:evaluate:check', '--manifest', manifestPath]);
    await verify(input);
    for (const path of [incumbent, manifestPath]) {
      const stat = await fs.lstat(path);
      assert.ok(stat.isFile() && !stat.isSymbolicLink(), 'input must be regular');
      assert.equal(await fs.realpath(path), path);
    }
    const manifestBytes = await fs.readFile(manifestPath),
      manifest = JSON.parse(manifestBytes);
    assert.deepEqual(
      manifest,
      createBehavioralManifest({
        lyraRevision: revision,
        incumbentCharacterization: JSON.parse(await fs.readFile(incumbent, 'utf8')),
      }),
    );
    await clean(revision);
    await logged('git', ['bundle', 'create', bundle, 'HEAD']);
    await logged('git', ['bundle', 'verify', bundle]);
    assert.equal(
      (await logged('git', ['bundle', 'list-heads', bundle])).trim(),
      revision + ' HEAD',
      'bundle advertised HEAD',
    );
    const manifestSha256 = sha256(manifestBytes),
      bundleSha256 = sha256(await fs.readFile(bundle));
    const config = validateCompose(JSON.parse(await dc(['config', '--format', 'json'])), {
      project,
      input,
      work,
      evidence,
      node,
      revision,
      uid,
      gid,
    });
    composeStarted = true;
    await dc(['up', '--detach', '--no-build', '--pull', 'never', 'registry-proxy']);
    const proxyId = (await dc(['ps', '--quiet', 'registry-proxy'])).trim();
    assert.match(proxyId, /^[a-f0-9]{64}$/u);
    const [proxyInfo] = JSON.parse(await logged('docker', ['inspect', proxyId]));
    assert.equal(proxyInfo.Config.Labels['com.docker.compose.project'], project);
    assert.equal(proxyInfo.Config.Image, BROWSER_IMAGE);
    assert.equal(proxyInfo.State.Running, true);
    const networks = Object.values(config.networks)
      .map((n) => n.name)
      .sort();
    assert.deepEqual(Object.keys(proxyInfo.NetworkSettings.Networks).sort(), networks);
    for (const [key, network] of Object.entries(config.networks)) {
      const [info] = JSON.parse(await logged('docker', ['network', 'inspect', network.name]));
      assert.equal(info.Labels['com.docker.compose.project'], project);
      assert.equal(info.Internal, key === 'wave2-internal');
    }
    const evaluationOutput = await dc(['run', '--rm', '--no-deps', '--pull', 'never', 'wave2']);
    const preflight = {
      schemaVersion: 1,
      directRegistryBlocked: true,
      registryHttpsSucceeded: true,
      nonAllowlistedTargetsRejected: 7,
    };
    assert.ok(
      evaluationOutput.split('\n').some((line) => {
        try {
          return JSON.stringify(JSON.parse(line)) === JSON.stringify(preflight);
        } catch {
          return false;
        }
      }),
      'live registry preflight proof missing',
    );
    const summary = validateWaveSummary(trailingJson(evaluationOutput), revision);
    await verify(evidence);
    const coverage = await inspectAttemptCoverage({ evidence, revision, summary, fs });
    const checksums = join(output, 'attempt-checksums.json');
    await fs.writeFile(checksums, canonicalJson(coverage.attempts), { flag: 'wx', mode: 0o600 });
    await dc(['stop', '--timeout', '30', 'registry-proxy']);
    const proxySummary = validateProxySummary(
      trailingJson(await dc(['logs', '--no-color', '--no-log-prefix', 'registry-proxy'])),
    );
    await clean(revision);
    assert.equal(sha256(await fs.readFile(manifestPath)), manifestSha256, 'manifest changed');
    assert.equal(sha256(await fs.readFile(bundle)), bundleSha256, 'bundle changed');
    report = {
      schemaVersion: 1,
      revision,
      manifestSha256,
      bundleSha256,
      nodeSha256,
      evidenceRoot: evidence,
      project,
      results: summary,
      executionCounts: coverage.counts,
      attemptChecksumsSha256: sha256(canonicalJson(coverage.attempts)),
      proxy: proxySummary,
      preserved: { manifest: manifestPath, bundle, incumbent, node, logs, evidence, checksums },
    };
  } catch (error) {
    primary = error;
  }
  const cleanupErrors = [];
  if (composeStarted) {
    try {
      await stopProjectContainers({ project, run: logged });
      await dc(['down', '--timeout', '30'], { cleanup: true });
      const containers = await logged(
        'docker',
        ['ps', '--all', '--quiet', '--filter', `label=com.docker.compose.project=${project}`],
        { cleanup: true },
      );
      const networks = await logged(
        'docker',
        ['network', 'ls', '--quiet', '--filter', `label=com.docker.compose.project=${project}`],
        { cleanup: true },
      );
      assert.equal(containers.trim(), '', 'owned containers remain');
      assert.equal(networks.trim(), '', 'owned networks remain');
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  if (cleanupErrors.length === 0)
    try {
      await verify(output);
      await verify(work);
      assert.equal(
        await fs.readFile(join(work, '.owner'), 'utf8'),
        project,
        'work owner token changed',
      );
      await fs.rm(work, { recursive: true });
      try {
        await fs.lstat(work);
        throw new Error('work cleanup incomplete');
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    } catch (error) {
      cleanupErrors.push(error);
    }
  await verify(output);
  if (primary || cleanupErrors.length) {
    const errors = [primary, ...cleanupErrors].filter(Boolean);
    await fs.writeFile(
      join(output, 'failure.json'),
      JSON.stringify(
        {
          schemaVersion: 1,
          revision,
          project,
          errors: errors.map((e) => e.stack ?? String(e)),
          commands: records,
        },
        null,
        2,
      ) + '\n',
      { flag: 'wx', mode: 0o600 },
    );
    throw new AggregateError(
      errors,
      'Wave2 automation failed; preserved evidence: ' +
        output +
        '; ' +
        errors.map((e) => e.message).join('; '),
    );
  }
  await fs.writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n', {
    flag: 'wx',
    mode: 0o600,
  });
  return report;
}
export async function main(options = {}) {
  const controller = new AbortController();
  const stop = () => controller.abort();
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  try {
    const report = await runWave2Automation({ signal: controller.signal, ...options });
    (options.stdout ?? process.stdout).write(JSON.stringify(report, null, 2) + '\n');
    return 0;
  } catch (error) {
    (options.stderr ?? process.stderr).write(error.message + '\n');
    return 1;
  } finally {
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
  }
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url)
  process.exitCode = await main();
