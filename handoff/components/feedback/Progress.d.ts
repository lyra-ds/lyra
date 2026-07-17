/**
 * Barra de progresso 0–100.
 */
export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Percentual 0–100 */
  value: number;
  /** Cor alternativa do preenchimento */
  tone?: "success" | "danger";
}
export declare function Progress(props: ProgressProps): JSX.Element;
