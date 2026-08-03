import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { TimeZonePicker } from './index';

const THEMES = ['light', 'dark'] as const;
const NEW_YORK = [{ value: 'America/New_York', label: 'New York', region: 'Americas' }];
const KOLKATA = [{ value: 'Asia/Kolkata', label: 'Mumbai / New Delhi', region: 'Asia' }];

function setTheme(theme: (typeof THEMES)[number]): void {
  document.documentElement.toggleAttribute('data-theme', theme === 'dark');
}

afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('TimeZonePicker', () => {
  for (const theme of THEMES) {
    it(`composes Combobox and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const screen = await render(
        <TimeZonePicker label="Time zone" zones={NEW_YORK} referenceDate="2024-01-15" />,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Time zone' }));
      await expect.element(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.container.querySelector('.lyra-tzpicker')).not.toBeNull();
      expect(
        (await axe.run(screen.container)).violations.filter((item) => item.id !== 'color-contrast'),
      ).toEqual([]);
    });
  }

  it('returns IANA values and derives New York offsets from the reference date across DST', async () => {
    const onChange = vi.fn();
    const january = await render(
      <TimeZonePicker
        label="Time zone"
        zones={NEW_YORK}
        referenceDate="2024-01-15"
        onChange={onChange}
      />,
    );
    await userEvent.click(january.getByRole('button', { name: 'Time zone' }));
    await expect
      .element(january.getByRole('option', { name: /New York \(GMT-5\)/ }))
      .toBeInTheDocument();
    await userEvent.click(january.getByRole('option', { name: /New York \(GMT-5\)/ }));
    expect(onChange).toHaveBeenCalledWith('America/New_York');

    await cleanup();
    const july = await render(
      <TimeZonePicker label="Time zone" zones={NEW_YORK} referenceDate="2024-07-15" />,
    );
    await userEvent.click(july.getByRole('button', { name: 'Time zone' }));
    await expect
      .element(july.getByRole('option', { name: /New York \(GMT-4\)/ }))
      .toBeInTheDocument();
  });

  it('uses translatable labels and includes invisible IANA and offset search terms', async () => {
    const screen = await render(
      <TimeZonePicker
        zones={NEW_YORK}
        referenceDate="2024-01-15"
        labels={{
          placeholder: 'Choose a zone',
          searchPlaceholder: 'Find a place',
          emptyMessage: 'Nothing found',
        }}
      />,
    );
    await expect.element(screen.getByRole('button', { name: 'Choose a zone' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Choose a zone' }));
    const search = screen.getByRole('combobox', { name: 'Find a place' });
    await userEvent.fill(search, 'gmt-5');
    await expect.element(screen.getByRole('option', { name: /New York/ })).toBeInTheDocument();
  });

  it('deduplicates pinned recent zones and removes their main-list copies', async () => {
    const screen = await render(
      <TimeZonePicker
        label="Time zone"
        zones={NEW_YORK}
        recentZones={['America/New_York', 'America/New_York']}
        referenceDate="2024-01-15"
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Time zone' }));

    expect(screen.getByRole('listbox').element().querySelectorAll('[role=option]')).toHaveLength(1);
    await expect
      .element(screen.getByRole('option', { name: /New York \(GMT-5\)/ }))
      .toBeInTheDocument();
  });

  it('derives half-hour GMT offsets from the reference date', async () => {
    const screen = await render(
      <TimeZonePicker label="Time zone" zones={KOLKATA} referenceDate="2024-01-15" />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Time zone' }));

    await expect
      .element(screen.getByRole('option', { name: /Mumbai \/ New Delhi \(GMT\+5:30\)/ }))
      .toBeInTheDocument();
  });
});
