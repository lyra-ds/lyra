import { afterEach, describe, expect, it } from 'vitest';
import { commands, userEvent } from 'vitest/browser';
import '../styles.css';

declare module 'vitest/browser' {
  interface BrowserCommands {
    emulateFileUploadMedia(options: {
      forcedColors?: 'active' | 'none';
      reducedMotion?: 'reduce' | 'no-preference';
    }): Promise<void>;
  }
}

type FocusControl = {
  name: 'Button' | 'Input' | 'Tabs' | 'DataTable sort control';
  label: string;
  markup: string;
};

// Explicit tabindex="0" mirrors dialog.test.ts and keeps native Tab traversal consistent in WebKit.
const focusControls: readonly FocusControl[] = [
  {
    name: 'Button',
    label: 'Save workspace',
    markup:
      '<button type="button" class="lyra-btn" tabindex="0" aria-label="Save workspace">Save workspace</button>',
  },
  {
    name: 'Input',
    label: 'Workspace name',
    markup:
      '<label>Workspace name <input type="text" class="lyra-input" tabindex="0" aria-label="Workspace name"></label>',
  },
  {
    name: 'Tabs',
    label: 'Overview',
    markup:
      '<div class="lyra-tabs" role="tablist"><button type="button" class="lyra-tab" role="tab" tabindex="0" aria-selected="true" aria-label="Overview">Overview</button></div>',
  },
  {
    name: 'DataTable sort control',
    label: 'Sort by name',
    markup:
      '<table class="lyra-table"><thead><tr><th><button type="button" class="lyra-table__sortbtn" tabindex="0" aria-label="Sort by name">Name</button></th></tr></thead></table>',
  },
];

const fixture = (control: FocusControl): string =>
  `<main class="lyra-card lyra-card--padded">${control.markup}</main>`;

const focusControl = (control: FocusControl): HTMLElement => {
  const element = document.querySelector<HTMLElement>(`[aria-label="${control.label}"]`);
  if (!element) throw new Error(`Missing ${control.name} focus control`);
  return element;
};

const fixtureSurface = (): HTMLElement => {
  const element = document.querySelector<HTMLElement>('main.lyra-card');
  if (!element) throw new Error('Missing focus-indicator fixture surface');
  return element;
};

describe.each(focusControls)('$name native keyboard focus indicator', (control) => {
  afterEach(async () => {
    await commands.emulateFileUploadMedia({ forcedColors: 'none', reducedMotion: 'no-preference' });
    document.body.innerHTML = '';
  });

  it('keeps its normal shadow and adds a system-color outline only after native Tab in forced colors', async () => {
    await commands.emulateFileUploadMedia({ forcedColors: 'none', reducedMotion: 'no-preference' });
    document.body.innerHTML = fixture(control);

    await userEvent.keyboard('{Tab}');

    const normalControl = focusControl(control);
    expect(document.activeElement).toBe(normalControl);
    expect(normalControl.matches(':focus-visible')).toBe(true);
    expect(getComputedStyle(normalControl).outlineStyle).toBe('none');
    expect(getComputedStyle(normalControl).boxShadow).not.toBe('none');

    document.body.innerHTML = fixture(control);
    await commands.emulateFileUploadMedia({
      forcedColors: 'active',
      reducedMotion: 'no-preference',
    });

    const forcedControl = focusControl(control);
    expect(window.matchMedia('(forced-colors: active)').matches).toBe(true);
    expect(getComputedStyle(forcedControl).outlineStyle).toBe('none');

    await userEvent.keyboard('{Tab}');

    expect(document.activeElement).toBe(forcedControl);
    expect(forcedControl.matches(':focus-visible')).toBe(true);

    const style = getComputedStyle(forcedControl);
    const outlineColor = style.outlineColor;
    expect(style.outlineStyle).toBe('solid');
    expect(style.outlineWidth).toBe('2px');
    expect(style.outlineOffset).toBe('2px');
    expect(outlineColor).not.toBe('transparent');
    expect(/rgba\([^)]*,\s*0\)$/.test(outlineColor)).toBe(false);
    expect(outlineColor).not.toBe(getComputedStyle(fixtureSurface()).backgroundColor);
  });
});
