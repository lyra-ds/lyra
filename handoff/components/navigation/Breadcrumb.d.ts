/**
 * Trilha de navegação hierárquica.
 */
export interface BreadcrumbItem {
  label: React.ReactNode;
  href?: string;
}
export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  /** O último item é renderizado como página atual */
  items: BreadcrumbItem[];
}
export declare function Breadcrumb(props: BreadcrumbProps): JSX.Element;
