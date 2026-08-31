import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  CANDIDATE_IDS,
  CONTRACT_IDS,
  FAILURE_CLASSIFICATIONS,
  RESULTS,
  isPlainRecord,
  rejectUnknownKeys,
  requireExactInteger,
  requireMember,
  requirePositiveInteger,
} from '../contracts/protocol.mjs';
import { sha256 } from '../runner/artifacts.mjs';

const PREFLIGHT_STAGES = Object.freeze([
  'adapter',
  'artifact',
  'installation',
  'audit',
  'repository',
]);
const RECORD_TYPES = Object.freeze(['scenario', 'preflight']);
const SAFE_SEGMENT = /^[0-9A-Za-z][0-9A-Za-z._-]*$/u;
const SCENARIO_KEYS = Object.freeze([
  'schemaVersion',
  'recordType',
  'runId',
  'candidateId',
  'contractId',
  'scenarioId',
  'cellId',
  'attemptNumber',
  'result',
  'classification',
  'expected',
  'observed',
  'artifactPaths',
]);
const PREFLIGHT_KEYS = Object.freeze([
  'schemaVersion',
  'recordType',
  'runId',
  'candidateId',
  'stage',
  'attemptNumber',
  'result',
  'classification',
  'observed',
  'artifactPaths',
]);

function requireSafeSegment(value, path, errors) {
  if (
    typeof value !== 'string' ||
    value.length > 255 ||
    value === '.' ||
    value === '..' ||
    !SAFE_SEGMENT.test(value)
  ) {
    errors.push(`${path} must be a traversal-safe path segment`);
  }
}

function sortJson(value, path, ancestors) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError(`${path} must contain only JSON values`);
    return value;
  }
  if (typeof value !== 'object') throw new TypeError(`${path} must contain only JSON values`);
  if (ancestors.has(value)) throw new TypeError(`${path} must not contain cyclic JSON values`);

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      const sorted = [];
      for (let index = 0; index < value.length; index += 1) {
        if (!Object.hasOwn(value, index)) {
          throw new TypeError(`${path}[${index}] must contain a JSON value`);
        }
        sorted.push(sortJson(value[index], `${path}[${index}]`, ancestors));
      }
      return sorted;
    }
    if (!isPlainRecord(value)) throw new TypeError(`${path} must contain only JSON values`);

    const sorted = {};
    for (const key of Object.keys(value).sort()) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined || !Object.hasOwn(descriptor, 'value')) {
        throw new TypeError(`${path}.${key} must contain a JSON value`);
      }
      sorted[key] = sortJson(descriptor.value, `${path}.${key}`, ancestors);
    }
    return sorted;
  } finally {
    ancestors.delete(value);
  }
}

function validateJsonRecord(value, path, errors) {
  if (!isPlainRecord(value)) {
    errors.push(`${path} must be a plain JSON record`);
    return;
  }
  try {
    sortJson(value, path, new Set());
  } catch (error) {
    errors.push(error.message);
  }
}

function validateArtifactPaths(value, errors) {
  if (!Array.isArray(value)) {
    errors.push('attempt.artifactPaths must be an array');
    return;
  }
  if (new Set(value).size !== value.length) {
    errors.push('attempt.artifactPaths must be unique');
  }
  value.forEach((artifactPath, index) => {
    const path = `attempt.artifactPaths[${index}]`;
    if (
      typeof artifactPath !== 'string' ||
      artifactPath.length === 0 ||
      artifactPath.includes('\\')
    ) {
      errors.push(`${path} must be a traversal-safe relative path`);
      return;
    }
    const segments = artifactPath.split('/');
    if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
      errors.push(`${path} must be a traversal-safe relative path`);
      return;
    }
    segments.forEach((segment) => requireSafeSegment(segment, path, errors));
  });
}

function validateClassification(value, errors) {
  const hasClassification = Object.hasOwn(value, 'classification');
  if (value.result === 'PASS') {
    if (hasClassification) errors.push('attempt with result PASS must omit classification');
    return;
  }
  if (value.result !== 'FAIL' && value.result !== 'unavailable') return;
  if (!hasClassification || value.classification === undefined) {
    errors.push('attempt.classification is required for FAIL and unavailable results');
    return;
  }
  requireMember(value.classification, FAILURE_CLASSIFICATIONS, 'attempt.classification', errors);
}

export function validateAttempt(value) {
  const errors = [];
  if (!isPlainRecord(value)) return ['attempt must be a plain record'];

  requireMember(value.recordType, RECORD_TYPES, 'attempt.recordType', errors);
  if (value.recordType === 'scenario') {
    rejectUnknownKeys(value, SCENARIO_KEYS, 'attempt', errors);
  } else if (value.recordType === 'preflight') {
    rejectUnknownKeys(value, PREFLIGHT_KEYS, 'attempt', errors);
  } else {
    return errors;
  }

  requireExactInteger(value.schemaVersion, 1, 'attempt.schemaVersion', errors);
  requireSafeSegment(value.runId, 'attempt.runId', errors);
  requireMember(value.candidateId, CANDIDATE_IDS, 'attempt.candidateId', errors);
  requirePositiveInteger(value.attemptNumber, 'attempt.attemptNumber', errors);
  requireMember(value.result, RESULTS, 'attempt.result', errors);
  validateClassification(value, errors);

  if (value.recordType === 'scenario') {
    requireMember(value.contractId, CONTRACT_IDS, 'attempt.contractId', errors);
    requireSafeSegment(value.scenarioId, 'attempt.scenarioId', errors);
    requireSafeSegment(value.cellId, 'attempt.cellId', errors);
    validateJsonRecord(value.expected, 'attempt.expected', errors);
  } else {
    requireMember(value.stage, PREFLIGHT_STAGES, 'attempt.stage', errors);
  }

  validateJsonRecord(value.observed, 'attempt.observed', errors);
  validateArtifactPaths(value.artifactPaths, errors);
  return errors;
}

export function canonicalJson(value) {
  return `${JSON.stringify(sortJson(value, 'value', new Set()), null, 2)}\n`;
}

export async function writeAttempt({ evidenceRoot, attempt }) {
  const errors = validateAttempt(attempt);
  if (errors.length !== 0) throw new Error(errors.join('\n'));
  if (typeof evidenceRoot !== 'string' || evidenceRoot.length === 0) {
    throw new TypeError('evidenceRoot must be a non-empty string');
  }

  const identityPath =
    attempt.recordType === 'scenario'
      ? [attempt.candidateId, attempt.contractId, attempt.scenarioId, attempt.cellId]
      : [attempt.candidateId, attempt.stage];
  const directory = join(evidenceRoot, 'attempts', attempt.recordType, ...identityPath);
  await mkdir(directory, { recursive: true });
  const path = join(directory, `attempt-${attempt.attemptNumber}.json`);
  const bytes = Buffer.from(canonicalJson(attempt));
  try {
    await writeFile(path, bytes, { flag: 'wx', mode: 0o600 });
  } catch (error) {
    if (error?.code === 'EEXIST') {
      throw new Error(`attempt already exists: ${path}`, { cause: error });
    }
    throw error;
  }
  return { path, sha256: sha256(bytes) };
}

function identityKeys(recordType) {
  return recordType === 'scenario'
    ? ['recordType', 'candidateId', 'contractId', 'scenarioId', 'cellId']
    : ['recordType', 'candidateId', 'stage'];
}

export function summarizeAttempts(attempts) {
  if (!Array.isArray(attempts) || attempts.length === 0) {
    throw new Error('attempts must be a non-empty array');
  }
  attempts.forEach((attempt, index) => {
    const errors = validateAttempt(attempt);
    if (errors.length !== 0)
      throw new Error(`attempts[${index}] is invalid:\n${errors.join('\n')}`);
  });

  const ordered = [...attempts].sort((left, right) => left.attemptNumber - right.attemptNumber);
  if (ordered[0].attemptNumber !== 1) throw new Error('attempt sequence must start at 1');
  for (let index = 1; index < ordered.length; index += 1) {
    if (ordered[index].attemptNumber === ordered[index - 1].attemptNumber) {
      throw new Error(`duplicate attempt number ${ordered[index].attemptNumber}`);
    }
    if (ordered[index].attemptNumber !== index + 1) {
      throw new Error('attempt sequence must be contiguous from 1');
    }
  }

  const first = ordered[0];
  const keys = identityKeys(first.recordType);
  for (const attempt of ordered.slice(1)) {
    if (keys.some((key) => attempt[key] !== first[key])) {
      throw new Error('retry attempt identity must exactly match attempt 1');
    }
  }

  return {
    effectiveResult: first.result,
    effectiveClassification: first.classification,
    firstAttemptNumber: first.attemptNumber,
    retryCount: ordered.length - 1,
    firstAttemptSha256: sha256(Buffer.from(canonicalJson(first))),
  };
}
