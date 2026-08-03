/**
 * Casca de navegação lateral de app. Compõe SidebarGroup por baixo.
 */
export interface AppSidebarGroup {
  heading?: React.ReactNode;
  /** Itens no formato do SidebarGroup: { id, label, icon?, badge?, active?, onSelect? } */
  items: Array<{ id: string; label: React.ReactNode; icon?: React.ReactNode; badge?: React.ReactNode; active?: boolean; onSelect?: () => void }>;
}
export interface AppSidebarProps extends React.HTMLAttributes<HTMLElement> {
  /** Logo/nome no topo */
  brand?: React.ReactNode;
  groups?: AppSidebarGroup[];
  /** Links utilitários e/ou card de usuário, separado por borda superior */
  footer?: React.ReactNode;
  /** Padrão 260 */
  width?: number;
  /** Mostra o botão de recolher para modo rail (64px, só ícones + tooltip) */
  collapsible?: boolean;
  /** Modo rail controlado */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onSelect?: (id: string, item: object) => void;
}
export declare function AppSidebar(props: AppSidebarProps): JSX.Element;
