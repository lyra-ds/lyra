import { execFile } from 'node:child_process';
import { lstat, mkdir, readFile, realpath, stat } from 'node:fs/promises';
import { isAbsolute, join, parse, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import { FAILURE_CLASSIFICATIONS, isPlainRecord } from '../contracts/protocol.mjs';
import { writeAttempt } from '../evidence/results.mjs';
import { acquireExternalArtifact, inspectPackageArchive } from './artifacts.mjs';
import { cleanupOwnedRunRoot, createOwnedRunRoot, installExternalCandidate } from './isolation.mjs';
import { validateAdapterDescriptor, validateCandidateManifest } from './manifest.mjs';

const execFilePromise = promisify(execFile);
const REQUIRED_NODE_VERSION = '24.18.0';
const REQUIRED_PNPM_VERSION = '11.13.1';
const ERROR_SCOPES = new Set(['candidate', 'run']);
const CLASSIFICATIONS = new Set(FAILURE_CLASSIFICATIONS);
const normalizedBoundaryErrors = new WeakMap();
const incumbentManifestMismatchErrors = new WeakSet();

async function defaultCharacterizeIncumbent(options) {
  const { characterizeIncumbent } = await import('../candidates/incumbent.mjs');
  return characterizeIncumbent(options);
}

const defaultDependencies = Object.freeze({
  acquireExternalArtifact,
  characterizeIncumbent: defaultCharacterizeIncumbent,
  cleanupOwnedRunRoot,
  createOwnedRunRoot,
  installExternalCandidate,
  inspectPackageArchive,
  writeAttempt,
  event() {},
});

class CorePreflightError extends Error {
  constructor(message, { cause, classification, scope, stage }) {
    super(message, { cause });
    this.name = 'CorePreflightError';
    this.classification = classification;
    this.scope = scope;
    this.stage = stage;
    normalizedBoundaryErrors.set(this, Object.freeze({ classification, scope, stage }));
  }
}

function incumbentManifestMismatchError(message) {
  const error = new CorePreflightError(message, {
    classification: 'policy',
    scope: 'candidate',
    stage: 'artifact',
  });
  incumbentManifestMismatchErrors.add(error);
  return error;
}

function errorMessage(error) {
  if (error instanceof Error && typeof error.message === 'string' && error.message.length > 0) {
    return error.message;
  }
  return String(error);
}

function hasErrorMetadata(error) {
  return (
    error !== null &&
    (typeof error === 'object' || typeof error === 'function') &&
    (Object.hasOwn(error, 'classification') || Object.hasOwn(error, 'scope'))
  );
}

function annotateError(error, { classification, scope, stage }) {
  if (error instanceof Error && Object.isExtensible(error)) {
    try {
      for (const [key, value] of Object.entries({ classification, scope, stage })) {
        Object.defineProperty(error, key, {
          configurable: true,
          enumerable: true,
          value,
          writable: true,
        });
      }
      normalizedBoundaryErrors.set(error, Object.freeze({ classification, scope, stage }));
      return error;
    } catch {
      // Fall through to a preserving wrapper for frozen or specially shaped errors.
    }
  }
  return new CorePreflightError(errorMessage(error), {
    cause: error,
    classification,
    scope,
    stage,
  });
}

function normalizedBoundaryMetadata(error) {
  return error instanceof Error ? normalizedBoundaryErrors.get(error) : undefined;
}

function boundaryError(error, defaults) {
  if (normalizedBoundaryMetadata(error) === undefined && hasErrorMetadata(error)) {
    if (!CLASSIFICATIONS.has(error.classification) || !ERROR_SCOPES.has(error.scope)) {
      return annotateError(error, {
        classification: 'policy',
        scope: 'run',
        stage: defaults.stage,
      });
    }
  }

  return annotateError(error, {
    classification: defaults.classification,
    scope: defaults.scope,
    stage: defaults.stage,
  });
}

function runPolicyError(error, stage = 'repository') {
  return boundaryError(error, { classification: 'policy', scope: 'run', stage });
}

function adapterError(error) {
  return boundaryError(error, {
    classification: 'policy',
    scope: 'candidate',
    stage: 'adapter',
  });
}

function artifactError(error) {
  const message = errorMessage(error);
  const classification = /checksum|license|lifecycle|forbidden (?:install|script)/iu.test(message)
    ? 'security'
    : 'packaging';
  return boundaryError(error, {
    classification,
    scope: 'candidate',
    stage: 'artifact',
  });
}

function incumbentError(error) {
  if (incumbentManifestMismatchErrors.has(error)) return error;
  if (/repository worktree|clean worktree/iu.test(errorMessage(error))) {
    return boundaryError(error, {
      classification: 'policy',
      scope: 'run',
      stage: 'repository',
    });
  }
  return boundaryError(error, {
    classification: 'packaging',
    scope: 'candidate',
    stage: 'artifact',
  });
}

function installationError(error) {
  const message = errorMessage(error);
  if (/repository worktree|ownership|run-root identity|owned run root/iu.test(message)) {
    return boundaryError(error, {
      classification: 'policy',
      scope: 'run',
      stage: 'repository',
    });
  }
  if (/audit|vulnerabil/iu.test(message)) {
    return boundaryError(error, {
      classification: 'security',
      scope: 'candidate',
      stage: 'audit',
    });
  }
  if (/license/iu.test(message)) {
    return boundaryError(error, {
      classification: 'security',
      scope: 'candidate',
      stage: 'installation',
    });
  }
  return boundaryError(error, {
    classification: 'infrastructure',
    scope: 'candidate',
    stage: 'installation',
  });
}

function requireAbsoluteDirectoryRoot(value, name) {
  if (typeof value !== 'string' || !isAbsolute(value)) {
    throw new Error(`${name} must be absolute`);
  }
  return resolve(value);
}

function parseRepositoryManifest(bytes) {
  let value;
  try {
    value = JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    throw new Error('repository package manifest must be valid JSON', { cause: error });
  }
  if (!isPlainRecord(value)) {
    throw new Error('repository package manifest must be a plain record');
  }
  return value;
}

export async function readExpectedToolchain(repositoryRoot) {
  const root = requireAbsoluteDirectoryRoot(repositoryRoot, 'repositoryRoot');
  const node = (await readFile(join(root, '.nvmrc'), 'utf8')).trim();
  const repositoryManifest = parseRepositoryManifest(await readFile(join(root, 'package.json')));
  if (node !== REQUIRED_NODE_VERSION) {
    throw new Error(`repository Node pin must equal ${REQUIRED_NODE_VERSION}`);
  }
  if (repositoryManifest.packageManager !== `pnpm@${REQUIRED_PNPM_VERSION}`) {
    throw new Error(`repository pnpm pin must equal ${REQUIRED_PNPM_VERSION}`);
  }
  return { node: REQUIRED_NODE_VERSION, pnpm: REQUIRED_PNPM_VERSION };
}

function isStrictDescendant(parent, child) {
  const childRelative = relative(parent, child);
  return childRelative !== '' && !childRelative.startsWith('..') && !isAbsolute(childRelative);
}

async function resolveAdapterPath(candidate, index, repositoryRoot) {
  const root = requireAbsoluteDirectoryRoot(repositoryRoot, 'repositoryRoot');
  const evaluationRoot = join(root, 'tools', 'overlay-foundation-evaluation');
  const candidatesRoot = join(evaluationRoot, 'candidates');
  let candidatesReal;
  try {
    candidatesReal = await realpath(candidatesRoot);
  } catch (error) {
    throw new Error(
      `${candidate?.id ?? `manifest.candidates[${index}]`} adapter directory does not exist`,
      { cause: error },
    );
  }

  if (typeof candidate?.adapter !== 'string' || candidate.adapter.length === 0) {
    throw new Error(`manifest.candidates[${index}].adapter must name an adapter file`);
  }
  const unresolved = resolve(evaluationRoot, candidate.adapter);
  let resolved;
  try {
    resolved = await realpath(unresolved);
  } catch (error) {
    throw new Error(
      `${candidate?.id ?? `manifest.candidates[${index}]`} adapter does not resolve to an existing adapter file`,
      { cause: error },
    );
  }
  if (!isStrictDescendant(candidatesReal, resolved)) {
    throw new Error(
      `${candidate?.id ?? `manifest.candidates[${index}]`} adapter must resolve beneath tools/overlay-foundation-evaluation/candidates`,
    );
  }
  const adapterStat = await stat(resolved);
  if (!adapterStat.isFile()) {
    throw new Error(
      `${candidate?.id ?? `manifest.candidates[${index}]`} adapter does not resolve to an existing adapter file`,
    );
  }
  return resolved;
}

export async function validateManifestAdapterPaths(manifest, repositoryRoot) {
  if (!isPlainRecord(manifest) || !Array.isArray(manifest.candidates)) return [];
  const errors = [];
  for (const [index, candidate] of manifest.candidates.entries()) {
    try {
      await resolveAdapterPath(candidate, index, repositoryRoot);
    } catch (error) {
      errors.push(errorMessage(error));
    }
  }
  return errors;
}

function descriptorExport(candidate, module) {
  if (Object.hasOwn(module, 'adapterDescriptor')) return module.adapterDescriptor;
  if (candidate.id === 'incumbent' && Object.hasOwn(module, 'incumbentDescriptor')) {
    const descriptor = module.incumbentDescriptor;
    if (!isPlainRecord(descriptor)) return descriptor;
    return {
      candidateId: descriptor.id,
      supportedContractIds: descriptor.supportedContractIds,
    };
  }
  return undefined;
}

async function loadAdapter(candidate, index, repositoryRoot) {
  const path = await resolveAdapterPath(candidate, index, repositoryRoot);
  const module = await import(pathToFileURL(path).href);
  const descriptor = descriptorExport(candidate, module);
  const errors = validateAdapterDescriptor(candidate, descriptor);
  if (errors.length !== 0) throw new Error(errors.join('\n'));
  return { descriptor, module, path };
}

function commandOutput(result) {
  const output = isPlainRecord(result) && Object.hasOwn(result, 'stdout') ? result.stdout : result;
  if (typeof output === 'string') return output;
  if (ArrayBuffer.isView(output)) {
    return Buffer.from(output.buffer, output.byteOffset, output.byteLength).toString('utf8');
  }
  throw new Error('repository status command must return stdout bytes or a string');
}

async function defaultRunCommand(command, args, options = {}) {
  return execFilePromise(command, args, { ...options, maxBuffer: 50_000_000 });
}

async function readRepositoryStatus(repositoryRoot, runCommand) {
  return commandOutput(
    await runCommand('git', ['status', '--porcelain=v1', '--untracked-files=all'], {
      cwd: repositoryRoot,
    }),
  );
}

function createRunId(manifest) {
  return `core-${manifest.lyraRevision.slice(0, 12)}`;
}

function attemptBase(runId, candidate, stage) {
  return {
    schemaVersion: 1,
    recordType: 'preflight',
    runId,
    candidateId: candidate.id,
    stage,
    attemptNumber: 1,
    artifactPaths: [],
  };
}

function corePreflightPass(runId, candidate, stage, observed) {
  return {
    ...attemptBase(runId, candidate, stage),
    result: 'PASS',
    observed,
  };
}

function corePreflightFailure(runId, candidate, error) {
  const metadata = normalizedBoundaryMetadata(error) ?? error;
  return {
    ...attemptBase(runId, candidate, metadata.stage),
    result: 'FAIL',
    classification: metadata.classification,
    observed: {
      message: error.message,
      scope: metadata.scope,
    },
  };
}

function canonicalArtifactSet(artifacts) {
  if (!Array.isArray(artifacts)) return undefined;
  return artifacts
    .map((artifact) => ({
      name: artifact?.name,
      version: artifact?.version,
      sha256: artifact?.sha256,
    }))
    .sort((left, right) =>
      JSON.stringify(left) < JSON.stringify(right)
        ? -1
        : JSON.stringify(left) > JSON.stringify(right)
          ? 1
          : 0,
    );
}

function assertIncumbentMatchesManifest(manifest, candidate, characterization) {
  const matches =
    isPlainRecord(characterization) &&
    characterization.schemaVersion === 1 &&
    characterization.candidateId === 'incumbent' &&
    characterization.revision === candidate.revision &&
    JSON.stringify(canonicalArtifactSet(characterization.artifacts)) ===
      JSON.stringify(canonicalArtifactSet(candidate.artifacts));
  if (!matches) {
    throw incumbentManifestMismatchError(
      'incumbent characterization does not exactly match its manifest record',
    );
  }
  if (manifest.lyraRevision !== characterization.revision) {
    throw incumbentManifestMismatchError(
      'incumbent characterization does not exactly match the manifest Lyra revision',
    );
  }
}

function summarizeCorePreflight(runId, manifest, attempts) {
  const candidates = manifest.candidates.map(({ id }) => {
    const attempt = attempts.find(({ candidateId }) => candidateId === id);
    if (attempt === undefined) throw new Error(`missing preflight attempt for ${id}`);
    return {
      candidateId: id,
      stage: attempt.stage,
      result: attempt.result,
      ...(attempt.classification === undefined ? {} : { classification: attempt.classification }),
    };
  });
  return {
    schemaVersion: 1,
    runId,
    result: candidates.every(({ result }) => result === 'PASS') ? 'PASS' : 'FAIL',
    candidates,
  };
}

async function assertNoEvidenceSymlinkComponents(evidenceRoot) {
  const pathRoot = parse(evidenceRoot).root;
  const components = relative(pathRoot, evidenceRoot).split(sep).filter(Boolean);
  let current = pathRoot;
  for (const component of components) {
    current = join(current, component);
    let info;
    try {
      info = await lstat(current);
    } catch (error) {
      if (error?.code === 'ENOENT') return;
      throw error;
    }
    if (info.isSymbolicLink()) {
      throw new Error('evidenceRoot path must not contain a symbolic link');
    }
  }
}

async function prepareEvidenceRoot(value) {
  const evidenceRoot = requireAbsoluteDirectoryRoot(value, 'evidenceRoot');
  await assertNoEvidenceSymlinkComponents(evidenceRoot);
  await mkdir(evidenceRoot, { recursive: true, mode: 0o700 });
  await assertNoEvidenceSymlinkComponents(evidenceRoot);
  const canonicalPath = await realpath(evidenceRoot);
  const info = await lstat(canonicalPath);
  if (!info.isDirectory() || info.isSymbolicLink()) {
    throw new Error('evidenceRoot must resolve to a real directory');
  }
  return Object.freeze({ canonicalPath, device: info.dev, inode: info.ino });
}

async function verifyEvidenceRoot(evidenceRoot) {
  let info;
  try {
    info = await lstat(evidenceRoot.canonicalPath);
  } catch (error) {
    throw new Error('evidenceRoot canonical directory is no longer available', { cause: error });
  }
  if (
    !info.isDirectory() ||
    info.isSymbolicLink() ||
    info.dev !== evidenceRoot.device ||
    info.ino !== evidenceRoot.inode
  ) {
    throw new Error('evidenceRoot canonical directory identity changed during core preflight');
  }
  return evidenceRoot.canonicalPath;
}

async function assertEvidenceOutsideOwnedRoot(evidenceRoot, runRoot) {
  const canonicalRunRoot = await realpath(runRoot);
  if (
    evidenceRoot.canonicalPath === canonicalRunRoot ||
    isStrictDescendant(canonicalRunRoot, evidenceRoot.canonicalPath)
  ) {
    throw new Error('evidenceRoot must be outside the owned run root');
  }
}

async function persistAttempt({ attempt, evidenceRoot, operations }) {
  operations.event(`write-preflight:${attempt.candidateId}`);
  try {
    await operations.writeAttempt({
      evidenceRoot: await verifyEvidenceRoot(evidenceRoot),
      attempt,
    });
  } catch (error) {
    throw runPolicyError(error, attempt.stage);
  }
}

function repositoryMutationError() {
  return new CorePreflightError('repository worktree changed during core preflight', {
    classification: 'policy',
    scope: 'run',
    stage: 'repository',
  });
}

async function assertRepositoryUnchanged(repositoryRoot, repositoryBefore, runCommand) {
  let repositoryAfter;
  try {
    repositoryAfter = await readRepositoryStatus(repositoryRoot, runCommand);
  } catch (error) {
    throw runPolicyError(error);
  }
  if (repositoryAfter !== repositoryBefore) throw repositoryMutationError();
}

async function persistRepositoryFailure({
  runId,
  candidate,
  error,
  evidenceRoot,
  operations,
  attempts,
}) {
  const repositoryFailure = runPolicyError(error);
  const repositoryAttempt = corePreflightFailure(runId, candidate, repositoryFailure);
  await persistAttempt({ attempt: repositoryAttempt, evidenceRoot, operations });
  attempts.push(repositoryAttempt);
  return repositoryFailure;
}

async function requireRepositoryIntegrity({
  runId,
  candidate,
  repositoryRoot,
  repositoryBefore,
  runCommand,
  evidenceRoot,
  operations,
  attempts,
}) {
  try {
    await assertRepositoryUnchanged(repositoryRoot, repositoryBefore, runCommand);
  } catch (error) {
    throw await persistRepositoryFailure({
      runId,
      candidate,
      error,
      evidenceRoot,
      operations,
      attempts,
    });
  }
}

async function persistCheckedAttempt({
  runId,
  candidate,
  attempt,
  repositoryRoot,
  repositoryBefore,
  runCommand,
  evidenceRoot,
  operations,
  attempts,
}) {
  const integrityInput = {
    runId,
    candidate,
    repositoryRoot,
    repositoryBefore,
    runCommand,
    evidenceRoot,
    operations,
    attempts,
  };
  await requireRepositoryIntegrity(integrityInput);
  await persistAttempt({ attempt, evidenceRoot, operations });
  attempts.push(attempt);
  if (
    attempt.result === 'PASS' ||
    (attempt.result === 'FAIL' && attempt.observed.scope === 'candidate')
  ) {
    await requireRepositoryIntegrity(integrityInput);
  }
}

function isRunFatal(error) {
  return (normalizedBoundaryMetadata(error) ?? error).scope === 'run';
}

export async function runCorePreflight(
  { manifest, repositoryRoot, tmpdir, evidenceRoot, fetchImpl, runCommand = defaultRunCommand },
  dependencies = {},
) {
  const operations = { ...defaultDependencies, ...dependencies };
  let root;
  try {
    root = requireAbsoluteDirectoryRoot(repositoryRoot, 'repositoryRoot');
  } catch (error) {
    throw runPolicyError(error);
  }
  let expectedToolchain;
  try {
    expectedToolchain = await readExpectedToolchain(root);
  } catch (error) {
    throw runPolicyError(error);
  }

  operations.event('validate-manifest');
  const manifestErrors = validateCandidateManifest(manifest, expectedToolchain);
  if (manifestErrors.length !== 0) {
    throw new CorePreflightError(manifestErrors.join('\n'), {
      classification: 'policy',
      scope: 'run',
      stage: 'adapter',
    });
  }

  operations.event('verify-repository-clean');
  let repositoryBefore;
  try {
    repositoryBefore = await readRepositoryStatus(root, runCommand);
  } catch (error) {
    throw runPolicyError(error);
  }
  if (repositoryBefore !== '') {
    throw new CorePreflightError('core preflight requires a clean worktree', {
      classification: 'policy',
      scope: 'run',
      stage: 'repository',
    });
  }

  let preparedEvidenceRoot;
  try {
    preparedEvidenceRoot = await prepareEvidenceRoot(evidenceRoot);
  } catch (error) {
    throw runPolicyError(error);
  }

  const runId = createRunId(manifest);
  const attempts = [];
  const adapters = new Map();
  for (const [index, candidate] of manifest.candidates.entries()) {
    operations.event(`load-adapter:${candidate.id}`);
    try {
      adapters.set(candidate.id, { adapter: await loadAdapter(candidate, index, root) });
    } catch (error) {
      adapters.set(candidate.id, { error: adapterError(error) });
    }
    await requireRepositoryIntegrity({
      runId,
      candidate,
      repositoryRoot: root,
      repositoryBefore,
      runCommand,
      evidenceRoot: preparedEvidenceRoot,
      operations,
      attempts,
    });
  }

  let owned;
  try {
    owned = await operations.createOwnedRunRoot({ tmpdir, runId });
  } catch (error) {
    throw runPolicyError(error);
  }
  let primaryError;
  try {
    await assertEvidenceOutsideOwnedRoot(preparedEvidenceRoot, owned.runRoot);
    const artifactRoot = join(owned.runRoot, 'artifacts');
    await mkdir(artifactRoot, { recursive: true, mode: 0o700 });

    const incumbentCandidate = manifest.candidates[0];
    let incumbentAttempt;
    let incumbentFailure = adapters.get('incumbent').error;
    if (incumbentFailure === undefined) {
      operations.event('characterize:incumbent');
      try {
        const characterization = await operations.characterizeIncumbent({
          repositoryRoot: root,
          outputRoot: join(owned.runRoot, 'incumbent'),
          runCommand,
        });
        assertIncumbentMatchesManifest(manifest, incumbentCandidate, characterization);
        incumbentAttempt = corePreflightPass(
          runId,
          incumbentCandidate,
          'artifact',
          characterization,
        );
      } catch (error) {
        incumbentFailure = incumbentError(error);
      }
    }
    if (incumbentFailure !== undefined) {
      incumbentAttempt = corePreflightFailure(runId, incumbentCandidate, incumbentFailure);
    }
    await persistCheckedAttempt({
      runId,
      candidate: incumbentCandidate,
      attempt: incumbentAttempt,
      repositoryRoot: root,
      repositoryBefore,
      runCommand,
      evidenceRoot: preparedEvidenceRoot,
      operations,
      attempts,
    });
    if (incumbentFailure !== undefined && isRunFatal(incumbentFailure)) throw incumbentFailure;

    for (const candidate of manifest.candidates.slice(1)) {
      let attempt;
      let candidateFailure = adapters.get(candidate.id).error;
      if (candidateFailure === undefined) {
        try {
          const artifacts = [];
          for (const record of candidate.artifacts) {
            operations.event(`acquire:${candidate.id}`);
            let acquired;
            try {
              acquired = await operations.acquireExternalArtifact({
                record,
                destinationRoot: artifactRoot,
                fetchImpl,
              });
            } catch (error) {
              throw artifactError(error);
            }
            operations.event(`inspect:${candidate.id}`);
            try {
              artifacts.push(
                await operations.inspectPackageArchive({ artifact: acquired, runCommand }),
              );
            } catch (error) {
              throw artifactError(error);
            }
          }
          operations.event(`install:${candidate.id}`);
          let installed;
          try {
            installed = await operations.installExternalCandidate({
              candidate,
              artifacts,
              runRoot: owned.runRoot,
              repositoryRoot: root,
              runCommand,
            });
          } catch (error) {
            throw installationError(error);
          }
          attempt = corePreflightPass(runId, candidate, 'installation', installed);
        } catch (error) {
          candidateFailure =
            normalizedBoundaryMetadata(error) === undefined
              ? runPolicyError(error, 'installation')
              : error;
        }
      }
      if (candidateFailure !== undefined) {
        attempt = corePreflightFailure(runId, candidate, candidateFailure);
      }
      await persistCheckedAttempt({
        runId,
        candidate,
        attempt,
        repositoryRoot: root,
        repositoryBefore,
        runCommand,
        evidenceRoot: preparedEvidenceRoot,
        operations,
        attempts,
      });
      if (candidateFailure !== undefined && isRunFatal(candidateFailure)) throw candidateFailure;
    }

    operations.event('verify-repository-unchanged');
    try {
      await assertRepositoryUnchanged(root, repositoryBefore, runCommand);
    } catch (error) {
      throw await persistRepositoryFailure({
        runId,
        candidate: manifest.candidates.at(-1),
        error,
        evidenceRoot: preparedEvidenceRoot,
        operations,
        attempts,
      });
    }
    return summarizeCorePreflight(runId, manifest, attempts);
  } catch (error) {
    primaryError = runPolicyError(error, normalizedBoundaryMetadata(error)?.stage ?? 'repository');
    throw primaryError;
  } finally {
    operations.event('cleanup-owned-root');
    try {
      await operations.cleanupOwnedRunRoot({ tmpdir, ...owned });
    } catch (error) {
      const cleanupError = runPolicyError(error);
      if (primaryError !== undefined) {
        throw new AggregateError(
          [primaryError, cleanupError],
          'core preflight and cleanup both failed',
        );
      }
      throw cleanupError;
    }
  }
}
