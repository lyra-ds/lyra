import { forwardRef, useId, useState } from 'react';
import type { FocusEvent, InputHTMLAttributes, KeyboardEvent } from 'react';
import { cx } from '../internal/cx';
import { useControllableState } from '../internal/use-controllable-state';

/** Translatable labels for TimeInput. Merged over the English defaults. */
export interface TimeInputLabels {
  /** Accessible name for the increment stepper. Default: "Later". */
  later?: string;
  /** Accessible name for the decrement stepper. Default: "Earlier". */
  earlier?: string;
  /** Spoken value for a selected time. */
  valueText?: (hours: number, minutes: number) => string;
}

const DEFAULT_LABELS: Required<TimeInputLabels> = {
  later: 'Later',
  earlier: 'Earlier',
  valueText: (hours, minutes) => String(hours) + ' hours and ' + String(minutes) + ' minutes',
};

/** Props for TimeInput. */
export interface TimeInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'size' | 'min' | 'max' | 'step'
> {
  /** Label rendered above the input and connected with htmlFor. */
  label?: string;
  /** Helper text rendered below the input. Replaced by error when present. */
  hint?: string;
  /** Error message that enables error styling and replaces hint. */
  error?: string;
  /** Controlled 24-hour HH:mm value, or null for no selected time. */
  value?: string | null;
  /** Initial 24-hour HH:mm value in uncontrolled mode. */
  defaultValue?: string;
  /** Called with a normalized HH:mm value, or null after the field is cleared. */
  onChange?: (time: string | null) => void;
  /** Minutes added or subtracted by the steppers and Arrow keys. Default: 15. */
  step?: number;
  /** Inclusive HH:mm lower limit. Values below it are clamped. */
  min?: string;
  /** Inclusive HH:mm upper limit. Values above it are clamped. */
  max?: string;
  /** Control height. Default: "md". */
  size?: 'sm' | 'md' | 'lg';
  /** Enables invalid styling and aria-invalid without an error message. */
  invalid?: boolean;
  /** Translatable accessible labels, merged over the English defaults. */
  labels?: TimeInputLabels;
  /** Disables the input and steppers. */
  disabled?: boolean;
}

const pad = (value: number): string => String(value).padStart(2, '0');

function minutesFromTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 ? hours * 60 + minutes : null;
}

const timeFromMinutes = (minutes: number): string =>
  pad(Math.floor(minutes / 60)) + ':' + pad(minutes % 60);

/**
 * Parses supported free-form time input. null means an intentional clear, undefined means
 * invalid text that must remain visible for correction, and a string is a valid normalized time.
 */
function parseTime(raw: string): string | null | undefined {
  const text = raw.trim().replace(/[hH]/, ':');
  if (!text) return null;

  let hours: number;
  let minutes: number;
  if (text.includes(':')) {
    const fields = text.split(':');
    // A colon-delimited value has exactly an hours and optional-minutes field. Do not
    // silently discard trailing fields: `9:5:99` must stay visible as invalid text.
    if (fields.length !== 2) return undefined;
    const [rawHours, rawMinutes = '0'] = fields;
    hours = Number(rawHours);
    minutes = Number(rawMinutes);
  } else if (text.length <= 2) {
    hours = Number(text);
    minutes = 0;
  } else {
    hours = Number(text.slice(0, -2));
    minutes = Number(text.slice(-2));
  }

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return undefined;
  }
  return timeFromMinutes(hours * 60 + minutes);
}

function Chevron({ up }: { up: boolean }): React.JSX.Element {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={up ? 'm18 15-6-6-6 6' : 'm6 9 6 6 6-6'} />
    </svg>
  );
}

/**
 * A masked 24-hour HH:mm input with increment and decrement steppers.
 *
 * Free-form input such as "9", "0930", and "9:5" is normalized on blur or Enter.
 * Invalid typed text is deliberately preserved and marked invalid until the user corrects it.
 * ArrowUp and ArrowDown move by step; hold Shift to move by one hour.
 */
export const TimeInput = /*#__PURE__*/ forwardRef<HTMLInputElement, TimeInputProps>(
  function TimeInput(
    {
      label,
      hint,
      error,
      value,
      defaultValue,
      onChange,
      step = 15,
      min,
      max,
      size = 'md',
      invalid,
      labels: labelsProp,
      disabled = false,
      placeholder = '--:--',
      id,
      className,
      onBlur,
      onKeyDown,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      'aria-valuetext': ariaValueText,
      ...rest
    },
    ref,
  ) {
    const labels = { ...DEFAULT_LABELS, ...labelsProp };
    const [selected, setSelected] = useControllableState<string | null>({
      value,
      defaultValue: defaultValue ?? null,
      onChange,
    });
    const [text, setText] = useState(selected ?? '');
    const [bad, setBad] = useState(false);
    const [previousSelected, setPreviousSelected] = useState(selected);
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const messageId = useId();
    const hasMessage = Boolean(error) || Boolean(hint);
    const describedBy = hasMessage
      ? [ariaDescribedBy, messageId].filter(Boolean).join(' ')
      : ariaDescribedBy;
    const lowerLimit = minutesFromTime(min);
    const upperLimit = minutesFromTime(max);
    const clamp = (minutes: number): number =>
      Math.min(upperLimit ?? 1439, Math.max(lowerLimit ?? 0, minutes));

    // A parent can replace a controlled value at any time. Reset the editable text during
    // rendering for that explicit prop transition, rather than scheduling an effect that leaves
    // one stale painted frame (and triggers the React set-state-in-effect lint rule).
    if (selected !== previousSelected) {
      setPreviousSelected(selected);
      setText(selected ?? '');
      setBad(false);
    }

    const normalize = (raw: string): void => {
      const parsed = parseTime(raw);
      // undefined is invalid input, intentionally distinct from the null clear.
      // Do not collapse these paths: invalid text must stay in the input for correction.
      if (parsed === undefined) {
        setBad(true);
        return;
      }
      setBad(false);
      if (parsed === null) {
        setSelected(null);
        return;
      }
      const normalized = timeFromMinutes(clamp(minutesFromTime(parsed)!));
      setText(normalized);
      setSelected(normalized);
    };

    const bump = (delta: number): void => {
      const parsedText = parseTime(text);
      const base =
        minutesFromTime(typeof parsedText === 'string' ? parsedText : selected) ??
        clamp(new Date().getHours() * 60);
      const next = timeFromMinutes(clamp(base + delta));
      setText(next);
      setBad(false);
      setSelected(next);
    };

    const handleBlur = (event: FocusEvent<HTMLInputElement>): void => {
      normalize(event.currentTarget.value);
      onBlur?.(event);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        bump(event.shiftKey ? 60 : step);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        bump(event.shiftKey ? -60 : -step);
      } else if (event.key === 'Enter') {
        normalize(event.currentTarget.value);
      }
      onKeyDown?.(event);
    };

    const isInvalid = Boolean(error || invalid || bad);
    const selectedMinutes = minutesFromTime(selected);
    const generatedValueText =
      selectedMinutes == null
        ? undefined
        : labels.valueText(Math.floor(selectedMinutes / 60), selectedMinutes % 60);
    const input = (
      <input
        {...rest}
        ref={ref}
        id={inputId}
        className={cx(
          'lyra-input',
          size !== 'md' && 'lyra-input--' + size,
          isInvalid && 'lyra-input--error',
          className,
        )}
        type="text"
        role="spinbutton"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={text}
        disabled={disabled}
        aria-invalid={isInvalid ? true : ariaInvalid}
        aria-describedby={describedBy || undefined}
        aria-valuemin={lowerLimit ?? 0}
        aria-valuemax={upperLimit ?? 1439}
        aria-valuenow={selectedMinutes ?? undefined}
        aria-valuetext={ariaValueText ?? generatedValueText}
        onChange={(event) => setText(event.currentTarget.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    );

    const control = (
      <span className="lyra-timeinput">
        {input}
        <span className="lyra-timeinput__steppers" aria-hidden={disabled || undefined}>
          <button
            type="button"
            tabIndex={-1}
            className="lyra-timeinput__step"
            aria-label={labels.later}
            onClick={() => bump(step)}
            disabled={disabled}
          >
            <Chevron up />
          </button>
          <button
            type="button"
            tabIndex={-1}
            className="lyra-timeinput__step"
            aria-label={labels.earlier}
            onClick={() => bump(-step)}
            disabled={disabled}
          >
            <Chevron up={false} />
          </button>
        </span>
      </span>
    );

    if (!label && !hint && !error) return control;

    return (
      <div className="lyra-field">
        {label && (
          <label className="lyra-label" htmlFor={inputId}>
            {label}
          </label>
        )}
        {control}
        {error ? (
          <span id={messageId} className="lyra-hint lyra-hint--error">
            {error}
          </span>
        ) : hint ? (
          <span id={messageId} className="lyra-hint">
            {hint}
          </span>
        ) : null}
      </div>
    );
  },
);
