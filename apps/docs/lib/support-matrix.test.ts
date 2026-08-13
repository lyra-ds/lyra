import { readFileSync } from 'node:fs';
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

  it('links every evidence status to a stable anchor in both support guides', () => {
    const evidenceHrefs = new Set(
      getSupportMatrixRows().flatMap((row) =>
        Object.values(row.stacks).map((cell) =>
          cell.level === 'unsupported' ? cell.gap.evidenceHref : cell.evidence.href,
        ),
      ),
    );
    const guides = ['en', 'pt-BR'].map((locale) =>
      readFileSync(new URL(`../content/docs/${locale}/guides/support.mdx`, import.meta.url), 'utf8'),
    );

    for (const href of evidenceHrefs) {
      for (const guide of guides) {
        expect(guide).toContain(`id="${href.slice(1)}"`);
      }
    }
  });
});
