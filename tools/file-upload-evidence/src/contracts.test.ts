import { describe, expect, it } from 'vitest';

import { validateObservation } from './contracts';

const valid = {
  scenario: 'DF-FU-M03',
  locale: 'pt-BR',
  revision: 'a'.repeat(40),
  deploymentUrl: 'https://abc123.lyra-ds.pages.dev/pt-BR/file-upload-evidence/',
  executedAt: '2026-08-17T14:30:00.000Z',
  timezone: 'America/Sao_Paulo',
  os: { name: 'Android', version: '16', build: 'BP2A.250605.031.A2' },
  browser: { name: 'Chrome', version: '139.0.7258.52' },
  assistiveTechnology: null,
  inputMethods: ['touch', 'keyboard'],
  viewport: { width: 320, height: 740, devicePixelRatio: 3 },
  mediaQueries: { '(pointer: coarse)': true, '(any-pointer: coarse)': true },
  expected: 'A substituição ativa é rejeitada e anunciada.',
  actual: 'A substituição foi rejeitada e anunciada.',
  result: 'PASS',
  reviewer: { name: 'Ana Reviewer', approval: 'approved' },
  artifactUrls: ['https://evidence.example.test/m03-recording.mp4'],
  findingUrls: ['https://tracker.example.test/FU-103'],
};

describe('validateObservation', () => {
  it.each(['DF-FU-M01', 'DF-FU-M02', 'DF-FU-M03', 'DF-FU-M04'] as const)(
    'accepts the %s manual scenario identifier',
    (scenario) => {
      const observation = {
        ...valid,
        scenario,
        assistiveTechnology:
          scenario === 'DF-FU-M01' || scenario === 'DF-FU-M02'
            ? { name: 'NVDA', version: '2026.2' }
            : null,
      };

      expect(validateObservation(observation).ok).toBe(true);
    },
  );

  it.each(['en', 'pt-BR'] as const)('accepts the %s route locale', (locale) => {
    expect(validateObservation({ ...valid, locale }).ok).toBe(true);
  });

  it('normalizes a valid observation without mutating user-entered data', () => {
    const input = {
      ...valid,
      expected: '  A substituição ativa é rejeitada e anunciada.  ',
      inputMethods: [' touch ', 'keyboard'],
      artifactUrls: [' https://evidence.example.test/m03-recording.mp4 '],
    };

    const result = validateObservation(input);

    expect(result).toMatchObject({
      ok: true,
      value: {
        expected: 'A substituição ativa é rejeitada e anunciada.',
        inputMethods: ['touch', 'keyboard'],
        artifactUrls: ['https://evidence.example.test/m03-recording.mp4'],
      },
    });
    expect(input).toEqual({
      ...valid,
      expected: '  A substituição ativa é rejeitada e anunciada.  ',
      inputMethods: [' touch ', 'keyboard'],
      artifactUrls: [' https://evidence.example.test/m03-recording.mp4 '],
    });
    if (!result.ok) {
      throw new Error('expected the valid observation to pass validation');
    }

    input.mediaQueries['(pointer: coarse)'] = false;
    expect(result.value.mediaQueries['(pointer: coarse)']).toBe(true);
  });

  it('rejects malformed revisions, timestamps, and deployment URLs', () => {
    for (const [field, value] of [
      ['revision', 'A'.repeat(40)],
      ['executedAt', '2026-08-17 14:30'],
      ['executedAt', '2026-02-30T14:30:00.000Z'],
      ['deploymentUrl', 'http://evidence.example.test/'],
    ] as const) {
      const result = validateObservation({ ...valid, [field]: value });

      expect(result).toMatchObject({ ok: false, errors: [{ field }] });
    }
  });

  it('requires non-empty OS, browser, and assistive-technology versions when AT is active', () => {
    for (const [field, observation] of [
      ['os.version', { ...valid, os: { ...valid.os, version: '' } }],
      ['os.build', { ...valid, os: { ...valid.os, build: '' } }],
      ['browser.version', { ...valid, browser: { ...valid.browser, version: '' } }],
      [
        'assistiveTechnology.version',
        { ...valid, assistiveTechnology: { name: 'TalkBack', version: '' } },
      ],
    ] as const) {
      const result = validateObservation(observation);

      expect(result).toMatchObject({ ok: false, errors: [{ field }] });
    }
  });

  it('requires evidence artifacts and compatible reviewer decisions', () => {
    const changesRequested = { name: 'Ana Reviewer', approval: 'changes-requested' } as const;

    expect(validateObservation({ ...valid, artifactUrls: [] })).toMatchObject({
      ok: false,
      errors: [{ field: 'artifactUrls' }],
    });
    expect(validateObservation({ ...valid, result: 'PASS', reviewer: changesRequested }).ok).toBe(
      false,
    );
    expect(
      validateObservation({ ...valid, result: 'FAIL', reviewer: { ...valid.reviewer } }).ok,
    ).toBe(false);
  });

  it('requires assistive technology for the screen-reader scenarios', () => {
    expect(
      validateObservation({ ...valid, scenario: 'DF-FU-M01', assistiveTechnology: null }).ok,
    ).toBe(false);
  });

  it('returns stable localized field errors for invalid observations', () => {
    const english = validateObservation({ ...valid, locale: 'en', revision: 'not-a-sha' });
    const portuguese = validateObservation({ ...valid, locale: 'pt-BR', revision: 'not-a-sha' });

    expect(english).toMatchObject({
      ok: false,
      errors: [
        { field: 'revision', message: 'Enter the full 40-character lowercase Git revision.' },
      ],
    });
    expect(portuguese).toMatchObject({
      ok: false,
      errors: [
        {
          field: 'revision',
          message: 'Informe a revisão Git completa de 40 caracteres minúsculos.',
        },
      ],
    });
  });
});
