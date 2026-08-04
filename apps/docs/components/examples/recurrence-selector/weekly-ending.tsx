import { RecurrenceSelector } from '@lyra-ds/react';

export function RecurrenceSelectorWeeklyEnding() {
  return (
    <div className="lw-example-scroll">
      <RecurrenceSelector
        startDate="2026-08-03"
        defaultValue={{
          freq: 'weekly',
          interval: 2,
          byWeekday: [1, 3],
          end: { type: 'count', count: 6 },
        }}
        defaultEndCount={6}
        conflicts={[{ date: '2026-08-17', reason: 'Holiday' }]}
      />
    </div>
  );
}
