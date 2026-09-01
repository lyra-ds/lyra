import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from './internal/test-axe';
import { describeRecurrence } from './recurrence-selector';
import lyra from './index';

const mountedHosts: HTMLElement[] = [];
const originalMatchMedia = window.matchMedia;

Alpine.plugin(lyra);

function calendarMarkup(): string {
  return `
    <div x-data="{ get pickerSelected() { return selected }, set pickerSelected(v) { selected = v } }">
      <div class="lyra-cal" x-data="lyraCalendar({ min: recurrenceStartDate() })" x-modelable="selected" x-model="pickerSelected">
        <div class="lyra-cal__head">
          <button class="lyra-cal__nav" x-bind="prev">Previous</button>
          <button class="lyra-cal__label" x-bind="viewButton" x-text="headerLabel()"></button>
          <button class="lyra-cal__nav" x-bind="next">Next</button>
        </div>
        <template x-if="mode === 'days'"><div class="lyra-cal__grid">
          <template x-for="weekday in weekdays()" :key="weekday.key"><span class="lyra-cal__wd" :aria-label="weekday.long" x-text="weekday.narrow"></span></template>
          <template x-for="date in days()" :key="dayKey(date)"><button class="lyra-cal__day" type="button" :class="dayClass(date)" :aria-disabled="dayDisabled(date)" :tabindex="dayTabindex(date)" :aria-label="dayLabel(date)" :aria-pressed="dayPressed(date)" :data-key="dayKey(date)" @click="selectDate(date)" @focus="onDayFocus(date)" @keydown="onDayKeydown($event, date)"><span x-text="date.getDate()"></span></button></template>
        </div></template>
        <template x-if="mode === 'months'"><div class="lyra-cal__mgrid"><template x-for="month in months()" :key="month.getMonth()"><button class="lyra-cal__mcell" type="button" :class="monthClass(month)" @click="pickMonth(month)" x-text="monthName(month)"></button></template></div></template>
        <template x-if="mode === 'years'"><div class="lyra-cal__mgrid"><template x-for="year in years()" :key="year"><button class="lyra-cal__mcell" type="button" :class="yearClass(year)" @click="pickYear(year)" x-text="year"></button></template></div></template>
        <div class="lyra-cal__foot"><button class="lyra-cal__today" x-bind="today"></button></div>
      </div>
    </div>`;
}

/** Canonical consumer template, including the alias scope that chains the date-picker model. */
function recurrenceTemplate(options = '{}', outer = '', model = ''): string {
  return `
    <div ${outer}>
      <div class="lyra-recur" x-data="lyraRecurrenceSelector(${options})" ${model}>
        <span class="lyra-select-wrap"><select class="lyra-input" x-bind="presetSelect">
          <template x-for="preset in presetEntries()" :key="preset.id"><option :value="preset.id" :selected="preset.id === selectedValue()" x-text="preset.label"></option></template>
          <option value="custom" :selected="selectedValue() === 'custom'" x-text="label('custom')"></option>
        </select></span>
        <div class="lyra-recur__custom" x-bind="customSection">
          <div class="lyra-recur__freqrow"><span x-text="label('repeatEvery')"></span><input class="lyra-input" x-bind="intervalInput"><span class="lyra-select-wrap"><select class="lyra-input" x-bind="freqSelect"><option value="weekly" x-text="label('weeks')"></option><option value="monthly" x-text="label('months')"></option></select></span></div>
          <div class="lyra-recur__days" x-bind="weekdayGroup"><template x-for="day in weekdayEntries()" :key="day.index"><button class="lyra-recur__day" x-bind="{ type: 'button' }" :class="dayClass(day.index)" :aria-pressed="dayPressed(day.index)" @click="toggleDay(day.index)" x-text="day.label"></button></template></div>
          <div class="lyra-recur__endrow"><span class="lyra-select-wrap"><select class="lyra-input" x-bind="endSelect"><option value="never" x-text="label('neverEnds')"></option><option value="count" x-text="label('afterOccurrences')"></option><option value="date" x-text="label('onDate')"></option></select></span><input class="lyra-input" x-bind="countInput"><span x-bind="countSuffix"></span>
            <span class="lyra-recur__enddate" x-show="endType() === 'date'">
              <!-- Alias scope prevents selected ↔ selected self-entanglement. -->
              <div x-data="{ get recurrenceEndDate() { return endDate() }, set recurrenceEndDate(v) { setEndDate(v) } }">
                <div class="lyra-datepicker" x-data="lyraDatePicker({ defaultValue: recurrenceEndDate, placeholder: label('endDate') })" x-modelable="selected" x-model="recurrenceEndDate">
                  <template x-if="!mobile"><div x-data="{ get pickerOpen() { return open }, set pickerOpen(v) { open = v } }"><div class="lyra-popover-anchor" x-data="lyraPopover({ ariaLabel: label('endDate') })" x-modelable="open" x-model="pickerOpen"><button class="lyra-input lyra-datepicker__btn" x-bind="trigger"><span :class="{ 'lyra-datepicker__ph': !hasSelection() }" x-text="triggerText()"></span></button><div class="lyra-popover" x-bind="panel">${calendarMarkup()}</div></div></div></template>
                </div>
              </div>
            </span>
          </div>
        </div>
        <span class="lyra-recur__summary" x-bind="summary"></span>
        <span class="lyra-recur__summary" x-bind="conflictsNote"></span>
      </div>
    </div>`;
}

function mount(options = '{}', outer = '', model = ''): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = recurrenceTemplate(options, outer, model);
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

function selector(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-recur');
  if (!element) throw new Error('Expected recurrence selector');
  return element;
}

function data(host: HTMLElement): { value: unknown } {
  return Alpine.$data(selector(host)) as { value: unknown };
}

function setViewport(matches: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi
      .fn()
      .mockReturnValue({ matches, addEventListener: () => {}, removeEventListener: () => {} }),
  });
}

async function flush(): Promise<void> {
  await Alpine.nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

function localIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function calendarDayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

async function expectVisible(element: HTMLElement): Promise<void> {
  await vi.waitFor(() => expect(element.style.display).not.toBe('none'), { timeout: 3000 });
}

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: originalMatchMedia });
});

describe('describeRecurrence', () => {
  it('uses complete templates for frequencies, endings, dates, and label overrides', () => {
    expect(describeRecurrence(null, '2026-08-03')).toBe('Does not repeat');
    expect(describeRecurrence({ freq: 'weekly', byWeekday: [1] }, '2026-08-03')).toBe(
      'Repeats every Monday',
    );
    expect(describeRecurrence({ freq: 'weekly', byWeekday: [1, 3, 5] }, '2026-08-03')).toBe(
      'Repeats every Monday, Wednesday, and Friday',
    );
    expect(
      describeRecurrence(
        { freq: 'weekly', interval: 2, end: { type: 'count', count: 4 } },
        '2026-08-03',
      ),
    ).toBe('Repeats every 2 weeks on Monday, 4 times');
    expect(
      describeRecurrence(
        { freq: 'monthly', end: { type: 'date', date: '2026-08-20' } },
        '2026-08-15',
      ),
    ).toBe('Repeats every month on the 3rd Saturday, until Aug 20, 2026');
    expect(
      describeRecurrence({ freq: 'weekly' }, '2026-08-03', { weekly: 'Localized {days}' }),
    ).toBe('Localized Monday');
  });
});

describe('lyraRecurrenceSelector', () => {
  it('renders weekday-derived presets and replaces the rule while announcing its summary', async () => {
    setViewport(false);
    const host = mount("{ startDate: '2026-08-03', defaultEndCount: 4 }");
    const preset = selector(host).querySelector<HTMLSelectElement>('[aria-label="Recurrence"]');
    if (!preset) throw new Error('Expected preset select');
    expect(Array.from(preset.options, (option) => option.text)).toEqual([
      'Does not repeat',
      'Every week (Mon)',
      'Every 2 weeks (Mon)',
      'Every month (1st Monday)',
      'Custom…',
    ]);
    const expectedRules: Record<string, unknown> = {
      none: { freq: 'none', interval: 1, byWeekday: [], end: { type: 'never' } },
      weekly: {
        freq: 'weekly',
        interval: 1,
        byWeekday: [1],
        end: { type: 'count', count: 4 },
      },
      biweekly: {
        freq: 'weekly',
        interval: 2,
        byWeekday: [1],
        end: { type: 'count', count: 4 },
      },
      monthly: {
        freq: 'monthly',
        interval: 1,
        byWeekday: [1],
        end: { type: 'count', count: 4 },
      },
    };
    for (const [presetId, expectedRule] of Object.entries(expectedRules)) {
      await userEvent.selectOptions(preset, presetId);
      await flush();
      expect(data(host).value).toEqual(expectedRule);
    }
    expect(selector(host).querySelector('[aria-live="polite"]')?.textContent).toBe(
      'Repeats every month on the 1st Monday, 4 times',
    );
    const matching = mount(
      "{ startDate: '2026-08-03', value: { freq: 'weekly', interval: 2, byWeekday: [1], end: { type: 'never' } } }",
    );
    await flush();
    expect(
      selector(matching).querySelector<HTMLSelectElement>('[aria-label="Recurrence"]')?.value,
    ).toBe('biweekly');
  });

  it('opens custom state for unmatched rules and prevents removing the final weekday', async () => {
    setViewport(false);
    const host = mount(
      "{ startDate: '2026-08-03', value: { freq: 'weekly', interval: 3, byWeekday: [1], end: { type: 'never' } } }",
    );
    const custom = selector(host).querySelector<HTMLElement>('.lyra-recur__custom');
    const weekdays = selector(host).querySelector<HTMLElement>('[role="group"]');
    if (!custom || !weekdays) throw new Error('Expected custom weekly editor');
    await expectVisible(custom);
    const monday = Array.from(weekdays.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent === 'Mon',
    );
    if (!monday) throw new Error('Expected Monday toggle');
    await userEvent.click(monday);
    await flush();
    expect(monday.getAttribute('aria-pressed')).toBe('true');
    await userEvent.selectOptions(
      selector(host).querySelector<HTMLSelectElement>('[aria-label="Frequency"]')!,
      'monthly',
    );
    await flush();
    expect(weekdays.style.display).toBe('none');
  });

  it('seeds custom and clamps interval and count end inputs', async () => {
    setViewport(false);
    const host = mount("{ startDate: '2026-08-03', defaultEndCount: 5 }");
    const preset = selector(host).querySelector<HTMLSelectElement>('[aria-label="Recurrence"]');
    if (!preset) throw new Error('Expected preset select');
    await userEvent.selectOptions(preset, 'custom');
    await flush();
    const interval = selector(host).querySelector<HTMLInputElement>('[aria-label="Interval"]');
    const end = selector(host).querySelector<HTMLSelectElement>('[aria-label="Ends"]');
    if (!interval || !end) throw new Error('Expected custom controls');
    await userEvent.fill(interval, '0');
    interval.dispatchEvent(new Event('change', { bubbles: true }));
    await userEvent.selectOptions(end, 'count');
    await flush();
    expect(data(host).value).toEqual({
      freq: 'weekly',
      interval: 1,
      byWeekday: [1],
      end: { type: 'count', count: 5 },
    });
  });

  it('serializes a nested date-picker selection and only dispatches interaction changes', async () => {
    setViewport(false);
    const start = new Date();
    start.setHours(12, 0, 0, 0);
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + 7);
    const startDate = localIso(start);
    const serializedEndDate = localIso(endDate);
    const host = mount(`{ startDate: '${startDate}' }`);
    const events: unknown[] = [];
    selector(host).addEventListener('lyra:change', (event) =>
      events.push((event as CustomEvent).detail),
    );
    await userEvent.selectOptions(
      selector(host).querySelector<HTMLSelectElement>('[aria-label="Recurrence"]')!,
      'custom',
    );
    await userEvent.selectOptions(
      selector(host).querySelector<HTMLSelectElement>('[aria-label="Ends"]')!,
      'date',
    );
    await flush();
    const trigger = selector(host).querySelector<HTMLButtonElement>('.lyra-datepicker__btn');
    if (!trigger) throw new Error('Expected nested date picker');
    await userEvent.click(trigger);
    await flush();
    const day = selector(host).querySelector<HTMLButtonElement>(
      `[data-key="${calendarDayKey(endDate)}"]`,
    );
    if (!day) throw new Error('Expected nested calendar day');
    await userEvent.click(day);
    await flush();
    expect(data(host).value).toEqual({
      freq: 'weekly',
      interval: 1,
      byWeekday: [start.getDay()],
      end: { type: 'date', date: serializedEndDate },
    });
    expect(JSON.parse(JSON.stringify(events.at(-1)))).toEqual(events.at(-1));
    expect(selector(host).querySelector('[aria-live="polite"]')?.textContent).toBe(
      `Repeats every ${start.toLocaleDateString('en-US', { weekday: 'long' })}, until ${endDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    );
  });

  it('syncs modelable state in both directions without emitting for external writes', async () => {
    setViewport(false);
    const host = mount(
      "{ startDate: '2026-08-03' }",
      'x-data="{ outer: { freq: \'none\', interval: 1, byWeekday: [], end: { type: \'never\' } }, events: 0 }" @lyra:change="events++"',
      'x-modelable="value" x-model="outer"',
    );
    const outer = Alpine.$data(host.firstElementChild as HTMLElement) as {
      outer: unknown;
      events: number;
    };
    outer.outer = { freq: 'weekly', interval: 2, byWeekday: [1], end: { type: 'never' } };
    await flush();
    expect(selector(host).querySelector('[aria-live="polite"]')?.textContent).toBe(
      'Repeats every 2 weeks on Monday',
    );
    expect(outer.events).toBe(0);
    await userEvent.selectOptions(
      selector(host).querySelector<HTMLSelectElement>('[aria-label="Recurrence"]')!,
      'weekly',
    );
    await flush();
    expect(outer.outer).toEqual({
      freq: 'weekly',
      interval: 1,
      byWeekday: [1],
      end: { type: 'never' },
    });
  });

  it('renders singular and plural conflict status and is axe clean closed and open', async () => {
    setViewport(false);
    const host = mount("{ startDate: '2026-08-03', conflicts: [{ date: '2026-08-10' }] }");
    const note = selector(host).querySelector<HTMLElement>('[role="status"]');
    expect(note?.textContent).toBe(
      '1 occurrence falls in unavailable time; you can adjust it later.',
    );
    await expectNoAxeViolations(host);
    await userEvent.selectOptions(
      selector(host).querySelector<HTMLSelectElement>('[aria-label="Recurrence"]')!,
      'custom',
    );
    await flush();
    await expectNoAxeViolations(host);
    const plural = mount("{ conflicts: [{ date: '2026-08-10' }, { date: '2026-08-17' }] }");
    expect(plural.querySelector('[role="status"]')?.textContent).toBe(
      '2 occurrences fall in unavailable time; you can adjust them later.',
    );
  });
});
