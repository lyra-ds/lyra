/**
 * Seletor de recorrência — presets primeiro, editor personalizado
 * (frequência, dias da semana, término Nunca/Após N/Em data) e resumo
 * em linguagem natural sempre visível, anunciado por aria-live.
 */
export interface RecurrenceEnd {
  type: "never" | "count" | "date";
  count?: number;
  date?: Date | string | null;
}
export interface RecurrenceRule {
  freq: "none" | "weekly" | "monthly";
  /** A cada N semanas/meses. Padrão 1 */
  interval?: number;
  /** 0(dom)–6(sáb) — só para freq semanal */
  byWeekday?: number[];
  end?: RecurrenceEnd;
}
export interface RecurrenceConflict {
  date: string;
  reason?: string;
}
export interface RecurrenceSelectorProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Modo controlado. { freq: "none" } = não se repete */
  value?: RecurrenceRule | null;
  defaultValue?: RecurrenceRule;
  onChange?: (rule: RecurrenceRule) => void;
  /** Base dos presets ("Toda semana (qua)"). Padrão hoje */
  startDate?: Date | string;
  /** Pré-preenche o término "Após N vezes" (ex.: nº de sessões de um pacote) */
  defaultEndCount?: number;
  /** Ocorrências em horários indisponíveis — avisa, não bloqueia */
  conflicts?: RecurrenceConflict[];
}
export declare function RecurrenceSelector(props: RecurrenceSelectorProps): JSX.Element;
/** Frase da regra em linguagem natural (a mesma do resumo interno) */
export declare function describeRecurrence(rule: RecurrenceRule | null, startDate: Date | string): string;
