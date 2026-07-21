import { forwardRef, useId } from 'react';
import type { ChangeEvent, ReactNode, SelectHTMLAttributes } from 'react';
import { cx } from '../internal/cx';
import { useControllableState } from '../internal/use-controllable-state';

/** Props for {@link Select}. */
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Label rendered above the select and associated through `htmlFor`. */
  label?: string;
  /** Helper text rendered below the select. Replaced by `error` when provided. */
  hint?: string;
  /** Error message that enables error styling and `aria-invalid`. */
  error?: string;
  /** Control height. Default `"md"`. */
  size?: 'sm' | 'md' | 'lg';
  /** Native `<option>` or `<optgroup>` children. */
  children: ReactNode;
}

/** A native select styled with the shared Lyra form-field recipe. */
export const Select = /*#__PURE__*/ forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    hint,
    error,
    size,
    id,
    value,
    defaultValue,
    onChange,
    className,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    children,
    ...rest
  },
  ref,
) {
  const isControlled = value !== undefined;
  const [selectValue, setSelectValue] = useControllableState<SelectHTMLAttributes<HTMLSelectElement>['value']>({
    value,
    defaultValue,
  });
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const messageId = useId();
  const hasMessage = Boolean(error) || Boolean(hint);
  const describedBy = hasMessage
    ? [ariaDescribedBy, messageId].filter(Boolean).join(' ')
    : ariaDescribedBy;

  const handleChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    if (isControlled) setSelectValue(event.target.value);
    onChange?.(event);
  };
  const control = (
    <span className="lyra-select-wrap">
      <select
        {...rest}
        ref={ref}
        id={selectId}
        className={cx(
          'lyra-input',
          size === 'sm' && 'lyra-input--sm',
          size === 'lg' && 'lyra-input--lg',
          error && 'lyra-input--error',
          className,
        )}
        {...(isControlled ? { value: selectValue } : { defaultValue })}
        onChange={handleChange}
        aria-invalid={error ? true : ariaInvalid}
        aria-describedby={describedBy || undefined}
      >
        {children}
      </select>
    </span>
  );

  if (!label && !hint && !error) return control;
  return (
    <div className="lyra-field">
      {label && (
        <label className="lyra-label" htmlFor={selectId}>
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
