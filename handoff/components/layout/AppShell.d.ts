/**
 * Casca de app — sidebar + topbar + conteúdo rolável.
 */
export interface AppShellProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Normalmente <AppSidebar> */
  sidebar?: React.ReactNode;
  /** Barra superior (breadcrumb, busca, avatar) */
  topbar?: React.ReactNode;
  /** Padding do conteúdo via --content-gutter. Padrão true */
  padded?: boolean;
  children: React.ReactNode;
}
export declare function AppShell(props: AppShellProps): JSX.Element;
