import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Container } from '../container';
import { cx } from '../internal/cx';

/** Props for {@link Footer}. */
export interface FooterProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Optional brand content placed at the start of the footer row. */
  brand?: ReactNode;
  /** Optional supporting note placed after the brand. */
  note?: ReactNode;
  /** Optional resource links rendered inside the footer navigation landmark. */
  links?: ReactNode;
  /** Accessible name for the resource-links navigation landmark. */
  linksLabel?: string;
}

/** A responsive site-footer shell with brand, note, and links slots. */
export const Footer = /*#__PURE__*/ forwardRef<HTMLElement, FooterProps>(function Footer(
  { brand, note, links, linksLabel, className, ...rest },
  ref,
) {
  return (
    <footer {...rest} ref={ref} className={cx('lyra-footer', className)}>
      <Container className="lyra-footer__inner">
        {brand != null && <div className="lyra-footer__brand">{brand}</div>}
        {note != null && <div className="lyra-footer__note">{note}</div>}
        {links != null && (
          <nav className="lyra-footer__links" aria-label={linksLabel}>
            {links}
          </nav>
        )}
      </Container>
    </footer>
  );
});
