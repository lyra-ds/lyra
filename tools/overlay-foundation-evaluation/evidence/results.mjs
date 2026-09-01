import { constants as fsConstants } from 'node:fs';
import { lstat, mkdir, open, realpath } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';

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

export async function readDirectoryIdentity(path) {
  const info = await lstat(path, { bigint: true });
  if (!info.isDirectory() || info.isSymbolicLink()) {
    throw new Error('evidence directory must be a real directory, not a symbolic link');
  }
  return { device: info.dev, inode: info.ino };
}

function sameDirectoryIdentity(left, right) {
  return left.device === right.device && left.inode === right.inode;
}

function isInsideOrEqual(parent, child) {
  const childRelative = relative(parent, child);
  return childRelative === '' || (!childRelative.startsWith('..') && !isAbsolute(childRelative));
}

function relativeEvidenceSegments(value) {
  if (typeof value !== 'string' || value.length === 0 || value.includes('\\')) {
    throw new Error('evidence path must be a traversal-safe relative path');
  }
  const segments = value.split('/');
  const errors = [];
  for (const segment of segments) requireSafeSegment(segment, 'evidence path', errors);
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    errors.push('evidence path must be a traversal-safe relative path');
  }
  if (errors.length > 0) throw new Error(errors.join('\n'));
  return segments;
}

async function requirePinnedRoot(root, pinned) {
  const current = await readDirectoryIdentity(root);
  if (!sameDirectoryIdentity(pinned, current)) {
    throw new Error('evidence root identity changed during write');
  }
}

async function ensureEvidenceDirectory(evidenceRoot, segments) {
  if (typeof evidenceRoot !== 'string' || !isAbsolute(evidenceRoot)) {
    throw new TypeError('evidenceRoot must be an absolute path');
  }
  const root = resolve(evidenceRoot);
  const canonicalRoot = await realpath(root);
  if (canonicalRoot !== root) {
    throw new Error('evidenceRoot path must not contain a symbolic link');
  }
  const pinned = await readDirectoryIdentity(root);
  let directory = root;
  for (const segment of segments) {
    directory = join(directory, segment);
    try {
      await mkdir(directory, { mode: 0o700 });
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
    }
    const info = await lstat(directory, { bigint: true });
    if (!info.isDirectory() || info.isSymbolicLink()) {
      throw new Error(`evidence descendant must not be a symbolic link: ${directory}`);
    }
    const canonicalDirectory = await realpath(directory);
    if (!isInsideOrEqual(canonicalRoot, canonicalDirectory)) {
      throw new Error(`evidence descendant escapes canonical containment: ${directory}`);
    }
    await requirePinnedRoot(root, pinned);
  }
  return { directory, pinned, root };
}

async function writeExclusiveEvidenceBytes({ evidenceRoot, relativePath, bytes }) {
  const segments = relativeEvidenceSegments(relativePath);
  const filename = segments.pop();
  const { directory, pinned, root } = await ensureEvidenceDirectory(evidenceRoot, segments);
  const path = join(directory, filename);
  let output;
  try {
    output = await open(
      path,
      fsConstants.O_NOFOLLOW | fsConstants.O_EXCL | fsConstants.O_CREAT | fsConstants.O_WRONLY,
      0o600,
    );
    await output.writeFile(bytes);
  } finally {
    await output?.close();
  }
  await requirePinnedRoot(root, pinned);
  const written = await lstat(path, { bigint: true });
  if (!written.isFile() || written.isSymbolicLink() || written.size !== BigInt(bytes.byteLength)) {
    throw new Error('evidence file identity or size changed during write');
  }
  return path;
}

export async function writeEvidenceFile({ evidenceRoot, relativePath, bytes, expectedSha256 }) {
  const body = Buffer.from(bytes);
  const digest = sha256(body);
  if (digest !== expectedSha256) throw new Error('evidence file checksum mismatch');
  const path = await writeExclusiveEvidenceBytes({ evidenceRoot, relativePath, bytes: body });
  return { path, relativePath, sha256: digest };
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

    const sorted = Object.create(null);
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
  const identityPath =
    attempt.recordType === 'scenario'
      ? [attempt.candidateId, attempt.contractId, attempt.scenarioId, attempt.cellId]
      : [attempt.candidateId, attempt.stage];
  const relativePath = [
    'attempts',
    attempt.recordType,
    ...identityPath,
    `attempt-${attempt.attemptNumber}.json`,
  ].join('/');
  const bytes = Buffer.from(canonicalJson(attempt));
  let path;
  try {
    path = await writeExclusiveEvidenceBytes({ evidenceRoot, relativePath, bytes });
  } catch (error) {
    if (error?.code === 'EEXIST') {
      throw new Error(`attempt already exists: ${error.path ?? relativePath}`, { cause: error });
    }
    throw error;
  }
  return { path, sha256: sha256(bytes) };
}

function identityKeys(recordType) {
  return recordType === 'scenario'
    ? ['recordType', 'runId', 'candidateId', 'contractId', 'scenarioId', 'cellId']
    : ['recordType', 'runId', 'candidateId', 'stage'];
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
