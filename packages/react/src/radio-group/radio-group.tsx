import { forwardRef, useId, useReducer } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Radio } from '../radio';
import { cx } from '../internal/cx';
import { useControllableState } from '../internal/use-controllable-state';

/** An option rendered by {@link RadioGroup}. */
export interface RadioGroupOption {
  /** Value reported when this option is selected. */
  value: string;
  /** Primary text or content for this option. */
  label: ReactNode;
  /** Smaller description rendered beneath the option label. */
  hint?: ReactNode;
  /** Prevent this option from being selected. */
  disabled?: boolean;
}

/** Props for {@link RadioGroup}. */
export interface RadioGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Label rendered above the group. */
  label?: ReactNode;
  /** Helper text rendered below the group when no error is present. */
  hint?: ReactNode;
  /** Error message rendered below the group in place of `hint`. */
  error?: ReactNode;
  /** Radio options rendered by the group. Default: `[]`. */
  options?: RadioGroupOption[];
  /** Selected value in controlled mode. */
  value?: string;
  /** Initially selected value in uncontrolled mode. */
  defaultValue?: string;
  /** Called with the selected option value. */
  onChange?: (value: string) => void;
  /** Shared native name for the radio controls. Generated automatically when omitted. */
  name?: string;
  /** Layout direction for the options. Default: `"column"`. */
  direction?: 'column' | 'row';
}

/** A controlled or uncontrolled radio group with field label and message treatment. */
export const RadioGroup = /*#__PURE__*/ forwardRef<HTMLDivElement, RadioGroupProps>(
  function RadioGroup(
    {
      label,
      hint,
      error,
      options = [],
      value,
      defaultValue,
      onChange,
      name,
      direction = 'column',
      className,
      'aria-labelledby': ariaLabelledBy,
      ...rest
    },
    ref,
  ) {
    const [selectedValue, setSelectedValue] = useControllableState<string>({
      value,
      defaultValue,
      onChange,
    });
    const [, forceControlledRender] = useReducer((count: number) => count + 1, 0);
    const generatedName = useId();
    const generatedLabelId = useId();
    const groupName = name ?? generatedName;
    const labelledBy = label
      ? [ariaLabelledBy, generatedLabelId].filter(Boolean).join(' ')
      : ariaLabelledBy;

    return (
      <div
        {...rest}
        ref={ref}
        className={cx('lyra-field', className)}
        role="radiogroup"
        aria-labelledby={labelledBy || undefined}
      >
        {label && (
          <span id={generatedLabelId} className="lyra-label">
            {label}
          </span>
        )}
        <div className={cx('lyra-choicegroup', direction === 'row' && 'lyra-choicegroup--row')}>
          {options.map((option) => (
            <Radio
              key={option.value}
              name={groupName}
              checked={selectedValue === option.value}
              disabled={option.disabled}
              onChange={() => {
                setSelectedValue(option.value);
                if (value !== undefined) forceControlledRender();
              }}
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
