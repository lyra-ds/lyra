import { forwardRef, useId } from 'react';
import type { ChangeEvent, InputHTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';
import { useControllableState } from '../internal/use-controllable-state';

/** Props for {@link Radio}. */
export interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Clickable label rendered beside the radio button. */
  label?: ReactNode;
  /** Group radio buttons by giving them the same name. */
  name?: string;
}

/** A native radio button with Lyra styling and optional associated label. */
export const Radio = /*#__PURE__*/ forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, id, checked, defaultChecked, onChange, className, ...rest },
  ref,
) {
  const isControlled = checked !== undefined;
  const [radioChecked, setRadioChecked] = useControllableState<boolean>({
    value: checked,
    defaultValue: defaultChecked,
  });
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    if (isControlled) setRadioChecked(event.target.checked);
    onChange?.(event);
  };
  const control = (
    <input
      {...rest}
      ref={ref}
      id={inputId}
      type="radio"
      className={cx('lyra-radio', className)}
      {...(isControlled ? { checked: radioChecked } : { defaultChecked })}
      onChange={handleChange}
    />
  );

  if (!label) return control;
  return (
    <span className="lyra-check-row">
      {control}
      <label htmlFor={inputId}>{label}</label>
    </span>
  );
});
