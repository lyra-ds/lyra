/** A navigation link with active-page semantics and optional child composition. */
export interface NavLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Marks the destination as the current page. */
  active?: boolean;
  /** Render the single child element instead of an `<a>`, preserving its routing behavior. */
  asChild?: boolean;
  /** Link content. Must be exactly one element when `asChild` is enabled. */
  children?: React.ReactNode;
}
export declare function NavLink(props: NavLinkProps): JSX.Element;
