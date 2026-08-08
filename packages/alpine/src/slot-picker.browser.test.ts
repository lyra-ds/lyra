import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

const mountedHosts: HTMLElement[] = [];

Alpine.plugin(lyra);

function calendarTemplate(): string {
  return `
    <div x-data="{ get calendarDate() { return calendarValue() }, set calendarDate(v) { setDay(v) } }">
      <div class="lyra-cal lyra-cal--md" x-data="lyraCalendar({ defaultValue: calendarDate, min, max, isDateDisabled: (d) => !hasSlots(d) })" x-modelable="selected" x-model="calendarDate">
        <div class="lyra-cal__head"><button class="lyra-cal__nav" x-bind="prev">Previous</button><button class="lyra-cal__label" x-bind="viewButton" x-text="headerLabel()"></button><button class="lyra-cal__nav" x-bind="next">Next</button></div>
        <template x-if="mode === 'days'"><div class="lyra-cal__grid">
          <template x-for="weekday in weekdays()" :key="weekday.key"><span class="lyra-cal__wd" :aria-label="weekday.long" x-text="weekday.narrow"></span></template>
          <template x-for="date in days()" :key="dayKey(date)"><button class="lyra-cal__day" type="button" :class="dayClass(date)" :aria-disabled="dayDisabled(date)" :tabindex="dayTabindex(date)" :aria-label="dayLabel(date)" :aria-pressed="dayPressed(date)" :data-key="dayKey(date)" @click="selectDate(date)" @focus="onDayFocus(date)" @keydown="onDayKeydown($event, date)"><span x-text="date.getDate()"></span><span class="lyra-cal__dot" x-show="hasSlots(date)"></span></button></template>
        </div></template>
        <div class="lyra-cal__foot"><button class="lyra-cal__today" x-bind="today"></button></div>
      </div>
    </div>`;
}

function timeZoneTemplate(): string {
  return `
    <template x-if="tzOpen"><div x-data="{ get pickerTimeZone() { return timeZoneValue() }, set pickerTimeZone(v) { setTimeZone(v) } }">
      <div class="lyra-combobox lyra-tzpicker" x-data="lyraTimeZonePicker({ value: pickerTimeZone, detectedZone, locale, labels: tzLabels })" x-modelable="value" x-model="pickerTimeZone">
        <button class="lyra-input lyra-combobox__trigger" x-bind="trigger"><span x-bind="triggerValue"></span></button>
        <div class="lyra-combobox__pop" x-bind="pop"><div class="lyra-combobox__search"><input x-bind="search" aria-label="Search time zones"></div><div class="lyra-combobox__list" x-bind="list"><span class="lyra-combobox__empty" x-bind="empty" x-text="emptyMessage"></span><template x-for="({ option, index }, filteredIndex) in filtered()" :key="option.value"><div><template x-if="showGroup(filteredIndex)"><span class="lyra-combobox__group" role="presentation" x-text="option.group"></span></template><button class="lyra-combobox__option" type="button" tabindex="-1" role="option" :id="optionId(index)" :class="optionClass(filteredIndex)" :aria-selected="optionSelected(option)" :data-zone="option.value" @mouseenter="setActive(filteredIndex)" @click="pick(option)"><span class="lyra-combobox__option-label" x-text="option.label"></span><span class="lyra-combobox__trailing" x-text="option.trailing"></span></button></div></template></div></div>
      </div>
    </div></template>`;
}

/** Canonical server-rendered SlotPicker template, including both nested alias scopes. */
function slotPickerTemplate(options = '{}', outer = '', model = ''): string {
  return `
    <div ${outer}>
      <div class="lyra-slotpicker" x-data="lyraSlotPicker(${options})" ${model}>
        <div class="lyra-slotpicker__side">
          ${calendarTemplate()}
          <div class="lyra-slotpicker__tz"><span aria-hidden="true">◉</span>
            <template x-if="!tzOpen"><span><span data-testid="zone" x-text="visibleTimeZone()"></span> <button type="button" x-bind="changeTimeZone" x-text="label('changeTimeZone')"></button></span></template>
            ${timeZoneTemplate()}
          </div>
        </div>
        <div class="lyra-slotpicker__main" x-bind="main">
          <template x-if="loading"><div class="lyra-slotpicker__slots" :aria-label="label('loading')"><template x-for="n in 6"><span class="lyra-slotpicker__skeleton"></span></template></div></template>
          <template x-if="!loading && byDay().size === 0"><div class="lyra-slotpicker__empty"><span x-text="label('fullMessage')"></span></div></template>
          <template x-if="!loading && byDay().size && daySlots().length === 0"><div class="lyra-slotpicker__empty"><span x-text="label('emptyMessage')"></span><span x-show="nextAvailableDate" x-text="label('nextAvailable', { date: nextAvailableDate ? new Date(nextAvailableDate + 'T12:00:00').toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }) : '' })"></span><button class="lyra-btn lyra-btn--secondary lyra-btn--sm" x-show="nextAvailableDate && byDay().has(nextAvailableDate)" x-bind="nextAvailable" x-text="label('goToDate', { date: nextAvailableDate ? new Date(nextAvailableDate + 'T12:00:00').toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }) : '' })"></button></div></template>
          <template x-if="!loading && daySlots().length"><span class="lyra-slotpicker__daylabel" x-text="dayLabel()"></span></template><template x-if="!loading && daySlots().length"><div class="lyra-slotpicker__slots" role="listbox" :aria-label="label('availableTimes', { date: dayLabel() })"><template x-for="slot in daySlots()" :key="slot.start"><span :class="{ 'lyra-slotpicker__pair': selected?.start === slot.start }" :style="selected?.start === slot.start ? '' : 'display: contents'"><template x-if="selected?.start === slot.start"><span class="lyra-slotpicker__slot" role="option" aria-selected="true" x-text="timeOf(slot.start)"></span></template><template x-if="selected?.start === slot.start"><button class="lyra-btn lyra-btn--primary lyra-btn--md" x-bind="confirmButton" @click="confirm(slot)" x-text="label('confirm')"></button></template><template x-if="selected?.start !== slot.start"><button class="lyra-slotpicker__slot" type="button" role="option" aria-selected="false" @click="selectSlot(slot)" x-text="timeOf(slot.start)"></button></template></span></template></div></template><template x-if="!loading && daySlots().length"><span class="lyra-slotpicker__hold" x-show="holdLeft() !== null && holdLeft() > 0"><span aria-hidden="true">◷</span><span x-text="label('hold', { minutes: Math.floor(holdLeft() / 60), seconds: String(holdLeft() % 60).padStart(2, '0') })"></span></span></template>
        </div>
      </div>
      <button type="button" data-testid="set-date" @click="outerDate = '2026-08-05'">Set date</button>
      <button type="button" data-testid="set-zone" @click="outerZone = 'Asia/Tokyo'">Set zone</button>
    </div>`;
}

function mount(options = '{}', outer = '', model = ''): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = slotPickerTemplate(options, outer, model);
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

function picker(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-slotpicker');
  if (!element) throw new Error('Expected slot picker');
  return element;
}

function day(host: HTMLElement, iso: string): HTMLButtonElement {
  const [year, month, date] = iso.split('-').map(Number);
  const element = host.querySelector<HTMLButtonElement>(
    `[data-key="${year}-${month - 1}-${date}"]`,
  );
  if (!element) throw new Error(`Expected calendar day ${iso}`);
  return element;
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Alpine.nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
  vi.useRealTimers();
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
});

describe('lyraSlotPicker', () => {
  it('groups slots by active display-zone day and defaults to the first available day', async () => {
    const slots =
      "[{ start: '2026-08-03T23:30:00Z', end: '2026-08-04T00:00:00Z' }, { start: '2026-08-04T03:30:00Z', end: '2026-08-04T04:00:00Z' }]";
    const saoPaulo = mount(`{ timezone: 'America/Sao_Paulo', slots: ${slots} }`);
    const tokyo = mount(`{ timezone: 'Asia/Tokyo', slots: ${slots} }`);
    await flush();
    expect((Alpine.$data(picker(saoPaulo)) as { day(): string }).day()).toBe('2026-08-03');
    expect((Alpine.$data(picker(tokyo)) as { day(): string }).day()).toBe('2026-08-04');
    expect(picker(saoPaulo).querySelectorAll('[role="option"]')).toHaveLength(1);
    expect(picker(tokyo).querySelectorAll('[role="option"]')).toHaveLength(2);
  });

  it('marks only available calendar days, changes days, resets selection, and emits the combined change', async () => {
    const host = mount(`{ timezone: 'UTC', date: '2026-08-03', slots: [
      { start: '2026-08-03T10:00:00Z', end: '2026-08-03T11:00:00Z' },
      { start: '2026-08-05T10:00:00Z', end: '2026-08-05T11:00:00Z' }
    ] }`);
    const changes: unknown[] = [];
    picker(host).addEventListener('lyra:change', (event) =>
      changes.push((event as CustomEvent).detail),
    );
    await userEvent.click(picker(host).querySelector<HTMLButtonElement>('[role="option"]')!);
    await userEvent.click(day(host, '2026-08-05'));
    await flush();
    expect(
      day(host, '2026-08-03').querySelector<HTMLElement>('.lyra-cal__dot')?.style.display,
    ).not.toBe('none');
    expect(day(host, '2026-08-04').getAttribute('aria-disabled')).toBe('true');
    expect(picker(host).querySelector('[aria-selected="true"]')).toBeNull();
    expect(changes).toContainEqual({ date: '2026-08-05', timezone: 'UTC' });
  });

  it('selects, confirms, changes zone through the nested picker, and re-renders times', async () => {
    const slot = { start: '2026-08-03T23:30:00Z', end: '2026-08-04T00:00:00Z' };
    const host = mount(
      // Single quotes only: the x-data value lives inside a double-quoted attribute.
      `{ timezone: 'America/Sao_Paulo', date: '2026-08-03', slots: [{ start: '${slot.start}', end: '${slot.end}' }] }`,
    );
    const confirms: unknown[] = [];
    const changes: unknown[] = [];
    picker(host).addEventListener('lyra:confirm', (event) =>
      confirms.push((event as CustomEvent).detail),
    );
    picker(host).addEventListener('lyra:change', (event) =>
      changes.push((event as CustomEvent).detail),
    );
    const option = picker(host).querySelector<HTMLButtonElement>('[role="option"]')!;
    const before = option.textContent;
    await userEvent.click(option);
    await flush();
    expect(picker(host).querySelector('[aria-selected="true"]')).not.toBeNull();
    await userEvent.click(
      picker(host).querySelector<HTMLButtonElement>('.lyra-slotpicker__pair button')!,
    );
    expect(confirms).toEqual([{ slot }]);
    await userEvent.click(
      picker(host).querySelector<HTMLButtonElement>('.lyra-slotpicker__tz button')!,
    );
    await flush();
    await userEvent.click(
      picker(host).querySelector<HTMLButtonElement>('.lyra-combobox__trigger')!,
    );
    await flush();
    await userEvent.click(
      picker(host).querySelector<HTMLButtonElement>('[data-zone="Asia/Tokyo"]')!,
    );
    await flush();
    expect(picker(host).querySelector('.lyra-tzpicker')).toBeNull();
    expect(picker(host).querySelector('[role="option"]')?.textContent).not.toBe(before);
    expect(changes).toContainEqual({ date: '2026-08-03', timezone: 'Asia/Tokyo' });
  });

  it('synchronizes modelable date and timezone in both directions without external-write events', async () => {
    const options =
      "{ timezone: 'UTC', date: '2026-08-03', slots: [{ start: '2026-08-03T10:00:00Z', end: '2026-08-03T11:00:00Z' }, { start: '2026-08-05T10:00:00Z', end: '2026-08-05T11:00:00Z' }] }";
    const dateHost = mount(
      options,
      "x-data=\"{ outerDate: '2026-08-03', outerZone: 'UTC' }\"",
      'x-modelable="date" x-model="outerDate"',
    );
    const zoneHost = mount(
      options,
      "x-data=\"{ outerDate: '2026-08-03', outerZone: 'UTC' }\"",
      'x-modelable="timezone" x-model="outerZone"',
    );
    const dateChanges: unknown[] = [];
    picker(dateHost).addEventListener('lyra:change', (event) =>
      dateChanges.push((event as CustomEvent).detail),
    );
    await userEvent.click(dateHost.querySelector<HTMLButtonElement>('[data-testid="set-date"]')!);
    await flush();
    expect((Alpine.$data(picker(dateHost)) as { date: string }).date).toBe('2026-08-05');
    expect(dateChanges).toEqual([]);
    await userEvent.click(day(dateHost, '2026-08-03'));
    await flush();
    expect(
      (Alpine.$data(dateHost.firstElementChild as HTMLElement) as { outerDate: string }).outerDate,
    ).toBe('2026-08-03');
    await userEvent.click(zoneHost.querySelector<HTMLButtonElement>('[data-testid="set-zone"]')!);
    await flush();
    expect((Alpine.$data(picker(zoneHost)) as { timezone: string }).timezone).toBe('Asia/Tokyo');
    (
      Alpine.$data(picker(zoneHost)) as { setTimeZone(value: string, interactive: boolean): void }
    ).setTimeZone('UTC', true);
    await flush();
    expect(
      (Alpine.$data(zoneHost.firstElementChild as HTMLElement) as { outerZone: string }).outerZone,
    ).toBe('UTC');
  });

  it('renders empty, full, loading, and hold states without an empty listbox', async () => {
    const empty = mount(
      "{ timezone: 'UTC', date: '2026-08-03', nextAvailableDate: '2026-08-05', slots: [{ start: '2026-08-05T10:00:00Z', end: '2026-08-05T11:00:00Z' }] }",
    );
    await flush();
    expect(picker(empty).textContent).toContain('No available times on this day.');
    expect(picker(empty).querySelector('[role="listbox"]')).toBeNull();
    await expectNoAxeViolations(picker(empty));
    await userEvent.click(
      picker(empty).querySelector<HTMLButtonElement>('.lyra-slotpicker__empty button')!,
    );
    await flush();
    expect((Alpine.$data(picker(empty)) as { date: string }).date).toBe('2026-08-05');
    const full = mount("{ timezone: 'UTC' }");
    const loading = mount("{ timezone: 'UTC', loading: true }");
    expect(picker(full).textContent).toContain('There are no available times right now.');
    expect(picker(loading).querySelectorAll('.lyra-slotpicker__skeleton')).toHaveLength(6);
    await expectNoAxeViolations(picker(empty));
    await expectNoAxeViolations(picker(full));
  });

  it('counts down each second and clears its interval on destroy', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    vi.setSystemTime(new Date('2026-08-03T10:00:00Z'));
    const host = mount(
      "{ timezone: 'UTC', holdExpiresAt: '2026-08-03T10:01:30Z', slots: [{ start: '2026-08-03T11:00:00Z', end: '2026-08-03T12:00:00Z' }] }",
    );
    const state = Alpine.$data(picker(host)) as { holdTick: number };
    expect(picker(host).querySelector('.lyra-slotpicker__hold')?.textContent).toContain('1:30');
    await vi.advanceTimersByTimeAsync(1_000);
    await Alpine.nextTick();
    expect(picker(host).querySelector('.lyra-slotpicker__hold')?.textContent).toContain('1:29');
    await vi.advanceTimersByTimeAsync(89_000);
    await Alpine.nextTick();
    // The x-show hide lands one flush after the tick that zeroes the countdown.
    await vi.waitFor(() =>
      expect(picker(host).querySelector<HTMLElement>('.lyra-slotpicker__hold')?.style.display).toBe(
        'none',
      ),
    );
    Alpine.destroyTree(host);
    const destroyedAt = state.holdTick;
    mountedHosts.splice(mountedHosts.indexOf(host), 1);
    host.remove();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(state.holdTick).toBe(destroyedAt);
  });
});
