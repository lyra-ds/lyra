/**
 * Grupo de checkboxes — valor é array de strings.
 */
export interface CheckboxGroupOption {
  value: string;
  label: React.ReactNode;
  /** Descrição menor abaixo do label */
  hint?: React.ReactNode;
  disabled?: boolean;
}
export interface CheckboxGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  options?: CheckboxGroupOption[];
  /** Valores marcados (modo controlado) */
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  /** Padrão "column" */
  direction?: "column" | "row";
}
export declare function CheckboxGroup(props: CheckboxGroupProps): JSX.Element;
