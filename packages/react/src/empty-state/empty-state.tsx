import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';

/** Props for {@link EmptyState}. */
export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Optional illustrative icon content, normally an `<Icon size={24} />`. */
  icon?: ReactNode;
  /** Required empty-state heading. */
  title: ReactNode;
  /** Optional explanatory text. */
  description?: ReactNode;
  /** Optional action, normally a `<Button>`. */
  action?: ReactNode;
}

/** An inviting empty state with icon, text, and optional action. */
export const EmptyState = /*#__PURE__*/ forwardRef<HTMLDivElement, EmptyStateProps>(
  function EmptyState({ icon, title, description, action, className, ...rest }, ref) {
    return (
      <div {...rest} ref={ref} className={cx('lyra-empty', className)}>
        {icon && <div className="lyra-empty__icon">{icon}</div>}
        <h3 className="lyra-empty__title">{title}</h3>
        {description && <p className="lyra-empty__desc">{description}</p>}
        {action && <div className="lyra-empty__action">{action}</div>}
      </div>
    );
  },
);
