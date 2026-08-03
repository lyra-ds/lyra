import { forwardRef, useId, useMemo, useState } from 'react';
import type { HTMLAttributes } from 'react';
import { BottomSheet } from '../bottom-sheet';
import { Calendar } from '../calendar';
import type { CalendarLabels, CalendarRange } from '../calendar';
import { cx } from '../internal/cx';
import { toLocalDate, useMobilePicker } from '../internal/picker-utils';
import { useControllableState } from '../internal/use-controllable-state';
import { Popover } from '../popover';

/** Translatable labels for {@link DatePicker}. Merged over the English defaults. */
export interface DatePickerLabels {
  /** Trigger text when no date is selected. Default: `"Select date"`. */
  placeholder?: string;
  /** Accessible name for the desktop Popover. Default: `"Date picker"`. */
  popover?: string;
  /** BottomSheet heading when no field label is provided. Default: `"Select date"`. */
  sheetTitle?: string;
  /** Accessible name for the BottomSheet close button. Default: `"Close"`. */
  close?: string;
  /** Labels forwarded to the composed Calendar. */
  calendar?: CalendarLabels;
}

const DEFAULT_LABELS: Required<Omit<DatePickerLabels, 'calendar'>> = {
  placeholder: 'Select date',
  popover: 'Date picker',
  sheetTitle: 'Select date',
  close: 'Close',
};

/** Props for {@link DatePicker}. */
export interface DatePickerProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange'
> {
  /** Label rendered above the picker trigger. */
  label?: string;
  /** Helper text rendered below the picker. Replaced by `error` when set. */
  hint?: string;
  /** Error message that enables error styling and replaces `hint`. */
  error?: string;
  /** Controlled local date or ISO `YYYY-MM-DD` date-only string, or `null` with no date selected. */
  value?: Date | string | null;
  /** Initial local date or ISO `YYYY-MM-DD` date-only string in uncontrolled mode. */
  defaultValue?: Date | string;
  /** Called after the user selects a local date. */
  onChange?: (date: Date) => void;
  /** Trigger text when no date is selected. Defaults to `labels.placeholder`. */
  placeholder?: string;
  /** Inclusive lower selection limit as a local date or ISO `YYYY-MM-DD` string. */
  min?: Date | string;
  /** Inclusive upper selection limit as a local date or ISO `YYYY-MM-DD` string. */
  max?: Date | string;
  /** BCP 47 locale used to format the selected date and compose Calendar. Default: `"en-US"`. */
  locale?: string;
  /** Translatable visible and accessible labels, merged over the English defaults. */
  labels?: DatePickerLabels;
  /** Disables the picker trigger. */
  disabled?: boolean;
}

/** A local-date picker that composes Calendar in Popover on desktop and BottomSheet on mobile. */
export const DatePicker = /*#__PURE__*/ forwardRef<HTMLDivElement, DatePickerProps>(
  function DatePicker(
    {
      label,
      hint,
      error,
      value,
      defaultValue,
      onChange,
      placeholder,
      min,
      max,
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
    const controlledValue = value === undefined ? undefined : toLocalDate(value);
    const [selected, setSelected] = useControllableState<Date | null>({
      value: controlledValue,
      defaultValue: toLocalDate(defaultValue),
      onChange: (next) => {
        if (next) onChange?.(next);
      },
    });
    const [open, setOpen] = useState(false);
    const mobile = useMobilePicker();
    const generatedId = useId();
    const triggerId = id ?? generatedId;
    const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale), [locale]);
    const handleDateChange = (next: Date | CalendarRange): void => {
      if (!(next instanceof Date)) return;
      setSelected(next);
      setOpen(false);
    };
    const calendar = (
      <Calendar
        value={selected}
        min={min}
        max={max}
        locale={locale}
        labels={labels.calendar}
        onChange={handleDateChange}
      />
    );
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
          <path d="M8 2v4M16 2v4" />
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M3 10h18" />
        </svg>
        <span className={selected ? undefined : 'lyra-datepicker__ph'}>
          {selected ? dateFormatter.format(selected) : (placeholder ?? labels.placeholder)}
        </span>
      </button>
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
          <div className="lyra-cal--sheet">{calendar}</div>
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
        {calendar}
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
