import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { strToU8, zipSync } from 'fflate';

import { readEvidenceArchive } from './archive.mjs';

const { afterEach, describe, it } = process.env.VITEST
  ? await import('vitest')
  : await import('node:test');

const REVISION = '1234567890abcdef1234567890abcdef12345678';
const OTHER_REVISION = 'abcdef1234567890abcdef1234567890abcdef12';
const DEPLOYMENT_URL = 'https://a1b2c3d4.lyra-ds-docs.pages.dev/en/file-upload-evidence/';
const OTHER_DEPLOYMENT_URL = 'https://b1b2c3d4.lyra-ds-docs.pages.dev/en/file-upload-evidence/';
const CREATED_AT = '2026-08-26T12:00:00.000Z';
const ARTIFACT_PATH = 'artifacts/DF-FU-M01/capture.png';
const RECORD_PATH = 'manual/DF-FU-M01.json';
const ZIP_EPOCH = new Date('1980-01-01T00:00:00.000Z');
const ZIP_MTIME = new Date(ZIP_EPOCH.getTime() + ZIP_EPOCH.getTimezoneOffset() * 60_000);
const temporaryRoots = [];

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function manualRecord(overrides = {}) {
  return {
    scenario: 'DF-FU-M01',
    locale: 'en',
    revision: REVISION,
    deploymentUrl: DEPLOYMENT_URL,
    executedAt: CREATED_AT,
    timezone: 'America/New_York',
    os: { name: 'Windows', version: '11', build: '24H2' },
    browser: { name: 'Firefox', version: '141' },
    assistiveTechnology: { name: 'NVDA', version: '2026.2' },
    inputMethods: ['keyboard'],
    viewport: { width: 1280, height: 720, devicePixelRatio: 1 },
    mediaQueries: { '(pointer: coarse)': false },
    expected: 'The complete workflow is announced coherently.',
    actual: 'The complete workflow was announced coherently.',
    checkAttestations: {
      'DF-FU-M01-selection-and-indeterminate-announcements': true,
      'DF-FU-M01-determinate-progress-milestones': true,
      'DF-FU-M01-lifecycle-recovery-and-stale-result': true,
    },
    result: 'PASS',
    reviewer: { name: 'Evidence Reviewer', approval: 'approved' },
    artifactPaths: [ARTIFACT_PATH],
    findingUrls: [],
    ...overrides,
  };
}

function validArchive({
  recordOverrides,
  manifestOverrides,
  artifactEntryOverrides,
  artifactBytes = strToU8('image'),
  omitArtifact = false,
  extraMembers = {},
  level = 6,
} = {}) {
  const recordBytes = strToU8(JSON.stringify(manualRecord(recordOverrides)));
  const manifest = {
    schemaVersion: 1,
    kind: 'manual',
    revision: REVISION,
    deploymentUrl: DEPLOYMENT_URL,
    createdAt: CREATED_AT,
    entries: [
      {
        path: ARTIFACT_PATH,
        bytes: artifactBytes.length,
        mediaType: 'image/png',
        sha256: sha256(artifactBytes),
        ...artifactEntryOverrides,
      },
      {
        path: RECORD_PATH,
        bytes: recordBytes.length,
        mediaType: 'application/json',
        sha256: sha256(recordBytes),
      },
    ],
    ...manifestOverrides,
  };
  const members = {
    'manifest.json': strToU8(JSON.stringify(manifest)),
    [RECORD_PATH]: recordBytes,
    ...(!omitArtifact ? { [ARTIFACT_PATH]: artifactBytes } : {}),
    ...extraMembers,
  };
  return zipSync(
    Object.fromEntries(
      Object.entries(members).map(([name, bytes]) => [name, [bytes, { mtime: ZIP_MTIME }]]),
    ),
    { level, mtime: ZIP_MTIME },
  );
}

async function writeArchive(bytes) {
  const root = await mkdtemp(join(tmpdir(), 'lyra-hostile-zip-'));
  temporaryRoots.push(root);
  const path = join(root, 'evidence.zip');
  await writeFile(path, bytes);
  return path;
}

function eocdOffset(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 65_557); offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) return offset;
  }
  throw new Error('fixture has no EOCD');
}

function centralEntries(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocd = eocdOffset(bytes);
  const count = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  const entries = [];
  for (let index = 0; index < count; index += 1) {
    assert.equal(view.getUint32(offset, true), 0x02014b50);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    entries.push({
      centralOffset: offset,
      localOffset: view.getUint32(offset + 42, true),
      nameLength,
    });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function copyAndMutate(bytes, mutate) {
  const copy = bytes.slice();
  mutate(new DataView(copy.buffer, copy.byteOffset, copy.byteLength), centralEntries(copy), copy);
  return copy;
}

function setFlags(bytes, flags) {
  return copyAndMutate(bytes, (view, entries) => {
    for (const entry of entries) {
      view.setUint16(entry.centralOffset + 8, flags, true);
      view.setUint16(entry.localOffset + 6, flags, true);
    }
  });
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true })));
});

describe('readEvidenceArchive', () => {
  it('returns verified entries for deterministic deflate and store archives', async () => {
    for (const level of [0, 6]) {
      const result = await readEvidenceArchive(await writeArchive(validArchive({ level })), {
        expectedKind: 'manual',
      });
      assert.equal(result.manifest.revision, REVISION);
      assert.deepEqual([...result.entries.keys()].sort(), [ARTIFACT_PATH, RECORD_PATH]);
      assert.equal(Buffer.from(result.entries.get(ARTIFACT_PATH)).toString(), 'image');
    }
  });

  it('rejects traversal, absolute, backslash, NUL, empty-segment, and non-NFC paths', async () => {
    for (const path of [
      '../escape',
      '/absolute',
      'folder\\file',
      'nul\0file',
      'folder//file',
      'cafe\u0301.txt',
    ]) {
      const bytes = zipSync({ [path]: strToU8('x') }, { level: 0 });
      await assert.rejects(readEvidenceArchive(await writeArchive(bytes)), /archive path/i, path);
    }
  });

  it('rejects case-folded and Unicode case-folded duplicate paths', async () => {
    for (const members of [
      { 'A.txt': strToU8('one'), 'a.txt': strToU8('two') },
      { 'caf\u00e9.txt': strToU8('one'), 'CAF\u00c9.txt': strToU8('two') },
    ]) {
      await assert.rejects(
        readEvidenceArchive(await writeArchive(zipSync(members, { level: 0 }))),
        /duplicate/i,
      );
    }
  });

  it('rejects directory and Unix symlink entries during central-directory preflight', async () => {
    await assert.rejects(
      readEvidenceArchive(await writeArchive(zipSync({ 'folder/': new Uint8Array() }))),
      /directory/i,
    );

    const symlink = copyAndMutate(validArchive(), (view, entries) => {
      const entry = entries[0];
      view.setUint16(entry.centralOffset + 4, (3 << 8) | 20, true);
      view.setUint32(entry.centralOffset + 38, (0o120777 << 16) >>> 0, true);
    });
    await assert.rejects(readEvidenceArchive(await writeArchive(symlink)), /symlink/i);
  });

  it('rejects encrypted, data-descriptor, and unsupported-compression flags before extraction', async () => {
    await assert.rejects(
      readEvidenceArchive(await writeArchive(setFlags(validArchive(), 1))),
      /encrypted/i,
    );
    await assert.rejects(
      readEvidenceArchive(await writeArchive(setFlags(validArchive(), 8))),
      /data descriptor/i,
    );

    const unsupported = copyAndMutate(validArchive(), (view, entries) => {
      const entry = entries[0];
      view.setUint16(entry.centralOffset + 10, 99, true);
      view.setUint16(entry.localOffset + 8, 99, true);
    });
    await assert.rejects(
      readEvidenceArchive(await writeArchive(unsupported)),
      /compression method/i,
    );
  });

  it('rejects local and central names that diverge', async () => {
    const divergent = copyAndMutate(validArchive(), (_view, entries, bytes) => {
      const entry = entries[0];
      bytes[entry.localOffset + 30] = 'X'.charCodeAt(0);
    });
    await assert.rejects(readEvidenceArchive(await writeArchive(divergent)), /local.*central/i);
  });

  it('enforces compressed and declared expanded limits before materializing entries', async () => {
    const bytes = validArchive({ artifactEntryOverrides: { bytes: 1 } });
    await assert.rejects(
      readEvidenceArchive(await writeArchive(bytes), { maxCompressedBytes: bytes.length - 1 }),
      /compressed.*limit/i,
    );
    await assert.rejects(
      readEvidenceArchive(await writeArchive(bytes), { maxExpandedBytes: 1 }),
      /expanded.*limit/i,
    );
  });

  it('stops streaming extraction when actual output exceeds the declared bound', async () => {
    const bytes = validArchive({ artifactEntryOverrides: { bytes: 1 } });
    const understated = copyAndMutate(bytes, (view, entries) => {
      const entry = entries.find(({ centralOffset }) => {
        const nameLength = view.getUint16(centralOffset + 28, true);
        const start = centralOffset + 46;
        return (
          Buffer.from(view.buffer, view.byteOffset + start, nameLength).toString() === ARTIFACT_PATH
        );
      });
      view.setUint32(entry.centralOffset + 24, 1, true);
      view.setUint32(entry.localOffset + 22, 1, true);
    });
    const declaredExpanded = centralEntries(understated).reduce((total, entry) => {
      const view = new DataView(understated.buffer, understated.byteOffset, understated.byteLength);
      return total + view.getUint32(entry.centralOffset + 24, true);
    }, 0);
    await assert.rejects(
      readEvidenceArchive(await writeArchive(understated), {
        maxExpandedBytes: declaredExpanded,
      }),
      /actual expanded.*limit/i,
    );
  });

  it('rejects unknown and missing archive members', async () => {
    await assert.rejects(
      readEvidenceArchive(
        await writeArchive(validArchive({ extraMembers: { 'rogue.txt': strToU8('rogue') } })),
      ),
      /unknown member/i,
    );
    await assert.rejects(
      readEvidenceArchive(await writeArchive(validArchive({ omitArtifact: true }))),
      /missing member/i,
    );
  });

  it('rejects manifest entry-size, digest, and media-type mismatches', async () => {
    const cases = [
      validArchive({ artifactEntryOverrides: { bytes: 4 } }),
      validArchive({ artifactEntryOverrides: { sha256: '0'.repeat(64) } }),
      validArchive({ artifactEntryOverrides: { mediaType: 'application/pdf' } }),
    ];
    await assert.rejects(readEvidenceArchive(await writeArchive(cases[0])), /entry size/i);
    await assert.rejects(readEvidenceArchive(await writeArchive(cases[1])), /digest/i);
    await assert.rejects(readEvidenceArchive(await writeArchive(cases[2])), /manifest/i);
  });

  it('rejects kind, record revision, and record deployment mismatches', async () => {
    await assert.rejects(
      readEvidenceArchive(await writeArchive(validArchive()), { expectedKind: 'automation' }),
      /kind/i,
    );
    await assert.rejects(
      readEvidenceArchive(
        await writeArchive(validArchive({ recordOverrides: { revision: OTHER_REVISION } })),
      ),
      /record.*revision/i,
    );
    await assert.rejects(
      readEvidenceArchive(
        await writeArchive(
          validArchive({ recordOverrides: { deploymentUrl: OTHER_DEPLOYMENT_URL } }),
        ),
      ),
      /record.*deployment/i,
    );
  });
});
