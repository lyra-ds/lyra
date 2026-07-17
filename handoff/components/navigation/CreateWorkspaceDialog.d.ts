/**
 * Modal de criação de workspace — nome, slug auto-gerado (editável) e
 * preview do avatar. Use com WorkspaceSwitcher (onCreate).
 */
export interface CreateWorkspaceDialogProps {
  open?: boolean;
  onClose?: () => void;
  /** Recebe { name, slug } ao confirmar */
  onCreate?: (data: { name: string; slug: string }) => void;
  /** Padrão "Criar workspace" */
  title?: string;
  /** Prefixo exibido antes do slug. Padrão "lyra.dev/" */
  slugPrefix?: string;
}
export declare function CreateWorkspaceDialog(props: CreateWorkspaceDialogProps): JSX.Element;
