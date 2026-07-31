import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';

type ShellStyle = CSSProperties & {
  '--shell-sidebar'?: string;
  '--shell-aside'?: string;
  '--shell-top'?: string;
};

/** Props for {@link Shell}. */
export interface ShellProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional navigation or complementary rail content. */
  sidebar?: ReactNode;
  /** Semantic element for the sidebar rail. Use `"nav"` when it contains primary navigation. */
  sidebarAs?: 'aside' | 'nav';
  /** Accessible name for the sidebar landmark. */
  sidebarLabel?: string;
  /** Optional top region placed before the main content. */
  topbar?: ReactNode;
  /** Optional complementary context rail content. */
  aside?: ReactNode;
  /** Semantic element for the aside rail. Use `"nav"` when it contains navigation. */
  asideAs?: 'aside' | 'nav';
  /** Accessible name for the aside landmark. */
  asideLabel?: string;
  /** Whether the document or the main region is the scroll container. Default: `"page"`. */
  scroll?: 'page' | 'content';
  /** Sidebar rail width in pixels. Sets `--shell-sidebar`. */
  sidebarWidth?: number;
  /** Complementary aside rail width in pixels. Sets `--shell-aside`. */
  asideWidth?: number;
  /** Sticky rail offset in pixels. Sets `--shell-top`. */
  top?: number;
}

/** A three-rail page or application frame with optional navigation, topbar, and context slots. */
export const Shell = /*#__PURE__*/ forwardRef<HTMLDivElement, ShellProps>(function Shell(
  {
    sidebar,
    sidebarAs: SidebarElement = 'aside',
    sidebarLabel,
    topbar,
    aside,
    asideAs: AsideElement = 'aside',
    asideLabel,
    scroll = 'page',
    sidebarWidth,
    asideWidth,
    top,
    className,
    style,
    children,
    ...rest
  },
  ref,
) {
  const variableStyle: ShellStyle = {};

  if (sidebarWidth !== undefined) variableStyle['--shell-sidebar'] = `${sidebarWidth}px`;
  if (asideWidth !== undefined) variableStyle['--shell-aside'] = `${asideWidth}px`;
  if (top !== undefined) variableStyle['--shell-top'] = `${top}px`;

  const mergedStyle =
    Object.keys(variableStyle).length > 0 ? { ...variableStyle, ...style } : style;

  return (
    <div
      {...rest}
      ref={ref}
      className={cx(
        'lyra-shell',
        `lyra-shell--${scroll}`,
        sidebar != null && 'lyra-shell--has-sidebar',
        aside != null && 'lyra-shell--has-aside',
        className,
      )}
      style={mergedStyle}
    >
      {sidebar != null && (
        <SidebarElement className="lyra-shell__sidebar" aria-label={sidebarLabel}>
          {sidebar}
        </SidebarElement>
      )}
      <main className="lyra-shell__main">
        {topbar != null && <div className="lyra-shell__topbar">{topbar}</div>}
        <div className="lyra-shell__content">{children}</div>
      </main>
      {aside != null && (
        <AsideElement className="lyra-shell__aside" aria-label={asideLabel}>
          {aside}
        </AsideElement>
      )}
    </div>
  );
});
