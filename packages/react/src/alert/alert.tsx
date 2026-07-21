import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';

/** Props for {@link Alert}. */
export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Semantic tone. Default `"info"`. */
  tone?: 'info' | 'success' | 'warning' | 'danger';
  /** Optional bold title line. */
  title?: ReactNode;
  /** Optional icon content, normally an `<Icon size={18} />`. */
  icon?: ReactNode;
  /** Alert body content. */
  children: ReactNode;
}

/** An inline contextual message. */
export const Alert = /*#__PURE__*/ forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { tone = 'info', title, icon, className, children, ...rest },
  ref,
) {
  return (
    <div
      {...rest}
      ref={ref}
      className={cx('lyra-alert', `lyra-alert--${tone}`, className)}
      role="status"
    >
      {icon && <span className="lyra-alert__icon">{icon}</span>}
      <div>
        {title && <p className="lyra-alert__title">{title}</p>}
        <p className="lyra-alert__body">{children}</p>
      </div>
    </div>
  );
});
