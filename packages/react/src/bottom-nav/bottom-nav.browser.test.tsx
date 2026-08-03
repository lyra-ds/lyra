import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { BottomNav } from './index';

const items = [
  { id: 'home', icon: <span aria-hidden="true">H</span>, label: 'Home', active: true },
  { id: 'search', icon: <span aria-hidden="true">S</span>, label: 'Search' },
  { id: 'account', icon: <span aria-hidden="true">A</span>, label: 'Account' },
];

function setTheme(theme: 'light' | 'dark'): void {
  document.documentElement.toggleAttribute('data-theme', theme === 'dark');
}

afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('BottomNav', () => {
  for (const theme of ['light', 'dark'] as const) {
    it(`renders the mobile navigation classes and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const screen = await render(<BottomNav aria-label="Mobile navigation" items={items} />);
        const { container } = screen;
        const navigation = container.querySelector<HTMLElement>('.lyra-bottomnav')!;
        const active = container.querySelector<HTMLButtonElement>('.lyra-bottomnav__item--active')!;

        await expect
          .element(screen.getByRole('navigation', { name: 'Mobile navigation' }))
          .toBeInTheDocument();
        await expect.element(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
        expect(navigation.className).toBe('lyra-bottomnav');
        expect(active.className).toBe('lyra-bottomnav__item lyra-bottomnav__item--active');
        expect(active.getAttribute('aria-current')).toBe('page');
        expect(active.querySelector('.lyra-bottomnav__icon')).not.toBeNull();
        expect(active.querySelector('.lyra-bottomnav__label')).not.toBeNull();
        expect(error).not.toHaveBeenCalled();
        expect((await axe.run(container)).violations).toEqual([]);
      } finally {
        error.mockRestore();
      }
    });
  }

  it('calls the item callback before the selection callback', async () => {
    const calls: string[] = [];
    const selectableItems = [
      ...items.slice(0, 1),
      {
        ...items[1],
        onClick: () => calls.push('item'),
      },
      items[2],
    ];
    const { container } = await render(
      <BottomNav
        items={selectableItems}
        onSelect={(id) => {
          calls.push(id);
        }}
      />,
    );

    await userEvent.click(
      container.querySelectorAll<HTMLButtonElement>('.lyra-bottomnav__item')[1]!,
    );
    expect(calls).toEqual(['item', 'search']);
  });
});
