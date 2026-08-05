import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { useState } from 'react';
import { BottomSheet } from './index';

function backdropDismiss(overlay: HTMLElement): void {
  overlay.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function BottomSheetHarness() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open sheet
      </button>
      <button type="button">Background</button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Sheet details">
        <input aria-label="Name" />
        <button type="button">Last</button>
      </BottomSheet>
    </>
  );
}

afterEach(async () => {
  await cleanup();
  document.documentElement.removeAttribute('data-theme');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
});

describe('BottomSheet', () => {
  for (const theme of ['light', 'dark'] as const) {
    it(`emits its complete class contract and is axe clean in ${theme}`, async () => {
      document.documentElement.toggleAttribute('data-theme', theme === 'dark');
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const screen = await render(
          <BottomSheet open onClose={() => {}} title="Sheet details">
            Body
          </BottomSheet>,
        );

        await expect
          .element(screen.getByRole('dialog', { name: 'Sheet details' }))
          .toBeInTheDocument();
        const panel = document.querySelector<HTMLElement>('.lyra-bottomsheet')!;
        expect(document.querySelector('.lyra-bottomsheet-overlay')!.className).toBe(
          'lyra-bottomsheet-overlay',
        );
        expect(panel.className).toBe('lyra-bottomsheet');
        expect(panel.getAttribute('role')).toBe('dialog');
        expect(panel.getAttribute('aria-modal')).toBe('true');
        const title = panel.querySelector<HTMLElement>('.lyra-bottomsheet__title')!;
        expect(panel.getAttribute('aria-labelledby')).toBe(title.id);
        expect(title.id).not.toBe('');
        expect(panel.querySelector('.lyra-bottomsheet__header')!.className).toBe(
          'lyra-bottomsheet__header',
        );
        expect(panel.querySelector('.lyra-bottomsheet__title')!.className).toBe(
          'lyra-bottomsheet__title',
        );
        expect(panel.querySelector('.lyra-bottomsheet__body')!.className).toBe(
          'lyra-bottomsheet__body',
        );
        expect(panel.querySelector('.lyra-bottomsheet__close')!.className).toBe(
          'lyra-bottomsheet__close',
        );
        await expectNoAxeViolations(document.body);
        expect(errorSpy).not.toHaveBeenCalled();
      } finally {
        errorSpy.mockRestore();
      }
    });
  }

  it('uses the title as its accessible name, or the translated aria-label when title is absent', async () => {
    const screen = await render(
      <BottomSheet open onClose={() => {}} aria-label="Choose a date">
        Calendar
      </BottomSheet>,
    );

    await expect.element(screen.getByRole('dialog', { name: 'Choose a date' })).toBeInTheDocument();
    const panel = document.querySelector<HTMLElement>('.lyra-bottomsheet')!;
    expect(panel.getAttribute('aria-labelledby')).toBeNull();
    expect(panel.getAttribute('aria-label')).toBe('Choose a date');
    expect(panel.querySelector('.lyra-bottomsheet__title')).toBeNull();
  });

  it('uses a translated close-button label', async () => {
    const screen = await render(
      <BottomSheet open onClose={() => {}} closeLabel="Fechar" title="Sheet details">
        Body
      </BottomSheet>,
    );

    await expect.element(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
  });

  it('forwards a consumer animation-end handler while maintaining presence bookkeeping', async () => {
    const onAnimationEnd = vi.fn();
    await render(
      <BottomSheet open onAnimationEnd={onAnimationEnd} title="Sheet details">
        Body
      </BottomSheet>,
    );

    const panel = document.querySelector<HTMLElement>('.lyra-bottomsheet')!;
    panel.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
    expect(onAnimationEnd).toHaveBeenCalledTimes(1);
  });

  it('stays mounted with slide-out motion until its exit animation completes', async () => {
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <BottomSheet open={open} onClose={() => setOpen(false)} title="Sheet details">
          Body
        </BottomSheet>
      );
    }

    await render(<Harness />);
    const panel = document.querySelector<HTMLElement>('.lyra-bottomsheet')!;
    await userEvent.keyboard('{Escape}');

    expect(panel.className).toContain('lyra-bottomsheet--closing');
    expect(getComputedStyle(panel).animationName).toBe('lyra-bottomsheet-out');
    expect(document.querySelector('.lyra-bottomsheet-overlay')!.className).toContain(
      'lyra-bottomsheet-overlay--closing',
    );
    expect(document.body.style.overflow).not.toBe('hidden');
    panel.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
    await vi.waitFor(() => expect(document.querySelector('.lyra-bottomsheet')).toBeNull());
  });

  it('traps focus and restores it after Escape and overlay close', async () => {
    const screen = await render(<BottomSheetHarness />);
    const opener = screen.getByRole('button', { name: 'Open sheet' }).element();

    await userEvent.click(opener);
    await vi.waitFor(() => expect(document.querySelector('.lyra-bottomsheet')).not.toBeNull());
    expect(document.body.style.overflow).toBe('hidden');
    const panel = document.querySelector<HTMLElement>('.lyra-bottomsheet')!;
    const close = panel.querySelector<HTMLButtonElement>('.lyra-bottomsheet__close')!;
    const last = panel.querySelectorAll<HTMLButtonElement>('button')[1]!;
    last.focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(close);

    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(document.querySelector('.lyra-bottomsheet')).toBeNull());
    expect(document.activeElement).toBe(opener);

    await userEvent.click(opener);
    const overlay = document.querySelector<HTMLElement>('.lyra-bottomsheet-overlay')!;
    backdropDismiss(overlay);
    await vi.waitFor(() => expect(document.querySelector('.lyra-bottomsheet')).toBeNull());
    expect(document.activeElement).toBe(opener);
  });

  it('does not dismiss when a panel/backdrop drag starts or ends inside the sheet', async () => {
    const onClose = vi.fn();
    await render(
      <BottomSheet open onClose={onClose} title="Sheet details">
        Body
      </BottomSheet>,
    );

    const panel = document.querySelector<HTMLElement>('.lyra-bottomsheet')!;
    const overlay = document.querySelector<HTMLElement>('.lyra-bottomsheet-overlay')!;

    panel.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClose).not.toHaveBeenCalled();

    overlay.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    panel.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('re-captures focus when reopened during exit and keeps Tab trapped', async () => {
    function ControlledSheet({ open }: { open: boolean }) {
      return (
        <>
          <button type="button" data-testid="trigger">
            Open
          </button>
          <button type="button" data-testid="outside">
            Background
          </button>
          <BottomSheet open={open} title="Sheet details">
            <button type="button" data-testid="last">
              Last
            </button>
          </BottomSheet>
        </>
      );
    }

    const { container, rerender } = await render(<ControlledSheet open={false} />);
    const trigger = container.querySelector<HTMLButtonElement>('[data-testid="trigger"]')!;
    trigger.focus();
    await rerender(<ControlledSheet open />);
    await vi.waitFor(() => expect(document.querySelector('.lyra-bottomsheet')).not.toBeNull());

    await rerender(<ControlledSheet open={false} />);
    await rerender(<ControlledSheet open />);

    const panel = document.querySelector<HTMLElement>('.lyra-bottomsheet')!;
    const last = panel.querySelector<HTMLButtonElement>('[data-testid="last"]')!;
    await vi.waitFor(() => expect(panel.contains(document.activeElement)).toBe(true));
    last.focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(last);
    expect(document.activeElement).not.toBe(
      container.querySelector<HTMLButtonElement>('[data-testid="outside"]'),
    );
  });

  it('keeps focus on the panel when it has no focusable children', async () => {
    const screen = await render(
      <BottomSheet open title="Sheet details">
        Plain text only
      </BottomSheet>,
    );

    const panel = screen.getByRole('dialog', { name: 'Sheet details' }).element();
    await vi.waitFor(() => expect(document.activeElement).toBe(panel));
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(panel);
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(panel);
  });

  it('restores focus to the opener when the × button closes the sheet', async () => {
    const screen = await render(<BottomSheetHarness />);
    const opener = screen.getByRole('button', { name: 'Open sheet' }).element();
    await userEvent.click(opener);
    await vi.waitFor(() => expect(document.querySelector('.lyra-bottomsheet')).not.toBeNull());

    await userEvent.click(document.querySelector<HTMLButtonElement>('.lyra-bottomsheet__close')!);
    await vi.waitFor(() => expect(document.querySelector('.lyra-bottomsheet')).toBeNull());
    expect(document.activeElement).toBe(opener);
  });

  it('does not focus a detached opener after close', async () => {
    function RemovableOpenerHarness() {
      const [open, setOpen] = useState(false);
      const [showOpener, setShowOpener] = useState(true);
      return (
        <>
          {showOpener && (
            <button type="button" data-testid="trigger" onClick={() => setOpen(true)}>
              Open
            </button>
          )}
          <BottomSheet open={open} onClose={() => setOpen(false)} title="Sheet details">
            <button type="button" data-testid="remove" onClick={() => setShowOpener(false)}>
              Remove opener
            </button>
          </BottomSheet>
        </>
      );
    }

    const screen = await render(<RemovableOpenerHarness />);
    const opener = screen.getByRole('button', { name: 'Open', exact: true }).element();
    await userEvent.click(opener);
    await vi.waitFor(() => expect(document.querySelector('.lyra-bottomsheet')).not.toBeNull());

    const focusSpy = vi.spyOn(opener, 'focus');
    // The remove control lives INSIDE the sheet: the page copy would sit under
    // the modal overlay, unreachable by a real click.
    await userEvent.click(screen.getByRole('button', { name: 'Remove opener' }).element());
    document.querySelector<HTMLElement>('.lyra-bottomsheet')!.focus();
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(document.querySelector('.lyra-bottomsheet')).toBeNull());
    expect(focusSpy).not.toHaveBeenCalled();
    focusSpy.mockRestore();
  });
});
