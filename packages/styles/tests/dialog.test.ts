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

type ModalVariant = {
  name: 'Dialog' | 'Drawer' | 'BottomSheet';
  prefix: 'dialog' | 'drawer' | 'bottomsheet';
  minimumCloseTarget: 44 | 24;
};

// minimumCloseTarget mirrors tools/v1-profiles/{dialog,drawer,bottom-sheet}.mjs:
// Dialog and BottomSheet close controls must reach the 44px WCAG target size,
// Drawer's documented minimum is 24px.
const modalVariants: readonly ModalVariant[] = [
  { name: 'Dialog', prefix: 'dialog', minimumCloseTarget: 44 },
  { name: 'Drawer', prefix: 'drawer', minimumCloseTarget: 24 },
  { name: 'BottomSheet', prefix: 'bottomsheet', minimumCloseTarget: 44 },
];

const modalFixture = (prefix: ModalVariant['prefix']): string => `
<main>
  <button type="button" tabindex="0" data-testid="${prefix}-opener">Open preferences</button>
  <div class="lyra-${prefix}-overlay" data-testid="${prefix}-overlay">
    <div class="lyra-${prefix}" role="dialog" aria-modal="true" aria-label="Edit notification preferences" data-testid="${prefix}-panel">
      <button type="button" class="lyra-${prefix}__close" tabindex="0" data-testid="${prefix}-close" aria-label="Close">
        <svg aria-hidden="true" width="16" height="16"><path d="M1 1l14 14M15 1L1 15" /></svg>
      </button>
      <h2 class="lyra-${prefix}__title" data-testid="${prefix}-title">Edit notification preferences</h2>
      <div class="lyra-${prefix}__body" data-testid="${prefix}-body">
        <p id="${prefix}-description">Choose how this workspace sends notifications.</p>
        <label for="notification-email">Notification email</label>
        <input id="notification-email" type="text" />
      </div>
      <button type="button" data-testid="${prefix}-save">Save changes</button>
    </div>
  </div>
</main>
`;

const closeControl = (prefix: ModalVariant['prefix']): HTMLElement => {
  const close = document.querySelector<HTMLElement>(`[data-testid="${prefix}-close"]`);
  if (!close) throw new Error(`Missing ${prefix} close control`);
  return close;
};

const panel = (prefix: ModalVariant['prefix']): HTMLElement => {
  const element = document.querySelector<HTMLElement>(`[data-testid="${prefix}-panel"]`);
  if (!element) throw new Error(`Missing ${prefix} panel`);
  return element;
};

const closeRect = (prefix: ModalVariant['prefix']): DOMRect =>
  closeControl(prefix).getBoundingClientRect();

const settleEntrance = async (prefix: ModalVariant['prefix']): Promise<void> => {
  const targets = [
    document.querySelector<HTMLElement>(`[data-testid="${prefix}-overlay"]`),
    document.querySelector<HTMLElement>(`[data-testid="${prefix}-panel"]`),
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

describe.each(modalVariants)('$name close control native keyboard focus indicator', (variant) => {
  afterEach(async () => {
    await commands.emulateFileUploadMedia({ forcedColors: 'none', reducedMotion: 'no-preference' });
    document.body.innerHTML = '';
  });

  it('keeps the normal-mode focus shadow after native Tab reaches the close control', async () => {
    document.body.innerHTML = modalFixture(variant.prefix);
    await userEvent.keyboard('{Tab}');
    await userEvent.keyboard('{Tab}');

    const close = closeControl(variant.prefix);
    expect(document.activeElement).toBe(close);
    expect(close.matches(':focus-visible')).toBe(true);
    expect(getComputedStyle(close).outlineStyle).toBe('none');
    expect(getComputedStyle(close).boxShadow).not.toBe('none');
    expect(getComputedStyle(panel(variant.prefix)).backgroundColor).not.toBe('transparent');
  });

  it('supplies a perceivable forced-colors outline when native keyboard focus lands on the close control', async () => {
    await commands.emulateFileUploadMedia({ forcedColors: 'active' });
    document.body.innerHTML = modalFixture(variant.prefix);
    await settleEntrance(variant.prefix);
    await userEvent.keyboard('{Tab}');
    await userEvent.keyboard('{Tab}');

    const close = closeControl(variant.prefix);
    expect(window.matchMedia('(forced-colors: active)').matches).toBe(true);
    expect(document.activeElement).toBe(close);
    expect(close.matches(':focus-visible')).toBe(true);

    const style = getComputedStyle(close);
    expect(style.outlineStyle).toBe('solid');
    expect(style.outlineWidth).toBe('2px');
    expect(style.outlineOffset).toBe('2px');

    const outlineColor = style.outlineColor;
    const panelBackground = getComputedStyle(panel(variant.prefix)).backgroundColor;
    expect(outlineColor).not.toBe('transparent');
    expect(outlineColor).not.toBe(panelBackground);
    expect(/rgba\([^)]*,\s*0\)$/.test(outlineColor)).toBe(false);

    const rect = closeRect(variant.prefix);
    expect(rect.width).toBeGreaterThanOrEqual(variant.minimumCloseTarget);
    expect(rect.height).toBeGreaterThanOrEqual(variant.minimumCloseTarget);

    const title = document.querySelector<HTMLElement>(`[data-testid="${variant.prefix}-title"]`);
    if (!title) throw new Error(`Missing ${variant.prefix} title`);
    expect(getComputedStyle(title).color).not.toBe(panelBackground);
  });
});
