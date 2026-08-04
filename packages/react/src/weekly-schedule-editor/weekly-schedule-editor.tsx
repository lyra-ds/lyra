import { forwardRef, useState } from 'react';
import type { HTMLAttributes } from 'react';
import { Button } from '../button';
import { DatePicker } from '../date-picker';
import { Icon } from '../icon';
import { cx } from '../internal/cx';
import { useControllableState } from '../internal/use-controllable-state';
import { Popover } from '../popover';
import { Switch } from '../switch';
import { TimeInput } from '../time-input';

/** A local-time availability window. */
export interface TimeRange {
  /** Local 24-hour start time in HH:mm form. */
  start: string;
  /** Local 24-hour end time in HH:mm form. */
  end: string;
}

/** Availability windows keyed by weekday, where 0 is Sunday and 6 is Saturday. */
export type WeeklySchedule = Record<number, TimeRange[]>;

/** A date-specific local schedule that overrides its weekday. */
export interface DateException {
  /** Local ISO date in YYYY-MM-DD form. */
  date: string;
  /** An empty array marks the complete day unavailable. */
  ranges: TimeRange[];
}

/** Translatable labels for WeeklyScheduleEditor. */
export interface WeeklyScheduleEditorLabels {
  /** Full weekday labels, Sunday through Saturday. */
  weekdays?: readonly [string, string, string, string, string, string, string];
  /** Formats an exception date. */
  formatDate?: (date: string) => string;
  /** Formats availability ranges in an exception. */
  formatRanges?: (ranges: TimeRange[]) => string;
  /** Text for a disabled weekday. */
  unavailable?: string;
  /** Accessible name for the copy control. Receives the source weekday. */
  copyToOtherDays?: (day: string) => string;
  /** Popover accessible name. */
  copySchedule?: string;
  /** Popover heading. Receives the source weekday. */
  copyFrom?: (day: string) => string;
  /** Applies selected copy destinations. */
  apply?: string;
  /** Adds an availability range. */
  addInterval?: string;
  /** Removes an availability range. */
  removeInterval?: string;
  /** Accessible name for a range start input. */
  startTime?: (day: string) => string;
  /** Accessible name for a range end input. */
  endTime?: (day: string) => string;
  /** Inline invalid-range message. */
  invalidRange?: string;
  /** Heading for the exception section. */
  exceptions?: string;
  /** Full-day exception text. */
  unavailableAllDay?: string;
  /** Removes a date exception. */
  removeException?: string;
  /** Placeholder for adding a date exception. */
  addException?: string;
}

const DEFAULT_LABELS: Required<WeeklyScheduleEditorLabels> = {
  weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  formatDate: (date) =>
    new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
  formatRanges: (ranges) => ranges.map((range) => range.start + '–' + range.end).join(', '),
  unavailable: 'Unavailable',
  copyToOtherDays: (day) => 'Copy ' + day + ' to other days',
  copySchedule: 'Copy schedule',
  copyFrom: (day) => 'Copy ' + day + ' to…',
  apply: 'Apply',
  addInterval: '+ Add interval',
  removeInterval: 'Remove interval',
  startTime: (day) => day + ' — start',
  endTime: (day) => day + ' — end',
  invalidRange: 'End time must be after start time.',
  exceptions: 'Exceptions',
  unavailableAllDay: 'Unavailable all day',
  removeException: 'Remove exception',
  addException: 'Add exception…',
};

const EMPTY_SCHEDULE: WeeklySchedule = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

function minutes(time: string): number {
  const [hours, mins = '0'] = time.split(':');
  return Number(hours) * 60 + Number(mins);
}

function nextRange(ranges: TimeRange[], defaultRange: TimeRange): TimeRange {
  const start = ranges.at(-1)?.end ?? defaultRange.start;
  const [hours, minutes = '00'] = start.split(':');
  const endHour = Math.min(23, Number(hours) + 2);
  return {
    start,
    end: start >= '22:00' ? '23:59' : String(endHour).padStart(2, '0') + ':' + minutes,
  };
}

function isoDate(date: Date): string {
  return (
    String(date.getFullYear()) +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0')
  );
}

interface CopyMenuProps {
  from: number;
  labels: Required<WeeklyScheduleEditorLabels>;
  onCopy: (days: number[]) => void;
}

function CopyMenu({ from, labels, onCopy }: CopyMenuProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<number[]>([]);
  const sourceDay = labels.weekdays[from]!;
  const toggle = (day: number): void => {
    setPicked((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    );
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setPicked([]);
      }}
      ariaLabel={labels.copySchedule}
      trigger={
        <button
          type="button"
          className="lyra-sched__ghostbtn"
          aria-label={labels.copyToOtherDays(sourceDay)}
          title={labels.copyFrom(sourceDay)}
        >
          <Icon name="copy" size={15} />
        </button>
      }
    >
      <div className="lyra-sched__copy">
        <span className="lyra-sched__copy-title">{labels.copyFrom(sourceDay)}</span>
        {labels.weekdays.map(
          (day, index) =>
            index !== from && (
              <label key={day} className="lyra-check-row">
                <input
                  type="checkbox"
                  className="lyra-checkbox"
                  checked={picked.includes(index)}
                  onChange={() => toggle(index)}
                />
                {day}
              </label>
            ),
        )}
        <Button
          size="sm"
          disabled={!picked.length}
          onClick={() => {
            onCopy(picked);
            setOpen(false);
          }}
        >
          {labels.apply}
        </Button>
      </div>
    </Popover>
  );
}

/** Props for WeeklyScheduleEditor. */
export interface WeeklyScheduleEditorProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  /** Controlled weekly local-time availability. */
  value?: WeeklySchedule;
  /** Initial weekly local-time availability in uncontrolled mode. */
  defaultValue?: WeeklySchedule;
  /** Called after a weekday availability change. */
  onChange?: (value: WeeklySchedule) => void;
  /** Controlled date exceptions. */
  exceptions?: DateException[];
  /** Called after date exceptions change. */
  onExceptionsChange?: (exceptions: DateException[]) => void;
  /** Range created when enabling a weekday. Default: 09:00–17:00. */
  defaultRange?: TimeRange;
  /** First displayed weekday, where 0 is Sunday. Default: 1. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Whether to render date exceptions. Default: true. */
  showExceptions?: boolean;
  /** Translatable visible and accessible labels, merged over English defaults. */
  labels?: WeeklyScheduleEditorLabels;
}

/** An editor for weekly local-time availability windows and date exceptions. */
export const WeeklyScheduleEditor = /*#__PURE__*/ forwardRef<
  HTMLDivElement,
  WeeklyScheduleEditorProps
>(function WeeklyScheduleEditor(
  {
    value,
    defaultValue,
    onChange,
    exceptions,
    onExceptionsChange,
    defaultRange = { start: '09:00', end: '17:00' },
    weekStartsOn = 1,
    showExceptions = true,
    labels: labelsProp,
    className,
    ...rest
  },
  ref,
) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const [schedule, setSchedule] = useControllableState<WeeklySchedule>({
    value: value === undefined ? undefined : { ...EMPTY_SCHEDULE, ...value },
    defaultValue: { ...EMPTY_SCHEDULE, ...defaultValue },
    onChange,
  });
  const [currentExceptions, setExceptions] = useControllableState<DateException[]>({
    value: exceptions,
    defaultValue: [],
    onChange: onExceptionsChange,
  });
  const order = Array.from({ length: 7 }, (_, index) => (index + weekStartsOn) % 7);
  const setDay = (day: number, ranges: TimeRange[]): void => {
    setSchedule({ ...schedule, [day]: ranges });
  };
  const invalid = (range: TimeRange): boolean =>
    Boolean(range.start && range.end && minutes(range.end) <= minutes(range.start));

  return (
    <div {...rest} ref={ref} className={cx('lyra-sched', className)}>
      {order.map((day) => {
        const ranges = schedule[day] ?? [];
        const enabled = ranges.length > 0;
        const dayLabel = labels.weekdays[day]!;
        return (
          <div key={day} className="lyra-sched__row">
            <div className="lyra-sched__daycell">
              <Switch
                checked={enabled}
                onChange={(event) =>
                  setDay(day, event.currentTarget.checked ? [{ ...defaultRange }] : [])
                }
                label={dayLabel}
              />
            </div>
            {enabled ? (
              <div className="lyra-sched__ranges">
                {ranges.map((range, index) => (
                  <div key={index}>
                    <div className="lyra-sched__range">
                      <TimeInput
                        aria-label={labels.startTime(dayLabel)}
                        value={range.start}
                        onChange={(time) =>
                          time &&
                          setDay(
                            day,
                            ranges.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, start: time } : item,
                            ),
                          )
                        }
                      />
                      <span className="lyra-sched__dash">–</span>
                      <TimeInput
                        aria-label={labels.endTime(dayLabel)}
                        value={range.end}
                        invalid={invalid(range)}
                        onChange={(time) =>
                          time &&
                          setDay(
                            day,
                            ranges.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, end: time } : item,
                            ),
                          )
                        }
                      />
                      {ranges.length > 1 && (
                        <button
                          type="button"
                          className="lyra-sched__ghostbtn"
                          aria-label={labels.removeInterval}
                          onClick={() =>
                            setDay(
                              day,
                              ranges.filter((_, itemIndex) => itemIndex !== index),
                            )
                          }
                        >
                          <Icon name="x" size={15} />
                        </button>
                      )}
                    </div>
                    {invalid(range) && (
                      <span className="lyra-sched__error">{labels.invalidRange}</span>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="lyra-sched__addrange"
                  onClick={() => setDay(day, [...ranges, nextRange(ranges, defaultRange)])}
                >
                  {labels.addInterval}
                </button>
              </div>
            ) : (
              <span className="lyra-sched__off">{labels.unavailable}</span>
            )}
            <div className="lyra-sched__actions">
              {enabled && (
                <CopyMenu
                  from={day}
                  labels={labels}
                  onCopy={(days) => {
                    const next = { ...schedule };
                    days.forEach((target) => {
                      next[target] = ranges.map((range) => ({ ...range }));
                    });
                    setSchedule(next);
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
      {showExceptions && (
        <div className="lyra-sched__exc">
          <span className="lyra-label">{labels.exceptions}</span>
          {currentExceptions.map((exception, index) => (
            <div key={exception.date} className="lyra-sched__exc-row">
              <span className="lyra-sched__exc-date">{labels.formatDate(exception.date)}</span>
              <span>
                {exception.ranges.length
                  ? labels.formatRanges(exception.ranges)
                  : labels.unavailableAllDay}
              </span>
              <button
                type="button"
                className="lyra-sched__ghostbtn"
                aria-label={labels.removeException}
                onClick={() =>
                  setExceptions(currentExceptions.filter((_, itemIndex) => itemIndex !== index))
                }
              >
                <Icon name="x" size={15} />
              </button>
            </div>
          ))}
          <DatePicker
            placeholder={labels.addException}
            value={null}
            min={new Date()}
            onChange={(date) => {
              const nextDate = isoDate(date);
              if (!currentExceptions.some((exception) => exception.date === nextDate)) {
                setExceptions(
                  [...currentExceptions, { date: nextDate, ranges: [] }].sort((left, right) =>
                    left.date.localeCompare(right.date),
                  ),
                );
              }
            }}
          />
        </div>
      )}
    </div>
  );
});
