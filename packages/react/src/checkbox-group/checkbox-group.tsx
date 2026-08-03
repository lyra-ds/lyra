import { forwardRef, useId, useReducer } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Checkbox } from '../checkbox';
import { cx } from '../internal/cx';
import { useControllableState } from '../internal/use-controllable-state';

/** An option rendered by {@link CheckboxGroup}. */
export interface CheckboxGroupOption {
  /** Value included in the reported array when this option is selected. */
  value: string;
  /** Primary text or content for this option. */
  label: ReactNode;
  /** Smaller description rendered beneath the option label. */
  hint?: ReactNode;
  /** Prevent this option from being selected. */
  disabled?: boolean;
}

/** Props for {@link CheckboxGroup}. */
export interface CheckboxGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Label rendered above the group. */
  label?: ReactNode;
  /** Helper text rendered below the group when no error is present. */
  hint?: ReactNode;
  /** Error message rendered below the group in place of `hint`. */
  error?: ReactNode;
  /** Checkbox options rendered by the group. Default: `[]`. */
  options?: CheckboxGroupOption[];
  /** Selected values in controlled mode. */
  value?: string[];
  /** Initially selected values in uncontrolled mode. Default: `[]`. */
  defaultValue?: string[];
  /** Called with the next selected values. */
  onChange?: (value: string[]) => void;
  /** Layout direction for the options. Default: `"column"`. */
  direction?: 'column' | 'row';
}

/** A controlled or uncontrolled checkbox group with field label and message treatment. */
export const CheckboxGroup = /*#__PURE__*/ forwardRef<HTMLDivElement, CheckboxGroupProps>(
  function CheckboxGroup(
    {
      label,
      hint,
      error,
      options = [],
      value,
      defaultValue = [],
      onChange,
      direction = 'column',
      className,
      'aria-labelledby': ariaLabelledBy,
      ...rest
    },
    ref,
  ) {
    const [selectedValues, setSelectedValues] = useControllableState<string[]>({
      value,
      defaultValue,
      onChange,
    });
    const [, forceControlledRender] = useReducer((count: number) => count + 1, 0);
    const generatedLabelId = useId();
    const labelledBy = label
      ? [ariaLabelledBy, generatedLabelId].filter(Boolean).join(' ')
      : ariaLabelledBy;

    const toggle = (optionValue: string): void => {
      const nextValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((selectedValue) => selectedValue !== optionValue)
        : [...selectedValues, optionValue];
      setSelectedValues(nextValues);
      if (value !== undefined) forceControlledRender();
    };

    return (
      <div
        {...rest}
        ref={ref}
        className={cx('lyra-field', className)}
        role="group"
        aria-labelledby={labelledBy || undefined}
      >
        {label && (
          <span id={generatedLabelId} className="lyra-label">
            {label}
          </span>
        )}
        <div className={cx('lyra-choicegroup', direction === 'row' && 'lyra-choicegroup--row')}>
          {options.map((option) => (
            <Checkbox
              key={option.value}
              checked={selectedValues.includes(option.value)}
              disabled={option.disabled}
              onChange={() => toggle(option.value)}
              label={
                option.hint ? (
                  <span className="lyra-choice">
                    <span>{option.label}</span>
                    <span className="lyra-choice__hint">{option.hint}</span>
                  </span>
                ) : (
                  option.label
                )
              }
            />
          ))}
        </div>
        {error ? (
          <span className="lyra-hint lyra-hint--error">{error}</span>
        ) : hint ? (
          <span className="lyra-hint">{hint}</span>
        ) : null}
      </div>
    );
  },
);
