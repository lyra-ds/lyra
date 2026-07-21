import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cx } from '../internal/cx';

/** Props for {@link Skeleton}. */
export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  /** Placeholder width. Default `"100%"`. */
  width?: number | string;
  /** Placeholder height. Default `14`. */
  height?: number | string;
  /** Render a circle using `height` as its diameter. */
  circle?: boolean;
}

/** A shimmer loading placeholder. */
export const Skeleton = /*#__PURE__*/ forwardRef<HTMLSpanElement, SkeletonProps>(function Skeleton(
  { width = '100%', height = 14, circle = false, className, style, ...rest },
  ref,
) {
  return (
    <span
      {...rest}
      ref={ref}
      className={cx('lyra-skeleton', circle && 'lyra-skeleton--circle', className)}
      style={{ width: circle ? height : width, height, ...style }}
      aria-hidden="true"
    />
  );
});
