import { describe, expect, it } from 'vitest';

import { captureTelemetry, m03Eligibility } from './telemetry';

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

const completeM03Checks = [
  'no-horizontal-overflow',
  'long-name-content-preserves-identity-and-actions',
  'active-replacement-rejected-and-announced',
  'recovery-controls-and-focus-recovery-exercised',
];

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

describe('m03Eligibility', () => {
  const telemetry = captureTelemetry(windowLike, navigatorLike);

  it('accepts only a truthfully complete M03 environment record', () => {
    expect(m03Eligibility(telemetry, ['touch', 'keyboard'], completeM03Checks)).toEqual({
      eligible: true,
      reasons: [],
    });
  });

  it('rejects a near-miss viewport without accepting a harness override', () => {
    expect(
      m03Eligibility(
        { ...telemetry, viewport: { ...telemetry.viewport, width: 321 }, coarsePointer: true },
        ['touch', 'keyboard'],
        completeM03Checks,
      ),
    ).toEqual({ eligible: false, reasons: ['viewport-width'] });
  });

  it('requires coarse pointer, both physical input methods, and every manual check', () => {
    expect(
      m03Eligibility(
        { ...telemetry, coarsePointer: false },
        ['keyboard'],
        completeM03Checks.slice(0, -1),
      ),
    ).toEqual({
      eligible: false,
      reasons: ['coarse-pointer', 'touch-input', 'manual-checks'],
    });
  });
});
