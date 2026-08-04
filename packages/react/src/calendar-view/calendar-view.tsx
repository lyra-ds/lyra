import { forwardRef, useEffect, useMemo, useRef } from 'react';
import type { HTMLAttributes, MouseEvent, ReactNode } from 'react';
import { Icon } from '../icon';
import { cx } from '../internal/cx';
import { useControllableState } from '../internal/use-controllable-state';

const HOUR_HEIGHT = 48;

/** An event presentation variant. Each variant has a CSS color and shape treatment. */
export type CalendarViewKind = 'session' | 'program-session' | 'pending' | 'block' | 'external';

/** An event displayed in the local-time calendar. */
export interface CalendarViewEvent {
  /** Stable event identifier. */
  id: string | number;
  /** Visual event variant. Default: `"session"`. */
  kind?: CalendarViewKind;
  /** Local ISO date-time or Date at which the event starts. */
  start: string | Date;
  /** Local ISO date-time or Date at which the event ends. */
  end: string | Date;
  /** Event title shown in its chip and accessible name. */
  title: string;
  /** Application-specific data available to popover renderers and callbacks. */
  [key: string]: unknown;
}

/** A recurring local availability window. */
export interface CalendarViewAvailability {
  /** Local 24-hour time in `HH:mm` form. */
  start: string;
  /** Local 24-hour time in `HH:mm` form. */
  end: string;
}

/** Translatable labels for CalendarView controls and event names. */
export interface CalendarViewLabels {
  /** Accessible name for the previous-period button. Default: `"Previous period"`. */
  previous?: string;
  /** Accessible name and tooltip for the current-day button. Default: `"Today"`. */
  today?: string;
  /** Accessible name for the next-period button. Default: `"Next period"`. */
  next?: string;
  /** Accessible name for the view selector. Default: `"Calendar view"`. */
  view?: string;
  /** Day-view selector text. Default: `"Day"`. */
  day?: string;
  /** Week-view selector text. Default: `"Week"`. */
  week?: string;
  /** Month-view selector text. Default: `"Month"`. */
  month?: string;
  /** Accessible name formatter for an event chip. */
  event?: (date: string, time: string, title: string) => string;
}

const DEFAULT_LABELS: Required<CalendarViewLabels> = {
  previous: 'Previous period',
  today: 'Today',
  next: 'Next period',
  view: 'Calendar view',
  day: 'Day',
  week: 'Week',
  month: 'Month',
  event: (date, time, title) => `${date}, ${time} — ${title}`,
};

type CalendarViewMode = 'day' | 'week' | 'month';

interface NormalizedEvent extends CalendarViewEvent {
  endDate: Date;
  kind: CalendarViewKind;
  startDate: Date;
}

interface PopoverState {
  event: CalendarViewEvent;
  left: number;
  top: number;
}

/** Props for {@link CalendarView}. */
export interface CalendarViewProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange'
> {
  /** Controlled displayed view. Default: `"week"`. */
  view?: 'day' | 'week' | 'month';
  /** Initial displayed view when uncontrolled. Default: `"week"`. */
  defaultView?: 'day' | 'week' | 'month';
  /** Called after the displayed view changes. */
  onViewChange?: (view: 'day' | 'week' | 'month') => void;
  /** Controlled local period anchor as a Date or `YYYY-MM-DD` string. */
  date?: string | Date;
  /** Initial local period anchor as a Date or `YYYY-MM-DD` string. */
  defaultDate?: string | Date;
  /** Called with the local `YYYY-MM-DD` anchor after it changes. */
  onDateChange?: (isoDate: string) => void;
  /** Events rendered in the visible local day, week, or month. */
  events?: CalendarViewEvent[];
  /** Weekly local availability windows keyed by `0` (Sunday) through `6` (Saturday). */
  availability?: Record<number, CalendarViewAvailability[]>;
  /** First visible hour in day and week grids. Default: `7`. */
  startHour?: number;
  /** Hour at which the day and week grids end. Default: `21`. */
  endHour?: number;
  /** First weekday, where `0` is Sunday and `6` is Saturday. Default: `1`. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Called when an event chip is opened. */
  onEventOpen?: (event: CalendarViewEvent) => void;
  /** Renders the optional event-summary popover. Receives a close callback. */
  renderEventPopover?: (event: CalendarViewEvent, close: () => void) => ReactNode;
  /** Called with a snapped local Date after an empty hour-grid area is clicked. */
  onSlotCreate?: (start: Date) => void;
  /** Local-minute increment for empty-grid clicks. Default: `30`. */
  slotStep?: number;
  /** Extra content rendered at the end of the toolbar. */
  toolbarActions?: ReactNode;
  /** BCP 47 locale used for all weekday and month formatting. Default: `"en-US"`. */
  locale?: string;
  /** Translatable visible and accessible labels, merged over English defaults. */
  labels?: CalendarViewLabels;
}

function localDate(value: string | Date | undefined): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value);
  }
  if (!value) return null;
  const localIso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (localIso) {
    const date = new Date(Number(localIso[1]), Number(localIso[2]) - 1, Number(localIso[3]));
    return date.getFullYear() === Number(localIso[1]) &&
      date.getMonth() === Number(localIso[2]) - 1 &&
      date.getDate() === Number(localIso[3])
      ? date
      : null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function localIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function sameLocalDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function timeText(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function timeMinutes(value: string): number {
  const [hours = '0', minutes = '0'] = value.split(':');
  return Number(hours) * 60 + Number(minutes);
}

function visibleDays(anchor: Date, view: CalendarViewMode, weekStartsOn: number): Date[] {
  if (view === 'day') return [new Date(anchor)];
  if (view === 'week') {
    const start = new Date(anchor);
    start.setDate(start.getDate() - ((start.getDay() - weekStartsOn + 7) % 7));
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() - weekStartsOn + 7) % 7));
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

/**
 * A local-time day, week, and month scheduling view with CSS-defined event shapes.
 *
 * Event dragging and roving grid keyboard interactions belong to the consuming application.
 * Overlapping events on the same day are rendered as stacked full-width chips rather than
 * column-packed. Events that cross midnight render only on their local start day. Both
 * limitations preserve the reference behavior and are candidates for a future behavior milestone.
 */
export const CalendarView = /*#__PURE__*/ forwardRef<HTMLDivElement, CalendarViewProps>(
  function CalendarView(
    {
      view,
      defaultView = 'week',
      onViewChange,
      date,
      defaultDate,
      onDateChange,
      events = [],
      availability,
      startHour = 7,
      endHour = 21,
      weekStartsOn = 1,
      onEventOpen,
      renderEventPopover,
      onSlotCreate,
      slotStep = 30,
      toolbarActions,
      locale = 'en-US',
      labels: labelsProp,
      className,
      ...rest
    },
    ref,
  ) {
    const today = new Date();
    const fallbackDate = localIsoDate(today);
    const controlledDate = localDate(date);
    const defaultLocalDate = localDate(defaultDate) ?? today;
    const [activeView, setActiveView] = useControllableState<CalendarViewMode>({
      value: view,
      defaultValue: defaultView,
      onChange: onViewChange,
    });
    const [activeDate, setActiveDate] = useControllableState<string>({
      value: date === undefined ? undefined : localIsoDate(controlledDate ?? today),
      defaultValue: localIsoDate(defaultLocalDate),
      onChange: onDateChange,
    });
    const [popover, setPopover] = useControllableState<PopoverState | null>({
      defaultValue: null,
    });
    const scrollRef = useRef<HTMLDivElement>(null);
    const labels = { ...DEFAULT_LABELS, ...labelsProp };
    const anchor = localDate(activeDate) ?? localDate(fallbackDate)!;
    const days = visibleDays(anchor, activeView, weekStartsOn);
    const eventsWithDates = useMemo<NormalizedEvent[]>(
      () =>
        events.reduce<NormalizedEvent[]>((result, event) => {
          const startDate = localDate(event.start);
          const endDate = localDate(event.end);
          if (startDate && endDate) {
            result.push({ ...event, startDate, endDate, kind: event.kind ?? 'session' });
          }
          return result;
        }, []),
      [events],
    );
    const weekdayFormatter = useMemo(
      () => new Intl.DateTimeFormat(locale, { weekday: 'short' }),
      [locale],
    );
    const longDateFormatter = useMemo(
      () => new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }),
      [locale],
    );
    const monthTitleFormatter = useMemo(
      () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
      [locale],
    );
    const dayTitleFormatter = useMemo(
      () => new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }),
      [locale],
    );
    const shortDateFormatter = useMemo(
      () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }),
      [locale],
    );
    const shortDateYearFormatter = useMemo(
      () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }),
      [locale],
    );

    useEffect(() => {
      if (!popover) return;
      const closeOnOutsidePointer = (event: globalThis.MouseEvent): void => {
        if (!(event.target instanceof Element) || !event.target.closest('.lyra-calview__pop')) {
          setPopover(null);
        }
      };
      const closeOnEscape = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') setPopover(null);
      };
      const closeOnResize = (): void => setPopover(null);
      document.addEventListener('mousedown', closeOnOutsidePointer);
      document.addEventListener('keydown', closeOnEscape);
      window.addEventListener('resize', closeOnResize);
      return () => {
        document.removeEventListener('mousedown', closeOnOutsidePointer);
        document.removeEventListener('keydown', closeOnEscape);
        window.removeEventListener('resize', closeOnResize);
      };
    }, [popover, setPopover]);

    const setDate = (next: Date): void => {
      setActiveDate(localIsoDate(next));
      setPopover(null);
    };
    const setView = (next: CalendarViewMode): void => {
      setActiveView(next);
      setPopover(null);
    };
    const navigate = (direction: number): void => {
      const next = new Date(anchor);
      if (activeView === 'day') next.setDate(next.getDate() + direction);
      else if (activeView === 'week') next.setDate(next.getDate() + direction * 7);
      else next.setMonth(next.getMonth() + direction);
      setDate(next);
    };
    const openEvent = (event: MouseEvent<HTMLButtonElement>, item: NormalizedEvent): void => {
      event.stopPropagation();
      onEventOpen?.(item);
      const scroll = scrollRef.current;
      if (!renderEventPopover || !scroll) return;
      const chipRect = event.currentTarget.getBoundingClientRect();
      const scrollRect = scroll.getBoundingClientRect();
      setPopover({
        event: item,
        top: chipRect.top - scrollRect.top + scroll.scrollTop + Math.min(chipRect.height, 32),
        left: Math.max(0, Math.min(chipRect.left - scrollRect.left + 8, scrollRect.width - 240)),
      });
    };

    const gridHeight = Math.max(0, endHour - startHour) * HOUR_HEIGHT;
    const title =
      activeView === 'month'
        ? monthTitleFormatter.format(anchor)
        : activeView === 'day'
          ? dayTitleFormatter.format(anchor)
          : `${shortDateFormatter.format(days[0]!)} – ${shortDateYearFormatter.format(days[6]!)}`;

    const timeGrid = (
      <>
        <div
          className="lyra-calview__head"
          style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}
        >
          <span />
          {days.map((day) => (
            <span
              key={localIsoDate(day)}
              className={cx(
                'lyra-calview__head-cell',
                sameLocalDay(day, today) && 'lyra-calview__head-cell--today',
              )}
            >
              {weekdayFormatter.format(day)}
              <strong>{day.getDate()}</strong>
            </span>
          ))}
        </div>
        <div className="lyra-calview__scroll" ref={scrollRef}>
          <div
            className="lyra-calview__grid"
            style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}
          >
            <div className="lyra-calview__ruler" style={{ height: gridHeight }}>
              {Array.from({ length: Math.max(0, endHour - startHour) }, (_, index) => (
                <span
                  key={startHour + index}
                  className="lyra-calview__hour"
                  style={{ top: index * HOUR_HEIGHT }}
                >
                  {String(startHour + index).padStart(2, '0')}:00
                </span>
              ))}
            </div>
            {days.map((day) => {
              const windows = availability?.[day.getDay()];
              const dayEvents = eventsWithDates.filter((event) =>
                sameLocalDay(event.startDate, day),
              );
              return (
                // Empty-grid selection is deliberately pointer-only. Keyboard grid navigation is
                // application-owned, while event chips and calendar controls remain keyboard-accessible.
                // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
                <div
                  key={localIsoDate(day)}
                  className="lyra-calview__col"
                  style={{ height: gridHeight, backgroundSize: `100% ${HOUR_HEIGHT}px` }}
                  onClick={(event) => {
                    if (!onSlotCreate || popover) return;
                    const rect = event.currentTarget.getBoundingClientRect();
                    const minutes =
                      startHour * 60 +
                      Math.floor((((event.clientY - rect.top) / HOUR_HEIGHT) * 60) / slotStep) *
                        slotStep;
                    const start = new Date(day);
                    start.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
                    onSlotCreate(start);
                  }}
                >
                  {windows?.map((window, index) => {
                    const start = timeMinutes(window.start);
                    const end = timeMinutes(window.end);
                    return (
                      <span
                        key={`${window.start}-${window.end}-${index}`}
                        className="lyra-calview__avail"
                        style={{
                          top: ((start - startHour * 60) / 60) * HOUR_HEIGHT,
                          height: ((end - start) / 60) * HOUR_HEIGHT,
                        }}
                      />
                    );
                  })}
                  {sameLocalDay(day, today) &&
                    minutesSinceMidnight(today) > startHour * 60 &&
                    minutesSinceMidnight(today) < endHour * 60 && (
                      <span
                        className="lyra-calview__now"
                        style={{
                          top: ((minutesSinceMidnight(today) - startHour * 60) / 60) * HOUR_HEIGHT,
                        }}
                      />
                    )}
                  {dayEvents.map((item) => {
                    const top =
                      ((minutesSinceMidnight(item.startDate) - startHour * 60) / 60) * HOUR_HEIGHT;
                    const height = Math.max(
                      20,
                      ((item.endDate.getTime() - item.startDate.getTime()) / 3_600_000) *
                        HOUR_HEIGHT -
                        2,
                    );
                    return (
                      <button
                        type="button"
                        key={item.id}
                        className={cx('lyra-calview__evt', `lyra-calview__evt--${item.kind}`)}
                        style={{ top: top + 1, height }}
                        aria-label={labels.event(
                          longDateFormatter.format(item.startDate),
                          timeText(item.startDate),
                          item.title,
                        )}
                        onClick={(event) => openEvent(event, item)}
                      >
                        <span className="lyra-calview__evt-time">
                          {timeText(item.startDate)}–{timeText(item.endDate)}
                        </span>
                        {height >= 34 && (
                          <span className="lyra-calview__evt-title">{item.title}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
          {popover && renderEventPopover && (
            <div
              className="lyra-calview__pop"
              style={{ top: popover.top, left: popover.left }}
              role="dialog"
              aria-label={popover.event.title}
            >
              {renderEventPopover(popover.event, () => setPopover(null))}
            </div>
          )}
        </div>
      </>
    );

    const monthGrid = (
      <div className="lyra-calview__mgrid">
        {days.slice(0, 7).map((day) => (
          <span key={localIsoDate(day)} className="lyra-calview__head-cell">
            {weekdayFormatter.format(day)}
          </span>
        ))}
        {days.map((day) => {
          const dayEvents = eventsWithDates.filter((event) => sameLocalDay(event.startDate, day));
          return (
            <button
              type="button"
              key={localIsoDate(day)}
              className={cx(
                'lyra-calview__mcell',
                day.getMonth() !== anchor.getMonth() && 'lyra-calview__mcell--out',
                sameLocalDay(day, today) && 'lyra-calview__mcell--today',
              )}
              onClick={() => {
                setDate(day);
                setView('day');
              }}
            >
              <span className="lyra-calview__mday">{day.getDate()}</span>
              {dayEvents.slice(0, 3).map((item) => (
                <span
                  key={item.id}
                  className={cx('lyra-calview__mevt', `lyra-calview__evt--${item.kind}`)}
                >
                  {timeText(item.startDate)} {item.title}
                </span>
              ))}
              {dayEvents.length > 3 && (
                <span className="lyra-calview__more">+{dayEvents.length - 3}</span>
              )}
            </button>
          );
        })}
      </div>
    );

    return (
      <div {...rest} ref={ref} className={cx('lyra-calview', className)}>
        <div className="lyra-calview__toolbar">
          <button
            type="button"
            className="lyra-calview__nav"
            aria-label={labels.previous}
            onClick={() => navigate(-1)}
          >
            <Icon name="chevron-left" size={16} />
          </button>
          <button
            type="button"
            className="lyra-calview__nav"
            aria-label={labels.today}
            title={labels.today}
            onClick={() => setDate(new Date())}
          >
            <Icon name="circle-dot" size={14} />
          </button>
          <button
            type="button"
            className="lyra-calview__nav"
            aria-label={labels.next}
            onClick={() => navigate(1)}
          >
            <Icon name="chevron-right" size={16} />
          </button>
          <span className="lyra-calview__title">{title}</span>
          <span className="lyra-calview__seg" role="group" aria-label={labels.view}>
            {(
              [
                ['day', labels.day],
                ['week', labels.week],
                ['month', labels.month],
              ] as const
            ).map(([mode, label]) => (
              <button
                type="button"
                key={mode}
                aria-pressed={activeView === mode}
                onClick={() => setView(mode)}
              >
                {label}
              </button>
            ))}
          </span>
          {toolbarActions}
        </div>
        {activeView === 'month' ? monthGrid : timeGrid}
      </div>
    );
  },
);
