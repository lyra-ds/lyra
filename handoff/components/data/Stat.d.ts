/**
 * Métrica numérica destacada.
 */
export interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  /** O número grande, ex. "48.210" */
  value: React.ReactNode;
  /** Texto da variação, ex. "12,4% vs. mês anterior" */
  delta?: React.ReactNode;
  /** Colore e escolhe a seta. Padrão "flat" */
  direction?: "up" | "down" | "flat";
}
export declare function Stat(props: StatProps): JSX.Element;
