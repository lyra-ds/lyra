import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { commands, page, userEvent } from 'vitest/browser';
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

  it('wraps localized status and actions below a truncated filename at a real 320-pixel viewport', async () => {
    await page.viewport(320, 640);
    const viewport = testId('file-upload-viewport');
    const upload = testId('file-upload');
    const longName = testId('file-upload-long-name');
    const status = testId('file-upload-action-status');
    const transport = testId('file-upload-transport-error');
    const retry = testId<HTMLButtonElement>('file-upload-retry');
    const remove = testId<HTMLButtonElement>('file-upload-remove');
    const rtl = testId('file-upload-rtl');
    const rtlStatus = testId('file-upload-rtl-status');
    const rtlError = testId('file-upload-rtl-error');
    const rtlRetry = testId<HTMLButtonElement>('file-upload-rtl-retry');
    const rtlRemove = testId<HTMLButtonElement>('file-upload-rtl-remove');
    const dark = testId('file-upload-dark');

    expect(window.innerWidth).toBe(320);
    expect(getComputedStyle(upload).minWidth).toBe('0px');
    expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
    expect(longName.scrollWidth).toBeGreaterThan(longName.clientWidth);
    expect(status.scrollWidth).toBeLessThanOrEqual(status.clientWidth);
    expect(status.getBoundingClientRect().height).toBeGreaterThan(
      Number.parseFloat(getComputedStyle(status).fontSize) * 1.5,
    );
    for (const action of [retry, remove]) {
      expect(action.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        transport.getBoundingClientRect().left,
      );
      expect(action.getBoundingClientRect().right).toBeLessThanOrEqual(
        transport.getBoundingClientRect().right,
      );
      expect(action.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        status.getBoundingClientRect().bottom,
      );
    }
    expect(retry.getBoundingClientRect().width).toBeGreaterThanOrEqual(44);
    expect(retry.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    expect(rtl.scrollWidth).toBeLessThanOrEqual(rtl.clientWidth);
    expect(getComputedStyle(rtl).direction).toBe('rtl');
    expect(rtlStatus.scrollWidth).toBeLessThanOrEqual(rtlStatus.clientWidth);
    expect(rtlStatus.getBoundingClientRect().height).toBeGreaterThan(
      Number.parseFloat(getComputedStyle(rtlStatus).fontSize) * 1.5,
    );
    for (const action of [rtlRetry, rtlRemove]) {
      expect(action.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        rtlError.getBoundingClientRect().left,
      );
      expect(action.getBoundingClientRect().right).toBeLessThanOrEqual(
        rtlError.getBoundingClientRect().right,
      );
      expect(action.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        rtlStatus.getBoundingClientRect().bottom,
      );
    }
    expect(getComputedStyle(dark).getPropertyValue('--surface-card').trim()).not.toBe(
      getComputedStyle(root).getPropertyValue('--surface-card').trim(),
    );
  });

  it('renders disabled roots as unavailable and suppresses hover and drag presentation', async () => {
    const zone = testId('file-upload-zone');
    const disabledZone = testId('file-upload-disabled-zone');
    const input = testId<HTMLInputElement>('file-upload-disabled-input');
    const action = testId<HTMLButtonElement>('file-upload-disabled-action');

    await userEvent.hover(disabledZone);

    expect(input.disabled).toBe(true);
    expect(action.disabled).toBe(true);
    expect(getComputedStyle(disabledZone).cursor).toBe('not-allowed');
    expect(getComputedStyle(disabledZone).borderStyle).toBe('solid');
    expect(getComputedStyle(disabledZone).backgroundColor).toBe(
      getComputedStyle(zone).backgroundColor,
    );
  });

  it('renders discriminating reduced-motion and forced-color states through Playwright media emulation', async () => {
    const zone = testId('file-upload-zone');
    const input = testId<HTMLInputElement>('file-upload-input');
    const determinate = testId<HTMLProgressElement>('file-upload-progress');
    const indeterminate = testId<HTMLProgressElement>('file-upload-indeterminate-progress');
    const uploading = testId('file-upload-determinate');
    const error = testId('file-upload-transport-error');
    const retry = testId<HTMLButtonElement>('file-upload-retry');
    const disabledZone = testId('file-upload-disabled-zone');
    const unfocusedZone = root.querySelector<HTMLElement>(
      '.lyra-upload__zone[for="file-upload-rtl-input"]',
    );
    const barRule = Array.from(document.styleSheets)
      .flatMap((sheet) => Array.from(sheet.cssRules))
      .find(
        (rule): rule is CSSStyleRule =>
          rule instanceof CSSStyleRule && rule.selectorText === '.lyra-upload__bar',
      );

    if (!unfocusedZone || !barRule) throw new Error('Missing file-upload media evidence target');

    await commands.emulateFileUploadMedia({ forcedColors: 'none', reducedMotion: 'no-preference' });
    input.focus();
    const normalOutline = getComputedStyle(zone).outlineColor;
    expect(normalOutline === 'transparent' || /,\s*0\)$/.test(normalOutline)).toBe(true);

    const baseTransition = barRule.style.transition;
    try {
      barRule.style.transition = 'opacity 1s linear';
      expect(getComputedStyle(determinate).transitionDuration).not.toBe('0s');
      expect(getComputedStyle(indeterminate).transitionDuration).not.toBe('0s');

      await commands.emulateFileUploadMedia({ reducedMotion: 'reduce' });
      expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
      expect(getComputedStyle(zone).transitionDuration).toBe('0s');
      expect(getComputedStyle(determinate).transitionDuration).toBe('0s');
      expect(getComputedStyle(indeterminate).transitionDuration).toBe('0s');
      expect(getComputedStyle(zone).animationName).toBe('none');
      expect(getComputedStyle(determinate).animationName).toBe('none');
      expect(getComputedStyle(indeterminate).animationName).toBe('none');
    } finally {
      barRule.style.transition = baseTransition;
    }

    await commands.emulateFileUploadMedia({
      forcedColors: 'active',
      reducedMotion: 'no-preference',
    });
    expect(window.matchMedia('(forced-colors: active)').matches).toBe(true);
    expect(document.activeElement).toBe(input);
    expect(zone.matches('.lyra-upload__zone:has(+ .lyra-upload__input:focus-visible)')).toBe(true);
    expect(getComputedStyle(zone).outlineStyle).toBe('solid');
    expect(getComputedStyle(zone).outlineWidth).toBe('2px');
    expect(getComputedStyle(zone).outlineColor).not.toBe(normalOutline);
    expect(
      getComputedStyle(zone).outlineColor === 'transparent' ||
        /,\s*0\)$/.test(getComputedStyle(zone).outlineColor),
    ).toBe(false);
    expect(getComputedStyle(zone).outlineColor).not.toBe(
      getComputedStyle(unfocusedZone).outlineColor,
    );
    expect(getComputedStyle(error).borderColor).not.toBe(getComputedStyle(uploading).borderColor);
    expect(getComputedStyle(determinate).borderStyle).toBe('solid');
    expect(getComputedStyle(indeterminate).borderStyle).toBe('solid');
    expect(getComputedStyle(retry).borderStyle).toBe('solid');
    expect(getComputedStyle(retry).borderWidth).toBe('1px');
    expect(getComputedStyle(retry).color).toBe(getComputedStyle(retry).borderColor);
    expect(getComputedStyle(disabledZone).outlineStyle).toBe('solid');
    expect(getComputedStyle(disabledZone).outlineWidth).not.toBe('0px');
    expect(getComputedStyle(disabledZone).borderStyle).toBe('solid');
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
