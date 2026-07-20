import { forwardRef, useId } from 'react';
import type { ChangeEvent, InputHTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';
import { useControllableState } from '../internal/use-controllable-state';

/**
 * Props for {@link Input}.
 *
 * Extends the native `<input>` attributes so every DOM prop (`type`, `placeholder`,
 * `value`, `defaultValue`, `onChange`, `disabled`, `aria-*`, …) passes straight through
 * onto the `<input>` element. The native numeric `size` attribute is `Omit`-ted first so
 * the Lyra control-height `size` (`'sm' | 'md' | 'lg'`) can be redefined without colliding
 * with the native `size?: number` under strict TypeScript.
 */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Label rendered above the field, wired to the input via `htmlFor`. */
  label?: string;
  /** Helper text rendered below the field. Replaced by `error` when that is set. */
  hint?: string;
  /** Error message — enables the error styling (`.lyra-input--error` + `.lyra-hint--error`), sets `aria-invalid`, and replaces `hint`. */
  error?: string;
  /** Control height. Default `"md"` (sm 32px · md 40px · lg 48px). */
  size?: 'sm' | 'md' | 'lg';
  /** Icon rendered inside the field, on the left (e.g. `<Icon name="search" size={16} />`). */
  iconLeft?: ReactNode;
}

/**
 * Lyra DS text field. A thin wrapper over the `.lyra-input` classes and the `.lyra-field`
 * chrome — all appearance comes from `@lyra-ds/styles`; this component only emits class
 * strings, DOM, and the a11y wiring.
 *
 * Controlled / uncontrolled (D-14): the field is **controlled iff `value !== undefined`**.
 * The public `onChange` is the inherited native `ChangeEventHandler<HTMLInputElement>` — the
 * consumer always receives the original DOM `ChangeEvent` (there is no `onValueChange` prop).
 * `useControllableState` is composed internally for the controlledness contract; the DOM
 * value binding stays native so native value types pass through unmodified.
 *
 * DEVIATION from the handoff prototype: the prototype derived the input `id` from a slugified
 * `label` (`lyra-in-<slug>`). That is dropped here — two same-labeled inputs would emit
 * duplicate DOM ids, an a11y/correctness bug in a production library. The `id` is the `id`
 * prop when provided, else a `useId()`-generated unique id. Consumers needing a deterministic
 * id pass `id` explicitly. (Recorded in CONVENTIONS.md, plan 03-08.)
 *
 * @example
 * <Input label="Email" placeholder="you@example.dev" hint="We never share it." />
 * <Input label="Search" iconLeft={<Icon name="search" size={16} />} placeholder="Search…" />
 * <Input label="Password" type="password" error="At least 8 characters." />
 */
export const Input = /*#__PURE__*/ forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    size,
    iconLeft,
    id,
    value,
    defaultValue,
    onChange,
    className,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    ...rest
  },
  ref,
) {
  // Compose useControllableState for the D-14 controlledness contract + dev warning. The hook
  // receives NO native event handler (its onChange is a value-callback); the DOM value binding
  // below stays native so string | number | readonly string[] pass through unmodified.
  const isControlled = value !== undefined;
  const [inputValue, setInputValue] = useControllableState<
    InputHTMLAttributes<HTMLInputElement>['value']
  >({ value, defaultValue });

  const generatedId = useId();
  const inputId = id ?? generatedId;

  // A single message node carries either the error or the hint. Its id feeds aria-describedby,
  // MERGED with any consumer-provided value (never replaced).
  const messageId = useId();
  const hasMessage = Boolean(error) || Boolean(hint);
  const describedBy = hasMessage
    ? [ariaDescribedBy, messageId].filter(Boolean).join(' ')
    : ariaDescribedBy;

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setInputValue(event.target.value);
    onChange?.(event);
  };

  const cls = cx(
    'lyra-input',
    size === 'sm' && 'lyra-input--sm',
    size === 'lg' && 'lyra-input--lg',
    error && 'lyra-input--error',
    className,
  );

  const inputEl = (
    <input
      ref={ref}
      id={inputId}
      className={cls}
      {...(isControlled ? { value: inputValue } : { defaultValue })}
      onChange={handleChange}
      aria-invalid={error ? true : ariaInvalid}
      aria-describedby={describedBy || undefined}
      {...rest}
    />
  );

  const control = iconLeft ? (
    <span className="lyra-input-wrap">
      <span className="lyra-input-wrap__icon">{iconLeft}</span>
      {inputEl}
    </span>
  ) : (
    inputEl
  );

  // Bare control: no label/hint/error → no .lyra-field chrome (handoff early return preserved).
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
});
