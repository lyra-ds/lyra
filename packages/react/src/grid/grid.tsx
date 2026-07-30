import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes } from 'react';
import { cx } from '../internal/cx';

type GridStyle = CSSProperties & {
  '--lyra-grid-columns'?: string;
  '--lyra-grid-gap'?: string;
};

/** Props for {@link Grid}. */
export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of equal columns or an arbitrary CSS grid template. Effective default: `2` from the stylesheet. */
  columns?: number | string;
  /** Minimum item width in pixels for a responsive auto-fit grid. Takes precedence over `columns`. */
  minItem?: number;
  /** Spacing-scale step or a CSS gap value. Effective default: `4` from the stylesheet. */
  gap?: number | string;
}

/** A grid with fixed columns or responsive auto-fit items. */
export const Grid = /*#__PURE__*/ forwardRef<HTMLDivElement, GridProps>(function Grid(
  { columns, minItem, gap, className, style, children, ...rest },
  ref,
) {
  const variableStyle: GridStyle = {};

  if (minItem !== undefined) {
    variableStyle['--lyra-grid-columns'] = `repeat(auto-fit, minmax(min(${minItem}px, 100%), 1fr))`;
  } else if (columns !== undefined) {
    variableStyle['--lyra-grid-columns'] =
      typeof columns === 'number' ? `repeat(${columns}, minmax(0, 1fr))` : columns;
  }
  if (gap !== undefined)
    variableStyle['--lyra-grid-gap'] = typeof gap === 'number' ? `var(--space-${gap})` : gap;

  const mergedStyle =
    Object.keys(variableStyle).length > 0 ? { ...variableStyle, ...style } : style;

  return (
    <div {...rest} ref={ref} className={cx('lyra-grid', className)} style={mergedStyle}>
      {children}
    </div>
  );
});
