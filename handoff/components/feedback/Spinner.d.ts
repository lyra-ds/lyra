/**
 * Spinner indeterminado.
 */
export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Padrão "md" (24px) */
  size?: "sm" | "md" | "lg";
}
export declare function Spinner(props: SpinnerProps): JSX.Element;
