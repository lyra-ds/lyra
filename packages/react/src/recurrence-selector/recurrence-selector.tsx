import { forwardRef, useState } from 'react';
import type { HTMLAttributes } from 'react';
import { DatePicker } from '../date-picker';
import { cx } from '../internal/cx';
import { useControllableState } from '../internal/use-controllable-state';

/** The end condition for a recurrence rule. */
export interface RecurrenceEnd {
  /** Whether the series never ends, ends after a count, or ends on a date. */
  type: 'never' | 'count' | 'date';
  /** Number of occurrences when the end is count based. */
  count?: number;
  /** Local end date when the end is date based. */
  date?: Date | string | null;
}

/** A local-time recurrence rule. */
export interface RecurrenceRule {
  /** Recurrence frequency; none means the event does not repeat. */
  freq: 'none' | 'weekly' | 'monthly';
  /** Repeat interval. Default: 1. */
  interval?: number;
  /** Weekdays from 0 (Sunday) through 6 (Saturday), for weekly rules. */
  byWeekday?: number[];
  /** Optional series end condition. */
  end?: RecurrenceEnd;
}

/** A non-blocking unavailable occurrence warning. */
export interface RecurrenceConflict {
  /** Local ISO date for the unavailable occurrence. */
  date: string;
  /** Optional application-supplied reason. */
  reason?: string;
}

/** Complete sentence templates and visible labels for RecurrenceSelector. */
export interface RecurrenceSelectorLabels {
  /** Localized short weekday labels, Sunday through Saturday. */
  weekdaysShort?: readonly [string, string, string, string, string, string, string];
  /** Localized full weekday labels, Sunday through Saturday. */
  weekdaysLong?: readonly [string, string, string, string, string, string, string];
  /** Formats a list of weekday names. */
  formatWeekdays?: (days: string[]) => string;
  /** Formats an ordinal weekday position. */
  formatOrdinal?: (value: number) => string;
  /** Formats a local recurrence end date. */
  formatDate?: (value: Date | string) => string;
  /** Whole sentence for a non-repeating event. */
  none?: string;
  /** Whole sentence for an unbounded weekly rule. */
  weekly?: string;
  /** Whole sentence for a count-bounded weekly rule. */
  weeklyCount?: string;
  /** Whole sentence for a date-bounded weekly rule. */
  weeklyDate?: string;
  /** Whole sentence for an unbounded interval-weekly rule. */
  weeklyInterval?: string;
  /** Whole sentence for a count-bounded interval-weekly rule. */
  weeklyIntervalCount?: string;
  /** Whole sentence for a date-bounded interval-weekly rule. */
  weeklyIntervalDate?: string;
  /** Whole sentence for an unbounded monthly rule. */
  monthly?: string;
  /** Whole sentence for a count-bounded monthly rule. */
  monthlyCount?: string;
  /** Whole sentence for a date-bounded monthly rule. */
  monthlyDate?: string;
  /** Whole sentence for an unbounded interval-monthly rule. */
  monthlyInterval?: string;
  /** Whole sentence for a count-bounded interval-monthly rule. */
  monthlyIntervalCount?: string;
  /** Whole sentence for a date-bounded interval-monthly rule. */
  monthlyIntervalDate?: string;
  /** Accessible name for the recurrence preset control. */
  recurrence?: string;
  /** Preset label for no recurrence. */
  noRepeat?: string;
  /** Preset label for weekly recurrence. */
  everyWeek?: string;
  /** Preset label for biweekly recurrence. */
  everyTwoWeeks?: string;
  /** Preset label for monthly recurrence. */
  everyMonth?: string;
  /** Preset label that opens the custom editor. */
  custom?: string;
  /** Label before the interval input. */
  repeatEvery?: string;
  /** Accessible name for the interval input. */
  interval?: string;
  /** Accessible name for the frequency selector. */
  frequency?: string;
  /** Weekly frequency option. */
  weeks?: string;
  /** Monthly frequency option. */
  months?: string;
  /** Accessible group name for weekday toggles. */
  weekdays?: string;
  /** Accessible name for the end selector. */
  ends?: string;
  /** End selector option for an unbounded rule. */
  neverEnds?: string;
  /** End selector option for a count-bounded rule. */
  afterOccurrences?: string;
  /** End selector option for a date-bounded rule. */
  onDate?: string;
  /** Accessible name for the occurrence count input. */
  occurrences?: string;
  /** Suffix beside the occurrence count input. */
  times?: string;
  /** Placeholder for the end-date picker. */
  endDate?: string;
  /** Whole non-blocking conflict warning. */
  conflicts?: (count: number) => string;
}

const DEFAULT_LABELS: Required<RecurrenceSelectorLabels> = {
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
  conflicts: (count) =>
    count === 1
      ? '1 occurrence falls in unavailable time; you can adjust it later.'
      : String(count) + ' occurrences fall in unavailable time; you can adjust them later.',
};

const NONE_RULE: RecurrenceRule = {
  freq: 'none',
  interval: 1,
  byWeekday: [],
  end: { type: 'never' },
};

function toDate(value: Date | string | null | undefined): Date {
  if (value instanceof Date) return value;
  return new Date(String(value) + 'T12:00:00');
}

function ordinalWeekday(date: Date): number {
  return Math.floor((date.getDate() - 1) / 7) + 1;
}

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

/**
 * Returns a localized, complete natural-language sentence for a recurrence rule.
 *
 * Each frequency/end combination selects one whole-sentence template. The function never
 * concatenates recurrence fragments, so language-specific word order stays in labels.
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

/** Props for RecurrenceSelector. */
export interface RecurrenceSelectorProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  /** Controlled recurrence rule; a none frequency does not repeat. */
  value?: RecurrenceRule | null;
  /** Initial recurrence rule in uncontrolled mode. */
  defaultValue?: RecurrenceRule;
  /** Called with the complete local-time recurrence rule after a change. */
  onChange?: (rule: RecurrenceRule) => void;
  /** Local date used as the base for recurrence presets. Default: today. */
  startDate?: Date | string;
  /** Initial occurrence count when a count-bounded rule is selected. */
  defaultEndCount?: number;
  /** Non-blocking unavailable occurrence warnings. */
  conflicts?: RecurrenceConflict[];
  /** Translatable visible and accessible labels, merged over English defaults. */
  labels?: RecurrenceSelectorLabels;
}

/** A preset-first recurrence editor with a live natural-language summary. */
export const RecurrenceSelector = /*#__PURE__*/ forwardRef<HTMLDivElement, RecurrenceSelectorProps>(
  function RecurrenceSelector(
    {
      value,
      defaultValue,
      onChange,
      startDate = new Date(),
      defaultEndCount,
      conflicts = [],
      labels: labelsProp,
      className,
      ...rest
    },
    ref,
  ) {
    const labels = { ...DEFAULT_LABELS, ...labelsProp };
    const start = toDate(startDate);
    const weekday = start.getDay();
    const [rule, setRule] = useControllableState<RecurrenceRule>({
      value: value === undefined ? undefined : (value ?? NONE_RULE),
      defaultValue: defaultValue ?? NONE_RULE,
      onChange,
    });
    const [custom, setCustom] = useState(false);
    const defaultEnd: RecurrenceEnd = defaultEndCount
      ? { type: 'count', count: defaultEndCount }
      : { type: 'never' };
    const presets = [
      { id: 'none', label: labels.noRepeat, rule: NONE_RULE },
      {
        id: 'weekly',
        label: interpolate(labels.everyWeek, { weekday: labels.weekdaysShort[weekday]! }),
        rule: { freq: 'weekly' as const, interval: 1, byWeekday: [weekday], end: defaultEnd },
      },
      {
        id: 'biweekly',
        label: interpolate(labels.everyTwoWeeks, { weekday: labels.weekdaysShort[weekday]! }),
        rule: { freq: 'weekly' as const, interval: 2, byWeekday: [weekday], end: defaultEnd },
      },
      {
        id: 'monthly',
        label: interpolate(labels.everyMonth, {
          ordinal: labels.formatOrdinal(ordinalWeekday(start)),
          weekday: labels.weekdaysLong[weekday]!,
        }),
        rule: { freq: 'monthly' as const, interval: 1, byWeekday: [weekday], end: defaultEnd },
      },
    ];
    const matchedPreset = presets.find(
      (preset) =>
        preset.rule.freq === rule.freq &&
        preset.rule.interval === (rule.interval ?? 1) &&
        String([...(preset.rule.byWeekday ?? [])].sort()) ===
          String([...(rule.byWeekday ?? [])].sort()),
    );
    const selectedValue = custom ? 'custom' : (matchedPreset?.id ?? 'custom');
    const end = rule.end ?? { type: 'never' as const };

    const setEnd = (next: RecurrenceEnd): void => setRule({ ...rule, end: next });
    const toggleDay = (day: number): void => {
      const current = rule.byWeekday ?? [];
      const next = current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day];
      if (next.length) setRule({ ...rule, byWeekday: next });
    };

    return (
      <div {...rest} ref={ref} className={cx('lyra-recur', className)}>
        <span className="lyra-select-wrap">
          <select
            className="lyra-input"
            aria-label={labels.recurrence}
            value={selectedValue}
            onChange={(event) => {
              const next = event.currentTarget.value;
              if (next === 'custom') {
                setCustom(true);
                if (rule.freq === 'none') {
                  setRule({ freq: 'weekly', interval: 1, byWeekday: [weekday], end: defaultEnd });
                }
              } else {
                setCustom(false);
                setRule(presets.find((preset) => preset.id === next)!.rule);
              }
            }}
          >
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
            <option value="custom">{labels.custom}</option>
          </select>
        </span>
        {(custom || (!matchedPreset && rule.freq !== 'none')) && (
          <div className="lyra-recur__custom">
            <div className="lyra-recur__freqrow">
              <span>{labels.repeatEvery}</span>
              <input
                type="number"
                min={1}
                max={12}
                className="lyra-input"
                aria-label={labels.interval}
                value={rule.interval ?? 1}
                onChange={(event) =>
                  setRule({
                    ...rule,
                    interval: Math.max(1, Number(event.currentTarget.value) || 1),
                  })
                }
              />
              <span className="lyra-select-wrap">
                <select
                  className="lyra-input"
                  aria-label={labels.frequency}
                  value={rule.freq === 'monthly' ? 'monthly' : 'weekly'}
                  onChange={(event) =>
                    setRule({ ...rule, freq: event.currentTarget.value as 'weekly' | 'monthly' })
                  }
                >
                  <option value="weekly">{labels.weeks}</option>
                  <option value="monthly">{labels.months}</option>
                </select>
              </span>
            </div>
            {rule.freq !== 'monthly' && (
              <div className="lyra-recur__days" role="group" aria-label={labels.weekdays}>
                {labels.weekdaysShort.map((day, index) => (
                  <button
                    type="button"
                    key={day}
                    aria-pressed={(rule.byWeekday ?? []).includes(index)}
                    className={cx(
                      'lyra-recur__day',
                      (rule.byWeekday ?? []).includes(index) && 'lyra-recur__day--on',
                    )}
                    onClick={() => toggleDay(index)}
                  >
                    {day}
                  </button>
                ))}
              </div>
            )}
            <div className="lyra-recur__endrow">
              <span className="lyra-select-wrap">
                <select
                  className="lyra-input"
                  aria-label={labels.ends}
                  value={end.type}
                  onChange={(event) => {
                    const type = event.currentTarget.value as RecurrenceEnd['type'];
                    setEnd(
                      type === 'never'
                        ? { type }
                        : type === 'count'
                          ? { type, count: end.count ?? defaultEndCount ?? 8 }
                          : { type, date: end.date ?? null },
                    );
                  }}
                >
                  <option value="never">{labels.neverEnds}</option>
                  <option value="count">{labels.afterOccurrences}</option>
                  <option value="date">{labels.onDate}</option>
                </select>
              </span>
              {end.type === 'count' && (
                <>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    className="lyra-input"
                    aria-label={labels.occurrences}
                    value={end.count ?? 8}
                    onChange={(event) =>
                      setEnd({
                        type: 'count',
                        count: Math.max(1, Number(event.currentTarget.value) || 1),
                      })
                    }
                  />
                  <span>{labels.times}</span>
                </>
              )}
              {end.type === 'date' && (
                <span className="lyra-recur__enddate">
                  <DatePicker
                    value={end.date}
                    min={start}
                    onChange={(date) => setEnd({ type: 'date', date })}
                    placeholder={labels.endDate}
                  />
                </span>
              )}
            </div>
          </div>
        )}
        <span className="lyra-recur__summary" aria-live="polite">
          {describeRecurrence(rule, start, labels)}
        </span>
        {conflicts.length > 0 && (
          <span className="lyra-recur__summary" role="status">
            {labels.conflicts(conflicts.length)}
          </span>
        )}
      </div>
    );
  },
);
