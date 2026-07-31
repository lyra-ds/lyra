import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Container } from '../container';
import { cx } from '../internal/cx';

/** Props for {@link Navbar}. */
export interface NavbarProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Optional brand content placed at the start of the navigation row. */
  brand?: ReactNode;
  /** Optional primary navigation content rendered inside the navigation landmark. */
  nav?: ReactNode;
  /** Accessible name for the navigation landmark. */
  navLabel?: string;
  /** Optional controls placed at the end of the navigation row. */
  actions?: ReactNode;
  /** Keep the navbar fixed to the top while scrolling. Default `true`. */
  sticky?: boolean;
}

/** A responsive site-header shell with brand, navigation, and actions slots. */
export const Navbar = /*#__PURE__*/ forwardRef<HTMLElement, NavbarProps>(function Navbar(
  { brand, nav, navLabel, actions, sticky, className, ...rest },
  ref,
) {
  return (
    <header
      {...rest}
      ref={ref}
      className={cx('lyra-navbar', sticky === false && 'lyra-navbar--static', className)}
    >
      <Container className="lyra-navbar__inner">
        {brand != null && <div className="lyra-navbar__brand">{brand}</div>}
        {nav != null && (
          <nav className="lyra-navbar__nav" aria-label={navLabel}>
            {nav}
          </nav>
        )}
        {actions != null && <div className="lyra-navbar__actions">{actions}</div>}
      </Container>
    </header>
  );
});
