/**
 * Entrada de horário "HH:mm" com digitação mascarada + stepper (▲▼).
 * Aceita "9", "09", "0930", "9:5" e normaliza no blur/Enter; nunca limpa
 * o valor digitado ao errar a máscara. ↑/↓ = ±step, Shift+↑/↓ = ±1h.
 * Preferir ao TimePicker em pares início–fim (comparação visual).
 */
export interface TimeInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "size" | "min" | "max" | "step"> {
  label?: string;
  hint?: string;
  /** Mensagem de erro — ativa o estilo de erro e substitui o hint */
  error?: string;
  /** Hora "HH:mm" (24h) ou null — modo controlado */
  value?: string | null;
  defaultValue?: string;
  onChange?: (time: string | null) => void;
  /** Passo do stepper e das setas, em minutos. Padrão 15 */
  step?: number;
  /** Limites "HH:mm" — valores fora são grampeados */
  min?: string;
  max?: string;
  /** Padrão "md" */
  size?: "sm" | "md" | "lg";
  /** Liga aria-invalid + borda de erro sem mensagem (ex.: fim ≤ início) */
  invalid?: boolean;
  disabled?: boolean;
}
export declare function TimeInput(props: TimeInputProps): JSX.Element;
