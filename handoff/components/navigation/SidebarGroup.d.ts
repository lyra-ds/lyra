/**
 * Agrupador de itens de menu para sidebar — label de seção em caps,
 * opcionalmente colapsável, com badge de contagem por item.
 */
export interface SidebarGroupItem {
  id: string;
  label: string;
  /** Ícone à esquerda (ex. <Icon name="inbox" size={17}/>) */
  icon?: React.ReactNode;
  /** Contagem/etiqueta à direita (ex. 12, "Novo") */
  badge?: React.ReactNode;
  /** Marca o item como ativo (aria-current="page") */
  active?: boolean;
  onSelect?: () => void;
}
export interface SidebarGroupProps {
  /** Label da seção (ex. "Projetos") */
  label?: string;
  items?: SidebarGroupItem[];
  /** Permite recolher o grupo clicando no label */
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  /** Chamado com (id, item) ao clicar em qualquer item */
  onSelect?: (id: string, item: SidebarGroupItem) => void;
  className?: string;
  /** Conteúdo extra após os itens (ex. botão "Adicionar") */
  children?: React.ReactNode;
}
export declare function SidebarGroup(props: SidebarGroupProps): JSX.Element;
