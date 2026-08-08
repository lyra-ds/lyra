import {
  addMonths,
  dateFrom,
  dateKey,
  isoFrom,
  normalizeDay,
  sameDay,
} from './internal/date-utils';
import { whenVisible } from './internal/when-visible';

/** The selected bounds when {@link lyraCalendar} is used in range mode. */
export interface LyraCalendarRange {
  /** The first selected day, or `null` before a range starts. */
  start: Date | null;
  /** The last selected day, or `null` until the range is completed. */
  end: Date | null;
}

/** Translatable control labels, merged over the React English defaults. */
export interface LyraCalendarLabels {
  previousMonth?: string;
  nextMonth?: string;
  previousYear?: string;
  nextYear?: string;
  previousYears?: string;
  nextYears?: string;
  changeView?: string;
  today?: string;
}

/** Initial configuration accepted by `x-data="lyraCalendar(...)"`. */
export interface LyraCalendarOptions {
  /** Whether selection is a date range. Default: `false`. */
  range?: boolean;
  /** Initial ISO date, or range of ISO dates. */
  defaultValue?: string | { start?: string | null; end?: string | null } | null;
  /** Inclusive lower selection limit as ISO `YYYY-MM-DD`. */
  min?: string;
  /** Inclusive upper selection limit as ISO `YYYY-MM-DD`. */
  max?: string;
  /** ISO dates that cannot be selected; this replaces React's function-only data API. */
  disabledDates?: string[];
  /** Optional JavaScript-only disabled-date predicate; it combines with `disabledDates`. */
  isDateDisabled?: (date: Date) => boolean;
  /** First weekday, where `0` is Sunday and `6` is Saturday. Default: `0`. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** BCP 47 locale used for labels and names. Default: `"en-US"`. */
  locale?: string;
  /** Translatable labels merged over English defaults. */
  labels?: LyraCalendarLabels;
}

type Binding = Record<string, unknown>;
type CalendarValue = Date | LyraCalendarRange | null;
type ViewMode = 'days' | 'months' | 'years';

interface Weekday {
  key: number;
  narrow: string;
  long: string;
}

interface LyraCalendarData {
  selected: CalendarValue;
  view: Date;
  mode: ViewMode;
  focusedDate: Date;
  root: HTMLElement | null;
  pendingFocus: string | null;
  init(): void;
  days(): Date[];
  months(): Date[];
  years(): number[];
  weekdays(): Weekday[];
  monthName(date: Date): string;
  dayClass(date: Date): Record<string, boolean>;
  dayDisabled(date: Date): 'true' | false;
  dayTabindex(date: Date): 0 | -1;
  dayLabel(date: Date): string;
  dayPressed(date: Date): 'true' | false;
  dayKey(date: Date): string;
  selectDate(date: Date): void;
  selectedStart(): Date | null;
  selectedEnd(): Date | null;
  onDayFocus(date: Date): void;
  onDayKeydown(event: KeyboardEvent, date: Date): void;
  monthClass(month: Date): Record<string, boolean>;
  yearClass(year: number): Record<string, boolean>;
  pickMonth(date: Date): void;
  pickYear(year: number): void;
  headerLabel(): string;
  prevLabel(): string;
  nextLabel(): string;
  navigate(amount: number): void;
  moveFocus(date: Date): void;
  focusPendingDay(): void;
  prev: Binding;
  next: Binding;
  viewButton: Binding;
  today: Binding;
}

interface LyraCalendarMagics {
  $dispatch(name: string, detail?: unknown): void;
  $el: HTMLElement;
  $nextTick(callback: () => void): void;
}

type LyraCalendarState = LyraCalendarData & LyraCalendarMagics;

const DEFAULT_LABELS: Required<LyraCalendarLabels> = {
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  previousYear: 'Previous year',
  nextYear: 'Next year',
  previousYears: 'Previous years',
  nextYears: 'Next years',
  changeView: 'Change month or year',
  today: 'Today',
};

function normalizeValue(value: LyraCalendarOptions['defaultValue'], range: boolean): CalendarValue {
  if (range) {
    const candidate = value && typeof value === 'object' ? value : null;
    return { start: dateFrom(candidate?.start), end: dateFrom(candidate?.end) };
  }
  return dateFrom(typeof value === 'string' ? value : null);
}

/**
 * A fixed six-week local-time calendar over consumer-rendered markup.
 *
 * `disabledDates` is the data-driven translation of React's functional
 * `isDateDisabled`; JavaScript consumers may also provide that function and either source disables.
 * To replace React's `renderDayMarker`, include any served marker markup inside the day template
 * (for example `<span class="lyra-cal__dot" x-show="hasAvailability(date)"></span>`).
 *
 * ```html
 * <div class="lyra-cal lyra-cal--md" x-data="lyraCalendar({ defaultValue: '2024-05-15' })">
 *   <div class="lyra-cal__head">
 *     <button class="lyra-cal__nav" x-bind="prev"></button>
 *     <button class="lyra-cal__label" x-bind="viewButton" x-text="headerLabel()"></button>
 *     <button class="lyra-cal__nav" x-bind="next"></button>
 *   </div>
 *   <template x-if="mode === 'days'"><div class="lyra-cal__grid">
 *     <template x-for="weekday in weekdays()" :key="weekday.key">
 *       <span class="lyra-cal__wd" :aria-label="weekday.long" x-text="weekday.narrow"></span>
 *     </template>
 *     <template x-for="date in days()" :key="dayKey(date)">
 *       <button class="lyra-cal__day" x-bind="{ type: 'button' }" :class="dayClass(date)"
 *         :aria-disabled="dayDisabled(date)" :tabindex="dayTabindex(date)" :aria-label="dayLabel(date)"
 *         :aria-pressed="dayPressed(date)" :data-key="dayKey(date)" @click="selectDate(date)"
 *         @focus="onDayFocus(date)" @keydown="onDayKeydown($event, date)">
 *         <span x-text="date.getDate()"></span><!-- optional consumer day marker goes here -->
 *       </button>
 *     </template>
 *   </div></template>
 *   <template x-if="mode === 'months'"><div class="lyra-cal__mgrid">
 *     <template x-for="month in months()" :key="month.getMonth()">
 *       <button class="lyra-cal__mcell" type="button" :class="monthClass(month)"
 *         @click="pickMonth(month)" x-text="monthName(month)"></button>
 *     </template>
 *   </div></template>
 *   <template x-if="mode === 'years'"><div class="lyra-cal__mgrid">
 *     <template x-for="year in years()" :key="year">
 *       <button class="lyra-cal__mcell" type="button" :class="yearClass(year)"
 *         @click="pickYear(year)" x-text="year"></button>
 *     </template>
 *   </div></template>
 *   <div class="lyra-cal__foot"><button class="lyra-cal__today" x-bind="today"></button></div>
 * </div>
 * ```
 */
export function lyraCalendar({
  range = false,
  defaultValue = null,
  min,
  max,
  disabledDates = [],
  isDateDisabled,
  weekStartsOn = 0,
  locale = 'en-US',
  labels: labelsProp,
}: LyraCalendarOptions = {}): LyraCalendarData {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const initial = normalizeValue(defaultValue, range);
  const anchor = range ? (initial as LyraCalendarRange).start : (initial as Date | null);
  const currentDate = new Date();
  const todayDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
  );
  const minDate = dateFrom(min);
  const maxDate = dateFrom(max);
  const disabledKeys = new Set(
    disabledDates
      .map(dateFrom)
      .filter((date): date is Date => date !== null)
      .map(dateKey),
  );
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
  const monthNameFormatter = new Intl.DateTimeFormat(locale, { month: 'short' });
  const weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
  const weekdayNameFormatter = new Intl.DateTimeFormat(locale, { weekday: 'long' });
  const dateLabelFormatter = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const state: LyraCalendarData & ThisType<LyraCalendarState> = {
    selected: initial,
    view: new Date((anchor ?? todayDate).getFullYear(), (anchor ?? todayDate).getMonth(), 1),
    mode: 'days',
    focusedDate: anchor ?? todayDate,
    root: null,
    pendingFocus: null,

    init() {
      this.root = this.$el;
    },

    days() {
      const start = new Date(this.view);
      start.setDate(1 - ((start.getDay() - weekStartsOn + 7) % 7));
      return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        return date;
      });
    },

    months() {
      return Array.from({ length: 12 }, (_, month) => new Date(this.view.getFullYear(), month, 1));
    },

    years() {
      const base = Math.floor(this.view.getFullYear() / 12) * 12;
      return Array.from({ length: 12 }, (_, index) => base + index);
    },

    weekdays() {
      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(2024, 0, 7 + ((index + weekStartsOn) % 7));
        return {
          key: date.getDay(),
          narrow: weekdayFormatter.format(date),
          long: weekdayNameFormatter.format(date),
        };
      });
    },

    monthName(date) {
      return monthNameFormatter.format(date);
    },

    selectedStart() {
      const raw = range
        ? (this.selected as LyraCalendarRange | null)?.start
        : (this.selected as Date | null);
      return normalizeDay(raw);
    },

    selectedEnd() {
      return range ? normalizeDay((this.selected as LyraCalendarRange | null)?.end) : null;
    },

    dayClass(date) {
      const selectedStart = this.selectedStart();
      const selectedEnd = this.selectedEnd();
      return {
        'lyra-cal__day--out': date.getMonth() !== this.view.getMonth(),
        'lyra-cal__day--today': sameDay(date, todayDate),
        'lyra-cal__day--selected': sameDay(date, selectedStart) || sameDay(date, selectedEnd),
        'lyra-cal__day--in-range': Boolean(
          range && selectedStart && selectedEnd && date > selectedStart && date < selectedEnd,
        ),
      };
    },

    dayDisabled(date) {
      return (minDate && date < minDate) ||
        (maxDate && date > maxDate) ||
        disabledKeys.has(dateKey(date)) ||
        isDateDisabled?.(date)
        ? 'true'
        : false;
    },

    dayTabindex(date) {
      const activeDate =
        this.days().find((day) => sameDay(day, this.focusedDate)) ?? this.days()[0];
      return sameDay(date, activeDate ?? null) ? 0 : -1;
    },

    dayLabel(date) {
      return dateLabelFormatter.format(date);
    },

    dayPressed(date) {
      const selectedStart = this.selectedStart();
      const selectedEnd = this.selectedEnd();
      return sameDay(date, selectedStart) || sameDay(date, selectedEnd) ? 'true' : false;
    },

    dayKey(date) {
      return dateKey(date);
    },

    selectDate(date) {
      if (this.dayDisabled(date)) return;
      if (!range) this.selected = date;
      else {
        const start = this.selectedStart();
        const end = this.selectedEnd();
        this.selected =
          !start || end
            ? { start: date, end: null }
            : date < start
              ? { start: date, end: start }
              : { start, end: date };
      }
      const value = range
        ? (() => {
            const selected = this.selected as LyraCalendarRange;
            return {
              start: selected.start ? isoFrom(selected.start) : null,
              end: selected.end ? isoFrom(selected.end) : null,
            };
          })()
        : isoFrom(this.selected as Date);
      this.$dispatch('lyra:change', { value });
    },

    onDayFocus(date) {
      this.focusedDate = date;
    },

    onDayKeydown(event, date) {
      let next: Date | null = null;
      if (event.key === 'ArrowLeft')
        next = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
      else if (event.key === 'ArrowRight')
        next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      else if (event.key === 'ArrowUp')
        next = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7);
      else if (event.key === 'ArrowDown')
        next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7);
      else if (event.key === 'Home') {
        next = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() - ((date.getDay() - weekStartsOn + 7) % 7),
        );
      } else if (event.key === 'End') {
        next = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() + (6 - ((date.getDay() - weekStartsOn + 7) % 7)),
        );
      } else if (event.key === 'PageUp') next = addMonths(date, -1);
      else if (event.key === 'PageDown') next = addMonths(date, 1);
      if (!next) return;
      event.preventDefault();
      this.moveFocus(next);
    },

    monthClass(month) {
      const anchor = this.selectedStart();
      return {
        'lyra-cal__mcell--selected': Boolean(
          anchor &&
          anchor.getMonth() === month.getMonth() &&
          anchor.getFullYear() === month.getFullYear(),
        ),
      };
    },

    yearClass(year) {
      const anchor = this.selectedStart();
      return { 'lyra-cal__mcell--selected': Boolean(anchor && anchor.getFullYear() === year) };
    },

    pickMonth(date) {
      this.view = date;
      this.mode = 'days';
    },

    pickYear(year) {
      this.view = new Date(year, this.view.getMonth(), 1);
      this.mode = 'months';
    },

    headerLabel() {
      if (this.mode === 'days') return monthFormatter.format(this.view);
      if (this.mode === 'months') return String(this.view.getFullYear());
      const [first] = this.years();
      return `${first} – ${first + 11}`;
    },

    prevLabel() {
      return this.mode === 'days'
        ? labels.previousMonth
        : this.mode === 'months'
          ? labels.previousYear
          : labels.previousYears;
    },

    nextLabel() {
      return this.mode === 'days'
        ? labels.nextMonth
        : this.mode === 'months'
          ? labels.nextYear
          : labels.nextYears;
    },

    navigate(amount) {
      if (this.mode === 'days')
        this.view = new Date(this.view.getFullYear(), this.view.getMonth() + amount, 1);
      else if (this.mode === 'months')
        this.view = new Date(this.view.getFullYear() + amount, this.view.getMonth(), 1);
      else this.view = new Date(this.view.getFullYear() + amount * 12, this.view.getMonth(), 1);
    },

    moveFocus(date) {
      this.pendingFocus = dateKey(date);
      this.focusedDate = date;
      this.view = new Date(date.getFullYear(), date.getMonth(), 1);
      this.$nextTick(() => this.focusPendingDay());
    },

    focusPendingDay() {
      const key = this.pendingFocus;
      if (!key) return;
      const day = this.root?.querySelector<HTMLElement>(`[data-key="${key}"]`);
      if (!day) return;
      whenVisible(
        day,
        () => this.pendingFocus !== key || this.mode !== 'days',
        () => {
          day.focus();
          if (this.pendingFocus === key) this.pendingFocus = null;
        },
      );
    },

    prev: {
      type: 'button',
      [':aria-label']() {
        return this.prevLabel();
      },
      ['@click']() {
        this.navigate(-1);
      },
    },

    next: {
      type: 'button',
      [':aria-label']() {
        return this.nextLabel();
      },
      ['@click']() {
        this.navigate(1);
      },
    },

    viewButton: {
      type: 'button',
      'aria-label': labels.changeView,
      ['@click']() {
        this.mode = this.mode === 'days' ? 'months' : 'years';
      },
    },

    today: {
      type: 'button',
      ['x-text']() {
        return labels.today;
      },
      ['@click']() {
        this.view = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
        this.selectDate(todayDate);
      },
    },
  };

  return state;
}
