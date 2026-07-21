import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';

/** Props for {@link Badge}. */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Semantic color tone. Default `"neutral"`. */
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  /** Show a status dot before the content. */
  dot?: boolean;
  /** Badge content. */
  children: ReactNode;
}

/** A semantic status badge with an optional leading dot. */
export const Badge = /*#__PURE__*/ forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { tone = 'neutral', dot = false, className, children, ...rest },
  ref,
) {
  return (
    <span {...rest} ref={ref} className={cx('lyra-badge', `lyra-badge--${tone}`, className)}>
      {dot && <span className="lyra-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
});
