import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

const mountedHosts: HTMLElement[] = [];

Alpine.plugin(lyra);

function calendarTemplate(options: Record<string, unknown> | string = {}): string {
  const optionExpression = typeof options === 'string' ? options : JSON.stringify(options);
  return `
    <div class="lyra-cal" x-data='lyraCalendar(${optionExpression})'>
      <div class="lyra-cal__head">
        <button class="lyra-cal__nav" x-bind="prev">Previous</button>
        <button class="lyra-cal__label" x-bind="viewButton" x-text="headerLabel()"></button>
        <button class="lyra-cal__nav" x-bind="next">Next</button>
      </div>
      <template x-if="mode === 'days'"><div class="lyra-cal__grid">
        <template x-for="weekday in weekdays()" :key="weekday.key">
          <span class="lyra-cal__wd" :aria-label="weekday.long" x-text="weekday.narrow"></span>
        </template>
        <template x-for="date in days()" :key="dayKey(date)">
          <button class="lyra-cal__day" type="button"
            :class="dayClass(date)"
            :aria-disabled="dayDisabled(date)"
            :tabindex="dayTabindex(date)"
            :aria-label="dayLabel(date)"
            :aria-pressed="dayPressed(date)"
            :data-key="dayKey(date)"
            @click="selectDate(date)"
            @focus="onDayFocus(date)"
            @keydown="onDayKeydown($event, date)">
            <span x-text="date.getDate()"></span>
            <span class="lyra-cal__dot" x-show="date.getDate() === 15"></span>
          </button>
        </template>
      </div></template>
      <template x-if="mode === 'months'"><div class="lyra-cal__mgrid">
        <template x-for="month in months()" :key="month.getMonth()">
          <button class="lyra-cal__mcell" type="button" :class="monthClass(month)"
            @click="pickMonth(month)" x-text="monthName(month)"></button>
        </template>
      </div></template>
      <template x-if="mode === 'years'"><div class="lyra-cal__mgrid">
        <template x-for="year in years()" :key="year">
          <button class="lyra-cal__mcell" type="button" :class="yearClass(year)"
            @click="pickYear(year)" x-text="year"></button>
        </template>
      </div></template>
      <div class="lyra-cal__foot"><button class="lyra-cal__today" x-bind="today"></button></div>
    </div>
  `;
}

function mountCalendar(options: Record<string, unknown> | string = {}): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = calendarTemplate(options);
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

function root(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-cal');
  if (!element) throw new Error('Expected calendar root');
  return element;
}

function day(host: HTMLElement, iso: string): HTMLButtonElement {
  const [year, month, date] = iso.split('-').map(Number);
  const element = host.querySelector<HTMLButtonElement>(
    `[data-key="${year}-${month - 1}-${date}"]`,
  );
  if (!element) throw new Error(`Expected ${iso} day cell`);
  return element;
}

async function flush(): Promise<void> {
  await Alpine.nextTick();
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

function keydown(element: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key });
  element.dispatchEvent(event);
  return event;
}

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
});

describe('lyraCalendar', () => {
  it('renders a 42-cell week-shifted grid with adjacent-month cells', async () => {
    const host = mountCalendar({ defaultValue: '2024-05-15', weekStartsOn: 1 });
    await flush();

    const cells = root(host).querySelectorAll('.lyra-cal__day');
    expect(cells).toHaveLength(42);
    expect(cells[0]?.getAttribute('data-key')).toBe('2024-3-29');
    expect(day(host, '2024-04-30').classList).toContain('lyra-cal__day--out');
  });

  it('marks today and handles single selection with an ISO change event', async () => {
    const current = new Date();
    const currentIso = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    const host = mountCalendar({ defaultValue: currentIso });
    const changes: string[] = [];
    root(host).addEventListener('lyra:change', (event) => {
      changes.push((event as CustomEvent<{ value: string }>).detail.value);
    });
    await flush();

    const todayCell = day(host, currentIso);
    expect(todayCell.classList).toContain('lyra-cal__day--today');

    const selectedIso = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(Math.min(current.getDate() + 1, 28)).padStart(2, '0')}`;
    day(host, selectedIso).click();
    await flush();
    expect(day(host, selectedIso).classList).toContain('lyra-cal__day--selected');
    expect(day(host, selectedIso).getAttribute('aria-pressed')).toBe('true');
    expect(changes).toEqual([selectedIso]);
  });

  it('completes, reorders, and restarts a date range', async () => {
    const host = mountCalendar({ range: true, defaultValue: { start: '2024-05-10', end: null } });
    const changes: Array<{ start: string | null; end: string | null }> = [];
    root(host).addEventListener('lyra:change', (event) => {
      changes.push(
        (event as CustomEvent<{ value: { start: string | null; end: string | null } }>).detail
          .value,
      );
    });
    await flush();

    day(host, '2024-05-15').click();
    await flush();
    expect(day(host, '2024-05-10').classList).toContain('lyra-cal__day--selected');
    expect(day(host, '2024-05-15').classList).toContain('lyra-cal__day--selected');
    expect(day(host, '2024-05-12').classList).toContain('lyra-cal__day--in-range');
    expect(day(host, '2024-05-10').classList).not.toContain('lyra-cal__day--in-range');
    expect(changes).toEqual([{ start: '2024-05-10', end: '2024-05-15' }]);

    day(host, '2024-05-15').click();
    await flush();
    expect(changes).toEqual([
      { start: '2024-05-10', end: '2024-05-15' },
      { start: '2024-05-15', end: null },
    ]);
    day(host, '2024-05-08').click();
    await flush();
    expect(day(host, '2024-05-08').classList).toContain('lyra-cal__day--selected');
    expect(day(host, '2024-05-15').classList).toContain('lyra-cal__day--selected');
    expect(day(host, '2024-05-10').classList).toContain('lyra-cal__day--in-range');

    day(host, '2024-05-20').click();
    await flush();
    expect(day(host, '2024-05-20').classList).toContain('lyra-cal__day--selected');
    expect(day(host, '2024-05-08').classList).not.toContain('lyra-cal__day--selected');
  });

  it('keeps min, max, and listed disabled dates focusable but unselectable', async () => {
    const host = mountCalendar({
      defaultValue: '2024-05-15',
      min: '2024-05-10',
      max: '2024-05-20',
      disabledDates: ['2024-05-14'],
    });
    await flush();

    for (const iso of ['2024-05-09', '2024-05-14', '2024-05-21']) {
      expect(day(host, iso).getAttribute('aria-disabled')).toBe('true');
      day(host, iso).click();
    }
    await flush();
    expect(day(host, '2024-05-15').classList).toContain('lyra-cal__day--selected');

    const functionHost = mountCalendar(
      '{ defaultValue: "2024-05-15", isDateDisabled: (date) => date.getFullYear() === 2024 && date.getMonth() === 4 && date.getDate() === 13 }',
    );
    await flush();
    expect(day(functionHost, '2024-05-13').getAttribute('aria-disabled')).toBe('true');
    day(functionHost, '2024-05-13').click();
    await flush();
    expect(day(functionHost, '2024-05-15').classList).toContain('lyra-cal__day--selected');
  });

  it('moves roving focus by all day-grid keys and clamps page navigation', async () => {
    const host = mountCalendar({ defaultValue: '2024-01-31', weekStartsOn: 0 });
    await flush();
    const start = day(host, '2024-01-31');
    start.focus();

    for (const [key, expected] of [
      ['ArrowLeft', '2024-01-30'],
      ['ArrowRight', '2024-01-31'],
      ['ArrowUp', '2024-01-24'],
      ['ArrowDown', '2024-01-31'],
      ['Home', '2024-01-28'],
      ['End', '2024-02-03'],
      ['PageDown', '2024-03-03'],
      ['PageUp', '2024-02-03'],
    ] as const) {
      const event = keydown(document.activeElement as HTMLElement, key);
      expect(event.defaultPrevented).toBe(true);
      await vi.waitFor(() => expect(document.activeElement).toBe(day(host, expected)));
    }

    const clampedHost = mountCalendar({ defaultValue: '2024-01-31' });
    await flush();
    const clampedStart = day(clampedHost, '2024-01-31');
    clampedStart.focus();
    keydown(clampedStart, 'PageDown');
    await vi.waitFor(() => expect(document.activeElement).toBe(day(clampedHost, '2024-02-29')));
    expect(root(clampedHost).querySelector('.lyra-cal__label')?.textContent).toContain('February');
    expect(
      root(clampedHost).querySelectorAll<HTMLButtonElement>('.lyra-cal__day[tabindex="0"]'),
    ).toHaveLength(1);
  });

  it('drills through month and year grids from the selected anchor', async () => {
    const host = mountCalendar({ defaultValue: '2024-05-15' });
    await flush();
    const viewButton = root(host).querySelector<HTMLButtonElement>('.lyra-cal__label');
    if (!viewButton) throw new Error('Expected view button');

    viewButton.click();
    await flush();
    expect(root(host).querySelectorAll('.lyra-cal__mcell')).toHaveLength(12);
    Array.from(root(host).querySelectorAll<HTMLButtonElement>('.lyra-cal__mcell'))
      .find((cell) => cell.textContent === 'Aug')
      ?.click();
    await flush();
    expect(root(host).querySelector('.lyra-cal__label')?.textContent).toContain('August');

    viewButton.click();
    viewButton.click();
    await flush();
    expect(root(host).querySelector('.lyra-cal__label')?.textContent).toContain('2016 – 2027');
  });

  it('normalizes ISO defaults and synchronizes selected through x-modelable without external events', async () => {
    const host = document.createElement('div');
    host.innerHTML = `
      <div x-data="{ outer: new Date(2024, 4, 12) }">
        <div class="lyra-cal" x-data="lyraCalendar({ defaultValue: '2024-05-15' })" x-modelable="selected" x-model="outer">
          <button class="lyra-cal__nav" x-bind="prev"></button><button class="lyra-cal__label" x-bind="viewButton" x-text="headerLabel()"></button><button class="lyra-cal__nav" x-bind="next"></button>
          <div class="lyra-cal__grid"><template x-for="date in days()" :key="dayKey(date)"><button class="lyra-cal__day" type="button" :class="dayClass(date)" :aria-disabled="dayDisabled(date)" :tabindex="dayTabindex(date)" :aria-label="dayLabel(date)" :aria-pressed="dayPressed(date)" :data-key="dayKey(date)" @click="selectDate(date)" @focus="onDayFocus(date)" @keydown="onDayKeydown($event, date)"></button></template></div>
        </div>
        <button type="button" data-testid="external" @click="outer = new Date(2024, 4, 20)">Set external</button>
      </div>
    `;
    document.body.appendChild(host);
    Alpine.initTree(host);
    mountedHosts.push(host);
    const calendar = root(host);
    const changes: unknown[] = [];
    calendar.addEventListener('lyra:change', (event) =>
      changes.push((event as CustomEvent).detail),
    );
    await flush();

    expect(day(host, '2024-05-12').classList).toContain('lyra-cal__day--selected');
    host.querySelector<HTMLButtonElement>('[data-testid="external"]')?.click();
    await flush();
    expect(day(host, '2024-05-20').classList).toContain('lyra-cal__day--selected');
    expect(changes).toEqual([]);

    day(host, '2024-05-18').click();
    await flush();
    // The x-model channel serializes Dates to JSON strings (the same is true of Livewire
    // entangle) — accept either shape on the outer side, like the component does on its own.
    const outer = (Alpine.$data(host.firstElementChild as HTMLElement) as { outer: Date | string })
      .outer;
    expect(new Date(outer).getDate()).toBe(18);
  });

  it('is axe clean in days, months, and years views', async () => {
    const host = mountCalendar({ defaultValue: '2024-05-15' });
    await flush();
    await expectNoAxeViolations(root(host));
    root(host).querySelector<HTMLButtonElement>('.lyra-cal__label')?.click();
    await flush();
    await expectNoAxeViolations(root(host));
    root(host).querySelector<HTMLButtonElement>('.lyra-cal__label')?.click();
    await flush();
    await expectNoAxeViolations(root(host));
  });
});
