import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes } from 'react';
import { cx } from '../internal/cx';

type ContainerStyle = CSSProperties & {
  '--container-max'?: string;
};

/** Named container widths, in pixels. */
const containerSizes = { sm: 640, md: 768, lg: 1024, xl: 1280 } as const;

/** A named container width: `sm`, `md`, `lg` or `xl`. */
export type ContainerSize = keyof typeof containerSizes;

function resolveMax(max: number | ContainerSize | (string & {})): string | undefined {
  if (typeof max === 'number') return Number.isFinite(max) ? `${max}px` : undefined;
  if (Object.prototype.hasOwnProperty.call(containerSizes, max)) {
    return `${containerSizes[max as ContainerSize]}px`;
  }
  return /^\d+(\.\d+)?$/.test(max.trim()) ? `${max.trim()}px` : undefined;
}

/** Props for {@link Container}. */
export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Maximum content width: a number of pixels or a size keyword (`sm` 640, `md` 768, `lg` 1024,
   * `xl` 1280). Sets `--container-max`, which cascades to nested containers. Unrecognised values are
   * ignored so the container keeps its inherited maximum.
   */
  max?: number | ContainerSize | (string & {});
}

/** A centered content region with the design system's responsive gutter. */
export const Container = /*#__PURE__*/ forwardRef<HTMLDivElement, ContainerProps>(
  function Container({ max, className, style, children, ...rest }, ref) {
    const resolved = max === undefined ? undefined : resolveMax(max);
    const variableStyle: ContainerStyle | undefined =
      resolved === undefined ? undefined : { '--container-max': resolved };
    const mergedStyle = variableStyle ? { ...variableStyle, ...style } : style;

    return (
      <div {...rest} ref={ref} className={cx('lyra-container', className)} style={mergedStyle}>
        {children}
      </div>
    );
  },
);
