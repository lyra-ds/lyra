/**
 * Command palette (⌘K) — busca global de comandos em overlay, com grupos,
 * atalhos e navegação por teclado (↑ ↓ ↵ esc).
 */
export interface CommandItem {
  id: string;
  label: string;
  /** Ícone à esquerda (ex. <Icon name="file-plus" size={17}/>) */
  icon?: React.ReactNode;
  /** Texto secundário (também é considerado na busca) */
  hint?: string;
  /** Atalho exibido à direita, teclas separadas por espaço (ex. "⌘ N") */
  shortcut?: string;
  onSelect?: () => void;
}
export interface CommandGroup {
  label?: string;
  items: CommandItem[];
}
export interface CommandPaletteProps {
  /** Controla a exibição do overlay */
  open?: boolean;
  onClose?: () => void;
  /** Quando informado, registra o atalho global ⌘K / Ctrl+K para abrir */
  onOpen?: () => void;
  /** Chamado com o item escolhido (além do onSelect do item) */
  onSelect?: (item: CommandItem) => void;
  groups?: CommandGroup[];
  /** Padrão "Digite um comando ou busque…" */
  placeholder?: string;
  emptyMessage?: string;
  /** Tecla do atalho global (com ⌘/Ctrl). Padrão "k" */
  hotkey?: string;
  /** Renderiza só o painel, sem overlay — útil em demos e docs */
  inline?: boolean;
  className?: string;
}
export declare function CommandPalette(props: CommandPaletteProps): JSX.Element;
