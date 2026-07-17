/**
 * Seletor de workspace/tenant para a sidebar ou topbar — popover com lista
 * de workspaces (avatar, plano, membros) e ação "Criar workspace".
 */
export interface Workspace {
  id: string;
  name: string;
  /** Ex. "Pro", "Free" — aparece sob o nome */
  plan?: string;
  /** Quantidade de membros — vira "N membros" no popover */
  members?: number;
}
export interface WorkspaceSwitcherProps {
  workspaces?: Workspace[];
  /** id do workspace atual (padrão: o primeiro) */
  current?: string;
  onChange?: (id: string, workspace: Workspace) => void;
  /** Se presente, mostra a ação "Criar workspace" no rodapé do popover */
  onCreate?: () => void;
  /** Padrão "Criar workspace" */
  createLabel?: string;
  /** Começa aberto (útil em demos) */
  defaultOpen?: boolean;
  className?: string;
}
export declare function WorkspaceSwitcher(props: WorkspaceSwitcherProps): JSX.Element;
