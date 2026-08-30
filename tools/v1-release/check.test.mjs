import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import test from 'node:test';

import { validateV1Program } from './check.mjs';

const execFileAsync = promisify(execFile);
const LEDGER_PATH = 'docs/superpowers/baselines/lyra-v1/program.json';
const UNTRACKED_DOCUMENT_PATH = 'tools/v1-release/.check-untracked-test.md';

const P1_IDS = [
  'dialog',
  'drawer',
  'bottom-sheet',
  'popover',
  'dropdown',
  'tooltip',
  'command-palette',
  'workspace-switcher',
  'create-workspace-dialog',
  'tabs',
  'data-table',
];

const ACCEPTANCE_CELLS = [
  'chromium',
  'firefox',
  'webkit',
  'react-18',
  'react-19',
  'ssr',
  'hydration',
  'keyboard-focus',
  'axe-light',
  'axe-dark',
  'forced-colors',
  'reduced-motion',
  'ltr',
  'rtl',
  'coarse-pointer',
  'bundle-standalone',
  'bundle-composition',
  'packed-esm',
  'packed-cjs',
  'packed-types',
  'consumer-vite',
  'consumer-next',
  'consumer-commonjs',
];

function plannedEntry(id, stream, wave) {
  return {
    id,
    stream,
    wave,
    priority: 'P1',
    governingSpecification: { path: null, status: 'not-authored' },
    currentContract: [`packages/react/src/${id}/${id}.tsx`],
    targetContracts: [`v1-${id}`],
    implementationStatus: 'planned',
    acceptanceProfile: 'v1-interactive',
    notApplicable: [],
    acceptanceEvidence: {},
    migrationGuides: { en: null, ptBR: null },
    compatibility: { styles: null, react: null, alpine: null },
    immutableEvidence: [],
    manualEvidence: 'deferred-by-release-profile',
  };
}

function validProgram() {
  return {
    ledger: {
      schemaVersion: 1,
      targetRelease: '1.0.0',
      programSpecification:
        'docs/superpowers/specs/2026-08-30-lyra-v1-deliberate-release-design.md',
      releaseStatus: 'planning',
      acceptanceProfiles: { 'v1-interactive': ACCEPTANCE_CELLS },
      components: P1_IDS.map((id) =>
        plannedEntry(
          id,
          ['tabs', 'data-table'].includes(id) ? id : 'overlay',
          ['dialog', 'drawer', 'bottom-sheet'].includes(id)
            ? 'modal'
            : ['popover', 'dropdown', 'tooltip'].includes(id)
              ? 'anchored'
              : ['tabs', 'data-table'].includes(id)
                ? id
                : 'composed',
        ),
      ),
    },
    documents: {
      'docs/superpowers/specs/2026-08-30-lyra-v1-deliberate-release-design.md':
        '**Status:** Approved',
    },
  };
}

function qualifiedProgram() {
  const input = validProgram();
  const entry = input.ledger.components[0];
  entry.implementationStatus = 'qualified';
  entry.governingSpecification = { path: 'docs/spec.md', status: 'implemented' };
  entry.migrationGuides = { en: 'docs/migration-en.md', ptBR: 'docs/migration-pt-BR.md' };
  entry.compatibility = { styles: '^1.0.0', react: '^1.0.0', alpine: '^1.0.0' };
  entry.acceptanceEvidence = Object.fromEntries(
    ACCEPTANCE_CELLS.map((cell) => [
      cell,
      {
        result: 'PASS',
        revision: '0123456789abcdef0123456789abcdef01234567',
        artifact: `evidence/${cell}.json`,
      },
    ]),
  );
  entry.immutableEvidence = ['evidence/summary.json'];
  Object.assign(input.documents, {
    'docs/spec.md': '**Status:** Implemented',
    'docs/migration-en.md': '# Migration',
    'docs/migration-pt-BR.md': '# Migração',
    'evidence/summary.json': '{}',
    ...Object.fromEntries(ACCEPTANCE_CELLS.map((cell) => [`evidence/${cell}.json`, '{}'])),
  });
  return input;
}

test('accepts the complete planned V1 program', () => {
  assert.deepEqual(validateV1Program(validProgram()), []);
});

for (const [name, mutate, expected] of [
  ['null root', (input) => (input.ledger = null), 'ledger must be a plain object'],
  ['wrong schema', (input) => (input.ledger.schemaVersion = 2), 'schemaVersion must equal 1'],
  [
    'wrong target',
    (input) => (input.ledger.targetRelease = '0.9.0'),
    'targetRelease must equal 1.0.0',
  ],
  ['missing component', (input) => input.ledger.components.pop(), 'P1 component set must match'],
  [
    'duplicate component',
    (input) => input.ledger.components.push(input.ledger.components[0]),
    'component IDs must be unique',
  ],
  [
    'wrong priority',
    (input) => (input.ledger.components[0].priority = 'P2'),
    'priority must equal P1',
  ],
  [
    'missing field',
    (input) => delete input.ledger.components[0].migrationGuides,
    'migrationGuides is required',
  ],
  [
    'unknown lifecycle',
    (input) => (input.ledger.components[0].implementationStatus = 'done'),
    'implementationStatus is invalid',
  ],
  [
    'missing spec path',
    (input) => {
      input.ledger.components[0].governingSpecification = { path: null, status: 'draft' };
    },
    'draft specification must name a tracked path',
  ],
  [
    'false completed claim',
    (input) => {
      input.ledger.components[0].implementationStatus = 'qualified';
    },
    'qualified component requires an implemented specification',
  ],
  [
    'unknown matrix cell',
    (input) => input.ledger.acceptanceProfiles['v1-interactive'].push('phantom'),
    'acceptance profile contains unknown cells',
  ],
  [
    'unjustified exclusion',
    (input) => {
      input.ledger.components[0].notApplicable = [{ cell: 'rtl', reason: '' }];
    },
    'notApplicable reason must be non-empty',
  ],
]) {
  test(`rejects ${name}`, () => {
    const input = structuredClone(validProgram());
    mutate(input);
    assert.ok(validateV1Program(input).some((error) => error.includes(expected)));
  });
}

test('accepts a qualified entry only with complete tracked evidence', () => {
  assert.deepEqual(validateV1Program(qualifiedProgram()), []);
});

test('rejects added profiles and requires every entry to use v1-interactive', () => {
  const input = validProgram();
  input.ledger.acceptanceProfiles.escape = [];
  input.ledger.components[0].acceptanceProfile = 'escape';

  const errors = validateV1Program(input);
  assert.ok(
    errors.some((error) => error.includes('acceptanceProfiles must contain only v1-interactive')),
  );
  assert.ok(
    errors.some((error) => error.includes('dialog: acceptanceProfile must equal v1-interactive')),
  );
});

test('rejects an unknown qualified evidence record even when it is invalid', () => {
  const input = qualifiedProgram();
  input.ledger.components[0].acceptanceEvidence.phantom = {
    result: 'FAIL',
    revision: 'not-a-revision',
    artifact: 'missing.json',
  };

  const errors = validateV1Program(input);
  assert.ok(
    errors.some((error) => error.includes('acceptanceEvidence contains unknown cell phantom')),
  );
  assert.ok(
    errors.some((error) => error.includes('qualified component evidence phantom is invalid')),
  );
});

test('CLI rejects readable but untracked referenced documents', async () => {
  const originalLedger = await readFile(LEDGER_PATH, 'utf8');
  const ledger = JSON.parse(originalLedger);
  ledger.components[0].governingSpecification = {
    path: UNTRACKED_DOCUMENT_PATH,
    status: 'draft',
  };

  await writeFile(UNTRACKED_DOCUMENT_PATH, '# Untracked draft\n');
  await writeFile(LEDGER_PATH, `${JSON.stringify(ledger, null, 2)}\n`);
  try {
    await assert.rejects(
      execFileAsync(process.execPath, ['tools/v1-release/check.mjs']),
      (error) =>
        error.code === 1 &&
        error.stderr.includes(`referenced path is not Git-tracked: ${UNTRACKED_DOCUMENT_PATH}`),
    );
  } finally {
    await writeFile(LEDGER_PATH, originalLedger);
    await rm(UNTRACKED_DOCUMENT_PATH, { force: true });
  }
});

test('reports malformed qualified exclusions without throwing', () => {
  const input = qualifiedProgram();
  input.ledger.components[0].notApplicable = [null];

  assert.ok(
    validateV1Program(input).some((error) =>
      error.includes('notApplicable reason must be non-empty'),
    ),
  );
});

for (const [name, mutate, expected] of [
  [
    'unimplemented specification status',
    (input) => (input.ledger.components[0].governingSpecification.status = 'approved'),
    'qualified component requires an implemented specification',
  ],
  [
    'unimplemented specification metadata',
    (input) => (input.documents['docs/spec.md'] = '**Status:** Approved'),
    'implemented specification metadata is missing',
  ],
  [
    'missing Portuguese migration guide',
    (input) => (input.ledger.components[0].migrationGuides.ptBR = null),
    'qualified component requires tracked ptBR migration',
  ],
  [
    'missing Alpine compatibility range',
    (input) => (input.ledger.components[0].compatibility.alpine = null),
    'qualified component requires alpine compatibility',
  ],
  [
    'failed automated evidence',
    (input) => (input.ledger.components[0].acceptanceEvidence.chromium.result = 'FAIL'),
    'qualified component requires passing chromium evidence',
  ],
  [
    'non-immutable evidence artifact',
    (input) => (input.ledger.components[0].acceptanceEvidence.chromium.artifact = 'missing.json'),
    'qualified component requires passing chromium evidence',
  ],
  [
    'manual pass claim',
    (input) => (input.ledger.components[0].manualEvidence = 'PASS'),
    'absent manual evidence must be deferred-by-release-profile',
  ],
]) {
  test(`rejects qualified entry with ${name}`, () => {
    const input = qualifiedProgram();
    mutate(input);
    assert.ok(validateV1Program(input).some((error) => error.includes(expected)));
  });
}
