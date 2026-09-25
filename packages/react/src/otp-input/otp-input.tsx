import { useId, useRef } from 'react';
import type { ClipboardEvent, ChangeEvent, KeyboardEvent } from 'react';
import { cx } from '../internal/cx';
import { useControllableState } from '../internal/use-controllable-state';

/** Props for the numeric, segmented one-time-code input. */
export interface OtpInputProps {
  /** Visible and accessible label for the whole code. */
  label: string;
  /** Number of digits. Default: 6. */
  length?: number;
  /** Controlled code, containing only digits. */
  value?: string;
  /** Initial code in uncontrolled mode. */
  defaultValue?: string;
  /** Called with the complete current code after each edit. */
  onChange?: (value: string) => void;
  /** Name of a hidden input that submits the combined code. */
  name?: string;
  /** Hint shown below the group, replaced by error. */
  hint?: string;
  /** Visible error, connected to the group and every digit. */
  error?: string;
  /** Disables all digit inputs. */
  disabled?: boolean;
  /** Additional class on the group. */
  className?: string;
  /** Optional stable id for the group. */
  id?: string;
  /** Localized word used in each digit's accessible name. Default: "Digit". */
  digitLabel?: string;
}

const digits = (value: string, length: number): string =>
  value.replace(/[^0-9]/g, '').slice(0, length);

/** A one-time-code field with auto-advance, paste distribution and keyboard navigation. */
export function OtpInput({
  label,
  length = 6,
  value,
  defaultValue = '',
  onChange,
  name,
  hint,
  error,
  disabled = false,
  className,
  id,
  digitLabel = 'Digit',
}: OtpInputProps): React.JSX.Element {
  const count = Math.max(1, Math.floor(Number.isFinite(length) ? length : 6));
  const [code, setCode] = useControllableState({
    value: value === undefined ? undefined : digits(value, count),
    defaultValue: digits(defaultValue, count),
    onChange,
  });
  const slots = Array.from({ length: count }, (_, index) => code[index] ?? '');
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const generatedId = useId();
  const groupId = id ?? generatedId;
  const labelId = groupId + '-label';
  const messageId = groupId + '-message';

  const focus = (index: number): void => {
    const input = refs.current[Math.max(0, Math.min(index, count - 1))];
    input?.focus();
    input?.select();
  };

  const write = (index: number, text: string): void => {
    const incoming = digits(text, count);
    if (!incoming) return;
    const start = incoming.length >= count ? 0 : Math.min(index, code.length);
    const next = [...slots];
    for (let offset = 0; offset < incoming.length && start + offset < count; offset += 1) {
      next[start + offset] = incoming[offset];
    }
    setCode(next.join(''));
    focus(Math.min(start + incoming.length, count - 1));
  };

  const change = (index: number, event: ChangeEvent<HTMLInputElement>): void => {
    const raw = event.currentTarget.value;
    if (!raw) {
      const next = code.split('');
      next.splice(index, 1);
      setCode(next.join(''));
      return;
    }
    write(index, raw);
  };

  const keyDown = (index: number, event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      focus(index + (event.key === 'ArrowLeft' ? -1 : 1));
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      focus(event.key === 'Home' ? 0 : count - 1);
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      const target = slots[index] ? index : Math.max(0, index - 1);
      const next = code.split('');
      next.splice(target, 1);
      setCode(next.join(''));
      focus(target);
    } else if (event.key === 'Delete') {
      event.preventDefault();
      const next = code.split('');
      next.splice(index, 1);
      setCode(next.join(''));
    }
  };

  const paste = (index: number, event: ClipboardEvent<HTMLInputElement>): void => {
    event.preventDefault();
    write(index, event.clipboardData.getData('text'));
  };

  return (
    <div className="lyra-field">
      <span id={labelId} className="lyra-label">
        {label}
      </span>
      <div
        id={groupId}
        role="group"
        aria-labelledby={labelId}
        aria-describedby={error || hint ? messageId : undefined}
        className={cx('lyra-otp', className)}
      >
        {slots.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              refs.current[index] = element;
            }}
            className={cx('lyra-input', 'lyra-otp__digit', error && 'lyra-input--error')}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            pattern="[0-9]*"
            maxLength={count}
            aria-label={`${digitLabel} ${index + 1} / ${count}`}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? messageId : undefined}
            value={digit}
            disabled={disabled}
            onChange={(event) => change(index, event)}
            onKeyDown={(event) => keyDown(index, event)}
            onPaste={(event) => paste(index, event)}
          />
        ))}
      </div>
      {name && <input type="hidden" name={name} value={code} disabled={disabled} />}
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
}
