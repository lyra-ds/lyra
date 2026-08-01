import { Children, forwardRef, isValidElement } from 'react';
import type { AnchorHTMLAttributes, ForwardedRef, ReactNode } from 'react';
import { cx } from '../internal/cx';
import { Slot } from '../internal/slot';

/** Props for {@link NavLink}. */
export interface NavLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Marks the destination as the current page. */
  active?: boolean;
  /** Render the single child element instead of an `<a>`, preserving its routing behavior. */
  asChild?: boolean;
  /** Link content. Must be exactly one element when `asChild` is enabled. */
  children?: ReactNode;
}

/** A navigation link with active-page semantics and optional child composition. */
export const NavLink = /*#__PURE__*/ forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(
  { active = false, asChild = false, className, children, ...rest },
  ref,
) {
  const props = {
    ...rest,
    'aria-current': active ? ('page' as const) : undefined,
  };
  const classes = cx('lyra-navlink', active && 'lyra-navlink--active', className);

  if (asChild) {
    const child = Children.only(children);
    if (!isValidElement(child)) {
      throw new Error('NavLink with asChild expects exactly one React element child.');
    }

    return (
      <Slot {...props} ref={ref as ForwardedRef<HTMLElement>} className={classes}>
        {child}
      </Slot>
    );
  }

  return (
    <a {...props} ref={ref} className={classes}>
      {children}
    </a>
  );
});
