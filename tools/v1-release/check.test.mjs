import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import test from 'node:test';

import { validateV1Entry, validateV1Program, validateV1ReleaseWiring } from './check.mjs';

const execFileAsync = promisify(execFile);
const LEDGER_PATH = 'docs/superpowers/baselines/lyra-v1/program.json';
const UNTRACKED_DOCUMENT_PATH = 'tools/v1-release/.check-untracked-test.md';
const PACKAGE_JSON_PATH = 'package.json';
const CI_WORKFLOW_PATH = '.github/workflows/ci.yml';

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

const OVERLAY_IDS = P1_IDS.slice(0, 9);
const OVERLAY_SPEC_PATH = 'docs/superpowers/specs/2026-08-30-overlay-family-design.md';
const OVERLAY_TARGET_CONTRACTS = {
  dialog: ['OF-MODAL'],
  drawer: ['OF-MODAL'],
  'bottom-sheet': ['OF-MODAL'],
  popover: ['OF-ANCHORED'],
  dropdown: ['OF-ANCHORED', 'OF-MENU'],
  tooltip: ['OF-ANCHORED', 'OF-TOOLTIP'],
  'command-palette': ['OF-COMPOSED', 'OF-MODAL'],
  'workspace-switcher': ['OF-COMPOSED', 'OF-ANCHORED'],
  'create-workspace-dialog': ['OF-COMPOSED', 'OF-MODAL'],
};
const OVERLAY_SPEC_HEADINGS = [
  'Decision summary',
  'Scope and ownership',
  'Current contract inventory',
  'Shared layer contract',
  'Modal contract',
  'Anchored layer contract',
  'Menu contract',
  'Tooltip contract',
  'Composed overlay contract',
  'React and Alpine boundary',
  'SSR, hydration, and no-JavaScript contract',
  'Acceptance matrix',
  'Public API and migration policy',
  'Foundation evaluation gate',
  'Failure handling',
  'Approval checklist',
];

const OVERLAY_SPEC_REFERENCES = [
  './2026-08-30-lyra-v1-deliberate-release-design.md',
  './lyra-v1/01-design-product-principles.md',
  './lyra-v1/02-tokens-visual-language.md',
  './lyra-v1/03-interaction-accessibility.md',
  './lyra-v1/04-component-architecture.md',
  './lyra-v1/05-quality-performance.md',
];

const OVERLAY_CANCELLATION_CLAUSES = [
  '`CreateWorkspaceRequest` is `{ operationId: string; data: { name: string; slug: string }; signal: AbortSignal }`.',
  '`CreateWorkspaceResult` MUST carry the same `operationId`.',
  'Lyra MUST commit `canceling` before calling `controller.abort({ operationId })` synchronously in the same accepted close interaction task.',
  '`signal.reason` MUST equal `{ operationId }`.',
  'Duplicate close requests while `canceling` MUST NOT call `abort` again.',
  'A terminal result with a noncurrent `operationId` MUST be ignored as stale.',
];

const OVERLAY_NORMATIVE_CLAUSE_GROUPS = {
  'public inventory and events': [
    'Every React overlay value and type is available from both the package root and the component subpath.',
    'All three Alpine `$dispatch` events bubble, are composed, and are cancelable under the shipped Alpine event mechanism, so a listener on the served component root observes them.',
    'The payload shapes above are structural current contracts; the package does not export separately named event-detail types.',
  ],
  'total modal focus fallback': [
    'The final panel fallback is mandatory, so an absent or invalid declared target MUST never leave focus in background content or without an outcome.',
  ],
  'disabled menu behavior': [
    'An `aria-disabled="true"` item MUST remain discoverable by arrow navigation when present in the public item model.',
    'but it MUST NOT activate, select, close the menu, or emit a result.',
  ],
  'exact tooltip delays': [
    'Hover MUST expose it after a 500 ms initial delay.',
    'The warm delay is exactly 0 ms: while it is warm, entering another trigger MUST expose its tooltip in the same interaction turn without starting the 500 ms timer.',
    'The 300 ms warm grace begins when the last visible tooltip logically closes and no trigger or tooltip branch retains focus or hover ownership.',
    'Leaving both trigger and tooltip MUST close after a 100 ms pointer-transition grace period so the pointer can cross into hoverable content.',
  ],
  'future menu adoption': [
    'Any future surface MUST be added through a separately approved revision of this specification before adopting `OF-MENU`.',
  ],
};

const OVERLAY_FOUNDATION_CANDIDATES = [
  'incumbent Lyra implementation',
  'Radix',
  'Base UI',
  'active Zag direction',
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

function overlayDraftProgram(document) {
  const input = validProgram();
  for (const entry of input.ledger.components) {
    if (!OVERLAY_IDS.includes(entry.id)) continue;
    entry.governingSpecification = { path: OVERLAY_SPEC_PATH, status: 'draft' };
    entry.targetContracts = OVERLAY_TARGET_CONTRACTS[entry.id];
    entry.implementationStatus = 'specified';
  }
  if (document !== undefined) input.documents[OVERLAY_SPEC_PATH] = document;
  return input;
}

function structurallyCompleteOverlaySpecification() {
  return [
    '# Lyra V1 Overlay Family Design',
    '',
    '**Status:** Draft — awaiting written review',
    '',
    '**Date:** 2026-08-30',
    '',
    '**Owner:** Lyra maintainers',
    '',
    '**Scope:** Dialog, Drawer, BottomSheet, Popover, Dropdown, Tooltip, CommandPalette, WorkspaceSwitcher, and CreateWorkspaceDialog across the public Styles, React, and claimed Alpine surfaces.',
    '',
    ...OVERLAY_SPEC_HEADINGS.flatMap((heading) => [`## ${heading}`, '', 'Normative text.', '']),
    'OF-MODAL OF-ANCHORED OF-MENU OF-TOOLTIP OF-COMPOSED',
    '',
    'Chromium Firefox WebKit React 18 React 19 deferred-by-release-profile',
    '',
    ...OVERLAY_CANCELLATION_CLAUSES,
    '',
    ...Object.values(OVERLAY_NORMATIVE_CLAUSE_GROUPS).flat(),
    '',
    ...OVERLAY_FOUNDATION_CANDIDATES,
    '',
    ...OVERLAY_SPEC_REFERENCES.map((path) => `- [Required specification](${path})`),
    '',
  ].join('\n');
}

function qualifiedProgram() {
  const input = validProgram();
  const tabsIndex = input.ledger.components.findIndex(({ id }) => id === 'tabs');
  [input.ledger.components[0], input.ledger.components[tabsIndex]] = [
    input.ledger.components[tabsIndex],
    input.ledger.components[0],
  ];
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

function validV1ReleaseWorkflow() {
  return `jobs:
  lint:
    steps:
      - run: pnpm install --frozen-lockfile
      - run: pnpm v1-core:check
      - run: pnpm v1-release:check
`;
}

function validV1ReleasePackageJson() {
  return { scripts: { 'v1-release:check': 'node tools/v1-release/check.mjs' } };
}

test('requires the repository package command and lint workflow gate', async () => {
  const [packageJson, workflow] = await Promise.all([
    readFile(PACKAGE_JSON_PATH, 'utf8').then(JSON.parse),
    readFile(CI_WORKFLOW_PATH, 'utf8'),
  ]);

  assert.deepEqual(validateV1ReleaseWiring({ packageJson, workflow }), []);
});

for (const [name, workflow] of [
  [
    'comment-only command text',
    validV1ReleaseWorkflow().replace(
      '      - run: pnpm v1-release:check',
      '      # pnpm v1-release:check',
    ),
  ],
  [
    'echoed command text',
    validV1ReleaseWorkflow().replace(
      '      - run: pnpm v1-release:check',
      '      - run: echo pnpm v1-release:check',
    ),
  ],
  [
    'conditional command',
    validV1ReleaseWorkflow().replace(
      '      - run: pnpm v1-release:check',
      '      - if: false\n        run: pnpm v1-release:check',
    ),
  ],
  [
    'continue-on-error command',
    validV1ReleaseWorkflow().replace(
      '      - run: pnpm v1-release:check',
      '      - continue-on-error: true\n        run: pnpm v1-release:check',
    ),
  ],
  [
    'expression continue-on-error command',
    validV1ReleaseWorkflow().replace(
      '      - run: pnpm v1-release:check',
      '      - continue-on-error: ${{ true }}\n        run: pnpm v1-release:check',
    ),
  ],
  [
    'command in a wrong job',
    `jobs:
  lint:
    steps:
      - run: pnpm install --frozen-lockfile
      - run: pnpm v1-core:check
  test:
    steps:
      - run: pnpm v1-release:check
`,
  ],
  [
    'command before frozen install',
    `jobs:
  lint:
    steps:
      - run: pnpm v1-release:check
      - run: pnpm install --frozen-lockfile
      - run: pnpm v1-core:check
`,
  ],
]) {
  test(`rejects ${name}`, () => {
    assert.deepEqual(
      validateV1ReleaseWiring({
        packageJson: validV1ReleasePackageJson(),
        workflow,
      }),
      ['lint must run pnpm v1-release:check unconditionally'],
    );
  });
}

test('accepts the complete planned V1 program', () => {
  assert.deepEqual(validateV1Program(validProgram()), []);
});

test('rejects overlay draft entries without their tracked family specification', () => {
  const errors = validateV1Program(overlayDraftProgram());

  for (const id of OVERLAY_IDS) {
    assert.ok(
      errors.some((error) => error.includes(`${id}: draft specification must name a tracked path`)),
    );
  }
});

test('rejects an overlay family draft without the complete required structure', () => {
  const errors = validateV1Program(
    overlayDraftProgram('# Lyra V1 Overlay Family Design\n\n**Status:** Draft'),
  );

  assert.ok(errors.some((error) => error.includes('draft metadata is incomplete')));
  for (const heading of OVERLAY_SPEC_HEADINGS) {
    assert.ok(
      errors.some((error) => error.includes(`level-two heading \"${heading}\" exactly once`)),
    );
  }
  for (const name of OVERLAY_IDS) {
    const componentName = {
      dialog: 'Dialog',
      drawer: 'Drawer',
      'bottom-sheet': 'BottomSheet',
      popover: 'Popover',
      dropdown: 'Dropdown',
      tooltip: 'Tooltip',
      'command-palette': 'CommandPalette',
      'workspace-switcher': 'WorkspaceSwitcher',
      'create-workspace-dialog': 'CreateWorkspaceDialog',
    }[name];
    assert.ok(errors.some((error) => error.includes(`component ${componentName}`)));
  }
  for (const contractId of ['OF-MODAL', 'OF-ANCHORED', 'OF-MENU', 'OF-TOOLTIP', 'OF-COMPOSED']) {
    assert.ok(errors.some((error) => error.includes(`contract ${contractId}`)));
  }
  for (const marker of [
    'Chromium',
    'Firefox',
    'WebKit',
    'React 18',
    'React 19',
    'deferred-by-release-profile',
  ]) {
    assert.ok(errors.some((error) => error.includes(`required marker ${marker}`)));
  }
  for (const reference of OVERLAY_SPEC_REFERENCES) {
    assert.ok(errors.some((error) => error.includes(`required link ${reference}`)));
  }
});

test('requires every overlay family heading at level two exactly once', () => {
  for (const heading of OVERLAY_SPEC_HEADINGS) {
    const document = structurallyCompleteOverlaySpecification().replace(
      `## ${heading}`,
      `### ${heading}`,
    );
    assert.ok(
      validateV1Program(overlayDraftProgram(document)).some((error) =>
        error.includes(`level-two heading \"${heading}\" exactly once`),
      ),
    );
  }

  const duplicated = structurallyCompleteOverlaySpecification().replace(
    '## Decision summary',
    '## Decision summary\n\n## Decision summary',
  );
  assert.ok(
    validateV1Program(overlayDraftProgram(duplicated)).some((error) =>
      error.includes('level-two heading \"Decision summary\" exactly once'),
    ),
  );
});

test('requires the exact overlay family scope metadata', () => {
  const document = structurallyCompleteOverlaySpecification().replace(
    '**Scope:** Dialog, Drawer, BottomSheet, Popover, Dropdown, Tooltip, CommandPalette, WorkspaceSwitcher, and CreateWorkspaceDialog across the public Styles, React, and claimed Alpine surfaces.',
    '**Scope:** Overlay components.',
  );

  assert.ok(
    validateV1Program(overlayDraftProgram(document)).some((error) =>
      error.includes('draft metadata is incomplete'),
    ),
  );
});

test('requires a concrete operation-scoped CreateWorkspaceDialog cancellation contract', () => {
  const specification = structurallyCompleteOverlaySpecification();

  for (const clause of OVERLAY_CANCELLATION_CLAUSES) {
    const document = specification.replace(clause, 'Incomplete cancellation contract.');
    assert.ok(
      validateV1Program(overlayDraftProgram(document)).some((error) =>
        error.includes('concrete CreateWorkspaceDialog cancellation contract'),
      ),
      clause,
    );
  }
});

for (const [contractName, clauses] of Object.entries(OVERLAY_NORMATIVE_CLAUSE_GROUPS)) {
  test(`requires the durable ${contractName} contract`, () => {
    const specification = structurallyCompleteOverlaySpecification();

    for (const clause of clauses) {
      const document = specification.replace(clause, 'Omitted normative contract.');
      assert.ok(
        validateV1Program(overlayDraftProgram(document)).some((error) =>
          error.includes(`required ${contractName} clause`),
        ),
        clause,
      );
    }
  });
}

test('requires every named overlay foundation candidate', () => {
  const specification = structurallyCompleteOverlaySpecification();

  for (const candidate of OVERLAY_FOUNDATION_CANDIDATES) {
    const document = specification.replace(candidate, 'omitted candidate');
    assert.ok(
      validateV1Program(overlayDraftProgram(document)).some((error) =>
        error.includes(`foundation candidate ${candidate}`),
      ),
      candidate,
    );
  }
});

test('rejects draft ledger status when the overlay document is approved or omits status', () => {
  for (const document of [
    structurallyCompleteOverlaySpecification().replace(
      '**Status:** Draft — awaiting written review',
      '**Status:** Approved',
    ),
    structurallyCompleteOverlaySpecification().replace(
      '**Status:** Draft — awaiting written review\n\n',
      '',
    ),
  ]) {
    assert.ok(
      validateV1Program(overlayDraftProgram(document)).some((error) =>
        error.includes('dialog: overlay specification metadata must match draft status'),
      ),
    );
  }
});

test('accepts an explicitly approved overlay document when every ledger entry matches', () => {
  const document = structurallyCompleteOverlaySpecification().replace(
    '**Status:** Draft — awaiting written review',
    '**Status:** Approved',
  );
  const input = overlayDraftProgram(document);
  for (const entry of input.ledger.components) {
    if (!OVERLAY_IDS.includes(entry.id)) continue;
    entry.governingSpecification.status = 'approved';
  }

  assert.deepEqual(validateV1Program(input), []);
});

for (const state of ['evaluating', 'implementing', 'qualified']) {
  test(`rejects draft overlay entries that claim ${state}`, () => {
    const input = overlayDraftProgram(structurallyCompleteOverlaySpecification());
    const entry = input.ledger.components.find(({ id }) => id === 'dropdown');
    entry.implementationStatus = state;

    assert.ok(
      validateV1Program(input).some((error) =>
        error.includes(`dropdown: lifecycle pair draft + ${state} is invalid`),
      ),
    );
  });
}

for (const implementationStatus of ['specified', 'evaluating', 'implementing']) {
  test(`accepts approved + ${implementationStatus}`, () => {
    const entry = plannedEntry('tabs', 'tabs', 'tabs');
    entry.governingSpecification = { path: 'docs/spec.md', status: 'approved' };
    entry.implementationStatus = implementationStatus;

    assert.deepEqual(
      validateV1Entry(entry, validProgram().ledger.acceptanceProfiles, {
        'docs/spec.md': '**Status:** Approved',
      }),
      [],
    );
  });
}

test('accepts the planned DataTable exception for its FileUpload-only implemented family spec', () => {
  const entry = plannedEntry('data-table', 'data-table', 'data-table');
  entry.governingSpecification = {
    path: 'docs/superpowers/specs/2026-08-15-data-files-family-design.md',
    status: 'implemented',
  };

  assert.deepEqual(
    validateV1Entry(entry, validProgram().ledger.acceptanceProfiles, {
      'docs/superpowers/specs/2026-08-15-data-files-family-design.md':
        '**Status:** Implemented under Automated Core — FileUpload wave',
    }),
    [],
  );
});

test('rejects the planned DataTable exception without FileUpload-scoped metadata', () => {
  const entry = plannedEntry('data-table', 'data-table', 'data-table');
  entry.governingSpecification = {
    path: 'docs/superpowers/specs/2026-08-15-data-files-family-design.md',
    status: 'implemented',
  };

  assert.ok(
    validateV1Entry(entry, validProgram().ledger.acceptanceProfiles, {
      'docs/superpowers/specs/2026-08-15-data-files-family-design.md': '**Status:** Implemented',
    }).some((error) =>
      error.includes('data-table: lifecycle pair implemented + planned is invalid'),
    ),
  );
});

test('does not let the planned DataTable exception authorize a qualified claim', () => {
  const input = qualifiedProgram();
  const entry = input.ledger.components[0];
  entry.id = 'data-table';
  entry.governingSpecification = {
    path: 'docs/superpowers/specs/2026-08-15-data-files-family-design.md',
    status: 'implemented',
  };
  input.documents['docs/superpowers/specs/2026-08-15-data-files-family-design.md'] =
    '**Status:** Implemented under Automated Core — FileUpload wave';

  assert.ok(
    validateV1Entry(entry, input.ledger.acceptanceProfiles, input.documents).some((error) =>
      error.includes('implemented specification metadata is missing'),
    ),
  );
});

for (const id of OVERLAY_IDS) {
  test(`rejects an incorrect ${id} overlay draft target map`, () => {
    const input = overlayDraftProgram(structurallyCompleteOverlaySpecification());
    const entry = input.ledger.components.find((candidate) => candidate.id === id);
    entry.targetContracts = ['legacy-target'];

    assert.ok(
      validateV1Program(input).some((error) =>
        error.includes(
          `${id}: overlay targetContracts must equal ${OVERLAY_TARGET_CONTRACTS[id].join(', ')}`,
        ),
      ),
    );
  });
}

for (const id of OVERLAY_IDS) {
  test(`rejects an incorrect ${id} overlay draft lifecycle map`, () => {
    const specification = structurallyCompleteOverlaySpecification();
    const mutations = [
      {
        change(entry, input) {
          entry.governingSpecification.path = 'docs/alternate-overlay-spec.md';
          input.documents['docs/alternate-overlay-spec.md'] = specification;
        },
        expected: `${id}: overlay specification path must equal ${OVERLAY_SPEC_PATH}`,
      },
      {
        change(entry) {
          entry.governingSpecification.status = 'approved';
        },
        expected: `${id}: overlay specification metadata must match approved status`,
      },
      {
        change(entry) {
          entry.implementationStatus = 'planned';
        },
        expected: `${id}: lifecycle pair draft + planned is invalid`,
      },
    ];

    for (const mutation of mutations) {
      const input = overlayDraftProgram(specification);
      const entry = input.ledger.components.find((candidate) => candidate.id === id);
      mutation.change(entry, input);
      assert.ok(
        validateV1Program(input).some((error) => error.includes(mutation.expected)),
        mutation.expected,
      );
    }
  });
}

test('accepts a structurally complete tracked overlay family draft', () => {
  assert.deepEqual(
    validateV1Program(overlayDraftProgram(structurallyCompleteOverlaySpecification())),
    [],
  );
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
