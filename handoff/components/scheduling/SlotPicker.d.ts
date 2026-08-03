/**
 * Escolha de data + horário para páginas públicas de agendamento.
 * Slots em UTC exibidos no fuso do visitante (IANA); seleção em dois
 * passos (slot → Confirmar); skeleton no loading; dia vazio com pulo
 * para o próximo horário livre; contagem visível de reserva temporária.
 * O resumo do que está sendo agendado entra via children (coluna esquerda).
 */
export interface Slot {
  /** Início em UTC ISO, ex. "2026-08-03T13:00:00Z" */
  start: string;
  /** Fim em UTC ISO */
  end: string;
}
export interface SlotPickerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Slots livres em UTC — o componente agrupa por dia no fuso ativo */
  slots?: Slot[];
  /** Dia visível "AAAA-MM-DD" — modo controlado. Padrão: primeiro dia com slots */
  date?: string;
  defaultDate?: string;
  onDateChange?: (isoDate: string) => void;
  /** Fuso IANA do visitante. Padrão: detectado do navegador */
  timezone?: string;
  onTimezoneChange?: (zone: string) => void;
  /** Fuso mostrado como "Detectado" no TimeZonePicker embutido */
  detectedZone?: string;
  /** Chamado no clique em Confirmar — revalide no servidor */
  onConfirm?: (slot: Slot) => void;
  /** Padrão "Confirmar" */
  confirmLabel?: string;
  /** ISO do fim da reserva temporária — liga a contagem visível */
  holdExpiresAt?: string;
  /** "AAAA-MM-DD" — CTA de pulo quando o dia visível está vazio */
  nextAvailableDate?: string;
  /** Skeleton de 6 pills (nunca spinner) */
  loading?: boolean;
  emptyMessage?: string;
  /** Estado sem nenhum slot em nenhum dia */
  fullMessage?: string;
  /** Padrão "pt-BR" */
  locale?: string;
  /** Limites do calendário (ex.: hoje → horizonte de agendamento) */
  min?: Date | string;
  max?: Date | string;
}
export declare function SlotPicker(props: SlotPickerProps): JSX.Element;
