import { cloneElement, forwardRef, Fragment } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cx } from '../internal/cx';
import { Slot } from '../internal/slot';

/** An item in a {@link Breadcrumb}. */
export interface BreadcrumbItem {
  /** Visible item label. */
  label: ReactNode;
  /** Destination for all but the final item. */
  href?: string;
  /** Native link target, for example `_blank`. */
  target?: string;
  /** Native link relationship. */
  rel?: string;
  /** Router link element for a non-final item. Its content is replaced by `label`. */
  asChild?: ReactElement;
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
              ) : item.asChild ? (
                <Slot>{cloneElement(item.asChild, undefined, item.label)}</Slot>
              ) : item.href !== undefined ? (
                <a href={item.href} target={item.target} rel={item.rel}>
                  {item.label}
                </a>
              ) : (
                <span>{item.label}</span>
              )}
            </Fragment>
          );
        })}
      </nav>
    );
  },
);
