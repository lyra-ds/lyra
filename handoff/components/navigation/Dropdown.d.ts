/**
 * Menu dropdown de ações.
 */
export type DropdownItem =
  | { id?: string; label: React.ReactNode; icon?: React.ReactNode; danger?: boolean; onSelect?: () => void }
  | { type: "separator" }
  | { type: "label"; label: React.ReactNode };

export interface DropdownProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Elemento que abre o menu (Button, IconButton, Avatar…) */
  trigger: React.ReactNode;
  items: DropdownItem[];
  /** Alinhamento do painel. Padrão "start" */
  align?: "start" | "end";
  /** Começa aberto (útil em demos) */
  defaultOpen?: boolean;
}
export declare function Dropdown(props: DropdownProps): JSX.Element;
