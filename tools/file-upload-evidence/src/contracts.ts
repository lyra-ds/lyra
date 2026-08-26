import { MESSAGES } from './messages.ts';

export type Locale = 'pt-BR' | 'en';
export type ManualScenario = 'DF-FU-M01' | 'DF-FU-M02';
export type AutomatedScenario = 'DF-FU-17' | 'DF-FU-18';

function createReadonlySet<T>(values: readonly T[]): ReadonlySet<T> {
  const backing = new Set(values);
  let view: ReadonlySet<T>;
  view = Object.freeze({
    get size() {
      return backing.size;
    },
    has(value: T) {
      return backing.has(value);
    },
    entries() {
      return backing.entries();
    },
    keys() {
      return backing.keys();
    },
    values() {
      return backing.values();
    },
    forEach(callback: (value: T, value2: T, set: ReadonlySet<T>) => void, thisArg?: unknown) {
      for (const value of backing) callback.call(thisArg, value, value, view);
    },
    [Symbol.iterator]() {
      return backing[Symbol.iterator]();
    },
  });
  return view;
}

function frozenCheckIds<const T extends Record<string, readonly string[]>>(source: T): T {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(source).map(([scenario, checkIds]) => [
        scenario,
        Object.freeze([...checkIds]),
      ]),
    ),
  ) as T;
}

export const EVIDENCE_SCHEMA_VERSION = 1 as const;
export const MAX_MANUAL_FILES = 4;
export const MAX_MANUAL_FILE_BYTES = 50 * 1024 * 1024;
export const MAX_MANUAL_SCENARIO_BYTES = 100 * 1024 * 1024;
export const MAX_ARCHIVE_EXPANDED_BYTES = 220 * 1024 * 1024;
const manualMediaTypeValues = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'video/webm',
  'video/mp4',
  'video/quicktime',
] as const;
const evidenceEntryMediaTypeValues = [
  'application/json',
  'application/zip',
  ...manualMediaTypeValues,
] as const;
const manualMediaTypes = createReadonlySet<string>(manualMediaTypeValues);
const evidenceEntryMediaTypes = createReadonlySet<string>(evidenceEntryMediaTypeValues);
export const MANUAL_MEDIA_TYPES = createReadonlySet<string>(manualMediaTypeValues);
export const EVIDENCE_ENTRY_MEDIA_TYPES = createReadonlySet<string>(evidenceEntryMediaTypeValues);

const manualScenarioCheckIds = frozenCheckIds({
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
} as const satisfies Record<ManualScenario, readonly string[]>);
export const SCENARIO_CHECK_IDS = frozenCheckIds(manualScenarioCheckIds);

const automatedScenarioCheckIds = frozenCheckIds({
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
} as const satisfies Record<AutomatedScenario, readonly string[]>);
export const AUTOMATED_SCENARIO_CHECK_IDS = frozenCheckIds(automatedScenarioCheckIds);

export type ScenarioCheckId = (typeof SCENARIO_CHECK_IDS)[ManualScenario][number];
export type AutomatedScenarioCheckId =
  (typeof AUTOMATED_SCENARIO_CHECK_IDS)[AutomatedScenario][number];
export type UploadMode = 'success' | 'error' | 'delay';

export interface EnvironmentTelemetry {
  userAgent: string;
  timezone: string;
  viewport: { width: number; height: number; devicePixelRatio: number };
  mediaQueries: Record<string, boolean>;
  coarsePointer: boolean;
}

export interface FileUploadManualObservation {
  scenario: ManualScenario;
  locale: Locale;
  revision: string;
  deploymentUrl: string;
  executedAt: string;
  timezone: string;
  os: { name: string; version: string; build: string };
  browser: { name: string; version: string };
  assistiveTechnology: { name: string; version: string };
  inputMethods: string[];
  viewport: { width: number; height: number; devicePixelRatio: number };
  mediaQueries: Record<string, boolean>;
  expected: string;
  actual: string;
  checkAttestations: Record<string, boolean>;
  result: 'PASS' | 'FAIL';
  reviewer: { name: string; approval: 'approved' | 'changes-requested' };
  artifactPaths: string[];
  findingUrls: string[];
}

export interface EvidenceEntry {
  path: string;
  bytes: number;
  mediaType: string;
  sha256: string;
}

export interface EvidenceManifest {
  schemaVersion: 1;
  kind: 'manual' | 'automation';
  revision: string;
  deploymentUrl: string;
  createdAt: string;
  entries: EvidenceEntry[];
}

export interface FileUploadAutomatedResult {
  scenario: AutomatedScenario;
  locale: Locale;
  revision: string;
  deploymentUrl: string;
  executedAt: string;
  runs: Array<{
    engine: 'chromium' | 'firefox' | 'webkit';
    viewport: { width: number; height: number; devicePixelRatio: number };
    mediaQueries: Record<string, boolean>;
    checks: Record<string, boolean>;
    artifactPaths: string[];
  }>;
  result: 'PASS' | 'FAIL';
}

type ObservationField = keyof typeof MESSAGES.en.validation;

export interface ObservationError {
  field: ObservationField;
  message: string;
}

export type ObservationValidation =
  | { ok: true; value: FileUploadManualObservation }
  | { ok: false; errors: readonly ObservationError[] };

export interface EvidenceExpectation {
  revision?: string;
  deploymentUrl?: string;
}

export type EvidenceValidation<T> =
  { ok: true; value: T } | { ok: false; errors: readonly string[] };

const gitShaPattern = /^[a-f0-9]{40}$/;
const sha256Pattern = /^[a-f0-9]{64}$/;
const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const immutableDeploymentHostPattern = /^[a-f0-9]{8}\.lyra-ds-docs\.pages\.dev$/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'pt-BR';
}

function isManualScenario(value: unknown): value is ManualScenario {
  return value === 'DF-FU-M01' || value === 'DF-FU-M02';
}

function isAutomatedScenario(value: unknown): value is AutomatedScenario {
  return value === 'DF-FU-17' || value === 'DF-FU-18';
}

function normalizedText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizedTextArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const normalized = value.map(normalizedText);
  return normalized.every((entry): entry is string => entry !== undefined) ? normalized : undefined;
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function deploymentUrlFromLocation(location: Pick<Location, 'origin' | 'pathname'>): string {
  return new URL(location.pathname, location.origin).href;
}

export function isImmutableDeploymentRoute(value: string, locale: Locale): boolean {
  try {
    const url = new URL(value);
    const expectedPathname = `/${locale}/file-upload-evidence/`;
    return (
      url.protocol === 'https:' &&
      url.username === '' &&
      url.password === '' &&
      url.port === '' &&
      url.search === '' &&
      url.hash === '' &&
      immutableDeploymentHostPattern.test(url.hostname) &&
      url.pathname === expectedPathname &&
      value === `https://${url.hostname}${expectedPathname}`
    );
  } catch {
    return false;
  }
}

function isImmutableDeploymentUrl(value: string): boolean {
  return isImmutableDeploymentRoute(value, 'en') || isImmutableDeploymentRoute(value, 'pt-BR');
}

function isValidIsoTimestamp(value: string): boolean {
  if (!isoTimestampPattern.test(value)) return false;
  const timestamp = new Date(value);
  return !Number.isNaN(timestamp.getTime()) && timestamp.toISOString() === value;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && isPositiveNumber(value);
}

function normalizedBooleanRecord(value: unknown): Record<string, boolean> | undefined {
  if (!isRecord(value)) return undefined;
  const normalized: Record<string, boolean> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== 'boolean') return undefined;
    normalized[key] = entry;
  }
  return normalized;
}

function normalizedExactBooleanRecord(
  value: unknown,
  requiredKeys: readonly string[],
): Record<string, boolean> | undefined {
  const normalized = normalizedBooleanRecord(value);
  if (normalized === undefined) return undefined;
  const actualKeys = Object.keys(normalized).sort();
  const expectedKeys = [...requiredKeys].sort();
  return actualKeys.length === expectedKeys.length &&
    expectedKeys.every((key, index) => key === actualKeys[index])
    ? normalized
    : undefined;
}

function normalizedViewport(
  value: unknown,
): { width: number; height: number; devicePixelRatio: number } | undefined {
  if (!isRecord(value)) return undefined;
  const { width, height, devicePixelRatio } = value;
  return isPositiveNumber(width) && isPositiveNumber(height) && isPositiveNumber(devicePixelRatio)
    ? { width, height, devicePixelRatio }
    : undefined;
}

function isCanonicalArchivePath(value: string): boolean {
  if (
    value.length === 0 ||
    value !== value.trim() ||
    value !== value.normalize('NFC') ||
    value.startsWith('/') ||
    value.endsWith('/') ||
    value.includes('\\') ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    return false;
  }
  const segments = value.split('/');
  return segments.every((segment) => segment.length > 0 && segment !== '.' && segment !== '..');
}

function uniqueCanonicalPaths(paths: readonly string[]): boolean {
  const normalized = paths.map((path) => path.normalize('NFC').toLocaleLowerCase('en-US'));
  return paths.every(isCanonicalArchivePath) && new Set(normalized).size === normalized.length;
}

function isManualArtifactPath(path: string, scenario: ManualScenario): boolean {
  const segments = path.split('/');
  return (
    segments.length === 3 &&
    segments[0] === 'artifacts' &&
    segments[1] === scenario &&
    segments[2] !== undefined &&
    segments[2].length > 0
  );
}

function isObservationResult(value: unknown): value is FileUploadManualObservation['result'] {
  return value === 'PASS' || value === 'FAIL';
}

function isReviewerApproval(
  value: unknown,
): value is FileUploadManualObservation['reviewer']['approval'] {
  return value === 'approved' || value === 'changes-requested';
}

export function validateObservation(value: unknown): ObservationValidation {
  const source = isRecord(value) ? value : {};
  const inputLocale = isLocale(source.locale) ? source.locale : undefined;
  const locale = inputLocale ?? 'pt-BR';
  const errors: ObservationError[] = [];
  const fail = (field: ObservationField): void => {
    if (!errors.some((error) => error.field === field)) {
      errors.push({ field, message: MESSAGES[locale].validation[field] });
    }
  };
  const text = (field: ObservationField): string | undefined => {
    const result = normalizedText(source[field]);
    if (result === undefined) fail(field);
    return result;
  };

  const scenario = isManualScenario(source.scenario) ? source.scenario : undefined;
  if (scenario === undefined) fail('scenario');
  if (inputLocale === undefined) fail('locale');

  const revision = text('revision');
  if (revision !== undefined && !gitShaPattern.test(revision)) fail('revision');
  const deploymentUrl = text('deploymentUrl');
  if (deploymentUrl !== undefined && !isImmutableDeploymentRoute(deploymentUrl, locale)) {
    fail('deploymentUrl');
  }
  const executedAt = text('executedAt');
  if (executedAt !== undefined && !isValidIsoTimestamp(executedAt)) fail('executedAt');
  const timezone = text('timezone');

  const os = isRecord(source.os) ? source.os : {};
  const osName = normalizedText(os.name);
  const osVersion = normalizedText(os.version);
  const osBuild = normalizedText(os.build);
  if (osName === undefined) fail('os.name');
  if (osVersion === undefined) fail('os.version');
  if (osBuild === undefined) fail('os.build');

  const browser = isRecord(source.browser) ? source.browser : {};
  const browserName = normalizedText(browser.name);
  const browserVersion = normalizedText(browser.version);
  if (browserName === undefined) fail('browser.name');
  if (browserVersion === undefined) fail('browser.version');

  const assistiveTechnology = isRecord(source.assistiveTechnology)
    ? {
        name: normalizedText(source.assistiveTechnology.name),
        version: normalizedText(source.assistiveTechnology.version),
      }
    : undefined;
  if (assistiveTechnology === undefined) {
    fail('assistiveTechnology');
  } else {
    if (assistiveTechnology.name === undefined) fail('assistiveTechnology.name');
    if (assistiveTechnology.version === undefined) fail('assistiveTechnology.version');
  }

  const inputMethods = normalizedTextArray(source.inputMethods);
  if (inputMethods === undefined || inputMethods.length === 0) fail('inputMethods');
  const viewport = normalizedViewport(source.viewport);
  if (viewport === undefined) fail('viewport');
  const mediaQueries = normalizedBooleanRecord(source.mediaQueries);
  if (mediaQueries === undefined) fail('mediaQueries');

  const expected = text('expected');
  const actual = text('actual');
  const result = isObservationResult(source.result) ? source.result : undefined;
  if (result === undefined) fail('result');
  const checkAttestations =
    scenario === undefined
      ? undefined
      : normalizedExactBooleanRecord(source.checkAttestations, manualScenarioCheckIds[scenario]);
  if (
    checkAttestations === undefined ||
    (result === 'PASS' && Object.values(checkAttestations).some((entry) => !entry))
  ) {
    fail('checkAttestations');
  }

  const reviewer = isRecord(source.reviewer) ? source.reviewer : {};
  const reviewerName = normalizedText(reviewer.name);
  const approval = isReviewerApproval(reviewer.approval) ? reviewer.approval : undefined;
  if (reviewerName === undefined) fail('reviewer.name');
  if (
    approval === undefined ||
    (result === 'PASS' && approval !== 'approved') ||
    (result === 'FAIL' && approval !== 'changes-requested')
  ) {
    fail('reviewer.approval');
  }

  const artifactPaths = normalizedTextArray(source.artifactPaths);
  if (
    artifactPaths === undefined ||
    artifactPaths.length < 1 ||
    artifactPaths.length > MAX_MANUAL_FILES ||
    scenario === undefined ||
    !uniqueCanonicalPaths(artifactPaths) ||
    artifactPaths.some((path) => !isManualArtifactPath(path, scenario))
  ) {
    fail('artifactPaths');
  }
  const findingUrls = normalizedTextArray(source.findingUrls);
  if (findingUrls === undefined || findingUrls.some((url) => !isHttpsUrl(url))) fail('findingUrls');

  if (
    errors.length > 0 ||
    scenario === undefined ||
    inputLocale === undefined ||
    revision === undefined ||
    deploymentUrl === undefined ||
    executedAt === undefined ||
    timezone === undefined ||
    osName === undefined ||
    osVersion === undefined ||
    osBuild === undefined ||
    browserName === undefined ||
    browserVersion === undefined ||
    assistiveTechnology?.name === undefined ||
    assistiveTechnology.version === undefined ||
    inputMethods === undefined ||
    viewport === undefined ||
    mediaQueries === undefined ||
    expected === undefined ||
    actual === undefined ||
    checkAttestations === undefined ||
    result === undefined ||
    reviewerName === undefined ||
    approval === undefined ||
    artifactPaths === undefined ||
    findingUrls === undefined
  ) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      scenario,
      locale: inputLocale,
      revision,
      deploymentUrl,
      executedAt,
      timezone,
      os: { name: osName, version: osVersion, build: osBuild },
      browser: { name: browserName, version: browserVersion },
      assistiveTechnology: {
        name: assistiveTechnology.name,
        version: assistiveTechnology.version,
      },
      inputMethods,
      viewport,
      mediaQueries,
      expected,
      actual,
      checkAttestations,
      result,
      reviewer: { name: reviewerName, approval },
      artifactPaths,
      findingUrls,
    },
  };
}

function manifestMediaTypeIsValid(kind: EvidenceManifest['kind'], entry: EvidenceEntry): boolean {
  if (!evidenceEntryMediaTypes.has(entry.mediaType)) return false;
  if (kind === 'manual') {
    if (/^manual\/DF-FU-M0[12]\.json$/u.test(entry.path)) {
      return entry.mediaType === 'application/json';
    }
    if (/^artifacts\/DF-FU-M0[12]\/[^/]+$/u.test(entry.path)) {
      return manualMediaTypes.has(entry.mediaType);
    }
    return false;
  }
  if (/^automation\/DF-FU-(17|18)\.json$/u.test(entry.path)) {
    return entry.mediaType === 'application/json';
  }
  if (!/^artifacts\/DF-FU-(17|18)\/(chromium|firefox|webkit)\/[^/]+$/u.test(entry.path)) {
    return false;
  }
  if (entry.path.endsWith('.json')) return entry.mediaType === 'application/json';
  if (entry.path.endsWith('.png')) return entry.mediaType === 'image/png';
  if (entry.path.endsWith('.zip')) return entry.mediaType === 'application/zip';
  if (entry.path.endsWith('.webm')) return entry.mediaType === 'video/webm';
  return false;
}

export function validateManifest(
  value: unknown,
  expected: EvidenceExpectation = {},
): EvidenceValidation<EvidenceManifest> {
  const source = isRecord(value) ? value : {};
  const errors: string[] = [];
  const schemaVersion =
    source.schemaVersion === EVIDENCE_SCHEMA_VERSION ? EVIDENCE_SCHEMA_VERSION : undefined;
  const kind = source.kind === 'manual' || source.kind === 'automation' ? source.kind : undefined;
  const revision =
    typeof source.revision === 'string' && gitShaPattern.test(source.revision)
      ? source.revision
      : undefined;
  const deploymentUrl =
    typeof source.deploymentUrl === 'string' && isImmutableDeploymentUrl(source.deploymentUrl)
      ? source.deploymentUrl
      : undefined;
  const createdAt =
    typeof source.createdAt === 'string' && isValidIsoTimestamp(source.createdAt)
      ? source.createdAt
      : undefined;
  if (schemaVersion === undefined) errors.push('schemaVersion');
  if (kind === undefined) errors.push('kind');
  if (revision === undefined || (expected.revision !== undefined && revision !== expected.revision))
    errors.push('revision');
  if (
    deploymentUrl === undefined ||
    (expected.deploymentUrl !== undefined && deploymentUrl !== expected.deploymentUrl)
  )
    errors.push('deploymentUrl');
  if (createdAt === undefined) errors.push('createdAt');

  const entries: EvidenceEntry[] = [];
  if (!Array.isArray(source.entries) || source.entries.length === 0 || kind === undefined) {
    errors.push('entries');
  } else {
    for (const candidate of source.entries) {
      if (!isRecord(candidate)) {
        errors.push('entries');
        continue;
      }
      const entry = {
        path: candidate.path,
        bytes: candidate.bytes,
        mediaType: candidate.mediaType,
        sha256: candidate.sha256,
      };
      if (
        typeof entry.path !== 'string' ||
        !isCanonicalArchivePath(entry.path) ||
        !isPositiveInteger(entry.bytes) ||
        typeof entry.mediaType !== 'string' ||
        typeof entry.sha256 !== 'string' ||
        !sha256Pattern.test(entry.sha256)
      ) {
        errors.push('entries');
        continue;
      }
      const normalizedEntry: EvidenceEntry = {
        path: entry.path,
        bytes: entry.bytes,
        mediaType: entry.mediaType,
        sha256: entry.sha256,
      };
      if (!manifestMediaTypeIsValid(kind, normalizedEntry)) errors.push('entries');
      entries.push(normalizedEntry);
    }
  }

  if (!uniqueCanonicalPaths(entries.map((entry) => entry.path))) errors.push('entries');
  if (entries.reduce((sum, entry) => sum + entry.bytes, 0) > MAX_ARCHIVE_EXPANDED_BYTES) {
    errors.push('entries');
  }
  if (kind === 'manual') {
    for (const scenario of ['DF-FU-M01', 'DF-FU-M02'] as const) {
      const artifacts = entries.filter((entry) => entry.path.startsWith(`artifacts/${scenario}/`));
      if (
        artifacts.length > MAX_MANUAL_FILES ||
        artifacts.some((entry) => entry.bytes > MAX_MANUAL_FILE_BYTES) ||
        artifacts.reduce((sum, entry) => sum + entry.bytes, 0) > MAX_MANUAL_SCENARIO_BYTES
      ) {
        errors.push('entries');
      }
    }
  }

  if (
    errors.length > 0 ||
    schemaVersion === undefined ||
    kind === undefined ||
    revision === undefined ||
    deploymentUrl === undefined ||
    createdAt === undefined
  ) {
    return { ok: false, errors: [...new Set(errors)] };
  }
  return {
    ok: true,
    value: { schemaVersion, kind, revision, deploymentUrl, createdAt, entries },
  };
}

function isEngine(value: unknown): value is 'chromium' | 'firefox' | 'webkit' {
  return value === 'chromium' || value === 'firefox' || value === 'webkit';
}

function requiredArtifactPaths(
  scenario: AutomatedScenario,
  engine: 'chromium' | 'firefox' | 'webkit',
): string[] {
  return ['final.png', 'run.webm', 'trace.zip', 'events.json'].map(
    (fileName) => `artifacts/${scenario}/${engine}/${fileName}`,
  );
}

export function validateAutomatedResult(
  value: unknown,
  expected: EvidenceExpectation = {},
): EvidenceValidation<FileUploadAutomatedResult> {
  const source = isRecord(value) ? value : {};
  const errors: string[] = [];
  const scenario = isAutomatedScenario(source.scenario) ? source.scenario : undefined;
  const locale = isLocale(source.locale) ? source.locale : undefined;
  const revision =
    typeof source.revision === 'string' && gitShaPattern.test(source.revision)
      ? source.revision
      : undefined;
  const deploymentUrl =
    typeof source.deploymentUrl === 'string' &&
    locale !== undefined &&
    isImmutableDeploymentRoute(source.deploymentUrl, locale)
      ? source.deploymentUrl
      : undefined;
  const executedAt =
    typeof source.executedAt === 'string' && isValidIsoTimestamp(source.executedAt)
      ? source.executedAt
      : undefined;
  const result = source.result === 'PASS' || source.result === 'FAIL' ? source.result : undefined;
  if (scenario === undefined) errors.push('scenario');
  if (locale === undefined) errors.push('locale');
  if (revision === undefined || (expected.revision !== undefined && revision !== expected.revision))
    errors.push('revision');
  if (
    deploymentUrl === undefined ||
    (expected.deploymentUrl !== undefined && deploymentUrl !== expected.deploymentUrl)
  )
    errors.push('deploymentUrl');
  if (executedAt === undefined) errors.push('executedAt');
  if (result === undefined) errors.push('result');

  const runs: FileUploadAutomatedResult['runs'] = [];
  if (!Array.isArray(source.runs) || scenario === undefined) {
    errors.push('runs');
  } else {
    for (const candidate of source.runs) {
      if (!isRecord(candidate) || !isEngine(candidate.engine)) {
        errors.push('runs');
        continue;
      }
      const viewport = normalizedViewport(candidate.viewport);
      const mediaQueries = normalizedBooleanRecord(candidate.mediaQueries);
      const checks = normalizedExactBooleanRecord(
        candidate.checks,
        automatedScenarioCheckIds[scenario],
      );
      const artifactPaths =
        Array.isArray(candidate.artifactPaths) &&
        candidate.artifactPaths.every((path): path is string => typeof path === 'string')
          ? [...candidate.artifactPaths]
          : undefined;
      const expectedPaths = requiredArtifactPaths(scenario, candidate.engine).sort();
      const actualPaths = artifactPaths === undefined ? [] : [...artifactPaths].sort();
      if (
        viewport === undefined ||
        mediaQueries === undefined ||
        Object.keys(mediaQueries).length === 0 ||
        checks === undefined ||
        artifactPaths === undefined ||
        !uniqueCanonicalPaths(artifactPaths) ||
        actualPaths.length !== expectedPaths.length ||
        !expectedPaths.every((path, index) => path === actualPaths[index])
      ) {
        errors.push('runs');
        continue;
      }
      runs.push({
        engine: candidate.engine,
        viewport,
        mediaQueries,
        checks,
        artifactPaths,
      });
    }
  }

  if (scenario !== undefined) {
    const requiredEngines =
      scenario === 'DF-FU-17' ? ['chromium', 'firefox', 'webkit'] : ['chromium'];
    const actualEngines = runs.map((run) => run.engine).sort();
    if (
      actualEngines.length !== requiredEngines.length ||
      ![...requiredEngines].sort().every((engine, index) => engine === actualEngines[index])
    ) {
      errors.push('runs');
    }
    if (scenario === 'DF-FU-17') {
      if (runs.some((run) => run.viewport.width !== 320)) errors.push('runs');
      const chromium = runs.find((run) => run.engine === 'chromium');
      if (
        chromium === undefined ||
        (chromium.mediaQueries['(pointer: coarse)'] !== true &&
          chromium.mediaQueries['(any-pointer: coarse)'] !== true)
      ) {
        errors.push('runs');
      }
    }
  }
  if (!uniqueCanonicalPaths(runs.flatMap((run) => run.artifactPaths))) errors.push('runs');
  const allChecksPassed =
    runs.length > 0 && runs.every((run) => Object.values(run.checks).every(Boolean));
  if (result !== undefined && result !== (allChecksPassed ? 'PASS' : 'FAIL')) errors.push('result');

  if (
    errors.length > 0 ||
    scenario === undefined ||
    locale === undefined ||
    revision === undefined ||
    deploymentUrl === undefined ||
    executedAt === undefined ||
    result === undefined
  ) {
    return { ok: false, errors: [...new Set(errors)] };
  }
  return {
    ok: true,
    value: { scenario, locale, revision, deploymentUrl, executedAt, runs, result },
  };
}
