import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { open } from 'node:fs/promises';

import { Unzip, UnzipInflate, UnzipPassThrough } from 'fflate';

import {
  MAX_ARCHIVE_EXPANDED_BYTES,
  validateAutomatedResult,
  validateManifest,
  validateObservation,
} from '../src/contracts.ts';

const DEFAULT_COMPRESSED_LIMIT = 120 * 1024 * 1024;
const EOCD_MIN_BYTES = 22;
const EOCD_MAX_BYTES = 65_557;
const CENTRAL_HEADER_BYTES = 46;
const LOCAL_HEADER_BYTES = 30;
const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;
const UTF8_FLAG = 0x0800;
const ENCRYPTION_FLAGS = 0x2041;
const DATA_DESCRIPTOR_FLAG = 0x0008;
const UNIX_FILE_TYPE_MASK = 0o170000;
const UNIX_DIRECTORY = 0o040000;
const UNIX_SYMLINK = 0o120000;
const decoder = new TextDecoder('utf-8', { fatal: true });

function archiveError(message) {
  return new Error(`Invalid evidence archive: ${message}`);
}

function uint16(bytes, offset) {
  return bytes.getUint16(offset, true);
}

function uint32(bytes, offset) {
  return bytes.getUint32(offset, true);
}

function assertLimit(value, name) {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new TypeError(`${name} must be a positive safe integer`);
  }
}

function decodeName(bytes, flags) {
  if ((flags & UTF8_FLAG) === 0 && bytes.some((value) => value > 0x7f)) {
    throw archiveError('non-ASCII archive paths must use the UTF-8 flag');
  }
  try {
    return decoder.decode(bytes);
  } catch {
    throw archiveError('archive path is not valid UTF-8');
  }
}

function validateArchivePath(path) {
  if (
    path.length === 0 ||
    path !== path.trim() ||
    path !== path.normalize('NFC') ||
    path.startsWith('/') ||
    /^[A-Za-z]:\//u.test(path) ||
    path.includes('\\') ||
    /[\u0000-\u001f\u007f]/u.test(path)
  ) {
    throw archiveError(`unsafe archive path: ${JSON.stringify(path)}`);
  }
  const segments = path.split('/');
  if (
    path.endsWith('/') ||
    segments.some((segment) => segment.length === 0 || segment === '.' || segment === '..')
  ) {
    throw archiveError(`unsafe archive path: ${JSON.stringify(path)}`);
  }
}

async function readExactly(handle, length, position, label) {
  const bytes = Buffer.alloc(length);
  const { bytesRead } = await handle.read(bytes, 0, length, position);
  if (bytesRead !== length) throw archiveError(`truncated ${label}`);
  return bytes;
}

async function locateEocd(handle, archiveBytes) {
  if (archiveBytes < EOCD_MIN_BYTES) throw archiveError('missing end of central directory');
  const tailLength = Math.min(archiveBytes, EOCD_MAX_BYTES);
  const tailOffset = archiveBytes - tailLength;
  const tail = await readExactly(handle, tailLength, tailOffset, 'end of central directory');
  const view = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);
  for (let offset = tailLength - EOCD_MIN_BYTES; offset >= 0; offset -= 1) {
    if (uint32(view, offset) !== EOCD_SIGNATURE) continue;
    const commentLength = uint16(view, offset + 20);
    if (offset + EOCD_MIN_BYTES + commentLength === tailLength) {
      return { bytes: view, offset, absoluteOffset: tailOffset + offset };
    }
  }
  throw archiveError('missing end of central directory');
}

function inspectCentralEntry(view, offset) {
  if (
    offset + CENTRAL_HEADER_BYTES > view.byteLength ||
    uint32(view, offset) !== CENTRAL_SIGNATURE
  ) {
    throw archiveError('malformed central directory entry');
  }
  const creatorOs = view.getUint8(offset + 5);
  const flags = uint16(view, offset + 8);
  const compression = uint16(view, offset + 10);
  const crc32 = uint32(view, offset + 16);
  const compressedBytes = uint32(view, offset + 20);
  const expandedBytes = uint32(view, offset + 24);
  const nameLength = uint16(view, offset + 28);
  const extraLength = uint16(view, offset + 30);
  const commentLength = uint16(view, offset + 32);
  const disk = uint16(view, offset + 34);
  const externalAttributes = uint32(view, offset + 38);
  const localOffset = uint32(view, offset + 42);
  const end = offset + CENTRAL_HEADER_BYTES + nameLength + extraLength + commentLength;
  if (end > view.byteLength) throw archiveError('truncated central directory entry');
  if (disk !== 0) throw archiveError('multi-disk ZIP archives are not supported');
  if ((flags & ENCRYPTION_FLAGS) !== 0) throw archiveError('encrypted entries are not supported');
  if ((flags & DATA_DESCRIPTOR_FLAG) !== 0) {
    throw archiveError('data descriptor entries are not supported');
  }
  if (compression !== 0 && compression !== 8) {
    throw archiveError(`compression method ${compression} is not supported`);
  }
  const nameBytes = new Uint8Array(
    view.buffer,
    view.byteOffset + offset + CENTRAL_HEADER_BYTES,
    nameLength,
  );
  const name = decodeName(nameBytes, flags);
  if (name.endsWith('/')) throw archiveError(`directory entry is not allowed: ${name}`);
  validateArchivePath(name);

  const unixMode = externalAttributes >>> 16;
  const unixFileType = unixMode & UNIX_FILE_TYPE_MASK;
  if ((creatorOs === 3 || creatorOs === 19) && unixFileType === UNIX_SYMLINK) {
    throw archiveError(`symlink entry is not allowed: ${name}`);
  }
  if (
    name.endsWith('/') ||
    (externalAttributes & 0x10) !== 0 ||
    ((creatorOs === 3 || creatorOs === 19) && unixFileType === UNIX_DIRECTORY)
  ) {
    throw archiveError(`directory entry is not allowed: ${name}`);
  }

  return {
    compressedBytes,
    compression,
    crc32,
    end,
    expandedBytes,
    flags,
    localOffset,
    name,
    nameBytes: Uint8Array.from(nameBytes),
  };
}

async function inspectLocalEntry(handle, archiveBytes, centralOffset, entry) {
  if (entry.localOffset + LOCAL_HEADER_BYTES > centralOffset) {
    throw archiveError(`local header is outside the file-data region: ${entry.name}`);
  }
  const header = await readExactly(handle, LOCAL_HEADER_BYTES, entry.localOffset, 'local header');
  const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
  if (uint32(view, 0) !== LOCAL_SIGNATURE)
    throw archiveError(`missing local header: ${entry.name}`);
  const flags = uint16(view, 6);
  const compression = uint16(view, 8);
  const crc32 = uint32(view, 14);
  const compressedBytes = uint32(view, 18);
  const expandedBytes = uint32(view, 22);
  const nameLength = uint16(view, 26);
  const extraLength = uint16(view, 28);
  if (
    flags !== entry.flags ||
    compression !== entry.compression ||
    crc32 !== entry.crc32 ||
    compressedBytes !== entry.compressedBytes ||
    expandedBytes !== entry.expandedBytes
  ) {
    throw archiveError(`local and central metadata differ: ${entry.name}`);
  }
  const variableLength = nameLength + extraLength;
  const variable = await readExactly(
    handle,
    variableLength,
    entry.localOffset + LOCAL_HEADER_BYTES,
    'local name and extra fields',
  );
  const localNameBytes = variable.subarray(0, nameLength);
  const localName = decodeName(localNameBytes, flags);
  if (
    localName !== entry.name ||
    !Buffer.from(localNameBytes).equals(Buffer.from(entry.nameBytes))
  ) {
    throw archiveError(`local and central names differ: ${entry.name}`);
  }
  const dataOffset = entry.localOffset + LOCAL_HEADER_BYTES + variableLength;
  const dataEnd = dataOffset + entry.compressedBytes;
  if (!Number.isSafeInteger(dataEnd) || dataEnd > centralOffset || dataEnd > archiveBytes) {
    throw archiveError(`compressed data is out of bounds: ${entry.name}`);
  }
  return { dataEnd, dataOffset, localOffset: entry.localOffset, name: entry.name };
}

async function preflightArchive(filePath, maxCompressedBytes, maxExpandedBytes) {
  const handle = await open(filePath, 'r');
  try {
    const stats = await handle.stat();
    if (!stats.isFile()) throw archiveError('input must be a regular file');
    if (stats.size > maxCompressedBytes) throw archiveError('compressed byte limit exceeded');
    const eocd = await locateEocd(handle, stats.size);
    const disk = uint16(eocd.bytes, eocd.offset + 4);
    const centralDisk = uint16(eocd.bytes, eocd.offset + 6);
    const diskEntries = uint16(eocd.bytes, eocd.offset + 8);
    const entryCount = uint16(eocd.bytes, eocd.offset + 10);
    const centralBytes = uint32(eocd.bytes, eocd.offset + 12);
    const centralOffset = uint32(eocd.bytes, eocd.offset + 16);
    if (
      disk !== 0 ||
      centralDisk !== 0 ||
      diskEntries !== entryCount ||
      entryCount === 0xffff ||
      centralBytes === 0xffffffff ||
      centralOffset === 0xffffffff
    ) {
      throw archiveError('multi-disk and ZIP64 archives are not supported');
    }
    if (centralOffset + centralBytes !== eocd.absoluteOffset || centralBytes > stats.size) {
      throw archiveError('central directory bounds are invalid');
    }

    const central = await readExactly(handle, centralBytes, centralOffset, 'central directory');
    const view = new DataView(central.buffer, central.byteOffset, central.byteLength);
    const entries = [];
    const canonicalNames = new Set();
    let offset = 0;
    let declaredCompressed = 0;
    let declaredExpanded = 0;
    for (let index = 0; index < entryCount; index += 1) {
      const entry = inspectCentralEntry(view, offset);
      const canonicalName = entry.name.normalize('NFC').toLocaleLowerCase('en-US');
      if (canonicalNames.has(canonicalName)) {
        throw archiveError(`duplicate archive path: ${entry.name}`);
      }
      canonicalNames.add(canonicalName);
      declaredCompressed += entry.compressedBytes;
      declaredExpanded += entry.expandedBytes;
      if (
        !Number.isSafeInteger(declaredCompressed) ||
        entry.compressedBytes > maxCompressedBytes ||
        declaredCompressed > maxCompressedBytes
      ) {
        throw archiveError('compressed byte limit exceeded');
      }
      if (!Number.isSafeInteger(declaredExpanded) || declaredExpanded > maxExpandedBytes) {
        throw archiveError('declared expanded byte limit exceeded');
      }
      entries.push(entry);
      offset = entry.end;
    }
    if (offset !== central.byteLength)
      throw archiveError('central directory entry count is invalid');

    const localRanges = [];
    for (const entry of entries) {
      localRanges.push(await inspectLocalEntry(handle, stats.size, centralOffset, entry));
    }
    localRanges.sort((left, right) => left.localOffset - right.localOffset);
    for (let index = 1; index < localRanges.length; index += 1) {
      if (localRanges[index].localOffset < localRanges[index - 1].dataEnd) {
        throw archiveError('local file regions overlap');
      }
    }
    return { archiveBytes: stats.size, entries };
  } finally {
    await handle.close();
  }
}

function extractSelectedEntries(
  filePath,
  centralEntries,
  wantedNames,
  maxExpandedBytes,
  initialExpandedBytes = 0,
) {
  return new Promise((resolve, reject) => {
    const metadata = new Map(centralEntries.map((entry) => [entry.name, entry]));
    const completed = new Set();
    const output = new Map();
    let actualExpanded = initialExpandedBytes;
    let inputEnded = false;
    let settled = false;
    let stream;

    const finish = () => {
      if (!settled && inputEnded && completed.size === wantedNames.size) {
        settled = true;
        resolve(output);
      }
    };
    const fail = (error) => {
      if (settled) return;
      settled = true;
      stream?.destroy();
      reject(error instanceof Error ? error : archiveError(String(error)));
    };
    const unzip = new Unzip((file) => {
      try {
        const entry = metadata.get(file.name);
        if (entry === undefined)
          throw archiveError(`stream exposed an unknown entry: ${file.name}`);
        if (!wantedNames.has(file.name)) return;
        if (
          file.compression !== entry.compression ||
          file.size !== entry.compressedBytes ||
          file.originalSize !== entry.expandedBytes
        ) {
          throw archiveError(`stream metadata differs from central directory: ${file.name}`);
        }
        const bytes = new Uint8Array(entry.expandedBytes);
        let entryBytes = 0;
        file.ondata = (error, chunk, final) => {
          if (error) return fail(error);
          if (chunk !== null && chunk.length > 0) {
            actualExpanded += chunk.length;
            const nextEntryBytes = entryBytes + chunk.length;
            if (actualExpanded > maxExpandedBytes) {
              return fail(archiveError('actual expanded byte limit exceeded'));
            }
            if (nextEntryBytes > entry.expandedBytes) {
              return fail(archiveError(`actual entry size exceeds its declaration: ${file.name}`));
            }
            bytes.set(chunk, entryBytes);
            entryBytes = nextEntryBytes;
          }
          if (final) {
            if (entryBytes !== entry.expandedBytes) {
              return fail(archiveError(`actual entry size mismatch: ${file.name}`));
            }
            output.set(file.name, bytes);
            completed.add(file.name);
            finish();
          }
        };
        file.start();
      } catch (error) {
        fail(error);
      }
    });
    unzip.register(UnzipPassThrough);
    unzip.register(UnzipInflate);

    stream = createReadStream(filePath, { highWaterMark: 64 * 1024 });
    stream.on('data', (chunk) => {
      if (settled) return;
      try {
        unzip.push(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength));
      } catch (error) {
        fail(error);
      }
    });
    stream.on('error', fail);
    stream.on('end', () => {
      if (settled) return;
      try {
        unzip.push(new Uint8Array(), true);
        inputEnded = true;
        if (completed.size !== wantedNames.size) {
          const missing = [...wantedNames].filter((name) => !completed.has(name));
          throw archiveError(`stream is missing entries: ${missing.join(', ')}`);
        }
        finish();
      } catch (error) {
        fail(error);
      }
    });
  });
}

function parseJson(bytes, label) {
  try {
    return JSON.parse(decoder.decode(bytes));
  } catch {
    throw archiveError(`${label} is not valid UTF-8 JSON`);
  }
}

function assertSameMembers(centralEntries, manifest) {
  const actual = new Set(centralEntries.map(({ name }) => name));
  const expected = new Set(['manifest.json', ...manifest.entries.map(({ path }) => path)]);
  const unknown = [...actual].filter((name) => !expected.has(name));
  if (unknown.length > 0) throw archiveError(`unknown member: ${unknown.join(', ')}`);
  const missing = [...expected].filter((name) => !actual.has(name));
  if (missing.length > 0) throw archiveError(`missing member: ${missing.join(', ')}`);
}

function validateEmbeddedRecords(manifest, entries) {
  const recordPaths = manifest.entries
    .map(({ path }) => path)
    .filter((path) => path.startsWith(manifest.kind === 'manual' ? 'manual/' : 'automation/'));
  if (recordPaths.length === 0) throw archiveError(`${manifest.kind} archive has no result record`);
  const referencedArtifacts = new Set();
  for (const path of recordPaths) {
    const record = parseJson(entries.get(path), path);
    if (record.revision !== manifest.revision)
      throw archiveError(`record revision mismatch: ${path}`);
    if (record.deploymentUrl !== manifest.deploymentUrl) {
      throw archiveError(`record deployment mismatch: ${path}`);
    }
    const validation =
      manifest.kind === 'manual'
        ? validateObservation(record)
        : validateAutomatedResult(record, {
            revision: manifest.revision,
            deploymentUrl: manifest.deploymentUrl,
          });
    if (!validation.ok) throw archiveError(`invalid ${manifest.kind} result record: ${path}`);
    const expectedScenario = path.slice(path.lastIndexOf('/') + 1, -'.json'.length);
    if (validation.value.scenario !== expectedScenario) {
      throw archiveError(`record scenario does not match its path: ${path}`);
    }
    const artifactPaths =
      manifest.kind === 'manual'
        ? validation.value.artifactPaths
        : validation.value.runs.flatMap((run) => run.artifactPaths);
    for (const artifactPath of artifactPaths) referencedArtifacts.add(artifactPath);
  }
  const manifestArtifacts = manifest.entries
    .map(({ path }) => path)
    .filter((path) => path.startsWith('artifacts/'));
  if (
    manifestArtifacts.some((path) => !referencedArtifacts.has(path)) ||
    [...referencedArtifacts].some((path) => !manifestArtifacts.includes(path))
  ) {
    throw archiveError('result record artifact paths do not match manifest entries');
  }
}

export async function readEvidenceArchive(
  filePath,
  {
    expectedKind,
    expectedRevision,
    expectedDeploymentUrl,
    maxCompressedBytes = DEFAULT_COMPRESSED_LIMIT,
    maxExpandedBytes = MAX_ARCHIVE_EXPANDED_BYTES,
  } = {},
) {
  assertLimit(maxCompressedBytes, 'maxCompressedBytes');
  assertLimit(maxExpandedBytes, 'maxExpandedBytes');
  if (expectedKind !== undefined && expectedKind !== 'manual' && expectedKind !== 'automation') {
    throw new TypeError('expectedKind must be manual or automation');
  }

  const preflight = await preflightArchive(filePath, maxCompressedBytes, maxExpandedBytes);
  const centralByName = new Map(preflight.entries.map((entry) => [entry.name, entry]));
  if (!centralByName.has('manifest.json')) throw archiveError('missing member: manifest.json');

  const manifestOnly = await extractSelectedEntries(
    filePath,
    preflight.entries,
    new Set(['manifest.json']),
    maxExpandedBytes,
  );
  const manifestSource = parseJson(manifestOnly.get('manifest.json'), 'manifest.json');
  const manifestValidation = validateManifest(manifestSource, {
    ...(expectedRevision === undefined ? {} : { revision: expectedRevision }),
    ...(expectedDeploymentUrl === undefined ? {} : { deploymentUrl: expectedDeploymentUrl }),
  });
  if (!manifestValidation.ok) throw archiveError('manifest validation failed');
  const manifest = manifestValidation.value;
  if (expectedKind !== undefined && manifest.kind !== expectedKind) {
    throw archiveError(`manifest kind mismatch: expected ${expectedKind}`);
  }

  for (const entry of manifest.entries) {
    const central = centralByName.get(entry.path);
    if (central !== undefined && central.expandedBytes !== entry.bytes) {
      throw archiveError(`manifest entry size mismatch: ${entry.path}`);
    }
  }
  assertSameMembers(preflight.entries, manifest);

  const wanted = new Set(manifest.entries.map(({ path }) => path));
  const entries = await extractSelectedEntries(
    filePath,
    preflight.entries,
    wanted,
    maxExpandedBytes,
    centralByName.get('manifest.json').expandedBytes,
  );
  for (const entry of manifest.entries) {
    const bytes = entries.get(entry.path);
    if (bytes === undefined) throw archiveError(`missing member: ${entry.path}`);
    if (bytes.length !== entry.bytes)
      throw archiveError(`manifest entry size mismatch: ${entry.path}`);
    if (createHash('sha256').update(bytes).digest('hex') !== entry.sha256) {
      throw archiveError(`manifest digest mismatch: ${entry.path}`);
    }
  }
  validateEmbeddedRecords(manifest, entries);

  return {
    manifest,
    entries: new Map(
      [...entries.entries()].sort(([left], [right]) => left.localeCompare(right, 'en')),
    ),
  };
}
