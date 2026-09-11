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

const dialogFixture = `
<main>
  <button type="button" tabindex="0" data-testid="dialog-opener">Open preferences</button>
  <div class="lyra-dialog-overlay" data-testid="dialog-overlay">
    <div class="lyra-dialog" role="dialog" aria-modal="true" aria-label="Edit notification preferences" data-testid="dialog-panel">
      <button type="button" class="lyra-dialog__close" tabindex="0" data-testid="dialog-close" aria-label="Close">
        <svg aria-hidden="true" width="16" height="16"><path d="M1 1l14 14M15 1L1 15" /></svg>
      </button>
      <h2 class="lyra-dialog__title" data-testid="dialog-title">Edit notification preferences</h2>
      <div class="lyra-dialog__body" data-testid="dialog-body">
        <p id="dialog-description">Choose how this workspace sends notifications.</p>
        <label for="notification-email">Notification email</label>
        <input id="notification-email" type="text" />
      </div>
      <button type="button" data-testid="dialog-save">Save changes</button>
    </div>
  </div>
</main>
`;

const closeControl = (): HTMLElement => {
  const close = document.querySelector<HTMLElement>('[data-testid="dialog-close"]');
  if (!close) throw new Error('Missing dialog close control');
  return close;
};

const panel = (): HTMLElement => {
  const element = document.querySelector<HTMLElement>('[data-testid="dialog-panel"]');
  if (!element) throw new Error('Missing dialog panel');
  return element;
};

const closeRect = (): DOMRect => closeControl().getBoundingClientRect();

const settleDialogEntrance = async (): Promise<void> => {
  const targets = [
    document.querySelector<HTMLElement>('[data-testid="dialog-overlay"]'),
    document.querySelector<HTMLElement>('[data-testid="dialog-panel"]'),
  ];
  const animations = targets.flatMap((element) =>
    element instanceof HTMLElement ? element.getAnimations({ subtree: false }) : [],
  );
  await Promise.all(
    animations
      .filter((animation) => {
        const timing = animation.effect?.getComputedTiming();
        return Number.isFinite(timing?.activeDuration) && (timing?.activeDuration ?? 0) > 0;
      })
      .map((animation) => animation.finished),
  );
};

describe('Dialog close control native keyboard focus indicator', () => {
  afterEach(async () => {
    await commands.emulateFileUploadMedia({ forcedColors: 'none', reducedMotion: 'no-preference' });
    document.body.innerHTML = '';
  });

  it('keeps the normal-mode focus shadow after native Tab reaches the close control', async () => {
    document.body.innerHTML = dialogFixture;
    await userEvent.keyboard('{Tab}');
    await userEvent.keyboard('{Tab}');

    const close = closeControl();
    expect(document.activeElement).toBe(close);
    expect(close.matches(':focus-visible')).toBe(true);
    expect(getComputedStyle(close).outlineStyle).toBe('none');
    expect(getComputedStyle(close).boxShadow).not.toBe('none');
    expect(getComputedStyle(panel()).backgroundColor).not.toBe('transparent');
  });

  it('supplies a perceivable forced-colors outline when native keyboard focus lands on the close control', async () => {
    await commands.emulateFileUploadMedia({ forcedColors: 'active' });
    document.body.innerHTML = dialogFixture;
    await settleDialogEntrance();
    await userEvent.keyboard('{Tab}');
    await userEvent.keyboard('{Tab}');

    const close = closeControl();
    expect(window.matchMedia('(forced-colors: active)').matches).toBe(true);
    expect(document.activeElement).toBe(close);
    expect(close.matches(':focus-visible')).toBe(true);

    const style = getComputedStyle(close);
    expect(style.outlineStyle).toBe('solid');
    expect(style.outlineWidth).toBe('2px');
    expect(style.outlineOffset).toBe('2px');

    const outlineColor = style.outlineColor;
    const panelBackground = getComputedStyle(panel()).backgroundColor;
    expect(outlineColor).not.toBe('transparent');
    expect(outlineColor).not.toBe(panelBackground);
    expect(/rgba\([^)]*,\s*0\)$/.test(outlineColor)).toBe(false);

    const rect = closeRect();
    expect(rect.width).toBeGreaterThanOrEqual(44);
    expect(rect.height).toBeGreaterThanOrEqual(44);

    const title = document.querySelector<HTMLElement>('[data-testid="dialog-title"]');
    if (!title) throw new Error('Missing dialog title');
    expect(getComputedStyle(title).color).not.toBe(panelBackground);
  });
});
