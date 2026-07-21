import { forwardRef, useId } from 'react';
import type { ChangeEvent, InputHTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';
import { useControllableState } from '../internal/use-controllable-state';

/** Props for {@link Switch}. */
export interface SwitchProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Label rendered beside the switch track. */
  label?: ReactNode;
}

/** A native checkbox presented as an accessible on/off switch. */
export const Switch = /*#__PURE__*/ forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, id, checked, defaultChecked, onChange, className, ...rest },
  ref,
) {
  const isControlled = checked !== undefined;
  const [switchChecked, setSwitchChecked] = useControllableState<boolean>({
    value: checked,
    defaultValue: defaultChecked,
  });
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    if (isControlled) setSwitchChecked(event.target.checked);
    onChange?.(event);
  };

  return (
    <span className={cx('lyra-switch', className)}>
      <input
        {...rest}
        ref={ref}
        id={inputId}
        type="checkbox"
        role="switch"
        {...(isControlled ? { checked: switchChecked } : { defaultChecked })}
        onChange={handleChange}
      />
      <span className="lyra-switch__track" aria-hidden="true" />
      {label && <label htmlFor={inputId}>{label}</label>}
    </span>
  );
});
