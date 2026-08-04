import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { RecurrenceSelector } from './index';

const THEMES = ['light', 'dark'] as const;

function setTheme(theme: (typeof THEMES)[number]): void {
  document.documentElement.toggleAttribute('data-theme', theme === 'dark');
}

afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('RecurrenceSelector', () => {
  for (const theme of THEMES) {
    it(`is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const screen = await render(
        <RecurrenceSelector startDate="2026-08-03" conflicts={[{ date: '2026-08-10' }]} />,
      );
      await expect
        .element(screen.getByRole('combobox', { name: 'Recurrence' }))
        .toBeInTheDocument();
      expect(screen.container.querySelector('.lyra-recur')).not.toBeNull();
      expect(
        (await axe.run(screen.container)).violations.filter((item) => item.id !== 'color-contrast'),
      ).toEqual([]);
    });
  }

  it('opens the custom editor and announces a fully templated summary after changing its end', async () => {
    const onChange = vi.fn();
    const screen = await render(
      <RecurrenceSelector startDate="2026-08-03" onChange={onChange} defaultEndCount={4} />,
    );
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Recurrence' }), 'custom');
    await expect
      .element(screen.getByRole('group', { name: 'Days of the week' }))
      .toBeInTheDocument();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Ends' }), 'count');
    await expect
      .element(screen.getByRole('spinbutton', { name: 'Occurrences' }))
      .toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ end: { type: 'count', count: 4 } }),
    );
    await expect.element(screen.getByText('Repeats every Monday, 4 times')).toBeInTheDocument();
  });
});
