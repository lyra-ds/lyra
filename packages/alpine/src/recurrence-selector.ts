/** The end condition for a recurrence rule. Dates are JSON-safe local ISO strings. */
export interface RecurrenceEnd {
  type: 'never' | 'count' | 'date';
  count?: number;
  date?: string | Date | null;
}

/** A local-time RRULE subset supported by {@link lyraRecurrenceSelector}. */
export interface RecurrenceRule {
  freq: 'none' | 'weekly' | 'monthly';
  interval?: number;
  byWeekday?: number[];
  end?: RecurrenceEnd;
}

/** A non-blocking unavailable occurrence warning. */
export interface RecurrenceConflict {
  date: string;
  reason?: string;
}

/** Complete sentence templates and visible labels for {@link lyraRecurrenceSelector}. */
export interface RecurrenceSelectorLabels {
  weekdaysShort?: readonly [string, string, string, string, string, string, string];
  weekdaysLong?: readonly [string, string, string, string, string, string, string];
  formatWeekdays?: (days: string[]) => string;
  formatOrdinal?: (value: number) => string;
  formatDate?: (value: Date | string) => string;
  none?: string;
  weekly?: string;
  weeklyCount?: string;
  weeklyDate?: string;
  weeklyInterval?: string;
  weeklyIntervalCount?: string;
  weeklyIntervalDate?: string;
  monthly?: string;
  monthlyCount?: string;
  monthlyDate?: string;
  monthlyInterval?: string;
  monthlyIntervalCount?: string;
  monthlyIntervalDate?: string;
  recurrence?: string;
  noRepeat?: string;
  everyWeek?: string;
  everyTwoWeeks?: string;
  everyMonth?: string;
  custom?: string;
  repeatEvery?: string;
  interval?: string;
  frequency?: string;
  weeks?: string;
  months?: string;
  weekdays?: string;
  ends?: string;
  neverEnds?: string;
  afterOccurrences?: string;
  onDate?: string;
  occurrences?: string;
  times?: string;
  endDate?: string;
  /** JSON-safe singular unavailable-occurrences sentence. */
  conflictsOne?: string;
  /** JSON-safe plural unavailable-occurrences sentence. */
  conflictsMany?: string;
}

/** React's function-valued `conflicts(count)` label becomes these JSON-safe whole templates. */
export const DEFAULT_LABELS: Required<RecurrenceSelectorLabels> = {
  weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  weekdaysLong: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  formatWeekdays: (days) =>
    new Intl.ListFormat('en-US', { style: 'long', type: 'conjunction' }).format(days),
  formatOrdinal: (value) => {
    const endings = ['th', 'st', 'nd', 'rd'];
    const mod = value % 100;
    return String(value) + (endings[(mod - 20) % 10] ?? endings[mod] ?? endings[0]);
  },
  formatDate: (value) =>
    toDate(value).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
  none: 'Does not repeat',
  weekly: 'Repeats every {days}',
  weeklyCount: 'Repeats every {days}, {count} times',
  weeklyDate: 'Repeats every {days}, until {date}',
  weeklyInterval: 'Repeats every {interval} weeks on {days}',
  weeklyIntervalCount: 'Repeats every {interval} weeks on {days}, {count} times',
  weeklyIntervalDate: 'Repeats every {interval} weeks on {days}, until {date}',
  monthly: 'Repeats every month on the {ordinal} {weekday}',
  monthlyCount: 'Repeats every month on the {ordinal} {weekday}, {count} times',
  monthlyDate: 'Repeats every month on the {ordinal} {weekday}, until {date}',
  monthlyInterval: 'Repeats every {interval} months on the {ordinal} {weekday}',
  monthlyIntervalCount: 'Repeats every {interval} months on the {ordinal} {weekday}, {count} times',
  monthlyIntervalDate: 'Repeats every {interval} months on the {ordinal} {weekday}, until {date}',
  recurrence: 'Recurrence',
  noRepeat: 'Does not repeat',
  everyWeek: 'Every week ({weekday})',
  everyTwoWeeks: 'Every 2 weeks ({weekday})',
  everyMonth: 'Every month ({ordinal} {weekday})',
  custom: 'Custom…',
  repeatEvery: 'Repeat every',
  interval: 'Interval',
  frequency: 'Frequency',
  weeks: 'week(s)',
  months: 'month(s)',
  weekdays: 'Days of the week',
  ends: 'Ends',
  neverEnds: 'Never ends',
  afterOccurrences: 'After N occurrences',
  onDate: 'On a date',
  occurrences: 'Occurrences',
  times: 'times',
  endDate: 'End date',
  conflictsOne: '1 occurrence falls in unavailable time; you can adjust it later.',
  conflictsMany: '{count} occurrences fall in unavailable time; you can adjust them later.',
};

const NONE_RULE: RecurrenceRule = {
  freq: 'none',
  interval: 1,
  byWeekday: [],
  end: { type: 'never' },
};

type Binding = Record<string, unknown>;

/** Initial configuration accepted by `x-data="lyraRecurrenceSelector(...)"`. */
export interface LyraRecurrenceSelectorOptions {
  /** Controllable rule. `null` means no recurrence. Date ends are normalized to ISO strings. */
  value?: RecurrenceRule | null;
  /** Base date for presets. A `YYYY-MM-DD` string becomes local noon. Default: today. */
  startDate?: string | Date;
  /** Initial count used by presets and the count-end control. */
  defaultEndCount?: number;
  /** Non-blocking unavailable occurrence warnings. */
  conflicts?: readonly RecurrenceConflict[];
  /** Labels merged over {@link DEFAULT_LABELS}. */
  labels?: RecurrenceSelectorLabels;
}

interface Preset {
  id: 'none' | 'weekly' | 'biweekly' | 'monthly';
  label: string;
  rule: RecurrenceRule;
}

interface LyraRecurrenceSelectorData {
  value: RecurrenceRule;
  custom: boolean;
  init(): void;
  presets(): Preset[];
  presetEntries(): Preset[];
  matchedPreset(): Preset | undefined;
  selectedValue(): string;
  showCustom(): boolean;
  summaryText(): string;
  conflictsText(): string;
  weekdayEntries(): { index: number; label: string }[];
  dayPressed(index: number): 'true' | 'false';
  dayClass(index: number): Record<string, boolean>;
  toggleDay(index: number): void;
  label(key: keyof Required<RecurrenceSelectorLabels>): string;
  recurrenceStartDate(): string;
  endType(): RecurrenceEnd['type'];
  endDate(): string | null;
  setEndDate(value: unknown): void;
  change(next: RecurrenceRule): void;
  changePreset(id: string): void;
  setInterval(value: number): void;
  setFrequency(freq: 'weekly' | 'monthly'): void;
  setEnd(type: RecurrenceEnd['type']): void;
  setCount(value: number): void;
  presetSelect: Binding;
  customSection: Binding;
  intervalInput: Binding;
  freqSelect: Binding;
  weekdayGroup: Binding;
  endSelect: Binding;
  countInput: Binding;
  countSuffix: Binding;
  summary: Binding;
  conflictsNote: Binding;
}

interface LyraRecurrenceSelectorMagics {
  $dispatch(name: string, detail?: unknown): void;
  $el: HTMLElement;
  $watch(path: string, callback: (value: unknown) => void): void;
}

type LyraRecurrenceSelectorState = LyraRecurrenceSelectorData & LyraRecurrenceSelectorMagics;

function toDate(value: Date | string | null | undefined): Date {
  if (value instanceof Date) return value;
  return new Date(String(value) + 'T12:00:00');
}

function isoDate(value: unknown): string | null {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = value instanceof Date ? value : value ? new Date(String(value)) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function normalizeRule(value: RecurrenceRule | null | undefined): RecurrenceRule {
  if (!value) return { ...NONE_RULE, byWeekday: [], end: { type: 'never' } };
  const end = value.end;
  return {
    ...value,
    byWeekday: value.byWeekday ? [...value.byWeekday] : value.byWeekday,
    end: end ? { ...end, ...(end.type === 'date' ? { date: isoDate(end.date) } : {}) } : value.end,
  };
}

function ordinalWeekday(date: Date): number {
  return Math.floor((date.getDate() - 1) / 7) + 1;
}

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

/**
 * Returns one complete localized sentence for a recurrence rule. Sentence templates, rather than
 * concatenated fragments, preserve each locale's word order.
 */
export function describeRecurrence(
  rule: RecurrenceRule | null,
  startDate: Date | string,
  labelsProp?: RecurrenceSelectorLabels,
): string {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  if (!rule || rule.freq === 'none') return labels.none;
  const start = toDate(startDate);
  const weekdays = (rule.byWeekday?.length ? rule.byWeekday : [start.getDay()])
    .slice()
    .sort((left, right) => left - right)
    .map((day) => labels.weekdaysLong[day]!);
  const values = {
    days: labels.formatWeekdays(weekdays),
    interval: Math.max(1, rule.interval ?? 1),
    ordinal: labels.formatOrdinal(ordinalWeekday(start)),
    weekday: labels.weekdaysLong[start.getDay()]!,
    count: rule.end?.count ?? 1,
    date: rule.end?.date ? labels.formatDate(rule.end.date) : '',
  };
  const end = rule.end?.type ?? 'never';
  const interval = Math.max(1, rule.interval ?? 1);
  const template =
    rule.freq === 'monthly'
      ? interval === 1
        ? end === 'count'
          ? labels.monthlyCount
          : end === 'date'
            ? labels.monthlyDate
            : labels.monthly
        : end === 'count'
          ? labels.monthlyIntervalCount
          : end === 'date'
            ? labels.monthlyIntervalDate
            : labels.monthlyInterval
      : interval === 1
        ? end === 'count'
          ? labels.weeklyCount
          : end === 'date'
            ? labels.weeklyDate
            : labels.weekly
        : end === 'count'
          ? labels.weeklyIntervalCount
          : end === 'date'
            ? labels.weeklyIntervalDate
            : labels.weeklyInterval;
  return interpolate(template, values);
}

/**
 * Preset-first RRULE-subset editor over consumer-served native controls. `value` is modelable and
 * every interaction dispatches `lyra:change` with `{ value }`; external `x-model` writes do not.
 *
 * React's function-valued `conflicts(count)` label is deliberately represented by the JSON-safe
 * `conflictsOne` and `conflictsMany` whole-sentence templates in {@link DEFAULT_LABELS}.
 *
 * ```html
 * <div class="lyra-recur" x-data="lyraRecurrenceSelector({ value: rule, startDate: '2026-08-03' })"
 *   x-modelable="value" x-model="rule">
 *   <span class="lyra-select-wrap"><select class="lyra-input" x-bind="presetSelect">
 *     <template x-for="preset in presetEntries()" :key="preset.id"><option :value="preset.id" :selected="preset.id === selectedValue()" x-text="preset.label"></option></template>
 *     <option value="custom" :selected="selectedValue() === 'custom'" x-text="label('custom')"></option>
 *   </select></span>
 *   <div class="lyra-recur__custom" x-bind="customSection">
 *     <div class="lyra-recur__freqrow"><span x-text="label('repeatEvery')"></span><input class="lyra-input" x-bind="intervalInput"><span class="lyra-select-wrap"><select class="lyra-input" x-bind="freqSelect"><option value="weekly" x-text="label('weeks')"></option><option value="monthly" x-text="label('months')"></option></select></span></div>
 *     <div class="lyra-recur__days" x-bind="weekdayGroup"><template x-for="day in weekdayEntries()" :key="day.index"><button class="lyra-recur__day" x-bind="{ type: 'button' }" :class="dayClass(day.index)" :aria-pressed="dayPressed(day.index)" @click="toggleDay(day.index)" x-text="day.label"></button></template></div>
 *     <div class="lyra-recur__endrow"><span class="lyra-select-wrap"><select class="lyra-input" x-bind="endSelect"><option value="never" x-text="label('neverEnds')"></option><option value="count" x-text="label('afterOccurrences')"></option><option value="date" x-text="label('onDate')"></option></select></span><input class="lyra-input" x-bind="countInput"><span x-bind="countSuffix"></span>
 *       <span class="lyra-recur__enddate" x-show="endType() === 'date'">
 *         <!-- Alias scope: avoids a selected ↔ selected modelable self-entanglement. -->
 *         <div x-data="{ get recurrenceEndDate() { return endDate() }, set recurrenceEndDate(v) { setEndDate(v) } }">
 *           <div class="lyra-datepicker" x-data="lyraDatePicker({ defaultValue: recurrenceEndDate, placeholder: label('endDate') })" x-modelable="selected" x-model="recurrenceEndDate">
 *             <template x-if="!mobile"><div x-data="{ get pickerOpen() { return open }, set pickerOpen(v) { open = v } }"><div class="lyra-popover-anchor" x-data="lyraPopover({ ariaLabel: label('endDate') })" x-modelable="open" x-model="pickerOpen"><button class="lyra-input lyra-datepicker__btn" x-bind="trigger"><span :class="{ 'lyra-datepicker__ph': !hasSelection() }" x-text="triggerText()"></span></button><div class="lyra-popover" x-bind="panel"><div x-data="{ get pickerSelected() { return selected }, set pickerSelected(v) { selected = v } }"><div class="lyra-cal" x-data="lyraCalendar({ min: recurrenceStartDate() })" x-modelable="selected" x-model="pickerSelected"><div class="lyra-cal__head"><button class="lyra-cal__nav" x-bind="prev">Previous</button><button class="lyra-cal__label" x-bind="viewButton" x-text="headerLabel()"></button><button class="lyra-cal__nav" x-bind="next">Next</button></div><template x-if="mode === 'days'"><div class="lyra-cal__grid"><template x-for="weekday in weekdays()" :key="weekday.key"><span class="lyra-cal__wd" :aria-label="weekday.long" x-text="weekday.narrow"></span></template><template x-for="date in days()" :key="dayKey(date)"><button class="lyra-cal__day" type="button" :class="dayClass(date)" :aria-disabled="dayDisabled(date)" :tabindex="dayTabindex(date)" :aria-label="dayLabel(date)" :aria-pressed="dayPressed(date)" :data-key="dayKey(date)" @click="selectDate(date)" @focus="onDayFocus(date)" @keydown="onDayKeydown($event, date)"><span x-text="date.getDate()"></span></button></template></div></template><template x-if="mode === 'months'"><div class="lyra-cal__mgrid"><template x-for="month in months()" :key="month.getMonth()"><button class="lyra-cal__mcell" type="button" :class="monthClass(month)" @click="pickMonth(month)" x-text="monthName(month)"></button></template></div></template><template x-if="mode === 'years'"><div class="lyra-cal__mgrid"><template x-for="year in years()" :key="year"><button class="lyra-cal__mcell" type="button" :class="yearClass(year)" @click="pickYear(year)" x-text="year"></button></template></div></template><div class="lyra-cal__foot"><button class="lyra-cal__today" x-bind="today"></button></div></div></div></div></div></div></div></template>
 *             <template x-if="mobile"><div><div class="lyra-datepicker"><button class="lyra-input lyra-datepicker__btn" type="button" @click="open = true"><span :class="{ 'lyra-datepicker__ph': !hasSelection() }" x-text="triggerText()"></span></button></div><div x-data="{ get pickerOpen() { return open }, set pickerOpen(v) { open = v } }"><div x-data="lyraBottomSheet()" x-modelable="open" x-model="pickerOpen"><div class="lyra-bottomsheet-overlay" x-bind="overlay"><div class="lyra-bottomsheet" role="dialog" aria-modal="true" tabindex="-1" aria-labelledby="recurrence-end-date-title" x-bind="panel"><div class="lyra-bottomsheet__header"><h2 id="recurrence-end-date-title" class="lyra-bottomsheet__title" x-text="label('endDate')"></h2><button class="lyra-bottomsheet__close" x-bind="close">Close</button></div><div class="lyra-bottomsheet__body"><div class="lyra-cal--sheet"><div x-data="{ get pickerSelected() { return selected }, set pickerSelected(v) { selected = v } }"><div class="lyra-cal" x-data="lyraCalendar({ min: recurrenceStartDate() })" x-modelable="selected" x-model="pickerSelected"><div class="lyra-cal__head"><button class="lyra-cal__nav" x-bind="prev">Previous</button><button class="lyra-cal__label" x-bind="viewButton" x-text="headerLabel()"></button><button class="lyra-cal__nav" x-bind="next">Next</button></div><template x-if="mode === 'days'"><div class="lyra-cal__grid"><template x-for="weekday in weekdays()" :key="weekday.key"><span class="lyra-cal__wd" :aria-label="weekday.long" x-text="weekday.narrow"></span></template><template x-for="date in days()" :key="dayKey(date)"><button class="lyra-cal__day" type="button" :class="dayClass(date)" :aria-disabled="dayDisabled(date)" :tabindex="dayTabindex(date)" :aria-label="dayLabel(date)" :aria-pressed="dayPressed(date)" :data-key="dayKey(date)" @click="selectDate(date)" @focus="onDayFocus(date)" @keydown="onDayKeydown($event, date)"><span x-text="date.getDate()"></span></button></template></div></template><template x-if="mode === 'months'"><div class="lyra-cal__mgrid"><template x-for="month in months()" :key="month.getMonth()"><button class="lyra-cal__mcell" type="button" :class="monthClass(month)" @click="pickMonth(month)" x-text="monthName(month)"></button></template></div></template><template x-if="mode === 'years'"><div class="lyra-cal__mgrid"><template x-for="year in years()" :key="year"><button class="lyra-cal__mcell" type="button" :class="yearClass(year)" @click="pickYear(year)" x-text="year"></button></template></div></template><div class="lyra-cal__foot"><button class="lyra-cal__today" x-bind="today"></button></div></div></div></div></div></div></div></div></div></div></div></div></template>
 *           </div>
 *         </div>
 *       </span>
 *     </div>
 *   </div>
 *   <span class="lyra-recur__summary" x-bind="summary"></span><span class="lyra-recur__summary" x-bind="conflictsNote"></span>
 * </div>
 * ```
 */
export function lyraRecurrenceSelector({
  value = null,
  startDate = new Date(),
  defaultEndCount,
  conflicts = [],
  labels: labelsProp,
}: LyraRecurrenceSelectorOptions = {}): LyraRecurrenceSelectorData {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const start = toDate(startDate);
  const defaultEnd = defaultEndCount
    ? { type: 'count' as const, count: defaultEndCount }
    : { type: 'never' as const };
  const state: LyraRecurrenceSelectorData & ThisType<LyraRecurrenceSelectorState> = {
    value: normalizeRule(value),
    custom: false,
    init() {
      this.$watch('value', (next) => {
        const normalized = normalizeRule(next as RecurrenceRule | null | undefined);
        if (JSON.stringify(next) !== JSON.stringify(normalized)) this.value = normalized;
      });
    },
    presets() {
      const weekday = start.getDay();
      return [
        { id: 'none', label: labels.noRepeat, rule: normalizeRule(null) },
        {
          id: 'weekly',
          label: interpolate(labels.everyWeek, { weekday: labels.weekdaysShort[weekday]! }),
          rule: { freq: 'weekly', interval: 1, byWeekday: [weekday], end: { ...defaultEnd } },
        },
        {
          id: 'biweekly',
          label: interpolate(labels.everyTwoWeeks, { weekday: labels.weekdaysShort[weekday]! }),
          rule: { freq: 'weekly', interval: 2, byWeekday: [weekday], end: { ...defaultEnd } },
        },
        {
          id: 'monthly',
          label: interpolate(labels.everyMonth, {
            ordinal: labels.formatOrdinal(ordinalWeekday(start)),
            weekday: labels.weekdaysLong[weekday]!,
          }),
          rule: { freq: 'monthly', interval: 1, byWeekday: [weekday], end: { ...defaultEnd } },
        },
      ];
    },
    presetEntries() {
      return this.presets();
    },
    matchedPreset() {
      const rule = normalizeRule(this.value);
      return this.presets().find(
        (preset) =>
          preset.rule.freq === rule.freq &&
          preset.rule.interval === (rule.interval ?? 1) &&
          String([...(preset.rule.byWeekday ?? [])].sort()) ===
            String([...(rule.byWeekday ?? [])].sort()),
      );
    },
    selectedValue() {
      return this.custom ? 'custom' : (this.matchedPreset()?.id ?? 'custom');
    },
    showCustom() {
      return this.custom || (!this.matchedPreset() && normalizeRule(this.value).freq !== 'none');
    },
    summaryText() {
      return describeRecurrence(normalizeRule(this.value), start, labels);
    },
    conflictsText() {
      return conflicts.length === 1
        ? labels.conflictsOne
        : interpolate(labels.conflictsMany, { count: conflicts.length });
    },
    weekdayEntries() {
      return labels.weekdaysShort.map((label, index) => ({ index, label }));
    },
    dayPressed(index) {
      return (normalizeRule(this.value).byWeekday ?? []).includes(index) ? 'true' : 'false';
    },
    dayClass(index) {
      return { 'lyra-recur__day--on': this.dayPressed(index) === 'true' };
    },
    toggleDay(index) {
      const rule = normalizeRule(this.value);
      const current = rule.byWeekday ?? [];
      const next = current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index];
      if (next.length) this.change({ ...rule, byWeekday: next });
    },
    label(key) {
      return String(labels[key]);
    },
    recurrenceStartDate() {
      return isoDate(start) ?? '';
    },
    endType() {
      return normalizeRule(this.value).end?.type ?? 'never';
    },
    endDate() {
      return isoDate(normalizeRule(this.value).end?.date);
    },
    setEndDate(value) {
      const date = isoDate(value);
      const rule = normalizeRule(this.value);
      if (rule.end?.type === 'date' && rule.end.date === date) return;
      this.change({ ...rule, end: { type: 'date', date } });
    },
    change(next: RecurrenceRule) {
      const normalized = normalizeRule(next);
      this.value = normalized;
      this.$dispatch('lyra:change', { value: normalized });
    },
    changePreset(id: string) {
      const rule = normalizeRule(this.value);
      if (id === 'custom') {
        this.custom = true;
        if (rule.freq === 'none')
          this.change({
            freq: 'weekly',
            interval: 1,
            byWeekday: [start.getDay()],
            end: { ...defaultEnd },
          });
        return;
      }
      const preset = this.presets().find((item) => item.id === id);
      if (!preset) return;
      this.custom = false;
      this.change(preset.rule);
    },
    setInterval(value: number) {
      this.change({ ...normalizeRule(this.value), interval: Math.max(1, value || 1) });
    },
    setFrequency(freq: 'weekly' | 'monthly') {
      this.change({ ...normalizeRule(this.value), freq });
    },
    setEnd(type: RecurrenceEnd['type']) {
      const rule = normalizeRule(this.value);
      const end = rule.end ?? { type: 'never' as const };
      this.change({
        ...rule,
        end:
          type === 'never'
            ? { type }
            : type === 'count'
              ? { type, count: end.count ?? defaultEndCount ?? 8 }
              : { type, date: isoDate(end.date) },
      });
    },
    setCount(value: number) {
      this.change({
        ...normalizeRule(this.value),
        end: { type: 'count', count: Math.max(1, value || 1) },
      });
    },
    presetSelect: {
      [':value']() {
        return this.selectedValue();
      },
      [':aria-label']() {
        return labels.recurrence;
      },
      ['@change']() {
        this.changePreset((this.$el as HTMLSelectElement).value);
      },
    },
    customSection: {
      ['x-show']() {
        return this.showCustom();
      },
    },
    intervalInput: {
      type: 'number',
      min: 1,
      max: 12,
      [':value']() {
        return normalizeRule(this.value).interval ?? 1;
      },
      [':aria-label']() {
        return labels.interval;
      },
      ['@change']() {
        this.setInterval(Number((this.$el as HTMLInputElement).value));
      },
    },
    freqSelect: {
      [':value']() {
        return normalizeRule(this.value).freq === 'monthly' ? 'monthly' : 'weekly';
      },
      [':aria-label']() {
        return labels.frequency;
      },
      ['@change']() {
        this.setFrequency((this.$el as HTMLSelectElement).value as 'weekly' | 'monthly');
      },
    },
    weekdayGroup: {
      role: 'group',
      [':aria-label']() {
        return labels.weekdays;
      },
      ['x-show']() {
        return normalizeRule(this.value).freq !== 'monthly';
      },
    },
    endSelect: {
      [':value']() {
        return this.endType();
      },
      [':aria-label']() {
        return labels.ends;
      },
      ['@change']() {
        this.setEnd((this.$el as HTMLSelectElement).value as RecurrenceEnd['type']);
      },
    },
    countInput: {
      type: 'number',
      min: 1,
      max: 99,
      ['x-show']() {
        return this.endType() === 'count';
      },
      [':value']() {
        return normalizeRule(this.value).end?.count ?? 8;
      },
      [':aria-label']() {
        return labels.occurrences;
      },
      ['@change']() {
        this.setCount(Number((this.$el as HTMLInputElement).value));
      },
    },
    countSuffix: {
      ['x-show']() {
        return this.endType() === 'count';
      },
      ['x-text']() {
        return labels.times;
      },
    },
    summary: {
      ['x-text']() {
        return this.summaryText();
      },
      ['aria-live']: 'polite',
    },
    conflictsNote: {
      role: 'status',
      ['x-show']() {
        return conflicts.length > 0;
      },
      ['x-text']() {
        return this.conflictsText();
      },
    },
  };
  return state;
}
