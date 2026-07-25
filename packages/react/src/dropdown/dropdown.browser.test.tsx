import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { Dropdown } from './index';

const themes = ['light', 'dark'] as const;
const items = [
  { type: 'label' as const, label: 'Actions' },
  { id: 'edit', label: 'Edit' },
  { type: 'separator' as const },
  { id: 'archive', label: 'Archive', danger: true },
];

function setTheme(theme: (typeof themes)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}

afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('Dropdown', () => {
  for (const theme of themes) {
    it(`emits exact navigation classes and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const { container } = await render(
          <Dropdown trigger={<span>More actions</span>} items={items} align="end" defaultOpen />,
        );
        expect(container.querySelector('.lyra-dropdown')!.className).toBe('lyra-dropdown');
        expect(container.querySelector('[role=button]')!.className).toBe('lyra-dropdown__trigger');
        expect(container.querySelector('[role=menu]')!.className).toBe('lyra-menu lyra-menu--end');
        expect(container.querySelector('[role=menuitem]')!.className).toBe('lyra-menu__item');
        expect(container.querySelector('.lyra-menu__item--danger')!.className).toBe(
          'lyra-menu__item lyra-menu__item--danger',
        );
        expect(container.querySelector('.lyra-menu__label')!.className).toBe('lyra-menu__label');
        expect(container.querySelector('.lyra-menu__sep')!.className).toBe('lyra-menu__sep');
        expect(errorSpy).not.toHaveBeenCalled();
        expect(
          (await axe.run(container)).violations.filter((item) => item.id !== 'color-contrast'),
        ).toEqual([]);
      } finally {
        errorSpy.mockRestore();
      }
    });
  }

  it('opens on trigger keys and moves real DOM focus through menu commands', async () => {
    const { container } = await render(<Dropdown trigger="Actions" items={items} />);
    const trigger = container.querySelector<HTMLElement>('[role=button]')!;
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    const commands = container.querySelectorAll<HTMLButtonElement>('[role=menuitem]');
    expect(document.activeElement).toBe(commands[0]);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(commands[1]);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(commands[0]);
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(commands[1]);
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(commands[0]);
    await userEvent.keyboard('{Escape}');
    expect(container.querySelector('[role=menu]')).toBeNull();
    expect(document.activeElement).toBe(trigger);

    await userEvent.keyboard('{ArrowUp}');
    const reopened = container.querySelectorAll<HTMLButtonElement>('[role=menuitem]');
    expect(document.activeElement).toBe(reopened[1]);
  });

  it('selects commands, restores trigger focus, and lets Tab leave the menu', async () => {
    const onSelect = vi.fn();
    const { container } = await render(
      <>
        <Dropdown trigger="Actions" items={[{ id: 'edit', label: 'Edit', onSelect }]} />
        <button type="button">After</button>
      </>,
    );
    const trigger = container.querySelector<HTMLElement>('[role=button]')!;
    await userEvent.click(trigger);
    const command = container.querySelector<HTMLButtonElement>('[role=menuitem]')!;
    await userEvent.click(command);
    expect(onSelect).toHaveBeenCalledOnce();
    expect(container.querySelector('[role=menu]')).toBeNull();
    expect(document.activeElement).toBe(trigger);

    await userEvent.keyboard('{Enter}');
    const reopened = container.querySelector<HTMLButtonElement>('[role=menuitem]')!;
    await userEvent.keyboard('{Tab}');
    expect(container.querySelector('[role=menu]')).toBeNull();
    expect(document.activeElement).not.toBe(reopened);
  });

  it('flips the menu above the trigger instead of scrolling the page when there is no room below', async () => {
    const { container } = await render(
      <>
        <div style={{ height: 'calc(100vh - 80px)' }} />
        <Dropdown trigger="Actions" items={items} />
        <div style={{ height: '150vh' }} />
      </>,
    );
    const trigger = container.querySelector<HTMLElement>('[role=button]')!;
    const scrollBefore = window.scrollY;
    await userEvent.click(trigger);
    expect(container.querySelector('[role=menu]')!.className).toContain('lyra-menu--up');
    expect(window.scrollY).toBe(scrollBefore);
  });

  it('keeps the menu below the trigger when it fits', async () => {
    const { container } = await render(
      <>
        <Dropdown trigger="Actions" items={items} />
        <div style={{ height: '150vh' }} />
      </>,
    );
    await userEvent.click(container.querySelector<HTMLElement>('[role=button]')!);
    expect(container.querySelector('[role=menu]')!.className).not.toContain('lyra-menu--up');
  });
});
