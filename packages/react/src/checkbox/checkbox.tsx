import { forwardRef, useId } from 'react';
import type { ChangeEvent, InputHTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';
import { useControllableState } from '../internal/use-controllable-state';

/** Props for {@link Checkbox}. */
export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Clickable label rendered beside the checkbox. */
  label?: ReactNode;
}

/** A native checkbox with Lyra styling and optional associated label. */
export const Checkbox = /*#__PURE__*/ forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, id, checked, defaultChecked, onChange, className, ...rest },
  ref,
) {
  const isControlled = checked !== undefined;
  const [checkboxChecked, setCheckboxChecked] = useControllableState<boolean>({
    value: checked,
    defaultValue: defaultChecked,
  });
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    if (isControlled) setCheckboxChecked(event.target.checked);
    onChange?.(event);
  };
  const control = (
    <input
      {...rest}
      ref={ref}
      id={inputId}
      type="checkbox"
      className={cx('lyra-checkbox', className)}
      {...(isControlled ? { checked: checkboxChecked } : { defaultChecked })}
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
