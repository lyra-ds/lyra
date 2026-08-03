/**
 * Campo de data — trigger no estilo Input + Popover com Calendar.
 */
export interface DatePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  hint?: string;
  /** Mensagem de erro — ativa o estilo de erro e substitui o hint */
  error?: string;
  /** Data (Date ou "AAAA-MM-DD") — modo controlado */
  value?: Date | string | null;
  defaultValue?: Date | string;
  onChange?: (date: Date) => void;
  /** Padrão "Selecionar data" */
  placeholder?: string;
  min?: Date | string;
  max?: Date | string;
  disabled?: boolean;
}
export declare function DatePicker(props: DatePickerProps): JSX.Element;
