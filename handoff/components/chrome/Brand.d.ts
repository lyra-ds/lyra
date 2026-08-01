/** A product mark with an optional wordmark and CSS-only light/dark image swap. */
type BrandBaseProps = Omit<React.HTMLAttributes<HTMLElement>, 'children' | 'aria-label'> & {
  /** Image source used for the light theme mark. */
  mark: string;
  /** Optional image source used for the dark theme mark. */
  markDark?: string;
  /** Mark edge length in pixels. Sets `--brand-mark-size`. */
  size?: number;
};
type BrandWithWordmarkProps = {
  /** Wordmark content that gives the brand its accessible name. */
  children: React.ReactNode;
  /** Optional translated accessible name that overrides the wordmark text. */
  'aria-label'?: string;
};
type BrandMarkOnlyProps = {
  /** Omit the wordmark to render a mark-only brand. */
  children?: undefined;
  /** Translated accessible name required when no wordmark is rendered. */
  'aria-label': string;
};
type BrandStandardElementProps = {
  /** Destination rendered as an anchor. Mutually exclusive with `asChild`. */
  href?: string;
  /** Render the native anchor or span. */
  asChild?: false;
};
type BrandSlottedElementProps = {
  /** Destination is provided by the child element when `asChild` is enabled. */
  href?: never;
  /** Render the single child element with the brand's props and classes merged. */
  asChild: true;
  /** A child link or framework routing element containing the wordmark. */
  children: React.ReactElement;
};
/** Props for {@link Brand}. */
export type BrandProps = BrandBaseProps &
  (BrandWithWordmarkProps | BrandMarkOnlyProps) &
  (BrandStandardElementProps | BrandSlottedElementProps);
export declare function Brand(props: BrandProps): JSX.Element;
