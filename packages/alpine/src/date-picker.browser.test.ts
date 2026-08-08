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
    <div class="lyra-cal" x-data="lyraCalendar({ locale })" x-modelable="selected" x-model="pickerSelected">
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
    <button class="lyra-input lyra-datepicker__btn" ${binding} data-testid="date-trigger">
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
function datePickerTemplate(options = '{}', outer = '', model = '', controls = ''): string {
  return `
    <div ${outer}>
      <div class="lyra-datepicker-root" x-data="lyraDatePicker(${options})" ${model}>
        <template x-if="!mobile">
          <div x-data="{ get pickerOpen() { return open }, set pickerOpen(v) { open = v } }">
            <div class="lyra-popover-anchor lyra-datepicker" x-data="lyraPopover({ ariaLabel: 'Date picker' })" x-modelable="open" x-model="pickerOpen">
              ${triggerMarkup('x-bind="trigger"')}
              <div class="lyra-popover" x-bind="panel">${calendarMarkup()}</div>
            </div>
          </div>
        </template>
        <template x-if="mobile">
          <div x-data="{ get pickerOpen() { return open }, set pickerOpen(v) { open = v } }">
          <div class="lyra-datepicker">
            ${triggerMarkup('@click="open = true"')}
          </div>
          <div x-data="lyraBottomSheet()" x-modelable="open" x-model="pickerOpen">
            <div class="lyra-bottomsheet-overlay" x-bind="overlay">
              <div class="lyra-bottomsheet" role="dialog" aria-modal="true" tabindex="-1" aria-labelledby="date-picker-sheet-title" x-bind="panel">
                <div class="lyra-bottomsheet__header">
                  <h2 id="date-picker-sheet-title" class="lyra-bottomsheet__title">Select date</h2>
                  <button class="lyra-bottomsheet__close" x-bind="close">Close</button>
                </div>
                <div class="lyra-bottomsheet__body"><div class="lyra-cal--sheet">${calendarMarkup()}</div></div>
              </div>
            </div>
          </div>
          </div>
        </template>
      </div>
      ${controls}
    </div>
  `;
}

function mountDatePicker(options = '{}', outer = '', model = '', controls = ''): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = datePickerTemplate(options, outer, model, controls);
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

function picker(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-datepicker-root');
  if (!element) throw new Error('Expected date-picker root');
  return element;
}

function trigger(host: HTMLElement): HTMLButtonElement {
  const element = host.querySelector<HTMLButtonElement>('[data-testid="date-trigger"]');
  if (!element) throw new Error('Expected date-picker trigger');
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

function upcomingDay(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date;
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function serializedDayKey(value: unknown): string {
  const date = value instanceof Date ? value : new Date(String(value));
  return dayKey(date);
}

function day(host: HTMLElement, date: Date): HTMLButtonElement {
  const element = host.querySelector<HTMLButtonElement>(`[data-key="${dayKey(date)}"]`);
  if (!element) throw new Error(`Expected ${dayKey(date)} calendar day`);
  return element;
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

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: originalMatchMedia });
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
});

describe('lyraDatePicker', () => {
  it('shows its placeholder text and modifier before a date is selected', () => {
    setViewport(false);
    const host = mountDatePicker();
    const label = trigger(host).querySelector('span');

    expect(label?.textContent).toBe('Select date');
    expect(label?.classList).toContain('lyra-datepicker__ph');
  });

  it('seeds the desktop trigger from defaultValue', () => {
    setViewport(false);
    const host = mountDatePicker("{ defaultValue: '2024-05-01' }");

    expect(trigger(host).textContent).toContain('5/1/2024');
  });

  it('opens the desktop popover, writes the selected day, updates its trigger, and closes', async () => {
    setViewport(false);
    const host = mountDatePicker();
    const selected = upcomingDay();
    const control = trigger(host);

    await userEvent.click(control);
    await flush();
    await expectVisible(popover(host));

    await userEvent.click(day(host, selected));
    await flush();
    await vi.waitFor(() => expect(popover(host).style.display).toBe('none'), { timeout: 3000 });

    expect(control.textContent).toContain(new Intl.DateTimeFormat('en-US').format(selected));
    // The chained x-model serializes Dates to JSON strings — assert the day, not the instance.
    expect(serializedDayKey((Alpine.$data(picker(host)) as { selected: unknown }).selected)).toBe(
      dayKey(selected),
    );
  });

  it('opens the mobile sheet, closes after a day selection, and restores focus to its opener', async () => {
    setViewport(true);
    const host = mountDatePicker();
    const control = trigger(host);
    const selected = upcomingDay();

    control.focus();
    await userEvent.click(control);
    await flush();
    await expectVisible(sheet(host));

    await userEvent.click(day(host, selected));
    await flush();

    expect((Alpine.$data(picker(host)) as { open: boolean }).open).toBe(false);
    expect(sheet(host).classList).toContain('lyra-bottomsheet--closing');
    await vi.waitFor(() => expect(document.activeElement).toBe(control));
  });

  it('synchronizes selected and open through x-modelable in both directions', async () => {
    setViewport(false);
    const selectedHost = mountDatePicker(
      '{}',
      'x-data="{ outerSelected: null, outerOpen: false }"',
      'x-modelable="selected" x-model="outerSelected"',
      '<button type="button" data-testid="external-selected" @click="outerSelected = \'2024-05-20T12:00:00.000Z\'">Set date externally</button>',
    );
    const selected = upcomingDay();
    const externalSelected = selectedHost.querySelector<HTMLButtonElement>(
      '[data-testid="external-selected"]',
    );
    if (!externalSelected) throw new Error('Expected external selected control');

    await userEvent.click(externalSelected);
    await flush();
    expect(trigger(selectedHost).textContent).toContain('5/20/2024');

    await userEvent.click(trigger(selectedHost));
    await flush();
    await expectVisible(popover(selectedHost));
    await userEvent.click(day(selectedHost, selected));
    await flush();
    expect(
      serializedDayKey(
        (Alpine.$data(selectedHost.firstElementChild as HTMLElement) as { outerSelected: unknown })
          .outerSelected,
      ),
    ).toBe(dayKey(selected));

    const openHost = mountDatePicker(
      '{}',
      'x-data="{ outerOpen: false }"',
      'x-modelable="open" x-model="outerOpen"',
      '<button type="button" data-testid="external-open" @click="outerOpen = true">Open externally</button>',
    );
    const externalOpen = openHost.querySelector<HTMLButtonElement>('[data-testid="external-open"]');
    if (!externalOpen) throw new Error('Expected external open control');

    await userEvent.click(externalOpen);
    await flush();
    await expectVisible(popover(openHost));
    await userEvent.click(trigger(openHost));
    await flush();
    expect(
      (Alpine.$data(openHost.firstElementChild as HTMLElement) as { outerOpen: boolean }).outerOpen,
    ).toBe(false);
  });

  it('is axe clean while closed and open', async () => {
    setViewport(false);
    const host = mountDatePicker();

    await expectNoAxeViolations(host);
    await userEvent.click(trigger(host));
    await flush();
    await expectVisible(popover(host));
    await expectNoAxeViolations(host);
  });
});
