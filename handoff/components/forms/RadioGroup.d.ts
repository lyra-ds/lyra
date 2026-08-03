/**
 * Grupo de radios com label, hint/erro e opções com descrição.
 */
export interface RadioGroupOption {
  value: string;
  label: React.ReactNode;
  /** Descrição menor abaixo do label */
  hint?: React.ReactNode;
  disabled?: boolean;
}
export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  options?: RadioGroupOption[];
  /** Valor controlado */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** name compartilhado dos radios (auto se omitido) */
  name?: string;
  /** Padrão "column" */
  direction?: "column" | "row";
}
export declare function RadioGroup(props: RadioGroupProps): JSX.Element;
