import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { SidebarGroup } from './index';

const items = [
  {
    id: 'inbox',
    label: 'Inbox',
    title: 'Open inbox',
    icon: <span aria-hidden="true">I</span>,
    badge: 2,
    active: true,
  },
  { id: 'archive', label: 'Archive' },
];

function setTheme(theme: 'light' | 'dark'): void {
  document.documentElement.toggleAttribute('data-theme', theme === 'dark');
}

afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('SidebarGroup', () => {
  for (const theme of ['light', 'dark'] as const) {
    it(`emits disclosure classes and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const screen = await render(<SidebarGroup label="Projects" items={items} collapsible />);
        const { container } = screen;
        expect(container.querySelector('.lyra-sbgroup')!.className).toBe('lyra-sbgroup');
        expect(container.querySelector('.lyra-sbgroup__label')!.className).toBe(
          'lyra-sbgroup__label lyra-sbgroup__label--btn',
        );
        expect(container.querySelector('.lyra-sbgroup__item')!.className).toBe(
          'lyra-sbgroup__item lyra-sbgroup__item--active',
        );
        expect(container.querySelector('.lyra-sbgroup__item')!.getAttribute('aria-current')).toBe(
          'page',
        );
        const inboxItem = screen.getByRole('button', { name: 'Inbox' });
        await expect.element(inboxItem).toBeInTheDocument();
        await expect.element(inboxItem).toHaveAttribute('title', 'Open inbox');
        expect(error).not.toHaveBeenCalled();
        expect(
          (await axe.run(container)).violations.filter((v) => v.id !== 'color-contrast'),
        ).toEqual([]);
      } finally {
        error.mockRestore();
      }
    });
  }

  for (const theme of ['light', 'dark'] as const) {
    it(`clears color-contrast on the section label in ${theme}`, async () => {
      setTheme(theme);
      const { container } = await render(
        <SidebarGroup label="Workspace" items={[{ id: 'home', label: 'Home' }]} />,
      );
      expect(
        (
          await axe.run(container.querySelector<HTMLElement>('.lyra-sbgroup__label')!, {
            runOnly: ['color-contrast'],
          })
        ).violations,
      ).toEqual([]);
    });
  }

  it('draws a real chevron that rotates with the collapsed state', async () => {
    const { container } = await render(
      <SidebarGroup label="Workspace" collapsible items={[{ id: 'home', label: 'Home' }]} />,
    );
    const chev = container.querySelector<HTMLElement>('.lyra-sbgroup__chev')!;
    // Regression: converting the handoff's <Icon> to a bare span left a 0x0 element, so a
    // collapsible group had no visible affordance at all.
    expect(chev.tagName.toLowerCase()).toBe('svg');
    expect(chev.getBoundingClientRect().width).toBeGreaterThan(0);
    expect(chev.getAttribute('aria-hidden')).toBe('true');
    expect(getComputedStyle(chev).transform).toBe('none');

    await userEvent.click(container.querySelector<HTMLElement>('.lyra-sbgroup__label--btn')!);
    expect(container.querySelector('.lyra-sbgroup')!.className).toContain(
      'lyra-sbgroup--collapsed',
    );
    expect(getComputedStyle(chev).transform).not.toBe('none');
  });

  it('toggles with Space and Enter and calls item and group callbacks', async () => {
    const itemSelect = vi.fn();
    const groupSelect = vi.fn();
    const interactiveItems = [{ ...items[0], onSelect: itemSelect }, items[1]];
    const { container } = await render(
      <SidebarGroup label="Projects" items={interactiveItems} collapsible onSelect={groupSelect} />,
    );
    const label = container.querySelector<HTMLButtonElement>('.lyra-sbgroup__label--btn')!;
    label.focus();
    await userEvent.keyboard(' ');
    expect(label.getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelector('.lyra-sbgroup__items')).toBeNull();
    await userEvent.keyboard('{Enter}');
    expect(label.getAttribute('aria-expanded')).toBe('true');
    await userEvent.click(container.querySelector<HTMLButtonElement>('.lyra-sbgroup__item')!);
    expect(itemSelect).toHaveBeenCalledOnce();
    expect(groupSelect).toHaveBeenCalledWith('inbox', interactiveItems[0]);
  });

  it('renders a non-collapsible label as a plain div', async () => {
    const { container } = await render(<SidebarGroup label="Projects" items={items} />);
    expect(container.querySelector('.lyra-sbgroup__label')!.tagName).toBe('DIV');
  });
});
