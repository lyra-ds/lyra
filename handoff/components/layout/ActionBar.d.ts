/**
 * Barra flutuante de ações em massa (bottom-center).
 */
export interface ActionBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Some quando false. Padrão true */
  open?: boolean;
  /** Nº de itens selecionados — 0 esconde a barra */
  count?: number;
  /** Texto após o número. Padrão "selecionados" */
  label?: React.ReactNode;
  /** Botões de ação (ex. <Button size="sm">) */
  actions?: React.ReactNode;
  /** Mostra o × de limpar seleção */
  onClear?: () => void;
}
export declare function ActionBar(props: ActionBarProps): JSX.Element | null;
