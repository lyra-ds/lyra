import { execFile } from 'node:child_process';
import { mkdir, readFile, realpath, stat } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import { characterizeIncumbent } from '../candidates/incumbent.mjs';
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
const PREFLIGHT_STAGES = new Set(['adapter', 'artifact', 'installation', 'audit', 'repository']);

const defaultDependencies = Object.freeze({
  acquireExternalArtifact,
  characterizeIncumbent,
  cleanupOwnedRunRoot,
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
  }
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

function boundaryError(error, defaults) {
  if (
    error instanceof CorePreflightError &&
    CLASSIFICATIONS.has(error.classification) &&
    ERROR_SCOPES.has(error.scope) &&
    PREFLIGHT_STAGES.has(error.stage)
  ) {
    return error;
  }

  if (hasErrorMetadata(error)) {
    if (CLASSIFICATIONS.has(error.classification) && ERROR_SCOPES.has(error.scope)) {
      return annotateError(error, {
        classification: error.classification,
        scope: error.scope,
        stage: PREFLIGHT_STAGES.has(error.stage) ? error.stage : defaults.stage,
      });
    }
    return new CorePreflightError(errorMessage(error), {
      cause: error,
      classification: 'policy',
      scope: 'run',
      stage: defaults.stage,
    });
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
  return {
    ...attemptBase(runId, candidate, error.stage),
    result: 'FAIL',
    classification: error.classification,
    observed: {
      message: error.message,
      scope: error.scope,
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
    throw new CorePreflightError(
      'incumbent characterization does not exactly match its manifest record',
      {
        classification: 'policy',
        scope: 'candidate',
        stage: 'artifact',
      },
    );
  }
  if (manifest.lyraRevision !== characterization.revision) {
    throw new CorePreflightError(
      'incumbent characterization does not exactly match the manifest Lyra revision',
      {
        classification: 'policy',
        scope: 'candidate',
        stage: 'artifact',
      },
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

function assertEvidenceOutsideOwnedRoot(evidenceRoot, runRoot) {
  const evidence = requireAbsoluteDirectoryRoot(evidenceRoot, 'evidenceRoot');
  if (evidence === runRoot || isStrictDescendant(runRoot, evidence)) {
    throw new Error('evidenceRoot must be outside the owned run root');
  }
  return evidence;
}

async function persistAttempt({ attempt, evidenceRoot, operations }) {
  operations.event(`write-preflight:${attempt.candidateId}`);
  try {
    await operations.writeAttempt({ evidenceRoot, attempt });
  } catch (error) {
    throw runPolicyError(error, attempt.stage);
  }
}

function isRunFatal(error) {
  return error.scope === 'run';
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

  const adapters = new Map();
  for (const [index, candidate] of manifest.candidates.entries()) {
    operations.event(`load-adapter:${candidate.id}`);
    try {
      adapters.set(candidate.id, { adapter: await loadAdapter(candidate, index, root) });
    } catch (error) {
      adapters.set(candidate.id, { error: adapterError(error) });
    }
  }

  let owned;
  try {
    owned = await createOwnedRunRoot({ tmpdir, runId: createRunId(manifest) });
  } catch (error) {
    throw runPolicyError(error);
  }
  const runId = createRunId(manifest);
  const attempts = [];
  let primaryError;
  try {
    const resolvedEvidenceRoot = assertEvidenceOutsideOwnedRoot(evidenceRoot, owned.runRoot);
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
    await persistAttempt({
      attempt: incumbentAttempt,
      evidenceRoot: resolvedEvidenceRoot,
      operations,
    });
    attempts.push(incumbentAttempt);
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
          candidateFailure = boundaryError(error, {
            classification: 'policy',
            scope: 'run',
            stage: 'installation',
          });
        }
      }
      if (candidateFailure !== undefined) {
        attempt = corePreflightFailure(runId, candidate, candidateFailure);
      }
      await persistAttempt({ attempt, evidenceRoot: resolvedEvidenceRoot, operations });
      attempts.push(attempt);
      if (candidateFailure !== undefined && isRunFatal(candidateFailure)) throw candidateFailure;
    }

    operations.event('verify-repository-unchanged');
    let repositoryAfter;
    try {
      repositoryAfter = await readRepositoryStatus(root, runCommand);
    } catch (error) {
      throw runPolicyError(error);
    }
    if (repositoryAfter !== repositoryBefore) {
      throw new CorePreflightError('repository worktree changed during core preflight', {
        classification: 'policy',
        scope: 'run',
        stage: 'repository',
      });
    }
    return summarizeCorePreflight(runId, manifest, attempts);
  } catch (error) {
    primaryError = runPolicyError(error, error?.stage);
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
