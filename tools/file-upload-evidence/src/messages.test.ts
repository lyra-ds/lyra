import { describe, expect, it } from 'vitest';

import { MESSAGES } from './messages';

function keyPaths(value: unknown, prefix = ''): readonly string[] {
  if (typeof value === 'string') return [prefix];
  if (value === null || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, child]) => keyPaths(child, `${prefix}.${key}`));
}

function values(value: unknown): readonly string[] {
  if (typeof value === 'string') return [value];
  if (value === null || typeof value !== 'object') return [];
  return Object.values(value).flatMap(values);
}

describe('MESSAGES', () => {
  it('keeps the English and Brazilian Portuguese message shapes synchronized and nonblank', () => {
    expect(keyPaths(MESSAGES.en)).toEqual(keyPaths(MESSAGES['pt-BR']));
    for (const locale of [MESSAGES.en, MESSAGES['pt-BR']]) {
      expect(values(locale).every((message) => message.trim().length > 0)).toBe(true);
    }
  });

  it('exposes only M01/M02 manual labels and local-attachment guidance in both languages', () => {
    expect(MESSAGES.en).toMatchObject({
      scenarios: {
        'DF-FU-M01': expect.stringContaining('NVDA'),
        'DF-FU-M02': expect.stringContaining('VoiceOver'),
      },
      validation: { artifactPaths: expect.stringContaining('local evidence attachment') },
      instructions: { export: expect.stringContaining('evidence ZIP') },
    });
    expect(MESSAGES['pt-BR']).toMatchObject({
      scenarios: {
        'DF-FU-M01': expect.stringContaining('NVDA'),
        'DF-FU-M02': expect.stringContaining('VoiceOver'),
      },
      validation: { artifactPaths: expect.stringContaining('anexo local de evidência') },
      instructions: { export: expect.stringContaining('ZIP de evidências') },
    });
    expect(Object.keys(MESSAGES.en.scenarios)).toEqual(['DF-FU-M01', 'DF-FU-M02']);
    expect(Object.keys(MESSAGES['pt-BR'].scenarios)).toEqual(['DF-FU-M01', 'DF-FU-M02']);
  });
});
