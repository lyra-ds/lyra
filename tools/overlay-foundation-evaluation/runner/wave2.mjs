import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstat, mkdir, open, readdir, readFile, realpath } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { promisify, isDeepStrictEqual as equal } from 'node:util';
import { WAVE_2_SCENARIOS } from '../contracts/wave2.mjs';
import { BEHAVIORAL_WAVE_CELLS } from '../contracts/cells.mjs';
import { validateWave2Observation } from '../fixtures/wave2/protocol.mjs';
import { summarizeAttempts, writeAttempt } from '../evidence/results.mjs';
import { runCorePreflight, loadValidatedAdapter } from './core.mjs';
import { resolveContractEntry } from './adapter-entry.mjs';
import { createOwnedRunRoot, cleanupOwnedRunRoot } from './isolation.mjs';
import { verifyRegularFile } from './artifacts.mjs';
import { prepareWave2Fixture } from './wave2-fixture.mjs';
import {
  runWave2Cell,
  WAVE_2_CELL_POLICIES,
  wave2FixtureRequest,
  preflightWave2BrowserInputs,
} from './wave2-cells.mjs';
import { runRegistryPreflight } from '../scripts/registry-proxy.mjs';
import {
  manifestSha256,
  readAttemptFile,
  loadCoreSummary,
  readCoreAttempt,
  verifyCoreEvidence,
  requireCleanRepository,
  commandText,
  absolutePath,
  decodeJson,
} from './modal.mjs';

const command = promisify(execFile);
const CONTRACTS = Object.freeze(['OF-ANCHORED', 'OF-MENU', 'OF-TOOLTIP']);
const FIELDS = Object.freeze([
  'roles',
  'relationships',
  'states',
  'focus',
  'events',
  'announcements',
  'cleanup',
]);
const runIdFor = (manifest) => 'wave2-' + manifest.lyraRevision.slice(0, 12);
function fatal(error, code = 'policy') {
  return Object.assign(
    new Error(error instanceof Error ? error.message : String(error), { cause: error }),
    { classification: 'policy', scope: 'run', code },
  );
}
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const INSTALLATION_KEYS = [
  'fixtureManifest',
  'lockfile',
  'resolvedGraph',
  'audit',
  'licenseInventory',
];
async function fixtureEvidence(fixture) {
  if (
    !fixture.sourceHashes ||
    !Object.keys(fixture.sourceHashes).length ||
    !fixture.buildOutputs ||
    !Object.keys(fixture.buildOutputs).length
  )
    throw fatal('fixture source/build provenance missing');
  for (const record of [...Object.values(fixture.sourceHashes), fixture.buildConfig])
    await verifyRegularFile({ path: record.path, expectedSha256: record.sha256 });
  for (const [path, expectedSha256] of Object.entries(fixture.buildOutputs))
    await verifyRegularFile({ path, expectedSha256 });
  const retained = {};
  for (const key of INSTALLATION_KEYS) {
    const path = fixture[key + 'Path'],
      expectedSha256 = fixture[key + 'Sha256'];
    await verifyRegularFile({ path, expectedSha256 });
    const content = new TextDecoder('utf-8', { fatal: true }).decode(await readFile(path));
    if (sha256(content) !== expectedSha256)
      throw fatal('fixture evidence changed during retention');
    retained[key] = { sha256: expectedSha256, content };
  }
  const configContent = await readFile(fixture.buildConfig.path, 'utf8');
  if (sha256(configContent) !== fixture.buildConfig.sha256)
    throw fatal('build config changed during retention');
  return {
    sourceHashes: fixture.sourceHashes,
    buildConfig: { ...fixture.buildConfig, content: configContent },
    buildOutputs: fixture.buildOutputs,
    toolEvidence: fixture.toolEvidence,
    installation: retained,
  };
}
function validateRetained(observed) {
  for (const fixture of observed?.fixtures ?? []) {
    for (const key of INSTALLATION_KEYS) {
      const value = fixture.installation?.[key];
      if (typeof value?.content !== 'string' || sha256(value.content) !== value.sha256)
        throw fatal('retained fixture evidence checksum mismatch');
    }
    if (
      typeof fixture.buildConfig?.content !== 'string' ||
      sha256(fixture.buildConfig.content) !== fixture.buildConfig.sha256
    )
      throw fatal('retained build configuration checksum mismatch');
  }
}
function assertManifest(manifest) {
  if (
    !manifest?.candidates?.every((c) => equal(c.contracts, ['OF-MODAL', ...CONTRACTS])) ||
    !equal(
      manifest?.candidates?.map((c) => c.id),
      ['incumbent', 'radix', 'base-ui', 'zag'],
    ) ||
    !/^[a-f0-9]{40}$/u.test(manifest?.lyraRevision ?? '')
  )
    throw fatal('Wave2 requires exact four candidates and four behavioral contracts');
}
const binding = (manifest) => ({
  schemaVersion: 1,
  recordType: 'wave2-run-binding',
  runId: runIdFor(manifest),
  coreRunId: 'core-' + manifest.lyraRevision.slice(0, 12),
  lyraRevision: manifest.lyraRevision,
  manifestSha256: manifestSha256(manifest),
});
async function exists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}
async function regular(path) {
  const info = await lstat(path);
  if (!info.isFile() || info.isSymbolicLink() || (await realpath(path)) !== resolve(path))
    throw fatal('evidence must be canonical regular files');
}
async function directories(path) {
  const entries = await readdir(path, { withFileTypes: true });
  if (entries.some((e) => !e.isDirectory()) || (await realpath(path)) !== path)
    throw fatal('evidence tree must contain canonical directories');
  return entries.map((e) => e.name);
}
function attemptDirectory(root, runId, candidateId, scenario, cellId) {
  return join(
    root,
    'attempts',
    runId,
    'scenario',
    candidateId,
    scenario.contractId,
    scenario.scenarioId,
    cellId,
  );
}
async function attemptsFor({ evidenceRoot, runId, candidateId, scenario, cellId, coreAttempt }) {
  const path = attemptDirectory(evidenceRoot, runId, candidateId, scenario, cellId);
  if (!(await exists(path))) return [];
  if ((await realpath(path)) !== path) throw fatal('attempt directory is not canonical');
  const files = await readdir(path, { withFileTypes: true });
  if (files.some((f) => !f.isFile() || !/^attempt-[1-9][0-9]*\.json$/u.test(f.name)))
    throw fatal('invalid attempt filename or type');
  const sorted = files
      .map((f) => ({ name: f.name, number: Number(f.name.slice(8, -5)) }))
      .sort((a, b) => a.number - b.number),
    result = [];
  for (const [index, file] of sorted.entries()) {
    if (file.number !== index + 1) throw fatal('attempt numbers must be contiguous from attempt 1');
    const attempt = await readAttemptFile(join(path, file.name), 'Wave2 attempt');
    if (
      attempt.recordType !== 'scenario' ||
      attempt.runId !== runId ||
      attempt.candidateId !== candidateId ||
      attempt.contractId !== scenario.contractId ||
      attempt.scenarioId !== scenario.scenarioId ||
      attempt.cellId !== cellId ||
      attempt.attemptNumber !== file.number ||
      !equal(attempt.expected, scenario.expected) ||
      !equal(attempt.artifactPaths, coreAttempt.artifactPaths)
    )
      throw fatal('attempt identity conflicts with manifest or core attempt 1');
    validateRetained(attempt.observed);
    result.push(attempt);
  }
  if (!result.length) throw fatal('attempt cell must not be empty');
  return result;
}

export async function inspectWave2Evidence({ evidenceRoot, manifest }) {
  assertManifest(manifest);
  const root = absolutePath(evidenceRoot, 'evidenceRoot');
  if ((await realpath(root)) !== root) throw fatal('evidence root must be canonical');
  const expected = binding(manifest),
    path = join(root, 'runs', expected.runId + '.json');
  const hasCore = await exists(join(root, 'attempts', expected.coreRunId)),
    hasWave = await exists(join(root, 'attempts', expected.runId)),
    hasBinding = await exists(path);
  if (!hasCore && !hasWave && !hasBinding) return { resume: false };
  if (!hasCore || !hasBinding) throw fatal('conflicting evidence without complete Wave2 binding');
  await regular(path);
  if (!equal(decodeJson(await readFile(path), 'Wave2 binding'), expected))
    throw fatal('Wave2 binding conflicts with exact manifest');
  const core = await loadCoreSummary({ evidenceRoot: root, manifest });
  const byCandidate = new Map();
  for (const candidate of manifest.candidates) {
    const summary = core.candidates.find((c) => c.candidateId === candidate.id);
    const attempt = await readCoreAttempt({
      candidate,
      coreCandidate: summary,
      coreRunId: core.runId,
      evidenceRoot: root,
    });
    await verifyCoreEvidence(attempt, root, { verifyRegularFile });
    byCandidate.set(candidate.id, attempt);
  }
  if (hasWave) {
    const waveRoot = join(root, 'attempts', expected.runId);
    if (!equal(await directories(waveRoot), ['scenario']))
      throw fatal('Wave2 run contains only scenario evidence');
    const candidateRoot = join(waveRoot, 'scenario');
    for (const candidateId of await directories(candidateRoot)) {
      if (!byCandidate.has(candidateId)) throw fatal('unknown candidate in Wave2 evidence');
      const contractRoot = join(candidateRoot, candidateId);
      for (const contractId of await directories(contractRoot)) {
        if (!CONTRACTS.includes(contractId)) throw fatal('unknown contract in Wave2 evidence');
        const scenarioRoot = join(contractRoot, contractId);
        for (const scenarioId of await directories(scenarioRoot)) {
          const scenario = WAVE_2_SCENARIOS.find(
            (s) => s.scenarioId === scenarioId && s.contractId === contractId,
          );
          if (!scenario) throw fatal('unknown scenario in Wave2 evidence');
          const cellRoot = join(scenarioRoot, scenarioId);
          for (const cellId of await directories(cellRoot)) {
            if (!scenario.requiredCells.includes(cellId))
              throw fatal('conflicting scenario cell in Wave2 evidence');
            await attemptsFor({
              evidenceRoot: root,
              runId: expected.runId,
              candidateId,
              scenario,
              cellId,
              coreAttempt: byCandidate.get(candidateId),
            });
          }
        }
      }
    }
  }
  return { resume: true, core, binding: expected };
}

export function evaluateWave2Scenario({ cellId, scenario, observations }) {
  const policy = WAVE_2_CELL_POLICIES[cellId];
  if (
    !Array.isArray(observations) ||
    !equal(
      observations.map((o) => o.reactVersion),
      policy?.reactVersions,
    )
  )
    throw fatal('observation versions must equal exact cell policy');
  return observations
    .map(({ observation }) => {
      const errors = validateWave2Observation(observation);
      if (errors.length) throw fatal('invalid Wave2 observation: ' + errors.join('; '));
      const { trace, diagnostics } = observation;
      if (
        policy.axe &&
        (!Array.isArray(diagnostics.axe?.violations) || diagnostics.axe.violations.length !== 0)
      )
        return false;
      if (
        diagnostics.executionCompleted !== true ||
        diagnostics.cleanupObserved !== (cellId !== 'ssr')
      )
        return false;
      if (cellId === 'ssr') {
        if (
          trace.length !== 1 ||
          trace[0].phase !== 'server-render' ||
          !equal(diagnostics.renderOperations, scenario.operations)
        )
          return false;
      } else {
        if (
          trace.length !== scenario.operations.length + 2 ||
          trace[0].phase !== 'before-operations' ||
          trace.at(-1).phase !== 'after-cleanup'
        )
          return false;
        if (
          !Array.isArray(diagnostics.actions) ||
          diagnostics.actions.length !== scenario.operations.length
        )
          return false;
        for (const [i, operation] of scenario.operations.entries()) {
          const action = diagnostics.actions[i],
            entry = trace[i + 1];
          if (
            entry.phase !== 'after-operation' ||
            entry.operationIndex !== i ||
            !equal(entry.operation, operation) ||
            !equal(
              Object.fromEntries(Object.keys(operation).map((k) => [k, action[k]])),
              operation,
            ) ||
            action.controlFound !== true ||
            action.completed !== true ||
            action.dispatched !== (operation.operation !== 'advanceTime')
          )
            return false;
        }
      }
      const indexes = Object.fromEntries(FIELDS.map((k) => [k, 0]));
      const results = [];
      for (const entry of trace) {
        const probes = scenario.probes.filter(
          (p) =>
            p.phase === entry.phase &&
            (p.phase !== 'after-operation' || p.operationIndex === entry.operationIndex),
        );
        const actual = entry.snapshot.probes ?? [];
        if (
          !equal(
            actual.map((p) => [p.id, p.category]),
            probes.map((p) => [p.id, p.category]),
          )
        )
          return false;
        results.push(...actual);
      }
      for (const probe of scenario.probes) {
        const fact = results.find((p) => p.id === probe.id)?.fact;
        const expected =
          probe.category === 'focus'
            ? scenario.expected.focus
            : scenario.expected[probe.category][indexes[probe.category]++];
        if (!equal(fact, expected)) return false;
      }
      return equal(Object.fromEntries(FIELDS.map((k) => [k, observation[k]])), scenario.expected);
    })
    .every(Boolean);
}

async function resolveEntry({ candidate, index, contractId, repositoryRoot }) {
  const adapter = await loadValidatedAdapter(candidate, index, repositoryRoot);
  return resolveContractEntry({
    adapterModule: adapter.module,
    adapterPath: adapter.path,
    contractId,
    repositoryRoot,
  });
}
const defaults = {
  runCorePreflight,
  prepareWave2Fixture,
  runWave2Cell,
  createOwnedRunRoot,
  cleanupOwnedRunRoot,
  verifyRegularFile,
  writeAttempt,
  resolveCandidateEntry: resolveEntry,
  preflight: async ({ playwright }) => ({
    network: await runRegistryPreflight(),
    native: await preflightWave2BrowserInputs({ playwright }),
  }),
};
async function repositoryProof(root, manifest, runCommand) {
  await requireCleanRepository(root, runCommand);
  if (
    commandText(await runCommand('git', ['rev-parse', 'HEAD'], { cwd: root })).trim() !==
    manifest.lyraRevision
  )
    throw fatal('repository revision must equal manifest revision', 'repository');
}
async function writeBinding(root, manifest) {
  const directory = join(root, 'runs');
  await mkdir(directory, { recursive: true, mode: 0o700 });
  if ((await realpath(directory)) !== directory) throw fatal('binding directory must be canonical');
  const handle = await open(join(directory, runIdFor(manifest) + '.json'), 'wx', 0o600);
  try {
    await handle.writeFile(JSON.stringify(binding(manifest)) + '\n');
  } finally {
    await handle.close();
  }
}

async function executeWave2(
  {
    manifest,
    repositoryRoot,
    tmpdir,
    evidenceRoot,
    resume = false,
    playwright,
    fetchImpl,
    runCommand = (cmd, args, options) => command(cmd, args, { ...options, maxBuffer: 50_000_000 }),
  },
  dependencies = {},
) {
  assertManifest(manifest);
  const ops = { ...defaults, ...dependencies },
    root = absolutePath(repositoryRoot, 'repositoryRoot'),
    temporary = absolutePath(tmpdir, 'tmpdir'),
    evidence = absolutePath(evidenceRoot, 'evidenceRoot');
  await repositoryProof(root, manifest, runCommand);
  const state = await inspectWave2Evidence({ evidenceRoot: evidence, manifest });
  if (state.resume !== resume) throw fatal('consistent evidence requires validated resume path');
  const preflight = await ops.preflight({ playwright });
  const core = resume
    ? state.core
    : await ops.runCorePreflight({
        manifest,
        repositoryRoot: root,
        tmpdir: temporary,
        evidenceRoot: evidence,
        fetchImpl,
        runCommand,
      });
  await repositoryProof(root, manifest, runCommand);
  if (!resume) await writeBinding(evidence, manifest);
  const runId = runIdFor(manifest),
    summaries = [];
  for (const [index, candidate] of manifest.candidates.entries()) {
    const coreCandidate = core.candidates.filter((c) => c.candidateId === candidate.id);
    if (coreCandidate.length !== 1) throw fatal('core summary candidate identity mismatch');
    const coreAttempt = await readCoreAttempt({
      candidate,
      coreCandidate: coreCandidate[0],
      coreRunId: core.runId,
      evidenceRoot: evidence,
    });
    const verified = await verifyCoreEvidence(coreAttempt, evidence, ops);
    const counts = () => ({ PASS: 0, FAIL: 0, unavailable: 0 }),
      summary = {
        candidateId: candidate.id,
        counts: counts(),
        retries: 0,
        contracts: CONTRACTS.map((contractId) => ({ contractId, counts: counts(), retries: 0 })),
      };
    for (const contractId of CONTRACTS) {
      const contractSummary = summary.contracts.find((c) => c.contractId === contractId);
      const adapterEntry =
        coreAttempt.result === 'PASS'
          ? await ops.resolveCandidateEntry({ candidate, index, contractId, repositoryRoot: root })
          : undefined;
      for (const cellId of BEHAVIORAL_WAVE_CELLS)
        for (const scenario of WAVE_2_SCENARIOS.filter(
          (s) => s.contractId === contractId && s.requiredCells.includes(cellId),
        )) {
          const policy = WAVE_2_CELL_POLICIES[cellId],
            owned = [],
            fixtures = new Map();
          let result, classification, observed, primary, candidateError;
          try {
            if (coreAttempt.result === 'FAIL') {
              result = 'unavailable';
              classification = coreAttempt.classification;
              observed = {
                message: coreAttempt.observed.message,
                preflightResult: coreAttempt.result,
                preflightStage: coreAttempt.stage,
              };
            } else {
              for (const reactVersion of policy.reactVersions) {
                const ownership = await ops.createOwnedRunRoot({
                  tmpdir: temporary,
                  runId:
                    runId +
                    '-' +
                    candidate.id +
                    '-' +
                    contractId.toLowerCase() +
                    '-' +
                    cellId +
                    '-' +
                    reactVersion,
                });
                owned.push(ownership);
                fixtures.set(
                  reactVersion,
                  await ops.prepareWave2Fixture({
                    candidate,
                    artifacts: verified.artifacts,
                    adapterEntry,
                    contractId,
                    request: wave2FixtureRequest(cellId, reactVersion, scenario),
                    reactVersion,
                    runRoot: ownership.runRoot,
                    repositoryRoot: root,
                    runCommand,
                  }),
                );
                await fixtureEvidence(fixtures.get(reactVersion));
              }
              const observations = await ops.runWave2Cell({
                candidate,
                cellId,
                fixtures,
                playwright,
                policy,
                scenario,
              });
              result = evaluateWave2Scenario({ cellId, scenario, observations }) ? 'PASS' : 'FAIL';
              if (result === 'FAIL') classification = 'product';
              observed = {
                observations,
                preflight,
              };
            }
          } catch (error) {
            if (
              error?.scope === 'candidate' &&
              ['product', 'infrastructure'].includes(error.classification)
            ) {
              result = error.classification === 'product' ? 'FAIL' : 'unavailable';
              classification = error.classification;
              observed = { message: error.message };
              candidateError = error;
            } else primary = fatal(error);
          } finally {
            const errors = [];
            const retained = [];
            for (const [reactVersion, fixture] of fixtures)
              try {
                retained.push({ reactVersion, ...(await fixtureEvidence(fixture)) });
              } catch (error) {
                errors.push(error);
              }
            if (observed && retained.length) {
              observed.fixtures = retained;
              observed.preflight = preflight;
            }
            for (const ownership of owned.reverse())
              try {
                await ops.cleanupOwnedRunRoot({ tmpdir: temporary, ...ownership });
              } catch (error) {
                errors.push(error);
              }
            if (errors.length)
              primary = Object.assign(
                new AggregateError(
                  primary || candidateError ? [primary ?? candidateError, ...errors] : errors,
                  'Wave2 owned fixture cleanup failed',
                ),
                { scope: 'run', classification: 'policy' },
              );
            try {
              await verifyCoreEvidence(coreAttempt, evidence, ops);
              await repositoryProof(root, manifest, runCommand);
            } catch (error) {
              primary = primary
                ? Object.assign(
                    new AggregateError([primary, error], 'Wave2 execution and verification failed'),
                    { scope: 'run', classification: 'policy' },
                  )
                : fatal(error);
            }
          }
          if (primary) throw primary;
          try {
            const prior = await attemptsFor({
              evidenceRoot: evidence,
              runId,
              candidateId: candidate.id,
              scenario,
              cellId,
              coreAttempt,
            });
            const attempt = {
              schemaVersion: 1,
              recordType: 'scenario',
              runId,
              candidateId: candidate.id,
              contractId,
              scenarioId: scenario.scenarioId,
              cellId,
              attemptNumber: prior.length + 1,
              result,
              ...(classification ? { classification } : {}),
              expected: scenario.expected,
              observed,
              artifactPaths: coreAttempt.artifactPaths,
            };
            await ops.writeAttempt({ evidenceRoot: evidence, attempt });
            const effective = summarizeAttempts([...prior, attempt]);
            summary.counts[effective.effectiveResult]++;
            contractSummary.counts[effective.effectiveResult]++;
            summary.retries += effective.retryCount;
            contractSummary.retries += effective.retryCount;
          } catch (error) {
            throw fatal(error, 'evidence');
          }
          await repositoryProof(root, manifest, runCommand);
        }
    }
    summaries.push(summary);
  }
  return { schemaVersion: 1, runId, candidates: summaries };
}
export async function runWave2(input, dependencies = {}) {
  try {
    return await executeWave2(input, dependencies);
  } catch (error) {
    if (error?.scope === 'run') throw error;
    throw fatal(error);
  }
}
