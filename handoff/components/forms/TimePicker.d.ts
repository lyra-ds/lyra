/**
 * Campo de hora — trigger no estilo Input + lista rolável de horários.
 * Valor é string "HH:mm" (24h).
 */
export interface TimePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  hint?: string;
  /** Mensagem de erro — ativa o estilo de erro e substitui o hint */
  error?: string;
  /** Hora "HH:mm" — modo controlado */
  value?: string | null;
  defaultValue?: string;
  onChange?: (time: string) => void;
  /** Padrão "Selecionar hora" */
  placeholder?: string;
  /** Intervalo entre opções, em minutos. Padrão 30 */
  step?: number;
  /** Limites "HH:mm". Padrão "00:00"–"23:59" */
  min?: string;
  max?: string;
  disabled?: boolean;
}
export declare function TimePicker(props: TimePickerProps): JSX.Element;
