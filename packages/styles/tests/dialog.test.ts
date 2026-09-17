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

const dialogLayoutFixture = (body: string): string => `
<main>
  <div class="lyra-dialog-overlay">
    <div class="lyra-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-layout-title">
      <div class="lyra-dialog__header">
        <h2 id="dialog-layout-title" class="lyra-dialog__title">Edit notification preferences</h2>
        <button type="button" class="lyra-dialog__close" aria-label="Close">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>
      <div class="lyra-dialog__body">${body}</div>
      <div class="lyra-dialog__footer"><button type="button">Save changes</button></div>
    </div>
  </div>
</main>
`;

const dialogDropdownFixture = (): string =>
  dialogLayoutFixture(`
    <div class="lyra-dropdown">
      <button type="button">Project actions</button>
      <div class="lyra-menu lyra-menu--start" role="menu" aria-label="Project actions">
        ${Array.from(
          { length: 6 },
          (_, index) =>
            `<button type="button" class="lyra-menu__item" role="menuitem">Command ${index + 1}</button>`,
        ).join('')}
      </div>
    </div>
  `);

const layoutElement = <T extends HTMLElement>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing dialog layout element: ${selector}`);
  return element;
};

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

const settleDialogLayoutEntrance = async (): Promise<void> => {
  const targets = [
    document.querySelector<HTMLElement>('.lyra-dialog-overlay'),
    document.querySelector<HTMLElement>('[role="dialog"]'),
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

describe('Dialog content layout', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('keeps long public dialog content reachable through native overlay scrolling', async () => {
    const paragraphs = Array.from(
      { length: 12 },
      (_, index) =>
        `<p>Notification preference ${index + 1} explains how this workspace sends updates across email, mobile, and in-product channels. You can review delivery timing, select the teams that receive each alert, and update these choices whenever your workspace policies change.</p>`,
    ).join('');
    document.body.innerHTML = dialogLayoutFixture(paragraphs);
    await settleDialogLayoutEntrance();

    const overlay = layoutElement<HTMLDivElement>('.lyra-dialog-overlay');
    const dialog = layoutElement<HTMLDivElement>('[role="dialog"]');
    const footer = layoutElement<HTMLDivElement>('.lyra-dialog__footer');
    const close = layoutElement<HTMLButtonElement>('button[aria-label="Close"]');
    const overlayRect = overlay.getBoundingClientRect();
    const dialogRect = dialog.getBoundingClientRect();

    expect(getComputedStyle(overlay).overflowY).toMatch(/auto|scroll/);
    expect(overlay.scrollHeight).toBeGreaterThan(overlay.clientHeight);
    expect(dialogRect.top).toBeGreaterThanOrEqual(overlayRect.top);
    expect(close.getBoundingClientRect().top).toBeGreaterThanOrEqual(overlayRect.top);
    overlay.scrollTop = overlay.scrollHeight;
    expect(overlay.scrollTop).toBeGreaterThan(0);
    expect(footer.getBoundingClientRect().bottom).toBeLessThanOrEqual(overlayRect.bottom);
  });

  it('keeps short public dialog content naturally compact', async () => {
    document.body.innerHTML = dialogLayoutFixture(
      '<p>Choose how this workspace sends notifications.</p>',
    );
    await settleDialogLayoutEntrance();

    const overlay = layoutElement<HTMLDivElement>('.lyra-dialog-overlay');
    const dialog = layoutElement<HTMLDivElement>('[role="dialog"]');
    const overlayRect = overlay.getBoundingClientRect();
    const dialogRect = dialog.getBoundingClientRect();

    expect(overlay.scrollHeight).toBe(overlay.clientHeight);
    expect(dialogRect.height).toBeLessThan(overlayRect.height - 48);
  });

  it('keeps a public Dropdown menu hit-testable beyond the Dialog body boundary', async () => {
    document.body.innerHTML = dialogDropdownFixture();
    await settleDialogLayoutEntrance();

    const overlay = layoutElement<HTMLDivElement>('.lyra-dialog-overlay');
    const body = layoutElement<HTMLDivElement>('.lyra-dialog__body');
    const lastCommand = layoutElement<HTMLButtonElement>('[role="menuitem"]:last-child');
    const bodyRect = body.getBoundingClientRect();
    const commandRect = lastCommand.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();
    const centerX = commandRect.left + commandRect.width / 2;
    const centerY = commandRect.top + commandRect.height / 2;

    expect(commandRect.top).toBeGreaterThan(bodyRect.bottom);
    expect(commandRect.bottom).toBeLessThanOrEqual(overlayRect.bottom);
    expect(document.elementFromPoint(centerX, centerY)).toBe(lastCommand);
  });
});
