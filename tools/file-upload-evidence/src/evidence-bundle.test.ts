import { createHash } from 'node:crypto';

import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';

import { SCENARIO_CHECK_IDS, type FileUploadManualObservation } from './contracts.ts';
import {
  createManualEvidenceBundle,
  sanitizeEvidenceFileName,
  type ManualEvidenceAttachments,
} from './evidence-bundle.ts';

const REVISION = '1234567890abcdef1234567890abcdef12345678';
const DEPLOYMENT_URL = 'https://a1b2c3d4.lyra-ds-docs.pages.dev/en/file-upload-evidence/';
const CREATED_AT = '2026-08-26T12:00:00.000Z';

function file(name: string, type: string, contents = 'hello'): File {
  return new File([contents], name, { type, lastModified: 123 });
}

function fileReportingSize(name: string, type: string, size: number): File {
  const value = file(name, type);
  Object.defineProperty(value, 'size', { configurable: true, value: size });
  return value;
}

function record(
  scenario: 'DF-FU-M01' | 'DF-FU-M02',
  artifactPaths: string[],
): FileUploadManualObservation {
  return {
    scenario,
    locale: 'en',
    revision: REVISION,
    deploymentUrl: DEPLOYMENT_URL,
    executedAt: CREATED_AT,
    timezone: 'America/New_York',
    userAgent: 'Mozilla/5.0 Evidence Browser/1.0',
    os: { name: scenario === 'DF-FU-M01' ? 'Windows' : 'macOS', version: '1', build: '1' },
    browser: { name: scenario === 'DF-FU-M01' ? 'Firefox' : 'Safari', version: '1' },
    assistiveTechnology: {
      name: scenario === 'DF-FU-M01' ? 'NVDA' : 'VoiceOver',
      version: '1',
    },
    inputMethods: ['keyboard'],
    viewport: { width: 1280, height: 720, devicePixelRatio: 1 },
    mediaQueries: { '(pointer: coarse)': false },
    expected: 'The complete workflow is announced coherently.',
    actual: 'The complete workflow was announced coherently.',
    checkAttestations: Object.fromEntries(SCENARIO_CHECK_IDS[scenario].map((id) => [id, true])),
    result: 'PASS',
    reviewer: { name: 'Evidence Reviewer', approval: 'approved' },
    artifactPaths,
    artifactMetadata: artifactPaths.map((path) => ({
      path,
      originalName:
        path === 'artifacts/DF-FU-M01/NVDA-sessao-01.webm'
          ? 'NVDA sessão 01.webm'
          : path.slice(path.lastIndexOf('/') + 1).replace(/-2(?=\.)/u, ''),
    })),
    findingUrls: [],
  };
}

function attachments(
  entries: ReadonlyArray<readonly ['DF-FU-M01' | 'DF-FU-M02', readonly File[]]>,
): ManualEvidenceAttachments {
  return new Map(entries);
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

describe('sanitizeEvidenceFileName', () => {
  it('removes path components, diacritics, and non-portable separators', () => {
    expect(sanitizeEvidenceFileName('../../NVDA sessão 01.webm')).toBe('NVDA-sessao-01.webm');
  });

  it('guards case-insensitive Windows device names', () => {
    expect(sanitizeEvidenceFileName('CON.mp4')).toBe('_CON.mp4');
    expect(sanitizeEvidenceFileName('lpt9')).toBe('_lpt9');
  });
});

describe('createManualEvidenceBundle', () => {
  it('creates a deterministic one-record archive with lexical members and verified metadata', async () => {
    const selected = file('NVDA sessão 01.webm', 'video/webm');
    const validRecord = record('DF-FU-M01', ['artifacts/DF-FU-M01/NVDA-sessao-01.webm']);
    const selectedFiles = attachments([['DF-FU-M01', [selected]]]);

    const first = await createManualEvidenceBundle([validRecord], selectedFiles);
    const second = await createManualEvidenceBundle([validRecord], selectedFiles);

    expect(first).toMatchObject({
      fileName: 'lyra-file-upload-evidence-1234567890ab.zip',
      mediaType: 'application/zip',
    });
    expect(first.bytes).toEqual(second.bytes);

    const members = unzipSync(first.bytes);
    expect(Object.keys(members)).toEqual([
      'artifacts/DF-FU-M01/NVDA-sessao-01.webm',
      'manifest.json',
      'manual/DF-FU-M01.json',
    ]);
    const manifest = JSON.parse(strFromU8(members['manifest.json']!));
    expect(manifest).toMatchObject({
      schemaVersion: 1,
      kind: 'manual',
      revision: REVISION,
      deploymentUrl: DEPLOYMENT_URL,
      createdAt: CREATED_AT,
    });
    expect(manifest.entries).toEqual([
      {
        path: 'artifacts/DF-FU-M01/NVDA-sessao-01.webm',
        bytes: 5,
        mediaType: 'video/webm',
        sha256: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
      },
      {
        path: 'manual/DF-FU-M01.json',
        bytes: members['manual/DF-FU-M01.json']!.length,
        mediaType: 'application/json',
        sha256: sha256(members['manual/DF-FU-M01.json']!),
      },
    ]);
    expect(JSON.parse(strFromU8(members['manual/DF-FU-M01.json']!))).toEqual(validRecord);
    expect(JSON.parse(strFromU8(members['manual/DF-FU-M01.json']!))).toMatchObject({
      userAgent: 'Mozilla/5.0 Evidence Browser/1.0',
      artifactMetadata: [
        {
          path: 'artifacts/DF-FU-M01/NVDA-sessao-01.webm',
          originalName: 'NVDA sessão 01.webm',
        },
      ],
    });
  });

  it('includes two records and assigns deterministic suffixes to repeated source names', async () => {
    const m01 = record('DF-FU-M01', [
      'artifacts/DF-FU-M01/final.png',
      'artifacts/DF-FU-M01/final-2.png',
    ]);
    const m02 = {
      ...record('DF-FU-M02', ['artifacts/DF-FU-M02/voiceover.mp4']),
      executedAt: '2026-08-26T13:00:00.000Z',
    };
    const selectedFiles = attachments([
      ['DF-FU-M02', [file('voiceover.mp4', 'video/mp4', 'm02')]],
      [
        'DF-FU-M01',
        [file('final.png', 'image/png', 'first'), file('final.png', 'image/png', 'second')],
      ],
    ]);
    const bundle = await createManualEvidenceBundle([m02, m01], selectedFiles);
    const reversed = await createManualEvidenceBundle([m01, m02], selectedFiles);

    expect(bundle.bytes).toEqual(reversed.bytes);
    expect(Object.keys(unzipSync(bundle.bytes))).toEqual([
      'artifacts/DF-FU-M01/final-2.png',
      'artifacts/DF-FU-M01/final.png',
      'artifacts/DF-FU-M02/voiceover.mp4',
      'manifest.json',
      'manual/DF-FU-M01.json',
      'manual/DF-FU-M02.json',
    ]);
  });

  it.each([
    ['empty files', [file('empty.png', 'image/png', '')]],
    ['empty MIME types', [file('capture.png', '')]],
    ['unsupported MIME types', [file('capture.svg', 'image/svg+xml')]],
    [
      'a fifth file',
      [1, 2, 3, 4, 5].map((number) => file(`${number}.png`, 'image/png', `${number}`)),
    ],
    ['a file over 50 MiB', [fileReportingSize('large.mp4', 'video/mp4', 50 * 1024 * 1024 + 1)]],
    [
      'a scenario over 100 MiB',
      [1, 2, 3].map((number) => fileReportingSize(`${number}.mp4`, 'video/mp4', 40 * 1024 * 1024)),
    ],
  ])('rejects %s before reading file bytes', async (_label, selected) => {
    const paths = selected.map(
      (candidate) => `artifacts/DF-FU-M01/${sanitizeEvidenceFileName(candidate.name)}`,
    );
    await expect(
      createManualEvidenceBundle(
        [record('DF-FU-M01', paths)],
        attachments([['DF-FU-M01', selected]]),
      ),
    ).rejects.toThrow();
  });

  it('rejects distinct source names that sanitize to the same archive member', async () => {
    const selected = [
      file('capture sessão.png', 'image/png'),
      file('capture sessao.png', 'image/png'),
    ];
    await expect(
      createManualEvidenceBundle(
        [
          record('DF-FU-M01', [
            'artifacts/DF-FU-M01/capture-sessao.png',
            'artifacts/DF-FU-M01/capture-sessao-2.png',
          ]),
        ],
        attachments([['DF-FU-M01', selected]]),
      ),
    ).rejects.toThrow(/collision/i);
  });

  it('rejects a record whose artifact paths do not exactly match the selected files', async () => {
    await expect(
      createManualEvidenceBundle(
        [record('DF-FU-M01', ['artifacts/DF-FU-M01/different.png'])],
        attachments([['DF-FU-M01', [file('capture.png', 'image/png')]]]),
      ),
    ).rejects.toThrow(/artifact paths/i);
  });

  it('rejects a record whose original attachment metadata does not match the selected File', async () => {
    const candidate = record('DF-FU-M01', ['artifacts/DF-FU-M01/capture.png']);
    candidate.artifactMetadata[0]!.originalName = 'substituted.png';
    await expect(
      createManualEvidenceBundle(
        [candidate as FileUploadManualObservation],
        attachments([['DF-FU-M01', [file('capture.png', 'image/png')]]]),
      ),
    ).rejects.toThrow(/artifact metadata/i);
  });
});
