/// <reference types="vite/client" />

import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { commands, page, userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import '@lyra-ds/styles/styles.css';
import englishEntry from '../en/file-upload-evidence/index.html?raw';
import { bootstrapAlpine } from './alpine-bootstrap';
import type { EnvironmentTelemetry, Locale } from './contracts';
import type { ManualEvidenceBundle } from './evidence-bundle';
import { HarnessApp } from './harness-app';

declare module 'vitest/browser' {
  interface BrowserCommands {
    emulateFileUploadEvidenceMedia(options: {
      forcedColors?: 'active' | 'none';
      reducedMotion?: 'reduce' | 'no-preference';
    }): Promise<void>;
  }
}

const REVISION = '1234567890abcdef1234567890abcdef12345678';
const BUILD_TIME = '2026-08-17T12:00:00.000Z';
const mountedAlpineHosts: HTMLElement[] = [];

function environment(width = window.innerWidth): EnvironmentTelemetry {
  const pointer = window.matchMedia('(pointer: coarse)').matches;
  const anyPointer = window.matchMedia('(any-pointer: coarse)').matches;
  return {
    userAgent: navigator.userAgent,
    timezone: 'America/Sao_Paulo',
    viewport: { width, height: window.innerHeight, devicePixelRatio: window.devicePixelRatio },
    mediaQueries: {
      '(pointer: coarse)': pointer,
      '(any-pointer: coarse)': anyPointer,
      '(hover: none)': window.matchMedia('(hover: none)').matches,
      '(any-hover: none)': window.matchMedia('(any-hover: none)').matches,
    },
    coarsePointer: pointer || anyPointer,
  };
}

function appProps(locale: Locale) {
  return {
    locale,
    revision: REVISION,
    buildTime: BUILD_TIME,
    deploymentUrl: `https://a1b2c3d4.lyra-ds-docs.pages.dev/${locale}/file-upload-evidence/`,
    alpineDelayMilliseconds: 5_000,
    captureEnvironment: () => environment(),
    now: () => new Date('2026-08-17T13:00:00.000Z'),
  };
}

function selectFile(input: HTMLInputElement, file: File): void {
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
  input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
}

function finishFiniteAnimations(): void {
  for (const animation of document.getAnimations()) {
    if (animation.effect?.getComputedTiming().endTime !== Infinity) animation.finish();
  }
}

function namedInput(name: string): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>(`.lyra-evidence input[name="${name}"]`);
  if (input === null) throw new Error(`Missing evidence input ${name}.`);
  return input;
}

function namedTextarea(name: string): HTMLTextAreaElement {
  const input = document.querySelector<HTMLTextAreaElement>(
    `.lyra-evidence textarea[name="${name}"]`,
  );
  if (input === null) throw new Error(`Missing evidence textarea ${name}.`);
  return input;
}

function namedSelect(name: string): HTMLSelectElement {
  const input = document.querySelector<HTMLSelectElement>(`.lyra-evidence select[name="${name}"]`);
  if (input === null) throw new Error(`Missing evidence select ${name}.`);
  return input;
}

async function completeEnglishObservation(file: File): Promise<void> {
  for (const [name, value] of [
    ['os.name', 'Windows'],
    ['os.version', '11'],
    ['os.build', '26100.1'],
    ['browser.name', 'Chrome'],
    ['browser.version', '140'],
    ['assistiveTechnology.name', 'NVDA'],
    ['assistiveTechnology.version', '2026.1'],
    ['reviewer.name', 'Accessibility Reviewer'],
  ] satisfies ReadonlyArray<readonly [string, string]>) {
    await userEvent.fill(namedInput(name), value);
  }
  await page.getByLabelText('Physical keyboard used').click();
  await userEvent.fill(namedTextarea('actual'), 'Observed lifecycle announcement.');
  selectFile(namedInput('evidenceAttachments'), file);
  await userEvent.selectOptions(namedSelect('result'), 'PASS');
  await userEvent.selectOptions(namedSelect('reviewer.approval'), 'approved');
  for (const label of [
    'Verify selection and indeterminate upload announcements with NVDA.',
    'Record determinate progress at 25, 50, 75, and 100 percent.',
    'Exercise cancellation, retry, a stale result, error, success, removal, and focus recovery.',
  ]) {
    await page.getByLabelText(label).click();
  }
}

afterEach(async () => {
  const { default: Alpine } = await import('alpinejs');
  for (const host of mountedAlpineHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
  cleanup();
  vi.restoreAllMocks();
  document.documentElement.lang = '';
  document.documentElement.dir = '';
  delete document.documentElement.dataset.theme;
  await page.viewport(1280, 720);
  await commands.emulateFileUploadEvidenceMedia({
    forcedColors: 'none',
    reducedMotion: 'no-preference',
  });
});

describe('three-engine file upload evidence instrument acceptance', () => {
  it.each([
    {
      locale: 'en' as const,
      heading: 'File upload evidence recorder',
      scenario: 'DF-FU-M02 — macOS, VoiceOver, and Safari',
      guidance:
        'Verify selection and indeterminate upload announcements with VoiceOver and Safari.',
      foreignHeading: 'Registro de evidências de envio de arquivo',
    },
    {
      locale: 'pt-BR' as const,
      heading: 'Registro de evidências de envio de arquivo',
      scenario: 'DF-FU-M02 — macOS, VoiceOver e Safari',
      guidance: 'Verifique os anúncios de seleção e envio indeterminado com VoiceOver e Safari.',
      foreignHeading: 'File upload evidence recorder',
    },
  ])(
    'keeps the $locale route language and lifecycle guidance isolated and accessible',
    async ({ foreignHeading, guidance, heading, locale, scenario }) => {
      document.documentElement.lang = locale;
      const { container } = await render(<HarnessApp {...appProps(locale)} />);

      expect(document.documentElement.lang).toBe(locale);
      expect(page.getByRole('heading', { name: heading })).toBeVisible();
      expect(page.getByText(foreignHeading)).not.toBeInTheDocument();
      await userEvent.selectOptions(namedSelect('scenario'), 'DF-FU-M02');
      expect(namedSelect('scenario')).toHaveValue('DF-FU-M02');
      expect(page.getByRole('option', { name: scenario })).toBeInTheDocument();
      expect(page.getByText(new RegExp(guidance, 'u'))).toBeVisible();

      const results = await axe.run(container);
      expect(results.violations).toEqual([]);

      document.documentElement.dataset.theme = 'dark';
      finishFiniteAnimations();
      const darkResults = await axe.run(container);
      expect(darkResults.violations).toEqual([]);
      delete document.documentElement.dataset.theme;
    },
  );

  it('constructs the same-origin endpoint request from the selected File and operator mode', async () => {
    const opened = vi.spyOn(XMLHttpRequest.prototype, 'open').mockImplementation(() => undefined);
    const setHeader = vi
      .spyOn(XMLHttpRequest.prototype, 'setRequestHeader')
      .mockImplementation(() => undefined);
    const sent = vi.spyOn(XMLHttpRequest.prototype, 'send').mockImplementation(() => undefined);
    await render(<HarnessApp {...appProps('en')} />);
    await userEvent.click(page.getByLabelText('Delayed response'));

    const input = document.querySelector<HTMLInputElement>(
      '.lyra-evidence .lyra-upload__input[type="file"]',
    );
    if (input === null) throw new Error('Missing the controlled file input.');
    const file = new File(['evidence'], 'request-evidence.txt', { type: 'text/plain' });
    selectFile(input, file);

    expect(opened).toHaveBeenCalledWith('POST', '/api/file-upload-evidence');
    expect(setHeader).toHaveBeenCalledWith('X-Lyra-Evidence-Client', 'xhr');
    const body = sent.mock.calls[0]?.[0];
    expect(body).toBeInstanceOf(FormData);
    if (!(body instanceof FormData)) throw new Error('Expected multipart form data.');
    expect(body.get('file')).toBe(file);
    expect(body.get('locale')).toBe('en');
    expect(body.get('mode')).toBe('delay');
    expect(body.get('delay')).toBe('15000');
  });

  it('preserves a preselected native File across the requested delayed Alpine enhancement', async () => {
    const parsed = new DOMParser().parseFromString(englishEntry, 'text/html');
    const host = document.createElement('div');
    for (const child of [...parsed.body.children]) host.appendChild(child.cloneNode(true));
    document.body.appendChild(host);
    mountedAlpineHosts.push(host);
    const root = host.querySelector<HTMLElement>('#alpine-evidence-root');
    const form = host.querySelector<HTMLFormElement>('#alpine-upload-form');
    const input = host.querySelector<HTMLInputElement>('#alpine-file');
    if (root === null || form === null || input === null) {
      throw new Error('The delayed Alpine fixture is incomplete.');
    }
    const file = new File(['native'], 'selected-before-alpine.txt', { type: 'text/plain' });
    selectFile(input, file);
    const originalInput = input;
    let scheduled: (() => void) | undefined;
    const initialized = bootstrapAlpine(root, {
      search: '?alpineDelay=53',
      schedule(callback, milliseconds) {
        expect(milliseconds).toBe(53);
        scheduled = callback;
      },
    });

    expect(root.querySelector('#alpine-initializations')).toHaveTextContent('0');
    scheduled?.();
    await initialized;
    const { default: Alpine } = await import('alpinejs');
    await Alpine.nextTick();

    expect(root.querySelector('#alpine-file')).toBe(originalInput);
    expect(input.files?.[0]).toBe(file);
    expect(new FormData(form).get('file')).toBe(file);
    expect(root.querySelector('#alpine-initializations')).toHaveTextContent('1');
    expect(root.querySelector('#alpine-selection-intents')).toHaveTextContent('0');
    expect(root.querySelector('#alpine-connects')).toHaveTextContent('1');
    expect(root.querySelector('#alpine-disconnects')).toHaveTextContent('0');
  });

  it('keeps selected evidence local and downloads a ZIP through the injected boundary', async () => {
    const bundle: ManualEvidenceBundle = {
      bytes: new Uint8Array([80, 75]),
      fileName: 'evidence.zip',
      mediaType: 'application/zip',
    };
    const createBundle = vi.fn().mockResolvedValue(bundle);
    const downloadBundle = vi.fn();
    const file = new File(['local evidence'], 'review.png', { type: 'image/png' });
    await render(
      <HarnessApp
        {...appProps('en')}
        createBundle={createBundle}
        downloadBundle={downloadBundle}
      />,
    );
    expect(page.getByRole('button', { name: 'Download evidence ZIP' })).toBeDisabled();

    await completeEnglishObservation(file);
    expect(page.getByRole('button', { name: 'Download evidence ZIP' })).toBeEnabled();
    await page.getByRole('button', { name: 'Download evidence ZIP' }).click();

    const [records, attachments] = createBundle.mock.calls[0] ?? [];
    expect(records).toHaveLength(1);
    expect(records?.[0]).toMatchObject({
      scenario: 'DF-FU-M01',
      revision: REVISION,
      artifactPaths: ['artifacts/DF-FU-M01/review.png'],
    });
    expect(attachments.get('DF-FU-M01')).toEqual([file]);
    expect(downloadBundle).toHaveBeenCalledExactlyOnceWith(bundle);
  });

  it('uses automated 320px, RTL, and long-content emulation only for UI fitness, never M03 evidence', async () => {
    await page.viewport(320, 640);
    document.documentElement.lang = 'pt-BR';
    document.documentElement.dir = 'rtl';
    const { container } = await render(<HarnessApp {...appProps('pt-BR')} />);
    await userEvent.selectOptions(namedSelect('scenario'), 'DF-FU-M02');

    const root = container.querySelector<HTMLElement>('.lyra-evidence');
    const fixtureName = container.querySelector<HTMLElement>('.lyra-evidence__fixture code');
    if (root === null || fixtureName === null) throw new Error('Missing the narrow UI fixture.');
    root.dir = 'rtl';
    expect(window.innerWidth).toBe(320);
    expect(getComputedStyle(root).direction).toBe('rtl');
    expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
    expect(fixtureName.scrollWidth).toBeLessThanOrEqual(fixtureName.clientWidth);
    expect(page.getByRole('button', { name: 'Baixar ZIP de evidências' })).toBeDisabled();
    expect(
      page.getByText(
        'Este instrumento registra observações humanas. Ele não aprova cenários automaticamente.',
      ),
    ).toBeVisible();
  });

  it('retains visible focus and motion boundaries under automated media emulation', async () => {
    const { container } = await render(<HarnessApp {...appProps('en')} />);
    const zone = container.querySelector<HTMLElement>('.lyra-upload__zone');
    const diagnostics = container.querySelector<HTMLElement>('.lyra-evidence__diagnostics');
    const input = container.querySelector<HTMLInputElement>('.lyra-upload__input');
    if (zone === null || diagnostics === null || input === null) {
      throw new Error('Missing media-query acceptance targets.');
    }

    await commands.emulateFileUploadEvidenceMedia({ reducedMotion: 'no-preference' });
    expect(getComputedStyle(zone).transitionDuration).not.toBe('0s');
    await commands.emulateFileUploadEvidenceMedia({ reducedMotion: 'reduce' });
    expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
    expect(getComputedStyle(zone).transitionDuration).toBe('0s');

    await commands.emulateFileUploadEvidenceMedia({
      forcedColors: 'active',
      reducedMotion: 'no-preference',
    });
    input.focus();
    expect(window.matchMedia('(forced-colors: active)').matches).toBe(true);
    expect(getComputedStyle(diagnostics).borderStyle).toBe('solid');
    expect(getComputedStyle(diagnostics).borderWidth).toBe('1px');
    expect(getComputedStyle(zone).outlineStyle).toBe('solid');
    expect(Number.parseFloat(getComputedStyle(zone).outlineWidth)).toBeGreaterThanOrEqual(2);
  });
});
