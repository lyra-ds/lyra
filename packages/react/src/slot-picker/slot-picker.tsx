import { forwardRef, useEffect, useMemo, useReducer, useState } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Button } from '../button';
import { Calendar } from '../calendar';
import { Icon } from '../icon';
import { cx } from '../internal/cx';
import { useControllableState } from '../internal/use-controllable-state';
import { TimeZonePicker } from '../time-zone-picker';
import type { TimeZonePickerLabels } from '../time-zone-picker';

/** A bookable time slot expressed in UTC ISO timestamps. */
export interface Slot {
  /** UTC ISO start timestamp. */
  start: string;
  /** UTC ISO end timestamp. */
  end: string;
}

/** Translatable labels for SlotPicker. */
export interface SlotPickerLabels {
  /** Default confirmation button text. */
  confirm?: string;
  /** Message when the visible day has no slots. */
  emptyMessage?: string;
  /** Message when no slots exist in any day. */
  fullMessage?: string;
  /** Accessible label for the loading skeleton. */
  loading?: string;
  /** Accessible listbox label. Receives the visible local date. */
  availableTimes?: (date: string) => string;
  /** Text appended when a later available date exists. */
  nextAvailable?: (date: string) => string;
  /** CTA to show the next available local date. */
  goToDate?: (date: string) => string;
  /** CTA that reveals the embedded time-zone picker. */
  changeTimeZone?: string;
  /** Whole temporary-hold message. */
  hold?: (minutes: number, seconds: string) => string;
  /** Labels forwarded to the embedded TimeZonePicker. */
  timeZonePicker?: TimeZonePickerLabels;
}

const DEFAULT_LABELS: Required<SlotPickerLabels> = {
  confirm: 'Confirm',
  emptyMessage: 'No available times on this day.',
  fullMessage: 'There are no available times right now.',
  loading: 'Loading available times',
  availableTimes: (date) => 'Available times for ' + date,
  nextAvailable: (date) => 'Next available time: ' + date + '.',
  goToDate: (date) => 'Go to ' + date,
  changeTimeZone: 'change',
  hold: (minutes, seconds) => 'Reserved for ' + String(minutes) + ':' + seconds,
  timeZonePicker: {},
};

function isoDate(date: Date): string {
  return (
    String(date.getFullYear()) +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0')
  );
}

/**
 * Derives the display-zone ISO day from a UTC timestamp.
 *
 * en-CA deliberately yields YYYY-MM-DD. UTC ISO slicing would incorrectly group slots around
 * a display-zone day boundary.
 */
function dayOf(utcIso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(utcIso));
}

function timeOf(utcIso: string, timeZone: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(utcIso));
}

function longDate(isoDay: string, locale: string): string {
  return new Date(isoDay + 'T12:00:00').toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function detectedTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Props for SlotPicker. */
export interface SlotPickerProps extends HTMLAttributes<HTMLDivElement> {
  /** Free slots in UTC. The component groups them by active display-zone day. */
  slots?: Slot[];
  /** Controlled visible local YYYY-MM-DD day. */
  date?: string;
  /** Initial visible local YYYY-MM-DD day. */
  defaultDate?: string;
  /** Called after the visible local day changes. */
  onDateChange?: (isoDate: string) => void;
  /** Controlled IANA display zone. Defaults to the browser-detected zone. */
  timezone?: string;
  /** Called after the active IANA display zone changes. */
  onTimezoneChange?: (zone: string) => void;
  /** IANA zone shown as detected in the embedded TimeZonePicker. */
  detectedZone?: string;
  /** Called after a user confirms a selected slot. Revalidate on the server. */
  onConfirm?: (slot: Slot) => void;
  /** Confirmation button text. Default: Confirm. */
  confirmLabel?: string;
  /** UTC ISO temporary-hold expiry. Its remaining duration is visible. */
  holdExpiresAt?: string;
  /** Local YYYY-MM-DD target for an empty-day shortcut. */
  nextAvailableDate?: string;
  /** Renders six slot pills while availability loads. */
  loading?: boolean;
  /** Empty visible-day message. */
  emptyMessage?: string;
  /** Message when no slots exist in any day. */
  fullMessage?: string;
  /** BCP 47 locale used for display times and dates. Default: en-US. */
  locale?: string;
  /** Inclusive local calendar lower limit. */
  min?: Date | string;
  /** Inclusive local calendar upper limit. */
  max?: Date | string;
  /** Summary content rendered above the calendar. */
  children?: ReactNode;
  /** Translatable visible and accessible labels, merged over English defaults. */
  labels?: SlotPickerLabels;
}

/** A two-step, timezone-aware public booking slot picker. */
export const SlotPicker = /*#__PURE__*/ forwardRef<HTMLDivElement, SlotPickerProps>(
  function SlotPicker(
    {
      slots = [],
      date,
      defaultDate,
      onDateChange,
      timezone,
      onTimezoneChange,
      detectedZone,
      onConfirm,
      confirmLabel,
      holdExpiresAt,
      nextAvailableDate,
      loading = false,
      emptyMessage,
      fullMessage,
      locale = 'en-US',
      min,
      max,
      children,
      labels: labelsProp,
      className,
      ...rest
    },
    ref,
  ) {
    const labels = { ...DEFAULT_LABELS, ...labelsProp };
    const confirmation = confirmLabel ?? labels.confirm;
    const empty = emptyMessage ?? labels.emptyMessage;
    const full = fullMessage ?? labels.fullMessage;
    const [activeTimeZone, setTimeZone] = useControllableState<string>({
      value: timezone,
      defaultValue: detectedTimeZone(),
      onChange: onTimezoneChange,
    });
    const [visibleDate, setVisibleDate] = useControllableState<string | null>({
      value: date,
      defaultValue: defaultDate ?? null,
      onChange: (next) => {
        if (next) onDateChange?.(next);
      },
    });
    const [selected, setSelected] = useState<Slot | null>(null);
    const [timeZoneOpen, setTimeZoneOpen] = useState(false);
    const [, tick] = useReducer((count: number) => count + 1, 0);

    useEffect(() => {
      if (!holdExpiresAt) return;
      const interval = window.setInterval(tick, 1000);
      return () => window.clearInterval(interval);
    }, [holdExpiresAt]);

    const byDay = useMemo(() => {
      const grouped = new Map<string, Slot[]>();
      slots.forEach((slot) => {
        const day = dayOf(slot.start, activeTimeZone);
        const current = grouped.get(day) ?? [];
        current.push(slot);
        grouped.set(day, current);
      });
      grouped.forEach((daySlots) =>
        daySlots.sort(
          (left, right) => new Date(left.start).getTime() - new Date(right.start).getTime(),
        ),
      );
      return grouped;
    }, [activeTimeZone, slots]);

    const firstDay = byDay.size ? [...byDay.keys()].sort()[0]! : null;
    const day = visibleDate ?? firstDay;
    const daySlots = day ? (byDay.get(day) ?? []) : [];
    const holdLeft = holdExpiresAt
      ? Math.max(0, Math.floor((new Date(holdExpiresAt).getTime() - Date.now()) / 1000))
      : null;
    const setDay = (next: string): void => {
      setVisibleDate(next);
      setSelected(null);
    };
    const dayLabel = day ? longDate(day, locale) : '';
    const visibleTimeZone =
      TimeZonePicker.ZONES.find((zone) => zone.value === activeTimeZone)?.label ?? activeTimeZone;

    return (
      <div {...rest} ref={ref} className={cx('lyra-slotpicker', className)}>
        <div className="lyra-slotpicker__side">
          {children}
          <Calendar
            size="md"
            value={day}
            onChange={(next) => {
              if (next instanceof Date) setDay(isoDate(next));
            }}
            min={min}
            max={max}
            isDateDisabled={(next) => !byDay.has(isoDate(next))}
            renderDayMarker={(next) =>
              byDay.has(isoDate(next)) ? <span className="lyra-cal__dot" /> : null
            }
          />
          <div className="lyra-slotpicker__tz">
            <Icon name="globe" size={15} />
            {timeZoneOpen || timezone === undefined ? (
              <TimeZonePicker
                value={activeTimeZone}
                detectedZone={detectedZone}
                locale={locale}
                labels={labels.timeZonePicker}
                onChange={(next) => {
                  setTimeZoneOpen(false);
                  setTimeZone(next);
                }}
              />
            ) : (
              <>
                <span>{visibleTimeZone}</span>
                <button type="button" onClick={() => setTimeZoneOpen(true)}>
                  {labels.changeTimeZone}
                </button>
              </>
            )}
          </div>
        </div>
        <div className="lyra-slotpicker__main" aria-live="polite">
          {loading ? (
            <div className="lyra-slotpicker__slots" aria-label={labels.loading}>
              {Array.from({ length: 6 }, (_, index) => (
                <span key={index} className="lyra-slotpicker__skeleton" />
              ))}
            </div>
          ) : byDay.size === 0 ? (
            <div className="lyra-slotpicker__empty">
              <span>{full}</span>
            </div>
          ) : daySlots.length === 0 ? (
            <div className="lyra-slotpicker__empty">
              <span>{empty}</span>
              {nextAvailableDate && (
                <span>{labels.nextAvailable(longDate(nextAvailableDate, locale))}</span>
              )}
              {nextAvailableDate && byDay.has(nextAvailableDate) && (
                <Button variant="secondary" size="sm" onClick={() => setDay(nextAvailableDate)}>
                  {labels.goToDate(longDate(nextAvailableDate, locale))}
                </Button>
              )}
            </div>
          ) : (
            <>
              <span className="lyra-slotpicker__daylabel">{dayLabel}</span>
              <div
                className="lyra-slotpicker__slots"
                role="listbox"
                aria-label={labels.availableTimes(dayLabel)}
              >
                {daySlots.map((slot) =>
                  selected?.start === slot.start ? (
                    <span className="lyra-slotpicker__pair" key={slot.start}>
                      <span className="lyra-slotpicker__slot" role="option" aria-selected="true">
                        {timeOf(slot.start, activeTimeZone, locale)}
                      </span>
                      <Button onClick={() => onConfirm?.(slot)}>{confirmation}</Button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      key={slot.start}
                      role="option"
                      aria-selected="false"
                      className="lyra-slotpicker__slot"
                      onClick={() => setSelected(slot)}
                    >
                      {timeOf(slot.start, activeTimeZone, locale)}
                    </button>
                  ),
                )}
              </div>
              {holdLeft !== null && holdLeft > 0 && (
                <span className="lyra-slotpicker__hold">
                  <Icon name="timer" size={14} />
                  {labels.hold(Math.floor(holdLeft / 60), String(holdLeft % 60).padStart(2, '0'))}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    );
  },
);
