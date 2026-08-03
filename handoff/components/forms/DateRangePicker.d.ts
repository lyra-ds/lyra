/**
 * Campo de intervalo de datas — Calendar em modo range.
 * Em telas ≤640px abre em BottomSheet em vez de Popover.
 */
export interface DateRange {
  start: Date | null;
  end: Date | null;
}
export interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  hint?: string;
  /** Mensagem de erro — ativa o estilo de erro e substitui o hint */
  error?: string;
  /** Intervalo — modo controlado */
  value?: DateRange | null;
  defaultValue?: DateRange | { start: Date | string; end: Date | string };
  onChange?: (range: DateRange) => void;
  /** Padrão "Selecionar período" */
  placeholder?: string;
  min?: Date | string;
  max?: Date | string;
  disabled?: boolean;
}
export declare function DateRangePicker(props: DateRangePickerProps): JSX.Element;
