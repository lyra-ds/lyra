import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import type { HTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import { cx } from '../internal/cx';
import { useControllableState } from '../internal/use-controllable-state';

/** The selected bounds when {@link Calendar} is used in range mode. */
export interface CalendarRange {
  /** The first selected day, or `null` before a range starts. */
  start: Date | null;
  /** The last selected day, or `null` until a range is completed. */
  end: Date | null;
}

/** Translatable labels for Calendar controls. Merged over the English defaults. */
export interface CalendarLabels {
  /** Accessible name for the previous-month button. Default: `"Previous month"`. */
  previousMonth?: string;
  /** Accessible name for the next-month button. Default: `"Next month"`. */
  nextMonth?: string;
  /** Accessible name for the previous button in the months view. Default: `"Previous year"`. */
  previousYear?: string;
  /** Accessible name for the next button in the months view. Default: `"Next year"`. */
  nextYear?: string;
  /** Accessible name for the previous button in the years view. Default: `"Previous years"`. */
  previousYears?: string;
  /** Accessible name for the next button in the years view. Default: `"Next years"`. */
  nextYears?: string;
  /** Accessible name for the button that changes the month/year view. Default: `"Change month or year"`. */
  changeView?: string;
  /** Label for the button that selects today. Default: `"Today"`. */
  today?: string;
}

const DEFAULT_LABELS: Required<CalendarLabels> = {
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  previousYear: 'Previous year',
  nextYear: 'Next year',
  previousYears: 'Previous years',
  nextYears: 'Next years',
  changeView: 'Change month or year',
  today: 'Today',
};

/** Props for {@link Calendar}. */
export interface CalendarProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange'
> {
  /** Whether selection is a date range. Default: `false`. */
  range?: boolean;
  /** Controlled selected local date, ISO `YYYY-MM-DD` string, or range. */
  value?: Date | string | CalendarRange | null;
  /** Initial selected local date, ISO `YYYY-MM-DD` string, or range when uncontrolled. */
  defaultValue?: Date | string | CalendarRange;
  /** Called after a date or range is selected. */
  onChange?: (value: Date | CalendarRange) => void;
  /** Inclusive lower selection limit as a local date or ISO `YYYY-MM-DD` string. */
  min?: Date | string;
  /** Inclusive upper selection limit as a local date or ISO `YYYY-MM-DD` string. */
  max?: Date | string;
  /** Returns whether a local date cannot be selected. Disabled dates remain visible. */
  isDateDisabled?: (date: Date) => boolean;
  /** Renders extra content inside each day cell, such as a `.lyra-cal__dot` availability marker. */
  renderDayMarker?: (date: Date) => ReactNode;
  /** First weekday, where `0` is Sunday and `6` is Saturday. Default: `0`. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Calendar cell size. Default: `"sm"`. */
  size?: 'sm' | 'md';
  /** Whether to render the today shortcut. Default: `false`. */
  todayButton?: boolean;
  /** BCP 47 locale used for month names, weekday headings, and date labels. Default: `"en-US"`. */
  locale?: string;
  /** Translatable control labels, merged over the English defaults. */
  labels?: CalendarLabels;
}

type CalendarValue = Date | CalendarRange | null;
type ViewMode = 'days' | 'months' | 'years';

function dateFrom(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1]) &&
    date.getMonth() === Number(match[2]) - 1 &&
    date.getDate() === Number(match[3])
    ? date
    : null;
}

function normalizeValue(
  value: CalendarProps['value'] | CalendarProps['defaultValue'],
  range: boolean,
): CalendarValue {
  if (range) {
    const candidate = value && typeof value === 'object' && !(value instanceof Date) ? value : null;
    return { start: dateFrom(candidate?.start), end: dateFrom(candidate?.end) };
  }
  return dateFrom(value instanceof Date || typeof value === 'string' ? value : null);
}

function sameDay(left: Date | null, right: Date | null): boolean {
  return Boolean(
    left &&
    right &&
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate(),
  );
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function addMonths(date: Date, amount: number): Date {
  const targetMonth = date.getMonth() + amount;
  const lastDay = new Date(date.getFullYear(), targetMonth + 1, 0).getDate();
  return new Date(date.getFullYear(), targetMonth, Math.min(date.getDate(), lastDay));
}

function Chevron({ direction }: { direction: 'left' | 'right' }): ReactNode {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={direction === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
    </svg>
  );
}

/**
 * A fixed six-week local-time month calendar with single-date or range selection.
 *
 * Arrow keys move by day or week; Home and End move to the current week boundaries;
 * Page Up and Page Down move by month. Only the active date is in the Tab sequence.
 */
export const Calendar = /*#__PURE__*/ forwardRef<HTMLDivElement, CalendarProps>(function Calendar(
  {
    value,
    defaultValue,
    onChange,
    min,
    max,
    range = false,
    isDateDisabled,
    renderDayMarker,
    weekStartsOn = 0,
    size = 'sm',
    todayButton = false,
    locale = 'en-US',
    labels: labelsProp,
    className,
    ...rest
  },
  ref,
) {
  const normalizedValue = normalizeValue(value, range);
  const normalizedDefaultValue = normalizeValue(defaultValue, range);
  const [selected, setSelected] = useControllableState<CalendarValue>({
    value: value === undefined ? undefined : normalizedValue,
    defaultValue: normalizedDefaultValue,
    onChange: (next) => {
      if (next) onChange?.(next);
    },
  });
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const currentDate = new Date();
  const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  const anchor = range ? (selected as CalendarRange).start : (selected as Date | null);
  const [view, setView] = useState(() => {
    const initial = anchor ?? today;
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });
  const [mode, setMode] = useState<ViewMode>('days');
  const [focusedDate, setFocusedDate] = useState(() => anchor ?? today);
  const dayRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocusKey = useRef<string | null>(null);
  const minDate = dateFrom(min);
  const maxDate = dateFrom(max);
  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
    [locale],
  );
  const monthNameFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'short' }),
    [locale],
  );
  const weekdayFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: 'narrow' }),
    [locale],
  );
  const weekdayNameFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: 'long' }),
    [locale],
  );
  const dateLabelFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    [locale],
  );

  const isDisabled = (date: Date): boolean =>
    Boolean((minDate && date < minDate) || (maxDate && date > maxDate) || isDateDisabled?.(date));
  const selectedStart = range ? (selected as CalendarRange).start : (selected as Date | null);
  const selectedEnd = range ? (selected as CalendarRange).end : null;
  const isInRange = (date: Date): boolean =>
    Boolean(range && selectedStart && selectedEnd && date > selectedStart && date < selectedEnd);

  const start = new Date(view);
  start.setDate(1 - ((start.getDay() - weekStartsOn + 7) % 7));
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
  const activeDate = days.find((date) => sameDay(date, focusedDate)) ?? days[0];
  const yearBase = Math.floor(view.getFullYear() / 12) * 12;

  useEffect(() => {
    const key = pendingFocusKey.current;
    if (!key) return;
    pendingFocusKey.current = null;
    dayRefs.current.get(key)?.focus();
  }, [view, focusedDate]);

  const selectDate = (date: Date): void => {
    if (isDisabled(date)) return;
    if (!range) {
      setSelected(date);
      return;
    }
    const current = selected as CalendarRange;
    if (!current.start || current.end) {
      setSelected({ start: date, end: null });
    } else {
      setSelected(
        date < current.start
          ? { start: date, end: current.start }
          : { start: current.start, end: date },
      );
    }
  };

  const navigate = (amount: number): void => {
    if (mode === 'days')
      setView((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
    else if (mode === 'months')
      setView((current) => new Date(current.getFullYear() + amount, current.getMonth(), 1));
    else setView((current) => new Date(current.getFullYear() + amount * 12, current.getMonth(), 1));
  };

  const moveFocus = (date: Date): void => {
    pendingFocusKey.current = dateKey(date);
    setFocusedDate(date);
    setView(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  const handleDayKeyDown = (event: KeyboardEvent<HTMLButtonElement>, date: Date): void => {
    let next: Date | null = null;
    if (event.key === 'ArrowLeft')
      next = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
    else if (event.key === 'ArrowRight')
      next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    else if (event.key === 'ArrowUp')
      next = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7);
    else if (event.key === 'ArrowDown')
      next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7);
    else if (event.key === 'Home')
      next = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() - ((date.getDay() - weekStartsOn + 7) % 7),
      );
    else if (event.key === 'End')
      next = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + (6 - ((date.getDay() - weekStartsOn + 7) % 7)),
      );
    else if (event.key === 'PageUp') next = addMonths(date, -1);
    else if (event.key === 'PageDown') next = addMonths(date, 1);
    if (!next) return;
    event.preventDefault();
    moveFocus(next);
  };

  return (
    <div {...rest} ref={ref} className={cx('lyra-cal', size === 'md' && 'lyra-cal--md', className)}>
      <div className="lyra-cal__head">
        <button
          type="button"
          className="lyra-cal__nav"
          aria-label={
            mode === 'days'
              ? labels.previousMonth
              : mode === 'months'
                ? labels.previousYear
                : labels.previousYears
          }
          onClick={() => navigate(-1)}
        >
          <Chevron direction="left" />
        </button>
        <button
          type="button"
          className="lyra-cal__label"
          aria-label={labels.changeView}
          onClick={() => setMode((current) => (current === 'days' ? 'months' : 'years'))}
        >
          {mode === 'days'
            ? monthFormatter.format(view)
            : mode === 'months'
              ? view.getFullYear()
              : `${yearBase} – ${yearBase + 11}`}
        </button>
        <button
          type="button"
          className="lyra-cal__nav"
          aria-label={
            mode === 'days'
              ? labels.nextMonth
              : mode === 'months'
                ? labels.nextYear
                : labels.nextYears
          }
          onClick={() => navigate(1)}
        >
          <Chevron direction="right" />
        </button>
      </div>
      {mode === 'days' && (
        <div className="lyra-cal__grid">
          {Array.from({ length: 7 }, (_, index) => {
            const weekday = new Date(2024, 0, 7 + ((index + weekStartsOn) % 7));
            return (
              <span
                key={weekday.getDay()}
                className="lyra-cal__wd"
                aria-label={weekdayNameFormatter.format(weekday)}
              >
                {weekdayFormatter.format(weekday)}
              </span>
            );
          })}
          {days.map((date) => {
            const disabled = isDisabled(date);
            const isSelected = sameDay(date, selectedStart) || sameDay(date, selectedEnd);
            return (
              <button
                key={dateKey(date)}
                ref={(node) => {
                  if (node) dayRefs.current.set(dateKey(date), node);
                  else dayRefs.current.delete(dateKey(date));
                }}
                type="button"
                className={cx(
                  'lyra-cal__day',
                  date.getMonth() !== view.getMonth() && 'lyra-cal__day--out',
                  sameDay(date, today) && 'lyra-cal__day--today',
                  isSelected && 'lyra-cal__day--selected',
                  isInRange(date) && 'lyra-cal__day--in-range',
                )}
                aria-disabled={disabled || undefined}
                tabIndex={sameDay(date, activeDate ?? null) ? 0 : -1}
                aria-label={dateLabelFormatter.format(date)}
                aria-pressed={isSelected || undefined}
                onClick={() => selectDate(date)}
                onFocus={() => setFocusedDate(date)}
                onKeyDown={(event) => handleDayKeyDown(event, date)}
              >
                {date.getDate()}
                {renderDayMarker?.(date)}
              </button>
            );
          })}
        </div>
      )}
      {mode === 'days' && todayButton && (
        <div className="lyra-cal__foot">
          <button
            type="button"
            className="lyra-cal__today"
            onClick={() => {
              setView(new Date(today.getFullYear(), today.getMonth(), 1));
              selectDate(today);
            }}
          >
            {labels.today}
          </button>
        </div>
      )}
      {mode === 'months' && (
        <div className="lyra-cal__mgrid">
          {Array.from({ length: 12 }, (_, month) => {
            const date = new Date(view.getFullYear(), month, 1);
            return (
              <button
                key={month}
                type="button"
                className={cx(
                  'lyra-cal__mcell',
                  anchor &&
                    anchor.getMonth() === month &&
                    anchor.getFullYear() === view.getFullYear() &&
                    'lyra-cal__mcell--selected',
                )}
                onClick={() => {
                  setView(date);
                  setMode('days');
                }}
              >
                {monthNameFormatter.format(date)}
              </button>
            );
          })}
        </div>
      )}
      {mode === 'years' && (
        <div className="lyra-cal__mgrid">
          {Array.from({ length: 12 }, (_, index) => yearBase + index).map((year) => (
            <button
              key={year}
              type="button"
              className={cx(
                'lyra-cal__mcell',
                anchor && anchor.getFullYear() === year && 'lyra-cal__mcell--selected',
              )}
              onClick={() => {
                setView(new Date(year, view.getMonth(), 1));
                setMode('months');
              }}
            >
              {year}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
