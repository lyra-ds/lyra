/**
 * Editor de janelas semanais de disponibilidade — toggle por dia,
 * pares início–fim (TimeInput), múltiplos intervalos por dia,
 * "Copiar para…" (o atalho que faz o setup levar minutos) e exceções
 * por data. Genérico: agenda de atendimento, horário de funcionamento,
 * escala de plantão. Horários no fuso do dono da agenda.
 */
export interface TimeRange {
  /** "HH:mm" */
  start: string;
  end: string;
}
/** Chaves 0(dom)–6(sáb); dia sem janelas = indisponível */
export type WeeklySchedule = Record<number, TimeRange[]>;
export interface DateException {
  /** "AAAA-MM-DD" — sobrescreve o dia da semana */
  date: string;
  /** Vazio = indisponível o dia todo */
  ranges: TimeRange[];
}
export interface WeeklyScheduleEditorProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Modo controlado */
  value?: WeeklySchedule;
  defaultValue?: WeeklySchedule;
  onChange?: (value: WeeklySchedule) => void;
  exceptions?: DateException[];
  onExceptionsChange?: (exceptions: DateException[]) => void;
  /** Intervalo criado ao ligar um dia. Padrão 09:00–17:00 */
  defaultRange?: TimeRange;
  /** Primeiro dia exibido: 0=dom … 6=sáb. Padrão 1 (segunda) */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Seção de exceções por data. Padrão true */
  showExceptions?: boolean;
}
export declare function WeeklyScheduleEditor(props: WeeklyScheduleEditorProps): JSX.Element;
