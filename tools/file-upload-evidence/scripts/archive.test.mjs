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
    userAgent: 'Mozilla/5.0 Evidence Browser/1.0',
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
    artifactMetadata: [{ path: ARTIFACT_PATH, originalName: 'capture [NVDA].png' }],
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
  memberOptions = {},
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
      Object.entries(members).map(([name, bytes]) => [
        name,
        [bytes, { mtime: ZIP_MTIME, ...memberOptions[name] }],
      ]),
    ),
    { level, mtime: ZIP_MTIME },
  );
}

function archiveWithArtifactNames(artifactNames) {
  const artifacts = artifactNames.map((name, index) => ({
    path: `artifacts/DF-FU-M01/${name}`,
    bytes: strToU8(`image-${index}`),
  }));
  const artifactPaths = artifacts.map(({ path }) => path);
  const recordBytes = strToU8(
    JSON.stringify(
      manualRecord({
        artifactPaths,
        artifactMetadata: artifactPaths.map((path) => ({
          path,
          originalName: path.slice(path.lastIndexOf('/') + 1),
        })),
      }),
    ),
  );
  const manifest = {
    schemaVersion: 1,
    kind: 'manual',
    revision: REVISION,
    deploymentUrl: DEPLOYMENT_URL,
    createdAt: CREATED_AT,
    entries: [
      ...artifacts.map(({ path, bytes }) => ({
        path,
        bytes: bytes.length,
        mediaType: 'image/png',
        sha256: sha256(bytes),
      })),
      {
        path: RECORD_PATH,
        bytes: recordBytes.length,
        mediaType: 'application/json',
        sha256: sha256(recordBytes),
      },
    ],
  };
  const members = Object.fromEntries([
    ['manifest.json', strToU8(JSON.stringify(manifest))],
    [RECORD_PATH, recordBytes],
    ...artifacts.map(({ path, bytes }) => [path, bytes]),
  ]);

  return zipSync(
    Object.fromEntries(
      Object.entries(members).map(([name, bytes]) => [name, [bytes, { mtime: ZIP_MTIME }]]),
    ),
    { level: 6, mtime: ZIP_MTIME },
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
    const localOffset = view.getUint32(offset + 42, true);
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    entries.push({
      centralOffset: offset,
      centralExtraOffset: offset + 46 + nameLength,
      extraLength,
      localOffset,
      localExtraOffset: localOffset + 30 + localNameLength,
      localExtraLength,
      localDataOffset: localOffset + 30 + localNameLength + localExtraLength,
      name: Buffer.from(bytes.buffer, bytes.byteOffset + offset + 46, nameLength).toString(),
      nameLength,
    });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function entryNamed(bytes, name) {
  const entry = centralEntries(bytes).find((candidate) => candidate.name === name);
  assert.ok(entry, `fixture entry ${name} exists`);
  return entry;
}

function appendOrphanLocalDuplicate(bytes, name, contents) {
  const orphanArchive = zipSync({ [name]: contents }, { level: 0, mtime: ZIP_MTIME });
  const orphanEntry = entryNamed(orphanArchive, name);
  const orphanView = new DataView(
    orphanArchive.buffer,
    orphanArchive.byteOffset,
    orphanArchive.byteLength,
  );
  const orphanEnd =
    orphanEntry.localDataOffset + orphanView.getUint32(orphanEntry.localOffset + 18, true);
  const orphanLocal = orphanArchive.subarray(orphanEntry.localOffset, orphanEnd);
  const originalCentralOffset = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  ).getUint32(eocdOffset(bytes) + 16, true);
  const output = new Uint8Array(bytes.length + orphanLocal.length);
  output.set(bytes.subarray(0, originalCentralOffset));
  output.set(orphanLocal, originalCentralOffset);
  output.set(bytes.subarray(originalCentralOffset), originalCentralOffset + orphanLocal.length);
  new DataView(output.buffer).setUint32(
    eocdOffset(output) + 16,
    originalCentralOffset + orphanLocal.length,
    true,
  );
  return output;
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

  it('keeps one stable descriptor when the caller path buffer changes after open starts', async () => {
    const filePath = await writeArchive(validArchive());
    const mutablePath = Buffer.from(filePath);

    const reading = readEvidenceArchive(mutablePath);
    mutablePath.fill('x');

    const result = await reading;
    assert.equal(Buffer.from(result.entries.get(ARTIFACT_PATH)).toString(), 'image');
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
      { 'ẞ.txt': strToU8('one'), 'SS.TXT': strToU8('two') },
      { 'stra\u00dfe.txt': strToU8('one'), 'STRASSE.TXT': strToU8('two') },
      { '\u03c3.txt': strToU8('one'), '\u03c2.TXT': strToU8('two') },
    ]) {
      await assert.rejects(
        readEvidenceArchive(await writeArchive(zipSync(members, { level: 0 }))),
        /duplicate/i,
      );
    }
  });

  it('does not apply Turkic folding to distinct dotless and dotted i paths', async () => {
    const result = await readEvidenceArchive(
      await writeArchive(archiveWithArtifactNames(['ı.png', 'i.PNG'])),
    );

    assert.deepEqual(
      [...result.entries.keys()].filter((path) => path.startsWith('artifacts/')).sort(),
      ['artifacts/DF-FU-M01/i.PNG', 'artifacts/DF-FU-M01/ı.png'].sort(),
    );
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

  it('rejects a local-only duplicate instead of letting it replace a central member', async () => {
    const bytes = validArchive({ level: 0 });
    const smuggled = appendOrphanLocalDuplicate(bytes, ARTIFACT_PATH, strToU8('evils'));

    await assert.rejects(
      readEvidenceArchive(await writeArchive(smuggled)),
      /duplicate local.*artifact/i,
    );
  });

  it('verifies the actual CRC-32 of the manifest and artifacts', async () => {
    for (const name of ['manifest.json', ARTIFACT_PATH]) {
      const corrupted = copyAndMutate(validArchive(), (view, entries) => {
        const entry = entries.find((candidate) => candidate.name === name);
        assert.ok(entry);
        const wrongCrc = (view.getUint32(entry.centralOffset + 16, true) ^ 0xffffffff) >>> 0;
        view.setUint32(entry.centralOffset + 16, wrongCrc, true);
        view.setUint32(entry.localOffset + 14, wrongCrc, true);
      });
      await assert.rejects(readEvidenceArchive(await writeArchive(corrupted)), /CRC-32.*mismatch/i);
    }
  });

  it('rejects ZIP64 and malformed central or local extra fields', async () => {
    const withExtra = validArchive({
      memberOptions: { [ARTIFACT_PATH]: { extra: { 0xcafe: new Uint8Array([1]) } } },
    });
    const cases = [
      copyAndMutate(withExtra, (view, entries) => {
        const entry = entries.find((candidate) => candidate.name === ARTIFACT_PATH);
        view.setUint16(entry.centralExtraOffset, 0x0001, true);
      }),
      copyAndMutate(withExtra, (view, entries) => {
        const entry = entries.find((candidate) => candidate.name === ARTIFACT_PATH);
        view.setUint16(entry.localExtraOffset, 0x0001, true);
      }),
      copyAndMutate(withExtra, (view, entries) => {
        const entry = entries.find((candidate) => candidate.name === ARTIFACT_PATH);
        view.setUint16(entry.centralExtraOffset + 2, 2, true);
      }),
      copyAndMutate(withExtra, (view, entries) => {
        const entry = entries.find((candidate) => candidate.name === ARTIFACT_PATH);
        view.setUint16(entry.localExtraOffset + 2, 2, true);
      }),
    ];

    await assert.rejects(readEvidenceArchive(await writeArchive(cases[0])), /ZIP64.*central/i);
    await assert.rejects(readEvidenceArchive(await writeArchive(cases[1])), /ZIP64.*local/i);
    await assert.rejects(readEvidenceArchive(await writeArchive(cases[2])), /malformed.*central/i);
    await assert.rejects(readEvidenceArchive(await writeArchive(cases[3])), /malformed.*local/i);
  });

  it('rejects multidisk metadata and overlapping local file regions', async () => {
    const multidisk = copyAndMutate(validArchive(), (view, _entries, bytes) => {
      view.setUint16(eocdOffset(bytes) + 4, 1, true);
    });
    await assert.rejects(readEvidenceArchive(await writeArchive(multidisk)), /multi-disk/i);

    const overlapping = copyAndMutate(validArchive({ level: 0 }), (view, entries) => {
      const ordered = [...entries].sort((left, right) => left.localOffset - right.localOffset);
      const first = ordered[0];
      const second = ordered[1];
      const spanningCompressedBytes = second.localOffset + 1 - first.localDataOffset;
      view.setUint32(first.centralOffset + 20, spanningCompressedBytes, true);
      view.setUint32(first.localOffset + 18, spanningCompressedBytes, true);
    });
    await assert.rejects(readEvidenceArchive(await writeArchive(overlapping)), /overlap/i);
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

  it('rejects a manual record whose attachment metadata is missing or does not match its path', async () => {
    await assert.rejects(
      readEvidenceArchive(
        await writeArchive(validArchive({ recordOverrides: { artifactMetadata: undefined } })),
      ),
      /manual.*record/i,
    );
    await assert.rejects(
      readEvidenceArchive(
        await writeArchive(
          validArchive({
            recordOverrides: {
              artifactMetadata: [
                { path: 'artifacts/DF-FU-M01/substituted.png', originalName: 'capture.png' },
              ],
            },
          }),
        ),
      ),
      /manual.*record/i,
    );
  });
});
