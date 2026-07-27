import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import { useState } from 'react';
import '@lyra-ds/styles/styles.css';
import { CommandPalette, type CommandGroup } from './index';

const themes = ['light', 'dark'] as const;
const groups: CommandGroup[] = [
  {
    label: 'Actions',
    items: [
      {
        id: 'new',
        label: 'New file',
        hint: 'Create a document',
        icon: <span>+</span>,
        shortcut: '⌘ N',
      },
      { id: 'settings', label: 'Settings', hint: 'Configure workspace', shortcut: '⌘ ,' },
    ],
  },
  { label: 'Navigation', items: [{ id: 'home', label: 'Go home', hint: 'Open dashboard' }] },
];

function setTheme(theme: (typeof themes)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}

function OverlayHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <button type="button">Background</button>
      <CommandPalette open={open} onClose={() => setOpen(false)} groups={groups} />
    </>
  );
}

function HotkeyHarness({ onOpen, onClose }: { onOpen: () => void; onClose: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <CommandPalette
      open={open}
      groups={groups}
      onOpen={() => {
        onOpen();
        setOpen(true);
      }}
      onClose={() => {
        onClose();
        setOpen(false);
      }}
    />
  );
}

afterEach(async () => {
  await cleanup();
  setTheme('light');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
});

describe('CommandPalette', () => {
  for (const theme of themes) {
    it(`emits exact inline classes and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const { container } = await render(<CommandPalette inline groups={groups} />);
        const panel = container.querySelector<HTMLElement>('.lyra-cmdk')!;
        expect(panel.className).toBe('lyra-cmdk');
        expect(panel.getAttribute('role')).toBeNull();
        expect(panel.querySelector('.lyra-cmdk__search')!.className).toBe('lyra-cmdk__search');
        expect(panel.querySelector('[role=combobox]')!.getAttribute('aria-expanded')).toBe('true');
        expect(panel.querySelector('[role=listbox]')!.className).toBe('lyra-cmdk__body');
        expect(panel.querySelector('.lyra-cmdk__group')!.className).toBe('lyra-cmdk__group');
        expect(panel.querySelector('.lyra-cmdk__group-label')!.className).toBe(
          'lyra-cmdk__group-label',
        );
        expect(panel.querySelector('[role=option]')!.className).toBe(
          'lyra-cmdk__item lyra-cmdk__item--active',
        );
        expect(panel.querySelector('.lyra-cmdk__item-icon')!.className).toBe(
          'lyra-cmdk__item-icon',
        );
        expect(panel.querySelector('.lyra-cmdk__item-label')!.className).toBe(
          'lyra-cmdk__item-label',
        );
        expect(panel.querySelector('.lyra-cmdk__item-hint')!.className).toBe(
          'lyra-cmdk__item-hint',
        );
        expect(panel.querySelector('.lyra-cmdk__shortcut')!.className).toBe('lyra-cmdk__shortcut');
        expect(panel.querySelector('.lyra-cmdk__shortcut .lyra-kbd')!.className).toBe('lyra-kbd');
        expect(panel.querySelector('.lyra-cmdk__footer')!.className).toBe('lyra-cmdk__footer');
        expect(errorSpy).not.toHaveBeenCalled();
        expect(
          (await axe.run(container)).violations.filter((item) => item.id !== 'color-contrast'),
        ).toEqual([]);
      } finally {
        errorSpy.mockRestore();
      }
    });

    it(`is axe clean as an open overlay in ${theme}`, async () => {
      setTheme(theme);
      await render(<CommandPalette open onClose={() => {}} groups={groups} />);
      await vi.waitFor(() => expect(document.querySelector('.lyra-cmdk-overlay')).not.toBeNull());
      expect(
        (await axe.run(document.body)).violations.filter((item) => item.id !== 'color-contrast'),
      ).toEqual([]);
    });
  }

  it('names the modal dialog in English by default, and lets a localized app rename it', async () => {
    const { container } = await render(<CommandPalette open onClose={() => {}} groups={groups} />);
    expect(container.querySelector('[role=dialog]')).toBeNull(); // it portals out of the container
    expect(document.querySelector('[role=dialog]')!.getAttribute('aria-label')).toBe(
      'Command palette',
    );
    await cleanup();

    await render(
      <CommandPalette open onClose={() => {}} groups={groups} aria-label="Paleta de comandos" />,
    );
    expect(document.querySelector('[role=dialog]')!.getAttribute('aria-label')).toBe(
      'Paleta de comandos',
    );
  });

  it('does not make the inline panel a dialog', async () => {
    const { container } = await render(<CommandPalette inline groups={groups} />);
    const panel = container.querySelector('.lyra-cmdk')!;
    expect(panel.getAttribute('role')).toBeNull();
    expect(panel.getAttribute('aria-label')).toBeNull();
  });

  it('keeps focus on the input while filtering, navigating, and selecting the active command', async () => {
    const itemSelect = vi.fn();
    const select = vi.fn();
    const localGroups: CommandGroup[] = [
      {
        label: 'Actions',
        items: [{ ...groups[0].items[0], onSelect: itemSelect }, groups[0].items[1]],
      },
      groups[1],
    ];
    const { container } = await render(
      <CommandPalette inline groups={localGroups} onSelect={select} />,
    );
    const input = container.querySelector<HTMLInputElement>('[role=combobox]')!;
    await vi.waitFor(() => expect(document.activeElement).toBe(input));
    const first = container.querySelectorAll<HTMLElement>('[role=option]')[0];
    expect(input.getAttribute('aria-activedescendant')).toBe(first.id);
    await userEvent.fill(input, 'workspace');
    const settings = container.querySelector<HTMLElement>('[role=option]')!;
    expect(settings.textContent).toContain('Settings');
    expect(input.getAttribute('aria-activedescendant')).toBe(settings.id);
    expect(document.activeElement).toBe(input);
    await userEvent.clear(input);
    await userEvent.keyboard('{ArrowDown}');
    const second = container.querySelectorAll<HTMLElement>('[role=option]')[1];
    expect(input.getAttribute('aria-activedescendant')).toBe(second.id);
    expect(document.activeElement).toBe(input);
    await userEvent.keyboard('{Enter}');
    expect(select).toHaveBeenCalledWith(groups[0].items[1]);
    expect(itemSelect).not.toHaveBeenCalled();
  });

  it('resets the active descendant to the first result and removes it for an empty filter', async () => {
    const { container } = await render(<CommandPalette inline groups={groups} />);
    const input = container.querySelector<HTMLInputElement>('[role=combobox]')!;
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await userEvent.fill(input, 'dashboard');
    const home = container.querySelector<HTMLElement>('[role=option]')!;
    expect(home.textContent).toContain('Go home');
    expect(input.getAttribute('aria-activedescendant')).toBe(home.id);
    await userEvent.fill(input, 'not found');
    expect(input.hasAttribute('aria-activedescendant')).toBe(false);
    expect(container.querySelector('.lyra-cmdk__empty')!.className).toBe('lyra-cmdk__empty');
  });

  it('portals, traps focus, locks scroll, and restores its opener after Escape and backdrop close', async () => {
    const { container } = await render(<OverlayHarness />);
    const opener = container.querySelector<HTMLButtonElement>('button')!;
    await userEvent.click(opener);
    await vi.waitFor(() => expect(document.querySelector('.lyra-cmdk')).not.toBeNull());
    expect(document.body.style.overflow).toBe('hidden');
    const input = document.querySelector<HTMLInputElement>('[role=combobox]')!;
    await vi.waitFor(() => expect(document.activeElement).toBe(input));
    const options = document.querySelectorAll<HTMLButtonElement>('[role=option]');
    options[options.length - 1].focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(input);
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(document.querySelector('.lyra-cmdk')).toBeNull());
    expect(document.activeElement).toBe(opener);

    await userEvent.click(opener);
    await vi.waitFor(() => expect(document.querySelector('.lyra-cmdk-overlay')).not.toBeNull());
    const overlay = document.querySelector<HTMLElement>('.lyra-cmdk-overlay')!;
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await vi.waitFor(() => expect(document.querySelector('.lyra-cmdk')).toBeNull());
    expect(document.activeElement).toBe(opener);
  });

  it('stays mounted with closing motion until its panel animation ends', async () => {
    const { rerender } = await render(<CommandPalette open groups={groups} />);
    await vi.waitFor(() => expect(document.querySelector('.lyra-cmdk')).not.toBeNull());

    await rerender(<CommandPalette open={false} groups={groups} />);
    await vi.waitFor(() => {
      expect(document.querySelector('.lyra-cmdk')?.classList.contains('lyra-cmdk--closing')).toBe(
        true,
      );
    });
    const closingPanel = document.querySelector<HTMLElement>('.lyra-cmdk')!;
    expect(
      document
        .querySelector('.lyra-cmdk-overlay')
        ?.classList.contains('lyra-cmdk-overlay--closing'),
    ).toBe(true);
    expect(getComputedStyle(closingPanel).animationName).toBe('lyra-overlay-out');

    closingPanel.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
    await vi.waitFor(() => expect(document.querySelector('.lyra-cmdk')).toBeNull());
  });

  it('toggles through the global Command/Ctrl+K listener only when onOpen is provided', async () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();
    await render(<HotkeyHarness onOpen={onOpen} onClose={onClose} />);
    const openEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
      key: 'K',
    });
    document.dispatchEvent(openEvent);
    await vi.waitFor(() => expect(onOpen).toHaveBeenCalledTimes(1));
    expect(openEvent.defaultPrevented).toBe(true);
    const closeEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      metaKey: true,
      key: 'k',
    });
    document.dispatchEvent(closeEvent);
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));

    await cleanup();
    const closeOnly = vi.fn();
    await render(<CommandPalette open={false} onClose={closeOnly} groups={groups} />);
    document.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, ctrlKey: true, key: 'k' }),
    );
    expect(closeOnly).not.toHaveBeenCalled();
  });

  it('renders English hints by default and merges partial overrides', async () => {
    const { container } = await render(<CommandPalette inline groups={groups} />);
    expect(container.querySelector('.lyra-cmdk__footer')!.textContent).toContain('navigate');
    expect(container.querySelector('.lyra-cmdk__footer')!.textContent).toContain('select');
    expect(container.querySelector('.lyra-cmdk__footer')!.textContent).toContain('close');

    await cleanup();
    const { container: translated } = await render(
      <CommandPalette inline groups={groups} hints={{ navigate: 'navegar' }} />,
    );
    const footer = translated.querySelector('.lyra-cmdk__footer')!.textContent;
    // A partial override keeps the untouched hints on their defaults.
    expect(footer).toContain('navegar');
    expect(footer).toContain('select');
    expect(footer).toContain('close');
  });
});
