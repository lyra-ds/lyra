import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';

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
}

/** A standard surface for grouping content. */
export const Card = /*#__PURE__*/ forwardRef<HTMLDivElement, CardProps>(function Card(
  { title, actions, footer, padded = true, interactive = false, className, children, ...rest },
  ref,
) {
  const cls = cx(
    'lyra-card',
    interactive && 'lyra-card--interactive',
    !title && !footer && padded && 'lyra-card--padded',
    className,
  );
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
