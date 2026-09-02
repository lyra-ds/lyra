import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstat, mkdir, open, readdir, readFile, realpath } from 'node:fs/promises';
import { isAbsolute, join, normalize, resolve } from 'node:path';
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

class ModalRunFatalError extends Error {
  constructor(message, { cause, code = 'modal-policy' } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = 'ModalRunFatalError';
    this.classification = 'policy';
    this.scope = 'run';
    this.code = code;
  }
}

function runFatal(error, message, code) {
  if (error instanceof ModalRunFatalError) return error;
  const cause = error instanceof Error ? error : new Error(String(error));
  return new ModalRunFatalError(message ?? cause.message, { cause, code });
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function manifestSha256(manifest) {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(manifest)))
    .digest('hex');
}

async function exists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

function runIdentifiers(manifest) {
  const suffix = manifest.lyraRevision.slice(0, 12);
  return { coreRunId: `core-${suffix}`, runId: `modal-${suffix}` };
}

function bindingRecord(manifest) {
  const { coreRunId, runId } = runIdentifiers(manifest);
  return {
    schemaVersion: 1,
    recordType: 'modal-run-binding',
    runId,
    coreRunId,
    lyraRevision: manifest.lyraRevision,
    manifestSha256: manifestSha256(manifest),
  };
}

function bindingPath(evidenceRoot, runId) {
  return join(evidenceRoot, 'runs', `${runId}.json`);
}

function validateBinding(record, expected) {
  if (!isPlainRecord(record)) throw new Error('modal run binding must be a plain record');
  const expectedKeys = Object.keys(expected);
  if (
    Object.keys(record).length !== expectedKeys.length ||
    expectedKeys.some((key) => !Object.hasOwn(record, key) || record[key] !== expected[key])
  ) {
    throw new Error('modal run binding conflicts with the exact manifest or revision');
  }
}

async function directoryEntries(path, label) {
  const entries = await readdir(path, { withFileTypes: true });
  if (entries.some((entry) => !entry.isDirectory())) {
    throw new Error(`${label} must contain directories only`);
  }
  return entries;
}

async function validateModalAttemptTree({ evidenceRoot, manifest, core }) {
  const { runId } = runIdentifiers(manifest);
  const runRoot = join(evidenceRoot, 'attempts', runId);
  if (!(await exists(runRoot))) return;
  const runEntries = await readdir(runRoot, { withFileTypes: true });
  if (
    runEntries.length !== 1 ||
    runEntries[0].name !== 'scenario' ||
    !runEntries[0].isDirectory()
  ) {
    throw new Error('modal resume evidence run must contain only scenario attempts');
  }
  const candidatesById = new Map(manifest.candidates.map((candidate) => [candidate.id, candidate]));
  const candidateEntries = await directoryEntries(
    join(runRoot, 'scenario'),
    'modal resume candidate evidence',
  );
  for (const candidateEntry of candidateEntries) {
    const candidate = candidatesById.get(candidateEntry.name);
    if (candidate === undefined) throw new Error('modal resume evidence has an unknown candidate');
    const contractRoot = join(runRoot, 'scenario', candidate.id);
    const contractEntries = await directoryEntries(contractRoot, 'modal resume contract evidence');
    if (contractEntries.length !== 1 || contractEntries[0].name !== 'OF-MODAL') {
      throw new Error('modal resume evidence has a conflicting contract');
    }
    const coreCandidates = core.candidates.filter(
      ({ candidateId }) => candidateId === candidate.id,
    );
    if (coreCandidates.length !== 1) {
      throw new Error('modal resume core summary has a conflicting candidate');
    }
    const coreAttempt = await readCoreAttempt({
      candidate,
      coreCandidate: coreCandidates[0],
      coreRunId: core.runId,
      evidenceRoot,
    });
    const scenarioRoot = join(contractRoot, 'OF-MODAL');
    const scenarioEntries = await directoryEntries(scenarioRoot, 'modal resume scenario evidence');
    for (const scenarioEntry of scenarioEntries) {
      const matching = [];
      for (const cellId of MODAL_WAVE_CELLS) {
        const scenario = modalScenariosForCell(cellId).find(
          ({ scenarioId }) => scenarioId === scenarioEntry.name,
        );
        if (scenario !== undefined) matching.push({ cellId, scenario });
      }
      if (matching.length === 0) throw new Error('modal resume evidence has an unknown scenario');
      const matchingByCell = new Map(matching.map((entry) => [entry.cellId, entry.scenario]));
      const cellRoot = join(scenarioRoot, scenarioEntry.name);
      const cellEntries = await directoryEntries(cellRoot, 'modal resume cell evidence');
      for (const cellEntry of cellEntries) {
        const scenario = matchingByCell.get(cellEntry.name);
        if (scenario === undefined) {
          throw new Error('modal resume evidence has a conflicting scenario-cell pair');
        }
        const attemptRoot = join(cellRoot, cellEntry.name);
        const attemptEntries = await readdir(attemptRoot, { withFileTypes: true });
        const attempts = attemptEntries
          .map((entry) => {
            if (!entry.isFile()) throw new Error('modal resume attempt entry must be a file');
            const match = /^attempt-(\d+)\.json$/u.exec(entry.name);
            if (match === null) throw new Error('modal resume attempt filename is invalid');
            return { name: entry.name, number: Number(match[1]) };
          })
          .sort((left, right) => left.number - right.number);
        if (attempts.length === 0) throw new Error('modal resume cell evidence has no attempt');
        for (const [index, entry] of attempts.entries()) {
          if (entry.number !== index + 1) {
            throw new Error('modal resume attempt numbers must be contiguous from attempt 1');
          }
          const attempt = await readAttemptFile(
            join(attemptRoot, entry.name),
            'modal resume scenario attempt',
          );
          if (
            attempt.recordType !== 'scenario' ||
            attempt.runId !== runId ||
            attempt.candidateId !== candidate.id ||
            attempt.contractId !== 'OF-MODAL' ||
            attempt.scenarioId !== scenario.scenarioId ||
            attempt.cellId !== cellEntry.name ||
            attempt.attemptNumber !== entry.number ||
            !isDeepStrictEqual(attempt.expected, scenario.expected) ||
            !isDeepStrictEqual(attempt.artifactPaths, coreAttempt.artifactPaths)
          ) {
            throw new Error('modal resume attempt conflicts with its manifest or core attempt 1');
          }
        }
      }
    }
  }
}

export async function inspectModalEvidence({ evidenceRoot, manifest }) {
  const root = absolutePath(evidenceRoot, 'evidenceRoot');
  const expected = bindingRecord(manifest);
  const attemptsRoot = join(root, 'attempts');
  const coreExists = await exists(join(attemptsRoot, expected.coreRunId));
  const modalExists = await exists(join(attemptsRoot, expected.runId));
  const path = bindingPath(root, expected.runId);
  const bindingExists = await exists(path);
  if (!coreExists && !modalExists && !bindingExists) return Object.freeze({ resume: false });
  if (!bindingExists || !coreExists) {
    throw new Error('conflicting evidence attempt exists without a complete modal run binding');
  }
  const bindingInfo = await lstat(path);
  if (!bindingInfo.isFile() || bindingInfo.isSymbolicLink() || (await realpath(path)) !== path) {
    throw new Error('modal run binding must be a canonical regular file');
  }
  const record = decodeJson(await readFile(path), 'modal run binding');
  validateBinding(record, expected);
  const core = await loadCoreSummary({ evidenceRoot: root, manifest });
  await validateModalAttemptTree({ evidenceRoot: root, manifest, core });
  return Object.freeze({ resume: true, binding: Object.freeze(record), core });
}

async function writeModalBinding({ evidenceRoot, manifest }) {
  const record = bindingRecord(manifest);
  const directory = join(evidenceRoot, 'runs');
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const directoryInfo = await lstat(directory);
  if (
    !directoryInfo.isDirectory() ||
    directoryInfo.isSymbolicLink() ||
    (await realpath(directory)) !== directory
  ) {
    throw new ModalRunFatalError('modal run binding directory is not canonical', {
      code: 'evidence-write',
    });
  }
  const path = bindingPath(evidenceRoot, record.runId);
  let handle;
  try {
    handle = await open(path, 'wx', 0o600);
    await handle.writeFile(`${JSON.stringify(record)}\n`);
  } catch (error) {
    throw runFatal(error, 'modal run binding evidence could not be written', 'evidence-write');
  } finally {
    await handle?.close().catch(() => {});
  }
  return record;
}

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
  const info = await lstat(path);
  if (!info.isFile() || info.isSymbolicLink() || (await realpath(path)) !== resolve(path)) {
    throw new Error(`${label} must be a canonical regular file`);
  }
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

async function loadCoreSummary({ evidenceRoot, manifest }) {
  const { coreRunId } = runIdentifiers(manifest);
  const preflightRoot = join(evidenceRoot, 'attempts', coreRunId, 'preflight');
  let candidateEntries;
  try {
    candidateEntries = await readdir(preflightRoot, { withFileTypes: true });
  } catch (error) {
    throw runFatal(error, 'resume core preflight evidence is missing', 'evidence-read');
  }
  const expectedCandidateIds = manifest.candidates.map(({ id }) => id).sort();
  const observedCandidateIds = candidateEntries.map(({ name }) => name).sort();
  if (
    candidateEntries.some((entry) => !entry.isDirectory()) ||
    !isDeepStrictEqual(observedCandidateIds, expectedCandidateIds)
  ) {
    throw new ModalRunFatalError(
      'resume core evidence candidate set conflicts with the exact manifest',
      { code: 'evidence-conflict' },
    );
  }
  const candidates = [];
  for (const candidate of manifest.candidates) {
    const root = join(evidenceRoot, 'attempts', coreRunId, 'preflight', candidate.id);
    let entries;
    try {
      entries = await readdir(root, { withFileTypes: true });
    } catch (error) {
      throw runFatal(error, `resume core attempt is missing for ${candidate.id}`, 'evidence-read');
    }
    if (entries.length !== 1 || !entries[0].isDirectory()) {
      throw runFatal(
        new Error(`resume core evidence must contain exactly one stage for ${candidate.id}`),
        undefined,
        'evidence-conflict',
      );
    }
    const stage = entries[0].name;
    const names = await readdir(join(root, stage));
    if (names.length !== 1 || names[0] !== 'attempt-1.json') {
      throw runFatal(
        new Error(`resume core evidence must preserve only attempt 1 for ${candidate.id}`),
        undefined,
        'evidence-conflict',
      );
    }
    let attempt;
    try {
      attempt = await readAttemptFile(
        join(root, stage, 'attempt-1.json'),
        `resume core attempt for ${candidate.id}`,
      );
    } catch (error) {
      throw runFatal(error, undefined, 'evidence-read');
    }
    if (
      attempt.recordType !== 'preflight' ||
      attempt.runId !== coreRunId ||
      attempt.candidateId !== candidate.id ||
      attempt.stage !== stage ||
      attempt.attemptNumber !== 1
    ) {
      throw runFatal(
        new Error(`resume core attempt identity conflicts for ${candidate.id}`),
        undefined,
        'evidence-conflict',
      );
    }
    candidates.push({
      candidateId: candidate.id,
      stage,
      result: attempt.result,
      ...(attempt.classification === undefined ? {} : { classification: attempt.classification }),
    });
  }
  return {
    schemaVersion: 1,
    runId: coreRunId,
    result: candidates.every(({ result }) => result === 'PASS') ? 'PASS' : 'FAIL',
    candidates,
  };
}

function relativeEvidencePath(path) {
  return (
    typeof path === 'string' &&
    path.length > 0 &&
    !isAbsolute(path) &&
    !path.includes('\\') &&
    normalize(path) === path &&
    !path.split('/').includes('..')
  );
}

function evidenceHashes(attempt) {
  if (!Array.isArray(attempt.artifactPaths)) {
    throw new Error('core evidence artifactPaths must be an array');
  }
  if (new Set(attempt.artifactPaths).size !== attempt.artifactPaths.length) {
    throw new Error('core evidence paths must be unique');
  }
  const hashes = new Map();
  const add = (path, sha256, kind, value) => {
    if (!relativeEvidencePath(path) || !/^[a-f0-9]{64}$/u.test(sha256 ?? '')) {
      throw new Error(`core evidence ${kind} must have a relative path and SHA-256`);
    }
    if (hashes.has(path)) throw new Error(`core evidence path mapping is not one-to-one: ${path}`);
    hashes.set(path, { kind, sha256, value });
  };
  if (Array.isArray(attempt.observed.artifacts)) {
    for (const artifact of attempt.observed.artifacts) {
      add(artifact?.path, artifact?.sha256, 'artifact', artifact);
    }
  }
  for (const [key, path] of Object.entries(attempt.observed)) {
    if (key.endsWith('Path')) {
      add(path, attempt.observed[`${key.slice(0, -4)}Sha256`], 'supporting', undefined);
    }
  }
  for (const path of attempt.artifactPaths) {
    if (!relativeEvidencePath(path) || !hashes.has(path)) {
      throw new Error(`core evidence path has no immutable checksum: ${path}`);
    }
  }
  if (hashes.size !== attempt.artifactPaths.length) {
    throw new Error('core evidence path mapping must be one-to-one with artifactPaths');
  }
  return hashes;
}

async function verifyCoreEvidence(attempt, evidenceRoot, operations) {
  const hashes = evidenceHashes(attempt);
  for (const [relativePath, record] of hashes) {
    await operations.verifyRegularFile({
      path: join(evidenceRoot, relativePath),
      expectedSha256: record.sha256,
    });
  }
  const artifacts = [...hashes.entries()]
    .filter(([, record]) => record.kind === 'artifact')
    .map(([relativePath, record]) => ({
      ...record.value,
      path: join(evidenceRoot, relativePath),
    }));
  if (attempt.result === 'PASS' && artifacts.length === 0) {
    throw new Error('passing core attempt must preserve inspected artifacts');
  }
  return Object.freeze({ artifacts: Object.freeze(artifacts), hashes });
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
  for (const [index, entry] of numbered.entries()) {
    if (entry.number !== index + 1) {
      throw new Error('modal scenario attempt numbers must be contiguous from attempt 1');
    }
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
    throw new ModalRunFatalError('modal observation set must be a non-empty array', {
      code: 'observation-invalid',
    });
  }
  for (const [index, entry] of observations.entries()) {
    if (!isPlainRecord(entry) || typeof entry.reactVersion !== 'string') {
      throw new ModalRunFatalError(
        `modal observation set[${index}] must identify a React version`,
        { code: 'observation-invalid' },
      );
    }
    const errors = validateModalObservation(entry.observation);
    if (errors.length !== 0) {
      throw new ModalRunFatalError(`modal observation is invalid:\n${errors.join('\n')}`, {
        code: 'observation-invalid',
      });
    }
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
    let owned;
    try {
      owned = await operations.createOwnedRunRoot({
        tmpdir,
        runId: `${runId}-${candidate.id}-${suffix}`,
      });
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      throw runFatal(
        error,
        `modal fixture ownership could not be established: ${details}`,
        'ownership',
      );
    }
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
    resume = false,
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
  const canonicalEvidence = await realpath(evidencePath);
  if (canonicalEvidence !== evidencePath) throw new Error('evidenceRoot path must be canonical');
  const evidenceState = await inspectModalEvidence({ evidenceRoot: canonicalEvidence, manifest });
  if (resume !== evidenceState.resume) {
    throw new ModalRunFatalError(
      resume
        ? 'modal resume requested without consistent bound evidence'
        : 'consistent modal evidence requires the validated resume path',
      { code: 'evidence-conflict' },
    );
  }
  let core;
  if (resume) {
    core = evidenceState.core;
  } else {
    core = await operations.runCorePreflight({
      manifest,
      repositoryRoot: root,
      tmpdir: temporaryDirectory,
      evidenceRoot: evidencePath,
      fetchImpl,
      runCommand,
    });
    await requireCleanRepository(root, runCommand);
    await writeModalBinding({ evidenceRoot: canonicalEvidence, manifest });
  }
  await requireCleanRepository(root, runCommand);
  const { runId } = runIdentifiers(manifest);
  const candidateSummaries = [];

  for (const [index, candidate] of manifest.candidates.entries()) {
    const summary = emptyCandidateSummary(candidate.id);
    const coreCandidates = core.candidates.filter(
      ({ candidateId }) => candidateId === candidate.id,
    );
    if (coreCandidates.length !== 1)
      throw new Error(`core summary must contain ${candidate.id} once`);
    const coreCandidate = coreCandidates[0];
    let coreAttempt;
    let verifiedCore;
    try {
      coreAttempt = await readCoreAttempt({
        candidate,
        coreCandidate,
        coreRunId: core.runId,
        evidenceRoot: canonicalEvidence,
      });
      verifiedCore = await verifyCoreEvidence(coreAttempt, canonicalEvidence, operations);
    } catch (error) {
      throw runFatal(error, undefined, 'evidence-read');
    }
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
      const artifacts = verifiedCore.artifacts;
      const prepared = { fixtures: new Map(), ownedRoots: [] };
      let primaryError;
      try {
        let adapterEntry;
        try {
          adapterEntry = await operations.resolveCandidateEntry({
            candidate,
            index,
            repositoryRoot: root,
          });
        } catch (error) {
          throw runFatal(error, undefined, 'repository');
        }
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
      try {
        await verifyCoreEvidence(coreAttempt, canonicalEvidence, operations);
      } catch (error) {
        throw runFatal(error, undefined, 'evidence-verify');
      }
      if (primaryError !== undefined) {
        if (knownBoundary(primaryError) || hasBoundaryMetadata(primaryError)) {
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
    try {
      await verifyCoreEvidence(coreAttempt, canonicalEvidence, operations);
    } catch (error) {
      throw runFatal(error, undefined, 'evidence-verify');
    }
    candidateSummaries.push(summary);
  }

  return { schemaVersion: 1, runId, candidates: candidateSummaries };
}
