import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { SlotPicker } from './index';

const THEMES = ['light', 'dark'] as const;

function setTheme(theme: (typeof THEMES)[number]): void {
  document.documentElement.toggleAttribute('data-theme', theme === 'dark');
}

afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('SlotPicker', () => {
  for (const theme of THEMES) {
    it(`shows a timezone-aware slot picker and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const screen = await render(
        <SlotPicker
          timezone="America/New_York"
          defaultDate="2026-08-03"
          slots={[{ start: '2026-08-04T02:00:00Z', end: '2026-08-04T03:00:00Z' }]}
        />,
      );
      await expect
        .element(screen.getByRole('listbox', { name: /Available times/ }))
        .toBeInTheDocument();
      expect(screen.container.querySelector('.lyra-slotpicker')).not.toBeNull();
      await expectNoAxeViolations(screen.container);
    });
  }

  it('groups a UTC-next-day slot on the prior calendar day in a westward display zone', async () => {
    const screen = await render(
      <SlotPicker
        timezone="America/New_York"
        defaultDate="2026-08-03"
        slots={[{ start: '2026-08-04T02:00:00Z', end: '2026-08-04T03:00:00Z' }]}
      />,
    );
    await expect.element(screen.getByRole('option', { name: '10:00 PM' })).toBeInTheDocument();
  });

  it('groups a UTC-day slot on the following calendar day in an eastward display zone and confirms only after selection', async () => {
    const onConfirm = vi.fn();
    const slot = { start: '2026-08-03T23:30:00Z', end: '2026-08-04T00:00:00Z' };
    const screen = await render(
      <SlotPicker
        timezone="Asia/Tokyo"
        defaultDate="2026-08-04"
        slots={[slot]}
        onConfirm={onConfirm}
      />,
    );
    await userEvent.click(screen.getByRole('option', { name: '08:30 AM' }));
    await expect.element(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledWith(slot);
  });

  it('forwards a non-default locale and TimeZonePicker labels to the embedded control', async () => {
    const screen = await render(
      <SlotPicker
        timezone="America/New_York"
        defaultDate="2026-08-03"
        locale="fr-FR"
        slots={[{ start: '2026-08-03T13:00:00Z', end: '2026-08-03T14:00:00Z' }]}
        labels={{
          changeTimeZone: 'Modifier le fuseau horaire',
          timeZonePicker: { searchPlaceholder: 'Rechercher un lieu' },
        }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Modifier le fuseau horaire' }));
    // The search input only exists with the zone Combobox open.
    await userEvent.click(screen.getByRole('button', { name: /Select time zone|New York/ }));
    // searchPlaceholder drives the input's placeholder (the accessible name
    // comes from the picker's own label) — assert the forwarded value there.
    const search = screen.getByRole('combobox');
    await expect.element(search).toBeInTheDocument();
    expect(search.element().getAttribute('placeholder')).toBe('Rechercher un lieu');
    const trailing = screen
      .getByRole('option', { name: /New York/ })
      .element()
      .querySelector('.lyra-combobox__trailing')?.textContent;
    expect(trailing).toMatch(/^\d{2}:\d{2}$/);
  });
});
