/** A link in a table of contents. */
export interface TableOfContentsItem {
  /** The id of the in-page target heading. */
  id: string;
  /** Visible link text. */
  text: string;
  /** Heading level used to express the item's hierarchy. */
  level: number;
}

/** A labelled, controlled in-page contents navigation rail. */
export interface TableOfContentsProps extends React.HTMLAttributes<HTMLElement> {
  /** In-page anchor links rendered in the contents rail. */
  items: TableOfContentsItem[];
  /** Id of the current in-page position. The component does not derive it from scroll state. */
  activeId?: string;
  /** Visible heading and accessible name for the contents navigation landmark. */
  label: string;
}
export declare function TableOfContents(props: TableOfContentsProps): JSX.Element;
