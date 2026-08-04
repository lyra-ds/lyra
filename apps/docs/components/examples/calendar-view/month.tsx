import { CalendarView } from '@lyra-ds/react';

export function CalendarViewMonth() {
  return (
    <CalendarView
      defaultView="month"
      defaultDate="2026-08-03"
      events={[
        { id: 'one', start: '2026-08-03T09:00', end: '2026-08-03T10:00', title: 'Planning' },
        {
          id: 'two',
          kind: 'pending',
          start: '2026-08-03T11:00',
          end: '2026-08-03T12:00',
          title: 'Proposal',
        },
        {
          id: 'three',
          kind: 'external',
          start: '2026-08-03T14:00',
          end: '2026-08-03T15:00',
          title: 'Partner call',
        },
        {
          id: 'four',
          kind: 'block',
          start: '2026-08-03T16:00',
          end: '2026-08-03T17:00',
          title: 'Focus time',
        },
      ]}
    />
  );
}
