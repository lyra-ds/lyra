import { describe, expect, it } from 'vitest';

import { captureTelemetry } from './telemetry';

const windowLike = {
  innerWidth: 320,
  innerHeight: 740,
  devicePixelRatio: 3,
  matchMedia: (query: string) => ({
    matches: [
      '(pointer: coarse)',
      '(any-pointer: coarse)',
      '(hover: none)',
      '(any-hover: none)',
    ].includes(query),
  }),
};

const navigatorLike = { userAgent: 'Mozilla/5.0 EvidenceHarness/1.0' };

describe('captureTelemetry', () => {
  it('captures real viewport, DPR, media-query, timezone, and supporting user-agent values', () => {
    expect(captureTelemetry(windowLike, navigatorLike)).toMatchObject({
      userAgent: 'Mozilla/5.0 EvidenceHarness/1.0',
      timezone: expect.any(String),
      viewport: { width: 320, height: 740, devicePixelRatio: 3 },
      mediaQueries: {
        '(pointer: coarse)': true,
        '(any-pointer: coarse)': true,
        '(hover: none)': true,
        '(any-hover: none)': true,
      },
      coarsePointer: true,
    });
  });
});
