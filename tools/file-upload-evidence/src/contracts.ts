import { MESSAGES } from './messages';

export type Locale = 'pt-BR' | 'en';

export type ManualScenario = 'DF-FU-M01' | 'DF-FU-M02' | 'DF-FU-M03' | 'DF-FU-M04';

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
  assistiveTechnology: { name: string; version: string } | null;
  inputMethods: string[];
  viewport: { width: number; height: number; devicePixelRatio: number };
  mediaQueries: Record<string, boolean>;
  expected: string;
  actual: string;
  result: 'PASS' | 'FAIL';
  reviewer: { name: string; approval: 'approved' | 'changes-requested' };
  artifactUrls: string[];
  findingUrls: string[];
}

type ObservationField = keyof typeof MESSAGES.en.validation;

export interface ObservationError {
  field: ObservationField;
  message: string;
}

export type ObservationValidation =
  | { ok: true; value: FileUploadManualObservation }
  | { ok: false; errors: readonly ObservationError[] };

const shaPattern = /^[a-f0-9]{40}$/;
const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'pt-BR';
}

function isManualScenario(value: unknown): value is ManualScenario {
  return (
    value === 'DF-FU-M01' || value === 'DF-FU-M02' || value === 'DF-FU-M03' || value === 'DF-FU-M04'
  );
}

function normalizedText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizedTextArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

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

function isValidIsoTimestamp(value: string): boolean {
  if (!isoTimestampPattern.test(value)) {
    return false;
  }

  const timestamp = new Date(value);
  return !Number.isNaN(timestamp.getTime()) && timestamp.toISOString() === value;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function normalizedBooleanRecord(value: unknown): Record<string, boolean> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const normalized: Record<string, boolean> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== 'boolean') {
      return undefined;
    }
    normalized[key] = entry;
  }
  return normalized;
}

function requiresAssistiveTechnology(scenario: ManualScenario): boolean {
  return scenario === 'DF-FU-M01' || scenario === 'DF-FU-M02';
}

function normalizedViewport(
  value: unknown,
): { width: number; height: number; devicePixelRatio: number } | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const { width, height, devicePixelRatio } = value;
  return isPositiveNumber(width) && isPositiveNumber(height) && isPositiveNumber(devicePixelRatio)
    ? { width, height, devicePixelRatio }
    : undefined;
}

function normalizedAssistiveTechnology(
  value: unknown,
  fail: (field: ObservationField) => void,
): FileUploadManualObservation['assistiveTechnology'] | undefined {
  if (value === null) {
    return null;
  }
  if (!isRecord(value)) {
    fail('assistiveTechnology');
    return undefined;
  }

  const name = normalizedText(value.name);
  const version = normalizedText(value.version);
  if (name === undefined) fail('assistiveTechnology.name');
  if (version === undefined) fail('assistiveTechnology.version');
  return name !== undefined && version !== undefined ? { name, version } : undefined;
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
    errors.push({ field, message: MESSAGES[locale].validation[field] });
  };
  const text = (field: ObservationField): string | undefined => {
    const normalized = normalizedText(source[field]);
    if (normalized === undefined) {
      fail(field);
    }
    return normalized;
  };

  const scenario = isManualScenario(source.scenario) ? source.scenario : undefined;
  if (scenario === undefined) {
    fail('scenario');
  }
  if (inputLocale === undefined) {
    fail('locale');
  }

  const revision = text('revision');
  if (revision !== undefined && !shaPattern.test(revision)) {
    fail('revision');
  }
  const deploymentUrl = text('deploymentUrl');
  if (deploymentUrl !== undefined && !isHttpsUrl(deploymentUrl)) {
    fail('deploymentUrl');
  }
  const executedAt = text('executedAt');
  if (executedAt !== undefined && !isValidIsoTimestamp(executedAt)) {
    fail('executedAt');
  }
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

  const assistiveTechnology = normalizedAssistiveTechnology(source.assistiveTechnology, fail);
  if (assistiveTechnology === null && scenario !== undefined) {
    if (requiresAssistiveTechnology(scenario)) {
      fail('assistiveTechnology');
    } else if (source.noAssistiveTechnologyConfirmed !== true) {
      fail('noAssistiveTechnologyConfirmation');
    }
  }

  const inputMethods = normalizedTextArray(source.inputMethods);
  if (inputMethods === undefined || inputMethods.length === 0) fail('inputMethods');

  const viewport = normalizedViewport(source.viewport);
  if (viewport === undefined) {
    fail('viewport');
  }

  const mediaQueries = normalizedBooleanRecord(source.mediaQueries);
  if (mediaQueries === undefined) fail('mediaQueries');

  const expected = text('expected');
  const actual = text('actual');
  const result = isObservationResult(source.result) ? source.result : undefined;
  if (result === undefined) fail('result');

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

  const artifactUrls = normalizedTextArray(source.artifactUrls);
  if (
    artifactUrls === undefined ||
    artifactUrls.length === 0 ||
    artifactUrls.some((url) => !isHttpsUrl(url))
  ) {
    fail('artifactUrls');
  }
  const findingUrls = normalizedTextArray(source.findingUrls);
  if (findingUrls === undefined || findingUrls.some((url) => !isHttpsUrl(url))) {
    fail('findingUrls');
  }

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
    assistiveTechnology === undefined ||
    inputMethods === undefined ||
    inputMethods.length === 0 ||
    viewport === undefined ||
    mediaQueries === undefined ||
    expected === undefined ||
    actual === undefined ||
    result === undefined ||
    reviewerName === undefined ||
    approval === undefined ||
    artifactUrls === undefined ||
    artifactUrls.length === 0 ||
    findingUrls === undefined
  ) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      scenario,
      locale,
      revision,
      deploymentUrl,
      executedAt,
      timezone,
      os: { name: osName, version: osVersion, build: osBuild },
      browser: { name: browserName, version: browserVersion },
      assistiveTechnology,
      inputMethods,
      viewport,
      mediaQueries,
      expected,
      actual,
      result,
      reviewer: { name: reviewerName, approval },
      artifactUrls,
      findingUrls,
    },
  };
}
