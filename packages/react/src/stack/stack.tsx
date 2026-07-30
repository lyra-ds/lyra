import { createElement, forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes } from 'react';
import { cx } from '../internal/cx';

type StackStyle = CSSProperties & {
  '--lyra-stack-align'?: CSSProperties['alignItems'];
  '--lyra-stack-direction'?: CSSProperties['flexDirection'];
  '--lyra-stack-gap'?: string;
  '--lyra-stack-justify'?: CSSProperties['justifyContent'];
  '--lyra-stack-wrap'?: CSSProperties['flexWrap'];
};

/** Props for {@link Stack}. */
export interface StackProps extends HTMLAttributes<HTMLElement> {
  /** Flex direction. Effective default: `"column"` from the stylesheet. */
  direction?: 'row' | 'column';
  /** Spacing-scale step or a CSS gap value. Effective default: `4` from the stylesheet. */
  gap?: number | string;
  /** Cross-axis alignment. Effective default: `"stretch"` from the stylesheet. */
  align?: CSSProperties['alignItems'];
  /** Main-axis distribution. Effective default: `"flex-start"` from the stylesheet. */
  justify?: CSSProperties['justifyContent'];
  /** Allow items to wrap onto additional lines. Default: `false`. */
  wrap?: boolean;
  /** Element to render. Default: `"div"`. */
  as?: keyof React.JSX.IntrinsicElements;
}

/** A flexible vertical or horizontal layout with tokenized spacing. */
export const Stack = /*#__PURE__*/ forwardRef<HTMLElement, StackProps>(function Stack(
  { direction, gap, align, justify, wrap = false, as, className, style, children, ...rest },
  ref,
) {
  const Tag: string = as ?? 'div';
  const variableStyle: StackStyle = {};

  if (direction !== undefined) variableStyle['--lyra-stack-direction'] = direction;
  if (gap !== undefined)
    variableStyle['--lyra-stack-gap'] = typeof gap === 'number' ? `var(--space-${gap})` : gap;
  if (align !== undefined) variableStyle['--lyra-stack-align'] = align;
  if (justify !== undefined) variableStyle['--lyra-stack-justify'] = justify;
  if (wrap) variableStyle['--lyra-stack-wrap'] = 'wrap';

  const mergedStyle =
    Object.keys(variableStyle).length > 0 ? { ...variableStyle, ...style } : style;

  return createElement(
    Tag,
    { ...rest, ref, className: cx('lyra-stack', className), style: mergedStyle },
    children,
  );
});

/** Props for {@link Inline}. */
export interface InlineProps extends Omit<StackProps, 'align' | 'direction' | 'gap' | 'wrap'> {
  /** Cross-axis alignment. Default: `"center"`. */
  align?: CSSProperties['alignItems'];
  /** Spacing-scale step or a CSS gap value. Default: `2`. */
  gap?: number | string;
}

/** A wrapping horizontal {@link Stack}, suited to compact groups of peer controls. */
export const Inline = /*#__PURE__*/ forwardRef<HTMLElement, InlineProps>(function Inline(
  { align = 'center', gap = 2, ...rest },
  ref,
) {
  return <Stack {...rest} ref={ref} direction="row" gap={gap} align={align} wrap />;
});
