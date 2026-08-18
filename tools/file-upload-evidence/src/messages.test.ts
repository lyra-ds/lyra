import { describe, expect, it } from 'vitest';

import { MESSAGES } from './messages';

function keyPaths(value: unknown, prefix = ''): readonly string[] {
  if (typeof value === 'string') {
    return [prefix];
  }
  if (value === null || typeof value !== 'object') {
    return [];
  }

  return Object.entries(value).flatMap(([key, child]) => keyPaths(child, `${prefix}.${key}`));
}

function values(value: unknown): readonly string[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (value === null || typeof value !== 'object') {
    return [];
  }

  return Object.values(value).flatMap(values);
}

describe('MESSAGES', () => {
  it('keeps the English and Brazilian Portuguese message shapes synchronized', () => {
    expect(keyPaths(MESSAGES.en)).toEqual(keyPaths(MESSAGES['pt-BR']));
  });

  it('provides non-blank copy for every visible and exported message', () => {
    for (const locale of [MESSAGES.en, MESSAGES['pt-BR']]) {
      expect(values(locale).every((message) => message.trim().length > 0)).toBe(true);
    }
  });

  it('keeps localized scenario labels, endpoint errors, validation errors, instructions, statuses, and announcements in their route language', () => {
    expect(MESSAGES.en).toMatchObject({
      scenarios: { 'DF-FU-M01': expect.stringContaining('Windows') },
      endpoint: { invalidMode: expect.stringContaining('upload mode') },
      validation: {
        revision: expect.stringContaining('Git revision'),
        checkAttestations: 'Complete the exact guided checklist for this scenario.',
      },
      instructions: { m03: expect.stringContaining('320 CSS pixels') },
      status: { pass: 'PASS' },
      announcements: { replacementRejected: expect.stringContaining('rejected') },
    });
    expect(MESSAGES['pt-BR']).toMatchObject({
      scenarios: { 'DF-FU-M01': expect.stringContaining('Windows') },
      endpoint: { invalidMode: expect.stringContaining('modo de envio') },
      validation: {
        revision: expect.stringContaining('revisão Git'),
        checkAttestations: 'Conclua o checklist guiado exato deste cenário.',
      },
      instructions: { m03: expect.stringContaining('320 pixels CSS') },
      status: { pass: 'APROVADO' },
      announcements: { replacementRejected: expect.stringContaining('rejeitada') },
    });
  });
});
