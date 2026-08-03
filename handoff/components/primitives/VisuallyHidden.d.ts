/**
 * Conteúdo visível apenas para leitores de tela.
 */
export interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLElement> {
  /** Elemento a renderizar. Padrão "span" */
  as?: keyof JSX.IntrinsicElements;
  children: React.ReactNode;
}
export declare function VisuallyHidden(props: VisuallyHiddenProps): JSX.Element;
