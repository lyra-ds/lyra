import { forwardRef, useId } from 'react';
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
  sidebarAs?: 'aside' | 'nav' | 'div';
  /** Accessible name for the sidebar landmark. */
  sidebarLabel?: string;
  /** Optional top region placed before the main content. */
  topbar?: ReactNode;
  /** Page-level banner rendered before the navigation and outside the main landmark. */
  banner?: ReactNode;
  /** Optional keyboard skip link. Its href defaults to the main region's id. */
  skipLink?: { label: string; href?: string };
  /** Id of the main region; generated when a skip link is provided without one. */
  mainId?: string;
  /** Semantic element for the main content. Use `"div"` when the shell is nested or embedded inside a page that already owns the `<main>` landmark. */
  mainAs?: 'main' | 'div';
  /** Optional complementary context rail content. */
  aside?: ReactNode;
  /** Semantic element for the aside rail. Use `"nav"` when it contains navigation. */
  asideAs?: 'aside' | 'nav';
  /** Accessible name for the aside landmark. */
  asideLabel?: string;
  /** Whether the document or the main region is the scroll container. Default: `"page"`. */
  scroll?: 'page' | 'content';
  /**
   * Sidebar rail width in pixels. Sets `--shell-sidebar` for ordinary rails and page-scroll
   * Shells; a direct AppSidebar in a content-scroll rail owns its width instead.
   */
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
    banner,
    skipLink,
    mainId,
    mainAs: MainElement = 'main',
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
  const generatedMainId = useId();
  const resolvedMainId = mainId ?? (skipLink ? `lyra-shell-main-${generatedMainId}` : undefined);
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
        banner != null && 'lyra-shell--has-banner',
        className,
      )}
      style={mergedStyle}
    >
      {skipLink && (
        <a className="lyra-shell__skip-link" href={skipLink.href ?? `#${resolvedMainId}`}>
          {skipLink.label}
        </a>
      )}
      {banner != null && <header className="lyra-shell__banner">{banner}</header>}
      {sidebar != null && (
        <SidebarElement
          className="lyra-shell__sidebar"
          aria-label={SidebarElement === 'div' ? undefined : sidebarLabel}
        >
          {sidebar}
        </SidebarElement>
      )}
      <MainElement
        className="lyra-shell__main"
        id={resolvedMainId}
        tabIndex={skipLink ? -1 : undefined}
      >
        {topbar != null && <div className="lyra-shell__topbar">{topbar}</div>}
        <div className="lyra-shell__content">{children}</div>
      </MainElement>
      {aside != null && (
        <AsideElement className="lyra-shell__aside" aria-label={asideLabel}>
          {aside}
        </AsideElement>
      )}
    </div>
  );
});
