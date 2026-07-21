import { forwardRef, useId } from 'react';
import type { ChangeEvent, TextareaHTMLAttributes } from 'react';
import { cx } from '../internal/cx';
import { useControllableState } from '../internal/use-controllable-state';

/** Props for {@link Textarea}. */
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Label rendered above the textarea and associated with it. */
  label?: string;
  /** Helper text rendered below the textarea. Replaced by `error` when present. */
  hint?: string;
  /** Error message that enables error styling and `aria-invalid`. */
  error?: string;
}

/**
 * Lyra DS multiline text field. Appearance is supplied entirely by the `.lyra-*` style
 * classes; this wrapper provides DOM forwarding, controlled-state composition, and a11y wiring.
 */
export const Textarea = /*#__PURE__*/ forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      label,
      hint,
      error,
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
    const isControlled = value !== undefined;
    const [textareaValue, setTextareaValue] = useControllableState<
      TextareaHTMLAttributes<HTMLTextAreaElement>['value']
    >({ value, defaultValue });
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const messageId = useId();
    const hasMessage = Boolean(error) || Boolean(hint);
    const describedBy = hasMessage
      ? [ariaDescribedBy, messageId].filter(Boolean).join(' ')
      : ariaDescribedBy;

    // Keep the D-14 native-event contract: internal state is composed only for controlled
    // ownership, while consumers receive the original DOM event.
    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
      if (isControlled) setTextareaValue(event.target.value);
      onChange?.(event);
    };

    const control = (
      <textarea
        {...rest}
        ref={ref}
        id={textareaId}
        className={cx('lyra-input', 'lyra-textarea', error && 'lyra-input--error', className)}
        {...(isControlled ? { value: textareaValue } : { defaultValue })}
        onChange={handleChange}
        aria-invalid={error ? true : ariaInvalid}
        aria-describedby={describedBy || undefined}
      />
    );

    if (!label && !hint && !error) return control;

    return (
      <div className="lyra-field">
        {label && (
          <label className="lyra-label" htmlFor={textareaId}>
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
