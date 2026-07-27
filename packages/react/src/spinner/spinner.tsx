import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cx } from '../internal/cx';

/** Props for {@link Spinner}. */
export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  /** Spinner size. Default `"md"` (24px). */
  size?: 'sm' | 'md' | 'lg';
  /** Accessible name for the live region. Default: `"Loading"`. Translate it in a localized interface — it is what a screen reader announces while content loads. */
  'aria-label'?: string;
}

/** An indeterminate loading spinner. */
export const Spinner = /*#__PURE__*/ forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = 'md', className, 'aria-label': ariaLabel, ...rest },
  ref,
) {
  return (
    <span
      {...rest}
      ref={ref}
      className={cx('lyra-spinner', `lyra-spinner--${size}`, className)}
      role="status"
      aria-label={ariaLabel ?? 'Loading'}
    />
  );
});
