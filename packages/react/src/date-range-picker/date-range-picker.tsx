import { forwardRef, useId, useMemo, useState } from 'react';
import type { HTMLAttributes } from 'react';
import { BottomSheet } from '../bottom-sheet';
import { Calendar } from '../calendar';
import type { CalendarLabels, CalendarRange } from '../calendar';
import { cx } from '../internal/cx';
import { toLocalDate, useMobilePicker } from '../internal/picker-utils';
import { useControllableState } from '../internal/use-controllable-state';
import { Popover } from '../popover';

/** The selected local-date bounds for {@link DateRangePicker}. */
export interface DateRange {
  /** The first selected local day, or `null` before selection starts. */
  start: Date | null;
  /** The final selected local day, or `null` until selection completes. */
  end: Date | null;
}

/** Translatable labels for {@link DateRangePicker}. Merged over the English defaults. */
export interface DateRangePickerLabels {
  /** Trigger text when no range is selected. Default: `"Select period"`. */
  placeholder?: string;
  /** Accessible name for the desktop Popover. Default: `"Date range picker"`. */
  popover?: string;
  /** Text after the separator while the range has no end. Default: `"…"`. */
  incompleteRange?: string;
  /** BottomSheet heading when no field label is provided. Default: `"Select period"`. */
  sheetTitle?: string;
  /** Accessible name for the BottomSheet close button. Default: `"Close"`. */
  close?: string;
  /** Labels forwarded to the composed Calendar. */
  calendar?: CalendarLabels;
  /** Text between the formatted start and end dates. Default: `" – "`. */
  rangeSeparator?: string;
}

const DEFAULT_LABELS: Required<Omit<DateRangePickerLabels, 'calendar'>> = {
  placeholder: 'Select period',
  popover: 'Date range picker',
  incompleteRange: '…',
  sheetTitle: 'Select period',
  close: 'Close',
  rangeSeparator: ' – ',
};

/** Props for {@link DateRangePicker}. */
export interface DateRangePickerProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange'
> {
  /** Label rendered above the picker trigger. */
  label?: string;
  /** Helper text rendered below the picker. Replaced by `error` when set. */
  hint?: string;
  /** Error message that enables error styling and replaces `hint`. */
  error?: string;
  /** Controlled local-date range, or `null` with no range selected. */
  value?: DateRange | null;
  /** Initial local-date range. ISO `YYYY-MM-DD` strings are accepted for convenience. */
  defaultValue?: DateRange | { start: Date | string; end: Date | string };
  /** Called after the user selects either bound of the local-date range. */
  onChange?: (range: DateRange) => void;
  /** Trigger text when no range is selected. Defaults to `labels.placeholder`. */
  placeholder?: string;
  /** Inclusive lower selection limit as a local date or ISO `YYYY-MM-DD` string. */
  min?: Date | string;
  /** Inclusive upper selection limit as a local date or ISO `YYYY-MM-DD` string. */
  max?: Date | string;
  /** BCP 47 locale used to format selected dates and compose Calendar. Default: `"en-US"`. */
  locale?: string;
  /** Translatable visible and accessible labels, merged over the English defaults. */
  labels?: DateRangePickerLabels;
  /** Disables the picker trigger. */
  disabled?: boolean;
}

function normalizeRange(
  value: DateRangePickerProps['value'] | DateRangePickerProps['defaultValue'],
): DateRange {
  return { start: toLocalDate(value?.start), end: toLocalDate(value?.end) };
}

/** A local-date range picker that composes Calendar in Popover on desktop and BottomSheet on mobile. */
export const DateRangePicker = /*#__PURE__*/ forwardRef<HTMLDivElement, DateRangePickerProps>(
  function DateRangePicker(
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
    const [selected, setSelected] = useControllableState<DateRange>({
      value: value === undefined ? undefined : normalizeRange(value),
      defaultValue: normalizeRange(defaultValue),
      onChange,
    });
    const [open, setOpen] = useState(false);
    const mobile = useMobilePicker();
    const generatedId = useId();
    const triggerId = id ?? generatedId;
    const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale), [locale]);
    const text = selected.start
      ? `${dateFormatter.format(selected.start)}${labels.rangeSeparator}${selected.end ? dateFormatter.format(selected.end) : labels.incompleteRange}`
      : null;
    const handleRangeChange = (next: Date | CalendarRange): void => {
      if (next instanceof Date) return;
      const range = normalizeRange(next);
      setSelected(range);
      if (range.start && range.end) setOpen(false);
    };
    const calendar = (
      <Calendar
        range
        value={selected}
        min={min}
        max={max}
        locale={locale}
        labels={labels.calendar}
        onChange={handleRangeChange}
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
        <span className={text ? undefined : 'lyra-datepicker__ph'}>
          {text ?? placeholder ?? labels.placeholder}
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
