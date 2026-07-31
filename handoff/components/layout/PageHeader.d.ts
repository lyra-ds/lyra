/**
 * Cabeçalho de página com título, descrição e ações.
 */
export interface PageHeaderProps extends React.HTMLAttributes<HTMLElement> {
  /** Rótulo em caps acima do título */
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Botões alinhados à direita */
  actions?: React.ReactNode;
  /** Linha extra abaixo (Tabs, filtros) */
  children?: React.ReactNode;
}
export declare function PageHeader(props: PageHeaderProps): JSX.Element;
