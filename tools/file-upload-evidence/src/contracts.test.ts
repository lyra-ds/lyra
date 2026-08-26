import { describe, expect, it } from 'vitest';

import {
  AUTOMATED_SCENARIO_CHECK_IDS,
  deploymentUrlFromLocation,
  EVIDENCE_ENTRY_MEDIA_TYPES,
  MANUAL_MEDIA_TYPES,
  SCENARIO_CHECK_IDS,
  type AutomatedScenario,
  type EvidenceManifest,
  type FileUploadAutomatedResult,
  type ManualScenario,
  validateAutomatedResult,
  validateManifest,
  validateObservation,
} from './contracts';

const REVISION = 'a'.repeat(40);
const DEPLOYMENT_URL = 'https://a1b2c3d4.lyra-ds-docs.pages.dev/en/file-upload-evidence/';
const EXECUTED_AT = '2026-08-26T12:00:00.000Z';

const APPROVED_MANUAL_CHECK_IDS = {
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
} as const;

const APPROVED_AUTOMATED_CHECK_IDS = {
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
} as const;

const validM01 = {
  scenario: 'DF-FU-M01',
  locale: 'en',
  revision: REVISION,
  deploymentUrl: DEPLOYMENT_URL,
  executedAt: EXECUTED_AT,
  timezone: 'America/New_York',
  os: { name: 'Windows', version: '11', build: '24H2' },
  browser: { name: 'Firefox', version: '141.0' },
  assistiveTechnology: { name: 'NVDA', version: '2026.2' },
  inputMethods: ['keyboard'],
  viewport: { width: 1280, height: 720, devicePixelRatio: 1 },
  mediaQueries: { '(pointer: coarse)': false },
  expected: 'The complete upload lifecycle is announced coherently.',
  actual: 'NVDA announced every lifecycle transition.',
  checkAttestations: Object.fromEntries(
    APPROVED_MANUAL_CHECK_IDS['DF-FU-M01'].map((id) => [id, true]),
  ),
  result: 'PASS',
  reviewer: { name: 'Evidence Reviewer', approval: 'approved' },
  artifactPaths: ['artifacts/DF-FU-M01/nvda.webm'],
  findingUrls: ['https://tracker.example.test/FU-101'],
} as const;

function observationFor(
  scenario: ManualScenario,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    ...validM01,
    scenario,
    os: scenario === 'DF-FU-M01' ? validM01.os : { name: 'macOS', version: '15.6', build: '24G84' },
    browser: scenario === 'DF-FU-M01' ? validM01.browser : { name: 'Safari', version: '18.6' },
    assistiveTechnology:
      scenario === 'DF-FU-M01'
        ? validM01.assistiveTechnology
        : { name: 'VoiceOver', version: '15.6' },
    checkAttestations: Object.fromEntries(
      APPROVED_MANUAL_CHECK_IDS[scenario].map((id) => [id, true]),
    ),
    artifactPaths: [`artifacts/${scenario}/recording.webm`],
    ...overrides,
  };
}

const validManualManifest: EvidenceManifest = {
  schemaVersion: 1,
  kind: 'manual',
  revision: REVISION,
  deploymentUrl: DEPLOYMENT_URL,
  createdAt: EXECUTED_AT,
  entries: [
    {
      path: 'manual/DF-FU-M01.json',
      bytes: 2048,
      mediaType: 'application/json',
      sha256: '1'.repeat(64),
    },
    {
      path: 'artifacts/DF-FU-M01/nvda.webm',
      bytes: 4096,
      mediaType: 'video/webm',
      sha256: '2'.repeat(64),
    },
  ],
};

const automatedArtifacts = (scenario: AutomatedScenario, engine: string): string[] => [
  `artifacts/${scenario}/${engine}/final.png`,
  `artifacts/${scenario}/${engine}/run.webm`,
  `artifacts/${scenario}/${engine}/trace.zip`,
  `artifacts/${scenario}/${engine}/events.json`,
];

function automatedRun(scenario: AutomatedScenario, engine: 'chromium' | 'firefox' | 'webkit') {
  return {
    engine,
    viewport: { width: 320, height: 720, devicePixelRatio: 2 },
    mediaQueries:
      engine === 'chromium'
        ? { '(pointer: coarse)': true, '(any-pointer: coarse)': true }
        : { '(pointer: coarse)': false, '(any-pointer: coarse)': false },
    checks: Object.fromEntries(APPROVED_AUTOMATED_CHECK_IDS[scenario].map((id) => [id, true])),
    artifactPaths: automatedArtifacts(scenario, engine),
  };
}

const validDfFu17: FileUploadAutomatedResult = {
  scenario: 'DF-FU-17',
  locale: 'en',
  revision: REVISION,
  deploymentUrl: DEPLOYMENT_URL,
  executedAt: EXECUTED_AT,
  runs: [
    automatedRun('DF-FU-17', 'chromium'),
    automatedRun('DF-FU-17', 'firefox'),
    automatedRun('DF-FU-17', 'webkit'),
  ],
  result: 'PASS',
};

const invalidArtifactPathSets: readonly (readonly string[])[] = [
  [],
  [
    'artifacts/DF-FU-M01/1.png',
    'artifacts/DF-FU-M01/2.png',
    'artifacts/DF-FU-M01/3.png',
    'artifacts/DF-FU-M01/4.png',
    'artifacts/DF-FU-M01/5.png',
  ],
  ['artifacts/DF-FU-M02/voiceover.webm'],
  ['../artifacts/DF-FU-M01/nvda.webm'],
  ['artifacts\\DF-FU-M01\\nvda.webm'],
  ['artifacts/DF-FU-M01/nvda.webm', 'artifacts/DF-FU-M01/nvda.webm'],
];

describe('validateObservation', () => {
  it('exposes the exact approved M01 and M02 check IDs', () => {
    expect(SCENARIO_CHECK_IDS).toEqual(APPROVED_MANUAL_CHECK_IDS);
  });

  it.each(['DF-FU-M01', 'DF-FU-M02'] as const)('accepts the %s manual scenario', (scenario) => {
    expect(validateObservation(observationFor(scenario))).toMatchObject({
      ok: true,
      value: { scenario, artifactPaths: [`artifacts/${scenario}/recording.webm`] },
    });
  });

  it.each(['DF-FU-M03', 'DF-FU-M04'] as const)('rejects retired manual scenario %s', (scenario) => {
    expect(validateObservation({ ...validM01, scenario })).toMatchObject({ ok: false });
  });

  it('accepts and normalizes one to four local artifact paths under the scenario directory', () => {
    const input = {
      ...validM01,
      actual: '  NVDA announced every lifecycle transition.  ',
      inputMethods: [' keyboard '],
      artifactPaths: [' artifacts/DF-FU-M01/nvda.webm ', 'artifacts/DF-FU-M01/final.png'],
    };
    const result = validateObservation(input);

    expect(result).toMatchObject({
      ok: true,
      value: {
        actual: 'NVDA announced every lifecycle transition.',
        inputMethods: ['keyboard'],
        artifactPaths: ['artifacts/DF-FU-M01/nvda.webm', 'artifacts/DF-FU-M01/final.png'],
      },
    });
    expect(input.artifactPaths[0]).toBe(' artifacts/DF-FU-M01/nvda.webm ');
  });

  it.each(invalidArtifactPathSets)(
    'rejects an invalid local artifact path set: %j',
    (artifactPaths) => {
      expect(validateObservation({ ...validM01, artifactPaths })).toMatchObject({
        ok: false,
        errors: [{ field: 'artifactPaths' }],
      });
    },
  );

  it.each(['en', 'pt-BR'] as const)('accepts the %s immutable route locale', (locale) => {
    expect(
      validateObservation({
        ...validM01,
        locale,
        deploymentUrl: `https://a1b2c3d4.lyra-ds-docs.pages.dev/${locale}/file-upload-evidence/`,
      }),
    ).toMatchObject({ ok: true });
  });

  it('accepts only an exact eight-lowercase-hex deployment label', () => {
    expect(
      validateObservation({
        ...validM01,
        deploymentUrl: 'https://a1b2c3d4.lyra-ds-docs.pages.dev/en/file-upload-evidence/',
      }),
    ).toMatchObject({ ok: true });

    for (const deploymentUrl of [
      'https://featurefoo.lyra-ds-docs.pages.dev/en/file-upload-evidence/',
      'https://feature-foo.lyra-ds-docs.pages.dev/en/file-upload-evidence/',
      'https://abcdefg1.lyra-ds-docs.pages.dev/en/file-upload-evidence/',
      'https://a1b2c3d45.lyra-ds-docs.pages.dev/en/file-upload-evidence/',
    ]) {
      expect(validateObservation({ ...validM01, deploymentUrl })).toMatchObject({
        ok: false,
        errors: [{ field: 'deploymentUrl' }],
      });
    }
  });

  it.each([
    'https://file-upload-evidence.lyra-ds-docs.pages.dev/en/file-upload-evidence/',
    'https://a1b2c3d4.example.test/en/file-upload-evidence/',
    'https://a1b2c3d4.lyra-ds-docs.pages.dev/en/file-upload-evidence/?alpineDelay=5000',
    'https://a1b2c3d4.lyra-ds-docs.pages.dev/en/file-upload-evidence/#record',
  ])('rejects a mutable or noncanonical deployment route: %s', (deploymentUrl) => {
    expect(validateObservation({ ...validM01, deploymentUrl })).toMatchObject({
      ok: false,
      errors: [{ field: 'deploymentUrl' }],
    });
  });

  it.each([
    ['DF-FU-M01', APPROVED_MANUAL_CHECK_IDS['DF-FU-M01']],
    ['DF-FU-M02', APPROVED_MANUAL_CHECK_IDS['DF-FU-M02']],
  ] as const)('requires the exact %s attestation keys', (scenario, approvedCheckIds) => {
    const complete = Object.fromEntries(approvedCheckIds.map((id) => [id, true]));
    const firstCheck = approvedCheckIds[0];
    const missing = Object.fromEntries(approvedCheckIds.slice(1).map((id) => [id, true]));

    expect(
      validateObservation(observationFor(scenario, { checkAttestations: complete })),
    ).toMatchObject({ ok: true });
    expect(
      validateObservation(observationFor(scenario, { checkAttestations: missing })),
    ).toMatchObject({ ok: false });
    expect(
      validateObservation(
        observationFor(scenario, { checkAttestations: { ...complete, [firstCheck]: false } }),
      ),
    ).toMatchObject({ ok: false, errors: [{ field: 'checkAttestations' }] });
    expect(
      validateObservation(
        observationFor(scenario, {
          checkAttestations: { ...complete, 'DF-FU-M99-foreign-check': true },
        }),
      ),
    ).toMatchObject({ ok: false, errors: [{ field: 'checkAttestations' }] });
  });

  it('requires assistive technology and a reviewer decision compatible with the result', () => {
    expect(validateObservation({ ...validM01, assistiveTechnology: null })).toMatchObject({
      ok: false,
      errors: [{ field: 'assistiveTechnology' }],
    });
    expect(
      validateObservation({
        ...validM01,
        reviewer: { name: 'Evidence Reviewer', approval: 'changes-requested' },
      }),
    ).toMatchObject({ ok: false, errors: [{ field: 'reviewer.approval' }] });
  });

  it('accepts false attestations only for a FAIL record and isolates returned state', () => {
    const attestations = {
      ...validM01.checkAttestations,
      'DF-FU-M01-determinate-progress-milestones': false,
    };
    const result = validateObservation({
      ...validM01,
      checkAttestations: attestations,
      result: 'FAIL',
      reviewer: { name: 'Evidence Reviewer', approval: 'changes-requested' },
    });

    expect(result).toMatchObject({ ok: true, value: { checkAttestations: attestations } });
    if (!result.ok) throw new Error('expected a diagnostic FAIL record to validate');
    attestations['DF-FU-M01-determinate-progress-milestones'] = true;
    expect(result.value.checkAttestations['DF-FU-M01-determinate-progress-milestones']).toBe(false);
  });

  it('rejects malformed revision and timestamps', () => {
    expect(validateObservation({ ...validM01, revision: 'A'.repeat(40) })).toMatchObject({
      ok: false,
      errors: [{ field: 'revision' }],
    });
    expect(
      validateObservation({ ...validM01, executedAt: '2026-02-30T12:00:00.000Z' }),
    ).toMatchObject({
      ok: false,
      errors: [{ field: 'executedAt' }],
    });
  });

  it('normalizes a browser location to origin and pathname', () => {
    expect(
      deploymentUrlFromLocation({
        origin: 'https://a1b2c3d4.lyra-ds-docs.pages.dev',
        pathname: '/en/file-upload-evidence/',
      }),
    ).toBe(DEPLOYMENT_URL);
  });
});

describe('validateManifest', () => {
  it('accepts a valid manual manifest', () => {
    expect(validateManifest(validManualManifest)).toMatchObject({ ok: true });
  });

  it.each([
    ['schemaVersion', { ...validManualManifest, schemaVersion: 2 }],
    ['revision', { ...validManualManifest, revision: 'not-a-revision' }],
    [
      'deploymentUrl',
      {
        ...validManualManifest,
        deploymentUrl:
          'https://file-upload-evidence.lyra-ds-docs.pages.dev/en/file-upload-evidence/',
      },
    ],
    ['createdAt', { ...validManualManifest, createdAt: 'yesterday' }],
    [
      'entries',
      { ...validManualManifest, entries: [{ ...validManualManifest.entries[0], bytes: 0 }] },
    ],
    [
      'entries',
      {
        ...validManualManifest,
        entries: [{ ...validManualManifest.entries[0], sha256: 'A'.repeat(64) }],
      },
    ],
  ] as const)('rejects an invalid %s', (_field, manifest) => {
    expect(validateManifest(manifest)).toMatchObject({ ok: false });
  });

  it.each([
    [
      'duplicate paths',
      {
        ...validManualManifest,
        entries: [validManualManifest.entries[0], { ...validManualManifest.entries[0] }],
      },
    ],
    [
      'traversal',
      {
        ...validManualManifest,
        entries: [{ ...validManualManifest.entries[0], path: '../manual/DF-FU-M01.json' }],
      },
    ],
    [
      'JSON media on a screenshot',
      {
        ...validManualManifest,
        entries: [
          validManualManifest.entries[0],
          {
            ...validManualManifest.entries[1],
            path: 'artifacts/DF-FU-M01/final.png',
            mediaType: 'application/json',
          },
        ],
      },
    ],
    [
      'manual media on a result record',
      {
        ...validManualManifest,
        entries: [
          { ...validManualManifest.entries[0], mediaType: 'video/webm' },
          validManualManifest.entries[1],
        ],
      },
    ],
  ] as const)('rejects %s', (_label, manifest) => {
    expect(validateManifest(manifest)).toMatchObject({ ok: false });
  });

  it('rejects an expected revision or deployment mismatch', () => {
    expect(
      validateManifest(validManualManifest, {
        revision: 'b'.repeat(40),
        deploymentUrl: DEPLOYMENT_URL,
      }),
    ).toMatchObject({ ok: false });
    expect(
      validateManifest(validManualManifest, {
        revision: REVISION,
        deploymentUrl: 'https://b1b2c3d4.lyra-ds-docs.pages.dev/en/file-upload-evidence/',
      }),
    ).toMatchObject({ ok: false });
  });

  it('enforces automation media types by archive path', () => {
    const manifest: EvidenceManifest = {
      ...validManualManifest,
      kind: 'automation',
      entries: [
        {
          path: 'automation/DF-FU-17.json',
          bytes: 100,
          mediaType: 'application/json',
          sha256: '3'.repeat(64),
        },
        {
          path: 'artifacts/DF-FU-17/chromium/final.png',
          bytes: 100,
          mediaType: 'image/png',
          sha256: '4'.repeat(64),
        },
        {
          path: 'artifacts/DF-FU-17/chromium/trace.zip',
          bytes: 100,
          mediaType: 'application/zip',
          sha256: '5'.repeat(64),
        },
        {
          path: 'artifacts/DF-FU-17/chromium/run.webm',
          bytes: 100,
          mediaType: 'video/webm',
          sha256: '6'.repeat(64),
        },
        {
          path: 'artifacts/DF-FU-17/chromium/events.json',
          bytes: 100,
          mediaType: 'application/json',
          sha256: '7'.repeat(64),
        },
      ],
    };

    expect(validateManifest(manifest)).toMatchObject({ ok: true });
    expect(
      validateManifest({
        ...manifest,
        entries: manifest.entries.map((entry) =>
          entry.path.endsWith('trace.zip') ? { ...entry, mediaType: 'application/json' } : entry,
        ),
      }),
    ).toMatchObject({ ok: false });
  });
});

describe('validateAutomatedResult', () => {
  it('exposes the exact approved DF-FU-17 and DF-FU-18 check IDs', () => {
    expect(AUTOMATED_SCENARIO_CHECK_IDS).toEqual(APPROVED_AUTOMATED_CHECK_IDS);
  });

  it('accepts the complete DF-FU-17 three-engine matrix', () => {
    expect(validateAutomatedResult(validDfFu17)).toMatchObject({ ok: true });
  });

  it('accepts DF-FU-18 only with its complete Chromium check set', () => {
    const result: FileUploadAutomatedResult = {
      ...validDfFu17,
      scenario: 'DF-FU-18',
      runs: [automatedRun('DF-FU-18', 'chromium')],
    };
    expect(validateAutomatedResult(result)).toMatchObject({ ok: true });
  });

  it('rejects PASS when a required check is false, missing, or joined by an extra check', () => {
    const chromium = validDfFu17.runs[0];
    if (chromium === undefined) throw new Error('missing Chromium fixture');
    const otherRuns = validDfFu17.runs.slice(1);
    const firstCheck = APPROVED_AUTOMATED_CHECK_IDS['DF-FU-17'][0];
    const failedRuns = [
      { ...chromium, checks: { ...chromium.checks, [firstCheck]: false } },
      ...otherRuns,
    ];
    const missingRuns = [
      {
        ...chromium,
        checks: Object.fromEntries(
          Object.entries(chromium.checks).filter(([check]) => check !== firstCheck),
        ),
      },
      ...otherRuns,
    ];
    const extraRuns = [
      { ...chromium, checks: { ...chromium.checks, 'DF-FU-17-unapproved-check': true } },
      ...otherRuns,
    ];

    expect(validateAutomatedResult({ ...validDfFu17, runs: failedRuns })).toMatchObject({
      ok: false,
    });
    expect(validateAutomatedResult({ ...validDfFu17, runs: missingRuns })).toMatchObject({
      ok: false,
    });
    expect(validateAutomatedResult({ ...validDfFu17, runs: extraRuns })).toMatchObject({
      ok: false,
    });
  });

  it('accepts false checks for a diagnostic FAIL result', () => {
    const chromium = validDfFu17.runs[0];
    if (chromium === undefined) throw new Error('missing Chromium fixture');
    const otherRuns = validDfFu17.runs.slice(1);
    const firstCheck = APPROVED_AUTOMATED_CHECK_IDS['DF-FU-17'][0];
    expect(
      validateAutomatedResult({
        ...validDfFu17,
        result: 'FAIL',
        runs: [{ ...chromium, checks: { ...chromium.checks, [firstCheck]: false } }, ...otherRuns],
      }),
    ).toMatchObject({ ok: true });
  });

  it('rejects a FAIL label when every required check passed', () => {
    expect(validateAutomatedResult({ ...validDfFu17, result: 'FAIL' })).toMatchObject({
      ok: false,
    });
  });

  it.each([
    ['missing engine', validDfFu17.runs.slice(0, -1)],
    ['duplicate engine', [validDfFu17.runs[0], validDfFu17.runs[0], validDfFu17.runs[2]]],
    [
      'wrong reflow width',
      validDfFu17.runs.map((run) =>
        run.engine === 'firefox' ? { ...run, viewport: { ...run.viewport, width: 321 } } : run,
      ),
    ],
    [
      'missing Chromium coarse-pointer evidence',
      validDfFu17.runs.map((run) =>
        run.engine === 'chromium'
          ? { ...run, mediaQueries: { '(pointer: coarse)': false, '(any-pointer: coarse)': false } }
          : run,
      ),
    ],
    [
      'duplicate artifact path',
      validDfFu17.runs.map((run) =>
        run.engine === 'chromium'
          ? { ...run, artifactPaths: [run.artifactPaths[0] ?? '', run.artifactPaths[0] ?? ''] }
          : run,
      ),
    ],
  ] as const)('rejects a DF-FU-17 matrix with %s', (_label, runs) => {
    expect(validateAutomatedResult({ ...validDfFu17, runs })).toMatchObject({ ok: false });
  });

  it('rejects mutable URLs and expected revision mismatches', () => {
    expect(
      validateAutomatedResult({
        ...validDfFu17,
        deploymentUrl:
          'https://file-upload-evidence.lyra-ds-docs.pages.dev/en/file-upload-evidence/',
      }),
    ).toMatchObject({ ok: false });
    expect(
      validateAutomatedResult(validDfFu17, {
        revision: 'b'.repeat(40),
        deploymentUrl: DEPLOYMENT_URL,
      }),
    ).toMatchObject({ ok: false });
  });
});

describe('export mutation immunity', () => {
  it('keeps manual validation independent from a cast mutation of exported check IDs', () => {
    const injectedCheck = 'DF-FU-M01-injected-check';
    try {
      (SCENARIO_CHECK_IDS['DF-FU-M01'] as unknown as string[]).push(injectedCheck);
    } catch {
      // A frozen public view rejects the hostile cast.
    }

    expect(
      validateObservation({
        ...validM01,
        checkAttestations: { ...validM01.checkAttestations, [injectedCheck]: true },
      }),
    ).toMatchObject({ ok: false, errors: [{ field: 'checkAttestations' }] });
  });

  it('keeps automated validation independent from a cast mutation of exported check IDs', () => {
    const injectedCheck = 'DF-FU-17-injected-check';
    try {
      (AUTOMATED_SCENARIO_CHECK_IDS['DF-FU-17'] as unknown as string[]).push(injectedCheck);
    } catch {
      // A frozen public view rejects the hostile cast.
    }
    const runs = validDfFu17.runs.map((run) => ({
      ...run,
      checks: { ...run.checks, [injectedCheck]: true },
    }));

    expect(validateAutomatedResult({ ...validDfFu17, runs })).toMatchObject({ ok: false });
  });

  it('does not let cast additions to exported media sets weaken manifest validation', () => {
    try {
      (MANUAL_MEDIA_TYPES as Set<string>).add('text/html');
      (EVIDENCE_ENTRY_MEDIA_TYPES as Set<string>).add('text/html');
    } catch {
      // A readonly public view has no mutator to call.
    }
    const entries = validManualManifest.entries.map((entry) =>
      entry.path.endsWith('.webm') ? { ...entry, mediaType: 'text/html' } : entry,
    );

    expect(validateManifest({ ...validManualManifest, entries })).toMatchObject({ ok: false });
  });

  it('does not let cast deletions from exported media sets break valid manifest validation', () => {
    try {
      (MANUAL_MEDIA_TYPES as Set<string>).delete('video/webm');
      (EVIDENCE_ENTRY_MEDIA_TYPES as Set<string>).delete('video/webm');
    } catch {
      // A readonly public view has no mutator to call.
    }

    expect(validateManifest(validManualManifest)).toMatchObject({ ok: true });
  });
});
