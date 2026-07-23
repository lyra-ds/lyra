import { forwardRef } from 'react';
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
  { label, checked, defaultChecked, onChange, className, ...rest },
  ref,
) {
  const isControlled = checked !== undefined;
  const [radioChecked, setRadioChecked] = useControllableState<boolean>({
    value: checked,
    defaultValue: defaultChecked,
  });
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    if (isControlled) setRadioChecked(event.target.checked);
    onChange?.(event);
  };
  const control = (
    <input
      {...rest}
      ref={ref}
      type="radio"
      className={cx('lyra-radio', className)}
      {...(isControlled ? { checked: radioChecked } : { defaultChecked })}
      onChange={handleChange}
    />
  );

  if (!label) return control;
  return (
    <label className="lyra-check-row">
      {control}
      <span>{label}</span>
    </label>
  );
});
