/**
 * Agenda dia/semana/mês — grade de horas com janelas de disponibilidade
 * (fundo claro dentro, escuro fora), linha "agora", chips tipados por
 * forma+cor (sólido, tracejado, hachura, contorno — nunca só cor) e
 * popover de resumo antes de qualquer ação.
 */
export type CalendarViewKind = "session" | "program-session" | "pending" | "block" | "external";
export interface CalendarViewEvent {
  id: string | number;
  /** Padrão "session". pending = tracejado; block = hachura; external = contorno */
  kind?: CalendarViewKind;
  /** ISO local ou Date */
  start: string | Date;
  end: string | Date;
  title: string;
  /** Dados extras ficam disponíveis no popover/callbacks */
  [key: string]: unknown;
}
export interface CalendarViewProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Modo controlado. Padrão interno "week" */
  view?: "day" | "week" | "month";
  defaultView?: "day" | "week" | "month";
  onViewChange?: (view: "day" | "week" | "month") => void;
  /** Âncora do período "AAAA-MM-DD" — modo controlado */
  date?: string | Date;
  defaultDate?: string | Date;
  onDateChange?: (isoDate: string) => void;
  events?: CalendarViewEvent[];
  /** Janelas semanais { 0(dom)–6: [{ start, end }] } — pinta dentro/fora */
  availability?: Record<number, { start: string; end: string }[]>;
  /** Faixa de horas da grade. Padrão 7–21 */
  startHour?: number;
  endHour?: number;
  /** Padrão 1 (segunda) */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Clique num chip (além do popover embutido) */
  onEventOpen?: (event: CalendarViewEvent) => void;
  /** Conteúdo do popover de resumo; close() fecha */
  renderEventPopover?: (event: CalendarViewEvent, close: () => void) => React.ReactNode;
  /** Clique em área vazia da grade (snap em slotStep) */
  onSlotCreate?: (start: Date) => void;
  /** Minutos do snap. Padrão 30 */
  slotStep?: number;
  /** Nó extra à direita da toolbar (ex.: botão "Nova sessão") */
  toolbarActions?: React.ReactNode;
  /** Padrão "pt-BR" */
  locale?: string;
}
export declare function CalendarView(props: CalendarViewProps): JSX.Element;
