import { SCENARIO_CHECK_IDS, type EnvironmentTelemetry } from './contracts';

export interface WindowLike {
  readonly innerWidth: number;
  readonly innerHeight: number;
  readonly devicePixelRatio: number;
  matchMedia(query: string): { readonly matches: boolean };
}

export interface NavigatorLike {
  readonly userAgent: string;
}

const mediaQueries = [
  '(pointer: coarse)',
  '(any-pointer: coarse)',
  '(hover: none)',
  '(any-hover: none)',
];

export function captureTelemetry(
  windowLike: WindowLike,
  navigatorLike: NavigatorLike,
): EnvironmentTelemetry {
  const evaluatedMediaQueries = Object.fromEntries(
    mediaQueries.map((query) => [query, windowLike.matchMedia(query).matches]),
  );

  return {
    userAgent: navigatorLike.userAgent,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    viewport: {
      width: windowLike.innerWidth,
      height: windowLike.innerHeight,
      devicePixelRatio: windowLike.devicePixelRatio,
    },
    mediaQueries: evaluatedMediaQueries,
    coarsePointer:
      evaluatedMediaQueries['(pointer: coarse)'] === true ||
      evaluatedMediaQueries['(any-pointer: coarse)'] === true,
  };
}

export function m03Eligibility(
  telemetry: EnvironmentTelemetry,
  inputMethods: readonly string[],
  checks: readonly string[],
): { eligible: boolean; reasons: readonly string[] } {
  const reasons: string[] = [];
  const hasCoarsePointerMatch =
    telemetry.coarsePointer &&
    (telemetry.mediaQueries['(pointer: coarse)'] === true ||
      telemetry.mediaQueries['(any-pointer: coarse)'] === true);

  if (telemetry.viewport.width !== 320) reasons.push('viewport-width');
  if (!hasCoarsePointerMatch) reasons.push('coarse-pointer');
  if (!inputMethods.includes('touch')) reasons.push('touch-input');
  if (!inputMethods.includes('keyboard')) reasons.push('keyboard-input');
  if (!SCENARIO_CHECK_IDS['DF-FU-M03'].every((check) => checks.includes(check))) {
    reasons.push('manual-checks');
  }

  return { eligible: reasons.length === 0, reasons };
}
