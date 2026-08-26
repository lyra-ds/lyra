import type { EnvironmentTelemetry } from './contracts';

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
