import { Children, cloneElement, forwardRef, isValidElement } from 'react';
import type { CSSProperties, ForwardedRef, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cx } from '../internal/cx';
import { Slot } from '../internal/slot';

type BrandStyle = CSSProperties & {
  '--brand-mark-size'?: string;
};

type BrandBaseProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'aria-label'> & {
  /**
   * Image source used for the light theme mark. When omitted, the mark falls back to the initial
   * of the wordmark text (or of `aria-label` for a mark-only brand).
   */
  mark?: string;
  /** Optional image source used for the dark theme mark. */
  markDark?: string;
  /** Mark edge length in pixels. Sets `--brand-mark-size`. */
  size?: number;
};

type BrandWithWordmarkProps = {
  /** Wordmark content that gives the brand its accessible name. */
  children: ReactNode;
  /** Optional translated accessible name that overrides the wordmark text. */
  'aria-label'?: string;
};

type BrandMarkOnlyProps = {
  /** Omit the wordmark to render a mark-only brand. */
  children?: undefined;
  /** Translated accessible name required when no wordmark is rendered. */
  'aria-label': string;
};

type BrandStandardElementProps = {
  /** Destination rendered as an anchor. Mutually exclusive with `asChild`. */
  href?: string;
  /** Render the native anchor or span. */
  asChild?: false;
};

type BrandSlottedElementProps = {
  /** Destination is provided by the child element when `asChild` is enabled. */
  href?: never;
  /** Render the single child element with the brand's props and classes merged. */
  asChild: true;
  /** A child link or framework routing element containing the wordmark. */
  children: ReactElement;
};

/** Props for {@link Brand}. */
export type BrandProps = BrandBaseProps &
  (BrandWithWordmarkProps | BrandMarkOnlyProps) &
  (BrandStandardElementProps | BrandSlottedElementProps);

function brandInitial(wordmark: ReactNode, accessibleName: string | undefined): string {
  const source = typeof wordmark === 'string' ? wordmark : accessibleName;
  return source == null ? '' : (Array.from(source.trim())[0] ?? '').toUpperCase();
}

function brandContents(
  mark: string | undefined,
  markDark: string | undefined,
  wordmark: ReactNode,
  accessibleName: string | undefined,
): ReactNode {
  const initial = mark == null ? brandInitial(wordmark, accessibleName) : '';
  return (
    <>
      {mark == null ? (
        initial !== '' && (
          <span className="lyra-brand__mark lyra-brand__mark--initial" aria-hidden="true">
            {initial}
          </span>
        )
      ) : markDark == null ? (
        <img className="lyra-brand__mark" src={mark} alt="" />
      ) : (
        <>
          <img className="lyra-brand__mark lyra-brand__mark--light" src={mark} alt="" />
          <img className="lyra-brand__mark lyra-brand__mark--dark" src={markDark} alt="" />
        </>
      )}
      {wordmark != null && <span className="lyra-brand__word">{wordmark}</span>}
    </>
  );
}

/** A product mark with an optional wordmark and CSS-only light/dark image swap. */
export const Brand = /*#__PURE__*/ forwardRef<HTMLElement, BrandProps>(function Brand(
  {
    mark,
    markDark,
    size,
    href,
    asChild = false,
    className,
    style,
    children,
    'aria-label': accessibleName,
    ...rest
  },
  ref,
) {
  const variableStyle: BrandStyle | undefined =
    size === undefined ? undefined : { '--brand-mark-size': `${size}px` };
  const mergedStyle = variableStyle ? { ...variableStyle, ...style } : style;
  const classes = cx('lyra-brand', className);

  if (asChild) {
    const child = Children.only(children);
    if (!isValidElement(child)) {
      throw new Error('Brand with asChild expects exactly one React element child.');
    }

    const childProps = child.props as { children?: ReactNode };
    return (
      <Slot
        {...rest}
        ref={ref as ForwardedRef<HTMLElement>}
        className={classes}
        style={mergedStyle}
        aria-label={accessibleName}
      >
        {cloneElement(
          child,
          undefined,
          brandContents(mark, markDark, childProps.children, accessibleName),
        )}
      </Slot>
    );
  }

  const contents = brandContents(mark, markDark, children, accessibleName);
  if (href != null) {
    return (
      <a
        {...rest}
        ref={ref as ForwardedRef<HTMLAnchorElement>}
        className={classes}
        style={mergedStyle}
        href={href}
        aria-label={accessibleName}
      >
        {contents}
      </a>
    );
  }

  return (
    <span
      {...rest}
      ref={ref as ForwardedRef<HTMLSpanElement>}
      className={classes}
      style={mergedStyle}
      role={children == null ? 'img' : undefined}
      aria-label={accessibleName}
    >
      {contents}
    </span>
  );
});
