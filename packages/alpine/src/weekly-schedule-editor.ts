import { isoFrom, normalizeDay } from './internal/date-utils';

/** A local-time availability window. */
export interface TimeRange {
  /** Local 24-hour start time in HH:mm form. */
  start: string;
  /** Local 24-hour end time in HH:mm form. */
  end: string;
}

/** Weekday indices, where 0 is Sunday and 6 is Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Availability windows keyed by weekday. */
export type WeeklySchedule = Record<Weekday, TimeRange[]>;

/** A date-specific local schedule that overrides its weekday. */
export interface DateException {
  /** Local ISO date in YYYY-MM-DD form. */
  date: string;
  /** An empty array marks the complete day unavailable. */
  ranges: TimeRange[];
}

/** Translatable labels for {@link lyraWeeklyScheduleEditor}. */
export interface WeeklyScheduleEditorLabels {
  /** Full weekday labels, Sunday through Saturday. */
  weekdays?: readonly [string, string, string, string, string, string, string];
  /** Formats an exception date. */
  formatDate?: (date: string) => string;
  /** Formats availability ranges in an exception. */
  formatRanges?: (ranges: TimeRange[]) => string;
  unavailable?: string;
  /** JSON-safe template with `{day}`. */
  copyToOtherDays?: string;
  copySchedule?: string;
  /** JSON-safe template with `{day}`. */
  copyFrom?: string;
  apply?: string;
  addInterval?: string;
  removeInterval?: string;
  /** JSON-safe template with `{day}`. */
  startTime?: string;
  /** JSON-safe template with `{day}`. */
  endTime?: string;
  invalidRange?: string;
  exceptions?: string;
  unavailableAllDay?: string;
  removeException?: string;
  addException?: string;
}

/** Initial configuration accepted by `x-data="lyraWeeklyScheduleEditor(...)"`. */
export interface LyraWeeklyScheduleEditorOptions {
  /** Weekly local-time availability, merged over the empty seven-day schedule. */
  value?: Partial<WeeklySchedule>;
  /** Date-specific availability overrides. */
  exceptions?: DateException[];
  /** Range created when enabling a weekday. Default: 09:00–17:00. */
  defaultRange?: TimeRange;
  /** First displayed weekday, where 0 is Sunday. Default: 1. */
  weekStartsOn?: Weekday;
  /** Whether to render date exceptions. Default: true. */
  showExceptions?: boolean;
  /** Translatable labels merged over English defaults. */
  labels?: WeeklyScheduleEditorLabels;
}

type TextLabel = Exclude<
  keyof Required<WeeklyScheduleEditorLabels>,
  'weekdays' | 'formatDate' | 'formatRanges'
>;

interface LyraWeeklyScheduleEditorData {
  value: WeeklySchedule;
  exceptions: DateException[];
  showExceptions: boolean;
  copyOpenByDay: Partial<Record<Weekday, boolean>>;
  pickedByDay: Partial<Record<Weekday, Weekday[]>>;
  root: HTMLElement | null;
  onNestedChange: ((event: Event) => void) | null;
  init(): void;
  emit(name: string, detail: Record<string, unknown>): void;
  destroy(): void;
  order(): Weekday[];
  rangesFor(day: Weekday): TimeRange[];
  enabled(day: Weekday): boolean;
  invalid(range: TimeRange): boolean;
  nextRange(ranges: TimeRange[]): TimeRange;
  dayLabel(day: Weekday): string;
  label(name: TextLabel, values?: Record<string, string | number>): string;
  formatDate(date: string): string;
  exceptionText(exception: DateException): string;
  setEnabled(day: Weekday, enabled: boolean): void;
  addRange(day: Weekday): void;
  removeRange(day: Weekday, index: number): void;
  setRangeStart(day: Weekday, index: number, time: string | null): void;
  setRangeEnd(day: Weekday, index: number, time: string | null): void;
  copyTargets(from: Weekday): Weekday[];
  copyOpenFor(day: Weekday): boolean;
  setCopyOpen(day: Weekday, open: boolean): void;
  picked(day: Weekday): Weekday[];
  togglePicked(from: Weekday, target: Weekday): void;
  applyCopy(from: Weekday): void;
  addException(value: unknown): void;
  removeException(index: number): void;
}

interface LyraWeeklyScheduleEditorMagics {
  $dispatch(name: string, detail?: Record<string, unknown>): void;
  $el: HTMLElement;
  $watch(path: string, callback: (value: unknown) => void): void;
}

type LyraWeeklyScheduleEditorState = LyraWeeklyScheduleEditorData & LyraWeeklyScheduleEditorMagics;

const EMPTY_SCHEDULE: WeeklySchedule = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

const DEFAULT_LABELS: Required<WeeklyScheduleEditorLabels> = {
  weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  formatDate: (date) =>
    new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
  formatRanges: (ranges) => ranges.map((range) => `${range.start}–${range.end}`).join(', '),
  unavailable: 'Unavailable',
  copyToOtherDays: 'Copy {day} to other days',
  copySchedule: 'Copy schedule',
  copyFrom: 'Copy {day} to…',
  apply: 'Apply',
  addInterval: '+ Add interval',
  removeInterval: 'Remove interval',
  startTime: '{day} — start',
  endTime: '{day} — end',
  invalidRange: 'End time must be after start time.',
  exceptions: 'Exceptions',
  unavailableAllDay: 'Unavailable all day',
  removeException: 'Remove exception',
  addException: 'Add exception…',
};

function mergeSchedule(value: Partial<WeeklySchedule> | null | undefined): WeeklySchedule {
  return { ...EMPTY_SCHEDULE, ...(value ?? {}) };
}

function minutes(time: string): number {
  const [hours, mins = '0'] = time.split(':');
  return Number(hours) * 60 + Number(mins);
}

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

/**
 * An editor for weekly local-time availability windows and date exceptions over consumer markup.
 * `value` and `exceptions` are independently modelable. User interactions dispatch respectively
 * `lyra:change` with `{ value }` and `lyra:exceptions` with `{ exceptions }`; external model
 * writes never dispatch. React's function-valued sentence labels are JSON-safe whole templates:
 * `copyToOtherDays`, `copyFrom`, `startTime`, and `endTime` interpolate `{day}`. `formatDate`
 * and `formatRanges` remain formatting functions with the React English defaults.
 *
 * ```html
 * <div class="lyra-sched" x-data="lyraWeeklyScheduleEditor({ value, exceptions })" x-modelable="value" x-model="value">
 *   <template x-for="day in order()" :key="day"><div class="lyra-sched__row">
 *     <div class="lyra-sched__daycell"><label class="lyra-switch"><input type="checkbox" role="switch" :checked="enabled(day)" @change="setEnabled(day, $event.currentTarget.checked)"><span class="lyra-switch__track" aria-hidden="true"></span><span x-text="dayLabel(day)"></span></label></div>
 *     <template x-if="enabled(day)"><div class="lyra-sched__ranges">
 *       <template x-for="(range, index) in rangesFor(day)" :key="index"><div>
 *         <div class="lyra-sched__range">
 *           <!-- Alias scopes avoid selected ↔ selected modelable self-entanglement. -->
 *           <div class="lyra-timeinput" x-data="{ get rangeStart() { return range.start }, set rangeStart(v) { setRangeStart(day, index, v) } }"><div x-data="lyraTimeInput({ defaultValue: rangeStart })" x-modelable="selected" x-model="rangeStart"><input class="lyra-input" x-bind="input" :aria-label="label('startTime', { day: dayLabel(day) })"><button class="lyra-timeinput__step" x-bind="down">−</button><button class="lyra-timeinput__step" x-bind="up">+</button></div></div>
 *           <span class="lyra-sched__dash">–</span>
 *           <div class="lyra-timeinput" x-data="{ get rangeEnd() { return range.end }, set rangeEnd(v) { setRangeEnd(day, index, v) } }"><div x-data="lyraTimeInput({ defaultValue: rangeEnd })" x-modelable="selected" x-model="rangeEnd"><input class="lyra-input" x-bind="input" :aria-label="label('endTime', { day: dayLabel(day) })" :aria-invalid="invalid(range) ? true : false" :class="{ 'lyra-input--error': invalid(range) }"><button class="lyra-timeinput__step" x-bind="down">−</button><button class="lyra-timeinput__step" x-bind="up">+</button></div></div>
 *           <template x-if="rangesFor(day).length > 1"><button type="button" class="lyra-sched__ghostbtn" :aria-label="label('removeInterval')" @click="removeRange(day, index)"><!-- consumer x icon slot --></button></template>
 *         </div>
 *         <template x-if="invalid(range)"><span class="lyra-sched__error" x-text="label('invalidRange')"></span></template>
 *       </div></template>
 *       <button type="button" class="lyra-sched__addrange" @click="addRange(day)" x-text="label('addInterval')"></button>
 *     </div></template>
 *     <template x-if="!enabled(day)"><span class="lyra-sched__off" x-text="label('unavailable')"></span></template>
 *     <div class="lyra-sched__actions"><template x-if="enabled(day)"><div x-data="{ get copyOpen() { return copyOpenFor(day) }, set copyOpen(v) { setCopyOpen(day, v) } }">
 *       <div class="lyra-popover-anchor" x-data="lyraPopover({ ariaLabel: label('copySchedule') })" x-modelable="open" x-model="copyOpen">
 *         <button class="lyra-sched__ghostbtn" x-bind="trigger" :aria-label="label('copyToOtherDays', { day: dayLabel(day) })" :title="label('copyFrom', { day: dayLabel(day) })"><!-- consumer copy icon slot --></button>
 *         <div class="lyra-popover" x-bind="panel"><div class="lyra-sched__copy"><span class="lyra-sched__copy-title" x-text="label('copyFrom', { day: dayLabel(day) })"></span><template x-for="target in copyTargets(day)" :key="target"><label class="lyra-check-row"><input type="checkbox" class="lyra-checkbox" :checked="picked(day).includes(target)" @change="togglePicked(day, target)"><span x-text="dayLabel(target)"></span></label></template><button type="button" class="lyra-btn lyra-btn--primary lyra-btn--sm" :disabled="picked(day).length === 0" @click="applyCopy(day)" x-text="label('apply')"></button></div></div>
 *       </div>
 *     </div></template></div>
 *   </div></template>
 *   <template x-if="showExceptions"><div class="lyra-sched__exc"><span class="lyra-label" x-text="label('exceptions')"></span><template x-for="(exception, index) in exceptions" :key="exception.date"><div class="lyra-sched__exc-row"><span class="lyra-sched__exc-date" x-text="formatDate(exception.date)"></span><span x-text="exceptionText(exception)"></span><button type="button" class="lyra-sched__ghostbtn" :aria-label="label('removeException')" @click="removeException(index)"><!-- consumer x icon slot --></button></div></template>
 *     <div x-data="{ get exceptionDate() { return null }, set exceptionDate(v) { addException(v) } }"><div class="lyra-datepicker" x-data="lyraDatePicker({ placeholder: label('addException') })" x-modelable="selected" x-model="exceptionDate"><template x-if="!mobile"><div><div x-data="{ get pickerOpen() { return open }, set pickerOpen(v) { open = v } }"><div class="lyra-popover-anchor" x-data="lyraPopover({ ariaLabel: label('addException') })" x-modelable="open" x-model="pickerOpen"><button class="lyra-input lyra-datepicker__btn" x-bind="trigger"><span :class="{ 'lyra-datepicker__ph': !hasSelection() }" x-text="triggerText()"></span></button><div class="lyra-popover" x-bind="panel"><div x-data="{ get pickerSelected() { return selected }, set pickerSelected(v) { selected = v } }"><div class="lyra-cal" x-data="lyraCalendar({ min: new Date() })" x-modelable="selected" x-model="pickerSelected"><div class="lyra-cal__head"><button class="lyra-cal__nav" x-bind="prev">Previous</button><button class="lyra-cal__label" x-bind="viewButton" x-text="headerLabel()"></button><button class="lyra-cal__nav" x-bind="next">Next</button></div><template x-if="mode === 'days'"><div class="lyra-cal__grid"><template x-for="weekday in weekdays()" :key="weekday.key"><span class="lyra-cal__wd" :aria-label="weekday.long" x-text="weekday.narrow"></span></template><template x-for="date in days()" :key="dayKey(date)"><button class="lyra-cal__day" type="button" :class="dayClass(date)" :aria-disabled="dayDisabled(date)" :tabindex="dayTabindex(date)" :aria-label="dayLabel(date)" :aria-pressed="dayPressed(date)" :data-key="dayKey(date)" @click="selectDate(date)" @focus="onDayFocus(date)" @keydown="onDayKeydown($event, date)"><span x-text="date.getDate()"></span></button></template></div></template><template x-if="mode === 'months'"><div class="lyra-cal__mgrid"><template x-for="month in months()" :key="month.getMonth()"><button class="lyra-cal__mcell" type="button" :class="monthClass(month)" @click="pickMonth(month)" x-text="monthName(month)"></button></template></div></template><template x-if="mode === 'years'"><div class="lyra-cal__mgrid"><template x-for="year in years()" :key="year"><button class="lyra-cal__mcell" type="button" :class="yearClass(year)" @click="pickYear(year)" x-text="year"></button></template></div></template><div class="lyra-cal__foot"><button class="lyra-cal__today" x-bind="today"></button></div></div></div></div></div></div></div></div></template></div></div>
 *   </div></template>
 * </div>
 * ```
 */
export function lyraWeeklyScheduleEditor({
  value,
  exceptions = [],
  defaultRange = { start: '09:00', end: '17:00' },
  weekStartsOn = 1,
  showExceptions = true,
  labels: labelsProp,
}: LyraWeeklyScheduleEditorOptions = {}): LyraWeeklyScheduleEditorData {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const state: LyraWeeklyScheduleEditorData & ThisType<LyraWeeklyScheduleEditorState> = {
    value: mergeSchedule(value),
    exceptions,
    showExceptions,
    copyOpenByDay: {},
    pickedByDay: {},
    root: null,
    onNestedChange: null,

    init() {
      this.root = this.$el;
      // TimeInput and Calendar also emit lyra:change. Their alias setters have already routed
      // the interaction through this component, so do not leak their scalar payloads to users.
      this.onNestedChange = (event) => {
        if (event.target !== this.root) event.stopImmediatePropagation();
      };
      this.root.addEventListener('lyra:change', this.onNestedChange);
      this.$watch('value', (next) => {
        const normalized = mergeSchedule(next as Partial<WeeklySchedule> | null | undefined);
        if (JSON.stringify(next) !== JSON.stringify(normalized)) this.value = normalized;
      });
    },

    emit(name, detail) {
      // Dispatch from the captured root: the nested-event guard above drops any lyra:change
      // whose target is not the root, and $dispatch would fire from the triggering child.
      this.root?.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));
    },

    destroy() {
      if (this.root && this.onNestedChange)
        this.root.removeEventListener('lyra:change', this.onNestedChange);
      this.root = null;
      this.onNestedChange = null;
    },

    order() {
      return Array.from({ length: 7 }, (_, index) => ((index + weekStartsOn) % 7) as Weekday);
    },

    rangesFor(day) {
      return this.value[day] ?? [];
    },

    enabled(day) {
      return this.rangesFor(day).length > 0;
    },

    invalid(range) {
      return Boolean(range.start && range.end && minutes(range.end) <= minutes(range.start));
    },

    nextRange(ranges) {
      const start = ranges.at(-1)?.end ?? defaultRange.start;
      const [hours, mins = '00'] = start.split(':');
      const endHour = Math.min(23, Number(hours) + 2);
      return {
        start,
        end: start >= '22:00' ? '23:59' : `${String(endHour).padStart(2, '0')}:${mins}`,
      };
    },

    dayLabel(day) {
      return labels.weekdays[day];
    },

    label(name, values = {}) {
      return interpolate(labels[name], values);
    },

    formatDate(date) {
      return labels.formatDate(date);
    },

    exceptionText(exception) {
      return exception.ranges.length
        ? labels.formatRanges(exception.ranges)
        : labels.unavailableAllDay;
    },

    setEnabled(day, enabled) {
      this.value = { ...this.value, [day]: enabled ? [{ ...defaultRange }] : [] };
      this.emit('lyra:change', { value: this.value });
    },

    addRange(day) {
      const ranges = this.rangesFor(day);
      this.value = { ...this.value, [day]: [...ranges, this.nextRange(ranges)] };
      this.emit('lyra:change', { value: this.value });
    },

    removeRange(day, index) {
      this.value = {
        ...this.value,
        [day]: this.rangesFor(day).filter((_, rangeIndex) => rangeIndex !== index),
      };
      this.emit('lyra:change', { value: this.value });
    },

    setRangeStart(day, index, time) {
      if (!time) return;
      this.value = {
        ...this.value,
        [day]: this.rangesFor(day).map((range, rangeIndex) =>
          rangeIndex === index ? { ...range, start: time } : range,
        ),
      };
      this.emit('lyra:change', { value: this.value });
    },

    setRangeEnd(day, index, time) {
      if (!time) return;
      this.value = {
        ...this.value,
        [day]: this.rangesFor(day).map((range, rangeIndex) =>
          rangeIndex === index ? { ...range, end: time } : range,
        ),
      };
      this.emit('lyra:change', { value: this.value });
    },

    copyTargets(from) {
      return ([0, 1, 2, 3, 4, 5, 6] as Weekday[]).filter((day) => day !== from);
    },

    copyOpenFor(day) {
      return this.copyOpenByDay[day] ?? false;
    },

    setCopyOpen(day, open) {
      const wasOpen = this.copyOpenFor(day);
      this.copyOpenByDay = { ...this.copyOpenByDay, [day]: open };
      if (open && !wasOpen) this.pickedByDay = { ...this.pickedByDay, [day]: [] };
    },

    picked(day) {
      return this.pickedByDay[day] ?? [];
    },

    togglePicked(from, target) {
      const current = this.picked(from);
      this.pickedByDay = {
        ...this.pickedByDay,
        [from]: current.includes(target)
          ? current.filter((day) => day !== target)
          : [...current, target],
      };
    },

    applyCopy(from) {
      const next = { ...this.value };
      for (const target of this.picked(from)) {
        next[target] = this.rangesFor(from).map((range) => ({ ...range }));
      }
      this.value = next;
      this.emit('lyra:change', { value: this.value });
      this.setCopyOpen(from, false);
    },

    addException(value) {
      const date = normalizeDay(value);
      if (!date) return;
      const nextDate = isoFrom(date);
      if (this.exceptions.some((exception) => exception.date === nextDate)) return;
      this.exceptions = [...this.exceptions, { date: nextDate, ranges: [] }].sort((left, right) =>
        left.date.localeCompare(right.date),
      );
      this.emit('lyra:exceptions', { exceptions: this.exceptions });
    },

    removeException(index) {
      this.exceptions = this.exceptions.filter((_, exceptionIndex) => exceptionIndex !== index);
      this.emit('lyra:exceptions', { exceptions: this.exceptions });
    },
  };

  return state;
}
