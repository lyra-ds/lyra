import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import bladeApi from '../../../tools/blade-api/api.json';
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

  it('publishes all 71 released Blade entries at their declared behavioral level', () => {
    const rows = new Map(getSupportMatrixRows().map((row) => [row.slug, row]));
    const bladeEntries = components.filter((entry) => entry.stacks.includes('blade'));

    expect(bladeEntries).toHaveLength(71);
    for (const entry of bladeEntries) {
      const declaredBehavior = (['html', 'alpine'] as const).filter((stack) =>
        entry.stacks.includes(stack),
      );
      expect(declaredBehavior, entry.slug).toHaveLength(1);
      expect(rows.get(entry.slug)?.stacks.blade.level).toBe(
        declaredBehavior[0] === 'html' ? 'css' : 'alpine-enhanced',
      );
    }
  });

  it('maps static and interactive Blade entries to CSS and Alpine-enhanced support', () => {
    const rows = new Map(getSupportMatrixRows().map((row) => [row.slug, row]));

    expect(rows.get('button')?.stacks.blade).toMatchObject({
      level: 'css',
      evidence: {
        href: '#blade-timing',
        reevaluationOwnerKey: 'supportOwnerBladeMaintainers',
        statusKey: 'supportEvidenceBladeReleased',
      },
    });
    expect(rows.get('dialog')?.stacks.blade).toMatchObject({
      level: 'alpine-enhanced',
      evidence: {
        href: '#blade-timing',
        reevaluationOwnerKey: 'supportOwnerBladeMaintainers',
        statusKey: 'supportEvidenceBladeReleased',
      },
    });
  });

  it('keeps components absent from Blade unsupported with gap metadata', () => {
    const themeProvider = getSupportMatrixRows().find((row) => row.slug === 'theme-provider');

    expect(themeProvider?.stacks.blade).toMatchObject({
      level: 'unsupported',
      gap: {
        evidenceHref: '#blade-timing',
        reevaluationOwnerKey: 'supportOwnerBladeMaintainers',
        reasonKey: 'absenceBladeThemeProvider',
      },
    });
  });

  it('does not claim a released Blade component missing from the v0.10.0 API snapshot', () => {
    expect(bladeApi.version).toBe('0.10.0');
    const apiSlugs = new Set(bladeApi.components.map((component) => component.slug));
    const supportedBladeSlugs = getSupportMatrixRows()
      .filter((row) => row.stacks.blade.level !== 'unsupported')
      .map((row) => row.slug);

    expect(supportedBladeSlugs.filter((slug) => !apiSlugs.has(slug))).toEqual([]);
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
      readFileSync(
        new URL(`../content/docs/${locale}/guides/support.mdx`, import.meta.url),
        'utf8',
      ),
    );

    for (const href of evidenceHrefs) {
      for (const guide of guides) {
        expect(guide).toContain(`id="${href.slice(1)}"`);
      }
    }
  });
});
