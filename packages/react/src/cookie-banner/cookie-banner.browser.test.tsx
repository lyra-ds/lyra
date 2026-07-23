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

  it('persists a choice, invokes its callback, and hides', async () => {
    const onAccept = vi.fn();
    const { container } = await render(
      <CookieBanner storageKey={storageKey} onAccept={onAccept} />,
    );
    await userEvent.click(container.querySelector<HTMLButtonElement>('button:last-child')!);
    expect(localStorage.getItem(storageKey)).toBe('all');
    expect(onAccept).toHaveBeenCalledOnce();
    expect(container.querySelector('.lyra-cookies')).toBeNull();
  });

  it('does not render after an existing stored choice', async () => {
    localStorage.setItem(storageKey, 'essentials');
    const { container } = await render(<CookieBanner storageKey={storageKey} />);
    expect(container.querySelector('.lyra-cookies')).toBeNull();
  });
});
