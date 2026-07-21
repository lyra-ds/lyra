import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';

/** Props for {@link Stat}. */
export interface StatProps extends HTMLAttributes<HTMLDivElement> {
  /** Label describing the metric. */
  label: ReactNode;
  /** Prominent metric value. */
  value: ReactNode;
  /** Optional change text. */
  delta?: ReactNode;
  /** Change direction and color. Default `"flat"`. */
  direction?: 'up' | 'down' | 'flat';
}

/** A prominent numeric metric with an optional change indicator. */
export const Stat = /*#__PURE__*/ forwardRef<HTMLDivElement, StatProps>(function Stat(
  { label, value, delta, direction = 'flat', className, ...rest },
  ref,
) {
  const arrow = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';
  return (
    <div {...rest} ref={ref} className={cx('lyra-stat', className)}>
      <span className="lyra-stat__label">{label}</span>
      <span className="lyra-stat__value">{value}</span>
      {delta != null && (
        <span className={`lyra-stat__delta lyra-stat__delta--${direction}`}>
          {arrow} {delta}
        </span>
      )}
    </div>
  );
});
