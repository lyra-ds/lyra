import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { Calendar } from './index';

const THEMES = ['light', 'dark'] as const;

function setTheme(theme: (typeof THEMES)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}

afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('Calendar', () => {
  for (const theme of THEMES) {
    it(`emits Calendar classes and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const { container, getByRole } = await render(
        <Calendar defaultValue="2024-05-15" todayButton size="md" />,
      );
      await expect.element(getByRole('button', { name: 'Previous month' })).toBeInTheDocument();
      expect(container.querySelector('.lyra-cal')!.className).toBe('lyra-cal lyra-cal--md');
      expect(container.querySelector('.lyra-cal__head')!.className).toBe('lyra-cal__head');
      expect(container.querySelector('.lyra-cal__grid')!.className).toBe('lyra-cal__grid');
      expect(container.querySelector('.lyra-cal__day--selected')!.className).toContain(
        'lyra-cal__day',
      );
      expect(container.querySelector('.lyra-cal__foot')!.className).toBe('lyra-cal__foot');
      await expectNoAxeViolations(container);
    });
  }

  it('navigates months and uses the supplied locale for headings and weekday initials', async () => {
    const screen = await render(<Calendar defaultValue="2024-05-15" locale="fr-FR" />);
    expect(screen.container.querySelector('.lyra-cal__label')!.textContent).toContain('mai');
    await screen.getByRole('button', { name: 'Next month' }).click();
    expect(screen.container.querySelector('.lyra-cal__label')!.textContent).toContain('juin');
    await screen.getByRole('button', { name: 'Previous month' }).click();
    expect(screen.container.querySelectorAll('.lyra-cal__wd')[0]!.textContent).toBe('D');
  });

  it('selects dates, completes ranges, and does not select disabled dates', async () => {
    const onChange = vi.fn();
    const screen = await render(
      <Calendar
        range
        defaultValue={{ start: new Date(2024, 4, 1), end: new Date(2024, 4, 1) }}
        isDateDisabled={(date) =>
          date.getFullYear() === 2024 && date.getMonth() === 4 && date.getDate() === 14
        }
        onChange={onChange}
      />,
    );
    const disabled = screen.getByRole('button', { name: 'Tuesday, May 14, 2024' });
    await expect.element(disabled).toBeInTheDocument();
    expect(disabled.element().getAttribute('aria-disabled')).toBe('true');
    await disabled.click({ force: true });
    expect(onChange).not.toHaveBeenCalled();
    await screen.getByRole('button', { name: 'Wednesday, May 15, 2024' }).click();
    await screen.getByRole('button', { name: 'Friday, May 17, 2024' }).click();
    expect(onChange).toHaveBeenLastCalledWith({
      start: new Date(2024, 4, 15),
      end: new Date(2024, 4, 17),
    });
    expect(screen.container.querySelectorAll('.lyra-cal__day--selected')).toHaveLength(2);
    expect(screen.container.querySelectorAll('.lyra-cal__day--in-range')).toHaveLength(1);
  });

  it('keeps aria-disabled dates focusable and visually equivalent to native disabled days', async () => {
    const screen = await render(
      <>
        <Calendar
          defaultValue="2024-05-15"
          isDateDisabled={(date) =>
            date.getFullYear() === 2024 && date.getMonth() === 4 && date.getDate() === 14
          }
        />
        <button className="lyra-cal__day" disabled type="button">
          Native disabled day
        </button>
      </>,
    );
    const unavailable = screen.getByRole('button', { name: 'Tuesday, May 14, 2024' });
    const nativeDisabled = screen.getByRole('button', { name: 'Native disabled day' });
    await expect.element(unavailable).toBeInTheDocument();

    unavailable.element().focus();
    expect(document.activeElement).toBe(unavailable.element());
    expect((unavailable.element() as HTMLButtonElement).disabled).toBe(false);
    expect(unavailable.element().getAttribute('aria-disabled')).toBe('true');
    expect(getComputedStyle(unavailable.element()).opacity).toBe(
      getComputedStyle(nativeDisabled.element()).opacity,
    );
    expect(getComputedStyle(unavailable.element()).color).toBe(
      getComputedStyle(nativeDisabled.element()).color,
    );
  });

  it('uses roving tabindex and moves the focused local date with grid keys', async () => {
    const screen = await render(<Calendar defaultValue="2024-05-15" />);
    const selected = screen.getByRole('button', { name: 'Wednesday, May 15, 2024' });
    selected.element().focus();
    await userEvent.keyboard('{ArrowDown}');
    const nextWeek = screen.getByRole('button', { name: 'Wednesday, May 22, 2024' });
    await expect.element(nextWeek).toBeInTheDocument();
    expect(document.activeElement).toBe(nextWeek.element());
    expect((nextWeek.element() as HTMLButtonElement).tabIndex).toBe(0);
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Sunday, May 19, 2024' }).element(),
    );
    await userEvent.keyboard('{PageDown}');
    expect(screen.container.querySelector('.lyra-cal__label')!.textContent).toContain('June');
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Wednesday, June 19, 2024' }).element(),
    );
  });
  it('renames the navigation buttons to match the months and years views', async () => {
    const screen = await render(<Calendar defaultValue="2024-05-10" />);
    await expect
      .element(screen.getByRole('button', { name: 'Previous month' }))
      .toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Change month or year' }));
    await expect.element(screen.getByRole('button', { name: 'Previous year' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Change month or year' }));
    await expect
      .element(screen.getByRole('button', { name: 'Previous years' }))
      .toBeInTheDocument();
  });
});
