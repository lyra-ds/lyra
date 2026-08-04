import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { WeeklyScheduleEditor } from './index';

const THEMES = ['light', 'dark'] as const;

function setTheme(theme: (typeof THEMES)[number]): void {
  document.documentElement.toggleAttribute('data-theme', theme === 'dark');
}

afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('WeeklyScheduleEditor', () => {
  for (const theme of THEMES) {
    it(`composes the in-flow copy Popover and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const screen = await render(
        <WeeklyScheduleEditor
          defaultValue={{ 1: [{ start: '09:00', end: '17:00' }] }}
          showExceptions={false}
        />,
      );
      await expect.element(screen.getByRole('switch', { name: 'Monday' })).toBeInTheDocument();
      expect(screen.container.querySelector('.lyra-sched')).not.toBeNull();
      await userEvent.click(screen.getByRole('button', { name: 'Copy Monday to other days' }));
      await expect
        .element(screen.getByRole('dialog', { name: 'Copy schedule' }))
        .toBeInTheDocument();
      expect(
        (await axe.run(screen.container)).violations.filter((item) => item.id !== 'color-contrast'),
      ).toEqual([]);
    });
  }

  it('adds a range and copies cloned local-time ranges to selected days using the keyboard-reachable popover', async () => {
    const onChange = vi.fn();
    const screen = await render(
      <WeeklyScheduleEditor
        defaultValue={{ 1: [{ start: '09:00', end: '17:00' }] }}
        showExceptions={false}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Add interval' }));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        1: [
          { start: '09:00', end: '17:00' },
          { start: '17:00', end: '19:00' },
        ],
      }),
    );

    const copy = screen.getByRole('button', { name: 'Copy Monday to other days' });
    copy.element().focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Tuesday' }));
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        2: [
          { start: '09:00', end: '17:00' },
          { start: '17:00', end: '19:00' },
        ],
      }),
    );
  });
});
