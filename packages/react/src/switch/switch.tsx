import { forwardRef } from 'react';
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
  { label, checked, defaultChecked, onChange, className, ...rest },
  ref,
) {
  const isControlled = checked !== undefined;
  const [switchChecked, setSwitchChecked] = useControllableState<boolean>({
    value: checked,
    defaultValue: defaultChecked,
  });
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    if (isControlled) setSwitchChecked(event.target.checked);
    onChange?.(event);
  };

  return (
    <label className={cx('lyra-switch', className)}>
      <input
        {...rest}
        ref={ref}
        type="checkbox"
        role="switch"
        {...(isControlled ? { checked: switchChecked } : { defaultChecked })}
        onChange={handleChange}
      />
      <span className="lyra-switch__track" aria-hidden="true" />
      {label && <span>{label}</span>}
    </label>
  );
});
