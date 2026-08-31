import {
  CANDIDATE_IDS,
  CONTRACT_IDS,
  isPlainRecord,
  rejectUnknownKeys,
  requireExactInteger,
  requireMember,
  requirePattern,
  requireUniqueStrings,
} from '../contracts/protocol.mjs';

const EXACT_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u;
const SHA_256 = /^[a-f0-9]{64}$/u;
const GIT_REVISION = /^[a-f0-9]{40}$/u;

export function validateCandidateManifest(value, expectedToolchain) {
  const errors = [];
  if (!isPlainRecord(value)) return ['manifest must be a plain record'];
  rejectUnknownKeys(value, ['schemaVersion', 'lyraRevision', 'toolchain', 'candidates'], 'manifest', errors);
  requireExactInteger(value.schemaVersion, 1, 'manifest.schemaVersion', errors);
  requirePattern(value.lyraRevision, GIT_REVISION, 'manifest.lyraRevision', errors);
  validateToolchain(value.toolchain, expectedToolchain, errors);
  validateCandidates(value.candidates, errors);
  return errors;
}

function validateToolchain(value, expected, errors) {
  if (!isPlainRecord(value)) {
    errors.push('manifest.toolchain must be a plain record');
    return;
  }
  rejectUnknownKeys(value, ['node', 'pnpm'], 'manifest.toolchain', errors);
  if (!isPlainRecord(expected)) {
    errors.push('expected toolchain must be a plain record');
    return;
  }
  for (const key of ['node', 'pnpm']) {
    if (typeof value[key] !== 'string' || value[key].length === 0) {
      errors.push(`manifest.toolchain.${key} must be a non-empty string`);
    } else if (value[key] !== expected[key]) {
      errors.push(`manifest.toolchain.${key} must exactly match expected toolchain`);
    }
  }
}

function validateCandidates(value, errors) {
  if (!Array.isArray(value)) {
    errors.push('manifest.candidates must be an array');
    return;
  }
  const ids = value.map((candidate) => (isPlainRecord(candidate) ? candidate.id : undefined));
  if (ids.length !== CANDIDATE_IDS.length || ids.some((id, index) => id !== CANDIDATE_IDS[index])) {
    errors.push('manifest candidate IDs must be exactly incumbent, radix, base-ui, zag in canonical order');
  }
  value.forEach((candidate, index) => validateCandidate(candidate, index, errors));
}

function validateCandidate(value, index, errors) {
  const path = `manifest.candidates[${index}]`;
  if (!isPlainRecord(value)) {
    errors.push(`${path} must be a plain record`);
    return;
  }
  const incumbent = value.id === 'incumbent';
  rejectUnknownKeys(value, incumbent ? ['id', 'adapter', 'contracts', 'revision', 'artifacts'] : ['id', 'adapter', 'contracts', 'artifacts'], path, errors);
  requireMember(value.id, CANDIDATE_IDS, `${path}.id`, errors);
  if (value.adapter !== `candidates/${value.id}.mjs`) errors.push(`${path}.adapter must match candidates/<candidate-id>.mjs`);
  validateContracts(value.contracts, `${path}.contracts`, errors);
  if (incumbent) requirePattern(value.revision, GIT_REVISION, `${path}.revision`, errors);
  validateArtifacts(value.artifacts, `${path}.artifacts`, errors);
}

function validateContracts(value, path, errors) {
  requireUniqueStrings(value, path, errors);
  if (!Array.isArray(value)) return;
  if (value.length === 0) errors.push(`${path} must not be empty`);
  value.forEach((contractId) => requireMember(contractId, CONTRACT_IDS, `${path} entry`, errors));
}

function validateArtifacts(value, path, errors) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return;
  }
  value.forEach((artifact, index) => validateArtifact(artifact, `${path}[${index}]`, errors));
}

function validateArtifact(value, path, errors) {
  if (!isPlainRecord(value)) {
    errors.push(`${path} must be a plain record`);
    return;
  }
  if (value.source === 'workspace-pack') {
    rejectUnknownKeys(value, ['source', 'name', 'version', 'sha256'], path, errors);
  } else if (value.source === 'registry') {
    rejectUnknownKeys(value, ['source', 'name', 'version', 'tarballUrl', 'sha256', 'license', 'repositoryUrl'], path, errors);
    validateUrl(value.tarballUrl, `${path}.tarballUrl`, errors);
    validateUrl(value.repositoryUrl, `${path}.repositoryUrl`, errors);
    if (typeof value.license !== 'string' || value.license.length === 0) errors.push(`${path}.license must be a non-empty string`);
  } else {
    errors.push(`${path}.source is invalid`);
  }
  if (typeof value.name !== 'string' || value.name.length === 0) errors.push(`${path}.name must be a non-empty string`);
  if (typeof value.version !== 'string' || !EXACT_VERSION.test(value.version)) errors.push(`${path}.version must be an exact version`);
  if (typeof value.sha256 !== 'string' || !SHA_256.test(value.sha256)) errors.push(`${path}.sha256 must be a lowercase SHA-256`);
}

function validateUrl(value, path, errors) {
  if (typeof value !== 'string') {
    errors.push(`${path} must be an absolute URL`);
    return;
  }
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) errors.push(`${path} must use HTTP(S)`);
    if (url.username || url.password) errors.push(`${path} must not contain credentials`);
  } catch {
    errors.push(`${path} must be an absolute URL`);
  }
}

export function validateAdapterDescriptor(candidate, descriptor) {
  const errors = [];
  if (!isPlainRecord(candidate)) return ['candidate must be a plain record'];
  if (!isPlainRecord(descriptor)) return ['adapter descriptor must be a plain record'];
  rejectUnknownKeys(descriptor, ['candidateId', 'supportedContractIds'], 'adapter descriptor', errors);
  if (descriptor.candidateId !== candidate.id) errors.push('adapter descriptor candidate ID must exactly match the candidate');
  validateContracts(descriptor.supportedContractIds, 'adapter descriptor.supportedContractIds', errors);
  if (Array.isArray(candidate.contracts) && Array.isArray(descriptor.supportedContractIds)) {
    const candidateContracts = new Set(candidate.contracts);
    const descriptorContracts = new Set(descriptor.supportedContractIds);
    if (
      candidateContracts.size !== descriptorContracts.size ||
      [...candidateContracts].some((contractId) => !descriptorContracts.has(contractId))
    ) {
      errors.push('adapter descriptor.supportedContractIds must equal manifest contracts');
    }
  }
  return errors;
}
