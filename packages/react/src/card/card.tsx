import { Children, forwardRef, isValidElement } from 'react';
import type { ForwardedRef, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';
import { Slot } from '../internal/slot';

/** Props for {@link Card}. */
export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Optional heading rendered in the card header. */
  title?: ReactNode;
  /** Actions aligned at the end of the card header. */
  actions?: ReactNode;
  /** Content rendered in the bordered footer. */
  footer?: ReactNode;
  /** Apply internal padding. Default `true`. */
  padded?: boolean;
  /** Add hover elevation for clickable cards. */
  interactive?: boolean;
  /**
   * Render the single child element instead of a `<div>`, keeping Lyra card styling — use for
   * fully clickable cards: `<Card asChild interactive><a href>…</a></Card>`. Only supported for
   * the plain surface (no `title`, no `footer`), so the child stays the one rendered element.
   */
  asChild?: boolean;
}

/** A standard surface for grouping content. */
export const Card = /*#__PURE__*/ forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    title,
    actions,
    footer,
    padded = true,
    interactive = false,
    asChild = false,
    className,
    children,
    ...rest
  },
  ref,
) {
  const cls = cx(
    'lyra-card',
    interactive && 'lyra-card--interactive',
    !title && !footer && padded && 'lyra-card--padded',
    className,
  );
  if (asChild) {
    if (title || footer) {
      throw new Error('Card with asChild does not support the title or footer props.');
    }
    const child = Children.only(children);
    if (!isValidElement(child)) {
      throw new Error('Card with asChild expects exactly one React element child.');
    }
    return (
      <Slot {...rest} ref={ref as ForwardedRef<HTMLElement>} className={cls}>
        {child}
      </Slot>
    );
  }
  if (!title && !footer) {
    return (
      <div {...rest} ref={ref} className={cls}>
        {children}
      </div>
    );
  }
  return (
    <div {...rest} ref={ref} className={cls}>
      {title && (
        <div className="lyra-card__header">
          <h3 className="lyra-card__title">{title}</h3>
          {actions && <div className="lyra-card__actions">{actions}</div>}
        </div>
      )}
      <div className={padded ? 'lyra-card__body' : undefined}>{children}</div>
      {footer && <div className="lyra-card__footer">{footer}</div>}
    </div>
  );
});
