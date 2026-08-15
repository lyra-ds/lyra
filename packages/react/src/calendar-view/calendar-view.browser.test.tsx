import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { CalendarView } from './index';

const THEMES = ['light', 'dark'] as const;
const KINDS = ['session', 'program-session', 'pending', 'block', 'external'] as const;

type RGB = readonly [number, number, number];

function parseRgb(color: string): RGB {
  const match = color.match(/^rgba?\((.*)\)$/);
  const channels = match?.[1].match(/\d+(?:\.\d+)?/g)?.map(Number);
  if (
    !channels ||
    (channels.length !== 3 && (channels.length !== 4 || channels[3] !== 1)) ||
    channels
      .slice(0, 3)
      .some((channel) => !Number.isInteger(channel) || channel < 0 || channel > 255)
  ) {
    throw new Error(`Expected a resolved opaque rgb color, received ${color}`);
  }
  return [channels[0], channels[1], channels[2]];
}

function relativeLuminance([red, green, blue]: RGB): number {
  const channels = [red, green, blue].map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(parseRgb(foreground));
  const backgroundLuminance = relativeLuminance(parseRgb(background));
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
}

function setTheme(theme: (typeof THEMES)[number]): void {
  document.documentElement.toggleAttribute('data-theme', theme === 'dark');
}

afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('CalendarView', () => {
  for (const theme of THEMES) {
    it(`renders the local week grid and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const screen = await render(
        <CalendarView
          defaultDate="2026-08-03"
          events={KINDS.map((kind, index) => ({
            id: kind,
            kind,
            start: `2026-08-03T${String(8 + index).padStart(2, '0')}:00`,
            end: `2026-08-03T${String(9 + index).padStart(2, '0')}:00`,
            title: kind,
          }))}
        />,
      );

      await expect
        .element(screen.getByRole('button', { name: 'Previous period' }))
        .toBeInTheDocument();
      expect(screen.container.querySelector('.lyra-calview')).not.toBeNull();
      expect(screen.container.querySelector('.lyra-calview__grid')).not.toBeNull();

      for (const kind of KINDS) {
        const chip = screen.container.querySelector(`.lyra-calview__evt--${kind}`);
        expect(chip).not.toBeNull();
        // The modifier is a semantic shape hook as well as the color hook. CSS makes pending
        // dashed, block hatched, and external outlined; the two solid kinds retain their distinct
        // semantic modifiers instead of relying on color-only identification.
        expect(chip!.classList.contains(`lyra-calview__evt--${kind}`)).toBe(true);
      }
      expect(
        getComputedStyle(screen.container.querySelector('.lyra-calview__evt--pending')!)
          .borderTopStyle,
      ).toBe('dashed');
      expect(
        getComputedStyle(screen.container.querySelector('.lyra-calview__evt--block')!)
          .backgroundImage,
      ).toContain('repeating-linear-gradient');
      expect(
        getComputedStyle(screen.container.querySelector('.lyra-calview__evt--external')!)
          .borderTopStyle,
      ).toBe('solid');
      const session = screen.container.querySelector<HTMLElement>('.lyra-calview__evt--session')!;
      const programSession = screen.container.querySelector<HTMLElement>(
        '.lyra-calview__evt--program-session',
      )!;
      expect(
        contrastRatio(getComputedStyle(session).color, getComputedStyle(session).backgroundColor),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(
          getComputedStyle(programSession).color,
          getComputedStyle(programSession).backgroundColor,
        ),
      ).toBeGreaterThanOrEqual(4.5);
      await expectNoAxeViolations(screen.container);
    });
  }

  it('uses Intl headings, switches to the month grid, and preserves the same kind modifiers', async () => {
    const screen = await render(
      <CalendarView
        defaultDate="2026-08-03"
        locale="fr-FR"
        events={[
          {
            id: 'pending',
            kind: 'pending',
            start: '2026-08-03T10:00',
            end: '2026-08-03T11:00',
            title: 'En attente',
          },
        ]}
      />,
    );

    expect(screen.container.querySelector('.lyra-calview__title')!.textContent).toContain('août');
    await screen.getByRole('button', { name: 'Month' }).click();
    await expect.element(screen.getByRole('button', { name: /En attente/ })).toBeInTheDocument();
    expect(
      screen.container.querySelector('.lyra-calview__mevt.lyra-calview__evt--pending'),
    ).not.toBeNull();
  });

  it('shows the correct month-view overflow count after three events', async () => {
    const screen = await render(
      <CalendarView
        defaultDate="2026-08-03"
        defaultView="month"
        events={Array.from({ length: 5 }, (_, index) => ({
          id: `event-${index}`,
          start: `2026-08-03T${String(8 + index).padStart(2, '0')}:00`,
          end: `2026-08-03T${String(9 + index).padStart(2, '0')}:00`,
          title: `Event ${index + 1}`,
        }))}
      />,
    );

    await expect.element(screen.getByText('+2')).toBeInTheDocument();
    const dayCell = screen.container.querySelector('.lyra-calview__more')!.parentElement;
    expect(dayCell!.querySelectorAll('.lyra-calview__mevt')).toHaveLength(3);
  });

  it('snaps empty-grid clicks to a local slot and positions a popover from real browser measurements', async () => {
    const onSlotCreate = vi.fn();
    const screen = await render(
      <CalendarView
        defaultDate="2026-08-03"
        onSlotCreate={onSlotCreate}
        renderEventPopover={(event, close) => (
          <button type="button" onClick={close}>
            Close {event.title}
          </button>
        )}
        events={[
          {
            id: 'session',
            kind: 'session',
            start: '2026-08-03T10:00',
            end: '2026-08-03T11:00',
            title: 'Maya',
          },
        ]}
      />,
    );
    const column = screen.container.querySelector('.lyra-calview__col') as HTMLDivElement;
    const columnRect = column.getBoundingClientRect();
    column.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        clientX: columnRect.left + 12,
        clientY: columnRect.top + 48,
      }),
    );
    expect(onSlotCreate).toHaveBeenCalledWith(new Date(2026, 7, 3, 8, 0, 0, 0));

    const chip = screen.getByRole('button', { name: /Maya/ });
    const scroll = screen.container.querySelector('.lyra-calview__scroll') as HTMLDivElement;
    const chipRect = chip.element().getBoundingClientRect();
    const scrollRect = scroll.getBoundingClientRect();
    await chip.click();
    await expect.element(screen.getByRole('dialog', { name: 'Maya' })).toBeInTheDocument();

    expect(chipRect.width).toBeGreaterThan(0);
    expect(scrollRect.width).toBeGreaterThan(0);
    const popover = screen.getByRole('dialog', { name: 'Maya' }).element() as HTMLDivElement;
    expect(popover.style.top).toBe(
      `${chipRect.top - scrollRect.top + scroll.scrollTop + Math.min(chipRect.height, 32)}px`,
    );
    expect(popover.style.left).toBe(
      `${Math.max(0, Math.min(chipRect.left - scrollRect.left + 8, scrollRect.width - 240))}px`,
    );
  });

  it('closes an open popover on resize instead of using stale measurements', async () => {
    const screen = await render(
      <CalendarView
        defaultDate="2026-08-03"
        renderEventPopover={(event) => <span>{event.title} details</span>}
        events={[
          {
            id: 'session',
            start: '2026-08-03T10:00',
            end: '2026-08-03T11:00',
            title: 'Maya',
          },
        ]}
      />,
    );

    await screen.getByRole('button', { name: /Maya/ }).click();
    await expect.element(screen.getByRole('dialog', { name: 'Maya' })).toBeInTheDocument();
    window.dispatchEvent(new Event('resize'));
    await expect.element(screen.getByRole('dialog', { name: 'Maya' })).not.toBeInTheDocument();
  });

  it('clamps a popover to the left edge in a narrow scroll container', async () => {
    const screen = await render(
      <CalendarView
        defaultDate="2026-08-03"
        style={{ width: 200 }}
        renderEventPopover={(event) => <span>{event.title} details</span>}
        events={[
          {
            id: 'session',
            start: '2026-08-03T10:00',
            end: '2026-08-03T11:00',
            title: 'Maya',
          },
        ]}
      />,
    );
    const scroll = screen.container.querySelector('.lyra-calview__scroll') as HTMLDivElement;
    expect(scroll.getBoundingClientRect().width).toBeGreaterThan(0);
    expect(scroll.getBoundingClientRect().width).toBeLessThan(240);

    await screen.getByRole('button', { name: /Maya/ }).click();
    const popover = screen.getByRole('dialog', { name: 'Maya' }).element() as HTMLDivElement;
    expect(Number.parseFloat(popover.style.left)).toBeGreaterThanOrEqual(0);
  });
});
