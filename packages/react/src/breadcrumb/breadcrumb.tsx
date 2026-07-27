import { forwardRef, Fragment } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';

/** An item in a {@link Breadcrumb}. */
export interface BreadcrumbItem {
  /** Visible item label. */
  label: ReactNode;
  /** Destination for all but the final item. */
  href?: string;
}

/** Props for {@link Breadcrumb}. */
export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  /** Accessible name for the navigation landmark. Default: `"Breadcrumb"`. */
  'aria-label'?: string;
  /** Navigation items; the final item is rendered as the current page. */
  items: BreadcrumbItem[];
}

/** A hierarchical navigation trail. Its landmark is named "Breadcrumb" unless you supply a name. */
export const Breadcrumb = /*#__PURE__*/ forwardRef<HTMLElement, BreadcrumbProps>(
  function Breadcrumb({ items, className, 'aria-label': ariaLabel, ...rest }, ref) {
    return (
      <nav
        {...rest}
        ref={ref}
        className={cx('lyra-breadcrumb', className)}
        aria-label={ariaLabel ?? 'Breadcrumb'}
      >
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <Fragment key={index}>
              {index > 0 && <span className="lyra-breadcrumb__sep" aria-hidden="true" />}
              {last ? (
                <span className="lyra-breadcrumb__current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <a href={item.href || '#'}>{item.label}</a>
              )}
            </Fragment>
          );
        })}
      </nav>
    );
  },
);
