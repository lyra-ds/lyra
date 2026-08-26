import { strToU8, zipSync, type Zippable } from 'fflate';

import {
  canonicalArchivePathKey,
  EVIDENCE_SCHEMA_VERSION,
  MANUAL_MEDIA_TYPES,
  MAX_MANUAL_FILES,
  MAX_MANUAL_FILE_BYTES,
  MAX_MANUAL_SCENARIO_BYTES,
  type EvidenceEntry,
  type EvidenceManifest,
  type FileUploadManualObservation,
  type ManualScenario,
  validateManifest,
  validateObservation,
} from './contracts.ts';

const ZIP_EPOCH = new Date('1980-01-01T00:00:00.000Z');
const ZIP_MTIME = new Date(ZIP_EPOCH.getTime() + ZIP_EPOCH.getTimezoneOffset() * 60_000);
const WINDOWS_DEVICE_NAME = /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/iu;

export type ManualEvidenceAttachments = ReadonlyMap<ManualScenario, readonly File[]>;

export interface ManualEvidenceBundle {
  readonly bytes: Uint8Array;
  readonly fileName: string;
  readonly mediaType: 'application/zip';
}

interface PreparedAttachment {
  readonly bytes: Uint8Array;
  readonly file: File;
  readonly originalName: string;
  readonly sanitizedName: string;
  readonly sha256: string;
}

function archiveLeafName(value: string): string {
  const segments = value.normalize('NFC').replaceAll('\\', '/').split('/');
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const segment = segments[index];
    if (segment !== undefined && segment.length > 0 && segment !== '.' && segment !== '..') {
      return segment;
    }
  }
  return '';
}

export function sanitizeEvidenceFileName(value: string): string {
  const leaf = archiveLeafName(value);
  let sanitized = leaf
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .normalize('NFC')
    .replace(/[^A-Za-z0-9._-]/gu, '-')
    .replace(/-+/gu, '-')
    .replace(/^[.-]+|[.-]+$/gu, '');
  if (sanitized.length === 0) sanitized = 'evidence-file';
  if (WINDOWS_DEVICE_NAME.test(sanitized)) sanitized = `_${sanitized}`;
  return sanitized;
}

function suffixedFileName(name: string, ordinal: number): string {
  if (ordinal === 1) return name;
  const extensionAt = name.lastIndexOf('.');
  return extensionAt > 0
    ? `${name.slice(0, extensionAt)}-${ordinal}${name.slice(extensionAt)}`
    : `${name}-${ordinal}`;
}

async function hashBytes(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes.buffer as ArrayBuffer);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

function jsonBytes(value: unknown): Uint8Array {
  return strToU8(`${JSON.stringify(value, null, 2)}\n`);
}

function fail(message: string): never {
  throw new Error(`Cannot create evidence bundle: ${message}`);
}

async function prepareAttachments(
  scenario: ManualScenario,
  files: readonly File[],
): Promise<PreparedAttachment[]> {
  if (files.length < 1 || files.length > MAX_MANUAL_FILES) {
    fail(`${scenario} must have between one and ${MAX_MANUAL_FILES} files`);
  }

  let declaredTotal = 0;
  for (const file of files) {
    if (file.size < 1) fail(`${scenario} contains an empty file`);
    if (file.size > MAX_MANUAL_FILE_BYTES) fail(`${scenario} contains a file over 50 MiB`);
    if (!MANUAL_MEDIA_TYPES.has(file.type)) fail(`${scenario} contains an unsupported media type`);
    declaredTotal += file.size;
  }
  if (declaredTotal > MAX_MANUAL_SCENARIO_BYTES) fail(`${scenario} exceeds 100 MiB`);

  const prepared = await Promise.all(
    files.map(async (file): Promise<PreparedAttachment> => {
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (bytes.length !== file.size) fail(`${scenario} file size changed while reading`);
      return {
        bytes,
        file,
        originalName: archiveLeafName(file.name),
        sanitizedName: sanitizeEvidenceFileName(file.name),
        sha256: await hashBytes(bytes),
      };
    }),
  );

  const sourcesBySanitizedName = new Map<string, Set<string>>();
  for (const attachment of prepared) {
    const foldedName = canonicalArchivePathKey(attachment.sanitizedName);
    const sources = sourcesBySanitizedName.get(foldedName) ?? new Set<string>();
    sources.add(attachment.originalName.normalize('NFC'));
    sourcesBySanitizedName.set(foldedName, sources);
  }
  if ([...sourcesBySanitizedName.values()].some((sources) => sources.size > 1)) {
    fail(`${scenario} has a sanitized-name collision between distinct selected files`);
  }

  return prepared.sort(
    (left, right) =>
      left.sanitizedName.localeCompare(right.sanitizedName, 'en') ||
      left.sha256.localeCompare(right.sha256, 'en') ||
      left.file.type.localeCompare(right.file.type, 'en'),
  );
}

export async function createManualEvidenceBundle(
  records: readonly FileUploadManualObservation[],
  attachments: ManualEvidenceAttachments,
  createdAt?: string,
): Promise<ManualEvidenceBundle> {
  if (records.length < 1 || records.length > 2) fail('one or two manual records are required');

  const validatedRecords = records.map((record) => {
    const validation = validateObservation(record);
    if (!validation.ok)
      fail(`manual record is invalid: ${validation.errors.map(({ field }) => field).join(', ')}`);
    return validation.value;
  });
  const scenarios = new Set(validatedRecords.map(({ scenario }) => scenario));
  if (scenarios.size !== validatedRecords.length) fail('manual record scenarios must be unique');
  const recordTimestamps = validatedRecords.map(({ executedAt }) => executedAt).sort();
  const manifestCreatedAt = createdAt ?? recordTimestamps[recordTimestamps.length - 1]!;

  const { revision, deploymentUrl } = validatedRecords[0]!;
  if (
    validatedRecords.some(
      (record) => record.revision !== revision || record.deploymentUrl !== deploymentUrl,
    )
  ) {
    fail('manual records must share revision and deployment URL');
  }
  if ([...attachments.keys()].some((scenario) => !scenarios.has(scenario))) {
    fail('attachments contain a scenario without a manual record');
  }

  const members = new Map<string, Uint8Array>();
  const entries: EvidenceEntry[] = [];
  for (const record of [...validatedRecords].sort((left, right) =>
    left.scenario.localeCompare(right.scenario, 'en'),
  )) {
    const files = attachments.get(record.scenario) ?? [];
    const prepared = await prepareAttachments(record.scenario, files);
    const ordinals = new Map<string, number>();
    const generatedPaths: string[] = [];
    for (const attachment of prepared) {
      const key = canonicalArchivePathKey(attachment.sanitizedName);
      const ordinal = (ordinals.get(key) ?? 0) + 1;
      ordinals.set(key, ordinal);
      const path = `artifacts/${record.scenario}/${suffixedFileName(attachment.sanitizedName, ordinal)}`;
      generatedPaths.push(path);
      members.set(path, attachment.bytes);
      entries.push({
        path,
        bytes: attachment.bytes.length,
        mediaType: attachment.file.type,
        sha256: attachment.sha256,
      });
    }
    if ([...generatedPaths].sort().join('\0') !== [...record.artifactPaths].sort().join('\0')) {
      fail(`${record.scenario} artifact paths do not match selected files`);
    }

    const path = `manual/${record.scenario}.json`;
    const bytes = jsonBytes(record);
    members.set(path, bytes);
    entries.push({
      path,
      bytes: bytes.length,
      mediaType: 'application/json',
      sha256: await hashBytes(bytes),
    });
  }

  entries.sort((left, right) => left.path.localeCompare(right.path, 'en'));
  const manifest: EvidenceManifest = {
    schemaVersion: EVIDENCE_SCHEMA_VERSION,
    kind: 'manual',
    revision,
    deploymentUrl,
    createdAt: manifestCreatedAt,
    entries,
  };
  if (!validateManifest(manifest).ok) fail('generated manifest is invalid');
  members.set('manifest.json', jsonBytes(manifest));

  const zipped: Zippable = {};
  for (const [path, bytes] of [...members.entries()].sort(([left], [right]) =>
    left.localeCompare(right, 'en'),
  )) {
    zipped[path] = [bytes, { mtime: ZIP_MTIME }];
  }
  return {
    bytes: zipSync(zipped, { level: 6, mtime: ZIP_MTIME }),
    fileName: `lyra-file-upload-evidence-${revision.slice(0, 12)}.zip`,
    mediaType: 'application/zip',
  };
}
