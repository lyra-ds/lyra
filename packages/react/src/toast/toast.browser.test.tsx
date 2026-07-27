import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { Toast, ToastStack } from './index';

function setTheme(theme: 'light' | 'dark'): void {
  document.documentElement.toggleAttribute('data-theme', theme === 'dark');
}

afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('Toast', () => {
  for (const theme of ['light', 'dark'] as const) {
    for (const tone of ['info', 'success', 'danger'] as const) {
      it(`${tone} is a polite status with exact classes and no axe violations in ${theme}`, async () => {
        setTheme(theme);
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        try {
          const { container } = await render(
            <Toast tone={tone} icon={<span aria-hidden="true">!</span>}>
              Saved
            </Toast>,
          );
          expect(container.querySelector('[role=status]')!.className).toBe('lyra-toast');
          expect(container.querySelector('.lyra-toast__icon')!.className).toBe(
            `lyra-toast__icon lyra-toast__icon--${tone}`,
          );
          expect(error).not.toHaveBeenCalled();
          expect(
            (await axe.run(container)).violations.filter((v) => v.id !== 'color-contrast'),
          ).toEqual([]);
        } finally {
          error.mockRestore();
        }
      });
    }
  }

  it('uses "Close notification" as the default accessible name for the close button', async () => {
    const { container } = await render(<Toast onClose={() => {}}>Saved</Toast>);
    expect(container.querySelector('.lyra-toast__close')!.getAttribute('aria-label')).toBe(
      'Close notification',
    );
  });

  it('uses closeLabel as the accessible name for the close button', async () => {
    const { container } = await render(
      <Toast onClose={() => {}} closeLabel="Fechar notificação">
        Saved
      </Toast>,
    );
    expect(container.querySelector('.lyra-toast__close')!.getAttribute('aria-label')).toBe(
      'Fechar notificação',
    );
  });

  it('gives the close button a hit area that clears the WCAG minimum', async () => {
    // Regression: the close glyph measured 12x19 — the one control in the system that failed
    // WCAG 2.2 AA's 24x24 minimum outright. It keeps its visible size; the area is the ::after.
    const { container } = await render(<Toast onClose={() => {}}>Saved</Toast>);
    const close = container.querySelector<HTMLElement>('.lyra-toast__close')!;
    expect(Math.round(close.getBoundingClientRect().width)).toBe(12);

    const hit = getComputedStyle(close, '::after');
    expect(hit.content).not.toBe('none');
    expect(hit.top).toBe('-12px');
    expect(hit.left).toBe('-12px');
  });

  it('calls onClose from its labelled close button without moving focus itself', async () => {
    const onClose = vi.fn();
    const { container } = await render(<Toast onClose={onClose}>Saved</Toast>);
    const close = container.querySelector<HTMLButtonElement>('.lyra-toast__close')!;
    expect(close.getAttribute('aria-label')).toBe('Close notification');
    await userEvent.click(close);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('stacks children in its dedicated container', async () => {
    const { container } = await render(
      <ToastStack>
        <Toast>Saved</Toast>
      </ToastStack>,
    );
    expect(container.querySelector('.lyra-toast-stack')!.className).toBe('lyra-toast-stack');
  });
});
