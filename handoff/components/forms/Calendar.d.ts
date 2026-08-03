/**
 * Calendário de mês — data única ou intervalo, navegação por mês/ano
 * (clique no título), min/max, dias desabilitados por função, marcador
 * por dia (ex.: ponto de disponibilidade) e início de semana por locale.
 */
export interface CalendarRange {
  start: Date | null;
  end: Date | null;
}
export interface CalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Modo intervalo — value/onChange usam { start, end }. Padrão false */
  range?: boolean;
  /** Data (Date ou "AAAA-MM-DD") ou intervalo — modo controlado */
  value?: Date | string | CalendarRange | null;
  defaultValue?: Date | string | CalendarRange;
  onChange?: (value: Date | CalendarRange) => void;
  /** Limites de seleção (Date ou "AAAA-MM-DD") */
  min?: Date | string;
  max?: Date | string;
  /** Desabilita dias específicos (ex.: sem horários livres) — recebem foco e são anunciados, não somem */
  isDateDisabled?: (date: Date) => boolean;
  /** Nó extra dentro da célula (ex.: <span className="lyra-cal__dot"/> para dia com disponibilidade) */
  renderDayMarker?: (date: Date) => React.ReactNode;
  /** Primeiro dia da semana: 0=dom … 6=sáb. Padrão 0 */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** "sm" (células 30px, cabe no popover) ou "md" (40px, painel). Padrão "sm" */
  size?: "sm" | "md";
  /** Rodapé com atalho "Hoje". Padrão false */
  todayButton?: boolean;
}
export declare function Calendar(props: CalendarProps): JSX.Element;
