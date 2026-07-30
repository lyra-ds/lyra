import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes } from 'react';
import { cx } from '../internal/cx';

type ContainerStyle = CSSProperties & {
  '--container-max'?: string;
};

/** Props for {@link Container}. */
export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Maximum content width in pixels. Sets `--container-max`, which cascades to nested containers.
   */
  max?: number;
}

/** A centered content region with the design system's responsive gutter. */
export const Container = /*#__PURE__*/ forwardRef<HTMLDivElement, ContainerProps>(
  function Container({ max, className, style, children, ...rest }, ref) {
    const variableStyle: ContainerStyle | undefined =
      max === undefined ? undefined : { '--container-max': `${max}px` };
    const mergedStyle = variableStyle ? { ...variableStyle, ...style } : style;

    return (
      <div {...rest} ref={ref} className={cx('lyra-container', className)} style={mergedStyle}>
        {children}
      </div>
    );
  },
);
