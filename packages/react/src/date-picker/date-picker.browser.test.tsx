import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { DatePicker } from './index';

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

describe('DatePicker', () => {
  for (const theme of THEMES) {
    it(`opens through Popover and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const screen = await render(
        <DatePicker label="Start date" defaultValue="2024-05-01" locale="en-US" />,
      );
      const trigger = screen.getByRole('button', { name: 'Start date' });
      await expect.element(trigger).toHaveTextContent('5/1/2024');
      await userEvent.click(trigger);
      await expect.element(screen.getByRole('dialog', { name: 'Date picker' })).toBeInTheDocument();
      await expect
        .element(screen.getByRole('button', { name: 'Wednesday, May 15, 2024' }))
        .toBeInTheDocument();
      await expectNoAxeViolations(screen.container);
    });
  }

  it('reaches the Calendar grid by keyboard, selects a day, and closes the Popover', async () => {
    const onChange = vi.fn();
    const screen = await render(
      <DatePicker
        label="Start date"
        defaultValue="2024-05-01"
        locale="en-US"
        onChange={onChange}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Start date' });
    await expect.element(trigger).toHaveTextContent('5/1/2024');
    trigger.element().focus();

    await userEvent.keyboard('{Enter}{Tab}{Tab}{Tab}{Tab}');
    const selected = screen.getByRole('button', { name: 'Wednesday, May 1, 2024' });
    expect(document.activeElement).toBe(selected.element());
    await userEvent.click(screen.getByRole('button', { name: 'Wednesday, May 15, 2024' }));

    expect(onChange).toHaveBeenCalledWith(new Date(2024, 4, 15));
    expect(screen.container.querySelector('.lyra-popover')).toBeNull();
  });

  it('opens its Calendar inside BottomSheet at the mobile breakpoint', async () => {
    emulateMobile();
    const screen = await render(
      <DatePicker label="Start date" defaultValue="2024-05-01" locale="en-US" />,
    );
    await vi.waitFor(() =>
      expect(screen.container.querySelector('.lyra-popover-anchor')).toBeNull(),
    );

    const trigger = screen.getByRole('button', { name: 'Start date' });
    await expect.element(trigger).toHaveTextContent('5/1/2024');
    await userEvent.click(trigger);
    await expect.element(screen.getByRole('dialog', { name: 'Start date' })).toBeInTheDocument();
    expect(document.querySelector('.lyra-bottomsheet .lyra-cal--sheet')).not.toBeNull();
  });
});
