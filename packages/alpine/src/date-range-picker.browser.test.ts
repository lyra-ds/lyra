import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

const mountedHosts: HTMLElement[] = [];
const originalMatchMedia = window.matchMedia;

Alpine.plugin(lyra);

function calendarMarkup(): string {
  return `
    <div x-data="{ get pickerSelected() { return selected }, set pickerSelected(v) { selected = v } }">
    <div class="lyra-cal" x-data="lyraCalendar({ range: true, locale })" x-modelable="selected" x-model="pickerSelected">
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
    </div>
  `;
}

function triggerMarkup(binding = ''): string {
  return `
    <button class="lyra-input lyra-datepicker__btn" ${binding} data-testid="date-range-trigger">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M8 2v4M16 2v4" />
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M3 10h18" />
      </svg>
      <span :class="{ 'lyra-datepicker__ph': !hasSelection() }" x-text="triggerText()"></span>
    </button>
  `;
}

/** The canonical thin-coordinator composition used by consumers. */
function dateRangePickerTemplate(options = '{}', outer = '', model = '', controls = ''): string {
  return `
    <div ${outer}>
      <div class="lyra-date-range-picker-root" x-data="lyraDateRangePicker(${options})" ${model}>
        <template x-if="!mobile"><div x-data="{ get pickerOpen() { return open }, set pickerOpen(v) { open = v } }">
          <div class="lyra-popover-anchor lyra-datepicker" x-data="lyraPopover({ ariaLabel: 'Date range picker' })" x-modelable="open" x-model="pickerOpen">
            ${triggerMarkup('x-bind="trigger"')}
            <div class="lyra-popover" x-bind="panel">${calendarMarkup()}</div>
          </div>
        </div></template>
        <template x-if="mobile"><div>
          <div class="lyra-datepicker">${triggerMarkup('@click="open = true"')}</div>
          <div x-data="{ get pickerOpen() { return open }, set pickerOpen(v) { open = v } }">
          <div x-data="lyraBottomSheet()" x-modelable="open" x-model="pickerOpen">
            <div class="lyra-bottomsheet-overlay" x-bind="overlay">
              <div class="lyra-bottomsheet" role="dialog" aria-modal="true" tabindex="-1" aria-labelledby="date-range-picker-sheet-title" x-bind="panel">
                <div class="lyra-bottomsheet__header">
                  <h2 id="date-range-picker-sheet-title" class="lyra-bottomsheet__title">Select period</h2>
                  <button class="lyra-bottomsheet__close" x-bind="close">Close</button>
                </div>
                <div class="lyra-bottomsheet__body"><div class="lyra-cal--sheet">${calendarMarkup()}</div></div>
              </div>
            </div>
          </div>
          </div>
        </div></template>
      </div>
      ${controls}
    </div>
  `;
}

function mountDateRangePicker(options = '{}', outer = '', model = '', controls = ''): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = dateRangePickerTemplate(options, outer, model, controls);
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

function picker(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-date-range-picker-root');
  if (!element) throw new Error('Expected date-range-picker root');
  return element;
}

function trigger(host: HTMLElement): HTMLButtonElement {
  const element = host.querySelector<HTMLButtonElement>('[data-testid="date-range-trigger"]');
  if (!element) throw new Error('Expected date-range-picker trigger');
  return element;
}

function popover(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-popover');
  if (!element) throw new Error('Expected popover');
  return element;
}

function sheet(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-bottomsheet');
  if (!element) throw new Error('Expected bottom sheet');
  return element;
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function day(host: HTMLElement, date: Date): HTMLButtonElement {
  const element = host.querySelector<HTMLButtonElement>(`[data-key="${dayKey(date)}"]`);
  if (!element) throw new Error(`Expected ${dayKey(date)} calendar day`);
  return element;
}

function daysFromToday(): [Date, Date, Date] {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const restart = new Date(end);
  restart.setDate(restart.getDate() + 1);
  return [start, end, restart];
}

function setViewport(matches: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  });
}

async function flush(): Promise<void> {
  await Alpine.nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

async function expectVisible(element: HTMLElement): Promise<void> {
  await vi.waitFor(() => expect(element.style.display).not.toBe('none'), { timeout: 3000 });
}

function serializedDayKey(value: unknown): string {
  const date = value instanceof Date ? value : new Date(String(value));
  return dayKey(date);
}

function serializedRangeDayKeys(value: unknown): { start: string; end: string } {
  const range = value as { start: unknown; end: unknown };
  return { start: serializedDayKey(range.start), end: serializedDayKey(range.end) };
}

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: originalMatchMedia });
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
});

describe('lyraDateRangePicker', () => {
  it('shows its placeholder text and modifier before a range is selected', () => {
    setViewport(false);
    const host = mountDateRangePicker();
    const label = trigger(host).querySelector('span');

    expect(label?.textContent).toBe('Select period');
    expect(label?.classList).toContain('lyra-datepicker__ph');
  });

  it('seeds the trigger from defaultValue', () => {
    setViewport(false);
    const host = mountDateRangePicker(
      "{ defaultValue: { start: '2024-05-01', end: '2024-05-05' } }",
    );

    expect(trigger(host).textContent).toContain('5/1/2024 – 5/5/2024');
  });

  it('keeps an incomplete desktop range open, closes a complete one, and reopens for a restart', async () => {
    setViewport(false);
    const host = mountDateRangePicker();
    const control = trigger(host);
    const [start, end, restart] = daysFromToday();
    const formatter = new Intl.DateTimeFormat('en-US');

    await userEvent.click(control);
    await flush();
    await expectVisible(popover(host));

    await userEvent.click(day(host, start));
    await flush();
    await expectVisible(popover(host));
    expect(control.textContent).toContain(`${formatter.format(start)} – …`);

    await userEvent.click(day(host, end));
    await flush();
    await vi.waitFor(() => expect(popover(host).style.display).toBe('none'), { timeout: 3000 });
    expect(control.textContent).toContain(`${formatter.format(start)} – ${formatter.format(end)}`);

    await userEvent.click(control);
    await flush();
    await expectVisible(popover(host));
    await userEvent.click(day(host, restart));
    await flush();
    await expectVisible(popover(host));
    expect(control.textContent).toContain(`${formatter.format(restart)} – …`);
  });

  it('keeps the state-forced mobile sheet open for a start and closes it for an end', async () => {
    setViewport(true);
    const host = mountDateRangePicker();
    const [start, end] = daysFromToday();

    await userEvent.click(trigger(host));
    await flush();
    await expectVisible(sheet(host));

    await userEvent.click(day(host, start));
    await flush();
    await expectVisible(sheet(host));

    await userEvent.click(day(host, end));
    await flush();
    expect((Alpine.$data(picker(host)) as { open: boolean }).open).toBe(false);
    // The sheet hides only after its exit animation; finalize presence like the
    // bottom-sheet suite does.
    expect(sheet(host).classList).toContain('lyra-bottomsheet--closing');
    sheet(host).dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
    const overlay = host.querySelector<HTMLElement>('.lyra-bottomsheet-overlay');
    if (!overlay) throw new Error('Expected bottom-sheet overlay');
    await vi.waitFor(() => expect(overlay.style.display).toBe('none'), { timeout: 3000 });
  });

  it('synchronizes selected through x-modelable in both directions', async () => {
    setViewport(false);
    const externalHost = mountDateRangePicker(
      '{}',
      'x-data="{ outerSelected: { start: null, end: null } }"',
      'x-modelable="selected" x-model="outerSelected"',
      '<button type="button" data-testid="external-selected" @click="outerSelected = { start: \'2024-05-20T12:00:00.000Z\', end: null }">Set range externally</button>',
    );
    const external = externalHost.querySelector<HTMLButtonElement>(
      '[data-testid="external-selected"]',
    );
    if (!external) throw new Error('Expected external selected control');
    const formatter = new Intl.DateTimeFormat('en-US');

    await userEvent.click(external);
    await flush();
    expect(trigger(externalHost).textContent).toContain(
      `${formatter.format(new Date(2024, 4, 20))} – …`,
    );

    const internalHost = mountDateRangePicker(
      '{}',
      'x-data="{ outerSelected: { start: null, end: null } }"',
      'x-modelable="selected" x-model="outerSelected"',
    );
    const [start, end] = daysFromToday();

    await userEvent.click(trigger(internalHost));
    await flush();
    await expectVisible(popover(internalHost));
    await userEvent.click(day(internalHost, start));
    await flush();
    await expectVisible(popover(internalHost));
    await userEvent.click(day(internalHost, end));
    await flush();

    const outerSelected = (
      Alpine.$data(internalHost.firstElementChild as HTMLElement) as { outerSelected: unknown }
    ).outerSelected;
    expect(serializedRangeDayKeys(outerSelected)).toEqual({
      start: dayKey(start),
      end: dayKey(end),
    });
  });

  it('is axe clean while closed and with the desktop range popover open', async () => {
    setViewport(false);
    const host = mountDateRangePicker();

    await expectNoAxeViolations(host);
    await userEvent.click(trigger(host));
    await flush();
    await expectVisible(popover(host));
    await expectNoAxeViolations(host);
  });
});
