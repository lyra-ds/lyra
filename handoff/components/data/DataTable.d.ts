/**
 * Tabela de dados completa — ordenação, seleção múltipla, header sticky,
 * densidade, loading e vazio. Pareia com ActionBar e Pagination.
 */
export interface DataTableColumn {
  /** Chave do valor em cada row */
  key: string;
  label: React.ReactNode;
  align?: "left" | "center" | "right";
  /** Habilita ordenação (ciclo asc → desc → sem ordem) */
  sortable?: boolean;
  /** Valor usado na comparação — obrigatório quando a célula é ReactNode */
  sortValue?: (row: Record<string, any>) => string | number | null;
  /** Largura CSS da coluna */
  width?: number | string;
}
export interface DataTableSorting {
  key: string;
  dir: "asc" | "desc";
}
export interface DataTableProps extends React.HTMLAttributes<HTMLDivElement> {
  columns: DataTableColumn[];
  /** Objetos com valores ReactNode; `id` opcional como key/seleção */
  rows: Array<Record<string, React.ReactNode>>;
  /** Ordenação controlada (null = sem ordem) */
  sorting?: DataTableSorting | null;
  defaultSorting?: DataTableSorting | null;
  onSortChange?: (sorting: DataTableSorting | null) => void;
  /** Coluna de checkboxes + selecionar tudo (com indeterminate) */
  selectable?: boolean;
  /** Ids selecionados (modo controlado) */
  selected?: Array<string | number>;
  defaultSelected?: Array<string | number>;
  onSelectionChange?: (selected: Array<string | number>) => void;
  /** Header fixo ao rolar (use com maxHeight) */
  stickyHeader?: boolean;
  /** Altura máxima da área rolável, em px ou CSS */
  maxHeight?: number | string;
  /** Padrão "comfortable" */
  density?: "comfortable" | "compact";
  /** true ou nº de linhas skeleton */
  loading?: boolean | number;
  /** Conteúdo quando rows está vazio (ex. <EmptyState>) */
  empty?: React.ReactNode;
  /** Rodapé: "Mostrando X de Y" + Pagination */
  footer?: React.ReactNode;
  /** Realce de linha no hover (implícito com onRowClick) */
  hover?: boolean;
  onRowClick?: (row: Record<string, React.ReactNode>) => void;
}
export declare function DataTable(props: DataTableProps): JSX.Element;
