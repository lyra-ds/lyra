import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cx } from '../internal/cx';

/** Props for {@link Progress}. */
export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  /** Progress percentage from 0 to 100. */
  value: number;
  /** Optional alternative fill color. */
  tone?: 'success' | 'danger';
}

/** A determinate 0–100 progress bar. */
export const Progress = /*#__PURE__*/ forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  { value, tone, className, ...rest },
  ref,
) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      {...rest}
      ref={ref}
      className={cx('lyra-progress', tone && `lyra-progress--${tone}`, className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="lyra-progress__fill" style={{ width: `${clamped}%` }} />
    </div>
  );
});
