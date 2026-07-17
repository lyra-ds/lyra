/**
 * Tabela de dados declarativa.
 */
export interface TableColumn {
  /** Chave do valor em cada row */
  key: string;
  label: React.ReactNode;
  align?: "left" | "center" | "right";
}
export interface TableProps extends React.HTMLAttributes<HTMLDivElement> {
  columns: TableColumn[];
  /** Objetos com valores ReactNode; `id` opcional como key */
  rows: Array<Record<string, React.ReactNode>>;
  /** Realce de linha no hover */
  hover?: boolean;
}
export declare function Table(props: TableProps): JSX.Element;
