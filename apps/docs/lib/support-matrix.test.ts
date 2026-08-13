import { describe, expect, it } from 'vitest';
import { components } from './components';
import { getSupportMatrixRows, supportLevels } from './support-matrix';

describe('public support matrix', () => {
  it('contains every documented component exactly once', () => {
    const rows = getSupportMatrixRows();
    expect(rows.map((row) => row.slug)).toHaveLength(components.length);
    expect(new Set(rows.map((row) => row.slug)).size).toBe(components.length);
  });

  it('uses only the normative support levels', () => {
    for (const row of getSupportMatrixRows()) {
      for (const cell of Object.values(row.stacks)) {
        expect(supportLevels).toContain(cell.level);
      }
    }
  });

  it('documents every unsupported adapter with its contract gap and evidence status', () => {
    for (const row of getSupportMatrixRows()) {
      for (const cell of Object.values(row.stacks)) {
        if (cell.level !== 'unsupported') continue;

        expect(cell.gap).toMatchObject({
          evidenceHref: expect.any(String),
          evidenceStatusKey: expect.any(String),
          fallbackKey: expect.any(String),
          missingCapabilityKey: expect.any(String),
          reasonKey: expect.any(String),
          reevaluationOwnerKey: expect.any(String),
          userImpactKey: expect.any(String),
        });
      }
    }
  });

  it('shows the current evidence status for every claimed adapter level', () => {
    for (const row of getSupportMatrixRows()) {
      for (const cell of Object.values(row.stacks)) {
        if (cell.level === 'unsupported') continue;

        expect(cell.evidence).toMatchObject({
          href: expect.any(String),
          reevaluationOwnerKey: expect.any(String),
          statusKey: expect.any(String),
        });
      }
    }
  });
});
