import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';
import type { DateException, WeeklySchedule } from './weekly-schedule-editor';

const mountedHosts: HTMLElement[] = [];
const originalMatchMedia = window.matchMedia;

Alpine.plugin(lyra);

function calendarMarkup(): string {
  return `
    <div x-data="{ get pickerSelected() { return selected }, set pickerSelected(v) { selected = v } }">
      <div class="lyra-cal" x-data="lyraCalendar({ min: new Date() })" x-modelable="selected" x-model="pickerSelected">
        <div class="lyra-cal__head"><button class="lyra-cal__nav" x-bind="prev">Previous</button><button class="lyra-cal__label" x-bind="viewButton" x-text="headerLabel()"></button><button class="lyra-cal__nav" x-bind="next">Next</button></div>
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

function timeInputMarkup(field: 'start' | 'end'): string {
  const alias = field === 'start' ? 'rangeStart' : 'rangeEnd';
  const setter = field === 'start' ? 'setRangeStart' : 'setRangeEnd';
  const label = field === 'start' ? 'startTime' : 'endTime';
  const invalid =
    field === 'end'
      ? ' :aria-invalid="invalid(range) ? true : false" :class="{ \'lyra-input--error\': invalid(range) }"'
      : '';
  return `
    <div class="lyra-timeinput" x-data="{ get ${alias}() { return range.${field} }, set ${alias}(v) { ${setter}(day, index, v) } }">
      <div x-data="lyraTimeInput({ defaultValue: ${alias} })" x-modelable="selected" x-model="${alias}">
        <input class="lyra-input" x-bind="input" :aria-label="label('${label}', { day: dayLabel(day) })"${invalid}>
        <button class="lyra-timeinput__step" x-bind="down" aria-label="Decrease ${field} time">−</button>
        <button class="lyra-timeinput__step" x-bind="up" aria-label="Increase ${field} time">+</button>
      </div>
    </div>`;
}

function exceptionPickerMarkup(): string {
  return `
    <div x-data="{ get exceptionDate() { return null }, set exceptionDate(v) { addException(v) } }">
      <div class="lyra-datepicker" x-data="lyraDatePicker({ placeholder: label('addException') })" x-modelable="selected" x-model="exceptionDate">
        <template x-if="!mobile"><div>
          <div x-data="{ get pickerOpen() { return open }, set pickerOpen(v) { open = v } }">
            <div class="lyra-popover-anchor" x-data="lyraPopover({ ariaLabel: label('addException') })" x-modelable="open" x-model="pickerOpen">
              <button class="lyra-input lyra-datepicker__btn" x-bind="trigger"><span :class="{ 'lyra-datepicker__ph': !hasSelection() }" x-text="triggerText()"></span></button>
              <div class="lyra-popover" x-bind="panel">${calendarMarkup()}</div>
            </div>
          </div>
        </div></template>
      </div>
    </div>`;
}

/** Canonical server-rendered WeeklyScheduleEditor template, including every nested alias scope. */
function weeklyScheduleTemplate(options = '{}', outer = '', model = ''): string {
  return `
    <div ${outer}>
      <div class="lyra-sched" x-data="lyraWeeklyScheduleEditor(${options})" ${model}>
        <template x-for="day in order()" :key="day"><div class="lyra-sched__row" :data-day="day">
          <div class="lyra-sched__daycell"><label class="lyra-switch"><input type="checkbox" role="switch" :checked="enabled(day)" @change="setEnabled(day, $event.currentTarget.checked)"><span class="lyra-switch__track" aria-hidden="true"></span><span x-text="dayLabel(day)"></span></label></div>
          <template x-if="enabled(day)"><div class="lyra-sched__ranges">
            <template x-for="(range, index) in rangesFor(day)" :key="index"><div>
              <div class="lyra-sched__range">${timeInputMarkup('start')}<span class="lyra-sched__dash">–</span>${timeInputMarkup('end')}<template x-if="rangesFor(day).length > 1"><button type="button" class="lyra-sched__ghostbtn" :aria-label="label('removeInterval')" @click="removeRange(day, index)"><span aria-hidden="true">×</span></button></template></div>
              <template x-if="invalid(range)"><span class="lyra-sched__error" x-text="label('invalidRange')"></span></template>
            </div></template>
            <button type="button" class="lyra-sched__addrange" @click="addRange(day)" x-text="label('addInterval')"></button>
          </div></template>
          <template x-if="!enabled(day)"><span class="lyra-sched__off" x-text="label('unavailable')"></span></template>
          <div class="lyra-sched__actions"><template x-if="enabled(day)"><div x-data="{ get copyOpen() { return copyOpenFor(day) }, set copyOpen(v) { setCopyOpen(day, v) } }">
            <div class="lyra-popover-anchor" x-data="lyraPopover({ ariaLabel: label('copySchedule') })" x-modelable="open" x-model="copyOpen">
              <button class="lyra-sched__ghostbtn" x-bind="trigger" :aria-label="label('copyToOtherDays', { day: dayLabel(day) })" :title="label('copyFrom', { day: dayLabel(day) })"><span aria-hidden="true">⧉</span></button>
              <div class="lyra-popover" x-bind="panel"><div class="lyra-sched__copy"><span class="lyra-sched__copy-title" x-text="label('copyFrom', { day: dayLabel(day) })"></span><template x-for="target in copyTargets(day)" :key="target"><label class="lyra-check-row"><input type="checkbox" class="lyra-checkbox" :checked="picked(day).includes(target)" @change="togglePicked(day, target)"><span x-text="dayLabel(target)"></span></label></template><button type="button" class="lyra-btn lyra-btn--primary lyra-btn--sm" :disabled="picked(day).length === 0" @click="applyCopy(day)" x-text="label('apply')"></button></div></div>
            </div>
          </div></template></div>
        </div></template>
        <template x-if="showExceptions"><div class="lyra-sched__exc"><span class="lyra-label" x-text="label('exceptions')"></span><template x-for="(exception, index) in exceptions" :key="exception.date"><div class="lyra-sched__exc-row"><span class="lyra-sched__exc-date" x-text="formatDate(exception.date)"></span><span x-text="exceptionText(exception)"></span><button type="button" class="lyra-sched__ghostbtn" :aria-label="label('removeException')" @click="removeException(index)"><span aria-hidden="true">×</span></button></div></template>${exceptionPickerMarkup()}</div></template>
      </div>
      <button type="button" data-testid="set-value" @click="outerValue = { 2: [{ start: '10:00', end: '12:00' }] }">Set value</button>
      <button type="button" data-testid="set-exceptions" @click="outerExceptions = [{ date: '2026-08-08', ranges: [] }]">Set exceptions</button>
    </div>`;
}

function mount(options = '{}', outer = '', model = ''): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = weeklyScheduleTemplate(options, outer, model);
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

function editor(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-sched');
  if (!element) throw new Error('Expected weekly schedule editor');
  return element;
}

function data(host: HTMLElement): { value: WeeklySchedule; exceptions: DateException[] } {
  return Alpine.$data(editor(host)) as { value: WeeklySchedule; exceptions: DateException[] };
}

function row(host: HTMLElement, day: number): HTMLElement {
  const element = editor(host).querySelector<HTMLElement>(`[data-day="${day}"]`);
  if (!element) throw new Error(`Expected weekday row ${day}`);
  return element;
}

function setViewport(matches: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({ matches, addEventListener: () => {}, removeEventListener: () => {} }),
  });
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Alpine.nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

async function expectVisible(element: HTMLElement): Promise<void> {
  await vi.waitFor(() => expect(element.style.display).not.toBe('none'));
}

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: originalMatchMedia });
});

describe('lyraWeeklyScheduleEditor', () => {
  it('renders seven weekday rows in the configured order and marks disabled days unavailable', async () => {
    setViewport(false);
    const host = mount("{ value: { 1: [{ start: '09:00', end: '17:00' }] } }");
    await flush();
    const rows = editor(host).querySelectorAll<HTMLElement>('.lyra-sched__row');
    expect(rows).toHaveLength(7);
    expect(rows[0]?.textContent).toContain('Monday');
    expect(row(host, 0).textContent).toContain('Unavailable');
    expect(row(host, 0).querySelector('.lyra-sched__ranges')).toBeNull();
    const sundayFirst = mount('{ weekStartsOn: 0, showExceptions: false }');
    await flush();
    expect(editor(sundayFirst).querySelector('.lyra-sched__row')?.textContent).toContain('Sunday');
  });

  it('seeds a switched-on day, adds exact next ranges, and removes the selected range', async () => {
    setViewport(false);
    const host = mount("{ defaultRange: { start: '09:00', end: '17:00' }, showExceptions: false }");
    const changes: unknown[] = [];
    editor(host).addEventListener('lyra:change', (event) =>
      changes.push((event as CustomEvent).detail),
    );
    // The switch input is visually hidden by the real CSS; the label is the clickable target.
    await userEvent.click(row(host, 1).querySelector<HTMLLabelElement>('.lyra-switch')!);
    await flush();
    expect(data(host).value[1]).toEqual([{ start: '09:00', end: '17:00' }]);
    expect(changes.at(-1)).toEqual({ value: data(host).value });
    expect(row(host, 1).querySelectorAll('[aria-label="Remove interval"]')).toHaveLength(0);
    await userEvent.click(row(host, 1).querySelector<HTMLButtonElement>('.lyra-sched__addrange')!);
    await flush();
    expect(data(host).value[1]).toEqual([
      { start: '09:00', end: '17:00' },
      { start: '17:00', end: '19:00' },
    ]);
    expect(row(host, 1).querySelectorAll('[aria-label="Remove interval"]')).toHaveLength(2);
    await userEvent.click(
      row(host, 1).querySelectorAll<HTMLButtonElement>('[aria-label="Remove interval"]')[0]!,
    );
    await flush();
    expect(data(host).value[1]).toEqual([{ start: '17:00', end: '19:00' }]);
    const late = mount(
      "{ value: { 1: [{ start: '20:00', end: '22:30' }] }, showExceptions: false }",
    );
    await userEvent.click(row(late, 1).querySelector<HTMLButtonElement>('.lyra-sched__addrange')!);
    await flush();
    expect(data(late).value[1]?.at(-1)).toEqual({ start: '22:30', end: '23:59' });
  });

  it('edits only the selected nested time input, ignores clears, and renders invalid ranges', async () => {
    setViewport(false);
    const host = mount(
      "{ value: { 1: [{ start: '09:00', end: '17:00' }, { start: '18:00', end: '20:00' }] }, showExceptions: false }",
    );
    const inputs = row(host, 1).querySelectorAll<HTMLInputElement>('.lyra-timeinput input');
    await userEvent.fill(inputs[2]!, '19:00');
    await userEvent.tab();
    await flush();
    expect(data(host).value[1]).toEqual([
      { start: '09:00', end: '17:00' },
      { start: '19:00', end: '20:00' },
    ]);
    await userEvent.clear(inputs[0]!);
    await userEvent.tab();
    await flush();
    expect(data(host).value[1]?.[0]?.start).toBe('09:00');
    await userEvent.fill(inputs[1]!, '08:00');
    await userEvent.tab();
    await flush();
    expect(data(host).value[1]?.[0]).toEqual({ start: '09:00', end: '08:00' });
    expect(row(host, 1).querySelector('.lyra-sched__error')?.textContent).toContain(
      'End time must be after start time.',
    );
    expect(inputs[1]?.getAttribute('aria-invalid')).toBe('true');
  });

  it('resets copy picks, copies ranges deeply, and closes the popover after applying', async () => {
    setViewport(false);
    const host = mount(
      "{ value: { 1: [{ start: '09:00', end: '17:00' }] }, showExceptions: false }",
    );
    const trigger = row(host, 1).querySelector<HTMLButtonElement>(
      '[aria-label="Copy Monday to other days"]',
    )!;
    await userEvent.click(trigger);
    await flush();
    const panel = row(host, 1).querySelector<HTMLElement>('[role="dialog"]')!;
    await expectVisible(panel);
    expect(panel.querySelectorAll('.lyra-check-row')).toHaveLength(6);
    const apply = panel.querySelector<HTMLButtonElement>('button.lyra-btn')!;
    expect(apply.disabled).toBe(true);
    await userEvent.click(panel.querySelector<HTMLInputElement>('.lyra-checkbox')!);
    expect(apply.disabled).toBe(false);
    await userEvent.click(apply);
    await flush();
    await vi.waitFor(() => expect(panel.style.display).toBe('none'));
    expect(data(host).value[0]).toEqual([{ start: '09:00', end: '17:00' }]);
    data(host).value[1]![0]!.start = '10:00';
    await flush();
    expect(data(host).value[0]?.[0]?.start).toBe('09:00');
    await userEvent.click(trigger);
    await flush();
    await expectVisible(panel);
    expect(panel.querySelector<HTMLInputElement>('.lyra-checkbox')?.checked).toBe(false);
  });

  it('adds sorted unique date exceptions, formats them, removes by index, and emits exception events', async () => {
    setViewport(false);
    const host = mount(
      "{ exceptions: [{ date: '2026-08-20', ranges: [{ start: '09:00', end: '11:00' }] }], value: { 1: [{ start: '09:00', end: '17:00' }] } }",
    );
    const events: unknown[] = [];
    editor(host).addEventListener('lyra:exceptions', (event) =>
      events.push((event as CustomEvent).detail),
    );
    expect(editor(host).textContent).toContain('09:00–11:00');
    const trigger = editor(host).querySelector<HTMLButtonElement>('.lyra-datepicker__btn')!;
    await userEvent.click(trigger);
    await flush();
    const day = editor(host).querySelector<HTMLButtonElement>('[data-key="2026-7-10"]')!;
    await userEvent.click(day);
    await flush();
    expect(data(host).exceptions).toEqual([
      { date: '2026-08-10', ranges: [] },
      { date: '2026-08-20', ranges: [{ start: '09:00', end: '11:00' }] },
    ]);
    expect(editor(host).textContent).toContain('Unavailable all day');
    // Selecting closes the picker; reopen it before re-picking the same day.
    await userEvent.click(trigger);
    await flush();
    await userEvent.click(editor(host).querySelector<HTMLButtonElement>('[data-key="2026-7-10"]')!);
    await flush();
    expect(data(host).exceptions).toHaveLength(2);
    await userEvent.click(
      editor(host).querySelectorAll<HTMLButtonElement>('[aria-label="Remove exception"]')[1]!,
    );
    await flush();
    expect(data(host).exceptions).toEqual([{ date: '2026-08-10', ranges: [] }]);
    expect(events).toHaveLength(2);
    for (const detail of events) expect(JSON.parse(JSON.stringify(detail))).toEqual(detail);
    const hidden = mount('{ showExceptions: false }');
    await flush();
    expect(editor(hidden).querySelector('.lyra-sched__exc')).toBeNull();
  });

  it('syncs modelable value and exceptions both directions without dispatching external writes', async () => {
    setViewport(false);
    const outer =
      "x-data=\"{ outerValue: { 1: [{ start: '09:00', end: '17:00' }] }, outerExceptions: [] }\"";
    const valueHost = mount(
      '{ showExceptions: false }',
      outer,
      'x-modelable="value" x-model="outerValue"',
    );
    const exceptionHost = mount('{}', outer, 'x-modelable="exceptions" x-model="outerExceptions"');
    const valueEvents: unknown[] = [];
    const exceptionEvents: unknown[] = [];
    editor(valueHost).addEventListener('lyra:change', (event) =>
      valueEvents.push((event as CustomEvent).detail),
    );
    editor(exceptionHost).addEventListener('lyra:exceptions', (event) =>
      exceptionEvents.push((event as CustomEvent).detail),
    );
    await userEvent.click(valueHost.querySelector<HTMLButtonElement>('[data-testid="set-value"]')!);
    await userEvent.click(
      exceptionHost.querySelector<HTMLButtonElement>('[data-testid="set-exceptions"]')!,
    );
    await flush();
    expect(data(valueHost).value[2]).toEqual([{ start: '10:00', end: '12:00' }]);
    expect(data(exceptionHost).exceptions).toEqual([{ date: '2026-08-08', ranges: [] }]);
    expect(valueEvents).toEqual([]);
    expect(exceptionEvents).toEqual([]);
    await userEvent.click(row(valueHost, 2).querySelector<HTMLLabelElement>('.lyra-switch')!);
    await flush();
    const valueOuter = Alpine.$data(valueHost.firstElementChild as HTMLElement) as {
      outerValue: unknown;
    };
    expect(valueOuter.outerValue).toEqual(data(valueHost).value);
    expect(JSON.parse(JSON.stringify(valueEvents.at(-1)))).toEqual(valueEvents.at(-1));
    const exceptionTrigger =
      editor(exceptionHost).querySelector<HTMLButtonElement>('.lyra-datepicker__btn')!;
    await userEvent.click(exceptionTrigger);
    await flush();
    await userEvent.click(
      editor(exceptionHost).querySelector<HTMLButtonElement>('[data-key="2026-7-10"]')!,
    );
    await flush();
    const exceptionOuter = Alpine.$data(exceptionHost.firstElementChild as HTMLElement) as {
      outerExceptions: unknown;
    };
    expect(exceptionOuter.outerExceptions).toEqual(data(exceptionHost).exceptions);
    expect(JSON.parse(JSON.stringify(exceptionEvents.at(-1)))).toEqual(exceptionEvents.at(-1));
  });

  it('is axe clean with mixed weekday availability and an open copy menu', async () => {
    setViewport(false);
    const host = mount(
      "{ value: { 1: [{ start: '09:00', end: '17:00' }], 3: [{ start: '10:00', end: '18:00' }] }, showExceptions: false }",
    );
    await expectNoAxeViolations(editor(host));
    await userEvent.click(
      row(host, 1).querySelector<HTMLButtonElement>('[aria-label="Copy Monday to other days"]')!,
    );
    await flush();
    await expectVisible(row(host, 1).querySelector<HTMLElement>('[role="dialog"]')!);
    await expectNoAxeViolations(editor(host));
  });
});
