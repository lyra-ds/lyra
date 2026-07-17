/**
 * Stepper de fluxo multi-etapa.
 */
export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Labels das etapas, em ordem */
  steps: React.ReactNode[];
  /** Índice 0-based da etapa atual */
  active: number;
}
export declare function Stepper(props: StepperProps): JSX.Element;
