import { forwardRef, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { HTMLAttributes, KeyboardEvent } from 'react';
import { BottomSheet } from '../bottom-sheet';
import { cx } from '../internal/cx';
import { useMobilePicker } from '../internal/picker-utils';
import { useControllableState } from '../internal/use-controllable-state';
import { Popover } from '../popover';

/** Translatable labels for {@link TimePicker}. Merged over the English defaults. */
export interface TimePickerLabels {
  /** Trigger text when no time is selected. Default: `"Select time"`. */
  placeholder?: string;
  /** Accessible name for the time-options list. Default: `"Time options"`. */
  timeOptions?: string;
  /** Accessible name for the Popover panel. Default: `"Time picker"`. */
  popover?: string;
  /** BottomSheet heading when no field label is provided. Default: `"Select time"`. */
  sheetTitle?: string;
  /** Accessible name for the BottomSheet close button. Default: `"Close"`. */
  close?: string;
}

const DEFAULT_LABELS: Required<TimePickerLabels> = {
  placeholder: 'Select time',
  timeOptions: 'Time options',
  popover: 'Time picker',
  sheetTitle: 'Select time',
  close: 'Close',
};

/** Props for {@link TimePicker}. */
export interface TimePickerProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange'
> {
  /** Label rendered above the picker trigger. */
  label?: string;
  /** Helper text rendered below the picker. Replaced by `error` when set. */
  hint?: string;
  /** Error message that enables error styling and replaces `hint`. */
  error?: string;
  /** Controlled 24-hour `HH:mm` time, or `null` with no selected time. */
  value?: string | null;
  /** Initial 24-hour `HH:mm` time in uncontrolled mode. */
  defaultValue?: string;
  /** Called after the user selects a 24-hour `HH:mm` time. */
  onChange?: (time: string) => void;
  /** Trigger text when no time is selected. Defaults to `labels.placeholder`. */
  placeholder?: string;
  /** Minutes between generated options. Default: `30`. */
  step?: number;
  /** Inclusive 24-hour `HH:mm` lower limit. Default: `"00:00"`. */
  min?: string;
  /** Inclusive 24-hour `HH:mm` upper limit. Default: `"23:59"`. */
  max?: string;
  /** BCP 47 locale used to display each time. Default: `"en-US"`. */
  locale?: string;
  /** Translatable visible and accessible labels, merged over the English defaults. */
  labels?: TimePickerLabels;
  /** Disables the picker trigger. */
  disabled?: boolean;
}

function minutesFromTime(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours <= 23 && minutes <= 59 ? hours * 60 + minutes : null;
}

function timeFromMinutes(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/** A 24-hour time picker with generated local-time options in a Popover. */
export const TimePicker = /*#__PURE__*/ forwardRef<HTMLDivElement, TimePickerProps>(
  function TimePicker(
    {
      label,
      hint,
      error,
      value,
      defaultValue,
      onChange,
      placeholder,
      step = 30,
      min = '00:00',
      max = '23:59',
      locale = 'en-US',
      labels: labelsProp,
      disabled = false,
      id,
      className,
      ...rest
    },
    ref,
  ) {
    const labels = { ...DEFAULT_LABELS, ...labelsProp };
    const [selected, setSelected] = useControllableState<string | null>({
      value,
      defaultValue: defaultValue ?? null,
      onChange: (next) => {
        if (next) onChange?.(next);
      },
    });
    const [open, setOpen] = useState(false);
    const mobile = useMobilePicker();
    const generatedId = useId();
    const triggerId = id ?? generatedId;
    const listRef = useRef<HTMLDivElement>(null);
    const timeFormatter = useMemo(
      () =>
        new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }),
      [locale],
    );
    const options = useMemo(() => {
      const lower = minutesFromTime(min) ?? 0;
      const upper = minutesFromTime(max) ?? 23 * 60 + 59;
      const interval = Number.isFinite(step) && step > 0 ? Math.floor(step) : 30;
      if (lower > upper) return [];
      const values: string[] = [];
      for (let current = lower; current <= upper; current += interval) {
        values.push(timeFromMinutes(current));
      }
      return values;
    }, [max, min, step]);

    useEffect(() => {
      if (!open || !listRef.current) return;
      const selectedOption = listRef.current.querySelector<HTMLElement>('[aria-selected="true"]');
      if (selectedOption) listRef.current.scrollTop = Math.max(0, selectedOption.offsetTop - 84);
    }, [open]);

    const formatTime = (time: string): string => {
      const minutes = minutesFromTime(time);
      if (minutes == null) return time;
      return timeFormatter.format(new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60));
    };
    const pick = (time: string): void => {
      setSelected(time);
      setOpen(false);
    };
    const trigger = (
      <button
        type="button"
        id={triggerId}
        className={cx('lyra-input', 'lyra-datepicker__btn', error && 'lyra-input--error')}
        disabled={disabled}
        onClick={mobile ? () => setOpen(true) : undefined}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        <span className={selected ? undefined : 'lyra-datepicker__ph'}>
          {selected ? formatTime(selected) : (placeholder ?? labels.placeholder)}
        </span>
      </button>
    );
    // role="listbox" implies the APG keyboard contract: arrows move between
    // options, Home/End jump to the edges. Tab alone is not enough.
    const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
      const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
      if (!keys.includes(event.key)) return;
      const items = Array.from(
        event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="option"]'),
      );
      if (items.length === 0) return;
      const current = items.indexOf(document.activeElement as HTMLButtonElement);
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? items.length - 1
            : event.key === 'ArrowDown'
              ? Math.min(current + 1, items.length - 1)
              : Math.max(current - 1, 0);
      event.preventDefault();
      items[next]?.focus();
    };
    const timeList = (
      <div
        ref={listRef}
        className="lyra-timelist"
        role="listbox"
        aria-label={labels.timeOptions}
        onKeyDown={onListKeyDown}
      >
        {options.map((time) => (
          <button
            key={time}
            type="button"
            role="option"
            aria-selected={time === selected || undefined}
            className={cx(
              'lyra-timelist__item',
              time === selected && 'lyra-timelist__item--selected',
            )}
            onClick={() => pick(time)}
          >
            {formatTime(time)}
          </button>
        ))}
      </div>
    );
    const control = disabled ? (
      <span className="lyra-datepicker">{trigger}</span>
    ) : mobile ? (
      <>
        <span className="lyra-datepicker">{trigger}</span>
        <BottomSheet
          open={open}
          onClose={() => setOpen(false)}
          title={label ?? labels.sheetTitle}
          closeLabel={labels.close}
        >
          {timeList}
        </BottomSheet>
      </>
    ) : (
      <Popover
        className="lyra-datepicker"
        open={open}
        onOpenChange={setOpen}
        ariaLabel={labels.popover}
        trigger={trigger}
      >
        {timeList}
      </Popover>
    );

    return (
      <div {...rest} ref={ref} className={cx((label || hint || error) && 'lyra-field', className)}>
        {label && (
          <label className="lyra-label" htmlFor={triggerId}>
            {label}
          </label>
        )}
        {control}
        {error ? (
          <span className="lyra-hint lyra-hint--error">{error}</span>
        ) : hint ? (
          <span className="lyra-hint">{hint}</span>
        ) : null}
      </div>
    );
  },
);
