import { forwardRef } from 'react';
import type { ForwardedRef, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';

/** Props for {@link Separator}. */
export interface SeparatorProps extends HTMLAttributes<HTMLElement> {
  /** Separator direction. Default: `"horizontal"`. */
  orientation?: 'horizontal' | 'vertical';
  /** Centered label, such as `"or"`. Always renders a horizontal separator. */
  label?: ReactNode;
}

/** A horizontal content divider, vertical toolbar divider, or horizontal divider with a label. */
export const Separator = /*#__PURE__*/ forwardRef<HTMLElement, SeparatorProps>(function Separator(
  { orientation = 'horizontal', label, className, ...rest },
  ref,
) {
  if (label) {
    return (
      <div
        {...rest}
        ref={ref as ForwardedRef<HTMLDivElement>}
        className={cx('lyra-separator--label', className)}
        role="separator"
      >
        {label}
      </div>
    );
  }
  if (orientation === 'vertical') {
    return (
      <span
        {...rest}
        ref={ref as ForwardedRef<HTMLSpanElement>}
        className={cx('lyra-separator', 'lyra-separator--vertical', className)}
        role="separator"
        aria-orientation="vertical"
      />
    );
  }
  return (
    <hr
      {...rest}
      ref={ref as ForwardedRef<HTMLHRElement>}
      className={cx('lyra-separator', className)}
    />
  );
});
