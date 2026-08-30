import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { parse } from 'yaml';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const execFileAsync = promisify(execFile);
const ACCEPTANCE_PROFILE_NAME = 'v1-interactive';
const OVERLAY_SPEC_PATH = 'docs/superpowers/specs/2026-08-30-overlay-family-design.md';
const DATA_FILES_SPEC_PATH = 'docs/superpowers/specs/2026-08-15-data-files-family-design.md';
const DATA_FILES_STATUS_METADATA = new Map([
  ['file-upload-wave', '**Status:** Implemented under Automated Core — FileUpload wave'],
  ['implemented', '**Status:** Implemented'],
]);

const OVERLAY_TARGET_CONTRACTS = new Map([
  ['dialog', ['OF-MODAL']],
  ['drawer', ['OF-MODAL']],
  ['bottom-sheet', ['OF-MODAL']],
  ['popover', ['OF-ANCHORED']],
  ['dropdown', ['OF-ANCHORED', 'OF-MENU']],
  ['tooltip', ['OF-ANCHORED', 'OF-TOOLTIP']],
  ['command-palette', ['OF-COMPOSED', 'OF-MODAL']],
  ['workspace-switcher', ['OF-COMPOSED', 'OF-ANCHORED']],
  ['create-workspace-dialog', ['OF-COMPOSED', 'OF-MODAL']],
]);

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

const OVERLAY_SPEC_COMPONENTS = [
  'Dialog',
  'Drawer',
  'BottomSheet',
  'Popover',
  'Dropdown',
  'Tooltip',
  'CommandPalette',
  'WorkspaceSwitcher',
  'CreateWorkspaceDialog',
];

const OVERLAY_SPEC_CONTRACTS = ['OF-MODAL', 'OF-ANCHORED', 'OF-MENU', 'OF-TOOLTIP', 'OF-COMPOSED'];

const OVERLAY_SPEC_MARKERS = [
  'Chromium',
  'Firefox',
  'WebKit',
  'React 18',
  'React 19',
  'deferred-by-release-profile',
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

const OVERLAY_NORMATIVE_CLAUSE_GROUPS = new Map([
  [
    'public inventory and events',
    [
      'Every React overlay value and type is available from both the package root and the component subpath.',
      'All three Alpine `$dispatch` events bubble, are composed, and are cancelable under the shipped Alpine event mechanism, so a listener on the served component root observes them.',
      'The payload shapes above are structural current contracts; the package does not export separately named event-detail types.',
    ],
  ],
  [
    'total modal focus fallback',
    [
      'The final panel fallback is mandatory, so an absent or invalid declared target MUST never leave focus in background content or without an outcome.',
    ],
  ],
  [
    'disabled menu behavior',
    [
      'An `aria-disabled="true"` item MUST remain discoverable by arrow navigation when present in the public item model.',
      'but it MUST NOT activate, select, close the menu, or emit a result.',
    ],
  ],
  [
    'exact tooltip delays',
    [
      'Hover MUST expose it after a 500 ms initial delay.',
      'The warm delay is exactly 0 ms: while it is warm, entering another trigger MUST expose its tooltip in the same interaction turn without starting the 500 ms timer.',
      'The 300 ms warm grace begins when the last visible tooltip logically closes and no trigger or tooltip branch retains focus or hover ownership.',
      'Leaving both trigger and tooltip MUST close after a 100 ms pointer-transition grace period so the pointer can cross into hoverable content.',
    ],
  ],
  [
    'future menu adoption',
    [
      'Any future surface MUST be added through a separately approved revision of this specification before adopting `OF-MENU`.',
    ],
  ],
]);

const OVERLAY_FOUNDATION_CANDIDATES = [
  'incumbent Lyra implementation',
  'Radix',
  'Base UI',
  'active Zag direction',
];

const OVERLAY_STATUS_METADATA = new Map([
  ['draft', /^\*\*Status:\*\* Draft — awaiting written review$/mu],
  ['approved', /^\*\*Status:\*\* Approved$/mu],
  ['implemented', /^\*\*Status:\*\* Implemented$/mu],
]);

const P1_IDS = new Set([
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
]);
const IMPLEMENTATION_STATES = new Set([
  'planned',
  'specified',
  'evaluating',
  'implementing',
  'qualified',
]);
const SPECIFICATION_STATES = new Set(['not-authored', 'draft', 'approved', 'implemented']);
const VALID_LIFECYCLE_PAIRS = new Set([
  'not-authored:planned',
  'draft:specified',
  'approved:specified',
  'approved:evaluating',
  'approved:implementing',
  'implemented:qualified',
]);
const ACCEPTANCE_CELLS = new Set([
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
]);
const REQUIRED_ENTRY_KEYS = new Set([
  'id',
  'stream',
  'wave',
  'priority',
  'governingSpecification',
  'currentContract',
  'targetContracts',
  'implementationStatus',
  'acceptanceProfile',
  'notApplicable',
  'acceptanceEvidence',
  'migrationGuides',
  'compatibility',
  'immutableEvidence',
  'manualEvidence',
]);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function validateV1ReleaseWiring({ packageJson, workflow }) {
  const errors = [];
  const script = packageJson?.scripts?.['v1-release:check'];
  if (script !== 'node tools/v1-release/check.mjs') {
    errors.push('package.json must define the exact v1-release:check command');
  }
  const document = parse(workflow);
  const steps = document?.jobs?.lint?.steps;
  const isUnconditionalCommand = (step, command) =>
    typeof step?.run === 'string' &&
    step.run.trim() === command &&
    !Object.hasOwn(step, 'if') &&
    !Object.hasOwn(step, 'continue-on-error');
  const frozenInstallIndex = Array.isArray(steps)
    ? steps.findIndex((step) => isUnconditionalCommand(step, 'pnpm install --frozen-lockfile'))
    : -1;
  const v1CoreIndex = Array.isArray(steps)
    ? steps.findIndex((step) => isUnconditionalCommand(step, 'pnpm v1-core:check'))
    : -1;
  const releaseCheckIndices = Array.isArray(steps)
    ? steps.flatMap((step, index) =>
        typeof step?.run === 'string' && step.run.trim() === 'pnpm v1-release:check' ? [index] : [],
      )
    : [];
  if (frozenInstallIndex === -1) {
    errors.push('lint must run pnpm install --frozen-lockfile unconditionally');
  }
  if (v1CoreIndex === -1) {
    errors.push('lint must run pnpm v1-core:check unconditionally');
  }
  const releaseCheckIndex = releaseCheckIndices[0];
  if (
    releaseCheckIndices.length !== 1 ||
    !isUnconditionalCommand(steps?.[releaseCheckIndex], 'pnpm v1-release:check') ||
    releaseCheckIndex < frozenInstallIndex ||
    releaseCheckIndex < v1CoreIndex ||
    frozenInstallIndex === -1 ||
    v1CoreIndex === -1
  ) {
    errors.push('lint must run pnpm v1-release:check unconditionally');
  }
  return errors;
}

function isNonEmptyStringArray(value) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === 'string' && item)
  );
}

function hasTrackedDocument(path, documents) {
  return typeof path === 'string' && Object.hasOwn(documents, path);
}

function declaredNotApplicableEntries(document) {
  const declarations = new Set();
  for (const match of (document ?? '').matchAll(
    /^<!-- lyra-v1-not-applicable: (\{[^\r\n]+\}) -->$/gmu,
  )) {
    try {
      const declaration = JSON.parse(match[1]);
      if (
        isPlainObject(declaration) &&
        typeof declaration.component === 'string' &&
        ACCEPTANCE_CELLS.has(declaration.cell) &&
        typeof declaration.reason === 'string' &&
        declaration.reason.trim() !== ''
      ) {
        declarations.add(
          JSON.stringify([declaration.component, declaration.cell, declaration.reason]),
        );
      }
    } catch {
      // An unreadable directive cannot authorize a ledger exclusion.
    }
  }
  return declarations;
}

function dataFilesGoverningStatus(document) {
  const statusLines = [...(document ?? '').matchAll(/^\*\*Status:\*\* [^\r\n]+$/gmu)].map(
    (match) => match[0],
  );
  if (statusLines.length !== 1) return null;
  for (const [status, metadata] of DATA_FILES_STATUS_METADATA) {
    if (statusLines[0] === metadata) return status;
  }
  return null;
}

function validateOverlayProgramEntries(components, errors) {
  const entries = components.filter((entry) => OVERLAY_TARGET_CONTRACTS.has(entry?.id));

  for (const entry of entries) {
    const id = entry.id;
    const expectedTargets = OVERLAY_TARGET_CONTRACTS.get(id);
    if (entry.governingSpecification?.path !== OVERLAY_SPEC_PATH) {
      errors.push(`${id}: overlay specification path must equal ${OVERLAY_SPEC_PATH}`);
    }
    if (
      !Array.isArray(entry.targetContracts) ||
      entry.targetContracts.length !== expectedTargets.length ||
      entry.targetContracts.some((contract, index) => contract !== expectedTargets[index])
    ) {
      errors.push(`${id}: overlay targetContracts must equal ${expectedTargets.join(', ')}`);
    }
  }
}

function validateOverlaySpecification(document, entries, errors) {
  const normalizedDocument = document.replace(/\s+/gu, ' ');
  const statusLines = [...document.matchAll(/^\*\*Status:\*\* [^\r\n]+$/gmu)].map(
    (match) => match[0],
  );
  const recognizedStatusLines = statusLines.filter((line) =>
    [...OVERLAY_STATUS_METADATA.values()].some((pattern) => pattern.test(line)),
  );
  if (statusLines.length !== 1 || recognizedStatusLines.length !== 1) {
    errors.push('overlay specification must contain exactly one recognized status metadata line');
  }
  for (const entry of entries) {
    const status = entry?.governingSpecification?.status;
    const statusPattern = OVERLAY_STATUS_METADATA.get(status);
    if (!statusPattern?.test(document)) {
      errors.push(
        `${entry?.id ?? '<unknown>'}: overlay specification metadata must match ${status} status`,
      );
    }
  }
  if (
    !/^# Lyra V1 Overlay Family Design$/mu.test(document) ||
    !/^\*\*Date:\*\* 2026-08-30$/mu.test(document) ||
    !/^\*\*Owner:\*\* Lyra maintainers$/mu.test(document) ||
    !normalizedDocument.includes(
      '**Scope:** Dialog, Drawer, BottomSheet, Popover, Dropdown, Tooltip, CommandPalette, WorkspaceSwitcher, and CreateWorkspaceDialog across the public Styles, React, and claimed Alpine surfaces.',
    )
  ) {
    errors.push('overlay specification draft metadata is incomplete');
  }

  const headings = [...document.matchAll(/^## ([^\r\n]+)$/gmu)].map((match) => match[1]);
  for (const heading of OVERLAY_SPEC_HEADINGS) {
    if (headings.filter((candidate) => candidate === heading).length !== 1) {
      errors.push(`overlay specification must contain level-two heading "${heading}" exactly once`);
    }
  }
  for (const component of OVERLAY_SPEC_COMPONENTS) {
    if (!document.includes(component)) {
      errors.push(`overlay specification must name component ${component}`);
    }
  }
  for (const contract of OVERLAY_SPEC_CONTRACTS) {
    if (!document.includes(contract)) {
      errors.push(`overlay specification must define contract ${contract}`);
    }
  }
  for (const marker of OVERLAY_SPEC_MARKERS) {
    if (!document.includes(marker)) {
      errors.push(`overlay specification must contain required marker ${marker}`);
    }
  }
  for (const clause of OVERLAY_CANCELLATION_CLAUSES) {
    if (!normalizedDocument.includes(clause)) {
      errors.push(
        `overlay specification must define concrete CreateWorkspaceDialog cancellation contract: ${clause}`,
      );
    }
  }
  for (const [contractName, clauses] of OVERLAY_NORMATIVE_CLAUSE_GROUPS) {
    for (const clause of clauses) {
      if (!normalizedDocument.includes(clause)) {
        errors.push(
          `overlay specification must contain required ${contractName} clause: ${clause}`,
        );
      }
    }
  }
  for (const candidate of OVERLAY_FOUNDATION_CANDIDATES) {
    if (!document.includes(candidate)) {
      errors.push(`overlay specification must name foundation candidate ${candidate}`);
    }
  }
  for (const reference of OVERLAY_SPEC_REFERENCES) {
    if (!document.includes(`](${reference})`)) {
      errors.push(`overlay specification must contain required link ${reference}`);
    }
  }
}

function validateQualifiedEntry(entry, profile, documents, errors, label) {
  const specification = entry.governingSpecification;
  if (specification?.status !== 'implemented') {
    errors.push(`${label}: qualified component requires an implemented specification`);
  }
  const hasImplementedSpecification =
    specification?.path === DATA_FILES_SPEC_PATH
      ? dataFilesGoverningStatus(documents[specification.path]) === 'implemented'
      : /^\*\*Status:\*\* Implemented$/mu.test(documents[specification?.path] ?? '');
  if (!hasImplementedSpecification) {
    errors.push(`${label}: implemented specification metadata is missing`);
  }

  for (const locale of ['en', 'ptBR']) {
    if (!hasTrackedDocument(entry.migrationGuides?.[locale], documents)) {
      errors.push(`${label}: qualified component requires tracked ${locale} migration`);
    }
  }
  for (const packageName of ['styles', 'react', 'alpine']) {
    if (
      typeof entry.compatibility?.[packageName] !== 'string' ||
      !entry.compatibility[packageName]
    ) {
      errors.push(`${label}: qualified component requires ${packageName} compatibility`);
    }
  }

  const excluded = new Set(
    Array.isArray(entry.notApplicable)
      ? entry.notApplicable.filter(isPlainObject).map((exclusion) => exclusion.cell)
      : [],
  );
  const evidenceEntries = isPlainObject(entry.acceptanceEvidence)
    ? Object.entries(entry.acceptanceEvidence)
    : [];
  for (const [cell, evidence] of evidenceEntries) {
    if (!profile?.includes(cell)) {
      errors.push(`${label}: acceptanceEvidence contains unknown cell ${cell}`);
    }
    if (
      !isPlainObject(evidence) ||
      evidence.result !== 'PASS' ||
      !/^[0-9a-f]{40}$/u.test(evidence.revision ?? '') ||
      !hasTrackedDocument(evidence.artifact, documents)
    ) {
      errors.push(`${label}: qualified component evidence ${cell} is invalid`);
    }
  }
  for (const cell of profile ?? []) {
    if (excluded.has(cell)) continue;
    const evidence = entry.acceptanceEvidence?.[cell];
    if (
      !isPlainObject(evidence) ||
      evidence.result !== 'PASS' ||
      !/^[0-9a-f]{40}$/u.test(evidence.revision ?? '') ||
      !hasTrackedDocument(evidence.artifact, documents)
    ) {
      errors.push(`${label}: qualified component requires passing ${cell} evidence`);
    }
  }
  if (
    !Array.isArray(entry.immutableEvidence) ||
    entry.immutableEvidence.length === 0 ||
    entry.immutableEvidence.some((path) => !hasTrackedDocument(path, documents))
  ) {
    errors.push(`${label}: qualified component requires immutable evidence`);
  }
}

export function validateV1Entry(entry, acceptanceProfiles, documents = {}) {
  const errors = [];
  if (!isPlainObject(entry)) return ['component entry must be a plain object'];

  const label = typeof entry.id === 'string' ? entry.id : '<unknown>';
  const keys = new Set(Object.keys(entry));
  for (const key of REQUIRED_ENTRY_KEYS) {
    if (!keys.has(key)) errors.push(`${label}: ${key} is required`);
  }
  for (const key of keys) {
    if (!REQUIRED_ENTRY_KEYS.has(key)) errors.push(`${label}: unknown field ${key}`);
  }
  if (typeof entry.stream !== 'string' || !entry.stream)
    errors.push(`${label}: stream must be a non-empty string`);
  if (typeof entry.wave !== 'string' || !entry.wave)
    errors.push(`${label}: wave must be a non-empty string`);
  if (entry.priority !== 'P1') errors.push(`${label}: priority must equal P1`);
  if (!IMPLEMENTATION_STATES.has(entry.implementationStatus)) {
    errors.push(`${label}: implementationStatus is invalid`);
  }
  if (!isNonEmptyStringArray(entry.currentContract)) {
    errors.push(`${label}: currentContract must be a non-empty string array`);
  }
  if (!isNonEmptyStringArray(entry.targetContracts)) {
    errors.push(`${label}: targetContracts must be a non-empty string array`);
  }

  const specification = entry.governingSpecification;
  if (!isPlainObject(specification) || !SPECIFICATION_STATES.has(specification.status)) {
    errors.push(`${label}: governing specification status is invalid`);
  } else if (specification.status === 'not-authored') {
    if (specification.path !== null)
      errors.push(`${label}: not-authored specification path must be null`);
  } else if (!hasTrackedDocument(specification.path, documents)) {
    errors.push(`${label}: ${specification.status} specification must name a tracked path`);
  }
  const dataFilesStatus =
    specification?.path === DATA_FILES_SPEC_PATH
      ? dataFilesGoverningStatus(documents[DATA_FILES_SPEC_PATH])
      : null;
  if (specification?.path === DATA_FILES_SPEC_PATH && dataFilesStatus === null) {
    errors.push(
      `${label}: Data and Files specification must contain exactly one recognized governing status metadata line`,
    );
  }
  if (
    isPlainObject(specification) &&
    SPECIFICATION_STATES.has(specification.status) &&
    IMPLEMENTATION_STATES.has(entry.implementationStatus)
  ) {
    const lifecyclePair = `${specification.status}:${entry.implementationStatus}`;
    const isPlannedDataTableException =
      label === 'data-table' &&
      lifecyclePair === 'implemented:planned' &&
      specification.path === DATA_FILES_SPEC_PATH &&
      dataFilesStatus === 'file-upload-wave';
    if (!VALID_LIFECYCLE_PAIRS.has(lifecyclePair) && !isPlannedDataTableException) {
      errors.push(
        `${label}: lifecycle pair ${specification.status} + ${entry.implementationStatus} is invalid`,
      );
    }
  }

  const profile = acceptanceProfiles?.[ACCEPTANCE_PROFILE_NAME];
  if (entry.acceptanceProfile !== ACCEPTANCE_PROFILE_NAME) {
    errors.push(`${label}: acceptanceProfile must equal ${ACCEPTANCE_PROFILE_NAME}`);
  }
  if (!Array.isArray(profile)) errors.push(`${label}: acceptanceProfile is unknown`);
  if (!Array.isArray(entry.notApplicable)) {
    errors.push(`${label}: notApplicable must be an array`);
  } else {
    const excluded = new Set();
    const declaredExclusions = declaredNotApplicableEntries(documents[specification?.path]);
    for (const exclusion of entry.notApplicable) {
      const isValidExclusion =
        isPlainObject(exclusion) &&
        ACCEPTANCE_CELLS.has(exclusion.cell) &&
        typeof exclusion.reason === 'string' &&
        exclusion.reason.trim() !== '' &&
        !excluded.has(exclusion.cell);
      if (!isValidExclusion) {
        errors.push(`${label}: notApplicable reason must be non-empty and each cell unique`);
      } else if (specification?.path === OVERLAY_SPEC_PATH) {
        errors.push(
          `${label}: overlay specification requires every acceptance cell; notApplicable must be empty`,
        );
      } else if (
        !declaredExclusions.has(JSON.stringify([label, exclusion.cell, exclusion.reason]))
      ) {
        errors.push(
          `${label}: notApplicable cell ${exclusion.cell} must match an exact governing specification declaration`,
        );
      }
      if (!isPlainObject(exclusion) || !ACCEPTANCE_CELLS.has(exclusion.cell)) {
        continue;
      }
      excluded.add(exclusion.cell);
    }
  }
  if (entry.manualEvidence !== 'deferred-by-release-profile') {
    errors.push(`${label}: absent manual evidence must be deferred-by-release-profile`);
  }
  if (entry.implementationStatus === 'qualified') {
    validateQualifiedEntry(entry, profile, documents, errors, label);
  }
  return errors;
}

export function validateV1Program({ ledger, documents = {} } = {}) {
  const errors = [];
  if (!isPlainObject(ledger)) return ['ledger must be a plain object'];
  if (!isPlainObject(documents)) return ['documents must be a plain object'];
  if (ledger.schemaVersion !== 1) errors.push('schemaVersion must equal 1');
  if (ledger.targetRelease !== '1.0.0') errors.push('targetRelease must equal 1.0.0');
  if (ledger.releaseStatus !== 'planning') errors.push('releaseStatus must equal planning');
  if (
    ledger.programSpecification !==
      'docs/superpowers/specs/2026-08-30-lyra-v1-deliberate-release-design.md' ||
    !/^\*\*Status:\*\* Approved$/mu.test(documents[ledger.programSpecification] ?? '')
  ) {
    errors.push('programSpecification must reference the approved deliberate V1 design');
  }
  const profile = ledger.acceptanceProfiles?.[ACCEPTANCE_PROFILE_NAME];
  if (
    !isPlainObject(ledger.acceptanceProfiles) ||
    Object.keys(ledger.acceptanceProfiles).length !== 1 ||
    !Object.hasOwn(ledger.acceptanceProfiles, ACCEPTANCE_PROFILE_NAME) ||
    !Array.isArray(profile) ||
    profile.length !== ACCEPTANCE_CELLS.size ||
    profile.some((cell) => !ACCEPTANCE_CELLS.has(cell)) ||
    new Set(profile).size !== profile.length
  ) {
    errors.push(
      'acceptance profile contains unknown cells, missing cells, or duplicate cells; acceptanceProfiles must contain only v1-interactive with every required acceptance cell exactly once',
    );
  }
  if (!Array.isArray(ledger.components)) return [...errors, 'components must be an array'];
  const ids = ledger.components.map((entry) => entry?.id);
  if (ids.length !== P1_IDS.size || ids.some((id) => !P1_IDS.has(id))) {
    errors.push('P1 component set must match');
  }
  if (new Set(ids).size !== ids.length) errors.push('component IDs must be unique');
  for (const entry of ledger.components) {
    errors.push(...validateV1Entry(entry, ledger.acceptanceProfiles, documents));
  }
  validateOverlayProgramEntries(ledger.components, errors);
  if (hasTrackedDocument(OVERLAY_SPEC_PATH, documents)) {
    validateOverlaySpecification(
      documents[OVERLAY_SPEC_PATH],
      ledger.components.filter((entry) => OVERLAY_TARGET_CONTRACTS.has(entry?.id)),
      errors,
    );
  }
  return errors;
}

function referencedPaths(ledger) {
  const paths = new Set([ledger?.programSpecification, OVERLAY_SPEC_PATH]);
  for (const entry of ledger?.components ?? []) {
    paths.add(entry?.governingSpecification?.path);
    paths.add(entry?.migrationGuides?.en);
    paths.add(entry?.migrationGuides?.ptBR);
    if (Array.isArray(entry?.immutableEvidence)) {
      for (const path of entry.immutableEvidence) paths.add(path);
    }
    if (isPlainObject(entry?.acceptanceEvidence)) {
      for (const evidence of Object.values(entry.acceptanceEvidence)) paths.add(evidence?.artifact);
    }
  }
  return [...paths].filter((path) => path !== null && path !== undefined);
}

function isInsideRepository(path) {
  const resolved = resolve(repositoryRoot, path);
  return resolved === repositoryRoot || resolved.startsWith(`${repositoryRoot}/`);
}

async function collectDocuments(ledger) {
  const documents = {};
  const errors = [];
  for (const path of referencedPaths(ledger)) {
    if (typeof path !== 'string' || !path || !isInsideRepository(path)) {
      errors.push(`referenced path must be a non-empty repository-relative path: ${String(path)}`);
      continue;
    }
    try {
      await execFileAsync('git', ['ls-files', '--error-unmatch', '--', path], {
        cwd: repositoryRoot,
      });
    } catch {
      errors.push(`referenced path is not Git-tracked: ${path}`);
      continue;
    }
    try {
      documents[path] = await readFile(resolve(repositoryRoot, path), 'utf8');
    } catch {
      errors.push(`referenced path is not a tracked readable file: ${path}`);
    }
  }
  return { documents, errors };
}

async function main() {
  let ledger;
  try {
    ledger = JSON.parse(
      await readFile(
        resolve(repositoryRoot, 'docs/superpowers/baselines/lyra-v1/program.json'),
        'utf8',
      ),
    );
  } catch (error) {
    console.error(`Unable to read V1 program ledger: ${error.message}`);
    process.exitCode = 1;
    return;
  }
  const { documents, errors: documentErrors } = await collectDocuments(ledger);
  const errors = [...documentErrors, ...validateV1Program({ ledger, documents })];
  if (errors.length === 0) {
    console.log('Lyra V1 program ledger is internally consistent.');
    return;
  }
  console.error('Lyra V1 program ledger is inconsistent:');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
