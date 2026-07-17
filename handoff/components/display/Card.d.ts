/**
 * Superfície padrão para agrupar conteúdo.
 * @startingPoint section="Primitives" subtitle="Card com header, body e footer" viewport="700x260"
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Título no header (opcional) */
  title?: React.ReactNode;
  /** Ações alinhadas à direita do header */
  actions?: React.ReactNode;
  /** Conteúdo do footer (separado por borda) */
  footer?: React.ReactNode;
  /** Aplica padding interno. Padrão true */
  padded?: boolean;
  /** Hover com elevação para cards clicáveis */
  interactive?: boolean;
}
export declare function Card(props: CardProps): JSX.Element;
