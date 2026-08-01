import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';

/** Props for {@link PageHeader}. */
export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'title'> {
  /** Optional label displayed above the title. */
  eyebrow?: ReactNode;
  /** Required page heading, rendered in an `<h1>`. */
  title: ReactNode;
  /** Semantic element for the title. Use `"h2"` or `"h3"` when the header names a section; keep `"h1"` for the page title. */
  titleAs?: 'h1' | 'h2' | 'h3';
  /** Optional text that explains the page's purpose. */
  description?: ReactNode;
  /** Optional controls aligned alongside the heading. */
  actions?: ReactNode;
  /** Optional secondary row, such as tabs or filters, rendered below the header row. */
  children?: ReactNode;
}

/** A page-level heading with optional context, actions, and a secondary content row. */
export const PageHeader = /*#__PURE__*/ forwardRef<HTMLElement, PageHeaderProps>(
  function PageHeader(
    {
      eyebrow,
      title,
      titleAs: TitleElement = 'h1',
      description,
      actions,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    return (
      <header {...rest} ref={ref} className={cx('lyra-pageheader', className)}>
        <div className="lyra-pageheader__row">
          <div className="lyra-pageheader__text">
            {eyebrow && <span className="lyra-pageheader__eyebrow">{eyebrow}</span>}
            <TitleElement className="lyra-pageheader__title">{title}</TitleElement>
            {description && <p className="lyra-pageheader__desc">{description}</p>}
          </div>
          {actions && <div className="lyra-pageheader__actions">{actions}</div>}
        </div>
        {children}
      </header>
    );
  },
);
