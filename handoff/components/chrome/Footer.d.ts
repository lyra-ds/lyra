/** A responsive site-footer shell with brand, note, and links slots. */
export interface FooterProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** Optional brand content placed at the start of the footer row. */
  brand?: React.ReactNode;
  /** Optional supporting note placed after the brand. */
  note?: React.ReactNode;
  /** Optional resource links rendered inside the footer navigation landmark. */
  links?: React.ReactNode;
  /** Accessible name for the resource-links navigation landmark. */
  linksLabel?: string;
}
export declare function Footer(props: FooterProps): JSX.Element;
