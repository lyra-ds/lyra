import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { commands, page } from 'vitest/browser';
import '../styles.css';
import fixtureHtml from './fixtures/file-upload.html?raw';

declare module 'vitest/browser' {
  interface BrowserCommands {
    emulateFileUploadMedia(options: {
      forcedColors?: 'active' | 'none';
      reducedMotion?: 'reduce' | 'no-preference';
    }): Promise<void>;
  }
}

let root: HTMLElement;

const testId = <T extends HTMLElement = HTMLElement>(name: string): T => {
  const element = root.querySelector<T>(`[data-testid="${name}"]`);
  if (!element) throw new Error(`Missing fixture element: ${name}`);
  return element;
};

beforeEach(() => {
  document.body.innerHTML = fixtureHtml;
  root = document.getElementById('file-upload-fixture')!;
});

afterEach(() => {
  return Promise.all([
    page.viewport(1024, 768),
    commands.emulateFileUploadMedia({ forcedColors: 'none', reducedMotion: 'no-preference' }),
  ]).then(() => {
    document.body.innerHTML = '';
  });
});

describe('FileUpload native lifecycle presentation', () => {
  it('keeps the native input focusable while reflecting visible focus to its label', () => {
    const input = testId<HTMLInputElement>('file-upload-input');
    const zone = testId('file-upload-zone');

    input.focus();

    expect(document.activeElement).toBe(input);
    expect(getComputedStyle(input).position).toBe('absolute');
    expect(getComputedStyle(input).clipPath).not.toBe('none');
    expect(getComputedStyle(zone).outlineStyle).toBe('solid');
    expect(getComputedStyle(zone).boxShadow).not.toBe('none');
  });

  it('presents lifecycle errors, native determinate and indeterminate progress, and disabled recovery', () => {
    const determinate = testId<HTMLProgressElement>('file-upload-progress');
    const indeterminate = testId<HTMLProgressElement>('file-upload-indeterminate-progress');
    const validation = testId('file-upload-validation-error');
    const transport = testId('file-upload-transport-error');
    const uploading = testId('file-upload-determinate');
    const retry = testId<HTMLButtonElement>('file-upload-retry');
    const live = testId('file-upload-live');

    expect(determinate.getAttribute('value')).toBe('50');
    expect(indeterminate.hasAttribute('value')).toBe(false);
    // WebKit keeps a one-pixel native minimum around a 5px progress track; the CSS declaration
    // remains observable through accent-color and the full-width geometry below.
    expect(determinate.getBoundingClientRect().height).toBeLessThanOrEqual(6);
    expect(determinate.getBoundingClientRect().width).toBeGreaterThanOrEqual(
      determinate.parentElement!.getBoundingClientRect().width - 1,
    );
    expect(getComputedStyle(determinate).accentColor).not.toBe('auto');
    expect(getComputedStyle(validation).borderColor).toBe(getComputedStyle(transport).borderColor);
    expect(getComputedStyle(validation).borderColor).not.toBe(
      getComputedStyle(uploading).borderColor,
    );
    expect(retry.disabled).toBe(true);
    expect(live.getAttribute('aria-live')).toBe('polite');
  });

  it('keeps long filenames, metadata, actions, and RTL content inside a real 320-pixel viewport', async () => {
    await page.viewport(320, 640);
    const viewport = testId('file-upload-viewport');
    const upload = testId('file-upload');
    const longName = testId('file-upload-long-name');
    const longMeta = testId('file-upload-long-meta');
    const transport = testId('file-upload-transport-error');
    const retry = testId<HTMLButtonElement>('file-upload-retry');
    const rtl = testId('file-upload-rtl');
    const dark = testId('file-upload-dark');

    expect(window.innerWidth).toBe(320);
    expect(getComputedStyle(upload).minWidth).toBe('0px');
    expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
    expect(longName.scrollWidth).toBeGreaterThan(longName.clientWidth);
    expect(longMeta.scrollWidth).toBeGreaterThan(longMeta.clientWidth);
    expect(retry.getBoundingClientRect().right).toBeLessThanOrEqual(
      transport.getBoundingClientRect().right,
    );
    expect(retry.getBoundingClientRect().width).toBeGreaterThanOrEqual(44);
    expect(retry.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    expect(rtl.scrollWidth).toBeLessThanOrEqual(rtl.clientWidth);
    expect(getComputedStyle(rtl).direction).toBe('rtl');
    expect(getComputedStyle(dark).getPropertyValue('--surface-card').trim()).not.toBe(
      getComputedStyle(root).getPropertyValue('--surface-card').trim(),
    );
  });

  it('renders reduced-motion and forced-color states through Playwright media emulation', async () => {
    const zone = testId('file-upload-zone');
    const progress = testId<HTMLProgressElement>('file-upload-progress');
    const retry = testId<HTMLButtonElement>('file-upload-retry');

    await commands.emulateFileUploadMedia({ reducedMotion: 'reduce' });
    expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
    expect(getComputedStyle(zone).transitionDuration).toBe('0s');

    await commands.emulateFileUploadMedia({ forcedColors: 'active' });
    expect(window.matchMedia('(forced-colors: active)').matches).toBe(true);
    expect(getComputedStyle(zone).outlineStyle).toBe('solid');
    expect(getComputedStyle(progress).borderStyle).toBe('solid');
    expect(getComputedStyle(retry).borderStyle).toBe('solid');
    expect(getComputedStyle(retry).borderWidth).toBe('1px');
    expect(getComputedStyle(retry).color).toBe(getComputedStyle(retry).borderColor);
  });

  it('reserves practical default action targets', () => {
    const cancel = testId<HTMLButtonElement>('file-upload-cancel');
    const retry = testId<HTMLButtonElement>('file-upload-retry');

    expect(cancel.getBoundingClientRect().width).toBeGreaterThanOrEqual(24);
    expect(cancel.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    expect(retry.getBoundingClientRect().width).toBeGreaterThanOrEqual(24);
    expect(retry.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
  });
});
