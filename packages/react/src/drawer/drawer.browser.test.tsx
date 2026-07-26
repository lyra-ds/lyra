import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { useState } from 'react';
import { Drawer } from './index';

function DrawerHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <button type="button">Background</button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Details"
        footer={<button type="button">Save</button>}
      >
        <input aria-label="Name" />
        <button type="button">Last</button>
      </Drawer>
    </>
  );
}

afterEach(async () => {
  await cleanup();
  document.documentElement.removeAttribute('data-theme');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
});

describe('Drawer', () => {
  for (const theme of ['light', 'dark'] as const) {
    it(`emits exact classes and is axe clean in ${theme}`, async () => {
      document.documentElement.toggleAttribute('data-theme', theme === 'dark');
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        await render(
          <Drawer
            open
            onClose={() => {}}
            title="Details"
            footer={<button type="button">Save</button>}
          >
            Body
          </Drawer>,
        );
        await vi.waitFor(() => expect(document.querySelector('.lyra-drawer')).not.toBeNull());
        const panel = document.querySelector<HTMLElement>('.lyra-drawer')!;
        expect(document.querySelector('.lyra-drawer-overlay')!.className).toBe(
          'lyra-drawer-overlay',
        );
        expect(panel.className).toBe('lyra-drawer');
        expect(panel.querySelector('.lyra-drawer__header')!.className).toBe('lyra-drawer__header');
        expect(panel.querySelector('.lyra-drawer__title')!.className).toBe('lyra-drawer__title');
        expect(panel.querySelector('.lyra-drawer__body')!.className).toBe('lyra-drawer__body');
        expect(panel.querySelector('.lyra-drawer__footer')!.className).toBe('lyra-drawer__footer');
        expect(panel.querySelector('.lyra-drawer__close')!.className).toBe('lyra-drawer__close');
        expect(
          (await axe.run(document.body)).violations.filter((item) => item.id !== 'color-contrast'),
        ).toEqual([]);
        expect(errorSpy).not.toHaveBeenCalled();
      } finally {
        errorSpy.mockRestore();
      }
    });
  }

  it('animates out before it leaves, instead of vanishing on the same frame', async () => {
    // Regression: Drawer entered with `lyra-slide-in` and then unmounted immediately, while Dialog
    // and the command palette both hold a `--closing` class for their exit.
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <Drawer open={open} onClose={() => setOpen(false)} title="Details">
          Body
        </Drawer>
      );
    }
    await render(<Harness />);
    const panel = document.querySelector<HTMLElement>('.lyra-drawer')!;
    await userEvent.keyboard('{Escape}');

    // Still mounted, now carrying the exit animation.
    expect(panel.className).toContain('lyra-drawer--closing');
    expect(getComputedStyle(panel).animationName).toBe('lyra-slide-out');
    expect(document.querySelector('.lyra-drawer-overlay')!.className).toContain(
      'lyra-drawer-overlay--closing',
    );

    // And the page is scrollable again straight away — the lock keys on the request, not the exit.
    expect(document.body.style.overflow).not.toBe('hidden');
    await vi.waitFor(() => {
      expect(document.querySelector('.lyra-drawer')).toBeNull();
    });
  });

  it('traps focus, locks scroll, and restores its opener on Escape and backdrop close', async () => {
    const { container } = await render(<DrawerHarness />);
    const opener = container.querySelector<HTMLButtonElement>('button')!;
    await userEvent.click(opener);
    await vi.waitFor(() => expect(document.querySelector('.lyra-drawer')).not.toBeNull());
    expect(document.body.style.overflow).toBe('hidden');
    const panel = document.querySelector<HTMLElement>('.lyra-drawer')!;
    const close = panel.querySelector<HTMLButtonElement>('.lyra-drawer__close')!;
    const last = panel.querySelectorAll<HTMLButtonElement>('button')[2]!;
    last.focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(close);
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(document.querySelector('.lyra-drawer')).toBeNull());
    expect(document.activeElement).toBe(opener);

    await userEvent.click(opener);
    const overlay = document.querySelector<HTMLElement>('.lyra-drawer-overlay')!;
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await vi.waitFor(() => expect(document.querySelector('.lyra-drawer')).toBeNull());
    expect(document.activeElement).toBe(opener);
  });
});
