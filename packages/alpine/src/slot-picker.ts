import { isoFrom } from './internal/date-utils';
import { TIME_ZONE_PICKER_ZONES } from './time-zone-picker';
import type { LyraTimeZonePickerLabels } from './time-zone-picker';

/** A bookable time slot expressed in UTC ISO timestamps. */
export interface LyraSlot {
  /** UTC ISO start timestamp. */
  start: string;
  /** UTC ISO end timestamp. */
  end: string;
}

/** JSON-safe labels accepted by {@link lyraSlotPicker}. */
export interface LyraSlotPickerLabels {
  confirm?: string;
  emptyMessage?: string;
  fullMessage?: string;
  loading?: string;
  /** Template for the slot list label, with `{date}`. */
  availableTimes?: string;
  /** Template for the later-availability notice, with `{date}`. */
  nextAvailable?: string;
  /** Template for the later-day CTA, with `{date}`. */
  goToDate?: string;
  changeTimeZone?: string;
  /** Template for the hold notice, with `{minutes}` and `{seconds}`. */
  hold?: string;
}

/** Initial configuration accepted by `x-data="lyraSlotPicker(...)"`. */
export interface LyraSlotPickerOptions {
  /** Free slots in UTC. They are grouped by the active display-zone day. */
  slots?: readonly LyraSlot[];
  /** Initial visible local `YYYY-MM-DD` day; modelable after initialization. */
  date?: string | null;
  /** Initial IANA display zone; modelable after initialization. */
  timezone?: string;
  /** IANA zone shown as detected in the embedded time-zone picker. */
  detectedZone?: string;
  /** UTC ISO temporary-hold expiry. */
  holdExpiresAt?: string | null;
  /** Local `YYYY-MM-DD` target for an empty-day shortcut. */
  nextAvailableDate?: string;
  /** Renders six slot pills while availability loads. */
  loading?: boolean;
  /** BCP 47 locale used for display times and dates. Default: `"en-US"`. */
  locale?: string;
  /** Inclusive local calendar lower limit. */
  min?: string;
  /** Inclusive local calendar upper limit. */
  max?: string;
  /** Translatable labels merged over English defaults. */
  labels?: LyraSlotPickerLabels;
  /** Labels forwarded unchanged to the nested time-zone picker. */
  tzLabels?: LyraTimeZonePickerLabels;
}

type Binding = Record<string, unknown>;
type DayMap = Map<string, LyraSlot[]>;

interface LyraSlotPickerData {
  date: string | null;
  timezone: string;
  selected: LyraSlot | null;
  tzOpen: boolean;
  holdTick: number;
  root: HTMLElement | null;
  onNestedChange: ((event: Event) => void) | null;
  detectedZone?: string;
  holdExpiresAt: string | null;
  nextAvailableDate?: string;
  loading: boolean;
  locale: string;
  min?: string;
  max?: string;
  tzLabels?: LyraTimeZonePickerLabels;
  init(): void;
  destroy(): void;
  byDay(): DayMap;
  firstDay(): string | null;
  day(): string | null;
  daySlots(): LyraSlot[];
  dayLabel(): string;
  longDate(isoDay: string): string;
  holdLeft(): number | null;
  visibleTimeZone(): string;
  hasSlots(date: Date): boolean;
  timeOf(utcIso: string): string;
  label(
    name: keyof Required<LyraSlotPickerLabels>,
    values?: Record<string, string | number>,
  ): string;
  setDay(value: string | Date | null, interactive?: boolean): void;
  setTimeZone(value: string, interactive?: boolean): void;
  selectSlot(slot: LyraSlot): void;
  confirm(slot: LyraSlot): void;
  openTimeZone(): void;
  calendarValue(): string | null;
  timeZoneValue(): string;
  main: Binding;
  changeTimeZone: Binding;
  nextAvailable: Binding;
  confirmButton: Binding;
}

interface LyraSlotPickerMagics {
  $dispatch(name: string, detail?: Record<string, unknown>): void;
  $el: HTMLElement;
}

type LyraSlotPickerState = LyraSlotPickerData & LyraSlotPickerMagics;

const DEFAULT_LABELS: Required<LyraSlotPickerLabels> = {
  confirm: 'Confirm',
  emptyMessage: 'No available times on this day.',
  fullMessage: 'There are no available times right now.',
  loading: 'Loading available times',
  availableTimes: 'Available times for {date}',
  nextAvailable: 'Next available time: {date}.',
  goToDate: 'Go to {date}',
  changeTimeZone: 'change',
  hold: 'Reserved for {minutes}:{seconds}',
};

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

function localDay(utcIso: string, timeZone: string): string {
  // en-CA deliberately yields YYYY-MM-DD. UTC ISO slicing would incorrectly group slots around
  // a display-zone day boundary.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(utcIso));
}

function longDate(isoDay: string, locale: string): string {
  return new Date(`${isoDay}T12:00:00`).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function normalizedDay(value: string | Date | null): string | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : isoFrom(value);
  return typeof value === 'string' ? value : null;
}

/**
 * A two-step, timezone-aware public booking slot picker over consumer-rendered markup.
 * `date` and `timezone` are modelable; only user interactions emit `lyra:change` with both values.
 * Confirmation emits `lyra:confirm` with the exact `{ start, end }` slot for server revalidation.
 *
 * React's function-valued labels are JSON-safe whole templates here: `availableTimes`,
 * `nextAvailable`, `goToDate`, and `hold` interpolate their named `{key}` values.
 *
 * ```html
 * <div class="lyra-slotpicker" x-data="lyraSlotPicker({ slots, date, timezone, min, max })"
 *   x-modelable="date" x-model="date">
 *   <div class="lyra-slotpicker__side">
 *     <!-- Alias scopes avoid same-name x-model self-entanglement. -->
 *     <div x-data="{ get calendarDate() { return calendarValue() }, set calendarDate(v) { setDay(v) } }">
 *       <div class="lyra-cal lyra-cal--md"
 *         x-data="lyraCalendar({ defaultValue: calendarDate, min, max, isDateDisabled: (d) => !hasSlots(d) })"
 *         x-modelable="selected" x-model="calendarDate">
 *         <div class="lyra-cal__head"><button class="lyra-cal__nav" x-bind="prev">Previous</button><button class="lyra-cal__label" x-bind="viewButton" x-text="headerLabel()"></button><button class="lyra-cal__nav" x-bind="next">Next</button></div>
 *         <template x-if="mode === 'days'"><div class="lyra-cal__grid">
 *           <template x-for="weekday in weekdays()" :key="weekday.key"><span class="lyra-cal__wd" :aria-label="weekday.long" x-text="weekday.narrow"></span></template>
 *           <template x-for="date in days()" :key="dayKey(date)"><button class="lyra-cal__day" type="button" :class="dayClass(date)" :aria-disabled="dayDisabled(date)" :tabindex="dayTabindex(date)" :aria-label="dayLabel(date)" :aria-pressed="dayPressed(date)" :data-key="dayKey(date)" @click="selectDate(date)" @focus="onDayFocus(date)" @keydown="onDayKeydown($event, date)"><span x-text="date.getDate()"></span><span class="lyra-cal__dot" x-show="hasSlots(date)"></span></button></template>
 *         </div></template>
 *         <div class="lyra-cal__foot"><button class="lyra-cal__today" x-bind="today"></button></div>
 *       </div>
 *     </div>
 *     <div class="lyra-slotpicker__tz">
 *       <!-- consumer globe icon slot -->
 *       <template x-if="!tzOpen"><span><span x-text="visibleTimeZone()"></span> <button type="button" x-bind="changeTimeZone" x-text="label('changeTimeZone')"></button></span></template>
 *       <div x-show="tzOpen" x-data="{ get pickerTimeZone() { return timeZoneValue() }, set pickerTimeZone(v) { setTimeZone(v) } }">
 *         <div class="lyra-combobox lyra-tzpicker" x-data="lyraTimeZonePicker({ value: pickerTimeZone, detectedZone, locale, labels: tzLabels })" x-modelable="value" x-model="pickerTimeZone">
 *           <button class="lyra-input lyra-combobox__trigger" x-bind="trigger"><span x-bind="triggerValue"></span></button>
 *           <div class="lyra-combobox__pop" x-bind="pop"><div class="lyra-combobox__search"><input x-bind="search" aria-label="Search time zones"></div><div class="lyra-combobox__list" x-bind="list"><span class="lyra-combobox__empty" x-bind="empty" x-text="emptyMessage"></span><template x-for="({ option, index }, filteredIndex) in filtered()" :key="option.value"><div><template x-if="showGroup(filteredIndex)"><span class="lyra-combobox__group" role="presentation" x-text="option.group"></span></template><button class="lyra-combobox__option" type="button" tabindex="-1" role="option" :id="optionId(index)" :class="optionClass(filteredIndex)" :aria-selected="optionSelected(option)" @mouseenter="setActive(filteredIndex)" @click="pick(option)"><span class="lyra-combobox__option-label" x-text="option.label"></span><span class="lyra-combobox__trailing" x-text="option.trailing"></span></button></div></template></div></div>
 *         </div>
 *       </div>
 *     </div>
 *   </div>
 *   <div class="lyra-slotpicker__main" x-bind="main">
 *     <template x-if="loading"><div class="lyra-slotpicker__slots" :aria-label="label('loading')"><template x-for="n in 6"><span class="lyra-slotpicker__skeleton"></span></template></div></template>
 *     <template x-if="!loading && byDay().size === 0"><div class="lyra-slotpicker__empty"><span x-text="label('fullMessage')"></span></div></template>
 *     <template x-if="!loading && byDay().size && daySlots().length === 0"><div class="lyra-slotpicker__empty"><span x-text="label('emptyMessage')"></span><span x-show="nextAvailableDate" x-text="label('nextAvailable', { date: nextAvailableDate ? longDate(nextAvailableDate, locale) : '' })"></span><button class="lyra-btn lyra-btn--secondary lyra-btn--sm" x-show="nextAvailableDate && byDay().has(nextAvailableDate)" x-bind="nextAvailable" x-text="label('goToDate', { date: nextAvailableDate ? longDate(nextAvailableDate, locale) : '' })"></button></div></template>
 *     <template x-if="!loading && daySlots().length"><span class="lyra-slotpicker__daylabel" x-text="dayLabel()"></span></template><template x-if="!loading && daySlots().length"><div class="lyra-slotpicker__slots" role="listbox" :aria-label="label('availableTimes', { date: dayLabel() })"><template x-for="slot in daySlots()" :key="slot.start"><span :class="{ 'lyra-slotpicker__pair': selected?.start === slot.start }" :style="selected?.start === slot.start ? '' : 'display: contents'"><template x-if="selected?.start === slot.start"><span class="lyra-slotpicker__slot" role="option" aria-selected="true" x-text="timeOf(slot.start)"></span></template><template x-if="selected?.start === slot.start"><button class="lyra-btn lyra-btn--primary lyra-btn--md" x-bind="confirmButton" @click="confirm(slot)" x-text="label('confirm')"></button></template><template x-if="selected?.start !== slot.start"><button class="lyra-slotpicker__slot" type="button" role="option" aria-selected="false" @click="selectSlot(slot)" x-text="timeOf(slot.start)"></button></template></span></template></div></template><template x-if="!loading && daySlots().length"><span class="lyra-slotpicker__hold" x-show="holdLeft() !== null && holdLeft() > 0"><!-- consumer timer icon slot --><span x-text="label('hold', { minutes: Math.floor(holdLeft() / 60), seconds: String(holdLeft() % 60).padStart(2, '0') })"></span></span></template>
 *   </div>
 * </div>
 * ```
 *
 * Serve the time-zone picker separately when an always-open variant is desired.
 */
export function lyraSlotPicker({
  slots = [],
  date = null,
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  detectedZone,
  holdExpiresAt = null,
  nextAvailableDate,
  loading = false,
  locale = 'en-US',
  min,
  max,
  labels: labelsProp,
  tzLabels,
}: LyraSlotPickerOptions = {}): LyraSlotPickerData {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  let holdInterval: number | null = null;

  const state: LyraSlotPickerData & ThisType<LyraSlotPickerState> = {
    date,
    timezone,
    selected: null,
    tzOpen: false,
    holdTick: 0,
    root: null,
    onNestedChange: null,
    detectedZone,
    holdExpiresAt,
    nextAvailableDate,
    loading,
    locale,
    min,
    max,
    tzLabels,

    init() {
      this.root = this.$el;
      this.onNestedChange = (event) => {
        if (event.target === this.root) return;
        const target = event.target instanceof Element ? event.target : null;
        const detail = (event as CustomEvent<{ value?: unknown }>).detail;
        if (target?.closest('.lyra-cal') && typeof detail?.value === 'string') {
          event.stopPropagation();
          this.setDay(detail.value, true);
        } else if (target?.closest('.lyra-tzpicker') && typeof detail?.value === 'string') {
          event.stopPropagation();
          this.setTimeZone(detail.value, true);
        }
      };
      this.root.addEventListener('lyra:change', this.onNestedChange);
      if (holdExpiresAt) {
        holdInterval = window.setInterval(() => {
          this.holdTick += 1;
        }, 1000);
      }
    },

    destroy() {
      if (holdInterval !== null) window.clearInterval(holdInterval);
      holdInterval = null;
      if (this.root && this.onNestedChange)
        this.root.removeEventListener('lyra:change', this.onNestedChange);
      this.root = null;
      this.onNestedChange = null;
    },

    byDay() {
      const grouped: DayMap = new Map();
      for (const slot of slots) {
        const key = localDay(slot.start, this.timezone);
        const group = grouped.get(key) ?? [];
        group.push(slot);
        grouped.set(key, group);
      }
      for (const group of grouped.values()) {
        group.sort(
          (left, right) => new Date(left.start).getTime() - new Date(right.start).getTime(),
        );
      }
      return grouped;
    },

    firstDay() {
      const days = [...this.byDay().keys()].sort();
      return days[0] ?? null;
    },

    day() {
      return this.date ?? this.firstDay();
    },

    daySlots() {
      const day = this.day();
      return day ? (this.byDay().get(day) ?? []) : [];
    },

    dayLabel() {
      const day = this.day();
      return day ? longDate(day, this.locale) : '';
    },

    longDate(isoDay) {
      return longDate(isoDay, this.locale);
    },

    holdLeft() {
      this.holdTick;
      return holdExpiresAt
        ? Math.max(0, Math.floor((new Date(holdExpiresAt).getTime() - Date.now()) / 1000))
        : null;
    },

    visibleTimeZone() {
      return (
        TIME_ZONE_PICKER_ZONES.find((zone) => zone.value === this.timezone)?.label ?? this.timezone
      );
    },

    hasSlots(value) {
      return this.byDay().has(isoFrom(value));
    },

    timeOf(utcIso) {
      return new Intl.DateTimeFormat(this.locale, {
        timeZone: this.timezone,
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(utcIso));
    },

    label(name, values = {}) {
      return interpolate(labels[name] ?? '', values);
    },

    setDay(value, interactive = false) {
      const next = normalizedDay(value);
      if (!next) return;
      this.date = next;
      this.selected = null;
      if (interactive) this.$dispatch('lyra:change', { date: this.date, timezone: this.timezone });
    },

    setTimeZone(value, interactive = false) {
      this.timezone = value;
      this.tzOpen = false;
      if (interactive) this.$dispatch('lyra:change', { date: this.day(), timezone: this.timezone });
    },

    selectSlot(slot) {
      this.selected = slot;
    },

    confirm(slot) {
      this.$dispatch('lyra:confirm', { slot });
    },

    openTimeZone() {
      this.tzOpen = true;
    },

    calendarValue() {
      return this.day();
    },

    timeZoneValue() {
      return this.timezone;
    },

    main: { 'aria-live': 'polite' },
    changeTimeZone: {
      type: 'button',
      '@click'() {
        this.openTimeZone();
      },
    },
    nextAvailable: {
      type: 'button',
      '@click'() {
        if (nextAvailableDate && this.byDay().has(nextAvailableDate))
          this.setDay(nextAvailableDate, true);
      },
    },
    confirmButton: { type: 'button' },
  };

  return state;
}
