/** A three-rail page or application frame with optional navigation, topbar, and context slots. */
export interface ShellProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional navigation or complementary rail content. */
  sidebar?: React.ReactNode;
  /** Semantic element for the sidebar rail. Use `"nav"` when it contains primary navigation. */
  sidebarAs?: 'aside' | 'nav';
  /** Accessible name for the sidebar landmark. */
  sidebarLabel?: string;
  /** Optional top region placed before the main content. */
  topbar?: React.ReactNode;
  /** Optional complementary context rail content. */
  aside?: React.ReactNode;
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
export declare function Shell(props: ShellProps): JSX.Element;
