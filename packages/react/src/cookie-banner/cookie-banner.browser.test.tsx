import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { CookieBanner } from './index';

const storageKey = 'cookie-banner-test';

function setTheme(theme: 'light' | 'dark'): void {
  document.documentElement.toggleAttribute('data-theme', theme === 'dark');
}

afterEach(async () => {
  await cleanup();
  localStorage.removeItem(storageKey);
  setTheme('light');
});

describe('CookieBanner', () => {
  for (const theme of ['light', 'dark'] as const) {
    it(`renders default copy with exact classes and no axe violations in ${theme}`, async () => {
      setTheme(theme);
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const { container } = await render(
          <CookieBanner storageKey={storageKey} policyHref="/privacy" />,
        );
        expect(container.querySelector('.lyra-cookies')!.className).toBe('lyra-cookies');
        expect(container.querySelector('.lyra-cookies__text')!.className).toBe(
          'lyra-cookies__text',
        );
        expect(container.querySelector('.lyra-cookies__actions')!.className).toBe(
          'lyra-cookies__actions',
        );
        expect(container.querySelector<HTMLAnchorElement>('.lyra-cookies__text a')!.href).toContain(
          '/privacy',
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

  it('animates out, still centred, before it leaves', async () => {
    const { container } = await render(<CookieBanner storageKey="lyra-exit-test" />);
    const banner = container.ownerDocument.querySelector<HTMLElement>('.lyra-cookies')!;
    const halfWidth = banner.getBoundingClientRect().width / 2;

    await userEvent.click(container.ownerDocument.querySelector<HTMLElement>('.lyra-btn')!);

    expect(banner.className).toContain('lyra-cookies--closing');
    expect(getComputedStyle(banner).animationName).toBe('lyra-cookies-out');
    // The exit keyframe carries the centring too — without it the banner would leave sideways.
    const matrix = new DOMMatrixReadOnly(getComputedStyle(banner).transform);
    expect(Math.round(matrix.m41)).toBe(-Math.round(halfWidth));

    await vi.waitFor(() => {
      expect(container.ownerDocument.querySelector('.lyra-cookies')).toBeNull();
    });
  });

  it('stays centred while it animates in', async () => {
    // Regression: the banner centres itself with `transform: translateX(-50%)` and used to borrow
    // the Toast entrance keyframe, which animates `transform` — so for the length of the entrance
    // the centring was dropped and the banner slid in from half its own width off-centre.
    const { container } = await render(<CookieBanner storageKey="lyra-centring-test" />);
    const banner = container.ownerDocument.querySelector<HTMLElement>('.lyra-cookies')!;
    const style = getComputedStyle(banner);
    expect(style.animationName).toBe('lyra-cookies-in');

    const matrix = new DOMMatrixReadOnly(style.transform);
    const halfWidth = banner.getBoundingClientRect().width / 2;
    expect(Math.round(matrix.m41)).toBe(-Math.round(halfWidth));
  });

  it('persists a choice, invokes its callback, and hides', async () => {
    const onAccept = vi.fn();
    const { container } = await render(
      <CookieBanner storageKey={storageKey} onAccept={onAccept} />,
    );
    await userEvent.click(container.querySelector<HTMLButtonElement>('button:last-child')!);
    expect(localStorage.getItem(storageKey)).toBe('all');
    expect(onAccept).toHaveBeenCalledOnce();
    // The choice is recorded and the callback fires immediately; the element itself leaves only
    // after its exit animation, so the disappearance is awaited rather than asserted synchronously.
    await vi.waitFor(() => {
      expect(container.querySelector('.lyra-cookies')).toBeNull();
    });
  });

  it('does not render after an existing stored choice', async () => {
    localStorage.setItem(storageKey, 'essentials');
    const { container } = await render(<CookieBanner storageKey={storageKey} />);
    expect(container.querySelector('.lyra-cookies')).toBeNull();
  });
});
