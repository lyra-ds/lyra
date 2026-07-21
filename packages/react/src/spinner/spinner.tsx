import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cx } from '../internal/cx';

/** Props for {@link Spinner}. */
export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  /** Spinner size. Default `"md"` (24px). */
  size?: 'sm' | 'md' | 'lg';
}

/** An indeterminate loading spinner. */
export const Spinner = /*#__PURE__*/ forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = 'md', className, ...rest },
  ref,
) {
  return (
    <span
      {...rest}
      ref={ref}
      className={cx('lyra-spinner', `lyra-spinner--${size}`, className)}
      role="status"
      aria-label="Loading"
    />
  );
});
