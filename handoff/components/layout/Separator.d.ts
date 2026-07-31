/**
 * Divisor de conteúdo.
 */
export interface SeparatorProps extends React.HTMLAttributes<HTMLElement> {
  /** Padrão "horizontal" */
  orientation?: "horizontal" | "vertical";
  /** Texto central (ex. "ou") — sempre horizontal */
  label?: React.ReactNode;
}
export declare function Separator(props: SeparatorProps): JSX.Element;
