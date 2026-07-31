/**
 * Pilha flex — espaçamento sempre por token da escala --space-N.
 */
export interface StackProps extends React.HTMLAttributes<HTMLElement> {
  /** Padrão "column" */
  direction?: "row" | "column";
  /** Passo da escala de espaço (4 → var(--space-4)) ou string CSS. Padrão 4 */
  gap?: number | string;
  /** align-items */
  align?: React.CSSProperties["alignItems"];
  /** justify-content */
  justify?: React.CSSProperties["justifyContent"];
  /** flex-wrap: wrap */
  wrap?: boolean;
  /** Elemento a renderizar. Padrão "div" */
  as?: keyof JSX.IntrinsicElements;
}
export declare function Stack(props: StackProps): JSX.Element;

/**
 * Linha flex com wrap e itens centralizados (chips, tags, botões).
 */
export interface InlineProps extends StackProps {}
export declare function Inline(props: InlineProps): JSX.Element;
