import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { TimePicker } from './index';

const THEMES = ['light', 'dark'] as const;
const originalMatchMedia = window.matchMedia;

function setTheme(theme: (typeof THEMES)[number]): void {
  document.documentElement.toggleAttribute('data-theme', theme === 'dark');
}

function emulateViewport(matches: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  });
}

// The runner iframe is narrower than the 640px breakpoint, so desktop-path
// tests must pin matchMedia to false the same way the mobile test pins true.
const emulateMobile = (): void => emulateViewport(true);
const emulateDesktop = (): void => emulateViewport(false);

beforeEach(() => emulateDesktop());

afterEach(async () => {
  await cleanup();
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: originalMatchMedia });
  setTheme('light');
});

describe('TimePicker', () => {
  for (const theme of THEMES) {
    it(`opens through its fused trigger and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const screen = await render(
        <TimePicker label="Meeting time" defaultValue="09:00" step={30} min="09:00" max="10:00" />,
      );
      const trigger = screen.getByRole('button', { name: 'Meeting time' });
      await expect.element(trigger).toHaveTextContent('09:00');

      await userEvent.click(trigger);
      await expect
        .element(screen.getByRole('listbox', { name: 'Time options' }))
        .toBeInTheDocument();
      expect(screen.container.querySelector('.lyra-popover-anchor button')).toBe(trigger.element());
      expect(
        (await axe.run(screen.container)).violations.filter((item) => item.id !== 'color-contrast'),
      ).toEqual([]);
    });
  }

  it('supports keyboard opening, selects a value, and closes the Popover', async () => {
    const onChange = vi.fn();
    const screen = await render(
      <TimePicker label="Meeting time" min="09:00" max="10:00" step={30} onChange={onChange} />,
    );
    const trigger = screen.getByRole('button', { name: 'Meeting time' });
    await expect.element(trigger).toHaveTextContent('Select time');
    trigger.element().focus();

    await userEvent.keyboard('{Enter}');
    const listbox = screen.getByRole('listbox', { name: 'Time options' });
    await expect.element(listbox).toBeInTheDocument();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(listbox.element().querySelector('button'));
    await userEvent.click(screen.getByRole('option', { name: '09:30' }));

    expect(onChange).toHaveBeenCalledWith('09:30');
    expect(screen.container.querySelector('[role=listbox]')).toBeNull();
    expect(trigger.element().textContent).toContain('09:30');
  });

  it('opens its time options inside BottomSheet at the mobile breakpoint', async () => {
    emulateMobile();
    const screen = await render(<TimePicker label="Meeting time" defaultValue="09:00" />);
    await vi.waitFor(() =>
      expect(screen.container.querySelector('.lyra-popover-anchor')).toBeNull(),
    );

    const trigger = screen.getByRole('button', { name: 'Meeting time' });
    await expect.element(trigger).toHaveTextContent('09:00');
    await userEvent.click(trigger);
    await expect.element(screen.getByRole('dialog', { name: 'Meeting time' })).toBeInTheDocument();
    expect(document.querySelector('.lyra-bottomsheet .lyra-timelist')).not.toBeNull();
  });
  it('moves between time options with arrows, Home and End', async () => {
    const screen = await render(<TimePicker label="Time" defaultValue="09:00" />);
    await userEvent.click(screen.getByRole('button', { name: 'Time', exact: true }));
    const options = () =>
      Array.from(document.querySelectorAll<HTMLButtonElement>('[role="option"]'));
    options()[0]!.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(options()[1]);
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(options().at(-1));
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(options()[0]);
    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(options()[0]);
  });
});
