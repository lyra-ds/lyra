/** A responsive site-header shell with brand, navigation, and actions slots. */
export interface NavbarProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** Optional brand content placed at the start of the navigation row. */
  brand?: React.ReactNode;
  /** Optional primary navigation content rendered inside the navigation landmark. */
  nav?: React.ReactNode;
  /** Accessible name for the navigation landmark. */
  navLabel?: string;
  /** Optional controls placed at the end of the navigation row. */
  actions?: React.ReactNode;
  /** Keep the navbar fixed to the top while scrolling. Default `true`. */
  sticky?: boolean;
}
export declare function Navbar(props: NavbarProps): JSX.Element;
