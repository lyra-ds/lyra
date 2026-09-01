import { execFile } from 'node:child_process';
import { readdir, readFile, realpath } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { promisify, isDeepStrictEqual } from 'node:util';

import { FAILURE_CLASSIFICATIONS, isPlainRecord } from '../contracts/protocol.mjs';
import { MODAL_WAVE_CELLS, modalScenariosForCell } from '../contracts/modal.mjs';
import { validateModalObservation } from '../fixtures/modal/protocol.mjs';
import { summarizeAttempts, validateAttempt, writeAttempt } from '../evidence/results.mjs';
import { verifyRegularFile } from './artifacts.mjs';
import { resolveContractEntry } from './adapter-entry.mjs';
import { loadValidatedAdapter, runCorePreflight } from './core.mjs';
import { cleanupOwnedRunRoot, createOwnedRunRoot } from './isolation.mjs';
import { MODAL_CELL_POLICIES, runModalCell } from './modal-cells.mjs';
import { prepareModalFixture } from './modal-fixture.mjs';

const execFilePromise = promisify(execFile);
const classifications = new Set(FAILURE_CLASSIFICATIONS);
const observationKeys = Object.freeze([
  'roles',
  'relationships',
  'states',
  'focus',
  'events',
  'announcements',
  'cleanup',
]);

async function defaultRunCommand(command, args, options = {}) {
  return execFilePromise(command, args, { ...options, maxBuffer: 50_000_000 });
}

async function defaultResolveCandidateEntry({ candidate, index, repositoryRoot }) {
  const adapter = await loadValidatedAdapter(candidate, index, repositoryRoot);
  return resolveContractEntry({
    adapterModule: adapter.module,
    adapterPath: adapter.path,
    contractId: 'OF-MODAL',
    repositoryRoot,
  });
}

const defaultDependencies = Object.freeze({
  cellPolicies: MODAL_CELL_POLICIES,
  cleanupOwnedRunRoot,
  createOwnedRunRoot,
  prepareModalFixture,
  resolveCandidateEntry: defaultResolveCandidateEntry,
  runCorePreflight,
  runModalCell,
  scenariosForCell: modalScenariosForCell,
  verifyRegularFile,
  writeAttempt,
});

function absolutePath(value, name) {
  if (typeof value !== 'string' || !isAbsolute(value)) throw new Error(`${name} must be absolute`);
  return resolve(value);
}

function commandText(result) {
  const value = isPlainRecord(result) && Object.hasOwn(result, 'stdout') ? result.stdout : result;
  if (typeof value === 'string') return value;
  if (ArrayBuffer.isView(value)) {
    return Buffer.from(value.buffer, value.byteOffset, value.byteLength).toString('utf8');
  }
  throw new Error('repository command must return stdout bytes or a string');
}

async function requireCleanRepository(repositoryRoot, runCommand) {
  const status = commandText(
    await runCommand('git', ['status', '--porcelain=v1', '--untracked-files=all'], {
      cwd: repositoryRoot,
    }),
  );
  if (status !== '') {
    throw Object.assign(new Error('repository worktree changed during modal evaluation'), {
      classification: 'policy',
      scope: 'run',
    });
  }
}

function decodeJson(bytes, label) {
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  if (text.startsWith('\uFEFF')) throw new Error(`${label} must not contain a BOM`);
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} must be valid JSON`, { cause: error });
  }
}

async function readAttemptFile(path, label) {
  const attempt = decodeJson(await readFile(path), label);
  const errors = validateAttempt(attempt);
  if (errors.length !== 0) throw new Error(`${label} is invalid:\n${errors.join('\n')}`);
  return attempt;
}

async function readCoreAttempt({ candidate, coreCandidate, coreRunId, evidenceRoot }) {
  const path = join(
    evidenceRoot,
    'attempts',
    coreRunId,
    'preflight',
    candidate.id,
    coreCandidate.stage,
    'attempt-1.json',
  );
  const attempt = await readAttemptFile(path, `core attempt for ${candidate.id}`);
  if (
    attempt.recordType !== 'preflight' ||
    attempt.runId !== coreRunId ||
    attempt.candidateId !== candidate.id ||
    attempt.stage !== coreCandidate.stage ||
    attempt.attemptNumber !== 1 ||
    attempt.result !== coreCandidate.result ||
    attempt.classification !== coreCandidate.classification
  ) {
    throw new Error(`core attempt for ${candidate.id} does not match the core summary`);
  }
  if (attempt.result === 'FAIL' && attempt.observed.scope !== 'candidate') {
    throw new Error(`core failure for ${candidate.id} must remain candidate-local`);
  }
  return attempt;
}

function evidenceHashes(attempt) {
  const hashes = new Map();
  const add = (path, sha256) => {
    if (typeof path === 'string' && typeof sha256 === 'string') hashes.set(path, sha256);
  };
  if (Array.isArray(attempt.observed.artifacts)) {
    for (const artifact of attempt.observed.artifacts) add(artifact?.path, artifact?.sha256);
  }
  for (const [key, path] of Object.entries(attempt.observed)) {
    if (key.endsWith('Path')) add(path, attempt.observed[`${key.slice(0, -4)}Sha256`]);
  }
  for (const path of attempt.artifactPaths) {
    if (!hashes.has(path)) {
      throw new Error(`core evidence path has no immutable checksum: ${path}`);
    }
  }
  return hashes;
}

async function verifyCoreEvidence(attempt, evidenceRoot, operations) {
  const hashes = evidenceHashes(attempt);
  for (const relativePath of attempt.artifactPaths) {
    await operations.verifyRegularFile({
      path: join(evidenceRoot, relativePath),
      expectedSha256: hashes.get(relativePath),
    });
  }
}

function absoluteArtifacts(attempt, evidenceRoot) {
  if (!Array.isArray(attempt.observed.artifacts) || attempt.observed.artifacts.length === 0) {
    throw new Error('passing core attempt must preserve inspected artifacts');
  }
  return attempt.observed.artifacts.map((artifact) => ({
    ...artifact,
    path: join(evidenceRoot, artifact.path),
  }));
}

function scenarioDirectory(evidenceRoot, runId, candidateId, scenarioId, cellId) {
  return join(
    evidenceRoot,
    'attempts',
    runId,
    'scenario',
    candidateId,
    'OF-MODAL',
    scenarioId,
    cellId,
  );
}

async function readScenarioAttempts({ evidenceRoot, runId, candidateId, scenarioId, cellId }) {
  const directory = scenarioDirectory(evidenceRoot, runId, candidateId, scenarioId, cellId);
  let names;
  try {
    names = await readdir(directory);
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
  const numbered = names.map((name) => {
    const match = /^attempt-(\d+)\.json$/u.exec(name);
    if (match === null) throw new Error(`unexpected evidence entry in ${directory}`);
    return { name, number: Number(match[1]) };
  });
  numbered.sort((left, right) => left.number - right.number);
  const attempts = [];
  for (const entry of numbered) {
    const attempt = await readAttemptFile(join(directory, entry.name), 'modal scenario attempt');
    if (
      attempt.recordType !== 'scenario' ||
      attempt.runId !== runId ||
      attempt.candidateId !== candidateId ||
      attempt.contractId !== 'OF-MODAL' ||
      attempt.scenarioId !== scenarioId ||
      attempt.cellId !== cellId ||
      attempt.attemptNumber !== entry.number
    ) {
      throw new Error('modal scenario attempt identity does not match its evidence path');
    }
    attempts.push(attempt);
  }
  return attempts;
}

function normalizedFields(observation) {
  return Object.fromEntries(observationKeys.map((key) => [key, observation[key]]));
}

function observedRecord(observations) {
  if (observations.length === 1) return observations[0].observation;
  return {
    reactVersions: Object.fromEntries(
      observations.map(({ reactVersion, observation }) => [reactVersion, observation]),
    ),
  };
}

function compareObservations(scenario, observations) {
  if (!Array.isArray(observations) || observations.length === 0) {
    throw new Error('modal observation set must be a non-empty array');
  }
  for (const [index, entry] of observations.entries()) {
    if (!isPlainRecord(entry) || typeof entry.reactVersion !== 'string') {
      throw new Error(`modal observation set[${index}] must identify a React version`);
    }
    const errors = validateModalObservation(entry.observation);
    if (errors.length !== 0) throw new Error(`modal observation is invalid:\n${errors.join('\n')}`);
  }
  return observations.every(({ observation }) =>
    isDeepStrictEqual(normalizedFields(observation), scenario.expected),
  );
}

function unavailableDraft({ candidate, coreAttempt, scenario, cellId, classification, message }) {
  return {
    candidate,
    scenario,
    cellId,
    result: 'unavailable',
    classification,
    observed: {
      message,
      preflightResult: coreAttempt.result,
      preflightStage: coreAttempt.stage,
    },
    artifactPaths: coreAttempt.artifactPaths,
  };
}

function everyScenarioDraft({
  candidate,
  coreAttempt,
  cellPolicies,
  scenariosForCell,
  classification,
  message,
}) {
  const drafts = [];
  for (const cellId of Object.keys(cellPolicies)) {
    for (const scenario of scenariosForCell(cellId)) {
      drafts.push(
        unavailableDraft({ candidate, coreAttempt, scenario, cellId, classification, message }),
      );
    }
  }
  return drafts;
}

function knownBoundary(error) {
  return (
    error !== null &&
    (typeof error === 'object' || typeof error === 'function') &&
    classifications.has(error.classification) &&
    (error.scope === 'candidate' || error.scope === 'run')
  );
}

function hasBoundaryMetadata(error) {
  return (
    error !== null &&
    (typeof error === 'object' || typeof error === 'function') &&
    (Object.hasOwn(error, 'classification') || Object.hasOwn(error, 'scope'))
  );
}

function fixtureBoundaryIsRunFatal(error) {
  return /ownership|owned run root|repository worktree|evidence|cleanup|identity uncertain/iu.test(
    error instanceof Error ? error.message : String(error),
  );
}

async function prepareCandidateFixtures({
  candidate,
  artifacts,
  adapterEntry,
  repositoryRoot,
  tmpdir,
  runId,
  runCommand,
  operations,
  fixtures,
  ownedRoots,
}) {
  for (const reactVersion of ['18.3.1', '19.2.8']) {
    const suffix = reactVersion.startsWith('18') ? 'react18' : 'react19';
    const owned = await operations.createOwnedRunRoot({
      tmpdir,
      runId: `${runId}-${candidate.id}-${suffix}`,
    });
    ownedRoots.push(owned);
    fixtures.set(
      reactVersion,
      await operations.prepareModalFixture({
        candidate,
        artifacts,
        adapterEntry,
        reactVersion,
        runRoot: owned.runRoot,
        repositoryRoot,
        runCommand,
      }),
    );
  }
}

async function cleanupCandidateRoots({ ownedRoots, tmpdir, operations, primaryError }) {
  const cleanupErrors = [];
  for (const owned of [...ownedRoots].reverse()) {
    try {
      await operations.cleanupOwnedRunRoot({ tmpdir, ...owned });
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  if (cleanupErrors.length > 0) {
    const details = cleanupErrors
      .map((error) => (error instanceof Error ? error.message : String(error)))
      .join('; ');
    throw Object.assign(
      new AggregateError(
        primaryError === undefined ? cleanupErrors : [primaryError, ...cleanupErrors],
        `modal candidate execution cleanup is uncertain: ${details}`,
      ),
      { classification: 'policy', scope: 'run' },
    );
  }
}

async function persistDraft({ draft, evidenceRoot, runId, operations }) {
  const existing = await readScenarioAttempts({
    evidenceRoot,
    runId,
    candidateId: draft.candidate.id,
    scenarioId: draft.scenario.scenarioId,
    cellId: draft.cellId,
  });
  const attempt = {
    schemaVersion: 1,
    recordType: 'scenario',
    runId,
    candidateId: draft.candidate.id,
    contractId: 'OF-MODAL',
    scenarioId: draft.scenario.scenarioId,
    cellId: draft.cellId,
    attemptNumber: existing.length + 1,
    result: draft.result,
    ...(draft.classification === undefined ? {} : { classification: draft.classification }),
    expected: draft.scenario.expected,
    observed: draft.observed,
    artifactPaths: draft.artifactPaths,
  };
  await operations.writeAttempt({ evidenceRoot, attempt });
  return summarizeAttempts([...existing, attempt]);
}

function emptyCandidateSummary(candidateId) {
  return {
    candidateId,
    counts: { PASS: 0, FAIL: 0, unavailable: 0 },
    retries: 0,
  };
}

export async function runModalWave(
  {
    manifest,
    repositoryRoot,
    tmpdir,
    evidenceRoot,
    playwright,
    fetchImpl,
    runCommand = defaultRunCommand,
  },
  dependencies = {},
) {
  const operations = { ...defaultDependencies, ...dependencies };
  const root = absolutePath(repositoryRoot, 'repositoryRoot');
  const temporaryDirectory = absolutePath(tmpdir, 'tmpdir');
  const evidencePath = absolutePath(evidenceRoot, 'evidenceRoot');
  const core = await operations.runCorePreflight({
    manifest,
    repositoryRoot: root,
    tmpdir: temporaryDirectory,
    evidenceRoot: evidencePath,
    fetchImpl,
    runCommand,
  });
  const canonicalEvidence = await realpath(evidencePath);
  if (canonicalEvidence !== evidencePath) throw new Error('evidenceRoot path must be canonical');
  await requireCleanRepository(root, runCommand);
  const runId = `modal-${manifest.lyraRevision.slice(0, 12)}`;
  const candidateSummaries = [];

  for (const [index, candidate] of manifest.candidates.entries()) {
    const summary = emptyCandidateSummary(candidate.id);
    const coreCandidates = core.candidates.filter(
      ({ candidateId }) => candidateId === candidate.id,
    );
    if (coreCandidates.length !== 1)
      throw new Error(`core summary must contain ${candidate.id} once`);
    const coreCandidate = coreCandidates[0];
    const coreAttempt = await readCoreAttempt({
      candidate,
      coreCandidate,
      coreRunId: core.runId,
      evidenceRoot: canonicalEvidence,
    });
    await verifyCoreEvidence(coreAttempt, canonicalEvidence, operations);
    let drafts = [];

    if (coreAttempt.result === 'FAIL') {
      drafts = everyScenarioDraft({
        candidate,
        coreAttempt,
        cellPolicies: operations.cellPolicies,
        scenariosForCell: operations.scenariosForCell,
        classification: coreAttempt.classification,
        message: coreAttempt.observed.message,
      });
    } else {
      const artifacts = absoluteArtifacts(coreAttempt, canonicalEvidence);
      const prepared = { fixtures: new Map(), ownedRoots: [] };
      let primaryError;
      try {
        const adapterEntry = await operations.resolveCandidateEntry({
          candidate,
          index,
          repositoryRoot: root,
        });
        await prepareCandidateFixtures({
          candidate,
          artifacts,
          adapterEntry,
          repositoryRoot: root,
          tmpdir: temporaryDirectory,
          runId,
          runCommand,
          operations,
          fixtures: prepared.fixtures,
          ownedRoots: prepared.ownedRoots,
        });
        for (const [cellId, policy] of Object.entries(operations.cellPolicies)) {
          for (const scenario of operations.scenariosForCell(cellId)) {
            try {
              const observations = await operations.runModalCell({
                candidate,
                cellId,
                fixtures: prepared.fixtures,
                playwright,
                policy,
                scenario,
              });
              const passed = compareObservations(scenario, observations);
              drafts.push({
                candidate,
                scenario,
                cellId,
                result: passed ? 'PASS' : 'FAIL',
                ...(passed ? {} : { classification: 'product' }),
                observed: observedRecord(observations),
                artifactPaths: coreAttempt.artifactPaths,
              });
            } catch (error) {
              if (!knownBoundary(error)) throw error;
              if (error.scope === 'run') throw error;
              drafts.push({
                candidate,
                scenario,
                cellId,
                result: error.classification === 'product' ? 'FAIL' : 'unavailable',
                classification: error.classification,
                observed: { message: error.message },
                artifactPaths: coreAttempt.artifactPaths,
              });
            }
            await requireCleanRepository(root, runCommand);
          }
        }
      } catch (error) {
        primaryError = error;
      }

      try {
        await cleanupCandidateRoots({
          ownedRoots: prepared.ownedRoots,
          tmpdir: temporaryDirectory,
          operations,
          primaryError,
        });
      } catch (error) {
        throw error;
      }
      await verifyCoreEvidence(coreAttempt, canonicalEvidence, operations);
      if (primaryError !== undefined) {
        if (
          knownBoundary(primaryError) ||
          hasBoundaryMetadata(primaryError) ||
          fixtureBoundaryIsRunFatal(primaryError)
        ) {
          throw primaryError;
        }
        drafts = everyScenarioDraft({
          candidate,
          coreAttempt,
          cellPolicies: operations.cellPolicies,
          scenariosForCell: operations.scenariosForCell,
          classification: 'fixture',
          message: primaryError instanceof Error ? primaryError.message : String(primaryError),
        });
      }
    }

    for (const draft of drafts) {
      let attemptSummary;
      try {
        attemptSummary = await persistDraft({
          draft,
          evidenceRoot: canonicalEvidence,
          runId,
          operations,
        });
      } catch (error) {
        throw Object.assign(error instanceof Error ? error : new Error(String(error)), {
          classification: 'policy',
          scope: 'run',
        });
      }
      summary.counts[attemptSummary.effectiveResult] += 1;
      summary.retries += attemptSummary.retryCount;
      await requireCleanRepository(root, runCommand);
    }
    await verifyCoreEvidence(coreAttempt, canonicalEvidence, operations);
    candidateSummaries.push(summary);
  }

  return { schemaVersion: 1, runId, candidates: candidateSummaries };
}
