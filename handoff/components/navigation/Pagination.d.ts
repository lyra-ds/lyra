/**
 * Paginação numérica.
 */
export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  /** Página atual (1-based) */
  page: number;
  /** Total de páginas */
  total: number;
  onChange?: (page: number) => void;
}
export declare function Pagination(props: PaginationProps): JSX.Element;
