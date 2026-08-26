import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { strToU8, zipSync } from 'fflate';

import { ingestEvidence, parseIngestArgs, runIngestCli } from './ingest.mjs';

const { afterEach, describe, it } = process.env.VITEST
  ? await import('vitest')
  : await import('node:test');

const REVISION = '1234567890abcdef1234567890abcdef12345678';
const OTHER_REVISION = 'abcdef1234567890abcdef1234567890abcdef12';
const EN_URL = 'https://a1b2c3d4.lyra-ds-docs.pages.dev/en/file-upload-evidence/';
const PT_URL = 'https://a1b2c3d4.lyra-ds-docs.pages.dev/pt-BR/file-upload-evidence/';
const OTHER_HOST_URL = 'https://b1b2c3d4.lyra-ds-docs.pages.dev/en/file-upload-evidence/';
const CREATED_AT = '2026-08-26T12:00:00.000Z';
const ZIP_EPOCH = new Date('1980-01-01T00:00:00.000Z');
const ZIP_MTIME = new Date(ZIP_EPOCH.getTime() + ZIP_EPOCH.getTimezoneOffset() * 60_000);
const DESTINATION_NAME = `${REVISION}-accessibility`;
const temporaryRoots = [];

const MANUAL_CHECKS = {
  'DF-FU-M01': [
    'DF-FU-M01-selection-and-indeterminate-announcements',
    'DF-FU-M01-determinate-progress-milestones',
    'DF-FU-M01-lifecycle-recovery-and-stale-result',
  ],
  'DF-FU-M02': [
    'DF-FU-M02-selection-and-indeterminate-announcements',
    'DF-FU-M02-determinate-progress-milestones',
    'DF-FU-M02-lifecycle-recovery-and-stale-result',
  ],
};
const AUTOMATED_CHECKS = {
  'DF-FU-17': [
    'DF-FU-17-no-horizontal-overflow',
    'DF-FU-17-long-file-identity-retained',
    'DF-FU-17-actions-reachable-at-reflow',
    'DF-FU-17-active-replacement-rejected-and-announced',
    'DF-FU-17-cancel-retry-complete-remove',
    'DF-FU-17-focus-recovered',
    'DF-FU-17-keyboard-activation-equivalent',
  ],
  'DF-FU-18': [
    'DF-FU-18-native-js-disabled-form-submitted',
    'DF-FU-18-response-locale-metadata-revision',
    'DF-FU-18-delayed-alpine-filelist-preserved',
    'DF-FU-18-single-enhancement-no-replay',
    'DF-FU-18-removal-focus-recovered',
    'DF-FU-18-reconnect-teardown-clean',
  ],
};
const AUTOMATED_ARTIFACTS = [
  'artifacts/DF-FU-17/chromium/events.json',
  'artifacts/DF-FU-17/chromium/final.png',
  'artifacts/DF-FU-17/chromium/run.webm',
  'artifacts/DF-FU-17/chromium/trace.zip',
  'artifacts/DF-FU-17/firefox/events.json',
  'artifacts/DF-FU-17/firefox/final.png',
  'artifacts/DF-FU-17/firefox/run.webm',
  'artifacts/DF-FU-17/firefox/trace.zip',
  'artifacts/DF-FU-17/webkit/events.json',
  'artifacts/DF-FU-17/webkit/final.png',
  'artifacts/DF-FU-17/webkit/run.webm',
  'artifacts/DF-FU-17/webkit/trace.zip',
  'artifacts/DF-FU-18/chromium/events.json',
  'artifacts/DF-FU-18/chromium/final.png',
  'artifacts/DF-FU-18/chromium/run.webm',
  'artifacts/DF-FU-18/chromium/trace.zip',
];

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function jsonBytes(value) {
  return strToU8(`${JSON.stringify(value, null, 2)}\n`);
}

function artifactBytes(path) {
  return strToU8(`verified:${path}`);
}

function artifactMediaType(path) {
  if (path.endsWith('.json')) return 'application/json';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.webm')) return 'video/webm';
  if (path.endsWith('.mp4')) return 'video/mp4';
  if (path.endsWith('.zip')) return 'application/zip';
  throw new Error(`test fixture has no media type for ${path}`);
}

function manualRecord(scenario, overrides = {}) {
  const isWindows = scenario === 'DF-FU-M01';
  const artifactPath = isWindows
    ? 'artifacts/DF-FU-M01/nvda-capture.png'
    : 'artifacts/DF-FU-M02/voiceover-recording.mp4';
  return {
    scenario,
    locale: 'en',
    revision: REVISION,
    deploymentUrl: EN_URL,
    executedAt: isWindows ? CREATED_AT : '2026-08-26T13:00:00.000Z',
    timezone: isWindows ? 'America/New_York' : 'America/Los_Angeles',
    os: isWindows
      ? { name: 'Windows', version: '11', build: '24H2' }
      : { name: 'macOS', version: '15.6', build: '24G84' },
    browser: isWindows ? { name: 'Firefox', version: '141' } : { name: 'Safari', version: '18.6' },
    assistiveTechnology: isWindows
      ? { name: 'NVDA', version: '2026.2' }
      : { name: 'VoiceOver', version: '15.6' },
    inputMethods: ['screen reader', 'keyboard'],
    viewport: { width: 1280, height: 720, devicePixelRatio: 1 },
    mediaQueries: { '(prefers-reduced-motion: reduce)': false, '(pointer: coarse)': false },
    expected: 'The complete workflow is announced coherently and remains operable.',
    actual: isWindows
      ? 'NVDA announced the complete workflow coherently.'
      : 'VoiceOver announced the complete workflow coherently.',
    checkAttestations: Object.fromEntries(MANUAL_CHECKS[scenario].map((check) => [check, true])),
    result: 'PASS',
    reviewer: { name: 'Accessibility Reviewer', approval: 'approved' },
    artifactPaths: [artifactPath],
    findingUrls: isWindows
      ? ['https://example.com/findings/z-last', 'https://example.com/findings/a-first']
      : ['https://example.com/findings/voiceover'],
    ...overrides,
  };
}

function artifactPathsFor(scenario, engine) {
  return ['trace.zip', 'run.webm', 'final.png', 'events.json'].map(
    (fileName) => `artifacts/${scenario}/${engine}/${fileName}`,
  );
}

function automatedResult(scenario, overrides = {}) {
  const engines = scenario === 'DF-FU-17' ? ['webkit', 'chromium', 'firefox'] : ['chromium'];
  return {
    scenario,
    locale: 'en',
    revision: REVISION,
    deploymentUrl: EN_URL,
    executedAt: scenario === 'DF-FU-17' ? CREATED_AT : '2026-08-26T12:05:00.000Z',
    runs: engines.map((engine) => ({
      engine,
      viewport:
        scenario === 'DF-FU-17'
          ? { width: 320, height: 720, devicePixelRatio: 2 }
          : { width: 1280, height: 720, devicePixelRatio: 1 },
      mediaQueries:
        scenario === 'DF-FU-17' && engine === 'chromium'
          ? { '(pointer: coarse)': true, '(any-pointer: coarse)': true }
          : { '(pointer: coarse)': false, '(prefers-reduced-motion: reduce)': false },
      checks: Object.fromEntries(
        [...AUTOMATED_CHECKS[scenario]].reverse().map((check) => [check, true]),
      ),
      artifactPaths: artifactPathsFor(scenario, engine),
    })),
    result: 'PASS',
    ...overrides,
  };
}

function archiveBytes(kind, records, options = {}) {
  const members = new Map();
  const entries = [];
  const recordRoot = kind === 'manual' ? 'manual' : 'automation';
  for (const record of records) {
    const recordPath = `${recordRoot}/${record.scenario}.json`;
    const recordBytes = jsonBytes(record);
    members.set(recordPath, recordBytes);
    entries.push({
      path: recordPath,
      bytes: recordBytes.length,
      mediaType: 'application/json',
      sha256: sha256(recordBytes),
    });
    const artifactPaths =
      kind === 'manual'
        ? record.artifactPaths
        : record.runs.flatMap(({ artifactPaths: paths }) => paths);
    for (const path of artifactPaths) {
      if (members.has(path)) throw new Error(`test fixture duplicate: ${path}`);
      const bytes = artifactBytes(path);
      members.set(path, bytes);
      entries.push({
        path,
        bytes: bytes.length,
        mediaType: artifactMediaType(path),
        sha256: sha256(bytes),
        ...(options.entryOverrides?.[path] ?? {}),
      });
    }
  }
  entries.sort((left, right) => left.path.localeCompare(right.path, 'en'));
  const first = records[0];
  const manifest = {
    schemaVersion: 1,
    kind,
    revision: first.revision,
    deploymentUrl: first.deploymentUrl,
    createdAt: CREATED_AT,
    entries,
    ...options.manifestOverrides,
  };
  members.set('manifest.json', jsonBytes(manifest));
  for (const path of options.omitMembers ?? []) members.delete(path);
  for (const [path, bytes] of Object.entries(options.extraMembers ?? {})) members.set(path, bytes);

  return zipSync(
    Object.fromEntries(
      [...members]
        .sort(([left], [right]) => left.localeCompare(right, 'en'))
        .map(([path, bytes]) => [path, [bytes, { mtime: ZIP_MTIME }]]),
    ),
    { level: 6, mtime: ZIP_MTIME },
  );
}

async function temporaryRoot(label = 'lyra-ingest-') {
  const root = await mkdtemp(join(tmpdir(), label));
  temporaryRoots.push(root);
  return root;
}

function comparisonRoot(repositoryRoot) {
  return join(
    repositoryRoot,
    'docs',
    'superpowers',
    'baselines',
    'lyra-v1',
    'comparisons',
    'file-upload',
  );
}

function destinationPaths(repositoryRoot) {
  const parent = comparisonRoot(repositoryRoot);
  return {
    directory: join(parent, DESTINATION_NAME),
    markdown: join(parent, `${DESTINATION_NAME}.md`),
    parent,
  };
}

async function createRepository(root, name = 'repository') {
  const repositoryRoot = join(root, name);
  const destinations = destinationPaths(repositoryRoot);
  await mkdir(destinations.parent, { recursive: true });
  return { repositoryRoot, ...destinations };
}

async function writeInputs(root, options = {}) {
  const automationPath = join(root, options.automationName ?? 'automation.zip');
  const m01Path = join(root, 'm01.zip');
  const m02Path = join(root, 'm02.zip');
  const combinedPath = join(root, 'combined.zip');
  const automationRecords = options.automationRecords ?? [
    automatedResult('DF-FU-17'),
    automatedResult('DF-FU-18'),
  ];
  const m01 = options.m01 ?? manualRecord('DF-FU-M01');
  const m02 = options.m02 ?? manualRecord('DF-FU-M02', { locale: 'pt-BR', deploymentUrl: PT_URL });
  await writeFile(
    automationPath,
    options.automationBytes ?? archiveBytes('automation', automationRecords),
  );
  await writeFile(m01Path, options.m01Bytes ?? archiveBytes('manual', [m01]));
  await writeFile(m02Path, options.m02Bytes ?? archiveBytes('manual', [m02]));
  await writeFile(
    combinedPath,
    options.combinedBytes ??
      archiveBytes('manual', [m01, manualRecord('DF-FU-M02', { deploymentUrl: EN_URL })]),
  );
  return { automationPath, combinedPath, m01Path, m02Path };
}

async function exists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

async function readTree(root, prefix = '') {
  const output = new Map();
  for (const entry of await readdir(join(root, prefix), { withFileTypes: true })) {
    const path = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      for (const [nestedPath, bytes] of await readTree(root, path)) output.set(nestedPath, bytes);
    } else {
      output.set(path, await readFile(join(root, path)));
    }
  }
  return output;
}

function assertTreesEqual(actual, expected) {
  assert.deepEqual([...actual.keys()].sort(), [...expected.keys()].sort());
  for (const [path, bytes] of actual) assert.deepEqual(bytes, expected.get(path), path);
}

function eocdOffset(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 65_557); offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) return offset;
  }
  throw new Error('test fixture has no ZIP end record');
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
      offset,
      name: Buffer.from(bytes.buffer, bytes.byteOffset + offset + 46, nameLength).toString(),
    });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function asSymlinkArchive(bytes) {
  const copy = bytes.slice();
  const view = new DataView(copy.buffer, copy.byteOffset, copy.byteLength);
  const entry = centralEntries(copy).find(({ name }) => name.endsWith('nvda-capture.png'));
  assert.ok(entry);
  view.setUint16(entry.offset + 4, (3 << 8) | 20, true);
  view.setUint32(entry.offset + 38, (0o120777 << 16) >>> 0, true);
  return copy;
}

function asOversizeArchive(bytes) {
  const copy = bytes.slice();
  const view = new DataView(copy.buffer, copy.byteOffset, copy.byteLength);
  const entry = centralEntries(copy).find(({ name }) => name.endsWith('nvda-capture.png'));
  assert.ok(entry);
  view.setUint32(entry.offset + 24, 220 * 1024 * 1024 + 1, true);
  return copy;
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true })));
});

describe('parseIngestArgs', () => {
  it('accepts exactly one automation archive and one or two ordered bundle values', () => {
    assert.deepEqual(
      parseIngestArgs(['--automation', 'automation.zip', '--bundle', 'combined.zip']),
      { automationPath: 'automation.zip', bundlePaths: ['combined.zip'] },
    );
    assert.deepEqual(
      parseIngestArgs([
        '--bundle',
        'm02.zip',
        '--automation',
        'automation.zip',
        '--bundle',
        'm01.zip',
      ]),
      { automationPath: 'automation.zip', bundlePaths: ['m02.zip', 'm01.zip'] },
    );
  });

  it('rejects missing values, duplicate values/options, unknown options, positionals, and excess bundles', () => {
    for (const arguments_ of [
      [],
      ['--automation', 'automation.zip'],
      ['--bundle', 'manual.zip'],
      ['--automation', 'one.zip', '--automation', 'two.zip', '--bundle', 'manual.zip'],
      ['--automation', 'automation.zip', '--bundle', 'manual.zip', '--bundle', 'manual.zip'],
      [
        '--automation',
        'automation.zip',
        '--bundle',
        'one.zip',
        '--bundle',
        'two.zip',
        '--bundle',
        'three.zip',
      ],
      ['--automation=automation.zip', '--bundle', 'manual.zip'],
      ['--automation', 'automation.zip', '--unknown', 'value', '--bundle', 'manual.zip'],
      ['positional.zip', '--automation', 'automation.zip', '--bundle', 'manual.zip'],
      ['--automation', '--bundle', 'manual.zip'],
    ]) {
      assert.throws(() => parseIngestArgs(arguments_), /ingest arguments/u, arguments_.join(' '));
    }
  });
});

describe('ingestEvidence', () => {
  it('accepts a combined manual bundle and writes complete deterministic repository evidence', async () => {
    const root = await temporaryRoot();
    const repository = await createRepository(root);
    const inputs = await writeInputs(root);

    const outcome = await ingestEvidence({
      automationPath: inputs.automationPath,
      bundlePaths: [inputs.combinedPath],
      repositoryRoot: repository.repositoryRoot,
    });

    assert.deepEqual(outcome, {
      destinationDirectory: repository.directory,
      markdownPath: repository.markdown,
      revision: REVISION,
      status: 'created',
    });
    const outputFiles = await readTree(repository.directory);
    assert.deepEqual([...outputFiles.keys()].sort(), [
      ...AUTOMATED_ARTIFACTS,
      'artifacts/DF-FU-M01/nvda-capture.png',
      'artifacts/DF-FU-M02/voiceover-recording.mp4',
      'automation/DF-FU-17.json',
      'automation/DF-FU-18.json',
      'manual/DF-FU-M01.json',
      'manual/DF-FU-M02.json',
    ]);
    assert.deepEqual(
      outputFiles.get('artifacts/DF-FU-M01/nvda-capture.png'),
      Buffer.from('verified:artifacts/DF-FU-M01/nvda-capture.png'),
    );

    const markdown = await readFile(repository.markdown, 'utf8');
    assert.match(markdown, new RegExp(REVISION, 'u'));
    assert.match(markdown, /https:\/\/a1b2c3d4\.lyra-ds-docs\.pages\.dev/u);
    assert.equal(
      markdown.split('\n').filter((line) => /^\| `DF-FU-(?:M01|M02|17|18)` \|/u.test(line)).length,
      4,
    );
    assert.match(markdown, /Windows 11 \(24H2\).*Firefox 141.*NVDA 2026\.2/u);
    assert.match(markdown, /macOS 15\.6 \(24G84\).*Safari 18\.6.*VoiceOver 15\.6/u);
    assert.match(markdown, /Accessibility Reviewer.*approved/u);
    assert.match(markdown, /DF-FU-M01-selection-and-indeterminate-announcements/u);
    assert.match(markdown, /\| Chromium \| 320 x 720 \| 2 \|/u);
    assert.match(markdown, /DF-FU-18-reconnect-teardown-clean/u);
    assert.ok(
      markdown.indexOf('https://example.com/findings/a-first') <
        markdown.indexOf('https://example.com/findings/z-last'),
    );
    for (const path of [
      'artifacts/DF-FU-M01/nvda-capture.png',
      'artifacts/DF-FU-M02/voiceover-recording.mp4',
      ...AUTOMATED_ARTIFACTS,
    ]) {
      assert.match(
        markdown,
        new RegExp(`${DESTINATION_NAME}/${path.replaceAll('.', '\\.')}[)>]`, 'u'),
        path,
      );
    }
    assert.doesNotMatch(markdown, new RegExp(root.replaceAll('/', '\\/'), 'u'));
  });

  it('merges separate EN/PT-BR bundles by scenario and produces identical bytes in either order', async () => {
    const root = await temporaryRoot();
    const firstRepository = await createRepository(root, 'first-repository');
    const secondRepository = await createRepository(root, 'second-repository');
    const inputs = await writeInputs(root);

    await ingestEvidence({
      automationPath: inputs.automationPath,
      bundlePaths: [inputs.m01Path, inputs.m02Path],
      repositoryRoot: firstRepository.repositoryRoot,
    });
    await ingestEvidence({
      automationPath: inputs.automationPath,
      bundlePaths: [inputs.m02Path, inputs.m01Path],
      repositoryRoot: secondRepository.repositoryRoot,
    });

    assertTreesEqual(
      await readTree(firstRepository.directory),
      await readTree(secondRepository.directory),
    );
    assert.deepEqual(
      await readFile(firstRepository.markdown),
      await readFile(secondRepository.markdown),
    );
    const m02 = JSON.parse(
      await readFile(join(firstRepository.directory, 'manual/DF-FU-M02.json'), 'utf8'),
    );
    assert.equal(m02.locale, 'pt-BR');
    assert.equal(m02.deploymentUrl, PT_URL);
  });

  it('escapes untrusted manual prose instead of emitting active Markdown or HTML', async () => {
    const root = await temporaryRoot();
    const repository = await createRepository(root);
    const inputs = await writeInputs(root, {
      m01: manualRecord('DF-FU-M01', {
        expected: '<script>alert(1)</script> [click](javascript:alert(1)) | table',
      }),
    });

    await ingestEvidence({
      automationPath: inputs.automationPath,
      bundlePaths: [inputs.m01Path, inputs.m02Path],
      repositoryRoot: repository.repositoryRoot,
    });

    const markdown = await readFile(repository.markdown, 'utf8');
    assert.doesNotMatch(markdown, /<script>|\[click\]\(javascript:/u);
    assert.match(markdown, /&lt;script&gt;alert&#40;1&#41;&lt;\/script&gt;/u);
    assert.match(markdown, /&#91;click&#93;&#40;javascript:alert&#40;1&#41;&#41;/u);
    assert.match(markdown, /&#124; table/u);
  });

  it('rejects missing and duplicate manual scenarios', async () => {
    const root = await temporaryRoot();
    const repository = await createRepository(root);
    const inputs = await writeInputs(root);
    await assert.rejects(
      ingestEvidence({
        automationPath: inputs.automationPath,
        bundlePaths: [inputs.m01Path],
        repositoryRoot: repository.repositoryRoot,
      }),
      /exactly.*DF-FU-M01.*DF-FU-M02|missing.*DF-FU-M02/iu,
    );
    await assert.rejects(
      ingestEvidence({
        automationPath: inputs.automationPath,
        bundlePaths: [inputs.combinedPath, inputs.m01Path],
        repositoryRoot: repository.repositoryRoot,
      }),
      /duplicate.*DF-FU-M01/iu,
    );
    assert.equal(await exists(repository.directory), false);
    assert.equal(await exists(repository.markdown), false);
  });

  it('rejects manual FAIL and unapproved PASS records', async () => {
    const root = await temporaryRoot();
    const repository = await createRepository(root);
    const inputs = await writeInputs(root);
    const failedPath = join(root, 'failed-manual.zip');
    const failedChecks = Object.fromEntries(
      MANUAL_CHECKS['DF-FU-M01'].map((check) => [check, true]),
    );
    failedChecks['DF-FU-M01-determinate-progress-milestones'] = false;
    await writeFile(
      failedPath,
      archiveBytes('manual', [
        manualRecord('DF-FU-M01', {
          checkAttestations: failedChecks,
          result: 'FAIL',
          reviewer: { name: 'Accessibility Reviewer', approval: 'changes-requested' },
        }),
      ]),
    );
    await assert.rejects(
      ingestEvidence({
        automationPath: inputs.automationPath,
        bundlePaths: [failedPath, inputs.m02Path],
        repositoryRoot: repository.repositoryRoot,
      }),
      /DF-FU-M01.*PASS/iu,
    );

    const unapprovedPath = join(root, 'unapproved-manual.zip');
    await writeFile(
      unapprovedPath,
      archiveBytes('manual', [
        manualRecord('DF-FU-M01', {
          reviewer: { name: 'Accessibility Reviewer', approval: 'changes-requested' },
        }),
      ]),
    );
    await assert.rejects(
      ingestEvidence({
        automationPath: inputs.automationPath,
        bundlePaths: [unapprovedPath, inputs.m02Path],
        repositoryRoot: repository.repositoryRoot,
      }),
      /invalid manual result|archive/iu,
    );
    assert.equal(await exists(repository.directory), false);
  });

  it('rejects missing, failed, and partial DF-FU-17 or DF-FU-18 results', async () => {
    const root = await temporaryRoot();
    const repository = await createRepository(root);
    const inputs = await writeInputs(root);
    const cases = [];

    cases.push(['missing', archiveBytes('automation', [automatedResult('DF-FU-17')])]);

    const failed = automatedResult('DF-FU-17');
    failed.runs[0].checks['DF-FU-17-no-horizontal-overflow'] = false;
    failed.result = 'FAIL';
    cases.push(['failed', archiveBytes('automation', [failed, automatedResult('DF-FU-18')])]);

    const partial = automatedResult('DF-FU-18');
    partial.runs[0].checks = Object.fromEntries(
      AUTOMATED_CHECKS['DF-FU-18'].map((check) => [check, false]),
    );
    partial.runs[0].artifactPaths = ['artifacts/DF-FU-18/chromium/events.json'];
    partial.result = 'FAIL';
    cases.push(['partial', archiveBytes('automation', [automatedResult('DF-FU-17'), partial])]);

    for (const [label, bytes] of cases) {
      const automationPath = join(root, `${label}.zip`);
      await writeFile(automationPath, bytes);
      await assert.rejects(
        ingestEvidence({
          automationPath,
          bundlePaths: [inputs.m01Path, inputs.m02Path],
          repositoryRoot: repository.repositoryRoot,
        }),
        /DF-FU-(17|18)|automation.*PASS/iu,
        label,
      );
    }
    assert.equal(await exists(repository.directory), false);
  });

  it('rejects revision, immutable host, and locale-route mismatches', async () => {
    const root = await temporaryRoot();
    const repository = await createRepository(root);
    const inputs = await writeInputs(root);
    const mismatches = [
      archiveBytes('manual', [
        manualRecord('DF-FU-M02', {
          revision: OTHER_REVISION,
          locale: 'pt-BR',
          deploymentUrl: PT_URL,
        }),
      ]),
      archiveBytes('manual', [manualRecord('DF-FU-M02', { deploymentUrl: OTHER_HOST_URL })]),
      archiveBytes('manual', [
        manualRecord('DF-FU-M02', { locale: 'pt-BR', deploymentUrl: EN_URL }),
      ]),
    ];
    for (const [index, bytes] of mismatches.entries()) {
      const path = join(root, `mismatch-${index}.zip`);
      await writeFile(path, bytes);
      await assert.rejects(
        ingestEvidence({
          automationPath: inputs.automationPath,
          bundlePaths: [inputs.m01Path, path],
          repositoryRoot: repository.repositoryRoot,
        }),
        /revision|deployment|origin|route|archive/iu,
      );
    }
    assert.equal(await exists(repository.directory), false);
  });

  it('composes T3 rejection of digest, member, traversal, symlink, oversize, and case-fold attacks before writes', async () => {
    const root = await temporaryRoot();
    const repository = await createRepository(root);
    const inputs = await writeInputs(root);
    const validM01 = manualRecord('DF-FU-M01');
    const artifactPath = validM01.artifactPaths[0];
    const validBytes = archiveBytes('manual', [validM01]);
    const hostile = [
      [
        'digest',
        archiveBytes('manual', [validM01], {
          entryOverrides: { [artifactPath]: { sha256: '0'.repeat(64) } },
        }),
      ],
      ['missing', archiveBytes('manual', [validM01], { omitMembers: [artifactPath] })],
      [
        'unknown',
        archiveBytes('manual', [validM01], {
          extraMembers: { 'rogue.txt': strToU8('rogue') },
        }),
      ],
      ['traversal', zipSync({ '../escape': strToU8('escape') }, { level: 0 })],
      ['symlink', asSymlinkArchive(validBytes)],
      ['oversize', asOversizeArchive(validBytes)],
      [
        'casefold',
        zipSync({ 'artifacts/A.txt': strToU8('one'), 'artifacts/a.TXT': strToU8('two') }),
      ],
    ];

    for (const [label, bytes] of hostile) {
      const path = join(root, `hostile-${label}.zip`);
      await writeFile(path, bytes);
      await assert.rejects(
        ingestEvidence({
          automationPath: inputs.automationPath,
          bundlePaths: [path, inputs.m02Path],
          repositoryRoot: repository.repositoryRoot,
        }),
        /Invalid evidence archive/iu,
        label,
      );
    }
    assert.deepEqual(await readdir(repository.parent), []);
  });

  it('treats exact existing destinations as an idempotent rerun without any mutating call', async () => {
    const root = await temporaryRoot();
    const repository = await createRepository(root);
    const inputs = await writeInputs(root);
    const options = {
      automationPath: inputs.automationPath,
      bundlePaths: [inputs.m02Path, inputs.m01Path],
      repositoryRoot: repository.repositoryRoot,
    };
    await ingestEvidence(options);

    const rejectMutation = () => {
      throw new Error('idempotent rerun attempted a mutation');
    };
    const outcome = await ingestEvidence(options, {
      mkdir: rejectMutation,
      mkdtemp: rejectMutation,
      rename: rejectMutation,
      rm: rejectMutation,
      writeFile: rejectMutation,
    });
    assert.equal(outcome.status, 'idempotent');
  });

  it('rejects partial or byte-mismatched destinations without overwriting them', async () => {
    const root = await temporaryRoot();
    const inputs = await writeInputs(root);
    const directoryOnly = await createRepository(root, 'directory-only');
    await mkdir(directoryOnly.directory);
    await writeFile(join(directoryOnly.directory, 'sentinel.txt'), 'keep-directory');
    await assert.rejects(
      ingestEvidence({
        automationPath: inputs.automationPath,
        bundlePaths: [inputs.m01Path, inputs.m02Path],
        repositoryRoot: directoryOnly.repositoryRoot,
      }),
      /partial destination/iu,
    );
    assert.equal(
      await readFile(join(directoryOnly.directory, 'sentinel.txt'), 'utf8'),
      'keep-directory',
    );

    const markdownOnly = await createRepository(root, 'markdown-only');
    await writeFile(markdownOnly.markdown, 'keep-markdown');
    await assert.rejects(
      ingestEvidence({
        automationPath: inputs.automationPath,
        bundlePaths: [inputs.m01Path, inputs.m02Path],
        repositoryRoot: markdownOnly.repositoryRoot,
      }),
      /partial destination/iu,
    );
    assert.equal(await readFile(markdownOnly.markdown, 'utf8'), 'keep-markdown');

    const mismatched = await createRepository(root, 'mismatched');
    const options = {
      automationPath: inputs.automationPath,
      bundlePaths: [inputs.m01Path, inputs.m02Path],
      repositoryRoot: mismatched.repositoryRoot,
    };
    await ingestEvidence(options);
    await writeFile(mismatched.markdown, 'reviewed bytes must not be overwritten');
    await assert.rejects(ingestEvidence(options), /different bytes/iu);
    assert.equal(
      await readFile(mismatched.markdown, 'utf8'),
      'reviewed bytes must not be overwritten',
    );

    const artifactMismatch = await createRepository(root, 'artifact-mismatch');
    const artifactOptions = {
      automationPath: inputs.automationPath,
      bundlePaths: [inputs.m01Path, inputs.m02Path],
      repositoryRoot: artifactMismatch.repositoryRoot,
    };
    await ingestEvidence(artifactOptions);
    const copiedArtifact = join(artifactMismatch.directory, 'artifacts/DF-FU-M01/nvda-capture.png');
    await writeFile(copiedArtifact, 'reviewed artifact must not be overwritten');
    await assert.rejects(ingestEvidence(artifactOptions), /different bytes/iu);
    assert.equal(
      await readFile(copiedArtifact, 'utf8'),
      'reviewed artifact must not be overwritten',
    );
  });

  it('leaves destinations absent after injected staging write and rename failures', async () => {
    const root = await temporaryRoot();
    const inputs = await writeInputs(root);
    for (const failure of ['write', 'first-rename', 'second-rename']) {
      const repository = await createRepository(root, failure);
      let writes = 0;
      let renames = 0;
      const fileSystem = {
        async writeFile(...arguments_) {
          writes += 1;
          if (failure === 'write' && writes === 2) throw new Error('injected write failure');
          return writeFile(...arguments_);
        },
        async rename(...arguments_) {
          renames += 1;
          if (failure === 'first-rename' && renames === 1) {
            throw new Error('injected first rename failure');
          }
          if (failure === 'second-rename' && renames === 2) {
            throw new Error('injected second rename failure');
          }
          return rename(...arguments_);
        },
      };
      await assert.rejects(
        ingestEvidence(
          {
            automationPath: inputs.automationPath,
            bundlePaths: [inputs.m01Path, inputs.m02Path],
            repositoryRoot: repository.repositoryRoot,
          },
          fileSystem,
        ),
        /injected/iu,
        failure,
      );
      assert.equal(await exists(repository.directory), false, failure);
      assert.equal(await exists(repository.markdown), false, failure);
      assert.deepEqual(await readdir(repository.parent), [], failure);
    }
  });

  it('retries an injected cleanup interruption and removes only invocation-owned staging', async () => {
    const root = await temporaryRoot();
    const repository = await createRepository(root);
    const inputs = await writeInputs(root);
    const sibling = join(repository.parent, '.unrelated-keep');
    await writeFile(sibling, 'keep');
    let cleanupAttempts = 0;
    await assert.rejects(
      ingestEvidence(
        {
          automationPath: inputs.automationPath,
          bundlePaths: [inputs.m01Path, inputs.m02Path],
          repositoryRoot: repository.repositoryRoot,
        },
        {
          async writeFile() {
            throw new Error('injected staging failure');
          },
          async rm(...arguments_) {
            cleanupAttempts += 1;
            if (cleanupAttempts === 1) throw new Error('injected cleanup interruption');
            return rm(...arguments_);
          },
        },
      ),
      /injected staging failure/iu,
    );
    assert.equal(cleanupAttempts, 2);
    assert.equal(await readFile(sibling, 'utf8'), 'keep');
    assert.deepEqual(await readdir(repository.parent), ['.unrelated-keep']);
  });

  it('does not clobber a destination created by a racing writer', async () => {
    const root = await temporaryRoot();
    const repository = await createRepository(root);
    const inputs = await writeInputs(root);
    let raced = false;
    await assert.rejects(
      ingestEvidence(
        {
          automationPath: inputs.automationPath,
          bundlePaths: [inputs.m01Path, inputs.m02Path],
          repositoryRoot: repository.repositoryRoot,
        },
        {
          async rename(from, to) {
            if (!raced) {
              raced = true;
              await mkdir(to);
              await writeFile(join(to, 'sentinel.txt'), 'racing writer');
            }
            return rename(from, to);
          },
        },
      ),
      /rename|exist|not empty|destination/iu,
    );
    assert.equal(
      await readFile(join(repository.directory, 'sentinel.txt'), 'utf8'),
      'racing writer',
    );
    assert.equal(await exists(repository.markdown), false);
    assert.deepEqual(await readdir(repository.parent), [DESTINATION_NAME]);
  });

  it('validates every CLI archive before the first repository write', async () => {
    const root = await temporaryRoot();
    const repository = await createRepository(root);
    const inputs = await writeInputs(root);
    const invalidLastBundle = join(root, 'invalid-last.zip');
    await writeFile(invalidLastBundle, zipSync({ '../escape': strToU8('escape') }));
    let mutations = 0;
    const mutation = () => {
      mutations += 1;
      throw new Error('repository mutation happened before validation');
    };

    await assert.rejects(
      runIngestCli(
        [
          '--automation',
          inputs.automationPath,
          '--bundle',
          inputs.m01Path,
          '--bundle',
          invalidLastBundle,
        ],
        {
          repositoryRoot: repository.repositoryRoot,
          fileSystem: {
            mkdir: mutation,
            mkdtemp: mutation,
            rename: mutation,
            rm: mutation,
            writeFile: mutation,
          },
        },
      ),
      /Invalid evidence archive/iu,
    );
    assert.equal(mutations, 0);
    assert.deepEqual(await readdir(repository.parent), []);
  });
});
