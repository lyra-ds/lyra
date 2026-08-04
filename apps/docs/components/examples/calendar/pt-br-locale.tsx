import { Calendar } from '@lyra-ds/react';

export function CalendarPtBrLocale() {
  return (
    <Calendar
      defaultValue="2026-08-04"
      locale="pt-BR"
      labels={{
        previousMonth: 'Mês anterior',
        nextMonth: 'Próximo mês',
        previousYear: 'Ano anterior',
        nextYear: 'Próximo ano',
        previousYears: 'Anos anteriores',
        nextYears: 'Próximos anos',
        changeView: 'Alterar mês ou ano',
      }}
    />
  );
}
