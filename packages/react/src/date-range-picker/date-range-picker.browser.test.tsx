import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { DateRangePicker } from './index';

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

describe('DateRangePicker', () => {
  for (const theme of THEMES) {
    it(`opens through Popover and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const screen = await render(
        <DateRangePicker
          label="Travel dates"
          defaultValue={{ start: '2024-05-10', end: '2024-05-15' }}
          locale="en-US"
        />,
      );
      const trigger = screen.getByRole('button', { name: 'Travel dates' });
      await expect.element(trigger).toHaveTextContent('5/10/2024 – 5/15/2024');
      await userEvent.click(trigger);
      await expect
        .element(screen.getByRole('dialog', { name: 'Date range picker' }))
        .toBeInTheDocument();
      expect(
        (await axe.run(screen.container)).violations.filter((item) => item.id !== 'color-contrast'),
      ).toEqual([]);
    });
  }

  it('reaches the range Calendar by keyboard and normalizes an end picked before its start', async () => {
    const onChange = vi.fn();
    const screen = await render(
      <DateRangePicker
        label="Travel dates"
        value={{ start: new Date(2024, 4, 15), end: null }}
        onChange={onChange}
        locale="en-US"
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Travel dates' });
    await expect.element(trigger).toHaveTextContent('5/15/2024 – …');
    trigger.element().focus();

    await userEvent.keyboard('{Enter}{Tab}{Tab}{Tab}{Tab}');
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Wednesday, May 15, 2024' }).element(),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Friday, May 10, 2024' }));

    expect(onChange).toHaveBeenCalledWith({
      start: new Date(2024, 4, 10),
      end: new Date(2024, 4, 15),
    });
    expect(screen.container.querySelector('.lyra-popover')).toBeNull();
  });

  it('opens its range Calendar inside BottomSheet at the mobile breakpoint', async () => {
    emulateMobile();
    const screen = await render(
      <DateRangePicker
        label="Travel dates"
        value={{ start: new Date(2024, 4, 10), end: null }}
        locale="en-US"
      />,
    );
    await vi.waitFor(() =>
      expect(screen.container.querySelector('.lyra-popover-anchor')).toBeNull(),
    );

    const trigger = screen.getByRole('button', { name: 'Travel dates' });
    await expect.element(trigger).toHaveTextContent('5/10/2024 – …');
    await userEvent.click(trigger);
    await expect.element(screen.getByRole('dialog', { name: 'Travel dates' })).toBeInTheDocument();
    expect(document.querySelector('.lyra-bottomsheet .lyra-cal--sheet')).not.toBeNull();
  });
});
